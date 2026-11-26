import type { TSpinType } from '../types/game';

const PENTATONIC_HZ = [
  261.63, // C4
  293.66, // D4
  329.63, // E4
  392.0, // G4
  440.0, // A4
  523.25, // C5
  587.33, // D5
  659.25, // E5
  783.99, // G5
  880.0, // A5
  1046.5, // C6
];

/**
 * Pure Web Audio API procedural sound & ambient groove synthesizer.
 * Zero external audio assets required.
 */
export class SoundEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private bgmGain: GainNode | null = null;

  private sfxVolume = 0.65;
  private bgmVolume = 0.28;
  private muted = false;

  private bgmTimer: number | null = null;
  private bgmStep = 0;
  private bgmPlaying = false;
  private currentLevel = 1;
  private lastSoftDropAt = 0;

  unlock(): void {
    if (typeof window === 'undefined') return;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.sfxGain = this.ctx.createGain();
      this.bgmGain = this.ctx.createGain();

      this.sfxGain.connect(this.masterGain);
      this.bgmGain.connect(this.masterGain);
      this.masterGain.connect(this.ctx.destination);
      this.applyVolumes();
    }

    if (this.ctx.state === 'suspended') {
      void this.ctx.resume().catch(() => {});
    }
  }

  configure(opts: { sfxVolume: number; bgmVolume: number; muted: boolean }): void {
    this.sfxVolume = opts.sfxVolume;
    this.bgmVolume = opts.bgmVolume;
    this.muted = opts.muted;
    this.applyVolumes();
  }

  setLevel(level: number): void {
    this.currentLevel = level;
  }

  private applyVolumes(): void {
    if (!this.ctx || !this.masterGain || !this.sfxGain || !this.bgmGain) return;
    const now = this.ctx.currentTime;
    this.masterGain.gain.setTargetAtTime(this.muted ? 0 : 1, now, 0.02);
    this.sfxGain.gain.setTargetAtTime(this.sfxVolume, now, 0.02);
    this.bgmGain.gain.setTargetAtTime(this.bgmVolume * 0.35, now, 0.04);
  }

  private isReady(): boolean {
    return !!this.ctx && !!this.sfxGain && this.ctx.state === 'running' && !this.muted;
  }

  playMove(): void {
    if (!this.isReady() || this.sfxVolume <= 0) return;
    const ctx = this.ctx!;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(240, now);
    osc.frequency.exponentialRampToValueAtTime(140, now + 0.035);

    gain.gain.setValueAtTime(0.14, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    osc.connect(gain);
    gain.connect(this.sfxGain!);
    osc.start(now);
    osc.stop(now + 0.045);
  }

  playRotate(isTSpin = false): void {
    if (!this.isReady() || this.sfxVolume <= 0) return;
    const ctx = this.ctx!;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(isTSpin ? 520 : 380, now);
    osc.frequency.exponentialRampToValueAtTime(isTSpin ? 780 : 540, now + 0.055);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

    osc.connect(gain);
    gain.connect(this.sfxGain!);
    osc.start(now);
    osc.stop(now + 0.065);
  }

  playSoftDrop(): void {
    if (!this.isReady() || this.sfxVolume <= 0) return;
    const perfNow = performance.now();
    if (perfNow - this.lastSoftDropAt < 45) return;
    this.lastSoftDropAt = perfNow;

    const ctx = this.ctx!;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.exponentialRampToValueAtTime(110, now + 0.03);
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);

    osc.connect(gain);
    gain.connect(this.sfxGain!);
    osc.start(now);
    osc.stop(now + 0.04);
  }

  playHardDrop(): void {
    if (!this.isReady() || this.sfxVolume <= 0) return;
    const ctx = this.ctx!;
    const now = ctx.currentTime;

    // Punchy sub-bass thud
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(155, now);
    osc.frequency.exponentialRampToValueAtTime(42, now + 0.11);

    gain.gain.setValueAtTime(0.45, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(gain);
    gain.connect(this.sfxGain!);
    osc.start(now);
    osc.stop(now + 0.13);

    // Crisp transient click
    const click = ctx.createOscillator();
    const clickGain = ctx.createGain();
    click.type = 'triangle';
    click.frequency.setValueAtTime(420, now);
    click.frequency.exponentialRampToValueAtTime(90, now + 0.03);
    clickGain.gain.setValueAtTime(0.18, now);
    clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);

    click.connect(clickGain);
    clickGain.connect(this.sfxGain!);
    click.start(now);
    click.stop(now + 0.04);
  }

  playHold(): void {
    if (!this.isReady() || this.sfxVolume <= 0) return;
    const ctx = this.ctx!;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(480, now + 0.075);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.085);

    osc.connect(gain);
    gain.connect(this.sfxGain!);
    osc.start(now);
    osc.stop(now + 0.09);
  }

  playLock(): void {
    if (!this.isReady() || this.sfxVolume <= 0) return;
    const ctx = this.ctx!;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(125, now);
    osc.frequency.exponentialRampToValueAtTime(68, now + 0.055);
    gain.gain.setValueAtTime(0.16, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

    osc.connect(gain);
    gain.connect(this.sfxGain!);
    osc.start(now);
    osc.stop(now + 0.065);
  }

  playLineClear(lines: number, combo: number, tSpin: TSpinType, isB2B: boolean): void {
    if (!this.isReady() || this.sfxVolume <= 0) return;
    const ctx = this.ctx!;
    const now = ctx.currentTime;

    const noteIdx = Math.min(PENTATONIC_HZ.length - 1, Math.max(0, combo) + Math.max(0, lines - 1));
    const rootHz = PENTATONIC_HZ[noteIdx];

    const isBig = lines >= 4 || tSpin !== 'none' || isB2B;
    const intervals = isBig ? [1, 1.25, 1.5, 2] : lines >= 2 ? [1, 1.5] : [1];

    intervals.forEach((ratio, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = isBig ? 'sawtooth' : 'triangle';

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(isBig ? 2800 : 1800, now);
      filter.frequency.exponentialRampToValueAtTime(480, now + 0.34);

      const start = now + idx * 0.025;
      const dur = isBig ? 0.38 : 0.22;

      osc.frequency.setValueAtTime(rootHz * ratio, start);
      gain.gain.setValueAtTime(0.001, start);
      gain.gain.linearRampToValueAtTime(isBig ? 0.16 : 0.22, start + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, start + dur);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(start);
      osc.stop(start + dur + 0.02);
    });
  }

  playAllClear(): void {
    if (!this.isReady() || this.sfxVolume <= 0) return;
    const ctx = this.ctx!;
    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5, 1318.51];

    notes.forEach((hz, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      const t = now + i * 0.055;
      osc.frequency.setValueAtTime(hz, t);
      gain.gain.setValueAtTime(0.22, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.32);

      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(t);
      osc.stop(t + 0.35);
    });
  }

  playLevelUp(): void {
    if (!this.isReady() || this.sfxVolume <= 0) return;
    const ctx = this.ctx!;
    const now = ctx.currentTime;
    [440, 554.37, 659.25].forEach((hz, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      const t = now + idx * 0.05;
      osc.frequency.setValueAtTime(hz, t);
      gain.gain.setValueAtTime(0.14, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(t);
      osc.stop(t + 0.2);
    });
  }

  playGameOver(): void {
    if (!this.isReady() || this.sfxVolume <= 0) return;
    const ctx = this.ctx!;
    const now = ctx.currentTime;
    [329.63, 293.66, 246.94, 196.0].forEach((hz, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      const t = now + idx * 0.1;
      osc.frequency.setValueAtTime(hz, t);
      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.26);
      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(t);
      osc.stop(t + 0.28);
    });
  }

  playVictory(): void {
    this.playAllClear();
  }

  startAmbient(): void {
    if (this.bgmPlaying) return;
    this.bgmPlaying = true;
    this.bgmStep = 0;

    const tick = () => {
      if (!this.bgmPlaying) return;
      if (this.ctx && this.bgmGain && this.ctx.state === 'running' && !this.muted && this.bgmVolume > 0) {
        this.scheduleAmbientNote();
      }
      const intervalMs = Math.max(210, 380 - (this.currentLevel - 1) * 8);
      this.bgmTimer = window.setTimeout(tick, intervalMs);
    };

    tick();
  }

  stopAmbient(): void {
    this.bgmPlaying = false;
    if (this.bgmTimer !== null) {
      window.clearTimeout(this.bgmTimer);
      this.bgmTimer = null;
    }
  }

  private scheduleAmbientNote(): void {
    const ctx = this.ctx!;
    const now = ctx.currentTime;
    // Restrained ambient harmonic sequence (Cmin9 / Abmaj7 / Fm9 / Gsus4)
    const bassPattern = [130.81, 130.81, 103.83, 103.83, 87.31, 87.31, 98.0, 98.0];
    const arpPattern = [261.63, 311.13, 392.0, 466.16, 261.63, 392.0, 466.16, 587.33];

    const step = this.bgmStep % 16;
    this.bgmStep++;

    // Subtle warm bass pulse on even beats
    if (step % 2 === 0) {
      const bassHz = bassPattern[Math.floor(step / 2) % bassPattern.length];
      const osc = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(bassHz, now);
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(280 + this.currentLevel * 20, now);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.24, now + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.42);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.bgmGain!);
      osc.start(now);
      osc.stop(now + 0.45);
    }

    // Soft glass arpeggio shimmer on sparse steps
    if (step % 4 === 1 || step % 4 === 3) {
      const arpHz = arpPattern[step % arpPattern.length];
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(arpHz, now);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.085, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.34);

      osc.connect(gain);
      gain.connect(this.bgmGain!);
      osc.start(now);
      osc.stop(now + 0.36);
    }
  }
}
