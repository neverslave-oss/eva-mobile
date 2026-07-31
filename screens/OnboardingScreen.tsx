import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Path, Ellipse, Circle, Rect } from 'react-native-svg';
import { SCREEN_NAMES, ConnectionMode } from '../types';
import { useAppStore } from '../stores/appStore';
import { useSettingsStore } from '../stores/settingsStore';

interface OnboardingScreenProps {
  navigation: any;
}

const CloseIcon = () => (
  <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <Path d="M18 6L6 18M6 6l12 12" stroke="#8b949e" strokeWidth="2" strokeLinecap="round" />
  </Svg>
);

export default function OnboardingScreen({ navigation }: OnboardingScreenProps) {
  const setOnboardingCompleted = useAppStore((s) => s.setOnboardingCompleted);
  const { mode, serverUrl, setMode, setServerUrl } = useSettingsStore();

  const [step, setStep] = useState<'welcome' | 'connection' | 'done'>('welcome');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [localUrl, setLocalUrl] = useState(serverUrl);

  const steps = ['welcome', 'connection', 'done'] as const;
  const stepIndex = steps.indexOf(step);

  const nextStep = () => {
    if (stepIndex < steps.length - 1) {
      setStep(steps[stepIndex + 1]);
    }
  };

  const prevStep = () => {
    if (stepIndex > 0) {
      setStep(steps[stepIndex - 1]);
    }
  };

  const testConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      // Use no-cors so this works in web preview (origin localhost:8081)
      // where the agent sends no CORS headers. An opaque response means alive.
      await fetch(`${localUrl}/health`, {
        method: 'GET',
        mode: 'no-cors',
        signal: AbortSignal.timeout(5000),
      });
      // In no-cors mode the response is opaque (status 0) — any resolved
      // fetch means the server is reachable. A rejection means unreachable.
      setTestResult('✅ Connected!');
    } catch (e: any) {
      setTestResult('❌ ' + (e?.message || 'Connection failed'));
    }
    setTesting(false);
  };

  const finish = () => {
    setMode(mode);
    setServerUrl(localUrl);
    setOnboardingCompleted(true);
    navigation.reset({ index: 0, routes: [{ name: SCREEN_NAMES.BotList }] });
  };

  const stepDot = (idx: number) => (
    <View
      key={idx}
      style={[styles.dot, stepIndex === idx ? styles.dotActive : styles.dotInactive]}
    />
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0f0f1a" />

      <View style={styles.content}>
        {/* Step indicator */}
        <View style={styles.stepsRow}>
          {[0, 1, 2].map(stepDot)}
        </View>

        {/* Step: Welcome */}
        {step === 'welcome' && (
          <View style={styles.stepContent}>
            <Text style={styles.welcomeTitle}>Kernel Chat</Text>
            <Text style={styles.welcomeDesc}>
              Chat with your local AI agents from anywhere.{'\n'}Let's get you connected.
            </Text>

            <View style={styles.modeCards}>
              <View style={styles.modeCard}>
                <Text style={styles.modeIcon}>🏠</Text>
                <Text style={styles.modeLabel}>Direct (same machine)</Text>
                <Text style={styles.modeDesc}>Connect to kernel-evolving on your local network</Text>
              </View>
              <View style={styles.modeCard}>
                <Text style={styles.modeIcon}>☁️</Text>
                <Text style={styles.modeLabel}>Proxy (remote)</Text>
                <Text style={styles.modeDesc}>Remote connection via server URL</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.primaryButton} onPress={nextStep}>
              <Text style={styles.primaryButtonText}>Get Started</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Step: Connection */}
        {step === 'connection' && (
          <View style={styles.stepContent}>
            <Text style={styles.sectionTitle}>Connection</Text>
            <Text style={styles.sectionSubtitle}>Choose how you connect to your agent</Text>

            {/* Mode toggle */}
            <View style={styles.toggleRow}>
              <TouchableOpacity
                style={[styles.toggleButton, mode === 'direct' && styles.toggleActive]}
                onPress={() => setMode('direct')}
              >
                <Text style={[styles.toggleText, mode === 'direct' && styles.toggleTextActive]}>
                  🏠 Direct
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggleButton, mode === 'proxy' && styles.toggleActive]}
                onPress={() => setMode('proxy')}
              >
                <Text style={[styles.toggleText, mode === 'proxy' && styles.toggleTextActive]}>
                  ☁️ Proxy
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
                placeholderTextColor="#6c7883"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            {/* Test connection */}
            <TouchableOpacity
              style={styles.testButton}
              onPress={testConnection}
              disabled={testing}
            >
              {testing ? (
                <View style={styles.testingRow}>
                  <ActivityIndicator size="small" color="#58a6ff" />
                  <Text style={styles.testButtonText}> Testing…</Text>
                </View>
              ) : (
                <Text style={styles.testButtonText}>Test Connection</Text>
              )}
            </TouchableOpacity>

            {testResult && (
              <Text style={[styles.testResult, { color: testResult.includes('✅') ? '#3fb950' : '#f85149' }]}>
                {testResult}
              </Text>
            )}

            {/* Navigation */}
            <View style={styles.navRow}>
              <TouchableOpacity style={styles.secondaryButton} onPress={prevStep}>
                <Text style={styles.secondaryButtonText}>Back</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.primaryButton} onPress={nextStep}>
                <Text style={styles.primaryButtonText}>Continue</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Step: Done */}
        {step === 'done' && (
          <View style={styles.stepContent}>
            <Text style={styles.doneEmoji}>🚀</Text>
            <Text style={styles.sectionTitle}>You're all set!</Text>
            <Text style={styles.welcomeDesc}>
              Tap the button below to start chatting with your agent.
            </Text>

            <View style={styles.summaryBox}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryCheck}>✓</Text>
                <Text style={styles.summaryText}>Mode: {mode === 'direct' ? 'Direct' : 'Proxy'}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryCheck}>✓</Text>
                <Text style={styles.summaryText}>Server: {localUrl}</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.finishButton} onPress={finish}>
              <Text style={styles.primaryButtonText}>Start Chatting</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f1a',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  stepsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 32,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotActive: {
    backgroundColor: '#58a6ff',
  },
  dotInactive: {
    backgroundColor: '#242f3d',
  },
  stepContent: {
    width: '100%',
    maxWidth: 320,
  },
  // Welcome step
  welcomeTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 8,
  },
  welcomeDesc: {
    fontSize: 13,
    color: '#8b949e',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  modeCards: {
    gap: 10,
    marginBottom: 24,
  },
  modeCard: {
    backgroundColor: '#17212b',
    borderRadius: 12,
    padding: 14,
  },
  modeIcon: {
    fontSize: 18,
    marginBottom: 4,
  },
  modeLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 2,
  },
  modeDesc: {
    fontSize: 10,
    color: '#6c7883',
  },
  // Connection step
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 11,
    color: '#8b949e',
    textAlign: 'center',
    marginBottom: 20,
  },
  toggleRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: '#242f3d',
    borderRadius: 12,
    alignItems: 'center',
  },
  toggleActive: {
    backgroundColor: '#1a6ed8',
  },
  toggleText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#8b949e',
  },
  toggleTextActive: {
    color: '#ffffff',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 10,
    color: '#8b949e',
    letterSpacing: 1,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  input: {
    width: '100%',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    backgroundColor: '#242f3d',
    color: '#e4e4e7',
    borderRadius: 12,
  },
  testButton: {
    width: '100%',
    paddingVertical: 12,
    backgroundColor: '#242f3d',
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 8,
  },
  testButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#58a6ff',
  },
  testingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  testResult: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 8,
  },
  navRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  // Done step
  doneEmoji: {
    fontSize: 48,
    textAlign: 'center',
    marginBottom: 16,
  },
  summaryBox: {
    backgroundColor: '#17212b',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    gap: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  summaryCheck: {
    color: '#3fb950',
    fontSize: 13,
    fontWeight: '700',
  },
  summaryText: {
    fontSize: 12,
    color: '#8b949e',
  },
  // Shared buttons
  primaryButton: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: '#1a6ed8',
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ffffff',
  },
  finishButton: {
    width: '100%',
    paddingVertical: 12,
    backgroundColor: '#238636',
    borderRadius: 12,
    alignItems: 'center',
  },
  secondaryButton: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: '#242f3d',
    borderRadius: 12,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#8b949e',
  },
});
