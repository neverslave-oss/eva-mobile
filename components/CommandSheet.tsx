/**
 * CommandSheet — Bottom sheet command chip grid (mirrors evolution_dashboard agent-command-sheet)
 *
 * Tapping a chip fills the composer with the command, same as Telegram bot button behavior.
 */
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { colors, typography, borderRadius, spacing } from '../theme';

export interface CommandEntry {
  command: string;
  description: string;
}

const DEFAULT_COMMANDS: CommandEntry[] = [
  { command: '/help', description: 'Show available commands' },
  { command: '/status', description: 'Agent status & model info' },
  { command: '/skills', description: 'List loaded skills' },
  { command: '/routines', description: 'List active routines' },
  { command: '/models', description: 'Show active models' },
  { command: '/local', description: 'Switch to local model' },
  { command: '/cloud', description: 'Cloud provider setup wizard' },
  { command: '/provider', description: 'Provider routing table' },
  { command: '/thoughts', description: 'Show kernel\'s thoughts' },
  { command: '/evolve', description: 'Trigger evolution cycle' },
  { command: '/replica', description: 'Spawn replica agent' },
  { command: '/voices', description: 'Voice sample management' },
  { command: '/voice-clone', description: 'Clone your voice' },
  { command: '/verbose', description: 'Toggle verbose logging' },
  { command: '/system', description: 'System diagnostics' },
  { command: '/version', description: 'Agent version info' },
  { command: '/workspaces', description: 'List agent workspaces' },
  { command: '/new', description: 'Clear conversation' },
  { command: '/init', description: 'Reinitialize agent' },
];

interface CommandSheetProps {
  visible: boolean;
  onClose: () => void;
  onSelectCommand: (command: string) => void;
  commands?: CommandEntry[];
}

export default function CommandSheet({
  visible,
  onClose,
  onSelectCommand,
  commands = DEFAULT_COMMANDS,
}: CommandSheetProps) {
  return (
    <Modal visible={visible} animationType="none" transparent>
      <SafeAreaView style={styles.container}>
        {/* Backdrop */}
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />

        {/* Sheet */}
        <View style={styles.sheet}>
          <View style={styles.topline}>
            <Text style={styles.title}>Commands</Text>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Text style={styles.closeText}>Close</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.grid}
            keyboardShouldPersistTaps="handled"
          >
            {commands.map((cmd) => (
              <TouchableOpacity
                key={cmd.command}
                style={styles.chip}
                onPress={() => {
                  onSelectCommand(cmd.command);
                  onClose();
                }}
              >
                <Text style={styles.chipCmd}>{cmd.command}</Text>
                <Text style={styles.chipDesc} numberOfLines={1}>
                  {cmd.description}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(3, 7, 13, 0.58)',
  },
  sheet: {
    backgroundColor: '#11161e',
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    borderTopWidth: 1,
    borderTopColor: '#30363d',
    maxHeight: '58%',
    paddingHorizontal: spacing.lg,
    paddingBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.5,
    shadowRadius: 28,
    elevation: 16,
  },
  topline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#30363d',
    marginBottom: spacing.sm,
  },
  title: {
    ...typography.title,
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: colors.textSecondary,
  },
  closeBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: colors.bgSurface,
    borderWidth: 1,
    borderColor: '#30363d',
    borderRadius: borderRadius.md,
  },
  closeText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  scroll: {
    maxHeight: '90%',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    paddingTop: spacing.xs,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.bgSurface,
    borderWidth: 1,
    borderColor: '#30363d',
    borderRadius: borderRadius.full,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  chipCmd: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.accent,
  },
  chipDesc: {
    fontSize: 11,
    color: colors.textMuted,
    maxWidth: 120,
  },
});
