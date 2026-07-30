/**
 * KernelApiClient — Real API client for kernel-evolving agent (http://localhost:8779)
 *
 * Mirrors endpoints used by telegram_bot.py and evolution_dashboard.html.
 * Dual-mode: direct LAN + proxy (kernel-central).
 */
import axios, { AxiosInstance } from 'axios';
import { useSettingsStore } from '../stores/settingsStore';
import type {
  AgentInfo, SystemStatus, ProviderRouting, SkillInfo,
  RoutineInfo, ReplicaInfo, VoiceSample, SlashCommand,
} from '../types';

interface StreamCallbacks {
  onToken: (token: string) => void;
  onDone: () => void;
  onError: (error: Error) => void;
}

class KernelApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      timeout: 10000,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  private get cfg() {
    return useSettingsStore.getState();
  }

  private get base(): string {
    return this.cfg.mode === 'proxy'
      ? this.cfg.proxyUrl || 'https://kernel-central/api/v1'
      : this.cfg.serverUrl || 'http://localhost:8779';
  }

  private authHeaders(): Record<string, string> {
    const token = this.cfg.authToken;
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  // ── Health & Status ──────────────────────────────────────────────

  async healthCheck(): Promise<boolean> {
    try {
      const res = await this.client.get(`${this.base}/health`, {
        timeout: 5000,
        headers: this.authHeaders(),
      });
      return res.status === 200;
    } catch { return false; }
  }

  async getSystemStatus(): Promise<SystemStatus | null> {
    try {
      const res = await this.client.get(`${this.base}/system`, {
        timeout: 5000,
        headers: this.authHeaders(),
      });
      return res.data;
    } catch { return null; }
  }

  async getVersion(): Promise<string | null> {
    try {
      const res = await this.client.get(`${this.base}/version`, {
        timeout: 5000,
        headers: this.authHeaders(),
      });
      return res.data?.version ?? null;
    } catch { return null; }
  }

  // ── Agent / Discovery ────────────────────────────────────────────

  async listAgents(): Promise<AgentInfo[]> {
    try {
      const res = await this.client.get(`${this.base}/agents`, {
        timeout: 5000,
        headers: this.authHeaders(),
      });
      return res.data?.agents ?? [];
    } catch { return []; }
  }

  /** Send a message to the agent via triage endpoint */
  async triage(
    text: string,
    options?: { chatId?: string; toolsEnabled?: boolean }
  ): Promise<string> {
    try {
      const res = await this.client.post(
        `${this.base}/agent/triage`,
        { text, chat_id: options?.chatId, tools: options?.toolsEnabled },
        { timeout: 120000, headers: this.authHeaders() }
      );
      return res.data?.response ?? res.data?.reply ?? res.data?.text ?? '🐬 Done.';
    } catch (e: any) {
      const msg = e?.response?.data?.error || e?.message || 'API error';
      return `🐬 Error: ${msg}`;
    }
  }

  /** Clear conversation memory */
  async clearMemory(chatId?: string): Promise<boolean> {
    try {
      await this.client.post(
        `${this.base}/memory/clear`,
        { chat_id: chatId },
        { timeout: 5000, headers: this.authHeaders() }
      );
      return true;
    } catch { return false; }
  }

  // ── Provider Routing ────────────────────────────────────────────

  async getProviderRouting(): Promise<ProviderRouting | null> {
    try {
      const res = await this.client.get(`${this.base}/provider`, {
        timeout: 5000,
        headers: this.authHeaders(),
      });
      return res.data;
    } catch { return null; }
  }

  async setProvider(
    callType: string,
    provider: string,
    model?: string,
    persist?: boolean
  ): Promise<boolean> {
    try {
      const body: Record<string, any> = { [callType]: provider };
      if (model) body.model_override = { [callType]: model };
      if (persist) body.persist = true;
      await this.client.post(`${this.base}/provider/set`, body, {
        timeout: 5000,
        headers: this.authHeaders(),
      });
      return true;
    } catch { return false; }
  }

  async getAllProviders(): Promise<Record<string, any> | null> {
    try {
      const res = await this.client.get(`${this.base}/provider/available`, {
        timeout: 5000,
        headers: this.authHeaders(),
      });
      return res.data;
    } catch { return null; }
  }

  async getProviderModels(provider: string, capability?: string): Promise<string[]> {
    try {
      const res = await this.client.get(`${this.base}/provider/models`, {
        params: { provider, capability: capability || 'text' },
        timeout: 5000,
        headers: this.authHeaders(),
      });
      return res.data?.models?.[provider] ?? [];
    } catch { return []; }
  }

  // ── Models ──────────────────────────────────────────────────────

  async getModels(): Promise<string[]> {
    try {
      const res = await this.client.get(`${this.base}/models`, {
        timeout: 5000,
        headers: this.authHeaders(),
      });
      return res.data?.models ?? [];
    } catch { return []; }
  }

  async loadModel(modelName: string): Promise<boolean> {
    try {
      await this.client.post(
        `${this.base}/models/load`,
        { model: modelName },
        { timeout: 30000, headers: this.authHeaders() }
      );
      return true;
    } catch { return false; }
  }

  // ── Skills & Routines ────────────────────────────────────────────

  async getSkills(): Promise<SkillInfo[]> {
    try {
      const res = await this.client.get(`${this.base}/skills`, {
        timeout: 5000,
        headers: this.authHeaders(),
      });
      return res.data?.skills ?? [];
    } catch { return []; }
  }

  async getRoutines(): Promise<RoutineInfo[]> {
    try {
      const res = await this.client.get(`${this.base}/routines`, {
        timeout: 5000,
        headers: this.authHeaders(),
      });
      return res.data?.routines ?? [];
    } catch { return []; }
  }

  // ── Evolution ────────────────────────────────────────────────────

  async triggerEvolution(task?: string): Promise<string | null> {
    try {
      const res = await this.client.post(
        `${this.base}/evolve`,
        { task: task || '' },
        { timeout: 30000, headers: this.authHeaders() }
      );
      return res.data?.message ?? '🧬 Evolution triggered.';
    } catch { return null; }
  }

  // ── Replicas ────────────────────────────────────────────────────

  async listReplicas(): Promise<ReplicaInfo[]> {
    try {
      const res = await this.client.get(`${this.base}/replica`, {
        timeout: 5000,
        headers: this.authHeaders(),
      });
      return res.data?.replicas ?? [];
    } catch { return []; }
  }

  async spawnReplica(name: string, role?: string, brief?: string): Promise<boolean> {
    try {
      await this.client.post(
        `${this.base}/replica/spawn`,
        { name, role: role || 'custom', system_prompt: brief },
        { timeout: 15000, headers: this.authHeaders() }
      );
      return true;
    } catch { return false; }
  }

  // ── Thoughts ────────────────────────────────────────────────────

  async getThoughts(): Promise<string[]> {
    try {
      const res = await this.client.get(`${this.base}/thoughts`, {
        timeout: 5000,
        headers: this.authHeaders(),
      });
      return res.data?.thoughts ?? [];
    } catch { return []; }
  }

  // ── Workspaces ──────────────────────────────────────────────────

  async getWorkspaces(): Promise<string[]> {
    try {
      const res = await this.client.get(`${this.base}/workspaces`, {
        timeout: 5000,
        headers: this.authHeaders(),
      });
      return res.data?.workspaces ?? [];
    } catch { return []; }
  }

  // ── Workspace File Tree ─────────────────────────────────────────

  async getWorkspaceTree(dir?: string): Promise<any[]> {
    try {
      const res = await this.client.get(`${this.base}/workspace/tree`, {
        params: { dir: dir || '/' },
        timeout: 5000,
        headers: this.authHeaders(),
      });
      return res.data?.tree ?? [];
    } catch { return []; }
  }

  // ── Voice ───────────────────────────────────────────────────────

  async listVoiceSamples(): Promise<VoiceSample[]> {
    try {
      const res = await this.client.get(`${this.base}/voice/samples`, {
        timeout: 5000,
        headers: this.authHeaders(),
      });
      return res.data?.samples ?? [];
    } catch { return []; }
  }

  async setActiveVoice(index: number): Promise<boolean> {
    try {
      await this.client.post(
        `${this.base}/voice/set`,
        { index },
        { timeout: 5000, headers: this.authHeaders() }
      );
      return true;
    } catch { return false; }
  }

  /** Clone voice via olly-voice-server (local) */
  async cloneVoice(text: string, samplePath?: string): Promise<string | null> {
    try {
      // First try local olly-voice-server
      const formData = new FormData();
      formData.append('text', text);
      formData.append('model', '1.7');
      formData.append('x_vector_only', 'true');
      const res = await this.client.post('http://127.0.0.1:8766/tts/clone', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 300000,
        responseType: 'arraybuffer',
      });
      if (res.status === 200 && res.data?.byteLength > 1000) {
        // Return URL for playback (file written to temp dir)
        return res.data;
      }
      return null;
    } catch { return null; }
  }

  // ── Agent Config (Inspector) ───────────────────────────────────

  async getAgentConfig(): Promise<Record<string, any> | null> {
    try {
      const res = await this.client.get(`${this.base}/agent/config`, {
        timeout: 5000,
        headers: this.authHeaders(),
      });
      return res.data;
    } catch { return null; }
  }

  async getSessionHistory(chatId?: string): Promise<any[]> {
    try {
      const res = await this.client.get(`${this.base}/memory/history`, {
        params: { chat_id: chatId },
        timeout: 5000,
        headers: this.authHeaders(),
      });
      return res.data?.history ?? [];
    } catch { return []; }
  }

  // ── System ─────────────────────────────────────────────────────

  async restartAgent(): Promise<boolean> {
    try {
      await this.client.post(`${this.base}/agent/restart`, {}, {
        timeout: 5000,
        headers: this.authHeaders(),
      });
      return true;
    } catch { return false; }
  }

  async updateAgent(): Promise<boolean> {
    try {
      await this.client.post(`${this.base}/update`, {}, {
        timeout: 30000,
        headers: this.authHeaders(),
      });
      return true;
    } catch { return false; }
  }

  // ── Streaming (SSE) ───────────────────────────────────────────

  streamMessage(
    text: string,
    callbacks: StreamCallbacks,
    options?: { chatId?: string; toolsEnabled?: boolean }
  ): AbortController {
    const controller = new AbortController();
    const url = `${this.base}/message/stream?text=${encodeURIComponent(text)}${
      options?.chatId ? `&chat_id=${options.chatId}` : ''
    }${options?.toolsEnabled ? '&tools=true' : ''}`;

    const opts: Record<string, any> = {
      method: 'GET',
      signal: controller.signal,
    };
    const headers = this.authHeaders();
    if (Object.keys(headers).length) opts.headers = headers;

    fetch(url, opts)
      .then(async (response) => {
        if (!response.ok || !response.body) {
          callbacks.onError(new Error(`HTTP ${response.status}`));
          return;
        }
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') { callbacks.onDone(); return; }
              try {
                const parsed = JSON.parse(data);
                if (parsed.event === 'token' || parsed.text) {
                  callbacks.onToken(parsed.text ?? '');
                }
              } catch { callbacks.onToken(data); }
            }
          }
        }
        callbacks.onDone();
      })
      .catch((err) => {
        if (err.name !== 'AbortError') callbacks.onError(err);
      });

    return controller;
  }

  // ── Upload ─────────────────────────────────────────────────────

  async uploadFile(uri: string, fileName: string, mimeType: string): Promise<string | null> {
    try {
      const formData = new FormData();
      formData.append('file', { uri, name: fileName, type: mimeType } as any);
      const res = await this.client.post(`${this.base}/upload`, formData, {
        headers: { ...this.authHeaders(), 'Content-Type': 'multipart/form-data' },
        timeout: 30000,
      });
      return res.data?.url ?? null;
    } catch { return null; }
  }
}

export const kernelClient = new KernelApiClient();
export default KernelApiClient;
