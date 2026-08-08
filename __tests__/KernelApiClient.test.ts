/**
 * KernelApiClient.test.ts — dual-mode base URL routing (direct vs proxy)
 * and health-check behavior across both.
 */

jest.mock('axios', () => {
  const mockInstance = { get: jest.fn(), post: jest.fn() };
  return { __esModule: true, default: { create: jest.fn(() => mockInstance) } };
});

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(() => Promise.resolve(null)),
    setItem: jest.fn(() => Promise.resolve()),
    removeItem: jest.fn(() => Promise.resolve()),
  },
}));

import axios from 'axios';
import { kernelClient } from '../services/KernelApiClient';
import { useSettingsStore } from '../stores/settingsStore';

// The client created inside KernelApiClient's constructor at import time —
// grabbed here so tests can assert on the exact calls it makes.
const mockAxiosInstance = (axios.create as jest.Mock).mock.results[0].value as {
  get: jest.Mock;
  post: jest.Mock;
};

const initialSettings = useSettingsStore.getState();

describe('KernelApiClient', () => {
  beforeEach(() => {
    useSettingsStore.setState(initialSettings, true);
    jest.clearAllMocks();
  });

  describe('dual-mode base URL routing', () => {
    it('direct mode: listAgents hits the configured server URL', async () => {
      useSettingsStore.getState().setMode('direct');
      useSettingsStore.getState().setServerUrl('http://192.168.1.50:8779');
      mockAxiosInstance.get.mockResolvedValue({ data: { agents: [] } });

      await kernelClient.listAgents();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        'http://192.168.1.50:8779/agents',
        expect.any(Object)
      );
    });

    it('proxy mode: triage routes through relay create + relay status poll', async () => {
      useSettingsStore.getState().setMode('proxy');
      useSettingsStore.getState().setProxyUrl('https://kc.example.com/api/v1');
      useSettingsStore.setState({ deviceId: 42 });
      mockAxiosInstance.post.mockResolvedValue({ data: { data: { relay_id: '01HXYZ' } } });
      mockAxiosInstance.get.mockResolvedValue({ data: { data: { status: 'responded', response: 'pong' } } });

      const reply = await kernelClient.triage('ping');

      expect(reply).toBe('pong');
      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        'https://kc.example.com/api/messages/relay',
        { device_id: 42, message: 'ping' },
        expect.any(Object)
      );
      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        'https://kc.example.com/api/messages/relay/01HXYZ',
        expect.any(Object)
      );
    });

    it('direct mode: triage posts to /message on the server URL', async () => {
      useSettingsStore.getState().setMode('direct');
      useSettingsStore.getState().setServerUrl('http://localhost:8779');
      mockAxiosInstance.post.mockResolvedValue({ data: { response: 'hello' } });

      const reply = await kernelClient.triage('hi', { chatId: 'c1' });

      expect(reply).toBe('hello');
      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        'http://localhost:8779/message',
        { message: 'hi', chat_id: 'c1' },
        expect.any(Object)
      );
    });
  });

  describe('healthCheck', () => {
    it('direct mode: resolves true on any successful (opaque) fetch', async () => {
      useSettingsStore.getState().setMode('direct');
      useSettingsStore.getState().setServerUrl('http://localhost:8779');
      (globalThis as any).fetch = jest.fn().mockResolvedValue({ ok: false, status: 0, type: 'opaque' });

      const ok = await kernelClient.healthCheck();

      expect(ok).toBe(true);
      expect((globalThis as any).fetch).toHaveBeenCalledWith(
        'http://localhost:8779/health',
        expect.objectContaining({ mode: 'no-cors' })
      );
    });

    it('direct mode: resolves false when fetch rejects (CORS-blocked or unreachable)', async () => {
      useSettingsStore.getState().setMode('direct');
      (globalThis as any).fetch = jest.fn().mockRejectedValue(new Error('unreachable'));

      const ok = await kernelClient.healthCheck();

      expect(ok).toBe(false);
    });

    it('proxy mode: delegates to the relay health endpoint via axios', async () => {
      useSettingsStore.getState().setMode('proxy');
      useSettingsStore.getState().setProxyUrl('https://kc.example.com/api');
      mockAxiosInstance.get.mockResolvedValue({ status: 200 });

      const ok = await kernelClient.healthCheck();

      expect(ok).toBe(true);
      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        'https://kc.example.com/api/health',
        expect.any(Object)
      );
    });
  });

  describe('error handling', () => {
    it('listAgents returns an empty array on request failure', async () => {
      mockAxiosInstance.get.mockRejectedValue(new Error('timeout'));
      const agents = await kernelClient.listAgents();
      expect(agents).toEqual([]);
    });

    it('triage surfaces API errors as a formatted string (direct mode)', async () => {
      useSettingsStore.getState().setMode('direct');
      mockAxiosInstance.post.mockRejectedValue({ message: 'network error' });

      const reply = await kernelClient.triage('hi');

      expect(reply).toBe('🐬 Error: network error');
    });
  });
});
