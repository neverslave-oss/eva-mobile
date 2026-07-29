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
  Circle,
  Path,
  Ellipse,
} from 'react-native-svg';
import { SCREEN_NAMES } from '../types';
import { colors, typography, borderRadius } from '../theme';

interface WelcomeScreenProps {
  navigation: any;
}

// Full snake-E logo matching v1's welcome screen
const SnakeELogo = () => (
  <Svg width="140" height="140" viewBox="0 0 200 200" fill="none">
    <Defs>
      <LinearGradient id="wlcmGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#58a6ff" />
        <Stop offset="50%" stopColor="#3fb950" />
        <Stop offset="100%" stopColor="#bc8cff" />
      </LinearGradient>
      <LinearGradient id="wlcmEye" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#ff6e40" />
        <Stop offset="100%" stopColor="#ff1744" />
      </LinearGradient>
    </Defs>
    {/* Background ring */}
    <Circle cx="100" cy="100" r="95" fill="#0d1117" opacity="0.3" />
    {/* Body */}
    <Path d="M60 28 C60 45,62 60,62 75 C62 90,62 105,62 120 C62 135,62 150,60 165 C58 178,60 188,75 192"
          stroke="url(#wlcmGrad)" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round"/>
    <Path d="M62 48 C80 42,95 40,115 42 C130 44,142 48,148 52"
          stroke="url(#wlcmGrad)" strokeWidth="11" strokeLinecap="round"/>
    <Path d="M148 52 C150 58,145 64,138 65"
          stroke="url(#wlcmGrad)" strokeWidth="9" strokeLinecap="round"/>
    <Path d="M62 95 C80 90,98 88,118 90 C132 92,142 96,146 100"
          stroke="url(#wlcmGrad)" strokeWidth="11" strokeLinecap="round"/>
    <Path d="M146 100 C148 104,143 110,137 110"
          stroke="url(#wlcmGrad)" strokeWidth="9" strokeLinecap="round"/>
    <Path d="M60 142 C78 140,96 142,116 145 C130 148,140 152,146 156"
          stroke="url(#wlcmGrad)" strokeWidth="11" strokeLinecap="round"/>
    <Path d="M146 156 C148 162,142 168,135 168"
          stroke="url(#wlcmGrad)" strokeWidth="9" strokeLinecap="round"/>
    <Path d="M75 192 C85 196,98 196,105 190 C112 184,110 175,102 173 C96 172,92 176,93 180"
          stroke="url(#wlcmGrad)" strokeWidth="9" strokeLinecap="round"/>
    <Path d="M93 180 C94 183,97 183,98 181"
          stroke="url(#wlcmGrad)" strokeWidth="6" strokeLinecap="round"/>
    {/* Head */}
    <Path d="M60 28 C58 20,55 15,50 12 C44 8,38 10,42 16 C44 20,48 24,52 26 C52 26,55 28,60 28"
          fill="url(#wlcmGrad)" stroke="none"/>
    <Ellipse cx="48" cy="18" rx="13" ry="9" fill="url(#wlcmGrad)" opacity="0.95"/>
    {/* Eyes */}
    <Ellipse cx="42" cy="13" rx="3.5" ry="3" fill="url(#wlcmEye)" />
    <Ellipse cx="55" cy="13" rx="3.5" ry="3" fill="url(#wlcmEye)" />
    <Ellipse cx="42" cy="13" rx="1.2" ry="2.2" fill="#0a0e1a" />
    <Ellipse cx="55" cy="13" rx="1.2" ry="2.2" fill="#0a0e1a" />
  </Svg>
);

export default function WelcomeScreen({ navigation }: WelcomeScreenProps) {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bgPrimary} />
      <View style={styles.content}>
        {/* Snake-E logo — v1 style */}
        <View style={styles.logoContainer}>
          <SnakeELogo />
        </View>

        <Text style={styles.title}>EVA</Text>
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
    backgroundColor: colors.bgPrimary,
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
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 40,
  },
  startButton: {
    width: '100%',
    maxWidth: 280,
    paddingVertical: 14,
    backgroundColor: colors.buttonPrimary,
    borderRadius: borderRadius.lg,
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