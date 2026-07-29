import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Message } from '../types';
import MarkdownRenderer from './MarkdownRenderer';
import { colors, borderRadius } from '../theme';

interface MessageBubbleProps {
  message: Message;
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <View>
      <View style={styles.bubbleWrapper}>
        {/* Bubble tail — v1 style: triangle at bottom corner */}
        {isUser ? (
          <>
            <View style={[styles.bubble, styles.userBubble]}>
              <Text style={styles.userText}>{message.text}</Text>
            </View>
            <View style={styles.tailRight} />
          </>
        ) : (
          <>
            <View style={[styles.bubble, styles.botBubble]}>
              <MarkdownRenderer content={message.text} />
            </View>
            <View style={styles.tailLeft} />
          </>
        )}
      </View>
      {message.timestamp && (
        <Text style={[styles.timestamp, isUser ? styles.userTimestamp : styles.botTimestamp]}>
          {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  bubbleWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  bubble: {
    maxWidth: 260,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  userBubble: {
    backgroundColor: colors.bgBubbleUser,
    borderTopLeftRadius: borderRadius.lg,
    borderTopRightRadius: borderRadius.lg,
    borderBottomLeftRadius: borderRadius.lg,
    borderBottomRightRadius: 4,
  },
  botBubble: {
    backgroundColor: colors.bgBubbleBot,
    borderTopLeftRadius: borderRadius.lg,
    borderTopRightRadius: borderRadius.lg,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: borderRadius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderLight,
  },
  userText: {
    color: '#ffffff',
    fontSize: 14,
    lineHeight: 20,
  },
  // Bubble tails — v1's CSS pseudo-elements recreated as View triangles
  tailRight: {
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 0,
    borderBottomWidth: 8,
    borderLeftColor: colors.bgBubbleUser,
    borderRightColor: 'transparent',
    borderBottomColor: 'transparent',
    marginLeft: -2,
  },
  tailLeft: {
    width: 0,
    height: 0,
    borderRightWidth: 8,
    borderLeftWidth: 0,
    borderBottomWidth: 8,
    borderRightColor: colors.bgBubbleBot,
    borderLeftColor: 'transparent',
    borderBottomColor: 'transparent',
    marginRight: -2,
  },
  timestamp: {
    fontSize: 10,
    marginTop: 2,
    marginHorizontal: 4,
  },
  userTimestamp: {
    color: colors.textDim,
    textAlign: 'right',
  },
  botTimestamp: {
    color: colors.textDim,
    textAlign: 'left',
  },
});