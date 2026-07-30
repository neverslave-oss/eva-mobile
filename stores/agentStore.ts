/**
 * agentStore — Real agent state with kernel-evolving API integration
 * Replaces mock agents with data from KernelApiClient
 */
import { create } from 'zustand';
import { Agent, SkillInfo, RoutineInfo, VoiceSample, ProviderRouting, ReplicaInfo, Message, ToolCallInfo, WorkspaceNode } from '../types';
import { kernelClient } from '../services/KernelApiClient';

interface AgentState {
  agents: Agent[];
  selectedAgentId: string | null;
  messages: Message[];
  isStreaming: boolean;

  // Skills & Routines
  skills: SkillInfo[];
  routines: RoutineInfo[];

  // Provider Routing
  providerRouting: ProviderRouting | null;

  // Workspace
  workspaceTree: WorkspaceNode | null;

  // Voice
  voiceSamples: VoiceSample[];
  activeVoiceSample: string;

  // Replicas
  replicas: ReplicaInfo[];

  // Actions
  setAgents: (agents: Agent[]) => void;
  addAgent: (agent: Agent) => void;
  updateAgentStatus: (id: string, status: Agent['status']) => void;
  selectAgent: (id: string | null) => void;
  setMessages: (messages: Message[]) => void;
  addMessage: (msg: Message) => void;
  setIsStreaming: (v: boolean) => void;
  fetchAgents: () => Promise<void>;
  fetchSkills: () => Promise<void>;
  fetchRoutines: () => Promise<void>;
  fetchProviderRouting: () => Promise<void>;
  fetchVoiceSamples: () => Promise<void>;
  fetchReplicas: () => Promise<void>;
  fetchWorkspaceTree: () => Promise<void>;
  sendMessage: (text: string) => Promise<Message | null>;
  sendSlashCommand: (cmd: string) => Promise<Message | null>;
  clearConversation: () => Promise<void>;
}

export const useAgentStore = create<AgentState>()((set, get) => ({
  agents: [
    { id: 'kernel-main', name: 'Kernel Main', status: 'checking' },
    { id: 'marty', name: 'Marty', status: 'checking' },
    { id: 'olly', name: 'Olly', status: 'checking' },
    { id: 'lawy', name: 'Lawy', status: 'checking' },
    { id: 'sage', name: 'Sage', status: 'checking' },
  ],
  selectedAgentId: null,
  messages: [],
  isStreaming: false,
  skills: [],
  routines: [],
  providerRouting: null,
  workspaceTree: null,
  voiceSamples: [],
  activeVoiceSample: '',
  replicas: [],

  setAgents: (agents) => set({ agents }),
  addAgent: (agent) =>
    set((state) => ({
      agents: state.agents.some((a) => a.id === agent.id) ? state.agents : [...state.agents, agent],
    })),
  updateAgentStatus: (id, status) =>
    set((state) => ({
      agents: state.agents.map((a) => (a.id === id ? { ...a, status } : a)),
    })),
  selectAgent: (id) => set({ selectedAgentId: id }),
  setMessages: (messages) => set({ messages }),
  addMessage: (msg) => set((state) => ({ messages: [...state.messages, msg] })),
  setIsStreaming: (v) => set({ isStreaming: v }),

  // ── Fetch from API ──

  fetchAgents: async () => {
    try {
      const apiOk = await kernelClient.healthCheck();
      if (!apiOk) {
        // Server unreachable — mark all fallback agents as offline
        set((s) => ({
          agents: s.agents.map((a) => ({ ...a, status: 'offline' as const })),
        }));
        return;
      }
      const info = await kernelClient.listAgents();
      if (info.length > 0) {
        const agents: Agent[] = info.map((a) => ({
          id: a.id,
          name: a.name,
          status: a.status,
        }));
        set({ agents });
      } else {
        // API available but no agents registered — show fallback as online
        set((s) => ({
          agents: s.agents.map((a) => ({ ...a, status: 'online' as const })),
        }));
      }
    } catch {
      set((s) => ({
        agents: s.agents.map((a) => ({ ...a, status: 'offline' as const })),
      }));
    }
  },

  fetchSkills: async () => {
    const skills = await kernelClient.getSkills();
    set({ skills });
  },

  fetchRoutines: async () => {
    const routines = await kernelClient.getRoutines();
    set({ routines });
  },

  fetchProviderRouting: async () => {
    const routing = await kernelClient.getProviderRouting();
    set({ providerRouting: routing });
  },

  fetchVoiceSamples: async () => {
    const samples = await kernelClient.listVoiceSamples();
    set({ voiceSamples: samples });
  },

  fetchReplicas: async () => {
    const replicas = await kernelClient.listReplicas();
    set({ replicas });
  },

  fetchWorkspaceTree: async () => {
    const tree = await kernelClient.getWorkspaceTree();
    set({ workspaceTree: tree ?? null });
  },

  // ── Send message via real API ──

  sendMessage: async (text) => {
    const state = get();
    const agentId = state.selectedAgentId;

    const userMsg: Message = {
      id: `msg-${Date.now()}`,
      chatId: agentId || 'default',
      role: 'user',
      text,
      timestamp: Date.now(),
    };

    // Add user message immediately
    set((s) => ({ messages: [...s.messages, userMsg] }));

    // Send to kernel-evolving API
    const replyText = await kernelClient.triage(text, { chatId: agentId || undefined });

    const reply: Message = {
      id: `msg-${Date.now()}-ai`,
      chatId: agentId || 'default',
      role: 'assistant',
      text: replyText,
      timestamp: Date.now(),
    };

    set((s) => ({ messages: [...s.messages, reply] }));
    return reply;
  },

  sendSlashCommand: async (cmd) => {
    const state = get();
    const agentId = state.selectedAgentId;

    const userMsg: Message = {
      id: `msg-${Date.now()}`,
      chatId: agentId || 'default',
      role: 'user',
      text: cmd,
      timestamp: Date.now(),
    };

    set((s) => ({ messages: [...s.messages, userMsg], isStreaming: true }));

    // Route all slash commands through triage — kernel-evolving handles the rest
    const replyText = await kernelClient.triage(cmd, { chatId: agentId || undefined });

    const reply: Message = {
      id: `msg-${Date.now()}-ai`,
      chatId: agentId || 'default',
      role: 'assistant',
      text: replyText,
      timestamp: Date.now(),
    };

    set((s) => ({ messages: [...s.messages, reply], isStreaming: false }));
    return reply;
  },

  clearConversation: async () => {
    await kernelClient.clearMemory();
    set({ messages: [] });
  },
}));
