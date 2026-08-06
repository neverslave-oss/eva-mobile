import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ConnectionMode, DEFAULT_SETTINGS } from '../types';

export interface UserInfo {
  id: number;
  name: string;
  email: string;
}

interface SettingsState {
  mode: ConnectionMode;
  serverUrl: string;
  proxyUrl: string;
  authToken: string;
  user: UserInfo | null;
  onboardingCompleted: boolean;
  deviceToken: string;
  deviceSecret: string;
  setMode: (mode: ConnectionMode) => void;
  setServerUrl: (url: string) => void;
  setProxyUrl: (url: string) => void;
  setAuthToken: (token: string) => void;
  setUser: (user: UserInfo | null) => void;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  setOnboardingCompleted: (v: boolean) => void;
  pairDevice: (token: string, secret: string, centralUrl: string) => Promise<void>;
  reset: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      mode: DEFAULT_SETTINGS.mode,
      serverUrl: DEFAULT_SETTINGS.serverUrl,
      proxyUrl: DEFAULT_SETTINGS.proxyUrl,
      authToken: DEFAULT_SETTINGS.authToken,
      user: null,
      onboardingCompleted: DEFAULT_SETTINGS.onboardingCompleted,
      deviceToken: DEFAULT_SETTINGS.deviceToken,
      deviceSecret: DEFAULT_SETTINGS.deviceSecret,
      setMode: (mode) => set({ mode }),
      setServerUrl: (url) => set({ serverUrl: url }),
      setProxyUrl: (url) => set({ proxyUrl: url }),
      setAuthToken: (token) => set({ authToken: token }),
      setUser: (user) => set({ user }),

      login: async (email: string, password: string) => {
        const { proxyUrl } = get();
        const baseUrl = proxyUrl || DEFAULT_SETTINGS.proxyUrl;
        const loginUrl = baseUrl.replace(/\/api.*$/, '') + '/api/tokens';

        try {
          // Use email+password to create a Sanctum token
          const response = await fetch(loginUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email,
              password,
              device_name: 'kernel-mobile-v2',
            }),
          });

          if (!response.ok) {
            const body = await response.text();
            console.warn('Login failed:', response.status, body);
            return false;
          }

          const data = await response.json();
          const token = data.token || data.data?.token || '';
          if (!token) {
            console.warn('Login response missing token:', data);
            return false;
          }

          // Fetch current user info
          const userResp = await fetch(baseUrl.replace(/\/api.*$/, '') + '/api/user', {
            headers: { Authorization: `Bearer ${token}` },
          });
          let user: UserInfo | null = null;
          if (userResp.ok) {
            const userData = await userResp.json();
            user = {
              id: userData.id,
              name: userData.name,
              email: userData.email,
            };
          }

          set({ authToken: token, user });
          return true;
        } catch (e: any) {
          console.warn('Login error:', e?.message || e);
          return false;
        }
      },

      logout: () => {
        set({ authToken: '', user: null });
      },

      setOnboardingCompleted: (v) => set({ onboardingCompleted: v }),

      pairDevice: async (token: string, secret: string, centralUrl: string) => {
        const KernelApiClientModule = await import('../services/KernelApiClient');
        const client = new KernelApiClientModule.default();
        const result = await client.confirmPairing(centralUrl, token, secret);
        if (!result.success) throw new Error('Pairing confirmation failed');
        set({
          mode: 'proxy',
          proxyUrl: centralUrl,
          deviceToken: token,
          deviceSecret: secret,
        });
      },

      reset: () =>
        set({
          mode: DEFAULT_SETTINGS.mode,
          serverUrl: DEFAULT_SETTINGS.serverUrl,
          proxyUrl: DEFAULT_SETTINGS.proxyUrl,
          authToken: '',
          user: null,
          onboardingCompleted: false,
          deviceToken: '',
          deviceSecret: '',
        }),
    }),
    {
      name: 'settings-store',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
