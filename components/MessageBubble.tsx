import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import MarkdownRenderer from './MarkdownRenderer';

interface MessageBubbleProps {
  text: string;
  role: 'user' | 'assistant';
  timestamp?: number;
}

export default function MessageBubble({ text, role, timestamp }: MessageBubbleProps) {
  const isUser = role === 'user';

  return (
    <View style={[styles.container, isUser ? styles.userContainer : styles.botContainer]}>
      <View style={[styles.bubble, isUser ? styles.userBubble : styles.botBubble]}>
        {isUser ? (
          <Text style={styles.userText}>{text}</Text>
        ) : (
          <MarkdownRenderer content={text} />
        )}
      </View>
      {timestamp && (
        <Text style={[styles.timestamp, isUser ? styles.userTimestamp : styles.botTimestamp]}>
          {new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
    paddingHorizontal: 12,
  },
  userContainer: {
    alignItems: 'flex-end',
  },
  botContainer: {
    alignItems: 'flex-start',
  },
  bubble: {
    maxWidth: '80%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
  },
  userBubble: {
    backgroundColor: '#1a6ed8',
    borderBottomRightRadius: 4,
  },
  botBubble: {
    backgroundColor: '#242f3d',
    borderBottomLeftRadius: 4,
  },
  userText: {
    color: '#ffffff',
    fontSize: 14,
    lineHeight: 20,
  },
  timestamp: {
    fontSize: 10,
    marginTop: 2,
    marginHorizontal: 4,
  },
  userTimestamp: {
    color: '#6c7883',
  },
  botTimestamp: {
    color: '#6c7883',
  },
});
