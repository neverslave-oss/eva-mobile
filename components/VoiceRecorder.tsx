import React, { useState } from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';

interface VoiceRecorderProps {
  onStart?: () => void;
  onStop?: (duration: number) => void;
  onCancel?: () => void;
  disabled?: boolean;
}

const MicIcon = ({ active }: { active: boolean }) => (
  <Svg width="32" height="32" viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"
      stroke={active ? '#f85149' : '#ffffff'}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M19 10v2a7 7 0 01-14 0v-2M12 19v4M8 23h8"
      stroke={active ? '#f85149' : '#ffffff'}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export default function VoiceRecorder({
  onStart,
  onStop,
  onCancel,
  disabled = false,
}: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const timerRef = React.useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = React.useRef<number>(0);

  const formatDuration = (ms: number) => {
    const sec = Math.floor(ms / 1000);
    const min = Math.floor(sec / 60);
    const s = sec % 60;
    return `${min}:${s.toString().padStart(2, '0')}`;
  };

  const handlePress = () => {
    if (disabled) return;

    if (!isRecording) {
      setIsRecording(true);
      setDuration(0);
      startTimeRef.current = Date.now();
      timerRef.current = setInterval(() => {
        setDuration(Date.now() - startTimeRef.current);
      }, 100);
      onStart?.();
    } else {
      // Stop recording
      if (timerRef.current) clearInterval(timerRef.current);
      setIsRecording(false);
      onStop?.(duration);
    }
  };

  const handleCancel = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsRecording(false);
    setDuration(0);
    onCancel?.();
  };

  return (
    <View style={[styles.container, isRecording && styles.containerActive]}>
      {isRecording && (
        <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel}>
          <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <Path d="M18 6L6 18M6 6l12 12" stroke="#8b949e" strokeWidth="2" strokeLinecap="round" />
          </Svg>
        </TouchableOpacity>
      )}

      <TouchableOpacity
        style={[styles.micBtn, isRecording && styles.micBtnActive]}
        onPress={handlePress}
        disabled={disabled}
        activeOpacity={0.7}
      >
        <MicIcon active={isRecording} />
      </TouchableOpacity>

      {isRecording && (
        <View style={styles.durationContainer}>
          <View style={styles.recDot} />
          <Text style={styles.duration}>{formatDuration(duration)}</Text>
        </View>
      )}

      {!isRecording && (
        <Text style={styles.hint}>Hold to record</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
  },
  containerActive: {
    flexDirection: 'row',
    gap: 16,
  },
  micBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#1a6ed8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  micBtnActive: {
    backgroundColor: '#4a1a1a',
  },
  cancelBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#242f3d',
    alignItems: 'center',
    justifyContent: 'center',
  },
  durationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  recDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#f85149',
  },
  duration: {
    color: '#e4e4e7',
    fontSize: 18,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  hint: {
    color: '#6c7883',
    fontSize: 12,
    marginTop: 12,
  },
});
