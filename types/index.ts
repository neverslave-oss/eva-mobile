// Shared types for kernel-mobile-v2

export type ConnectionMode = 'direct' | 'proxy';

export interface AppSettings {
  mode: ConnectionMode;
  serverUrl: string;
  proxyUrl: string;
  authToken: string;
  onboardingCompleted: boolean;
  theme: 'dark' | 'light';
  deviceToken: string;
  deviceSecret: string;
  deviceId: number | null;
}

export interface Agent {
  id: string;
  name: string;
  description?: string;
  status: 'online' | 'offline' | 'checking';
  avatar?: string;
  version?: string;
  uptime?: string;
  model?: string;
}

export interface AgentInfo {
  id: string;
  name: string;
  description?: string;
  status: 'online' | 'offline';
}

export interface InlineButton {
  text: string;
  callback: string;
  style?: 'primary' | 'secondary' | 'danger';
}

export interface Message {
  id: string;
  chatId: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: number;
  streaming?: boolean;
  toolCalls?: ToolCallInfo[];
  buttons?: InlineButton[][];  // Rows of inline buttons (mirrors telegram_bot.py reply_markup.inline_keyboard)
  /** Audio URI for voice clone playback (set after streaming completes) */
  audioUri?: string;
}

export interface ToolCallInfo {
  step: number;
  toolName: string;
  args: string;
  result: string;
}

export interface Chat {
  id: string;
  agentId: string;
  title: string;
  messages: Message[];
  createdAt: number;
}

// ── Kernel-Evolving API types ──────────────────────────────────────

// ── Workspace File Tree ─────────────────────────────────────────

export interface WorkspaceNode {
  name: string;
  type: 'dir' | 'file';
  size?: number;
  children?: WorkspaceNode[];
}

// ── Kernel-Evolving API types ──────────────────────────────────────

export interface SystemStatus {
  status: string;
  version?: string;
  uptime?: string;
  model?: string;
  vram?: string;
  cpu?: string;
  ram?: string;
}

export interface ProviderRouting {
  routing: Record<string, ProviderRoute>;
  collect_trajectories?: boolean;
  hf_provider?: string;
}

export interface ProviderRoute {
  provider: string;
  model?: string;
  streaming?: boolean;
}

export interface SkillInfo {
  name: string;
  description: string;
  slug: string;
  version?: string;
}

export interface RoutineInfo {
  name: string;
  description: string;
  trigger: string;
  slug?: string;
}

export interface ReplicaInfo {
  id: string;
  name: string;
  role: string;
  status: string;
  created_at: string;
}

export interface VoiceSample {
  name: string;
  path: string;
  active?: boolean;
}

export interface SlashCommand {
  command: string;
  description: string;
}

export interface DiscoveredPeer {
  id: string;
  name: string;
  ip: string;
  port: number;
  status: 'online' | 'offline';
}

export type CallType =
  | 'task_inference'
  | 'synthesis'
  | 'critic'
  | 'planning'
  | 'trajectory_teacher'
  | 'vision'
  | 'stt'
  | 'tts';

export const CALL_TYPES: CallType[] = [
  'task_inference',
  'synthesis',
  'critic',
  'planning',
  'trajectory_teacher',
  'vision',
  'stt',
  'tts',
];

export const CALL_TYPE_LABELS: Record<CallType, string> = {
  task_inference: 'Chat (task inference)',
  synthesis: 'Skill synthesis',
  critic: 'Critic / verification',
  planning: 'Task planning',
  trajectory_teacher: 'Teacher trajectories',
  vision: 'Vision (images)',
  stt: 'Speech-to-Text',
  tts: 'Text-to-Speech / voice clone',
};

export const PROVIDER_NAMES: Record<string, string> = {
  local: '🏠 Local',
  openai: '🤖 OpenAI',
  openrouter: '🌐 OpenRouter',
  anthropic: '🧠 Anthropic',
  hf: '🤗 HuggingFace',
  copilot: '⚡ Copilot',
  google: '🔎 Google',
};

// ── Defaults ───────────────────────────────────────────────────────

export const DEFAULT_SETTINGS: AppSettings = {
  mode: 'direct',
  serverUrl: 'http://localhost:8779',
  proxyUrl: 'https://kernel-central/api/v1',
  authToken: '',
  onboardingCompleted: false,
  theme: 'dark',
  deviceToken: '',
  deviceSecret: '',
  deviceId: null,
};

export const SCREEN_NAMES = {
  Welcome: 'Welcome',
  Onboarding: 'Onboarding',
  BotList: 'BotList',
  Chat: 'Chat',
  Settings: 'Settings',
  BotProfile: 'BotProfile',
  Pair: 'Pair',
} as const;

export type RootStackParamList = {
  [SCREEN_NAMES.Welcome]: undefined;
  [SCREEN_NAMES.Onboarding]: undefined;
  [SCREEN_NAMES.BotList]: undefined;
  [SCREEN_NAMES.Chat]: { botId?: string };
  [SCREEN_NAMES.Settings]: undefined;
  [SCREEN_NAMES.BotProfile]: { agentId: string };
  [SCREEN_NAMES.Pair]: undefined;
};
