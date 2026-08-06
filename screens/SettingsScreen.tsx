import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSettingsStore } from '../stores/settingsStore';
import { useAppStore } from '../stores/appStore';
import { useAgentStore } from '../stores/agentStore';
import { RootStackParamList } from '../types';
import { colors, typography, borderRadius, spacing } from '../theme';
import { scanLan, quickScanLocalhost, probeHostForAllPorts, hostFromUrl, dedupePeers, DiscoveredPeer, ScanProgress } from '../services/NetworkDiscovery';
import { kernelClient } from '../services/KernelApiClient';
import Svg, { Path } from 'react-native-svg';

type NavProp = NativeStackNavigationProp<RootStackParamList>;

// Mini SVG back arrow
const ArrowBack = () => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <Path d="M15 19l-7-7 7-7" stroke="#8b949e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

// ── Color helpers ──
function statusColor(mode: string, connected: boolean): string {
  if (mode === 'proxy') return connected ? colors.success : colors.textMuted;
  return connected ? colors.success : colors.danger;
}

function statusLabel(mode: string, connected: boolean): string {
  if (mode === 'proxy') return connected ? '● Proxy Active' : '○ Disconnected';
  return connected ? '● Direct (local)' : '○ Disconnected';
}

export default function SettingsScreen() {
  const navigation = useNavigation<NavProp>();
  const {
    mode, serverUrl, proxyUrl, authToken, user,
    setMode, setServerUrl, setProxyUrl, setAuthToken, setUser,
    login, logout,
  } = useSettingsStore();
  const { setOnboardingCompleted } = useAppStore();
  const [localUrl, setLocalUrl] = useState(serverUrl);
  const [localProxyUrl, setLocalProxyUrl] = useState(proxyUrl);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [peers, setPeers] = useState<DiscoveredPeer[]>([]);
  const [scanProgress, setScanProgress] = useState<string | null>(null);
  const [scanDone, setScanDone] = useState(false);
  const [scanDetail, setScanDetail] = useState<string>('');
  const feedDiscoveredPeers = useAgentStore((s) => s.feedDiscoveredPeers);

  // ── KM-002: Login state ──
  const [showLogin, setShowLogin] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loggingIn, setLoggingIn] = useState(false);

  // Auto-scan on mount
  useEffect(() => {
    handleScanLan();
    checkConnection();
  }, []);

  // Check connection
  const checkConnection = async () => {
    const ok = await kernelClient.healthCheck();
    setConnected(ok);
  };

  // ── Direct mode ──

  const handleSave = () => {
    setServerUrl(localUrl);
    setStatusMessage(null);
    setTestResult(null);
  };

  const handleApplyTest = async () => {
    setServerUrl(localUrl);
    setTesting(true);
    setStatusMessage('Testing connection…');
    setTestResult(null);
    try {
      // Use no-cors so this works in web preview (origin localhost:8081)
      // where the agent sends no CORS headers. An opaque response means alive.
      await fetch(`${localUrl}/health`, {
        method: 'GET',
        mode: 'no-cors',
        signal: AbortSignal.timeout(5000),
      });
      // In no-cors mode res.ok is false and status is 0 (opaque) — treat any
      // resolved fetch as success. A rejection (catch) means unreachable.
      setStatusMessage('✅ Connected successfully');
      setTestResult('success');
      setConnected(true);
    } catch (e: any) {
      setStatusMessage('❌ ' + (e?.message || 'Connection failed'));
      setTestResult('error');
      setConnected(false);
    }
    setTesting(false);
  };

  const handleReset = () => {
    setLocalUrl(serverUrl);
    setLocalProxyUrl(proxyUrl);
    setStatusMessage(null);
    setTestResult(null);
  };

  // ── KM-002: Login / Account ──

  const handleLogin = async () => {
    if (!loginEmail || !loginPassword) {
      setLoginError('Email and password are required');
      return;
    }
    setLoggingIn(true);
    setLoginError(null);

    const ok = await login(loginEmail, loginPassword);
    if (ok) {
      setLoginEmail('');
      setLoginPassword('');
      setShowLogin(false);
      setLoginError(null);
      // After login, check proxy connection
      setStatusMessage('✅ Logged in. Checking connection…');
      setTesting(true);
      const healthOk = await kernelClient.healthCheck();
      setConnected(healthOk);
      setStatusMessage(healthOk ? '✅ Proxy connected' : '❌ Proxy unreachable');
      setTesting(false);
    } else {
      setLoginError('Login failed. Check credentials and proxy URL.');
    }
    setLoggingIn(false);
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Log out from kernel-central? The device will stop using proxy mode.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: () => {
            logout();
            setConnected(false);
          },
        },
      ]
    );
  };

  const handleModeChange = (newMode: 'direct' | 'proxy') => {
    setMode(newMode);
    // Reset UI state for the new mode
    setStatusMessage(null);
    setTestResult(null);
    // Save proxy URL when switching to proxy
    if (newMode === 'proxy') {
      setProxyUrl(localProxyUrl);
    }
    // Re-check connection
    setTimeout(() => checkConnection(), 500);
  };

  // ── LAN scan ──

  const handleScanLan = async () => {
    setScanning(true);
    setScanDone(false);
    setScanProgress('Scanning…');
    setScanDetail('');
    try {
      // Proxy mode: no LAN scan — discovery is delegated to the relay.
      // The BotList already fetches agents via kernelClient.listAgents(),
      // which routes through the proxy in proxy mode. Show a hint instead.
      if (mode === 'proxy') {
        setScanProgress('☁️ Proxy mode — LAN scan disabled');
        setScanDetail('Agents are listed via kernel-central relay.');
        setPeers([]);
        setScanDone(true);
        return;
      }

      // 1. Quick scan localhost first (fast — catches same-machine agents
      //    in web preview and on-device localhost services).
      setScanProgress('🔍 Scanning localhost…');
      const local = await quickScanLocalhost();

      // 2. Probe the configured server URL host (catches the web-preview
      //    case where the app is served from localhost:8081 but the agent
      //    runs on a different LAN IP the user typed in).
      const serverHost = hostFromUrl(localUrl);
      let allPeers = [...local];

      if (serverHost && serverHost !== '127.0.0.1' && serverHost !== 'localhost') {
        setScanProgress(`🔍 Probing ${serverHost}…`);
        const serverPeers = await probeHostForAllPorts(serverHost, (p: ScanProgress) => {
          setScanDetail(`${p.currentService} on ${p.currentIp}:${p.currentPort}`);
        });
        allPeers = [...allPeers, ...serverPeers];
      }

      // 3. If nothing found yet, try full subnet scan (direct mode on device).
      if (allPeers.length === 0) {
        setScanProgress('🔍 Scanning subnet…');
        const subnetPeers = await scanLan((p: ScanProgress) => {
          setScanProgress(`🔍 Probing ${p.currentIp}:${p.currentPort} — ${p.currentService}`);
          setScanDetail(`Found ${p.found} agent(s) — scanning ${p.currentIp}`);
        });
        allPeers = [...allPeers, ...subnetPeers];
      }

      // Dedupe by ip:port across all stages (localhost + serverHost + subnet
      // can all find the same agent).
      allPeers = dedupePeers(allPeers);

      feedDiscoveredPeers(allPeers);
      setPeers(allPeers);
      setScanDone(true);

      if (allPeers.length === 0) {
        setScanProgress('No agents found');
      } else {
        setScanProgress(`✅ Found ${allPeers.length} agent(s)`);
      }
    } catch (e: any) {
      setScanProgress('❌ Scan failed: ' + (e?.message || 'unknown error'));
      setPeers([]);
    }
    setScanning(false);
  };

  const handleResetOnboarding = () => {
    Alert.alert(
      'Reset Onboarding',
      'This will restart the setup wizard on next launch.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            setOnboardingCompleted(false);
            Alert.alert('Done', 'Onboarding will show on next app launch.');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bgPrimary} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* ── Header with Back Button ── */}
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <ArrowBack />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Settings</Text>
        </View>

        {/* ════════════════════════════════════════════════
           KM-003: Connection Mode Toggle
           ════════════════════════════════════════════════ */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>CONNECTION MODE</Text>
          <View style={styles.card}>
            <View style={styles.toggleRow}>
              <TouchableOpacity
                style={[styles.toggleBtn, mode === 'direct' && styles.toggleActive]}
                onPress={() => handleModeChange('direct')}
              >
                <Text style={[styles.toggleText, mode === 'direct' && styles.toggleTextActive]}>
                  🏠 Direct (LAN)
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggleBtn, mode === 'proxy' && styles.toggleActive]}
                onPress={() => handleModeChange('proxy')}
              >
                <Text style={[styles.toggleText, mode === 'proxy' && styles.toggleTextActive]}>
                  ☁️ Proxy (remote)
                </Text>
              </TouchableOpacity>
            </View>

            {/* Connection status indicator (KM-003) */}
            <View style={styles.statusRow}>
              <View style={[styles.dot, { backgroundColor: statusColor(mode, connected) }]} />
              <Text style={styles.statusLabel}>{statusLabel(mode, connected)}</Text>
            </View>
          </View>
        </View>

        {/* ════════════════════════════════════════════════
           KM-001: Server URL & Connection Settings
           ════════════════════════════════════════════════ */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>
            {mode === 'direct' ? 'DIRECT (LOCAL) CONNECTION' : 'PROXY CONNECTION'}
          </Text>
          <View style={styles.card}>
            {/* Show different fields based on mode */}
            {mode === 'direct' ? (
              <>
                {/* Server URL — direct mode */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>KERNEL-EVOLVING URL</Text>
                  <TextInput
                    style={styles.input}
                    value={localUrl}
                    onChangeText={setLocalUrl}
                    placeholder="http://localhost:8779"
                    placeholderTextColor={colors.textMuted}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>

                {/* Apply & Test + Reset */}
                <View style={styles.buttonRow}>
                  <TouchableOpacity style={styles.applyBtn} onPress={handleApplyTest} disabled={testing}>
                    <Text style={styles.applyBtnText}>
                      {testing ? 'Testing…' : 'Apply & Test'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.resetBtn} onPress={handleReset}>
                    <Text style={styles.resetBtnText}>Reset</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <>
                {/* Proxy URL — proxy mode */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>KERNEL-CENTRAL URL</Text>
                  <TextInput
                    style={styles.input}
                    value={localProxyUrl}
                    onChangeText={(t) => { setLocalProxyUrl(t); setProxyUrl(t); }}
                    placeholder="https://kernel-central.neverslave.com"
                    placeholderTextColor={colors.textMuted}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>

                {/* Login/Account section (KM-002) */}
                {user ? (
                  <View style={styles.accountInfo}>
                    <View style={styles.userRow}>
                      <Text style={styles.userIcon}>👤</Text>
                      <View style={styles.userDetails}>
                        <Text style={styles.userName}>{user.name}</Text>
                        <Text style={styles.userEmail}>{user.email}</Text>
                      </View>
                    </View>
                    <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                      <Text style={styles.logoutBtnText}>Logout</Text>
                    </TouchableOpacity>
                  </View>
                ) : showLogin ? (
                  <View style={styles.loginForm}>
                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>EMAIL</Text>
                      <TextInput
                        style={styles.input}
                        value={loginEmail}
                        onChangeText={setLoginEmail}
                        placeholder="email@example.com"
                        placeholderTextColor={colors.textMuted}
                        autoCapitalize="none"
                        autoCorrect={false}
                        keyboardType="email-address"
                      />
                    </View>
                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>PASSWORD</Text>
                      <TextInput
                        style={styles.input}
                        value={loginPassword}
                        onChangeText={setLoginPassword}
                        placeholder="••••••••"
                        placeholderTextColor={colors.textMuted}
                        secureTextEntry
                      />
                    </View>
                    {loginError && (
                      <Text style={styles.loginError}>{loginError}</Text>
                    )}
                    <View style={styles.buttonRow}>
                      <TouchableOpacity
                        style={styles.applyBtn}
                        onPress={handleLogin}
                        disabled={loggingIn}
                      >
                        <Text style={styles.applyBtnText}>
                          {loggingIn ? 'Logging in…' : 'Login'}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.resetBtn} onPress={() => setShowLogin(false)}>
                        <Text style={styles.resetBtnText}>Cancel</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <TouchableOpacity style={styles.loginBtn} onPress={() => setShowLogin(true)}>
                    <Text style={styles.loginBtnText}>🔑 Login to kernel-central</Text>
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>
        </View>

        {/* ── Connection Status ── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>STATUS</Text>
          <View style={styles.card}>
            {statusMessage ? (
              <View style={styles.statusContent}>
                <Text style={[
                  styles.statusText,
                  testResult === 'success' && { color: colors.success },
                  testResult === 'error' && { color: colors.danger },
                  !testResult && { color: colors.accent },
                ]}>
                  {statusMessage}
                </Text>
              </View>
            ) : (
              <View style={styles.statusContent}>
                <View style={styles.spinner} />
                <Text style={styles.statusWaiting}>
                  {mode === 'direct' ? 'Not tested yet. Apply & Test to verify.' : user ? 'Logged in. Check connection.' : 'Login to use proxy mode.'}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* ── LAN Discovery ── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>LAN DISCOVERY</Text>
          <View style={styles.card}>
            <View style={styles.discoveryHeader}>
              <Text style={styles.discoveryStatus}>
                {peers.length > 0 ? '🟢 Active' : '⚫ Inactive'}
              </Text>
              <TouchableOpacity style={styles.scanBtn} onPress={handleScanLan} disabled={scanning}>
                <Text style={styles.scanBtnText}>{scanning ? 'Scanning…' : '↻ Refresh'}</Text>
              </TouchableOpacity>
            </View>
            {scanning && (
              <Text style={styles.scanningDetail}>{scanDetail}</Text>
            )}
            {peers.length > 0 ? (
              <View style={styles.peersList}>
                {peers.map((peer, i) => (
                  <View key={i} style={styles.peerRow}>
                    <View style={[styles.peerDot, { backgroundColor: peer.status === 'online' ? colors.success : colors.textMuted }]} />
                    <Text style={styles.peerName}>{peer.name}</Text>
                    <Text style={styles.peerPort}>{peer.port}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.peersEmpty}>No peers found on LAN</Text>
            )}
          </View>
        </View>

        {/* ── About ── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>ABOUT</Text>
          <View style={styles.card}>
            <View style={styles.aboutRow}>
              <Text style={styles.aboutLabel}>Version</Text>
              <Text style={styles.aboutValue}>2.0.0</Text>
            </View>
            <View style={styles.aboutRow}>
              <Text style={styles.aboutLabel}>Framework</Text>
              <Text style={styles.aboutValue}>React Native (Expo)</Text>
            </View>
          </View>
        </View>

        {/* ── Advanced ── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>ADVANCED</Text>
          <TouchableOpacity style={styles.dangerBtn} onPress={handleResetOnboarding}>
            <Text style={styles.dangerBtnText}>Reset Onboarding</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: 40,
  },
  // ── Header ──
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xxl,
  },
  backBtn: {
    padding: spacing.xs,
  },
  headerTitle: {
    ...typography.h2,
  },
  section: {
    marginBottom: spacing.xxl,
  },
  sectionLabel: {
    ...typography.label,
    marginBottom: spacing.md,
  },
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  // Toggle (KM-003)
  toggleRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: colors.accentBg,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  toggleActive: {
    backgroundColor: colors.buttonPrimary,
  },
  toggleText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  toggleTextActive: {
    color: '#fff',
  },
  // Status indicator (KM-003)
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statusLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  // Input
  inputGroup: {
    marginBottom: spacing.md,
  },
  inputLabel: {
    ...typography.label,
    marginBottom: spacing.xs,
  },
  input: {
    width: '100%',
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    fontSize: 14,
    backgroundColor: colors.accentBg,
    color: colors.textPrimary,
    borderRadius: borderRadius.md,
  },
  // Buttons
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  applyBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    backgroundColor: colors.buttonPrimary,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  applyBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  resetBtn: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.accentBg,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetBtnText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  // Status
  statusContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  statusText: {
    fontSize: 13,
  },
  statusWaiting: {
    fontSize: 12,
    color: colors.textMuted,
  },
  spinner: {
    width: 16,
    height: 16,
    borderWidth: 2,
    borderColor: colors.accent,
    borderTopColor: 'transparent',
    borderRadius: 8,
  },
  // KM-002: Login / Account
  accountInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.bgHover,
    borderRadius: borderRadius.md,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  userIcon: {
    fontSize: 20,
  },
  userDetails: {},
  userName: {
    fontSize: 13,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  userEmail: {
    fontSize: 11,
    color: colors.textMuted,
  },
  logoutBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    backgroundColor: colors.accentBg,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.danger,
  },
  logoutBtnText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.danger,
  },
  loginForm: {},
  loginError: {
    fontSize: 12,
    color: colors.danger,
    marginBottom: spacing.sm,
  },
  loginBtn: {
    paddingVertical: spacing.sm,
    backgroundColor: colors.buttonPrimary,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  loginBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  // LAN Discovery
  discoveryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  discoveryStatus: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  scanBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    backgroundColor: colors.accentBg,
    borderRadius: borderRadius.full,
  },
  scanBtnText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  peersList: {
    gap: spacing.sm,
  },
  peerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.bgHover,
    borderRadius: borderRadius.md,
  },
  peerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  peerName: {
    fontSize: 12,
    color: colors.textPrimary,
    flex: 1,
  },
  peerPort: {
    fontSize: 10,
    color: colors.textMuted,
  },
  peersEmpty: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    paddingVertical: spacing.md,
  },
  scanningDetail: {
    fontSize: 11,
    color: colors.accent,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  // About
  aboutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderSubtle,
  },
  aboutLabel: {
    ...typography.caption,
  },
  aboutValue: {
    ...typography.caption,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  // Danger
  dangerBtn: {
    paddingVertical: spacing.md,
    backgroundColor: colors.accentBg,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.danger,
  },
  dangerBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.danger,
  },
});
