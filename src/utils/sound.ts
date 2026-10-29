// Web Audio API based ambient synthesizer and gentle chime bells

class SoundController {
  private ctx: AudioContext | null = null;
  private ambientSource: AudioNode | null = null;
  private ambientGain: GainNode | null = null;
  private currentAmbientType: string = 'none';

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
        { freq: 1046.50, gain: 0.10, delay: 0.36 },
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
        { time: 0.7, baseFreq: 783.99, peak: 0.30 }, // G5
        { time: 1.4, baseFreq: 1046.50, peak: 0.32 }, // C6
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

  // Ambient sound synthesizer (zero external dependencies)
  startAmbient(type: string, volume: number = 0.4): void {
    if (type === 'none' || volume <= 0) {
      this.stopAmbient();
      return;
    }

    // If the same ambient type is already active, smoothly update volume without re-synthesizing
    if (this.currentAmbientType === type && this.ambientSource) {
      this.setAmbientVolume(volume);
      return;
    }

    try {
      const ctx = this.getContext();
      this.stopAmbient();

      const sampleRate = ctx.sampleRate;
      const bufferDuration = 5; // 5 second seamless loop buffer
      const bufferSize = sampleRate * bufferDuration;
      const buffer = ctx.createBuffer(1, bufferSize, sampleRate);
      const output = buffer.getChannelData(0);

      if (type === 'rain') {
        // Pink noise with soft lowpass
        let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          b0 = 0.99886 * b0 + white * 0.0555179;
          b1 = 0.99332 * b1 + white * 0.0750759;
          b2 = 0.96900 * b2 + white * 0.1538520;
          b3 = 0.86650 * b3 + white * 0.3104856;
          b4 = 0.55000 * b4 + white * 0.5329522;
          b5 = -0.7616 * b5 - white * 0.0168980;
          output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.06;
          b6 = white * 0.115926;
        }
      } else if (type === 'fireplace') {
        // Brownian noise with random crackle pops
        let lastOut = 0.0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          lastOut = (lastOut + (0.02 * white)) / 1.02;
          // Random crackle
          const crackle = Math.random() > 0.9992 ? (Math.random() * 0.4 - 0.2) : 0;
          output[i] = (lastOut * 1.5 + crackle) * 0.12;
        }
      } else if (type === 'waves') {
        // Filtered pink noise simulating gentle shoreline wash
        let b0 = 0, b1 = 0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          b0 = 0.99 * b0 + white * 0.05;
          b1 = 0.96 * b1 + white * 0.1;
          // Periodic swell
          const swell = Math.sin((i / bufferSize) * Math.PI * 2) * 0.5 + 0.5;
          output[i] = (b0 + b1) * 0.08 * (0.4 + swell * 0.6);
        }
      } else if (type === 'cafe') {
        // Gentle warm room reverberation
        let b0 = 0, b1 = 0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          b0 = 0.98 * b0 + white * 0.06;
          b1 = 0.93 * b1 + white * 0.1;
          output[i] = (b0 + b1) * 0.07;
        }
      } else {
        // White noise
        for (let i = 0; i < bufferSize; i++) {
          output[i] = (Math.random() * 2 - 1) * 0.04;
        }
      }

      const noiseSource = ctx.createBufferSource();
      noiseSource.buffer = buffer;
      noiseSource.loop = true;

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(type === 'rain' ? 1200 : (type === 'fireplace' ? 600 : 900), ctx.currentTime);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(Math.max(0, Math.min(1, volume)), ctx.currentTime);

      noiseSource.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      noiseSource.start();
      this.ambientSource = noiseSource;
      this.ambientGain = gain;
      this.currentAmbientType = type;
    } catch (e) {
      console.warn('Could not start ambient sound:', e);
    }
  }

  setAmbientVolume(volume: number): void {
    if (this.ambientGain && this.ctx) {
      const safeVol = Math.max(0, Math.min(1, volume));
      this.ambientGain.gain.setValueAtTime(safeVol, this.ctx.currentTime);
    }
  }

  stopAmbient(): void {
    if (this.ambientSource) {
      try {
        (this.ambientSource as AudioBufferSourceNode).stop();
        this.ambientSource.disconnect();
      } catch {
        // ignore already stopped
      }
      this.ambientSource = null;
    }
    this.ambientGain = null;
    this.currentAmbientType = 'none';
  }

  getCurrentAmbientType(): string {
    return this.currentAmbientType;
  }
}

export const sound = new SoundController();
