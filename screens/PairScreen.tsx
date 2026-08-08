import React, { useState, useEffect } from 'react';
import { View, Text, Button, StyleSheet, ActivityIndicator } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, SCREEN_NAMES } from '../types';
import { useSettingsStore } from '../stores/settingsStore';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, typeof SCREEN_NAMES.Pair>;
};

export default function PairScreen({ navigation }: Props) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [status, setStatus] = useState('');
  const [confirming, setConfirming] = useState(false);
  const pairDevice = useSettingsStore((s) => s.pairDevice);

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, []);

  const handleBarcodeScanned = async ({ data }: { data: string }) => {
    if (scanned || confirming) return;
    setScanned(true);
    setConfirming(true);
    setStatus('Confirming with server…');
    try {
      // QR format: kc-pair://confirm?token=xxx&secret=xxx&device_id=xxx
      const url = new URL(data);
      const token = url.searchParams.get('token');
      const secret = url.searchParams.get('secret');
      if (!token || !secret) throw new Error('Invalid QR payload - missing token or secret');
      await pairDevice(token, secret, useSettingsStore.getState().proxyUrl);
      navigation.replace(SCREEN_NAMES.BotList);
    } catch (e) {
      setStatus('Pairing failed: ' + String(e instanceof Error ? e.message : e));
      setScanned(false);
    } finally {
      setConfirming(false);
    }
  };

  if (!permission) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.message}>Camera permission is required to scan the pairing QR code.</Text>
        <Button title="Grant Permission" onPress={requestPermission} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFill}
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
      />
      <View style={styles.overlay}>
        <Text style={styles.hint}>
          {confirming ? status : 'Point at the QR code on the kernel-central pairing page'}
        </Text>
        {status !== '' && !confirming && (
          <>
            <Text style={styles.error}>{status}</Text>
            <Button title="Try Again" onPress={() => { setScanned(false); setStatus(''); }} />
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  message: { textAlign: 'center', marginBottom: 16, fontSize: 16 },
  overlay: {
    position: 'absolute',
    bottom: 60,
    left: 24,
    right: 24,
    alignItems: 'center',
    gap: 12,
  },
  hint: {
    color: '#fff',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    textAlign: 'center',
    fontSize: 14,
  },
  error: {
    color: '#ff6b6b',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    textAlign: 'center',
    fontSize: 13,
  },
});
