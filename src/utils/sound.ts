// Web Audio API based ambient recordings and gentle chime bells

const AMBIENT_FILES: Record<string, string> = {
  rain: 'rain',
  fireplace: 'hearth',
  cafe: 'cafe',
  waves: 'waves',
  whitenoise: 'wind',
  wind: 'wind',
  ac: 'ac',
};

const SOUND_BASE = `${import.meta.env.BASE_URL}sounds/`;

function ambientSourceUrls(file: string): string[] {
  // Ogg Vorbis loops without encoder gaps. Older Safari falls back to MP3.
  const audio = typeof document !== 'undefined' ? document.createElement('audio') : null;
  const supportsOgg =
    !!audio &&
    typeof audio.canPlayType === 'function' &&
    audio.canPlayType('audio/ogg; codecs="vorbis"') !== '';
  const extensions = supportsOgg ? ['ogg', 'mp3'] : ['mp3', 'ogg'];
  return extensions.map((extension) => `${SOUND_BASE}${file}.${extension}`);
}

class SoundController {
  private ctx: AudioContext | null = null;
  private ambientSource: AudioBufferSourceNode | null = null;
  private ambientGain: GainNode | null = null;
  private ambientFilter: BiquadFilterNode | null = null;
  private currentAmbientType: string = 'none';
  private ambientVolume = 0.4;
  private loadingType: string | null = null;
  private loadToken = 0;
  private readonly bufferCache = new Map<string, AudioBuffer>();
  private readonly loadPromises = new Map<string, Promise<AudioBuffer>>();

  private getContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  async resumeContext(): Promise<void> {
    if (this.ctx && this.ctx.state === 'suspended') {
      try {
        await this.ctx.resume();
      } catch {
        // ignore
      }
    }
  }

