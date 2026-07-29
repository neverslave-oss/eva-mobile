/**
 * SseStreamer — handles SSE connections to kernel-evolving
 * Wraps the streaming endpoint with reconnection logic.
 */

interface StreamEvent {
  event: string;
  text: string;
  done?: boolean;
}

type StreamCallback = (data: StreamEvent) => void;
type ErrorCallback = (error: Error) => void;
type DoneCallback = () => void;

interface StreamOptions {
  onToken?: (token: string) => void;
  onDone?: DoneCallback;
  onError?: ErrorCallback;
  signal?: AbortSignal;
}

const SSE_TIMEOUT_MS = 120_000; // 2 minutes
const RECONNECT_DELAY_MS = 2000;

class SseStreamer {
  private activeControllers: Map<string, AbortController> = new Map();

  /**
   * Connect to an SSE endpoint and stream tokens.
   * Returns a cleanup function.
   */
  connect(
    url: string,
    callbacks: StreamOptions
  ): () => void {
    const controller = new AbortController();
    const streamId = Math.random().toString(36).slice(2);
    this.activeControllers.set(streamId, controller);

    let timeout: ReturnType<typeof setTimeout> | null = null;

    const cleanup = () => {
      if (timeout) clearTimeout(timeout);
      controller.abort();
      this.activeControllers.delete(streamId);
    };

    const startStream = async () => {
      try {
        const response = await fetch(url, {
          method: 'GET',
          signal: controller.signal,
        });

        if (!response.ok) {
          callbacks.onError?.(new Error(`SSE HTTP ${response.status}`));
          return;
        }

        if (!response.body) {
          callbacks.onError?.(new Error('No response body'));
          return;
        }

        // Reset timeout on each data chunk
        const resetTimeout = () => {
          if (timeout) clearTimeout(timeout);
          timeout = setTimeout(() => {
            callbacks.onError?.(new Error('SSE timeout'));
            cleanup();
          }, SSE_TIMEOUT_MS);
        };

        resetTimeout();
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          resetTimeout();
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6).trim();

              if (data === '[DONE]') {
                callbacks.onDone?.();
                cleanup();
                return;
              }

              try {
                const parsed = JSON.parse(data);
                if (parsed.text) {
                  callbacks.onToken?.(parsed.text);
                }
              } catch {
                // Raw text — emit directly
                callbacks.onToken?.(data);
              }
            }
          }
        }

        callbacks.onDone?.();
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          callbacks.onError?.(err);
        }
      } finally {
        cleanup();
      }
    };

    startStream();
    return cleanup;
  }

  /** Abort all active SSE connections */
  abortAll(): void {
    this.activeControllers.forEach((controller) => controller.abort());
    this.activeControllers.clear();
  }
}

export const sseStreamer = new SseStreamer();
export default SseStreamer;
