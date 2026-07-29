import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ConnectionMode, DEFAULT_SETTINGS } from '../types';

interface SettingsState {
  mode: ConnectionMode;
  serverUrl: string;
  setMode: (mode: ConnectionMode) => void;
  setServerUrl: (url: string) => void;
  reset: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      mode: DEFAULT_SETTINGS.mode,
      serverUrl: DEFAULT_SETTINGS.serverUrl,
      setMode: (mode) => set({ mode }),
      setServerUrl: (url) => set({ serverUrl: url }),
      reset: () => set({ mode: DEFAULT_SETTINGS.mode, serverUrl: DEFAULT_SETTINGS.serverUrl }),
    }),
    {
      name: 'settings-store',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
