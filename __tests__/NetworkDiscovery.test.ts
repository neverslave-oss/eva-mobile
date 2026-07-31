/**
 * NetworkDiscovery.test.ts — Unit tests for LAN agent scanning
 *
 * Uses jest.mock to replace expo-network, and mocks global.fetch
 * to simulate probe responses for /health endpoints.
 */

jest.mock('expo-network', () => {
  const mockIp: { current: string | null } = { current: '192.168.1.100' };
  return {
    __esModule: true,
    getIpAddressAsync: jest.fn(() => Promise.resolve(mockIp.current)),
    __setMockIp: (ip: string | null) => { mockIp.current = ip; },
  };
});

import { getIpAddressAsync } from 'expo-network';
import { getLocalIp, probeHost, scanLan, quickScanLocalhost, isPrivateIp, dedupePeers } from '../services/NetworkDiscovery';

// Helper to set mock IP from the test
const setMockIp = (ip: string | null) => {
  (getIpAddressAsync as jest.Mock).mockResolvedValue(ip);
};

// ── Helpers ─────────────────────────────────────────────────────────────────

function mockFetchHealthy(ip: string, port: number) {
  const url = `http://${ip}:${port}/health`;
  (globalThis as any).fetch = jest.fn().mockImplementation((reqUrl: string) => {
    if (reqUrl === url) {
      return Promise.resolve({ ok: true, status: 200 } as Response);
    }
    return Promise.reject(new Error('unexpected URL'));
  });
}

function mockFetchUnreachable() {
  (globalThis as any).fetch = jest.fn().mockRejectedValue(new Error('Network error'));
}

function mockFetchAbortable() {
  (globalThis as any).fetch = jest.fn((_url: string, opts?: RequestInit) => {
    return new Promise((_resolve, reject) => {
      const signal = (opts as any)?.signal;
      if (signal) {
        signal.addEventListener('abort', () => {
          reject(new DOMException('Aborted', 'AbortError'));
        });
      }
    });
  });
}

function mockFetchPartial(healthyMap: Map<string, boolean>) {
  (globalThis as any).fetch = jest.fn().mockImplementation((url: string) => {
    if (healthyMap.has(url)) {
      return Promise.resolve(healthyMap.get(url)
        ? ({ ok: true, status: 200 } as Response)
        : ({ ok: false, status: 404 } as Response));
    }
    return Promise.reject(new Error('unexpected URL'));
  });
}

// ── isPrivateIp ─────────────────────────────────────────────────────────────

describe('isPrivateIp()', () => {
  it('accepts loopback', () => {
    expect(isPrivateIp('127.0.0.1')).toBe(true);
    expect(isPrivateIp('localhost')).toBe(true);
  });
  it('accepts 10.x', () => {
    expect(isPrivateIp('10.0.0.5')).toBe(true);
  });
  it('accepts 172.16-31.x', () => {
    expect(isPrivateIp('172.16.0.1')).toBe(true);
    expect(isPrivateIp('172.31.255.255')).toBe(true);
  });
  it('rejects 172.32.x (public)', () => {
    expect(isPrivateIp('172.32.0.1')).toBe(false);
  });
  it('accepts 192.168.x', () => {
    expect(isPrivateIp('192.168.1.100')).toBe(true);
  });
  it('accepts 169.254.x link-local', () => {
    expect(isPrivateIp('169.254.1.1')).toBe(true);
  });
  it('rejects public 169.155.x (the WAN IP seen in web preview)', () => {
    expect(isPrivateIp('169.155.232.90')).toBe(false);
  });
  it('rejects empty / invalid', () => {
    expect(isPrivateIp('')).toBe(false);
    expect(isPrivateIp('not-an-ip')).toBe(false);
  });
});

// ── dedupePeers ─────────────────────────────────────────────────────────────

describe('dedupePeers()', () => {
  it('removes duplicates by ip:port, keeping the last', () => {
    const peers = [
      { id: 'a', name: 'A', ip: '127.0.0.1', port: 8779, status: 'online' as const },
      { id: 'b', name: 'B', ip: '192.168.1.5', port: 8779, status: 'online' as const },
      { id: 'a2', name: 'A (dup)', ip: '127.0.0.1', port: 8779, status: 'online' as const },
    ];
    const out = dedupePeers(peers);
    expect(out.length).toBe(2);
    const dup = out.find((p) => p.ip === '127.0.0.1' && p.port === 8779);
    expect(dup?.name).toBe('A (dup)');
  });
  it('passes through unique peers', () => {
    const peers = [
      { id: 'a', name: 'A', ip: '127.0.0.1', port: 8779, status: 'online' as const },
      { id: 'b', name: 'B', ip: '127.0.0.1', port: 18789, status: 'online' as const },
    ];
    expect(dedupePeers(peers).length).toBe(2);
  });
});

// ── getLocalIp ──────────────────────────────────────────────────────────────

describe('getLocalIp()', () => {
  beforeEach(() => {
    setMockIp('192.168.1.100');
  });

  it('returns the mocked private LAN IP', async () => {
    const ip = await getLocalIp();
    expect(ip).toBe('192.168.1.100');
  });

  it('strips port suffix if present', async () => {
    setMockIp('10.0.0.5:8080');
    const ip = await getLocalIp();
    expect(ip).toBe('10.0.0.5');
  });

  it('returns null when expo-network fails', async () => {
    setMockIp(null);
    const ip = await getLocalIp();
    expect(ip).toBeNull();
  });

  it('rejects a public IP from expo-network (never scan public ranges)', async () => {
    setMockIp('169.155.232.90');
    const ip = await getLocalIp();
    expect(ip).toBeNull();
  });
});

