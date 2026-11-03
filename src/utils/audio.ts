// Procedural Web Audio engine with master volume, BGM, and SFX controls
class SoundEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private bgmGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;

  private bgmInterval: number | null = null;
  private isBgmPlaying = false;
  private bgmStep = 0;
  private currentTheme: 'cyber_arcade' | 'magic_academy' = 'cyber_arcade';

  private masterVol = 0.7;
  private bgmVol = 0.5;
  private sfxVol = 0.8;

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        const savedMaster = localStorage.getItem('tim_master_volume_v1');
        if (savedMaster !== null) this.masterVol = parseFloat(savedMaster);
        const savedBgm = localStorage.getItem('tim_bgm_volume_v1');
        if (savedBgm !== null) this.bgmVol = parseFloat(savedBgm);
        const savedSfx = localStorage.getItem('tim_sfx_volume_v1');
        if (savedSfx !== null) this.sfxVol = parseFloat(savedSfx);
      } catch {}
    }
  }

  private init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();

        // Master Gain
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(this.masterVol, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);

        // BGM Gain
        this.bgmGain = this.ctx.createGain();
        this.bgmGain.gain.setValueAtTime(this.bgmVol, this.ctx.currentTime);
        this.bgmGain.connect(this.masterGain);

        // SFX Gain
        this.sfxGain = this.ctx.createGain();
        this.sfxGain.gain.setValueAtTime(this.sfxVol, this.ctx.currentTime);
        this.sfxGain.connect(this.masterGain);
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  // Volume Controls
  setMasterVolume(val: number) {
    this.masterVol = Math.max(0, Math.min(1, val));
    try {
      localStorage.setItem('tim_master_volume_v1', this.masterVol.toString());
    } catch {}
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.masterVol, this.ctx.currentTime);
    }
  }

  getMasterVolume(): number {
    return this.masterVol;
  }

  setBgmVolume(val: number) {
    this.bgmVol = Math.max(0, Math.min(1, val));
    try {
      localStorage.setItem('tim_bgm_volume_v1', this.bgmVol.toString());
    } catch {}
    if (this.bgmGain && this.ctx) {
      this.bgmGain.gain.setValueAtTime(this.bgmVol, this.ctx.currentTime);
    }
  }

  getBgmVolume(): number {
    return this.bgmVol;
  }

  setSfxVolume(val: number) {
    this.sfxVol = Math.max(0, Math.min(1, val));
    try {
      localStorage.setItem('tim_sfx_volume_v1', this.sfxVol.toString());
    } catch {}
    if (this.sfxGain && this.ctx) {
      this.sfxGain.gain.setValueAtTime(this.sfxVol, this.ctx.currentTime);
    }
  }

  getSfxVolume(): number {
    return this.sfxVol;
  }

  setTheme(theme: 'cyber_arcade' | 'magic_academy') {
    if (this.currentTheme !== theme) {
      this.currentTheme = theme;
      if (this.isBgmPlaying) {
        this.stopBgm();
        this.startBgm();
      }
    }
  }

  private jetpackOsc: OscillatorNode | null = null;
  private jetpackGain: GainNode | null = null;

  startJetpack(enabled = true) {
    if (!enabled || this.masterVol === 0 || this.sfxVol === 0) return;
    this.init();
    if (!this.ctx || !this.sfxGain || this.jetpackOsc) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      if (this.currentTheme === 'magic_academy') {
        // Magical breeze / whoosh
        osc.type = 'sine';
        osc.frequency.setValueAtTime(140, now);
        osc.frequency.linearRampToValueAtTime(260, now + 0.3);
        gain.gain.setValueAtTime(0.06, now);
      } else {
        // Dual turbine jetpack rumble
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(90, now);
        osc.frequency.linearRampToValueAtTime(140, now + 0.2);

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(320, now);

        gain.gain.setValueAtTime(0.08, now);
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(now);
        this.jetpackOsc = osc;
        this.jetpackGain = gain;
        return;
      }

      osc.connect(gain);
      gain.connect(this.sfxGain);

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
    if (!enabled || this.masterVol === 0 || this.sfxVol === 0) return;
    this.init();
    if (!this.ctx || !this.sfxGain) return;

    try {
      const now = this.ctx.currentTime;

      if (this.currentTheme === 'magic_academy') {
        // Golden Snitch bell chime
        const freqs = [1046.5, 1318.51, 1567.98]; // C6, E6, G6
        freqs.forEach((freq, idx) => {
          const osc = this.ctx!.createOscillator();
          const gain = this.ctx!.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + idx * 0.04);
          gain.gain.setValueAtTime(0.12, now + idx * 0.04);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.04 + 0.25);
          osc.connect(gain);
          gain.connect(this.sfxGain!);
          osc.start(now + idx * 0.04);
          osc.stop(now + idx * 0.04 + 0.26);
        });
      } else {
        // Note 1
        const osc1 = this.ctx.createOscillator();
        const gain1 = this.ctx.createGain();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(987.77, now); // B5
        gain1.gain.setValueAtTime(0.15, now);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        osc1.connect(gain1);
        gain1.connect(this.sfxGain);
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
        gain2.connect(this.sfxGain);
        osc2.start(now + 0.08);
        osc2.stop(now + 0.36);
      }
    } catch {
      // Ignore
    }
  }

  playLevelUp(enabled = true) {
    if (!enabled || this.masterVol === 0 || this.sfxVol === 0) return;
    this.init();
    if (!this.ctx || !this.sfxGain) return;

    try {
      const now = this.ctx.currentTime;
      const notes = [440, 554.37, 659.25, 880, 1108.73]; // A4, C#5, E5, A5, C#6
      notes.forEach((freq, i) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        const t = now + i * 0.08;

        osc.type = this.currentTheme === 'magic_academy' ? 'triangle' : 'square';
        osc.frequency.setValueAtTime(freq, t);

        gain.gain.setValueAtTime(0.12, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

        osc.connect(gain);
        gain.connect(this.sfxGain!);

        osc.start(t);
        osc.stop(t + 0.2);
      });
    } catch {
      // Ignore
    }
  }

  playHit(enabled = true) {
    if (!enabled || this.masterVol === 0 || this.sfxVol === 0) return;
    this.init();
    if (!this.ctx || !this.sfxGain) return;

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
      gain.connect(this.sfxGain);

      whiteNoise.start(now);
      whiteNoise.stop(now + 0.32);
    } catch {
      // Ignore
    }
  }

  playClick(enabled = true) {
    if (!enabled || this.masterVol === 0 || this.sfxVol === 0) return;
    this.init();
    if (!this.ctx || !this.sfxGain) return;

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
      gain.connect(this.sfxGain);
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
    if (!this.ctx || !this.bgmGain) return;

    this.isBgmPlaying = true;
    this.bgmStep = 0;

    // Cyber Arcade chords & arps
    const cyberBass = [110, 110, 130.81, 146.83, 110, 110, 98, 123.47]; // A2 riff
    const cyberArps = [440, 523.25, 659.25, 783.99, 880, 659.25, 523.25, 440];

    // Magic Academy mystical arpeggios (Celesta & harp fantasy vibe)
    const magicBass = [130.81, 146.83, 164.81, 196.0, 174.61, 164.81, 146.83, 130.81]; // C3, D3, E3, G3, F3, E3, D3, C3
    const magicArps = [523.25, 659.25, 783.99, 987.77, 1046.5, 783.99, 659.25, 587.33]; // C5, E5, G5, B5, C6...

    const stepDuration = 220; // ms

    this.bgmInterval = window.setInterval(() => {
      if (!this.ctx || !this.bgmGain || !this.isBgmPlaying) return;
      try {
        const now = this.ctx.currentTime;
        const isMagic = this.currentTheme === 'magic_academy';
        const bassline = isMagic ? magicBass : cyberBass;
        const arps = isMagic ? magicArps : cyberArps;

        const noteIndex = this.bgmStep % bassline.length;

        // Bass synth
        const bassOsc = this.ctx.createOscillator();
        const bassSubGain = this.ctx.createGain();
        bassOsc.type = isMagic ? 'triangle' : 'sawtooth';
        bassOsc.frequency.setValueAtTime(bassline[noteIndex], now);
        bassSubGain.gain.setValueAtTime(isMagic ? 0.05 : 0.04, now);
        bassSubGain.gain.exponentialRampToValueAtTime(0.001, now + 0.19);
        bassOsc.connect(bassSubGain);
        bassSubGain.connect(this.bgmGain);
        bassOsc.start(now);
        bassOsc.stop(now + 0.2);

        // Arp melody synth (every step or every 2nd step)
        if (this.bgmStep % (isMagic ? 1 : 2) === 0) {
          const arpOsc = this.ctx.createOscillator();
          const arpSubGain = this.ctx.createGain();
          arpOsc.type = isMagic ? 'sine' : 'triangle';
          const arpIdx = (isMagic ? this.bgmStep : this.bgmStep / 2) % arps.length;
          arpOsc.frequency.setValueAtTime(arps[arpIdx], now);
          arpSubGain.gain.setValueAtTime(isMagic ? 0.035 : 0.025, now);
          arpSubGain.gain.exponentialRampToValueAtTime(0.001, now + (isMagic ? 0.35 : 0.28));
          arpOsc.connect(arpSubGain);
          arpSubGain.connect(this.bgmGain);
          arpOsc.start(now);
          arpOsc.stop(now + (isMagic ? 0.36 : 0.3));
        }

        this.bgmStep++;
      } catch {
        // Ignore audio errors
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
