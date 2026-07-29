import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import Svg, { Path } from 'react-native-svg';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastProps {
  message: string;
  type?: ToastType;
  visible: boolean;
  duration?: number;
  onDismiss?: () => void;
}

const TOAST_COLORS: Record<ToastType, { bg: string; text: string; accent: string }> = {
  success: { bg: '#0d2818', text: '#3fb950', accent: '#3fb950' },
  error: { bg: '#280d0d', text: '#f85149', accent: '#f85149' },
  info: { bg: '#0d1b28', text: '#58a6ff', accent: '#58a6ff' },
  warning: { bg: '#281d0d', text: '#f0883e', accent: '#f0883e' },
};

const CloseIcon = () => (
  <Svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <Path d="M18 6L6 18M6 6l12 12" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" opacity={0.5} />
  </Svg>
);

export default function Toast({
  message,
  type = 'info',
  visible,
  duration = 3000,
  onDismiss,
}: ToastProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-20)).current;
  const colors = TOAST_COLORS[type];

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();

      const timer = setTimeout(() => {
        handleDismiss();
      }, duration);

      return () => clearTimeout(timer);
    } else {
      opacity.setValue(0);
      translateY.setValue(-20);
    }
  }, [visible]);

  const handleDismiss = () => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 0, duration: 150, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: -20, duration: 150, useNativeDriver: true }),
    ]).start(() => onDismiss?.());
  };

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        { backgroundColor: colors.bg, opacity, transform: [{ translateY }] },
      ]}
    >
      <View style={[styles.accent, { backgroundColor: colors.accent }]} />
      <View style={styles.content}>
        <Text style={[styles.message, { color: colors.text }]}>{message}</Text>
      </View>
      <TouchableOpacity style={styles.closeBtn} onPress={handleDismiss}>
        <CloseIcon />
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    zIndex: 1000,
  },
  accent: {
    width: 4,
    height: '100%',
  },
  content: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 12,
  },
  message: {
    fontSize: 13,
    lineHeight: 18,
  },
  closeBtn: {
    padding: 12,
  },
});
