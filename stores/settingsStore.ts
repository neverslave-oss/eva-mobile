import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ConnectionMode, DEFAULT_SETTINGS } from '../types';

interface SettingsState {
  mode: ConnectionMode;
  serverUrl: string;
  proxyUrl: string;
  authToken: string;
  onboardingCompleted: boolean;
  setMode: (mode: ConnectionMode) => void;
  setServerUrl: (url: string) => void;
  setProxyUrl: (url: string) => void;
  setAuthToken: (token: string) => void;
  setOnboardingCompleted: (v: boolean) => void;
  reset: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      mode: DEFAULT_SETTINGS.mode,
      serverUrl: DEFAULT_SETTINGS.serverUrl,
      proxyUrl: DEFAULT_SETTINGS.proxyUrl,
      authToken: DEFAULT_SETTINGS.authToken,
      onboardingCompleted: DEFAULT_SETTINGS.onboardingCompleted,
      setMode: (mode) => set({ mode }),
      setServerUrl: (url) => set({ serverUrl: url }),
      setProxyUrl: (url) => set({ proxyUrl: url }),
      setAuthToken: (token) => set({ authToken: token }),
      setOnboardingCompleted: (v) => set({ onboardingCompleted: v }),
      reset: () =>
        set({
          mode: DEFAULT_SETTINGS.mode,
          serverUrl: DEFAULT_SETTINGS.serverUrl,
          proxyUrl: DEFAULT_SETTINGS.proxyUrl,
          authToken: '',
          onboardingCompleted: false,
        }),
    }),
    {
      name: 'settings-store',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
