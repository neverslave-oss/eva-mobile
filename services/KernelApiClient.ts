import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { useSettingsStore } from '../stores/settingsStore';

interface AgentInfo {
  id: string;
  name: string;
  status: 'online' | 'offline';
}

interface StreamCallbacks {
  onToken: (token: string) => void;
  onDone: () => void;
  onError: (error: Error) => void;
}

class KernelApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      timeout: 15000,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  private getBaseUrl(): string {
    return useSettingsStore.getState().serverUrl;
  }

  /** Health check — confirms server is reachable */
  async healthCheck(): Promise<boolean> {
    try {
      const res = await this.client.get(`${this.getBaseUrl()}/health`, {
        timeout: 5000,
      });
      return res.status === 200;
    } catch {
      return false;
    }
  }

  /** Get server status from kernel-evolving */
  async getStatus(): Promise<{ status: string; version?: string } | null> {
    try {
      const res = await this.client.get(`${this.getBaseUrl()}/status`, {
        timeout: 5000,
      });
      return res.data;
    } catch {
      return null;
    }
  }

  /** Discover available agents */
  async listAgents(): Promise<AgentInfo[]> {
    try {
      const res = await this.client.get(`${this.getBaseUrl()}/agents`);
      return res.data?.agents ?? [];
    } catch {
      return [];
    }
  }

  /** Upload a file to kernel-evolving */
  async uploadFile(uri: string, fileName: string, mimeType: string): Promise<string | null> {
    try {
      const formData = new FormData();
      formData.append('file', { uri, name: fileName, type: mimeType } as any);
      const res = await this.client.post(`${this.getBaseUrl()}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 30000,
      });
      return res.data?.url ?? null;
    } catch {
      return null;
    }
  }

  /** Stream a chat message via SSE — returns an abort controller */
  streamMessage(
    text: string,
    callbacks: StreamCallbacks,
    options?: { chatId?: string; toolsEnabled?: boolean }
  ): AbortController {
    const controller = new AbortController();
    const url = `${this.getBaseUrl()}/message/stream?text=${encodeURIComponent(text)}${
      options?.chatId ? `&chat_id=${options.chatId}` : ''
    }${options?.toolsEnabled ? '&tools=true' : ''}`;

    fetch(url, {
      method: 'GET',
      signal: controller.signal,
    })
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
              if (data === '[DONE]') {
                callbacks.onDone();
                return;
              }
              try {
                const parsed = JSON.parse(data);
                if (parsed.event === 'token' || parsed.text) {
                  callbacks.onToken(parsed.text ?? '');
                }
              } catch {
                callbacks.onToken(data);
              }
            }
          }
        }
        callbacks.onDone();
      })
      .catch((err) => {
        if (err.name !== 'AbortError') {
          callbacks.onError(err);
        }
      });

    return controller;
  }
}

export const kernelClient = new KernelApiClient();
export default KernelApiClient;
