import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, ScrollView } from 'react-native';

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
  visible: boolean;
  onClose?: () => void;
}

const EMOJIS = [
  ['👍', '👎', '❤️', '🔥', '💯', '✅', '❌', '❓'],
  ['😂', '😊', '😢', '😡', '🤔', '😮', '🙄', '😴'],
  ['🎉', '💡', '🚀', '📌', '💪', '👀', '🙏', '✨'],
  ['🔄', '📝', '🔧', '⚡', '🧠', '🎯', '🔗', '📊'],
  ['😄', '😅', '🤣', '😁', '🙂', '😉', '😌', '🥺'],
  ['👋', '🤝', '✌️', '💅', '👏', '🙌', '🤌', '🫡'],
];

export default function EmojiPicker({ onSelect, visible, onClose }: EmojiPickerProps) {
  if (!visible) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Emoji</Text>
        {onClose && (
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.closeBtn}>✕</Text>
          </TouchableOpacity>
        )}
      </View>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {EMOJIS.map((row, rowIdx) => (
          <View key={rowIdx} style={styles.row}>
            {row.map((emoji, colIdx) => (
              <TouchableOpacity
                key={`${rowIdx}-${colIdx}`}
                style={styles.emojiBtn}
                onPress={() => onSelect(emoji)}
              >
                <Text style={styles.emoji}>{emoji}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#17212b',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: 260,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#242f3d',
  },
  title: {
    color: '#8b949e',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  closeBtn: {
    color: '#8b949e',
    fontSize: 16,
  },
  scroll: {
    paddingHorizontal: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 4,
  },
  emojiBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  emoji: {
    fontSize: 24,
  },
});
