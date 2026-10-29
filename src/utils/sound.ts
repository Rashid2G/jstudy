// Web Audio API based ambient synthesizer and gentle chime bell

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
      this.ctx.resume();
    }
    return this.ctx;
  }

  // Plays a soothing Tibetan singing bowl chime when focus period completes
  playChime(): void {
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;

      // Multi-harmonic gentle bell frequencies: Fundamental + Overtones
      const frequencies = [432, 864, 1296, 2160];
      const gains = [0.25, 0.12, 0.06, 0.02];

      frequencies.forEach((freq, index) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);

        // Gentle envelope: fast 15ms attack, long peaceful exponential decay
        const peakGain = gains[index];
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.linearRampToValueAtTime(peakGain, now + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 3.8);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 4.0);
      });
    } catch (e) {
      console.warn('Web Audio chime could not play:', e);
    }
  }

  // Ambient sound synthesizer (zero external dependencies)
  startAmbient(type: string, volume: number = 0.4): void {
    if (type === 'none' || volume <= 0) {
      this.stopAmbient();
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
