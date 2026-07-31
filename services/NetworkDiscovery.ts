/**
 * NetworkDiscovery — LAN agent discovery for kernel-evolving agents
 *
 * Three runtime scenarios (all must work):
 *   1. Web preview (expo start --web, origin http://localhost:8081)
 *      → CORS blocks normal fetch; use mode:'no-cors' for liveness only.
 *   2. Device on same LAN as agent (direct mode)
 *      → expo-network gives the device IP; scan the /24 subnet.
 *   3. Proxy mode (kernel-central relay, QR pairing)
 *      → No LAN scan; discovery is delegated to the proxy's /agents endpoint.
 *
 * Key correctness notes:
 *   - A CORS-blocked fetch() REJECTS by default. To detect liveness without
 *     reading the body, use `mode: 'no-cors'` — the promise resolves with an
 *     opaque response when the server is alive, regardless of CORS headers.
 *   - Never scan a public IP range. Only private/RFC1918 + link-local subnets.
 *   - Dedupe peers by ip:port across scan stages.
 */

import * as Network from 'expo-network';

export interface DiscoveredPeer {
  id: string;
  name: string;
  ip: string;
  port: number;
  status: 'online' | 'offline';
}

/**
 * Known agent ports. Keep in sync with the services actually running.
 * Verified against the host machine (2026-07-31):
 *   8779  kernel-evolving   ✅ /health
 *   18789 OpenClaw (Olly)   ✅ /health
 *   8765  Fantasia          ✅ /health
 *   8770  Olly Embed        ✅ /health
 *   8767  (unnamed service) ✅ /health  ← was missing
 *   8010  (GPU model svc)   ✅ /health  ← was missing
 *   8766  Olly Voice         ❌ no /health (empty body) — kept but flagged
 *   8642  Hermes Agent       (unverified, kept for compatibility)
 *   8769  Kernel (Base)      (unverified, kept for compatibility)
 *   8005  Private AI         (unverified, kept for compatibility)
 */
const KNOWN_PORTS: { port: number; name: string; id: string }[] = [
  { port: 8779, name: 'Kernel Evolving', id: 'kernel-main' },
  { port: 18789, name: 'OpenClaw (Olly)', id: 'olly' },
  { port: 8765, name: 'Fantasia', id: 'fantasia' },
  { port: 8770, name: 'Olly Embed', id: 'olly-embed' },
  { port: 8767, name: 'Agent Service 8767', id: 'agent-8767' },
  { port: 8010, name: 'GPU Model Service', id: 'gpu-model-8010' },
  { port: 8766, name: 'Olly Voice', id: 'olly-voice' },
  { port: 8642, name: 'Hermes Agent', id: 'hermes' },
  { port: 8769, name: 'Kernel (Base)', id: 'kernel-base' },
  { port: 8005, name: 'Private AI', id: 'private-ai' },
];

const SCAN_CONCURRENCY = 16;
const PROBE_TIMEOUT = 1500;
/** Stop the subnet scan early once this many peers are found. */
const SUBNET_EARLY_EXIT_THRESHOLD = 4;

/**
 * True if `ip` is a private/link-loopback address that is safe to scan.
 * Refuses public ranges (e.g. 169.155.x.x) so we never probe the internet.
 */
export function isPrivateIp(ip: string): boolean {
  if (!ip) return false;
  if (ip === '127.0.0.1' || ip === '::1' || ip === 'localhost') return true;
  const parts = ip.split('.').map(Number);
  if (parts.length !== 4 || parts.some((n) => Number.isNaN(n) || n < 0 || n > 255)) {
    return false;
  }
  const [a, b] = parts;
  // 10.0.0.0/8
  if (a === 10) return true;
  // 172.16.0.0/12
  if (a === 172 && b >= 16 && b <= 31) return true;
  // 192.168.0.0/16
  if (a === 192 && b === 168) return true;
  // 169.254.0.0/16 link-local (NOT 169.155.x.x which is public)
  if (a === 169 && b === 254) return true;
  return false;
}

/**
 * Get the device's local IPv4 address on the LAN.
 * - Native: expo-network.getIpAddressAsync()
 * - Web:    falls back to window.location.hostname, but ONLY if it is a
 *           private IP (localhost is excluded — web preview on localhost
 *           cannot derive a useful LAN subnet and should rely on the
 *           configured server URL probe instead).
 */
export async function getLocalIp(): Promise<string | null> {
  try {
    const ip = await Network.getIpAddressAsync();
    if (ip) {
      const clean = ip.split(':')[0];
      if (clean && isPrivateIp(clean)) return clean;
    }
  } catch {
    // expo-network may fail or be unavailable in web mode
  }
  // Web fallback: only trust a private hostname
  if (typeof window !== 'undefined' && window.location) {
    const host = window.location.hostname;
    if (host && host !== 'localhost' && host !== '127.0.0.1' && host !== '::1' && isPrivateIp(host)) {
      return host;
    }
  }
  return null;
}

/**
 * Parse the /24 subnet base from an IP address.
 */
function subnetBase(ip: string): string {
  const parts = ip.split('.');
  if (parts.length === 4) return `${parts[0]}.${parts[1]}.${parts[2]}`;
  return ip;
}

