import React, { useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Message, InlineButton } from '../types';
import MarkdownRenderer from './MarkdownRenderer';
import InlineButtons from './InlineButtons';
import { voiceService } from '../services/VoiceService';
import { colors, borderRadius } from '../theme';

interface MessageBubbleProps {
  message: Message;
  onButtonPress?: (callback: string) => void;
}

export default function MessageBubble({ message, onButtonPress }: MessageBubbleProps) {
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
      {/* Audio playback button for voice clone replies */}
      {!isUser && message.audioUri && (
        <TouchableOpacity style={styles.audioPlayBtn} onPress={() => voiceService.playAudio(message.audioUri!)} activeOpacity={0.7}>
          <Text style={styles.audioPlayBtnText}>🔊 Play voice</Text>
        </TouchableOpacity>
      )}
      {/* Inline buttons — mirrors telegram_bot.py reply_markup.inline_keyboard */}
      {!isUser && message.buttons && message.buttons.length > 0 && onButtonPress && (
        <View style={styles.buttonsContainer}>
          {message.buttons.map((row, rowIdx) => (
            <View key={rowIdx} style={styles.buttonRow}>
              {row.map((btn, btnIdx) => (
                <TouchableOpacity
                  key={`${rowIdx}-${btnIdx}`}
                  style={[styles.inlineBtn, { flex: 1 / row.length }]}
                  onPress={() => onButtonPress(btn.callback)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.inlineBtnText}>{btn.text}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ))}
        </View>
      )}
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
  audioPlayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginTop: 4,
    marginLeft: 4,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#1a3a5c',
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderLight,
  },
  audioPlayBtnText: {
    fontSize: 11,
    color: '#7eb8e0',
    fontWeight: '500',
  },
  botTimestamp: {
    color: colors.textDim,
    textAlign: 'left',
  },
  // Inline buttons (mirrors telegram_bot.py inline_keyboard)
  buttonsContainer: {
    marginTop: 6,
    marginHorizontal: 4,
    gap: 4,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 4,
  },
  inlineBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#242f3d',
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderLight,
    alignItems: 'center',
  },
  inlineBtnText: {
    fontSize: 12,
    color: '#e4e4e7',
    fontWeight: '500',
  },
});
