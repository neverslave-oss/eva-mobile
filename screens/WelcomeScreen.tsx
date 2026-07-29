import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import Svg, {
  Defs,
  LinearGradient,
  Stop,
  Rect,
  Circle,
} from 'react-native-svg';
import { SCREEN_NAMES } from '../types';

interface WelcomeScreenProps {
  navigation: any;
}

const EIcon = () => (
  <Svg width="120" height="120" viewBox="0 0 120 120" fill="none">
    <Defs>
      <LinearGradient id="eGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#58a6ff" />
        <Stop offset="50%" stopColor="#3fb950" />
        <Stop offset="100%" stopColor="#bc8cff" />
      </LinearGradient>
    </Defs>
    {/* Background ring */}
    <Circle cx="60" cy="60" r="56" stroke="url(#eGrad)" strokeWidth="3" opacity="0.3" />
    {/* Vertical bar */}
    <Rect x="28" y="28" width="8" height="64" rx="4" fill="url(#eGrad)" />
    {/* Top bar */}
    <Rect x="36" y="28" width="52" height="8" rx="4" fill="url(#eGrad)" />
    {/* Middle bar */}
    <Rect x="36" y="56" width="40" height="8" rx="4" fill="url(#eGrad)" />
    {/* Bottom bar */}
    <Rect x="36" y="84" width="52" height="8" rx="4" fill="url(#eGrad)" />
  </Svg>
);

export default function WelcomeScreen({ navigation }: WelcomeScreenProps) {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0f0f1a" />

      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <EIcon />
        </View>

        <Text style={styles.title}>Kernel Mobile</Text>
        <Text style={styles.tagline}>
          Your self-evolving AI agent.{'\n'}Chat, automate, evolve.
        </Text>

        <TouchableOpacity
          style={styles.startButton}
          activeOpacity={0.8}
          onPress={() => navigation.navigate(SCREEN_NAMES.Onboarding)}
        >
          <Text style={styles.startButtonText}>Start Setup</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.version}>Kernel Mobile · v2.0.0</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f1a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  logoContainer: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 8,
  },
  tagline: {
    fontSize: 14,
    color: '#8b949e',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 40,
  },
  startButton: {
    width: '100%',
    maxWidth: 280,
    paddingVertical: 14,
    backgroundColor: '#1a6ed8',
    borderRadius: 12,
    alignItems: 'center',
  },
  startButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  version: {
    fontSize: 10,
    color: '#3a4550',
    letterSpacing: 2,
    textTransform: 'uppercase',
    paddingBottom: 24,
  },
});
