/**
 * agentStore.test.ts — discovery feed, offline cache seeding, API fetch,
 * message streaming, and conversation clearing.
 */

jest.mock('../services/KernelApiClient', () => ({
  kernelClient: {
    healthCheck: jest.fn(),
    listAgents: jest.fn(),
    streamMessage: jest.fn(),
    cloneVoice: jest.fn(),
    clearMemory: jest.fn(),
  },
}));

jest.mock('../services/SqlitePersistence', () => ({
  sqlitePersistence: {
    getAgents: jest.fn(),
    saveAgents: jest.fn(),
  },
}));

import { useAgentStore } from '../stores/agentStore';
import { kernelClient } from '../services/KernelApiClient';
import { sqlitePersistence } from '../services/SqlitePersistence';

const initialState = useAgentStore.getState();

describe('agentStore', () => {
  beforeEach(() => {
    useAgentStore.setState(initialState, true);
    jest.clearAllMocks();
    (sqlitePersistence.saveAgents as jest.Mock).mockResolvedValue(undefined);
  });

  describe('feedDiscoveredPeers', () => {
    it('adds only peers not already known, mapped with a LAN description', () => {
      useAgentStore.setState({ agents: [{ id: 'existing', name: 'Existing', status: 'online' }] });

      useAgentStore.getState().feedDiscoveredPeers([
        { id: 'existing', name: 'Existing', ip: '127.0.0.1', port: 8779, status: 'online' },
        { id: 'new-peer', name: 'New Peer', ip: '192.168.1.5', port: 8765, status: 'online' },
      ]);

      const { agents } = useAgentStore.getState();
      expect(agents).toHaveLength(2);
      const added = agents.find((a) => a.id === 'new-peer');
      expect(added?.description).toBe('🌐 LAN · 192.168.1.5:8765');
      expect(added?.status).toBe('online');
    });

    it('maps an offline discovered peer to the checking status', () => {
      useAgentStore.getState().feedDiscoveredPeers([
        { id: 'offline-peer', name: 'Offline', ip: '10.0.0.5', port: 8010, status: 'offline' },
      ]);
      expect(useAgentStore.getState().agents[0].status).toBe('checking');
    });

    it('persists newly discovered peers to SQLite (best-effort)', () => {
      useAgentStore.getState().feedDiscoveredPeers([
        { id: 'p1', name: 'P1', ip: '10.0.0.1', port: 8779, status: 'online' },
      ]);
      expect(sqlitePersistence.saveAgents).toHaveBeenCalledWith([
        expect.objectContaining({ id: 'p1', source: 'lan', ip: '10.0.0.1', port: 8779 }),
      ]);
    });

    it('leaves state untouched when no new peers are found', () => {
      useAgentStore.setState({ agents: [{ id: 'a', name: 'A', status: 'online' }] });
      const before = useAgentStore.getState().agents;

      useAgentStore.getState().feedDiscoveredPeers([{ id: 'a', name: 'A', ip: '1.1.1.1', port: 1, status: 'online' }]);

      expect(useAgentStore.getState().agents).toBe(before);
    });
  });

  describe('loadCachedAgents', () => {
    it('seeds agents from the SQLite cache when the store is empty', async () => {
      (sqlitePersistence.getAgents as jest.Mock).mockResolvedValue([
        { id: 'cached-1', name: 'Cached', description: 'desc', ip: '', port: 0, status: 'offline', source: 'lan', updated_at: 1 },
      ]);

      await useAgentStore.getState().loadCachedAgents();

      expect(useAgentStore.getState().agents).toEqual([
        { id: 'cached-1', name: 'Cached', description: 'desc', status: 'offline' },
      ]);
    });

    it('does not overwrite an already-populated store', async () => {
      useAgentStore.setState({ agents: [{ id: 'live', name: 'Live', status: 'online' }] });
      (sqlitePersistence.getAgents as jest.Mock).mockResolvedValue([
        { id: 'cached-1', name: 'Cached', description: '', ip: '', port: 0, status: 'offline', source: 'lan', updated_at: 1 },
      ]);

      await useAgentStore.getState().loadCachedAgents();

      expect(useAgentStore.getState().agents).toEqual([{ id: 'live', name: 'Live', status: 'online' }]);
    });

    it('silently ignores SQLite errors (e.g. web preview, missing schema)', async () => {
      (sqlitePersistence.getAgents as jest.Mock).mockRejectedValue(new Error('no such table: agents'));
      await expect(useAgentStore.getState().loadCachedAgents()).resolves.toBeUndefined();
    });
  });

  describe('fetchAgents', () => {
    it('marks existing agents offline when the server is unreachable', async () => {
      useAgentStore.setState({ agents: [{ id: 'a', name: 'A', status: 'online' }] });
      (kernelClient.healthCheck as jest.Mock).mockResolvedValue(false);

      await useAgentStore.getState().fetchAgents();

      expect(useAgentStore.getState().agents[0].status).toBe('offline');
    });

    it('sets and persists agents from a live API response', async () => {
      (kernelClient.healthCheck as jest.Mock).mockResolvedValue(true);
      (kernelClient.listAgents as jest.Mock).mockResolvedValue([
        { id: 'kernel-main', name: 'Kernel', description: 'Main agent', status: 'online' },
      ]);

      await useAgentStore.getState().fetchAgents();

      expect(useAgentStore.getState().agents).toEqual([
        { id: 'kernel-main', name: 'Kernel', description: 'Main agent', status: 'online' },
      ]);
      expect(sqlitePersistence.saveAgents).toHaveBeenCalledWith([
        expect.objectContaining({ id: 'kernel-main', source: 'proxy' }),
      ]);
    });

    it('clears agents when the API returns none', async () => {
      useAgentStore.setState({ agents: [{ id: 'a', name: 'A', status: 'online' }] });
      (kernelClient.healthCheck as jest.Mock).mockResolvedValue(true);
      (kernelClient.listAgents as jest.Mock).mockResolvedValue([]);

      await useAgentStore.getState().fetchAgents();

      expect(useAgentStore.getState().agents).toEqual([]);
    });

    it('marks agents offline when the fetch throws', async () => {
      useAgentStore.setState({ agents: [{ id: 'a', name: 'A', status: 'online' }] });
      (kernelClient.healthCheck as jest.Mock).mockRejectedValue(new Error('network down'));

      await useAgentStore.getState().fetchAgents();

      expect(useAgentStore.getState().agents[0].status).toBe('offline');
    });
  });

  describe('sendMessage', () => {
    it('streams tokens into an assistant message and clears isStreaming', async () => {
      useAgentStore.setState({ selectedAgentId: 'kernel-main' });
      (kernelClient.streamMessage as jest.Mock).mockImplementation((_text, callbacks) => {
        callbacks.onToken('Hello');
        callbacks.onToken(' world');
        callbacks.onDone();
        return { abort: jest.fn() };
      });

      const result = await useAgentStore.getState().sendMessage('Hi');

      expect(result).toBeNull(); // built incrementally via streaming, not returned directly
      const { messages, isStreaming } = useAgentStore.getState();
      expect(isStreaming).toBe(false);
      expect(messages).toHaveLength(2);
      expect(messages[0]).toMatchObject({ role: 'user', text: 'Hi' });
      expect(messages[1]).toMatchObject({ role: 'assistant', text: 'Hello world', streaming: false });
    });

    it('surfaces stream errors in the assistant message', async () => {
      useAgentStore.setState({ selectedAgentId: 'kernel-main' });
      (kernelClient.streamMessage as jest.Mock).mockImplementation((_text, callbacks) => {
        callbacks.onError(new Error('stream broke'));
        return { abort: jest.fn() };
      });

      await useAgentStore.getState().sendMessage('Hi');

      const { messages, isStreaming } = useAgentStore.getState();
      expect(isStreaming).toBe(false);
      expect(messages[1].text).toBe('🐬 Error: stream broke');
    });
  });

  describe('clearConversation', () => {
    it('clears memory via the API and empties local messages', async () => {
      useAgentStore.setState({ messages: [{ id: 'm1', chatId: 'c', role: 'user', text: 'hi', timestamp: 1 }] });
      (kernelClient.clearMemory as jest.Mock).mockResolvedValue(true);

      await useAgentStore.getState().clearConversation();

      expect(kernelClient.clearMemory).toHaveBeenCalled();
      expect(useAgentStore.getState().messages).toEqual([]);
    });
  });
});
