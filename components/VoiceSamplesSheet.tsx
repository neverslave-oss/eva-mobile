/**
 * VoiceSamplesSheet — bottom sheet for listing/switching voice samples
 *
 * Mirrors telegram_bot.py's `/voices` inline keyboard flow:
 *   - Fetches available voice samples from kernelClient.listVoiceSamples()
 *   - Shows each with active indicator (✅ prefix for current)
 *   - Tap to switch (calls kernelClient.setActiveVoice(index))
 */

import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Modal, SafeAreaView } from 'react-native';
import { kernelClient } from '../services/KernelApiClient';
import type { VoiceSample } from '../types';
import { colors, spacing, borderRadius, typography } from '../theme';

interface VoiceSamplesSheetProps {
  visible: boolean;
  onClose: () => void;
  activeSample: string;
  onSwitched?: (name: string) => void;
}

export default function VoiceSamplesSheet({ visible, onClose, activeSample, onSwitched }: VoiceSamplesSheetProps) {
  const [samples, setSamples] = useState<VoiceSample[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!visible) return;
    (async () => {
      setLoading(true);
      try {
        const list = await kernelClient.listVoiceSamples();
        setSamples(list);
      } catch {
        setSamples([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [visible]);

  const handleSelect = async (index: number) => {
    await kernelClient.setActiveVoice(index);
    const selected = samples[index];
    if (selected && onSwitched) onSwitched(selected.name);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <SafeAreaView style={styles.overlay}>
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.panel}>
          <View style={styles.header}>
            <Text style={styles.title}>🎤 Voice Samples</Text>
            <TouchableOpacity onPress={onClose}><Text style={styles.closeBtn}>✕</Text></TouchableOpacity>
          </View>
          {loading ? (
            <Text style={styles.loading}>Loading…</Text>
          ) : samples.length === 0 ? (
            <Text style={styles.empty}>No voice samples found. Add .wav files to the voice-samples directory.</Text>
          ) : (
            <ScrollView>
              {samples.map((s, i) => {
                const isActive = s.name === activeSample || s.active;
                return (
                  <TouchableOpacity
                    key={i}
                    style={[styles.sampleItem, isActive && styles.sampleItemActive]}
                    onPress={() => handleSelect(i)}
                  >
                    <Text style={styles.sampleName}>{isActive ? '✅ ' : ''}{s.name}</Text>
                    {s.path && <Text style={styles.samplePath}>{s.path}</Text>}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  panel: { backgroundColor: '#1c2128', borderTopLeftRadius: borderRadius.lg, borderTopRightRadius: borderRadius.lg, maxHeight: '60%', paddingBottom: 24 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.borderSubtle },
  title: { ...typography.title, fontSize: 15 },
  closeBtn: { fontSize: 18, color: colors.textSecondary, padding: 4 },
  loading: { color: colors.textMuted, padding: spacing.lg, textAlign: 'center' },
  empty: { color: colors.textMuted, padding: spacing.lg, textAlign: 'center', lineHeight: 20 },
  sampleItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: spacing.lg, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.borderSubtle },
  sampleItemActive: { backgroundColor: '#0d2a3f' },
  sampleName: { fontSize: 13, color: '#c9d1d9', fontWeight: '500' },
  samplePath: { fontSize: 10, color: colors.textMuted, marginLeft: 8, flex: 1 },
});