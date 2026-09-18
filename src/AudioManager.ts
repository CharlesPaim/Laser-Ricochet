import { TuningConfig } from './TuningConfig';

export type CannonType = 'standard' | 'heavy' | 'sniper' | 'scatter' | 'boss';

export class AudioManager {
  private ctx: AudioContext | null = null;
  private masterGainNode: GainNode | null = null;
  private sfxGainNode: GainNode | null = null;
  private isMuted: boolean = false;
  private isMutedForAd: boolean = false;
  private masterVolume: number = TuningConfig.audio.masterVolume;
  private sfxVolume: number = TuningConfig.audio.sfxVolume;
  private bgmVolume: number = 1.0;

  private humOsc: OscillatorNode | null = null;
  private humGain: GainNode | null = null;
  private isHumPlaying: boolean = false;

  // Procedural BGM Sequencer
  private bgmMode: 'off' | 'regular' | 'boss' = 'off';
  private bgmTimer: number | null = null;
  private bgmNextNoteTime: number = 0;
  private bgmStep: number = 0;
  private bgmGain: GainNode | null = null;
  private isBgmPaused: boolean = false;

  // Callbacks for telemetry & events
  public onBossMusicStart?: () => void;
  public onBossMusicEnd?: () => void;

  constructor() {
    // Proactively unlock Web Audio on the very first user interaction
    const unlock = () => {
      this.init();
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
    };
    if (typeof window !== 'undefined') {
      ['pointerdown', 'mousedown', 'keydown', 'touchstart'].forEach(type => {
        window.addEventListener(type, unlock, { passive: true });
      });
    }
  }

