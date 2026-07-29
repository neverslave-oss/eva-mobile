// Shared types for kernel-mobile-v2

export type ConnectionMode = 'direct' | 'proxy';

export interface AppSettings {
  mode: ConnectionMode;
  serverUrl: string;
  onboardingCompleted: boolean;
  theme: 'dark' | 'light';
}

export interface Agent {
  id: string;
  name: string;
  status: 'online' | 'offline' | 'checking';
  avatar?: string;
}

export interface Message {
  id: string;
  chatId: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: number;
  streaming?: boolean;
}

export interface Chat {
  id: string;
  agentId: string;
  title: string;
  messages: Message[];
  createdAt: number;
}

export const DEFAULT_SETTINGS: AppSettings = {
  mode: 'direct',
  serverUrl: 'http://localhost:8779',
  onboardingCompleted: false,
  theme: 'dark',
};

export const SCREEN_NAMES = {
  Welcome: 'Welcome',
  Onboarding: 'Onboarding',
  BotList: 'BotList',
  Chat: 'Chat',
  Settings: 'Settings',
  BotProfile: 'BotProfile',
} as const;

export type RootStackParamList = {
  [SCREEN_NAMES.Welcome]: undefined;
  [SCREEN_NAMES.Onboarding]: undefined;
  [SCREEN_NAMES.BotList]: undefined;
  [SCREEN_NAMES.Chat]: { botId?: string };
  [SCREEN_NAMES.Settings]: undefined;
  [SCREEN_NAMES.BotProfile]: { agentId: string };
};
