/**
 * ProviderSheet — Side sheet for provider & model routing (mirrors evolution_dashboard agent-provider-sheet)
 *
 * Shows all call types with provider selector, model override, persist toggle.
 */
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  SafeAreaView,
  ScrollView,
  TextInput,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { colors, typography, borderRadius, spacing } from '../theme';
import { CALL_TYPES, CALL_TYPE_LABELS, PROVIDER_NAMES, ProviderRouting, ProviderRoute, CallType } from '../types';
import { kernelClient } from '../services/KernelApiClient';

const PROVIDER_OPTIONS = ['local', 'openai', 'openrouter', 'anthropic', 'hf', 'copilot'];

interface ProviderSheetProps {
  visible: boolean;
  onClose: () => void;
  routing: ProviderRouting | null;
  onRefresh: () => void;
}

export default function ProviderSheet({ visible, onClose, routing, onRefresh }: ProviderSheetProps) {
  const [localRouting, setLocalRouting] = useState<Record<string, ProviderRoute>>({});
  const [modelOverrides, setModelOverrides] = useState<Record<string, string>>({});
  const [persist, setPersist] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (routing?.routing) {
      setLocalRouting(routing.routing);
      const overrides: Record<string, string> = {};
      for (const [ct, info] of Object.entries(routing.routing)) {
        if (info.model) overrides[ct] = info.model;
      }
      setModelOverrides(overrides);
    }
  }, [routing]);

  const handleApply = async () => {
    setLoading(true);
    setMessage('');
    let success = true;
    for (const ct of CALL_TYPES) {
      const entry = localRouting[ct];
      if (!entry) continue;
      const ok = await kernelClient.setProvider(
        ct,
        entry.provider,
        modelOverrides[ct] || undefined,
        persist
      );
      if (!ok) success = false;
    }
    setLoading(false);
    if (success) {
      setMessage('✅ Routing saved');
      onRefresh();
    } else {
      setMessage('⚠️ Some updates failed');
    }
  };

  const handleProviderChange = (ct: CallType, provider: string) => {
    setLocalRouting((prev) => ({
      ...prev,
      [ct]: { ...(prev[ct] || { provider: 'local', streaming: false }), provider },
    }));
  };

  const handleModelChange = (ct: CallType, model: string) => {
    setModelOverrides((prev) => ({ ...prev, [ct]: model }));
  };

  return (
    <Modal visible={visible} animationType="none" transparent>
      <SafeAreaView style={styles.container}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.topline}>
            <Text style={styles.title}>Provider & Model Routing</Text>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Text style={styles.closeText}>Close</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scroll} keyboardShouldPersistTaps="handled">
            {CALL_TYPES.map((ct) => (
              <View key={ct} style={styles.row}>
                <Text style={styles.rowLabel}>{CALL_TYPE_LABELS[ct]}</Text>
                <View style={styles.pickerRow}>
                  <View style={styles.providerPicker}>
                    {PROVIDER_OPTIONS.map((p) => (
                      <TouchableOpacity
                        key={p}
                        style={[
                          styles.provOpt,
                          localRouting[ct]?.provider === p && styles.provOptActive,
                        ]}
                        onPress={() => handleProviderChange(ct, p)}
                      >
                        <Text
                          style={[
                            styles.provOptText,
                            localRouting[ct]?.provider === p && styles.provOptTextActive,
                          ]}
                        >
                          {PROVIDER_NAMES[p] || p}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <TextInput
                    style={styles.modelInput}
                    value={modelOverrides[ct] || ''}
                    onChangeText={(v) => handleModelChange(ct, v)}
                    placeholder="Model override"
                    placeholderTextColor={colors.textMuted}
                  />
                </View>
              </View>
            ))}

            <View style={styles.controlsRow}>
              <View style={styles.persistRow}>
                <Switch
                  value={persist}
                  onValueChange={setPersist}
                  trackColor={{ false: '#30363d', true: colors.accent }}
                  thumbColor={persist ? '#fff' : '#8b949e'}
                />
                <Text style={styles.persistLabel}>Persist</Text>
              </View>
              <View style={styles.actionsRow}>
                <TouchableOpacity style={styles.actionBtn} onPress={() => { onRefresh(); setMessage(''); }}>
                  <Text style={styles.actionText}>↺ Refresh</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.applyBtn]}
                  onPress={handleApply}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={[styles.actionText, { color: '#fff' }]}>Apply</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {message ? (
              <Text style={styles.message}>{message}</Text>
            ) : null}
          </ScrollView>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, flexDirection: 'row', justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(3, 7, 13, 0.58)' },
  sheet: {
    width: '94%',
    maxWidth: 480,
    backgroundColor: colors.bgPrimary,
    borderLeftWidth: 1,
    borderLeftColor: '#30363d',
    padding: spacing.md,
    elevation: 10,
  },
  topline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#30363d',
    paddingBottom: spacing.sm,
  },
  title: { ...typography.title, fontSize: 13, textTransform: 'uppercase', letterSpacing: 1, color: colors.textSecondary },
  closeBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: colors.bgSurface,
    borderWidth: 1,
    borderColor: '#30363d',
    borderRadius: borderRadius.md,
  },
  closeText: { fontSize: 12, color: colors.textSecondary },
  scroll: { flex: 1 },
  row: {
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: '#21262d',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    backgroundColor: colors.bgSurface,
  },
  rowLabel: { fontSize: 12, fontWeight: '600', color: colors.textSecondary, marginBottom: spacing.sm },
  pickerRow: { gap: spacing.sm },
  providerPicker: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  provOpt: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: '#30363d',
    backgroundColor: colors.bgSurface,
  },
  provOptActive: { borderColor: colors.accent, backgroundColor: colors.accentBg },
  provOptText: { fontSize: 10, color: colors.textMuted },
  provOptTextActive: { color: colors.accent, fontWeight: '600' },
  modelInput: {
    backgroundColor: colors.accentBg,
    color: colors.textPrimary,
    fontSize: 12,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: '#30363d',
    marginTop: 4,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  persistRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  persistLabel: { fontSize: 12, color: colors.textSecondary },
  actionsRow: { flexDirection: 'row', gap: spacing.sm },
  actionBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.bgSurface,
    borderWidth: 1,
    borderColor: '#30363d',
    borderRadius: borderRadius.md,
  },
  applyBtn: { backgroundColor: colors.accent, borderColor: colors.accent },
  actionText: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },
  message: {
    marginTop: spacing.md,
    fontSize: 12,
    color: colors.success,
    textAlign: 'center',
  },
});