/**
 * Probe a single ip:port for liveness via /health.
 *
 * Uses `mode: 'no-cors'` so the fetch resolves with an opaque response when
 * the server is alive — this works even when the server sends no CORS
 * headers (the kernel-evolving FastAPI services do not). On a native device
 * (no CORS enforcement) the same call still resolves.
 *
 * Returns the peer if alive, null otherwise.
 */
export async function probeHost(
  ip: string,
  port: number,
  name: string,
  id: string
): Promise<DiscoveredPeer | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PROBE_TIMEOUT);
  try {
    // mode:'no-cors' → opaque response on success (cannot read body, but we
    // only need to know the server answered). On native, this is a normal GET.
    await fetch(`http://${ip}:${port}/health`, {
      method: 'GET',
      mode: 'no-cors',
      signal: controller.signal as any,
    });
    // Fetch resolved → server is alive (opaque or normal response).
    return { id, name, ip, port, status: 'online' };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export type ScanProgress = {
  type: 'quick' | 'subnet' | 'configured';
  currentIp: string;
  currentPort: number;
  found: number;
  total: number;
  currentService: string;
};

/**
 * Probe a single known host for all agent ports.
 * Returns all services running on that host.
 */
export async function probeHostForAllPorts(
  host: string,
  onProgress?: (progress: ScanProgress) => void
): Promise<DiscoveredPeer[]> {
  const results: DiscoveredPeer[] = [];
  // Probe all ports in parallel for a single host — it's only ~10 requests.
  const probes = KNOWN_PORTS.map(({ port, name, id }) =>
    probeHost(host, port, name, id).then((peer) => {
      onProgress?.({
        type: 'configured',
        currentIp: host,
        currentPort: port,
        found: results.length,
        total: KNOWN_PORTS.length,
        currentService: name,
      });
      return peer;
    })
  );
  const settled = await Promise.allSettled(probes);
  for (const r of settled) {
    if (r.status === 'fulfilled' && r.value) results.push(r.value);
  }
  return results;
}

/**
 * Extract the hostname from a configured server URL.
 * e.g. "http://192.168.1.50:8779" → "192.168.1.50"
 */
export function hostFromUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    return parsed.hostname || null;
  } catch {
    return null;
  }
}

/**
 * Dedupe an array of peers by ip:port (later entries win).
 */
export function dedupePeers(peers: DiscoveredPeer[]): DiscoveredPeer[] {
  const map = new Map<string, DiscoveredPeer>();
  for (const p of peers) map.set(`${p.ip}:${p.port}`, p);
  return Array.from(map.values());
}

/**
 * Scan the local /24 subnet for all known agent ports.
 * Returns discovered online peers.
 *
 * Safety: refuses to scan if the local IP is not a private range.
 * Performance: probes in batches of SCAN_CONCURRENCY, exits early once
 * SUBNET_EARLY_EXIT_THRESHOLD peers are found.
 */
export async function scanLan(
  onProgress?: (progress: ScanProgress) => void
): Promise<DiscoveredPeer[]> {
  const localIp = await getLocalIp();
  if (!localIp || !isPrivateIp(localIp)) return [];

  const base = subnetBase(localIp);
  const ips = Array.from({ length: 254 }, (_, i) => `${base}.${i + 1}`);
  const results: DiscoveredPeer[] = [];
  const total = ips.length * KNOWN_PORTS.length;

  for (let i = 0; i < ips.length; i += SCAN_CONCURRENCY) {
    // Early exit: enough peers found, don't flood the network further.
    if (results.length >= SUBNET_EARLY_EXIT_THRESHOLD) break;

    const batch = ips.slice(i, i + SCAN_CONCURRENCY);
    const probes = batch.flatMap((ip) =>
      KNOWN_PORTS.map(({ port, name, id }) => {
        onProgress?.({
          type: 'subnet',
          currentIp: ip,
          currentPort: port,
          found: results.length,
          total,
          currentService: name,
        });
        return probeHost(ip, port, name, id);
      })
    );

    const batchResults = await Promise.allSettled(probes);
    for (const result of batchResults) {
      if (result.status === 'fulfilled' && result.value) {
        results.push(result.value);
      }
    }

    onProgress?.({
      type: 'subnet',
      currentIp: `${batch[0]}..${batch[batch.length - 1]}`,
      currentPort: 0,
      found: results.length,
      total,
      currentService: `Batch ${Math.ceil((i + SCAN_CONCURRENCY) / SCAN_CONCURRENCY)}/${Math.ceil(ips.length / SCAN_CONCURRENCY)}`,
    });
  }

  return dedupePeers(results);
}

/**
 * Quick scan — checks 127.0.0.1 for all known ports.
 * Fast and works in web preview thanks to mode:'no-cors'.
 */
export async function quickScanLocalhost(): Promise<DiscoveredPeer[]> {
  const probes = KNOWN_PORTS.map(({ port, name, id }) => probeHost('127.0.0.1', port, name, id));
  const results = await Promise.allSettled(probes);
  const peers = results
    .filter((r): r is PromiseFulfilledResult<DiscoveredPeer> => r.status === 'fulfilled' && r.value !== null)
    .map((r) => r.value);
  return dedupePeers(peers);
}