  public init(): void {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.masterGainNode = this.ctx.createGain();
        this.masterGainNode.gain.setValueAtTime(this.isMuted ? 0 : this.masterVolume, this.ctx.currentTime);
        this.masterGainNode.connect(this.ctx.destination);

        this.sfxGainNode = this.ctx.createGain();
        this.sfxGainNode.gain.setValueAtTime(this.sfxVolume, this.ctx.currentTime);
        this.sfxGainNode.connect(this.masterGainNode);

        this.bgmGain = this.ctx.createGain();
        this.bgmGain.gain.setValueAtTime(0.0001, this.ctx.currentTime);
        this.bgmGain.connect(this.masterGainNode);
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public getMasterOutput(): AudioNode {
    return this.sfxGainNode || this.masterGainNode || (this.ctx ? this.ctx.destination : null as unknown as AudioNode);
  }

  public muteForAd(): void {
    this.isMutedForAd = true;
    if (this.ctx && this.masterGainNode) {
      const now = this.ctx.currentTime;
      this.masterGainNode.gain.cancelScheduledValues(now);
      this.masterGainNode.gain.setValueAtTime(0, now);
    }
  }

  public unmuteAfterAd(): void {
    this.isMutedForAd = false;
    if (this.ctx && this.masterGainNode) {
      const now = this.ctx.currentTime;
      this.masterGainNode.gain.cancelScheduledValues(now);
      this.masterGainNode.gain.setValueAtTime(this.isMuted ? 0 : this.masterVolume, now);
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.ctx && this.masterGainNode && !this.isMutedForAd) {
      const now = this.ctx.currentTime;
      this.masterGainNode.gain.cancelScheduledValues(now);
      this.masterGainNode.gain.setValueAtTime(this.isMuted ? 0 : this.masterVolume, now);
    }
    return this.isMuted;
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  public setMasterVolume(val: number): void {
    this.masterVolume = Math.max(0, Math.min(1, val));
    if (this.ctx && this.masterGainNode && !this.isMuted && !this.isMutedForAd) {
      const now = this.ctx.currentTime;
      this.masterGainNode.gain.cancelScheduledValues(now);
      this.masterGainNode.gain.setValueAtTime(this.masterVolume, now);
    }
  }

  public getMasterVolume(): number {
    return this.masterVolume;
  }

  public setSfxVolume(val: number): void {
    this.sfxVolume = Math.max(0, Math.min(1, val));
    if (this.ctx && this.sfxGainNode) {
      const now = this.ctx.currentTime;
      this.sfxGainNode.gain.cancelScheduledValues(now);
      this.sfxGainNode.gain.setValueAtTime(this.sfxVolume, now);
    }
  }

  public getSfxVolume(): number {
    return this.sfxVolume;
  }

  public setBgmVolume(val: number): void {
    this.bgmVolume = Math.max(0, Math.min(1, val));
    if (this.ctx && this.bgmGain && this.bgmMode !== 'off') {
      const now = this.ctx.currentTime;
      const baseVol = this.bgmMode === 'boss'
        ? TuningConfig.audio.bgmBossVolume
        : TuningConfig.audio.bgmRegularVolume;
      const targetGain = baseVol * this.bgmVolume;
      this.bgmGain.gain.cancelScheduledValues(now);
      this.bgmGain.gain.linearRampToValueAtTime(Math.max(0.0001, targetGain), now + 0.1);
    }
  }

  public getBgmVolume(): number {
    return this.bgmVolume;
  }

  public playLaserShot(): void {
    this.init();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(880, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(220, this.ctx.currentTime + 0.08);

    gain.gain.setValueAtTime(TuningConfig.audio.masterVolume * 0.25, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);

    osc.connect(gain);
    gain.connect(this.getMasterOutput());
    osc.start();
    osc.stop(this.ctx.currentTime + 0.08);
  }

  public playSniperShot(): void {
    this.init();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(1600, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(180, this.ctx.currentTime + 0.14);

    gain.gain.setValueAtTime(TuningConfig.audio.masterVolume * 0.45, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.14);

    osc.connect(gain);
    gain.connect(this.getMasterOutput());
    osc.start();
    osc.stop(this.ctx.currentTime + 0.14);
  }

  public playScatterShot(): void {
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    [0, 0.04].forEach((offset, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(720 - idx * 120, now + offset);
      osc.frequency.exponentialRampToValueAtTime(250, now + offset + 0.07);
      gain.gain.setValueAtTime(TuningConfig.audio.masterVolume * 0.25, now + offset);
      gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.07);
      osc.connect(gain);
      gain.connect(this.getMasterOutput());
      osc.start(now + offset);
      osc.stop(now + offset + 0.07);
    });
  }

  public playDeflect(isParry: boolean, combo: number = 0): void {
    this.init();
    if (!this.ctx) return;

    const chordNotes = [261.63, 329.63, 392.0, 523.25, 659.25, 783.99, 1046.5];
    const noteIdx = Math.min(combo, chordNotes.length - 1);
    const baseFreq = isParry ? chordNotes[noteIdx] * 1.5 : (chordNotes[noteIdx] || 440);

    if (isParry) {
      // Inharmonic Metallic Clang Resonance: [1, 1.6, 2.3, 3.1] partials + noise burst (LRN-020, RNF-08)
      const now = this.ctx.currentTime;
      [1, 1.6, 2.3, 3.1].forEach((mult, i) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = i % 2 === 0 ? 'triangle' : 'sine';
        const startFreq = baseFreq * mult;
        osc.frequency.setValueAtTime(startFreq, now);
        osc.frequency.exponentialRampToValueAtTime(startFreq * 0.55, now + 0.22 - i * 0.02);

        gain.gain.setValueAtTime(TuningConfig.audio.masterVolume * (0.45 / (i + 1)), now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22 - i * 0.02);

        osc.connect(gain);
        gain.connect(this.getMasterOutput());
        osc.start(now);
        osc.stop(now + 0.23);
      });

      // Bandpass noise burst for crisp metallic edge
      this.playNoiseBurst(0.06, 4200, 0.35, 'bandpass');
    } else {
      // Regular smooth deflect
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(baseFreq, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.45, this.ctx.currentTime + 0.1);

      gain.gain.setValueAtTime(TuningConfig.audio.masterVolume * 0.4, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.1);

      osc.connect(gain);
      gain.connect(this.getMasterOutput());
      osc.start();
      osc.stop(this.ctx.currentTime + 0.1);

      this.playNoiseBurst(0.04, 3000, 0.18, 'bandpass');
    }
  }

  public playStreakTier(tier: 3 | 5 | 8): void {
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const notes = tier === 3 ? [523.25, 659.25, 783.99] : [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((f, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, now + idx * 0.04);
      gain.gain.setValueAtTime(TuningConfig.audio.masterVolume * 0.5, now + idx * 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.04 + 0.25);
      osc.connect(gain);
      gain.connect(this.getMasterOutput());
      osc.start(now + idx * 0.04);
      osc.stop(now + idx * 0.04 + 0.25);
    });
  }

  public playShieldRicochet(): void {
    this.init();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(1900, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(800, this.ctx.currentTime + 0.09);

    gain.gain.setValueAtTime(TuningConfig.audio.masterVolume * 0.5, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.09);

    osc.connect(gain);
    gain.connect(this.getMasterOutput());
    osc.start();
    osc.stop(this.ctx.currentTime + 0.09);
  }

  public playShieldBreak(): void {
    this.init();
    if (!this.ctx) return;

    this.playNoiseBurst(0.28, 1800, 0.45, 'bandpass');
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(1200, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(180, this.ctx.currentTime + 0.28);

    gain.gain.setValueAtTime(TuningConfig.audio.masterVolume * 0.55, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.28);

    osc.connect(gain);
    gain.connect(this.getMasterOutput());
    osc.start();
    osc.stop(this.ctx.currentTime + 0.28);
  }

  public playEnrageAlarm(): void {
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(680, now);
    osc.frequency.linearRampToValueAtTime(940, now + 0.16);

    gain.gain.setValueAtTime(TuningConfig.audio.masterVolume * 0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    osc.connect(gain);
    gain.connect(this.getMasterOutput());
    osc.start(now);
    osc.stop(now + 0.2);
  }

  public playBossOverheat(): void {
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(260, now);
    osc.frequency.linearRampToValueAtTime(580, now + 0.22);
    osc.frequency.linearRampToValueAtTime(260, now + 0.44);

    gain.gain.setValueAtTime(TuningConfig.audio.masterVolume * 0.55, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    osc.connect(gain);
    gain.connect(this.getMasterOutput());
    osc.start(now);
    osc.stop(now + 0.45);
  }

  public playMegaBeamCharge(): void {
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(110, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.7);

    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(TuningConfig.audio.masterVolume * 0.6, now + 0.65);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.75);

    osc.connect(gain);
    gain.connect(this.getMasterOutput());
    osc.start(now);
    osc.stop(now + 0.75);
  }

  public playMegaBeamFire(): void {
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(90, now + 0.35);

    gain.gain.setValueAtTime(TuningConfig.audio.masterVolume * 0.9, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.connect(gain);
    gain.connect(this.getMasterOutput());
    osc.start(now);
    osc.stop(now + 0.35);
  }

  public playAbsorb(): void {
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(1320, now + 0.18);

    gain.gain.setValueAtTime(TuningConfig.audio.masterVolume * 0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    osc.connect(gain);
    gain.connect(this.getMasterOutput());
    osc.start(now);
    osc.stop(now + 0.18);
  }

  /**
   * Refined Explosion SFX tailored by Enemy Archetype
   */
  public playExplosion(type: CannonType = 'standard'): void {
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;

    if (type === 'boss') {
      // Cascading detonation with 3 consecutive impacts and deep sub rumble
      for (let i = 0; i < 3; i++) {
        const offset = i * 0.09;
        this.playNoiseBurst(0.45 - i * 0.08, 260 - i * 40, 0.65, 'lowpass');
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = i === 2 ? 'sawtooth' : 'triangle';
        osc.frequency.setValueAtTime(140 - i * 35, now + offset);
        osc.frequency.exponentialRampToValueAtTime(35, now + offset + 0.35);
        gain.gain.setValueAtTime(TuningConfig.audio.masterVolume * 0.75, now + offset);
        gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.35);
        osc.connect(gain);
        gain.connect(this.getMasterOutput());
        osc.start(now + offset);
        osc.stop(now + offset + 0.35);
      }
      return;
    }

    if (type === 'heavy') {
      // Deep dual sub-bass impact (80Hz -> 30Hz) with lowpass rumble
      this.playNoiseBurst(0.35, 340, 0.55, 'lowpass');
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(80, now);
      osc.frequency.exponentialRampToValueAtTime(30, now + 0.32);
      gain.gain.setValueAtTime(TuningConfig.audio.masterVolume * 0.75, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.connect(gain);
      gain.connect(this.getMasterOutput());
      osc.start(now);
      osc.stop(now + 0.35);
      return;
    }

    if (type === 'sniper') {
      // High crystalline fragmentation (3600Hz -> 600Hz) with crisp bandpass
      this.playNoiseBurst(0.18, 3800, 0.45, 'bandpass');
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(3600, now);
      osc.frequency.exponentialRampToValueAtTime(600, now + 0.22);
      gain.gain.setValueAtTime(TuningConfig.audio.masterVolume * 0.55, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
      osc.connect(gain);
      gain.connect(this.getMasterOutput());
      osc.start(now);
      osc.stop(now + 0.22);
      return;
    }

    if (type === 'scatter') {
      // Dual crisp popping crackle
      [0, 0.05].forEach((offset) => {
        this.playNoiseBurst(0.16, 1200, 0.35, 'bandpass');
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(480, now + offset);
        osc.frequency.exponentialRampToValueAtTime(90, now + offset + 0.16);
        gain.gain.setValueAtTime(TuningConfig.audio.masterVolume * 0.4, now + offset);
        gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.16);
        osc.connect(gain);
        gain.connect(this.getMasterOutput());
        osc.start(now + offset);
        osc.stop(now + offset + 0.16);
      });
      return;
    }

    // Standard: Crisp percussive snap (340Hz -> 65Hz)
    this.playNoiseBurst(0.2, 700, 0.45, 'lowpass');
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(340, now);
    osc.frequency.exponentialRampToValueAtTime(65, now + 0.18);
    gain.gain.setValueAtTime(TuningConfig.audio.masterVolume * 0.55, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
    osc.connect(gain);
    gain.connect(this.getMasterOutput());
    osc.start(now);
    osc.stop(now + 0.18);
  }

  public playCoreDamage(): void {
    this.init();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(60, this.ctx.currentTime + 0.2);

    gain.gain.setValueAtTime(TuningConfig.audio.masterVolume * 0.6, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.2);

    osc.connect(gain);
    gain.connect(this.getMasterOutput());
    osc.start();
    osc.stop(this.ctx.currentTime + 0.2);
  }

  public playVictory(): void {
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    [523.25, 659.25, 783.99, 1046.50, 1318.51].forEach((f, i) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, now + i * 0.06);
      gain.gain.setValueAtTime(0.25, now + i * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.06 + 0.2);
      osc.connect(gain);
      gain.connect(this.getMasterOutput());
      osc.start(now + i * 0.06);
      osc.stop(now + i * 0.06 + 0.2);
    });
  }

  public playWaveClear(): void {
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 987.77, 1046.5];
    notes.forEach((f, i) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, now + i * 0.08);
      gain.gain.setValueAtTime(TuningConfig.audio.masterVolume * 0.35, now + i * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.3);
      osc.connect(gain);
      gain.connect(this.getMasterOutput());
      osc.start(now + i * 0.08);
      osc.stop(now + i * 0.08 + 0.3);
    });
  }

  public playOverloadReady(): void {
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(1320, now + 0.22);

    gain.gain.setValueAtTime(TuningConfig.audio.masterVolume * 0.45, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

    osc.connect(gain);
    gain.connect(this.getMasterOutput());
    osc.start(now);
    osc.stop(now + 0.22);
  }

  public playSuperRicochet(): void {
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(1800, now);
    osc1.frequency.exponentialRampToValueAtTime(300, now + 0.2);

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(900, now);
    osc2.frequency.exponentialRampToValueAtTime(150, now + 0.2);

    gain.gain.setValueAtTime(TuningConfig.audio.masterVolume * 0.8, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.getMasterOutput());

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.2);
    osc2.stop(now + 0.2);
  }

  public playPowerup(): void {
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    [659.25, 880, 1174.66, 1760].forEach((f, i) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, now + i * 0.05);
      gain.gain.setValueAtTime(TuningConfig.audio.masterVolume * 0.4, now + i * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.05 + 0.2);
      osc.connect(gain);
      gain.connect(this.getMasterOutput());
      osc.start(now + i * 0.05);
      osc.stop(now + i * 0.05 + 0.2);
    });
  }

  public playEnrage(): void {
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.linearRampToValueAtTime(160, now + 0.35);

    gain.gain.setValueAtTime(TuningConfig.audio.masterVolume * 0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.connect(gain);
    gain.connect(this.getMasterOutput());
    osc.start(now);
    osc.stop(now + 0.35);
  }

  public playBossVictoryStinger(): void {
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const output = this.getMasterOutput();

    // Fanfarra triunfal em D Maior (D3, F#3, A3, D4) com sub-grave
    const chordNotes = [146.83, 185.0, 220.0, 293.66, 369.99, 440.0, 587.33];
    chordNotes.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = idx < 3 ? 'sawtooth' : 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.05);

      gain.gain.setValueAtTime(0.0001, now + idx * 0.05);
      gain.gain.linearRampToValueAtTime(TuningConfig.audio.masterVolume * 0.35, now + idx * 0.05 + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.3);

      osc.connect(gain);
      gain.connect(output);
      osc.start(now + idx * 0.05);
      osc.stop(now + 1.35);
    });

