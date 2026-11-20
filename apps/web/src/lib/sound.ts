class SoundEngine {
  private ctx: AudioContext | null = null;
  private enabled: boolean = true;
  private masterVolume: number = 0.8;
  private sirenOsc: OscillatorNode | null = null;
  private sirenGain: GainNode | null = null;
  private sirenLfo: OscillatorNode | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('typefest_sound_enabled');
      this.enabled = saved !== null ? saved === 'true' : true;
      const savedVol = localStorage.getItem('typefest_sound_volume');
      if (savedVol !== null) {
        this.masterVolume = parseFloat(savedVol) || 0.8;
      }
    }
  }

  private initCtx(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  public setEnabled(value: boolean): void {
    this.enabled = value;
    if (typeof window !== 'undefined') {
      localStorage.setItem('typefest_sound_enabled', String(value));
    }
    if (!value) {
      this.stopSiren();
    }
  }

  public getVolume(): number {
    return this.masterVolume;
  }

  public setVolume(volume: number): void {
    this.masterVolume = Math.max(0, Math.min(1, volume));
    if (typeof window !== 'undefined') {
      localStorage.setItem('typefest_sound_volume', String(this.masterVolume));
    }
    if (this.sirenGain && this.ctx) {
      this.sirenGain.gain.setValueAtTime(0.08 * this.masterVolume, this.ctx.currentTime);
    }
  }

  public toggle(): boolean {
    this.setEnabled(!this.enabled);
    return this.enabled;
  }

  // Mechanical switch key press
  public playKeyClick(): void {
    if (!this.enabled || this.masterVolume <= 0) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      filter.type = 'bandpass';
      filter.frequency.value = 1800 + (Math.random() * 400 - 200);
      filter.Q.value = 3;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(350 + (Math.random() * 60 - 30), ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.04);

      gain.gain.setValueAtTime(0.25 * this.masterVolume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.04);
    } catch {}
  }

  // Laser zap sound for Shooter
  public playLaser(): void {
    if (!this.enabled || this.masterVolume <= 0) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(950, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + 0.1);

      gain.gain.setValueAtTime(0.18 * this.masterVolume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } catch {}
  }

  // Heavy plasma torpedo for shooter
  public playTorpedo(): void {
    if (!this.enabled || this.masterVolume <= 0) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(450, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.2);

      gain.gain.setValueAtTime(0.25 * this.masterVolume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    } catch {}
  }

  // Explosion boom for Shooter / Crash with dynamic scale
  public playExplosion(scale: 'small' | 'medium' | 'large' | 'huge' = 'medium'): void {
    if (!this.enabled || this.masterVolume <= 0) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      let startFreq = 120;
      let endFreq = 30;
      let duration = 0.3;
      let baseGain = 0.35;

      if (scale === 'small') {
        startFreq = 220;
        endFreq = 60;
        duration = 0.18;
        baseGain = 0.2;
      } else if (scale === 'medium') {
        startFreq = 140;
        endFreq = 35;
        duration = 0.32;
        baseGain = 0.32;
      } else if (scale === 'large') {
        startFreq = 95;
        endFreq = 22;
        duration = 0.48;
        baseGain = 0.45;
      } else if (scale === 'huge') {
        startFreq = 75;
        endFreq = 15;
        duration = 0.65;
        baseGain = 0.55;
      }

      osc.type = scale === 'small' ? 'sawtooth' : 'triangle';
      osc.frequency.setValueAtTime(startFreq, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(endFreq, ctx.currentTime + duration);

      gain.gain.setValueAtTime(baseGain * this.masterVolume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch {}
  }

  // Nitro screech / boost sound
  public playNitro(): void {
    if (!this.enabled || this.masterVolume <= 0) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(260, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(750, ctx.currentTime + 0.25);

      gain.gain.setValueAtTime(0.2 * this.masterVolume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } catch {}
  }

  // Police Siren warble (toggleable loop with urgency)
  public startSiren(urgency: 'low' | 'high' = 'low'): void {
    if (!this.enabled || this.masterVolume <= 0) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    if (this.sirenOsc) {
      // Update existing siren frequency if urgency changed
      try {
        if (this.sirenLfo) {
          this.sirenLfo.frequency.setValueAtTime(urgency === 'high' ? 5.5 : 2.5, ctx.currentTime);
        }
      } catch {}
      return;
    }

    try {
      const osc = ctx.createOscillator();
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.value = urgency === 'high' ? 780 : 620;

      lfo.type = 'triangle';
      lfo.frequency.value = urgency === 'high' ? 5.5 : 2.5; // Warble rate
      lfoGain.gain.value = urgency === 'high' ? 260 : 180;  // Modulate range

      lfo.connect(osc.frequency);

      gain.gain.setValueAtTime(0.09 * this.masterVolume, ctx.currentTime);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      lfo.start();

      this.sirenOsc = osc;
      this.sirenLfo = lfo;
      this.sirenGain = gain;
    } catch {}
  }

  public stopSiren(): void {
    if (this.sirenOsc) {
      try {
        this.sirenOsc.stop();
        this.sirenOsc.disconnect();
      } catch {}
      this.sirenOsc = null;
    }
    if (this.sirenLfo) {
      try {
        this.sirenLfo.stop();
        this.sirenLfo.disconnect();
      } catch {}
      this.sirenLfo = null;
    }
    this.sirenGain = null;
  }

  // Proximity alert pulse
  public playProximityAlert(): void {
    if (!this.enabled || this.masterVolume <= 0) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(920, ctx.currentTime);
      osc.frequency.setValueAtTime(1240, ctx.currentTime + 0.05);

      gain.gain.setValueAtTime(0.22 * this.masterVolume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } catch {}
  }

  // Correct word submission
  public playCorrect(): void {
    if (!this.enabled || this.masterVolume <= 0) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    try {
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.value = freq;

        const startTime = ctx.currentTime + idx * 0.05;
        gain.gain.setValueAtTime(0.18 * this.masterVolume, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.22);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + 0.22);
      });
    } catch {}
  }

  // Error buzzer
  public playError(): void {
    if (!this.enabled || this.masterVolume <= 0) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(160, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(90, ctx.currentTime + 0.15);

      gain.gain.setValueAtTime(0.25 * this.masterVolume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } catch {}
  }

  // Countdown tick
  public playTick(): void {
    if (!this.enabled || this.masterVolume <= 0) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, ctx.currentTime);

      gain.gain.setValueAtTime(0.18 * this.masterVolume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    } catch {}
  }

  // Go / Start game
  public playGo(): void {
    if (!this.enabled || this.masterVolume <= 0) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.3);

      gain.gain.setValueAtTime(0.25 * this.masterVolume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch {}
  }
}

export const sound = new SoundEngine();
