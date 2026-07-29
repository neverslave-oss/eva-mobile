import React from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  FlatList,
  Keyboard,
} from 'react-native';

interface SlashCommand {
  name: string;
  description: string;
  icon?: string;
}

interface SlashCommandSheetProps {
  commands: SlashCommand[];
  visible: boolean;
  onSelect: (command: string) => void;
  filter?: string;
  onClose?: () => void;
}

const DEFAULT_COMMANDS: SlashCommand[] = [
  { name: '/help', description: 'Show available commands', icon: '❓' },
  { name: '/clear', description: 'Clear conversation', icon: '🗑️' },
  { name: '/summarize', description: 'Summarize this chat', icon: '📝' },
  { name: '/export', description: 'Export conversation', icon: '📤' },
  { name: '/tools', description: 'Toggle tools mode', icon: '🔧' },
  { name: '/voice', description: 'Toggle voice mode', icon: '🎤' },
  { name: '/theme', description: 'Switch theme', icon: '🎨' },
  { name: '/mode', description: 'Switch agent mode', icon: '⚡' },
];

export default function SlashCommandSheet({
  commands = DEFAULT_COMMANDS,
  visible,
  onSelect,
  filter,
  onClose,
}: SlashCommandSheetProps) {
  if (!visible) return null;

  const filtered = filter
    ? commands.filter((c) => c.name.includes(filter.toLowerCase()) || c.description.includes(filter))
    : commands;

  if (filtered.length === 0) return null;

  return (
    <View style={styles.container}>
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.name}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.item}
            onPress={() => {
              onSelect(item.name);
              Keyboard.dismiss();
            }}
          >
            {item.icon && <Text style={styles.icon}>{item.icon}</Text>}
            <View style={styles.textContainer}>
              <Text style={styles.command}>{item.name}</Text>
              <Text style={styles.description}>{item.description}</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#17212b',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: 240,
    paddingVertical: 4,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 12,
  },
  icon: {
    fontSize: 18,
    width: 28,
    textAlign: 'center',
  },
  textContainer: {
    flex: 1,
  },
  command: {
    color: '#e4e4e7',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'monospace',
  },
  description: {
    color: '#6c7883',
    fontSize: 11,
    marginTop: 2,
  },
});
