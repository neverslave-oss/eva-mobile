/**
 * VoiceService — audio recording and playback using expo-audio / expo-av
 * Records voice, uploads to kernel-evolving for STT, plays back responses.
 */

import { Audio } from 'expo-av';

type VoiceState = 'idle' | 'recording' | 'playing';

interface RecordingCallbacks {
  onStateChange?: (state: VoiceState) => void;
  onRecordingComplete?: (uri: string) => void;
  onError?: (error: Error) => void;
}

class VoiceService {
  private recording: Audio.Recording | null = null;
  private sound: Audio.Sound | null = null;
  private state: VoiceState = 'idle';
  private callbacks: RecordingCallbacks = {};

  constructor() {
    this.setupAudio();
  }

  private async setupAudio(): Promise<void> {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
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

      const { recording, status } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      if (!status.canRecord) {
        throw new Error('Cannot start recording');
      }

      this.recording = recording;
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
      if (!this.recording) {
        return null;
      }

      await this.recording.stopAndUnloadAsync();
      const uri = this.recording.getURI();
      this.recording = null;
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

      const { sound } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: true }
      );

      this.sound = sound;
      this.setState('playing');

      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && !status.isPlaying && status.didJustFinish) {
          this.setState('idle');
        }
      });

      return true;
    } catch (err: any) {
      this.callbacks.onError?.(err);
      this.setState('idle');
      return false;
    }
  }

  /** Stop current playback */
  async stopAudio(): Promise<void> {
    if (this.sound) {
      try {
        await this.sound.stopAsync();
        await this.sound.unloadAsync();
      } catch {
        // Ignore cleanup errors
      }
      this.sound = null;
      this.setState('idle');
    }
  }

  /** Cancel ongoing recording */
  async cancelRecording(): Promise<void> {
    if (this.recording) {
      try {
        await this.recording.stopAndUnloadAsync();
      } catch {
        // Ignore
      }
      this.recording = null;
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

  private async cleanupRecording(): Promise<void> {
    if (this.recording) {
      try {
        await this.recording.stopAndUnloadAsync();
      } catch {
        // Ignore
      }
      this.recording = null;
    }
  }
}

export const voiceService = new VoiceService();
export default VoiceService;
