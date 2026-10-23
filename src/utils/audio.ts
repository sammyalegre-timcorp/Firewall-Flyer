class SoundEngine {
  private ctx: AudioContext | null = null;
  private bgmInterval: number | null = null;
  private isBgmPlaying = false;
  private bgmStep = 0;

  private init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  private jetpackOsc: OscillatorNode | null = null;
  private jetpackGain: GainNode | null = null;

  startJetpack(enabled = true) {
    if (!enabled) return;
    this.init();
    if (!this.ctx || this.jetpackOsc) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(90, now);
      osc.frequency.linearRampToValueAtTime(140, now + 0.2);

      // Lowpass filter for smooth jet rumble
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(320, now);

      gain.gain.setValueAtTime(0.08, now);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      this.jetpackOsc = osc;
      this.jetpackGain = gain;
    } catch {
      // Audio fallback silent
    }
  }

  stopJetpack() {
    if (this.jetpackOsc && this.ctx && this.jetpackGain) {
      try {
        const now = this.ctx.currentTime;
        this.jetpackGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        this.jetpackOsc.stop(now + 0.09);
      } catch {}
      this.jetpackOsc = null;
      this.jetpackGain = null;
    }
  }

  playFlap(enabled = true) {
    this.startJetpack(enabled);
  }

  playCoin(enabled = true) {
    if (!enabled) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;

      // Note 1
      const osc1 = this.ctx.createOscillator();
      const gain1 = this.ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(987.77, now); // B5
      gain1.gain.setValueAtTime(0.15, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      osc1.connect(gain1);
      gain1.connect(this.ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.13);

      // Note 2 (higher 5th)
      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1318.51, now + 0.08); // E6
      gain2.gain.setValueAtTime(0.18, now + 0.08);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc2.connect(gain2);
      gain2.connect(this.ctx.destination);
      osc2.start(now + 0.08);
      osc2.stop(now + 0.36);
    } catch {
      // Ignore
    }
  }

  playLevelUp(enabled = true) {
    if (!enabled) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const notes = [440, 554.37, 659.25, 880, 1108.73]; // A4, C#5, E5, A5, C#6
      notes.forEach((freq, i) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        const t = now + i * 0.08;

        osc.type = 'square';
        osc.frequency.setValueAtTime(freq, t);

        gain.gain.setValueAtTime(0.12, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);

        osc.start(t);
        osc.stop(t + 0.2);
      });
    } catch {
      // Ignore
    }
  }

  playHit(enabled = true) {
    if (!enabled) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      // White noise explosion burst
      const bufferSize = this.ctx.sampleRate * 0.3;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const whiteNoise = this.ctx.createBufferSource();
      whiteNoise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800, now);
      filter.frequency.exponentialRampToValueAtTime(60, now + 0.3);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

      whiteNoise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      whiteNoise.start(now);
      whiteNoise.stop(now + 0.32);
    } catch {
      // Ignore
    }
  }

  playClick(enabled = true) {
    if (!enabled) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(300, now + 0.05);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.06);
    } catch {
      // Ignore
    }
  }

  setBgm(enable: boolean) {
    if (enable) {
      this.startBgm();
    } else {
      this.stopBgm();
    }
  }

  startBgm() {
    if (this.isBgmPlaying) return;
    this.init();
    if (!this.ctx) return;

    this.isBgmPlaying = true;
    const bassline = [110, 110, 130.81, 146.83, 110, 110, 98, 123.47]; // A2 bass riff
    const arps = [440, 523.25, 659.25, 783.99, 880, 659.25, 523.25, 440];

    const stepDuration = 220; // ms
    this.bgmStep = 0;

    this.bgmInterval = window.setInterval(() => {
      if (!this.ctx || !this.isBgmPlaying) return;
      try {
        const now = this.ctx.currentTime;
        const noteIndex = this.bgmStep % bassline.length;

        // Bass synth
        const bassOsc = this.ctx.createOscillator();
        const bassGain = this.ctx.createGain();
        bassOsc.type = 'sawtooth';
        bassOsc.frequency.setValueAtTime(bassline[noteIndex], now);
        bassGain.gain.setValueAtTime(0.04, now);
        bassGain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
        bassOsc.connect(bassGain);
        bassGain.connect(this.ctx.destination);
        bassOsc.start(now);
        bassOsc.stop(now + 0.2);

        // Arp synth (every second step)
        if (this.bgmStep % 2 === 0) {
          const arpOsc = this.ctx.createOscillator();
          const arpGain = this.ctx.createGain();
          arpOsc.type = 'triangle';
          arpOsc.frequency.setValueAtTime(arps[(this.bgmStep / 2) % arps.length], now);
          arpGain.gain.setValueAtTime(0.025, now);
          arpGain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
          arpOsc.connect(arpGain);
          arpGain.connect(this.ctx.destination);
          arpOsc.start(now);
          arpOsc.stop(now + 0.32);
        }

        this.bgmStep++;
      } catch {
        // Ignore
      }
    }, stepDuration);
  }

  stopBgm() {
    this.isBgmPlaying = false;
    if (this.bgmInterval !== null) {
      clearInterval(this.bgmInterval);
      this.bgmInterval = null;
    }
  }
}

export const sound = new SoundEngine();