// ── probeHost ───────────────────────────────────────────────────────────────

describe('probeHost()', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('returns a DiscoveredPeer when /health responds 200', async () => {
    mockFetchHealthy('192.168.1.50', 8779);
    const result = await probeHost('192.168.1.50', 8779, 'Kernel Evolving', 'kernel-main');
    expect(result).not.toBeNull();
    expect(result!.id).toBe('kernel-main');
    expect(result!.name).toBe('Kernel Evolving');
    expect(result!.ip).toBe('192.168.1.50');
    expect(result!.port).toBe(8779);
    expect(result!.status).toBe('online');
  });

  it('returns null when fetch is rejected (unreachable)', async () => {
    mockFetchUnreachable();
    const result = await probeHost('192.168.1.99', 8779, 'Kernel Evolving', 'kernel-main');
    expect(result).toBeNull();
  });

  it('returns a DiscoveredPeer when /health resolves (opaque no-cors response)', async () => {
    // mode:'no-cors' resolves with an opaque response (status 0, ok false)
    // when the server is alive — even without CORS headers.
    (globalThis as any).fetch = jest.fn().mockResolvedValue({ ok: false, status: 0, type: 'opaque' } as Response);
    const result = await probeHost('192.168.1.50', 8779, 'Kernel Evolving', 'kernel-main');
    expect(result).not.toBeNull();
    expect(result!.status).toBe('online');
  });

  it('returns null when fetch is rejected (CORS-blocked without no-cors, or unreachable)', async () => {
    // A real CORS rejection (no no-cors) throws — probeHost must treat that
    // as unreachable. (With no-cors set, alive servers resolve instead.)
    mockFetchUnreachable();
    const result = await probeHost('192.168.1.99', 8779, 'Kernel Evolving', 'kernel-main');
    expect(result).toBeNull();
  });

  it('aborts and returns null after PROBE_TIMEOUT', async () => {
    mockFetchAbortable();
    const probe = probeHost('192.168.1.50', 8779, 'Kernel Evolving', 'kernel-main');
    jest.advanceTimersByTime(2500);
    await expect(probe).resolves.toBeNull();
  });
});

// ── scanLan ─────────────────────────────────────────────────────────────────

describe('scanLan()', () => {
  beforeEach(() => {
    setMockIp('192.168.1.100');
    jest.useFakeTimers();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('discovers the one healthy host out of 254', async () => {
    // Only 192.168.1.50:8779 answers
    mockFetchPartial(new Map([
      ['http://192.168.1.50:8779/health', true],
    ]));

    const peers = await scanLan();
    expect(peers.length).toBeGreaterThanOrEqual(1);
    const kernel = peers.find((p) => p.id === 'kernel-main');
    expect(kernel).toBeDefined();
    expect(kernel!.ip).toBe('192.168.1.50');
  });

  it('returns empty array when no hosts respond', async () => {
    mockFetchUnreachable();
    const peers = await scanLan();
    expect(peers).toEqual([]);
  });

  it('returns empty array when local IP cannot be determined', async () => {
    setMockIp(null);
    const peers = await scanLan();
    expect(peers).toEqual([]);
  });

  it('calls onProgress callback with found/total numbers', async () => {
    mockFetchPartial(new Map([
      ['http://192.168.1.100:8779/health', true],
    ]));

    const onProgress = jest.fn();
    await scanLan(onProgress);
    expect(onProgress).toHaveBeenCalled();
    // Verify progress includes ScanProgress fields
    const call = onProgress.mock.calls[0][0];
    expect(call).toHaveProperty('type', 'subnet');
    expect(call).toHaveProperty('currentIp');
    expect(call).toHaveProperty('currentPort');
    expect(call).toHaveProperty('found');
    expect(call).toHaveProperty('total');
    expect(call).toHaveProperty('currentService');
  });
});

// ── quickScanLocalhost ──────────────────────────────────────────────────────

describe('quickScanLocalhost()', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('finds kernel-evolving on 127.0.0.1:8779 when it responds', async () => {
    mockFetchPartial(new Map([
      ['http://127.0.0.1:8779/health', true],
    ]));

    const peers = await quickScanLocalhost();
    expect(peers.length).toBe(1);
    expect(peers[0].id).toBe('kernel-main');
    expect(peers[0].name).toBe('Kernel Evolving');
  });

  it('finds OpenClaw on 127.0.0.1:18789 when it responds', async () => {
    mockFetchPartial(new Map([
      ['http://127.0.0.1:18789/health', true],
    ]));

    const peers = await quickScanLocalhost();
    expect(peers.length).toBe(1);
    expect(peers[0].id).toBe('olly');
  });

  it('returns empty when localhost is unreachable', async () => {
    mockFetchUnreachable();
    const peers = await quickScanLocalhost();
    expect(peers).toEqual([]);
  });

  it('discovers multiple services on localhost', async () => {
    mockFetchPartial(new Map([
      ['http://127.0.0.1:8779/health', true],
      ['http://127.0.0.1:18789/health', true],
    ]));

    const peers = await quickScanLocalhost();
    expect(peers.length).toBe(2);
    const ids = peers.map((p) => p.id).sort();
    expect(ids).toEqual(['kernel-main', 'olly']);
  });
});