  // Plays an uplifting resonant tone when the timer starts (plays for at least 2 seconds)
  playTimerStart(): void {
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;

      // Resonant harmonic chord: C5 (523.25 Hz), E5 (659.25 Hz), G5 (783.99 Hz)
      const notes = [
        { freq: 523.25, gain: 0.22, delay: 0 },
        { freq: 659.25, gain: 0.18, delay: 0.12 },
        { freq: 783.99, gain: 0.20, delay: 0.24 },
        { freq: 1046.5, gain: 0.1, delay: 0.36 },
      ];

      notes.forEach(({ freq, gain: peakGain, delay }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + delay);

        const startTime = now + delay;
        gain.gain.setValueAtTime(0.0001, startTime);
        gain.gain.linearRampToValueAtTime(peakGain, startTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 2.4);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + 2.45);
      });
    } catch (e) {
      console.warn('Web Audio timer start sound could not play:', e);
    }
  }

  // Plays an attention-grabbing multi-strike chime when time is up (plays for >3 seconds, at least 2s)
  playTimerEnd(): void {
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;

      // 3-strike mindfulness alert sequence that clearly determines time is up and captures attention
      const strikes = [
        { time: 0.0, baseFreq: 587.33, peak: 0.28 }, // D5
        { time: 0.7, baseFreq: 783.99, peak: 0.3 }, // G5
        { time: 1.4, baseFreq: 1046.5, peak: 0.32 }, // C6
      ];

      strikes.forEach(({ time, baseFreq, peak }) => {
        const strikeTime = now + time;
        const harmonics = [
          { mult: 1, relGain: 1.0 },
          { mult: 2.01, relGain: 0.45 },
          { mult: 3.02, relGain: 0.2 },
          { mult: 4.5, relGain: 0.08 },
        ];

        harmonics.forEach(({ mult, relGain }) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = 'sine';
          osc.frequency.setValueAtTime(baseFreq * mult, strikeTime);

          const nodePeak = peak * relGain;
          gain.gain.setValueAtTime(0.0001, strikeTime);
          gain.gain.linearRampToValueAtTime(nodePeak, strikeTime + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.0001, strikeTime + 2.1);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(strikeTime);
          osc.stop(strikeTime + 2.15);
        });
      });
    } catch (e) {
      console.warn('Web Audio timer end sound could not play:', e);
    }
  }

  // Backwards-compatible alias for playTimerEnd
  playChime(): void {
    this.playTimerEnd();
  }

  private async loadAmbient(type: string): Promise<AudioBuffer> {
    const cached = this.bufferCache.get(type);
    if (cached) return cached;

    const inflight = this.loadPromises.get(type);
    if (inflight) return inflight;

    const file = AMBIENT_FILES[type] ?? AMBIENT_FILES.whitenoise;
    const load = (async () => {
      let lastError: unknown;

      for (const url of ambientSourceUrls(file)) {
        try {
          const response = await fetch(url);
          if (!response.ok) {
            throw new Error(`Failed to load ${url}: ${response.status}`);
          }
          const data = await response.arrayBuffer();
          const buffer = await this.getContext().decodeAudioData(data);
          this.bufferCache.set(type, buffer);
          return buffer;
        } catch (error) {
          lastError = error;
        }
      }

      throw lastError instanceof Error ? lastError : new Error(`Unable to load ambient sound: ${type}`);
    })();

    this.loadPromises.set(type, load);
    try {
      return await load;
    } finally {
      this.loadPromises.delete(type);
    }
  }

  private playAmbientBuffer(type: string, buffer: AudioBuffer): void {
    try {
      const ctx = this.getContext();
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.loop = true;

      // Gentle top-end rolloff keeps the field recordings from sounding harsh.
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(14000, ctx.currentTime);
      filter.Q.setValueAtTime?.(0.5, ctx.currentTime);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(Math.max(0, Math.min(1, this.ambientVolume)), ctx.currentTime);

      source.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      source.start();
      this.ambientSource = source;
      this.ambientGain = gain;
      this.ambientFilter = filter;
      this.currentAmbientType = type;
    } catch (e) {
      console.warn('Could not start ambient sound:', e);
    }
  }

  // Ambient sound player (real field recordings, loaded on demand)
  startAmbient(type: string, volume: number = 0.4): void {
    this.ambientVolume = Math.max(0, Math.min(1, volume));

    if (type === 'none' || volume <= 0) {
      this.stopAmbient();
      return;
    }

    // Already playing or loading this atmosphere: just update the volume.
    if (this.currentAmbientType === type && (this.ambientSource || this.loadingType === type)) {
      this.setAmbientVolume(volume);
      return;
    }

    this.stopAmbient();
    this.currentAmbientType = type;
    this.loadingType = type;
    const token = ++this.loadToken;

    void this.loadAmbient(type)
      .then((buffer) => {
        if (token !== this.loadToken || this.currentAmbientType !== type) return;
        this.loadingType = null;
        this.playAmbientBuffer(type, buffer);
      })
      .catch((error) => {
        if (token === this.loadToken) {
          this.loadingType = null;
          this.currentAmbientType = 'none';
        }
        console.warn('Could not load ambient sound:', error);
      });
  }

  setAmbientVolume(volume: number): void {
    this.ambientVolume = Math.max(0, Math.min(1, volume));
    if (!this.ambientGain || !this.ctx) return;

    const now = this.ctx.currentTime;
    const gain = this.ambientGain.gain;
    gain.cancelScheduledValues?.(now);
    if (typeof gain.setTargetAtTime === 'function') {
      // Short ramp avoids zipper noise while dragging the slider.
      gain.setTargetAtTime(this.ambientVolume, now, 0.03);
    } else {
      gain.setValueAtTime(this.ambientVolume, now);
    }
  }

  stopAmbient(): void {
    this.loadToken++;
    this.loadingType = null;

    if (this.ambientSource) {
      try {
        this.ambientSource.stop();
      } catch {
        // ignore already stopped
      }
      try {
        this.ambientSource.disconnect();
      } catch {
        // ignore
      }
      this.ambientSource = null;
    }
    if (this.ambientFilter) {
      try {
        this.ambientFilter.disconnect();
      } catch {
        // ignore
      }
      this.ambientFilter = null;
    }
    if (this.ambientGain) {
      try {
        this.ambientGain.disconnect();
      } catch {
        // ignore
      }
      this.ambientGain = null;
    }
    this.currentAmbientType = 'none';
  }

  getCurrentAmbientType(): string {
    return this.currentAmbientType;
  }
}

export const sound = new SoundController();
