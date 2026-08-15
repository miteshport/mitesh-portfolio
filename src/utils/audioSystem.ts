// Browser-Synthesized Web Audio Engine (Zero External MP3 Assets, Zero Bloat)
class WebAudioSystem {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;

  private init() {
    if (!this.ctx && typeof window !== "undefined") {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    return !this.isMuted;
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  // Soft high-frequency mechanical tactile click
  public playClick() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(800, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(200, this.ctx.currentTime + 0.04);

      gain.gain.setValueAtTime(0.06, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.04);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.04);
    } catch {
      // AudioContext autostart policy safe
    }
  }

  // Low-frequency harmonic sub-bass swell (3D Lotus / Mobius interaction)
  public playHarmonicHum() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "triangle";
      osc.frequency.setValueAtTime(120, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(180, this.ctx.currentTime + 0.15);

      gain.gain.setValueAtTime(0.03, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.18);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.18);
    } catch {
      // AudioContext autostart policy safe
    }
  }

  // Dual-tone victory resolution chime (P1 Incident Resolved)
  public playVictoryChime() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime + idx * 0.08);

        const startTime = this.ctx.currentTime + idx * 0.08;
        gain.gain.setValueAtTime(0.08, startTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.4);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + 0.4);
      });
    } catch {
      // AudioContext autostart policy safe
    }
  }

  // Christopher Nolan Heavy Titanium 3D Card Flip (Sub-bass thump + metallic latch)
  public playTitaniumFlip() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;

      // Layer 1: Sub-bass 45Hz physical inertial thump
      const subOsc = this.ctx.createOscillator();
      const subGain = this.ctx.createGain();
      subOsc.type = "sine";
      subOsc.frequency.setValueAtTime(65, now);
      subOsc.frequency.exponentialRampToValueAtTime(35, now + 0.12);

      subGain.gain.setValueAtTime(0.18, now);
      subGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.14);

      subOsc.connect(subGain);
      subGain.connect(this.ctx.destination);
      subOsc.start(now);
      subOsc.stop(now + 0.14);

      // Layer 2: High-frequency metallic latch click
      const latchOsc = this.ctx.createOscillator();
      const latchGain = this.ctx.createGain();
      latchOsc.type = "triangle";
      latchOsc.frequency.setValueAtTime(1400, now);
      latchOsc.frequency.exponentialRampToValueAtTime(240, now + 0.05);

      latchGain.gain.setValueAtTime(0.08, now);
      latchGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.06);

      latchOsc.connect(latchGain);
      latchGain.connect(this.ctx.destination);
      latchOsc.start(now);
      latchOsc.stop(now + 0.06);
    } catch {
      // AudioContext safe
    }
  }

  // Hans Zimmer Cinematic Credential Authorization Chime (432Hz Harmonic Resonance)
  public playZimmerChime() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      // 432Hz Golden Ratio Pythagorean Tuning (A4=432Hz, C5=518Hz, E5=648Hz, A5=864Hz)
      const frequencies = [216, 432, 648, 864];

      frequencies.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = idx === 0 ? "sine" : "triangle";
        osc.frequency.setValueAtTime(freq, now + idx * 0.04);

        const startTime = now + idx * 0.04;
        const peakGain = idx === 0 ? 0.14 : 0.06;
        gain.gain.setValueAtTime(peakGain, startTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.9);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + 0.95);
      });
    } catch {
      // AudioContext safe
    }
  }
}

export const audio = new WebAudioSystem();
