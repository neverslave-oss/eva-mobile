import React from 'react';
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
import { useSettingsStore } from '../stores/settingsStore';
import { useAppStore } from '../stores/appStore';
import { SCREEN_NAMES } from '../types';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';

export default function SettingsScreen() {
  const navigation = useNavigation<BottomTabNavigationProp<any>>();
  const { mode, serverUrl, setMode, setServerUrl } = useSettingsStore();
  const { setOnboardingCompleted } = useAppStore();
  const [localUrl, setLocalUrl] = React.useState(serverUrl);
  const [testing, setTesting] = React.useState(false);
  const [testResult, setTestResult] = React.useState<string | null>(null);

  const handleSave = () => {
    setServerUrl(localUrl);
    Alert.alert('Saved', 'Settings updated successfully.');
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch(`${localUrl}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });
      setTestResult(res.ok ? '✅ Connected!' : '❌ Server error');
    } catch (e: any) {
      setTestResult('❌ ' + (e?.message || 'Connection failed'));
    }
    setTesting(false);
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
      <StatusBar barStyle="light-content" backgroundColor="#0f0f1a" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.headerTitle}>Settings</Text>

        {/* Connection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>CONNECTION</Text>

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

          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.secondaryButton} onPress={handleTest} disabled={testing}>
              <Text style={styles.secondaryButtonText}>
                {testing ? 'Testing…' : 'Test'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          </View>

          {testResult && (
            <Text style={[styles.testResult, { color: testResult.includes('✅') ? '#3fb950' : '#f85149' }]}>
              {testResult}
            </Text>
          )}
        </View>

        {/* About */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ABOUT</Text>
          <View style={styles.aboutCard}>
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

        {/* Advanced */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ADVANCED</Text>
          <TouchableOpacity
            style={styles.dangerButton}
            onPress={handleResetOnboarding}
          >
            <Text style={styles.dangerButtonText}>Reset Onboarding</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f1a',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 24,
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 10,
    color: '#8b949e',
    letterSpacing: 1,
    marginBottom: 12,
  },
  toggleRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: '#242f3d',
    borderRadius: 10,
    alignItems: 'center',
  },
  toggleActive: {
    backgroundColor: '#1a6ed8',
  },
  toggleText: {
    fontSize: 12,
    color: '#8b949e',
  },
  toggleTextActive: {
    color: '#ffffff',
    fontWeight: '600',
  },
  inputGroup: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 10,
    color: '#8b949e',
    letterSpacing: 1,
    marginBottom: 6,
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
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
  },
  secondaryButton: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: '#242f3d',
    borderRadius: 12,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#58a6ff',
  },
  saveButton: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: '#1a6ed8',
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
  testResult: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 10,
  },
  aboutCard: {
    backgroundColor: '#17212b',
    borderRadius: 12,
    padding: 16,
  },
  aboutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#242f3d',
  },
  aboutLabel: {
    fontSize: 12,
    color: '#8b949e',
  },
  aboutValue: {
    fontSize: 12,
    color: '#e4e4e7',
    fontWeight: '500',
  },
  dangerButton: {
    paddingVertical: 12,
    backgroundColor: '#242f3d',
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f85149',
  },
  dangerButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#f85149',
  },
});