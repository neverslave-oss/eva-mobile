import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';

interface StreamingBubbleProps {
  text: string;
  isStreaming: boolean;
}

export default function StreamingBubble({ text, isStreaming }: StreamingBubbleProps) {
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isStreaming) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(opacity, { toValue: 0.5, duration: 600, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 1, duration: 600, useNativeDriver: true }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    } else {
      opacity.setValue(1);
    }
  }, [isStreaming, opacity]);

  if (!text && !isStreaming) return null;

  return (
    <View style={styles.container}>
      <View style={styles.bubble}>
        <Text style={styles.text}>{text}</Text>
        {isStreaming && (
          <Animated.View style={[styles.cursor, { opacity }]}>
            <Text style={styles.cursorText}>▌</Text>
          </Animated.View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
    paddingHorizontal: 12,
    alignItems: 'flex-start',
  },
  bubble: {
    maxWidth: '80%',
    backgroundColor: '#1a2d42',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    borderBottomLeftRadius: 4,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  text: {
    color: '#e4e4e7',
    fontSize: 14,
    lineHeight: 20,
  },
  cursor: {
    marginLeft: 2,
  },
  cursorText: {
    color: '#58a6ff',
    fontSize: 16,
  },
});
