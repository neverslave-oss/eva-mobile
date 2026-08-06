/**
 * settingsStore.test.ts — mode/URL setters, login/logout, reset.
 *
 * AsyncStorage is a native module unavailable under the node test env, so
 * it's mocked with a trivial in-memory implementation for zustand's persist
 * middleware.
 */

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(() => Promise.resolve(null)),
    setItem: jest.fn(() => Promise.resolve()),
    removeItem: jest.fn(() => Promise.resolve()),
  },
}));

import { useSettingsStore } from '../stores/settingsStore';

const initialState = useSettingsStore.getState();

describe('settingsStore', () => {
  beforeEach(() => {
    useSettingsStore.setState(initialState, true);
    jest.clearAllMocks();
  });

  it('setMode / setServerUrl / setProxyUrl update state', () => {
    useSettingsStore.getState().setMode('proxy');
    useSettingsStore.getState().setServerUrl('http://192.168.1.5:8779');
    useSettingsStore.getState().setProxyUrl('https://kc.example.com/api');

    const s = useSettingsStore.getState();
    expect(s.mode).toBe('proxy');
    expect(s.serverUrl).toBe('http://192.168.1.5:8779');
    expect(s.proxyUrl).toBe('https://kc.example.com/api');
  });

  describe('login', () => {
    it('stores the token and user on success', async () => {
      useSettingsStore.getState().setProxyUrl('https://kc.example.com/api');
      (globalThis as any).fetch = jest.fn()
        .mockResolvedValueOnce({ ok: true, json: async () => ({ token: 'tok-123' }) })
        .mockResolvedValueOnce({ ok: true, json: async () => ({ id: 1, name: 'Fabio', email: 'f@x.com' }) });

      const ok = await useSettingsStore.getState().login('f@x.com', 'secret');

      expect(ok).toBe(true);
      expect(useSettingsStore.getState().authToken).toBe('tok-123');
      expect(useSettingsStore.getState().user).toEqual({ id: 1, name: 'Fabio', email: 'f@x.com' });
      expect((globalThis as any).fetch).toHaveBeenNthCalledWith(
        1,
        'https://kc.example.com/api/tokens',
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('returns false and leaves the token empty when the server rejects credentials', async () => {
      (globalThis as any).fetch = jest.fn().mockResolvedValue({ ok: false, status: 401, text: async () => 'Unauthorized' });

      const ok = await useSettingsStore.getState().login('f@x.com', 'wrong');

      expect(ok).toBe(false);
      expect(useSettingsStore.getState().authToken).toBe('');
    });

    it('returns false when the response is missing a token', async () => {
      (globalThis as any).fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({}) });

      const ok = await useSettingsStore.getState().login('f@x.com', 'secret');

      expect(ok).toBe(false);
    });

    it('returns false when fetch throws (network error)', async () => {
      (globalThis as any).fetch = jest.fn().mockRejectedValue(new Error('offline'));

      const ok = await useSettingsStore.getState().login('f@x.com', 'secret');

      expect(ok).toBe(false);
    });
  });

  it('logout clears the token and user', () => {
    useSettingsStore.setState({ authToken: 'tok', user: { id: 1, name: 'A', email: 'a@a.com' } });

    useSettingsStore.getState().logout();

    const s = useSettingsStore.getState();
    expect(s.authToken).toBe('');
    expect(s.user).toBeNull();
  });

  it('reset restores default connection settings', () => {
    useSettingsStore.setState({ mode: 'proxy', serverUrl: 'x', authToken: 'tok', onboardingCompleted: true });

    useSettingsStore.getState().reset();

    const s = useSettingsStore.getState();
    expect(s.mode).toBe('direct');
    expect(s.authToken).toBe('');
    expect(s.onboardingCompleted).toBe(false);
  });
});
