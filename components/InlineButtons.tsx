import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';

interface InlineButton {
  text: string;
  callback: string;
  style?: 'primary' | 'secondary' | 'danger';
}

interface InlineButtonsProps {
  buttons: InlineButton[];
  onPress: (callback: string) => void;
  columns?: number;
}

const BUTTON_STYLES = {
  primary: { bg: '#1a6ed8', text: '#ffffff' },
  secondary: { bg: '#242f3d', text: '#e4e4e7' },
  danger: { bg: '#4a1a1a', text: '#f85149' },
};

export default function InlineButtons({ buttons, onPress, columns = 2 }: InlineButtonsProps) {
  if (buttons.length === 0) return null;

  const rows: InlineButton[][] = [];
  for (let i = 0; i < buttons.length; i += columns) {
    rows.push(buttons.slice(i, i + columns));
  }

  return (
    <View style={styles.container}>
      {rows.map((row, rowIdx) => (
        <View key={rowIdx} style={styles.row}>
          {row.map((btn, btnIdx) => {
            const btStyle = BUTTON_STYLES[btn.style ?? 'secondary'];
            return (
              <TouchableOpacity
                key={`${rowIdx}-${btnIdx}`}
                style={[styles.button, { backgroundColor: btStyle.bg, flex: 1 / row.length }]}
                onPress={() => onPress(btn.callback)}
                activeOpacity={0.7}
              >
                <Text style={[styles.buttonText, { color: btStyle.text }]}>{btn.text}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
    marginHorizontal: 12,
    gap: 6,
  },
  row: {
    flexDirection: 'row',
    gap: 6,
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 13,
    fontWeight: '500',
  },
});
