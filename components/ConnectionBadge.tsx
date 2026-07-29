import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

type ConnectionStatus = 'connected' | 'disconnected' | 'checking';

interface ConnectionBadgeProps {
  status: ConnectionStatus;
  label?: string;
}

const STATUS_CONFIG = {
  connected: { color: '#3fb950', bg: '#0d2818', label: 'Connected' },
  disconnected: { color: '#f85149', bg: '#280d0d', label: 'Disconnected' },
  checking: { color: '#f0883e', bg: '#281d0d', label: 'Checking…' },
};

export default function ConnectionBadge({ status, label }: ConnectionBadgeProps) {
  const config = STATUS_CONFIG[status];

  return (
    <View style={[styles.badge, { backgroundColor: config.bg }]}>
      <View style={[styles.dot, { backgroundColor: config.color }]} />
      <Text style={[styles.label, { color: config.color }]}>
        {label ?? config.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 6,
    alignSelf: 'flex-start',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  label: {
    fontSize: 11,
    fontWeight: '500',
  },
});
