/**
 * VoiceService — audio recording and playback using expo-audio
 * Records voice, uploads to kernel-evolving for STT, plays back responses.
 *
 * expo-audio imperative API (non-hook) used since this is a singleton service.
 *
 * @see https://docs.expo.dev/versions/latest/sdk/audio/
 */

import {
  createAudioPlayer,
  setAudioModeAsync,
  requestRecordingPermissionsAsync,
  RecordingPresets,
  AudioModule,
} from 'expo-audio';

type VoiceState = 'idle' | 'recording' | 'playing';

interface RecordingCallbacks {
  onStateChange?: (state: VoiceState) => void;
  onRecordingComplete?: (uri: string) => void;
  onError?: (error: Error) => void;
}

class VoiceService {
  private player: import('expo-audio').AudioPlayer | null = null;
  private recorder: import('expo-audio').AudioRecorder | null = null;
  private state: VoiceState = 'idle';
  private callbacks: RecordingCallbacks = {};
  private playbackCheckTimer: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.setupAudio();
  }

  private async setupAudio(): Promise<void> {
    try {
      await setAudioModeAsync({
        playsInSilentMode: true,
        allowsRecording: true,
        shouldPlayInBackground: false,
        interruptionMode: 'duckOthers',
      });
    } catch (err) {
      console.warn('VoiceService: audio setup failed', err);
    }
  }

  /** Register callbacks */
  setCallbacks(cbs: RecordingCallbacks): void {
    this.callbacks = cbs;
  }

  private setState(newState: VoiceState): void {
    this.state = newState;
    this.callbacks.onStateChange?.(newState);
  }

  /** Start recording audio */
  async startRecording(): Promise<boolean> {
    try {
      if (this.state === 'recording') {
        console.warn('Already recording');
        return false;
      }

      // Ensure previous recording is cleaned up
      await this.cleanupRecording();

      // Request microphone permission
      const { granted } = await requestRecordingPermissionsAsync();
      if (!granted) {
        throw new Error('Microphone permission denied');
      }

      // Create recorder with HIGH_QUALITY preset
      this.recorder = new AudioModule.AudioRecorder(RecordingPresets.HIGH_QUALITY);
      await this.recorder.prepareToRecordAsync();
      this.recorder.record();

      this.setState('recording');
      return true;
    } catch (err: any) {
      this.callbacks.onError?.(err);
      this.setState('idle');
      return false;
    }
  }

  /** Stop recording and return the file URI */
  async stopRecording(): Promise<string | null> {
    try {
      if (!this.recorder) {
        return null;
      }

      await this.recorder.stop();
      const uri = this.recorder.uri;
      this.recorder = null;
      this.setState('idle');

      if (uri) {
        this.callbacks.onRecordingComplete?.(uri);
      }

      return uri;
    } catch (err: any) {
      this.callbacks.onError?.(err);
      this.setState('idle');
      return null;
    }
  }

  /** Play audio from a URI */
  async playAudio(uri: string): Promise<boolean> {
    try {
      await this.stopAudio();

      // Create an imperative AudioPlayer that doesn't auto-release
      this.player = createAudioPlayer(uri);
      this.player.play();
      this.setState('playing');

      // Poll for playback completion
      // AudioPlayer doesn't expose a didJustFinish event imperatively,
      // so we check the `playing` property periodically.
      this.playbackCheckTimer = setInterval(() => {
        if (this.player && !this.player.playing) {
          this.clearPlaybackCheckTimer();
          this.setState('idle');
        }
      }, 500);

      return true;
    } catch (err: any) {
      this.callbacks.onError?.(err);
      this.setState('idle');
      return false;
    }
  }

  /** Stop current playback */
  async stopAudio(): Promise<void> {
    this.clearPlaybackCheckTimer();

    if (this.player) {
      try {
        this.player.pause();
        // Wait briefly for pause to settle, then release
        await new Promise((r) => setTimeout(r, 50));
        this.player.remove();
      } catch {
        // Ignore cleanup errors
      }
      this.player = null;
      this.setState('idle');
    }
  }

  /** Cancel ongoing recording */
  async cancelRecording(): Promise<void> {
    if (this.recorder) {
      try {
        await this.recorder.stop();
      } catch {
        // Ignore
      }
      this.recorder = null;
      this.setState('idle');
    }
  }

  /** Get current voice state */
  getState(): VoiceState {
    return this.state;
  }

  /** Clean up resources */
  async dispose(): Promise<void> {
    await this.cancelRecording();
    await this.stopAudio();
  }

  private clearPlaybackCheckTimer(): void {
    if (this.playbackCheckTimer !== null) {
      clearInterval(this.playbackCheckTimer);
      this.playbackCheckTimer = null;
    }
  }

  private async cleanupRecording(): Promise<void> {
    if (this.recorder) {
      try {
        await this.recorder.stop();
      } catch {
        // Ignore
      }
      this.recorder = null;
    }
  }
}

export const voiceService = new VoiceService();
export default VoiceService;
