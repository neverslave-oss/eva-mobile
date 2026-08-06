---
date: 2026-08-06
agent: copilot
topic: Feature — QR device pairing screen for kernel-mobile-v2
tags: [react-native, expo, qr, pairing, xp5]
status: done
depends_on: [XP1a (kernel-central PrivateChannel fix)]
---

# Feature: QR device pairing screen (XP5)

## Context

kernel-central's web UI generates a QR code containing a `pair_token` and `pair_secret` for device pairing. kernel-desktop-v1 uses this to establish a WebSocket tunnel. kernel-mobile-v2 has no QR scanning or camera code at all — `settingsStore` has a `mode: 'direct'|'proxy'` field but no `pairDevice()` action, and `KernelApiClient` has no `confirmPairing()` method.

**Hard dependency:** XP1a (kernel-central PrivateChannel fix) must be deployed first. Until private channels are in place the mobile client can't authenticate to the relay channel after pairing.

## Goal

Add a `PairScreen` that lets users scan the kernel-central QR code, authenticate, and switch to proxy mode automatically.

## Files to create/change

- `screens/PairScreen.tsx` — **new** — full pairing flow (scan → confirm → navigate)
- `services/KernelApiClient.ts` — add `confirmPairing(token: string, secret: string): Promise<{success: boolean, device_id?: string}>`
- `stores/settingsStore.ts` — add `pairDevice(token: string, secret: string, centralUrl: string): Promise<void>` action
- `navigation/` — add `PairScreen` to the navigator
- `package.json` — add `expo-barcode-scanner` or `expo-camera` (v14+)

## QR code format (from kernel-central)

kernel-central's pairing web page encodes a JSON payload in the QR:
```json
{"token": "<pair_token>", "secret": "<pair_secret>", "url": "http://<central-host>:8081"}
```
The mobile app scans this, calls `POST /api/devices/{token}/confirm` with `{secret}` in the body, and on success stores `{mode: 'proxy', centralUrl, deviceToken, deviceSecret}` in settings.

## Implementation plan

### package.json

```
expo install expo-barcode-scanner
```
Or with expo-camera v14+:
```
expo install expo-camera
```
Add to `app.json` plugins: `["expo-barcode-scanner"]` or equivalent.

### KernelApiClient.ts

```typescript
async confirmPairing(
  centralUrl: string,
  token: string,
  secret: string
): Promise<{ success: boolean; device_id?: string }> {
  const res = await fetch(`${centralUrl}/api/devices/${token}/confirm`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ secret }),
  });
  if (!res.ok) return { success: false };
  const data = await res.json();
  return { success: true, device_id: data.device_id };
}
```

### settingsStore.ts

```typescript
pairDevice: async (token: string, secret: string, centralUrl: string) => {
  const client = new KernelApiClient(centralUrl);
  const result = await client.confirmPairing(centralUrl, token, secret);
  if (!result.success) throw new Error('Pairing confirmation failed');
  set({
    mode: 'proxy',
    centralUrl,
    deviceToken: token,
    deviceSecret: secret,
  });
},
```

### PairScreen.tsx (new)

```tsx
import { BarCodeScanner } from 'expo-barcode-scanner';
// or: import { CameraView } from 'expo-camera';

export default function PairScreen({ navigation }) {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [status, setStatus] = useState('');
  const pairDevice = useSettingsStore(s => s.pairDevice);

  useEffect(() => {
    BarCodeScanner.requestPermissionsAsync().then(({ status }) =>
      setHasPermission(status === 'granted')
    );
  }, []);

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    setScanned(true);
    try {
      const { token, secret, url } = JSON.parse(data);
      setStatus('Confirming with server...');
      await pairDevice(token, secret, url);
      navigation.replace('Home'); // or wherever
    } catch (e) {
      setStatus('Pairing failed: ' + String(e));
      setScanned(false);
    }
  };

  if (hasPermission === null) return <Text>Requesting camera permission...</Text>;
  if (!hasPermission) return <Text>Camera permission denied.</Text>;

  return (
    <View style={{ flex: 1 }}>
      <BarCodeScanner onBarCodeScanned={scanned ? undefined : handleBarCodeScanned} style={StyleSheet.absoluteFillObject} />
      {status ? <Text style={styles.status}>{status}</Text> : null}
      {scanned && <Button title="Scan Again" onPress={() => setScanned(false)} />}
    </View>
  );
}
```

### navigation/

Add `PairScreen` to the root navigator (a button in Settings or initial setup flow to trigger it).

## Acceptance criteria

- [ ] Camera permission is requested at screen mount
- [ ] Scanning a valid kernel-central QR confirms pairing with the server
- [ ] On success, `settingsStore.mode` is set to `proxy`, `centralUrl`/`deviceToken`/`deviceSecret` stored
- [ ] On success, navigates back to Home
- [ ] On failure (network error, wrong secret), shows error and allows retry
- [ ] Does not hardcode any URL — all values come from the QR payload

## Related

- XP1a (kernel-central PrivateChannel) — **must be deployed first**
- Full cross-repo audit: `kernel-evolving/.specs/audits/AUDIT-2026-08-06-crossplatform-onboarding-pairing.md`
