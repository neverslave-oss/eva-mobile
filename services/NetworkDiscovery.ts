/**
 * NetworkDiscovery — Real LAN subnet scanning for kernel-evolving agents
 *
 * Uses expo-network to get device IP, then probes common agent ports
 * across the /24 subnet. Each host is tested for /health endpoint.
 */

import * as Network from 'expo-network';

export interface DiscoveredPeer {
  id: string;
  name: string;
  ip: string;
  port: number;
  status: 'online' | 'offline';
}

const KNOWN_PORTS: { port: number; name: string; id: string }[] = [
  // Kernel-evolving agent
  { port: 8779, name: 'Kernel Evolving', id: 'kernel-main' },
  // OpenClaw gateway
  { port: 18789, name: 'OpenClaw (Olly)', id: 'olly' },
  // Hermes Agent default API integration port
  { port: 8642, name: 'Hermes Agent', id: 'hermes' },
  // Additional services
  { port: 8769, name: 'Kernel (Base)', id: 'kernel-base' },
  { port: 8765, name: 'Fantasia', id: 'fantasia' },
  { port: 8766, name: 'Olly Voice', id: 'olly-voice' },
  { port: 8770, name: 'Olly Embed', id: 'olly-embed' },
  { port: 8005, name: 'Private AI', id: 'private-ai' },
];

const SCAN_CONCURRENCY = 8;
const PROBE_TIMEOUT = 2000;

/**
 * Get the device's local IPv4 address on the LAN.
 */
export async function getLocalIp(): Promise<string | null> {
  try {
    const ip = await Network.getIpAddressAsync();
    // expo-network may return an IPv4 string; strip port if present
    return ip?.split(':')[0] ?? null;
  } catch {
    return null;
  }
}

/**
 * Parse the /24 subnet from an IP address.
 */
function subnetBase(ip: string): string {
  const parts = ip.split('.');
  if (parts.length === 4) return `${parts[0]}.${parts[1]}.${parts[2]}`;
  return ip;
}

/**
 * Probe a single IP:port for a /health endpoint.
 * Returns the service name if reachable, null otherwise.
 */
export async function probeHost(ip: string, port: number, name: string, id: string): Promise<DiscoveredPeer | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), PROBE_TIMEOUT);

    const res = await fetch(`http://${ip}:${port}/health`, {
      method: 'GET',
      signal: controller.signal as any,
    });
    clearTimeout(timer);

    if (res.ok || res.status === 200) {
      return { id, name, ip, port, status: 'online' };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Scan the local /24 subnet for all known agent ports.
 * Returns discovered online peers.
 */
export async function scanLan(
  onProgress?: (found: number, total: number) => void
): Promise<DiscoveredPeer[]> {
  const localIp = await getLocalIp();
  if (!localIp) return [];

  const base = subnetBase(localIp);
  const ips = Array.from({ length: 254 }, (_, i) => `${base}.${i + 1}`);
  const results: DiscoveredPeer[] = [];

  // For each IP, probe all known ports in parallel
  let attempted = 0;
  const total = ips.length * KNOWN_PORTS.length;

  for (let i = 0; i < ips.length; i += SCAN_CONCURRENCY) {
    const batch = ips.slice(i, i + SCAN_CONCURRENCY);
    const probes = batch.flatMap((ip) =>
      KNOWN_PORTS.map(({ port, name, id }) => probeHost(ip, port, name, id))
    );

    const batchResults = await Promise.allSettled(probes);
    for (const result of batchResults) {
      if (result.status === 'fulfilled' && result.value) {
        results.push(result.value);
      }
    }

    attempted += batch.length;
    onProgress?.(results.length, attempted * KNOWN_PORTS.length);
  }

  return results;
}

/**
 * Quick scan — only checks the host's own IP for common ports.
 * Useful for initial connection without flooding the network.
 */
export async function quickScanLocalhost(): Promise<DiscoveredPeer[]> {
  const probes = KNOWN_PORTS.map(({ port, name, id }) => probeHost('127.0.0.1', port, name, id));
  const results = await Promise.allSettled(probes);
  return results
    .filter((r): r is PromiseFulfilledResult<DiscoveredPeer> => r.status === 'fulfilled' && r.value !== null)
    .map((r) => r.value);
}