    this.playNoiseBurst(0.35, 3600, 0.3, 'bandpass');
  }

  // =========================================================================
  // Procedural BGM Engine (Regular Combat Synthwave vs. Boss Tension Dark Synth)
  // Zero Asset Bloat: 100% synthesized in real time via Web Audio API (RNF-02)
  // =========================================================================

  public setBgmMode(mode: 'off' | 'regular' | 'boss'): void {
    this.init();
    if (!this.ctx) return;
    if (this.bgmMode === mode) return;

    const prevMode = this.bgmMode;
    this.bgmMode = mode;

    if (prevMode === 'boss' && mode !== 'boss') {
      this.onBossMusicEnd?.();
    } else if (mode === 'boss') {
      this.onBossMusicStart?.();
    }

    if (mode === 'off') {
      this.stopBgm();
      return;
    }

    const now = this.ctx.currentTime;
    const targetGain = (mode === 'boss'
      ? TuningConfig.audio.bgmBossVolume
      : TuningConfig.audio.bgmRegularVolume) * this.bgmVolume;

    if (!this.bgmGain) {
      this.bgmGain = this.ctx.createGain();
      this.bgmGain.connect(this.masterGainNode || this.ctx.destination);
    }

    this.bgmGain.gain.cancelScheduledValues(now);
    this.bgmGain.gain.setValueAtTime(this.bgmGain.gain.value || 0.0001, now);
    this.bgmGain.gain.linearRampToValueAtTime(targetGain, now + 0.35);

    if (!this.bgmTimer) {
      this.bgmNextNoteTime = now + 0.05;
      this.bgmStep = 0;
      this.startBgmLoop();
    }
  }

  private startBgmLoop(): void {
    if (this.bgmTimer) return;

    this.bgmTimer = window.setInterval(() => {
      if (!this.ctx || this.isBgmPaused || this.bgmMode === 'off') return;

      const scheduleAheadTime = 0.16;
      const bpm = this.bgmMode === 'boss' ? TuningConfig.audio.bgmBossBpm : TuningConfig.audio.bgmRegularBpm;
      const stepDuration = (60 / bpm) / 4; // 16th note

      while (this.bgmNextNoteTime < this.ctx.currentTime + scheduleAheadTime) {
        this.scheduleBgmStep(this.bgmStep, this.bgmNextNoteTime, this.bgmMode);
        this.bgmStep = (this.bgmStep + 1) % 32;
        this.bgmNextNoteTime += stepDuration;
      }
    }, 40);
  }

  private scheduleBgmStep(step: number, time: number, mode: 'regular' | 'boss'): void {
    if (!this.ctx || !this.bgmGain) return;

    if (mode === 'regular') {
      // 120 BPM Cyberpunk Synthwave Groove (Key of A minor)
      // Bass line on 8th notes
      if (step % 2 === 0) {
        const bassNotes = [110, 110, 130.81, 110, 146.83, 110, 164.81, 130.81]; // A2, C3, D3, E3
        const freq = bassNotes[(step / 2) % bassNotes.length];
        const osc = this.ctx.createOscillator();
        const filter = this.ctx.createBiquadFilter();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, time);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(480, time);
        filter.frequency.exponentialRampToValueAtTime(140, time + 0.1);

        gain.gain.setValueAtTime(0.38, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.12);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.bgmGain);
        osc.start(time);
        osc.stop(time + 0.13);
      }

      // Melodic cyber arpeggio on 16th notes (chime-like)
      const arpNotes = [440, 523.25, 659.25, 880, 659.25, 523.25, 440, 392.0];
      const arpFreq = arpNotes[step % arpNotes.length];
      const aOsc = this.ctx.createOscillator();
      const aGain = this.ctx.createGain();
      aOsc.type = 'sine';
      aOsc.frequency.setValueAtTime(arpFreq, time);
      aGain.gain.setValueAtTime(0.08, time);
      aGain.gain.exponentialRampToValueAtTime(0.001, time + 0.09);
      aOsc.connect(aGain);
      aGain.connect(this.bgmGain);
      aOsc.start(time);
      aOsc.stop(time + 0.09);

      // Hi-hat tick noise on 16th notes
      if (step % 2 === 1) {
        this.scheduleTickNoise(time, 0.015, 6000, 0.05);
      }
    } else {
      // 138 BPM Dark Industrial Boss Battle Drive (Key of D minor)
      // Heavy syncopated kick pulse on beat 1, 2, 3, 4
      if (step % 4 === 0) {
        const kOsc = this.ctx.createOscillator();
        const kGain = this.ctx.createGain();
        kOsc.type = 'sine';
        kOsc.frequency.setValueAtTime(145, time);
        kOsc.frequency.exponentialRampToValueAtTime(36, time + 0.09);
        kGain.gain.setValueAtTime(0.65, time);
        kGain.gain.exponentialRampToValueAtTime(0.001, time + 0.11);
        kOsc.connect(kGain);
        kGain.connect(this.bgmGain);
        kOsc.start(time);
        kOsc.stop(time + 0.11);
      }

      // Heavy industrial snare/noise hit on beats 2 & 4
      if (step % 8 === 4) {
        this.scheduleTickNoise(time, 0.07, 1800, 0.22);
      }

      // Menacing grinding bassline in D minor
      const bossBass = [73.42, 73.42, 110.0, 77.78, 87.31, 73.42, 116.54, 98.0]; // D2, A2, Eb2, F2
      const bFreq = bossBass[Math.floor(step / 2) % bossBass.length];
      const bOsc = this.ctx.createOscillator();
      const bFilter = this.ctx.createBiquadFilter();
      const bGain = this.ctx.createGain();

      bOsc.type = 'sawtooth';
      bOsc.frequency.setValueAtTime(bFreq, time);
      bFilter.type = 'lowpass';
      bFilter.frequency.setValueAtTime(620, time);
      bFilter.frequency.exponentialRampToValueAtTime(160, time + 0.1);

      bGain.gain.setValueAtTime(0.48, time);
      bGain.gain.exponentialRampToValueAtTime(0.001, time + 0.11);

      bOsc.connect(bFilter);
      bFilter.connect(bGain);
      bGain.connect(this.bgmGain);
      bOsc.start(time);
      bOsc.stop(time + 0.12);

      // Fast tense rising synth arp on 16th notes
      const bossArp = [587.33, 698.46, 880.0, 1046.5, 987.77, 880.0, 698.46, 622.25];
      const aFreq = bossArp[step % bossArp.length];
      const baOsc = this.ctx.createOscillator();
      const baGain = this.ctx.createGain();
      baOsc.type = 'triangle';
      baOsc.frequency.setValueAtTime(aFreq, time);
      baGain.gain.setValueAtTime(0.12, time);
      baGain.gain.exponentialRampToValueAtTime(0.001, time + 0.08);
      baOsc.connect(baGain);
      baGain.connect(this.bgmGain);
      baOsc.start(time);
      baOsc.stop(time + 0.08);
    }
  }

  private scheduleTickNoise(time: number, duration: number, freq: number, volume: number): void {
    if (!this.ctx || !this.bgmGain) return;
    try {
      const bufferSize = Math.max(1, Math.floor(this.ctx.sampleRate * duration));
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(freq, time);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(volume, time);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.bgmGain);
      noise.start(time);
      noise.stop(time + duration);
    } catch {}
  }

  public pauseBgm(): void {
    if (!this.ctx || !this.bgmGain) return;
    this.isBgmPaused = true;
    const now = this.ctx.currentTime;
    this.bgmGain.gain.cancelScheduledValues(now);
    this.bgmGain.gain.setValueAtTime(this.bgmGain.gain.value, now);
    this.bgmGain.gain.linearRampToValueAtTime(0.0001, now + 0.15);
  }

  public resumeBgm(): void {
    if (!this.ctx || !this.bgmGain || this.bgmMode === 'off') return;
    this.isBgmPaused = false;
    const now = this.ctx.currentTime;
    const targetGain = this.bgmMode === 'boss'
      ? TuningConfig.audio.bgmBossVolume * TuningConfig.audio.masterVolume
      : TuningConfig.audio.bgmRegularVolume * TuningConfig.audio.masterVolume;
    this.bgmGain.gain.cancelScheduledValues(now);
    this.bgmGain.gain.setValueAtTime(0.0001, now);
    this.bgmGain.gain.linearRampToValueAtTime(targetGain, now + 0.35);
    this.bgmNextNoteTime = now + 0.05;
  }

  public stopBgm(): void {
    if (this.bgmTimer) {
      clearInterval(this.bgmTimer);
      this.bgmTimer = null;
    }
    this.bgmMode = 'off';
    if (this.bgmGain && this.ctx) {
      const now = this.ctx.currentTime;
      this.bgmGain.gain.cancelScheduledValues(now);
      this.bgmGain.gain.setValueAtTime(this.bgmGain.gain.value, now);
      this.bgmGain.gain.linearRampToValueAtTime(0.0001, now + 0.2);
    }
  }

  // =========================================================================
  // Ambient Hum & Helper Methods
  // =========================================================================

  private playNoiseBurst(duration: number, filterFreq: number, peak = 0.5, filterType: BiquadFilterType = 'bandpass'): void {
    if (!this.ctx) return;
    try {
      const bufferSize = Math.max(1, Math.floor(this.ctx.sampleRate * duration));
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = filterType;
      filter.frequency.setValueAtTime(filterFreq, this.ctx.currentTime);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(TuningConfig.audio.masterVolume * peak, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.getMasterOutput());

      noise.start();
      noise.stop(this.ctx.currentTime + duration);
    } catch {}
  }

  public startAmbientHum(): void {
    this.init();
    if (!this.ctx || this.isHumPlaying) return;

    try {
      const now = this.ctx.currentTime;
      this.humOsc = this.ctx.createOscillator();
      this.humGain = this.ctx.createGain();

      this.humOsc.type = 'sine';
      this.humOsc.frequency.setValueAtTime(55, now);

      const targetGain = TuningConfig.audio.ambientHumVolume * TuningConfig.audio.masterVolume;
      this.humGain.gain.setValueAtTime(0.0001, now);
      this.humGain.gain.exponentialRampToValueAtTime(Math.max(0.0001, targetGain), now + 1.2);

      this.humOsc.connect(this.humGain);
      this.humGain.connect(this.masterGainNode || (this.ctx ? this.ctx.destination : null as unknown as AudioNode));
      this.humOsc.start(now);
      this.isHumPlaying = true;
    } catch {}
  }

  public pauseAmbientHum(): void {
    if (!this.ctx || !this.humGain || !this.isHumPlaying) return;
    try {
      const now = this.ctx.currentTime;
      this.humGain.gain.cancelScheduledValues(now);
      this.humGain.gain.setValueAtTime(this.humGain.gain.value, now);
      this.humGain.gain.linearRampToValueAtTime(0.0001, now + 0.2);
    } catch {}
  }

  public resumeAmbientHum(): void {
    if (!this.ctx || !this.humGain || !this.isHumPlaying) return;
    try {
      const now = this.ctx.currentTime;
      const targetGain = TuningConfig.audio.ambientHumVolume * TuningConfig.audio.masterVolume;
      this.humGain.gain.cancelScheduledValues(now);
      this.humGain.gain.setValueAtTime(this.humGain.gain.value, now);
      this.humGain.gain.linearRampToValueAtTime(targetGain, now + 0.4);
    } catch {}
  }

  public stopAmbientHum(): void {
    if (!this.humOsc) return;
    try {
      this.humOsc.stop();
      this.humOsc.disconnect();
      this.humGain?.disconnect();
    } catch {}
    this.humOsc = null;
    this.humGain = null;
    this.isHumPlaying = false;
  }
}
