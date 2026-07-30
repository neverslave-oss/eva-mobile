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
import { RootStackParamList } from '../types';
import { colors, typography, borderRadius, spacing } from '../theme';
import { scanLan, DiscoveredPeer } from '../services/NetworkDiscovery';
import Svg, { Path } from 'react-native-svg';

type NavProp = NativeStackNavigationProp<RootStackParamList>;

// Mini SVG back arrow
const ArrowBack = () => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <Path d="M15 19l-7-7 7-7" stroke="#8b949e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

export default function SettingsScreen() {
  const navigation = useNavigation<NavProp>();
  const { mode, serverUrl, setMode, setServerUrl } = useSettingsStore();
  const { setOnboardingCompleted } = useAppStore();
  const [localUrl, setLocalUrl] = useState(serverUrl);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [peers, setPeers] = useState<DiscoveredPeer[]>([]);
  const [scanProgress, setScanProgress] = useState<string | null>(null);
  const [scanDone, setScanDone] = useState(false);

  // Auto-scan on mount
  useEffect(() => {
    handleScanLan();
  }, []);

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
      const res = await fetch(`${localUrl}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });
      if (res.ok) {
        setStatusMessage('✅ Connected successfully');
        setTestResult('success');
      } else {
        setStatusMessage('❌ Server responded with error');
        setTestResult('error');
      }
    } catch (e: any) {
      setStatusMessage('❌ ' + (e?.message || 'Connection failed'));
      setTestResult('error');
    }
    setTesting(false);
  };

  const handleReset = () => {
    setLocalUrl(serverUrl);
    setStatusMessage(null);
    setTestResult(null);
  };

  const handleScanLan = async () => {
    setScanning(true);
    setScanProgress('Scanning LAN…');
    setScanDone(false);
    try {
      const discovered = await scanLan((found, total) => {
        setScanProgress(`Found ${found} agent(s) — probing…`);
      });
      setPeers(discovered);
      setScanDone(true);
      if (discovered.length === 0) {
        setScanProgress('No agents found on LAN');
      } else {
        setScanProgress(`Found ${discovered.length} agent(s)`);
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

        {/* Connection */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>CONNECTION</Text>
          <View style={styles.card}>
            {/* Mode toggle — v1 styled */}
            <View style={styles.toggleRow}>
              <TouchableOpacity
                style={[styles.toggleBtn, mode === 'direct' && styles.toggleActive]}
                onPress={() => { setMode('direct'); handleReset(); }}
              >
                <Text style={[styles.toggleText, mode === 'direct' && styles.toggleTextActive]}>
                  🏠 Direct (local)
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggleBtn, mode === 'proxy' && styles.toggleActive]}
                onPress={() => { setMode('proxy'); handleReset(); }}
              >
                <Text style={[styles.toggleText, mode === 'proxy' && styles.toggleTextActive]}>
                  ☁️ Proxy (remote)
                </Text>
              </TouchableOpacity>
            </View>

            {/* Server URL */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>SERVER URL</Text>
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

            {/* Apply & Test + Reset buttons — v1 style */}
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
          </View>
        </View>

        {/* Connection Status — v1's "Status" section */}
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
                <Text style={styles.statusWaiting}>Not tested yet</Text>
              </View>
            )}
          </View>
        </View>

        {/* LAN Discovery — v1 section */}
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

        {/* Sync with Desktop — v1 section */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>SYNC WITH DESKTOP</Text>
          <View style={styles.card}>
            <Text style={styles.syncDesc}>
              Connect to the desktop app running on the same network to sync conversations and settings.
            </Text>
            <View style={styles.syncRow}>
              <Text style={styles.syncState}>Auto-discovery: {peers.length > 0 ? 'On' : 'Off'}</Text>
              <TouchableOpacity style={styles.syncBtn} onPress={handleScanLan}>
                <Text style={styles.syncBtnText}>Scan LAN</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* About */}
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

        {/* Advanced - Reset */}
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
  // Toggle
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
  // Sync
  syncDesc: {
    ...typography.caption,
    lineHeight: 18,
    marginBottom: spacing.md,
  },
  syncRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  syncState: {
    fontSize: 12,
    color: colors.textMuted,
  },
  syncBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    backgroundColor: colors.accentBg,
    borderRadius: borderRadius.full,
  },
  syncBtnText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.accent,
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