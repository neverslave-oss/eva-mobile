import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';

interface AgentAvatarProps {
  name: string;
  status: 'online' | 'offline' | 'checking';
  avatarUrl?: string;
  size?: number;
}

const STATUS_COLORS = {
  online: '#3fb950',
  offline: '#6c7883',
  checking: '#f0883e',
};

const STATUS_LABELS = {
  online: '●',
  offline: '○',
  checking: '◌',
};

export default function AgentAvatar({ name, status, avatarUrl, size = 44 }: AgentAvatarProps) {
  const initial = name.charAt(0).toUpperCase();
  const dotSize = Math.max(10, size * 0.22);

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {avatarUrl ? (
        <Image
          source={{ uri: avatarUrl }}
          style={[styles.image, { width: size, height: size, borderRadius: size / 2 }]}
        />
      ) : (
        <View
          style={[
            styles.placeholder,
            { width: size, height: size, borderRadius: size / 2 },
          ]}
        >
          <Text style={[styles.initial, { fontSize: size * 0.4 }]}>{initial}</Text>
        </View>
      )}
      <View
        style={[
          styles.statusDot,
          {
            width: dotSize,
            height: dotSize,
            borderRadius: dotSize / 2,
            backgroundColor: STATUS_COLORS[status],
            right: -2,
            bottom: -2,
          },
        ]}
      >
        <Text style={[styles.statusText, { fontSize: dotSize * 0.5 }]}>
          {STATUS_LABELS[status]}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  image: {
    borderWidth: 2,
    borderColor: '#242f3d',
  },
  placeholder: {
    backgroundColor: '#17212b',
    borderWidth: 2,
    borderColor: '#242f3d',
    alignItems: 'center',
    justifyContent: 'center',
  },
  initial: {
    color: '#8b949e',
    fontWeight: '700',
  },
  statusDot: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: '#0f0f1a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusText: {
    color: '#ffffff',
    fontWeight: '700',
  },
});
