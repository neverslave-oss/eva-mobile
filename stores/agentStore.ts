import { create } from 'zustand';
import { Agent } from '../types';

interface AgentState {
  agents: Agent[];
  selectedAgentId: string | null;
  setAgents: (agents: Agent[]) => void;
  addAgent: (agent: Agent) => void;
  updateAgentStatus: (id: string, status: Agent['status']) => void;
  selectAgent: (id: string | null) => void;
}

const MOCK_AGENTS: Agent[] = [
  { id: 'kernel-main', name: 'Kernel Main', status: 'online' },
  { id: 'marty', name: 'Marty', status: 'online' },
  { id: 'olly', name: 'Olly', status: 'offline' },
  { id: 'lawy', name: 'Lawy', status: 'checking' },
  { id: 'sage', name: 'Sage', status: 'offline' },
];

export const useAgentStore = create<AgentState>()((set) => ({
  agents: MOCK_AGENTS,
  selectedAgentId: null,

  setAgents: (agents) => set({ agents }),

  addAgent: (agent) =>
    set((state) => ({
      agents: state.agents.some((a) => a.id === agent.id)
        ? state.agents
        : [...state.agents, agent],
    })),

  updateAgentStatus: (id, status) =>
    set((state) => ({
      agents: state.agents.map((a) => (a.id === id ? { ...a, status } : a)),
    })),

  selectAgent: (id) => set({ selectedAgentId: id }),
}));
