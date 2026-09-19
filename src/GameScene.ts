import Phaser from 'phaser';
import { TuningConfig } from './TuningConfig';
import { AudioManager } from './AudioManager';
import { PokiService } from './services/PokiService';
import { t, toggleLang, getLang } from './i18n/translations';
import { GAME_VERSION, GAME_BUILD_DATE, PATCH_NOTES } from './VersionConfig';
import {
  ArenaRenderer,
  CoreRenderer,
  BladeRenderer,
  LaserRenderer,
  CannonRenderer,
  EffectsRenderer,
  HudRenderer,
  AsteroidData,
  AsteroidVertex,
  FlyingFragmentParticleData,
} from './rendering';

type CannonType = 'standard' | 'heavy' | 'sniper' | 'scatter' | 'boss';
type PowerupType = 'blade_boost' | 'core_shield' | 'slow_mo' | 'multi_beam';

interface Cannon {
  id: number;
  x: number;
  y: number;
  radius: number;
  orbitAngle: number;
  orbitSpeed: number; // rad/s
  type: CannonType;
  hp: number;
  maxHp: number;
  angle: number; // Angle facing center
  nextFireTime: number;
  isDestroyed: boolean;
  hitFlashTimerMs: number;
  isEnraged: boolean;
  attackCycle?: number;
  color: number;
  // Boss Phase state
  bossPhase?: 'barrage' | 'vulnerable';
  bossPhaseTimerMs?: number;
  bossChargingMegaBeam?: boolean;
  shieldHp?: number;
  maxShieldHp?: number;
  recoilOffset?: number;
  spawnTimeMs?: number;
}

interface LaserOrb {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  isReflected: boolean;
  isOverloadShard: boolean;
  isSniper?: boolean;
  isHeavy?: boolean;
  isMegaBeam?: boolean;
  trajectoryType?: 'linear' | 'sine';
  sinePhase?: number;
  sineFrequency?: number;
  sineAmplitude?: number;
  sineOriginX?: number;
  sineOriginY?: number;
  sineDist?: number;
  sineAngle?: number;
  sineSpeed?: number;
  sourceCannonId: number;
  rally?: number;
  rallyLock?: number;
  fromNemesis?: boolean;
  megaDmg?: number;
}

export type NemesisState = 'stalk' | 'dash' | 'strike' | 'recover';

export interface NemesisEntity {
  active: boolean;
  angle: number;
  radius: number;
  x: number;
  y: number;
  bladeAngle: number;
  hp: number;
  maxHp: number;
  tier: number;
  hitFlash: number;
  spawnT: number;
  state: NemesisState;
  stateUntil: number;
  targetAngle: number;
  targetRadius: number;
  dashFrom: number;
  dashTo: number;
  dashRadiusFrom: number;
  dashRadiusTo: number;
  nextFireTime: number;
  parryFlash: number;
  ghostX: number[];
  ghostY: number[];
  ghostA: number[];
  ghostLen: number;
  ghostTick: number;
  rageTier: number;
}

interface PowerUpItem {
  id: number;
  x: number;
  y: number;
  type: PowerupType;
  radius: number;
  color: number;
  label: string;
  orbitAngle: number;
  orbitRadius: number;
  lifeTimeRemainingMs: number;
  maxLifeTimeMs: number;
}

interface Spark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: number;
}

interface DeflectVector {
  startX: number;
  startY: number;
  dirX: number;
  dirY: number;
  life: number;
  maxLife: number;
  color: number;
}

interface FloatingScore {
  textObj: Phaser.GameObjects.Text;
  life: number;
  maxLife: number;
  active: boolean;
}

interface BladeTrailGhost {
  ax: number;
  ay: number;
  bx: number;
  by: number;
  orbitRadius: number;
  startAngle: number;
  endAngle: number;
  color: number;
}

interface ExplosionDebris {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  vRot: number;
  size: number;
  color: number;
  life: number;
  maxLife: number;
}

interface ShockwaveRing {
  x: number;
  y: number;
  currentRadius: number;
  maxRadius: number;
  color: number;
  life: number;
  maxLife: number;
}

export interface GameStats {
  highScore: number;
  highestWave: number;
  highestCombo: number;
  totalParries: number;
  bossesDefeated: number;
  plasmaFragments: number;
  unlockedBlades: string[];
  selectedBlade: string;
}

export class GameScene extends Phaser.Scene {
  private audioManager!: AudioManager;
  private graphics!: Phaser.GameObjects.Graphics;

  private bladeAngle: number = 0;
  private bladeX: number = TuningConfig.arena.centerX;
  private bladeY: number = TuningConfig.arena.centerY;

  private asteroids: AsteroidData[] = [];
  private bladeTrail: BladeTrailGhost[] = [];
  private debris: ExplosionDebris[] = [];
  private shockwaves: ShockwaveRing[] = [];

  private cannons: Cannon[] = [];
  private lasers: LaserOrb[] = [];
  private powerups: PowerUpItem[] = [];
  private sparks: Spark[] = [];
  private deflectVectors: DeflectVector[] = [];

  // SHADOW DEFLECTOR (Nemesis Duel — Waves 10, 20, 30...) LRN-054
  private nemesis: NemesisEntity = GameScene.blankNemesis();
  private bestRallyRun: number = 0;

  public static blankNemesis(): NemesisEntity {
    const cx = TuningConfig.arena.centerX;
    const cy = TuningConfig.arena.centerY;
    const rMax = TuningConfig.nemesis.orbitMax;
    return {
      active: false,
      angle: -Math.PI / 2,
      radius: rMax,
      x: cx,
      y: cy - rMax,
      bladeAngle: 0,
      hp: 8,
      maxHp: 8,
      tier: 1,
      hitFlash: 0,
      spawnT: 0,
      state: 'stalk',
      stateUntil: 0,
      targetAngle: 0,
      targetRadius: rMax,
      dashFrom: 0,
      dashTo: 0,
      dashRadiusFrom: rMax,
      dashRadiusTo: rMax,
      nextFireTime: 0,
      parryFlash: 0,
      ghostX: new Array(6).fill(0),
      ghostY: new Array(6).fill(0),
      ghostA: new Array(6).fill(0),
      ghostLen: 0,
      ghostTick: 0,
      rageTier: 0,
    };
  }

  private coreHealth: number = TuningConfig.arena.coreMaxHealth;
  private currentWave: number = 1;
  private score: number = 0;
  private comboCount: number = 0;
  private isOverloaded: boolean = false;

  // Session Stats & Progression Tracking
  private perfectParriesCount: number = 0;
  private bossesDefeatedCount: number = 0;
  private maxComboSession: number = 0;
  private isNewHighScore: boolean = false;

  // Auto-Pause System
  private isPaused: boolean = false;
  private pauseStartTimestamp: number = 0;

  // Visual Damage Feedback
  private coreDamageFlashTimerMs: number = 0;
  private coreDamageRingRadius: number = 0;

  // FTUE State (Wave 1 In-Game Organic Tutorial)
  private hasMovedBlade: boolean = false;
  private ftueIdleTimerMs: number = 0;
  private ftueHintShown: boolean = false;
  private ftueFirstRicochetDone: boolean = false;
  private ftueFirstParryDone: boolean = false;
  private ftueFirstAggressiveDone: boolean = false;
  private parryCueTimerMs: number = 0;

  // Boss Event & Attack Variation State
  private lastBossPattern: string = '';
  private bossWarningTimerMs: number = 0;

  // UI Interactive Controls & Help Modal
  private isHelpOpen: boolean = false;
  private muteBtn!: Phaser.GameObjects.Text;
  private crtBtn!: Phaser.GameObjects.Text;
  private helpBtn!: Phaser.GameObjects.Text;
  private langBtn!: Phaser.GameObjects.Text;
  private helpTitleText!: Phaser.GameObjects.Text;
  private helpBodyText!: Phaser.GameObjects.Text;
  private helpCloseBtn!: Phaser.GameObjects.Text;

  // Version & Patch Notes State
  private versionBadgeText!: Phaser.GameObjects.Text;
  private isPatchNotesOpen: boolean = false;
  private patchNotesTitleText!: Phaser.GameObjects.Text;
  private patchNotesSubtitleText!: Phaser.GameObjects.Text;
  private patchNotesBodyText!: Phaser.GameObjects.Text;
  private patchNotesCloseBtn!: Phaser.GameObjects.Text;
  private patchNotesOpenedTime: number = 0;
  private helpOpenedTime: number = 0;

  // Powerup state
  private activePowerup: PowerupType | null = null;
  private powerupTimerMs: number = 0;
  private hasCoreShield: boolean = false;
  private duelBannerTimerMs: number = 0;

  private isRoundActive: boolean = false;
  private waveTransitioning: boolean = false;
  private restartAllowed: boolean = false;
  private hitstopTimerMs: number = 0;
  private parryActiveTimerMs: number = 0;

  private uiText!: Phaser.GameObjects.Text;
  private coreHudText!: Phaser.GameObjects.Text;
  private bannerText!: Phaser.GameObjects.Text;
  private subText!: Phaser.GameObjects.Text;
  private startButton!: Phaser.GameObjects.Text;
  private statusText!: Phaser.GameObjects.Text;
  private instructionText!: Phaser.GameObjects.Text;
  private popupText!: Phaser.GameObjects.Text;
  private powerupLabel!: Phaser.GameObjects.Text;
  private popupTween?: Phaser.Tweens.Tween;
  private floatingScores: FloatingScore[] = [];

  // Game Over & Results UI
  private gameOverTitle!: Phaser.GameObjects.Text;
  private gameOverRecordBanner!: Phaser.GameObjects.Text;
  private gameOverStatsText!: Phaser.GameObjects.Text;
  private restartButton!: Phaser.GameObjects.Text;
  private restartHintText!: Phaser.GameObjects.Text;
  private reviveButton!: Phaser.GameObjects.Text;

  // Pause UI
  private pauseOverlayText!: Phaser.GameObjects.Text;
  private pauseSubText!: Phaser.GameObjects.Text;
  private pauseBgmBtn!: Phaser.GameObjects.Text;
  private pauseSfxBtn!: Phaser.GameObjects.Text;

  // Poki SDK & Micro Meta-Game State
  private isShowingAd: boolean = false;
  private canReviveThisSession: boolean = true;
  private plasmaFragments: number = TuningConfig.economy.welcomeFragments;
  private unlockedBlades: string[] = ['standard'];
  private selectedBlade: string = 'standard';

  // Hangar / Garagem UI
  private fragmentsTitleText!: Phaser.GameObjects.Text;
  private bladeButtons: Phaser.GameObjects.Text[] = [];
  private bladeDescText!: Phaser.GameObjects.Text;

  private nextPowerupId: number = 1;

  // Controles Dual-Thumb Arcade & Ergonomia Mobile (LRN-040, LRN-049)
  private isTouchDevice: boolean = false;
  private isJoystickActive: boolean = false;
  private joystickPointerId: number | null = null;
  private joystickOriginX: number = 0;
  private joystickOriginY: number = 0;
  private joystickCurrentX: number = 0;
  private joystickCurrentY: number = 0;
  private parryBtnX: number = 845;
  private parryBtnY: number = 400;
  private parryBtnRadius: number = 46;
  private isParryBtnPressed: boolean = false;
  private parryPointerId: number | null = null;
  private parryBtnText!: Phaser.GameObjects.Text;
  private fullscreenBtn!: Phaser.GameObjects.Text;

  // Pool Estático Pré-Alocado de 16 Fragmentos Bezier (RNF-01.3)
  private flyingFragments: FlyingFragmentParticleData[] = [];

  // Micro-Quests de 1 Corrida
  private activeQuest: {
    id: string;
    title: string;
    description: string;
    type: string;
    target: number;
    current: number;
    rewardFragments: number;
    isCompleted: boolean;
  } | null = null;
  private questHudText!: Phaser.GameObjects.Text;

  // Mini-Rogue Modifiers (Wave 3, 6, 9...)
  private isMiniRogueOpen: boolean = false;
  private miniRogueTimerMs: number = 0;
  private pendingNextWave: number = 2;
  private activeModifiers: string[] = [];
  private miniRogueCards: Array<{
    id: string;
    name: string;
    icon: string;
    description: string;
    x: number;
    y: number;
    w: number;
    h: number;
    isHovered: boolean;
  }> = [];
  private miniRogueUiElements: Phaser.GameObjects.GameObject[] = [];

  private memoryStatsFallback?: GameStats;

  constructor() {
    super('GameScene');
  }

  public loadStats(): GameStats {
    let stats: GameStats = this.memoryStatsFallback || {
      highScore: 0,
      highestWave: 1,
      highestCombo: 0,
      totalParries: 0,
      bossesDefeated: 0,
      plasmaFragments: TuningConfig.economy.welcomeFragments,
      unlockedBlades: ['standard'],
      selectedBlade: 'standard',
    };
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const raw = localStorage.getItem(TuningConfig.storage.key);
        if (raw) {
          const parsed = JSON.parse(raw);
          stats = {
            highScore: typeof parsed.highScore === 'number' ? parsed.highScore : 0,
            highestWave: typeof parsed.highestWave === 'number' ? parsed.highestWave : 1,
            highestCombo: typeof parsed.highestCombo === 'number' ? parsed.highestCombo : 0,
            totalParries: typeof parsed.totalParries === 'number' ? parsed.totalParries : 0,
            bossesDefeated: typeof parsed.bossesDefeated === 'number' ? parsed.bossesDefeated : 0,
            plasmaFragments: typeof parsed.plasmaFragments === 'number' ? parsed.plasmaFragments : TuningConfig.economy.welcomeFragments,
            unlockedBlades: Array.isArray(parsed.unlockedBlades) && parsed.unlockedBlades.length > 0 ? parsed.unlockedBlades : ['standard'],
            selectedBlade: typeof parsed.selectedBlade === 'string' ? parsed.selectedBlade : 'standard',
          };
        } else {
          this.saveStats(stats);
        }
      }
    } catch (e) {
      console.warn('[GameScene] localStorage read failed (private mode/sandboxed). Using volatile memory fallback.', e);
    }
    this.memoryStatsFallback = stats;
    return stats;
  }

  public saveStats(stats: GameStats): void {
    this.memoryStatsFallback = stats;
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(TuningConfig.storage.key, JSON.stringify(stats));
      }
    } catch (e) {
      console.warn('[GameScene] localStorage write failed (private mode/sandboxed). Progress kept in session memory.', e);
    }
  }

  public recordMetric(eventName: string, details?: Record<string, unknown>): void {
    if (typeof window !== 'undefined') {
      const win = window as unknown as { __GAME_METRICS__?: Array<Record<string, unknown>> };
      if (!win.__GAME_METRICS__) win.__GAME_METRICS__ = [];
      win.__GAME_METRICS__.push({ event: eventName, time: performance.now(), ...(details || {}) });
    }
  }

  public pauseGame(): void {
    if (this.isPaused || !this.isRoundActive || this.coreHealth <= 0) return;
    this.isPaused = true;
    this.pauseStartTimestamp = performance.now();
    PokiService.gameplayStop();
    this.audioManager.pauseAmbientHum();
    this.audioManager.pauseBgm();
    this.pauseOverlayText.setVisible(true);
    this.pauseSubText.setVisible(true);
    this.pauseBgmBtn.setVisible(true);
    this.pauseSfxBtn.setVisible(true);
    this.render();
    this.recordMetric('pause_blur');
  }

  public resumeGame(): void {
    if (!this.isPaused) return;
    const pauseDuration = performance.now() - this.pauseStartTimestamp;
    this.isPaused = false;
    PokiService.gameplayStart();
    this.pauseOverlayText.setVisible(false);
    this.pauseSubText.setVisible(false);
    this.pauseBgmBtn.setVisible(false);
    this.pauseSfxBtn.setVisible(false);
    this.audioManager.resumeAmbientHum();
    this.audioManager.resumeBgm();

    // Timers compensation: shifts forward all scheduled shot times by the exact pause duration
    for (const cannon of this.cannons) {
      cannon.nextFireTime += pauseDuration;
    }
    this.render();
    this.recordMetric('resume', { pauseDurationMs: pauseDuration });
  }

  public create(): void {
    this.audioManager = new AudioManager();
    this.audioManager.onBossMusicStart = () => {
      this.recordMetric('boss_music_started', { wave: this.currentWave });
    };
    this.audioManager.onBossMusicEnd = () => {
      this.recordMetric('boss_music_ended', { wave: this.currentWave });
    };

    ArenaRenderer.buildCitadelTexture(this);
    this.add.image(TuningConfig.arena.centerX, TuningConfig.arena.centerY, 'arena_citadel').setDepth(0);
    this.graphics = this.add.graphics().setDepth(1);
    // Dynamic stars loop removed: ArenaRenderer pre-bakes 180 stars + nebula into arena_citadel with 0ms runtime cost
    this.initAsteroids();

    const savedStats = this.loadStats();
    this.plasmaFragments = savedStats.plasmaFragments;
    this.unlockedBlades = savedStats.unlockedBlades;
    this.selectedBlade = savedStats.selectedBlade;

    PokiService.init().then(() => {
      PokiService.gameLoadingFinished();
    });

    // Inicialização do Pool Estático de 16 Fragmentos Bezier (RNF-01.3)
    this.flyingFragments = [];
    for (let i = 0; i < 16; i++) {
      this.flyingFragments.push({
        active: false,
        startX: 0,
        startY: 0,
        controlX: 0,
        controlY: 0,
        targetX: 35,
        targetY: 22,
        progress: 0,
        speed: 1.4,
        color: 0xffea00,
        value: 1,
      });
    }

    // Inicialização do Pool Estático de 10 Textos de FloatingScore (RNF-01.3 / Zero-GC)
    this.floatingScores = [];
    for (let i = 0; i < 10; i++) {
      const textObj = this.add.text(0, 0, '', {
        fontFamily: "'Orbitron', monospace",
        fontSize: '14px',
        fontStyle: 'bold',
        color: '#ffffff',
        stroke: '#060a14',
        strokeThickness: 3,
      }).setOrigin(0.5).setDepth(20).setVisible(false);
      this.floatingScores.push({
        textObj,
        life: 0,
        maxLife: 0.8,
        active: false,
      });
    }

    // Posição inicial da lâmina no trilho de defesa (visível desde o primeiro frame)
    this.bladeX = TuningConfig.arena.centerX + 125;
    this.bladeY = TuningConfig.arena.centerY;
    this.bladeAngle = Math.PI / 2;

    // Detecção inicial de dispositivo touch/mobile
    this.isTouchDevice =
      this.sys.game.device.input.touch ||
      (typeof window !== 'undefined' &&
        ('ontouchstart' in window || navigator.maxTouchPoints > 0));

    // Input handling: Dual-Thumb Arcade no Mobile + Mouse Polar 1:1 no Desktop
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      if (this.isShowingAd) return;

      if (p.wasTouch) {
        this.isTouchDevice = true;
        this.updateMobileControlsVisibility();
      }

      if (this.isMiniRogueOpen) {
        for (const card of this.miniRogueCards) {
          card.isHovered = (p.x >= card.x && p.x <= card.x + card.w &&
                            p.y >= card.y && p.y <= card.y + card.h);
        }
        return;
      }

      const cx = TuningConfig.arena.centerX;
      const cy = TuningConfig.arena.centerY;

      // FTUE Track: Detect first movement of blade
      if (!this.hasMovedBlade && this.isRoundActive) {
        this.hasMovedBlade = true;
        this.recordMetric('first_input', { x: p.x, y: p.y });
        if (this.ftueHintShown) {
          this.recordMetric('tutorial_hint_dismissed', { wave: this.currentWave });
        }
      }

      // 1. Mobile Dual-Thumb: Controle Direcional e Distância Orbital via Joystick Flutuante (Polegar Esquerdo)
      if (p.id === this.joystickPointerId) {
        this.joystickCurrentX = p.x;
        this.joystickCurrentY = p.y;
        const dx = p.x - this.joystickOriginX;
        const dy = p.y - this.joystickOriginY;
        const dist = Math.hypot(dx, dy);

        if (dist > 8) {
          const angle = Math.atan2(dy, dx);
          this.bladeAngle = angle + Math.PI / 2;

          // Mapeamento dinâmico de distância radial: aproximar e afastar a lâmina
          const minR = TuningConfig.blade.minOrbitRadius; // 65px
          const maxR = TuningConfig.blade.maxOrbitRadius; // 160px
          const normDist = Phaser.Math.Clamp((dist - 12) / 38, 0, 1);
          const orbitR = minR + normDist * (maxR - minR);

          this.bladeX = cx + Math.cos(angle) * orbitR;
          this.bladeY = cy + Math.sin(angle) * orbitR;
        }

        // Âncora flutuante segue suavemente o polegar se afastar muito (curso máximo 54px)
        if (dist > 54) {
          this.joystickOriginX = p.x - (dx / dist) * 54;
          this.joystickOriginY = p.y - (dy / dist) * 54;
        }
      } else if (!p.wasTouch && !this.isTouchDevice) {
        // 2. Desktop: Rastreamento Polar 1:1 rigoroso com Mouse
        const dx = p.x - cx;
        const dy = p.y - cy;
        const dist = Math.hypot(dx, dy);

        // Deadzone Polar no Núcleo
        if (dist < TuningConfig.blade.polarDeadzoneRadius) {
          return;
        }

        // Strict Defense Rail
        const clampedDist = Math.max(
          TuningConfig.blade.minOrbitRadius,
          Math.min(TuningConfig.blade.maxOrbitRadius, dist)
        );
        const normX = dx / dist;
        const normY = dy / dist;

        this.bladeX = cx + normX * clampedDist;
        this.bladeY = cy + normY * clampedDist;
        this.bladeAngle = Math.atan2(dy, dx) + Math.PI / 2;
      }
    });

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.isShowingAd) return;
      this.audioManager.init();

      if (pointer.wasTouch) {
        this.isTouchDevice = true;
        this.updateMobileControlsVisibility();
      }

      // Se clicou em botão de UI interativo (exceto o próprio botão de parry móvel), prioriza o botão
      const hits = this.input.hitTestPointer(pointer);
      const uiHits = hits ? hits.filter((h) => h !== this.parryBtnText) : [];
      if (uiHits.length > 0) {
        return;
      }

      if (this.isPatchNotesOpen) {
        if (this.time.now - this.patchNotesOpenedTime > 150) {
          this.togglePatchNotes(false);
        }
        return;
      }
      if (this.isHelpOpen) {
        if (this.time.now - this.helpOpenedTime > 150) {
          this.toggleHelp(false);
        }
        return;
      }
      if (this.isPaused) {
        return;
      }
      if (this.isMiniRogueOpen) {
        for (const card of this.miniRogueCards) {
          if (pointer.x >= card.x && pointer.x <= card.x + card.w &&
              pointer.y >= card.y && pointer.y <= card.y + card.h) {
            this.selectMiniRogueModifier(card.id);
            return;
          }
        }
        return;
      }
      if (!this.isRoundActive && this.restartAllowed) {
        this.triggerRestart('pointer');
        return;
      }

      const isTouch = pointer.wasTouch || this.isTouchDevice;
      if (isTouch && this.isRoundActive) {
        // Verificar se tocou na zona do botão de Parry no canto inferior direito
        const distToParry = Math.hypot(pointer.x - this.parryBtnX, pointer.y - this.parryBtnY);
        const isParryHit = (hits && hits.includes(this.parryBtnText)) || distToParry <= this.parryBtnRadius + 18 || (pointer.x >= 750 && pointer.y >= 320);
        if (isParryHit) {
          this.isParryBtnPressed = true;
          this.parryPointerId = pointer.id;
          this.updateMobileControlsVisibility();
          this.triggerParry();
          return;
        }

        // Caso contrário: ativa o Joystick Flutuante no polegar esquerdo / área de mira
        if (this.joystickPointerId === null) {
          this.joystickPointerId = pointer.id;
          this.joystickOriginX = pointer.x;
          this.joystickOriginY = pointer.y;
          this.joystickCurrentX = pointer.x;
          this.joystickCurrentY = pointer.y;
          this.isJoystickActive = true;
        }
      } else if (!isTouch) {
        // Desktop com Mouse: clique aciona Parry
        this.triggerParry();
      }
    });

    this.input.on('pointerup', (p: Phaser.Input.Pointer) => {
      if (p.id === this.joystickPointerId) {
        this.isJoystickActive = false;
        this.joystickPointerId = null;
      }
      if (p.id === this.parryPointerId) {
        this.isParryBtnPressed = false;
        this.parryPointerId = null;
        this.updateMobileControlsVisibility();
      }
    });

    this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE).on('down', () => {
      if (this.isShowingAd) return;
      this.audioManager.init();
      if (this.isPatchNotesOpen) {
        this.togglePatchNotes(false);
        return;
      }
      if (this.isHelpOpen) {
        this.toggleHelp(false);
        return;
      }
      if (this.isPaused) {
        this.resumeGame();
        return;
      }
      if (!this.isRoundActive) {
        if (this.restartAllowed) {
          this.triggerRestart('key_SPACE');
        }
        return;
      } else {
        this.triggerParry();
      }
    });

    this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.R).on('down', () => {
      if (this.isShowingAd) return;
      this.audioManager.init();
      if (!this.isRoundActive && this.restartAllowed) {
        this.triggerRestart('key_R');
      }
    });

    this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.H).on('down', () => {
      if (this.isShowingAd) return;
      this.toggleHelp(!this.isHelpOpen);
    });

    this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.M).on('down', () => {
      if (this.isShowingAd) return;
      this.toggleAudioMute();
    });

    this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.P).on('down', () => {
      if (this.isShowingAd) return;
      if (this.isPaused) {
        this.resumeGame();
      } else if (this.isRoundActive && this.coreHealth > 0) {
        this.pauseGame();
      }
    });

    this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.ESC).on('down', () => {
      if (this.isShowingAd) return;
      if (this.isPatchNotesOpen) {
        this.togglePatchNotes(false);
      } else if (this.isHelpOpen) {
        this.toggleHelp(false);
      } else if (this.isPaused) {
        this.resumeGame();
      } else if (this.isRoundActive && this.coreHealth > 0) {
        this.pauseGame();
      }
    });

    // Auto-Pause listeners
    if (typeof window !== 'undefined') {
      window.addEventListener('blur', () => {
        if (this.isRoundActive && !this.isPaused && this.coreHealth > 0) {
          this.pauseGame();
        }
      });
      document.addEventListener('visibilitychange', () => {
        if (document.hidden && this.isRoundActive && !this.isPaused && this.coreHealth > 0) {
          this.pauseGame();
        }
      });
    }

    // UI elements
    this.uiText = this.add.text(24, 18, '', {
      fontFamily: "'Orbitron', monospace",
      fontSize: '15px',
      color: '#00f3ff',
    }).setDepth(10).setVisible(false);

    this.coreHudText = this.add.text(TuningConfig.arena.width - 24, 18, '', {
      fontFamily: "'Orbitron', monospace",
      fontSize: '15px',
      fontStyle: 'bold',
      color: '#00f3ff',
      align: 'right',
    }).setOrigin(1, 0).setDepth(10).setVisible(false);

    this.statusText = this.add.text(24, 42, '', {
      fontFamily: "'Rajdhani', sans-serif",
      fontSize: '17px',
      fontStyle: 'bold',
      color: '#ffea00',
    }).setDepth(10);

    this.questHudText = this.add.text(24, 66, '', {
      fontFamily: "'Rajdhani', sans-serif",
      fontSize: '15px',
      fontStyle: 'bold',
      color: '#00ffcc',
    }).setDepth(10).setVisible(false);

    this.bannerText = this.add.text(TuningConfig.arena.centerX, 56, t('game_title'), {
      fontFamily: "'Orbitron', monospace",
      fontSize: '34px',
      fontStyle: 'bold',
      align: 'center',
      color: '#00f3ff',
    }).setOrigin(0.5).setVisible(true).setDepth(10);

    this.subText = this.add.text(TuningConfig.arena.centerX, 90, t('game_subtitle'), {
      fontFamily: "'Rajdhani', sans-serif",
      fontSize: '16px',
      fontStyle: 'bold',
      color: '#ffea00',
    }).setOrigin(0.5).setVisible(true).setDepth(10);

    // Badge Diegético de Versão e Acesso aos Patch Notes
    this.versionBadgeText = this.add.text(
      TuningConfig.arena.centerX,
      118,
      t('btn_patch_notes', { version: GAME_VERSION }),
      {
        fontFamily: "'Orbitron', monospace",
        fontSize: '11px',
        fontStyle: 'bold',
        color: '#00f3ff',
        backgroundColor: '#0c253d',
        padding: { x: 14, y: 4 },
      }
    ).setOrigin(0.5).setVisible(true).setInteractive({ useHandCursor: true }).setDepth(10);

    this.versionBadgeText.on('pointerover', () => {
      this.versionBadgeText.setColor('#ffea00').setBackgroundColor('#1c385c');
    });
    this.versionBadgeText.on('pointerout', () => {
      this.versionBadgeText.setColor('#00f3ff').setBackgroundColor('#0c253d');
    });
    this.versionBadgeText.on('pointerdown', () => {
      if (!this.isRoundActive && !this.isShowingAd) {
        this.audioManager.init();
        this.togglePatchNotes(!this.isPatchNotesOpen);
      }
    });

    // Hangar de Lâminas / Micro-Economia
    this.fragmentsTitleText = this.add.text(
      TuningConfig.arena.centerX,
      146,
      t('wallet_fragments', { count: this.plasmaFragments }),
      {
        fontFamily: "'Orbitron', monospace",
        fontSize: '14px',
        fontStyle: 'bold',
        color: '#00f3ff',
      }
    ).setOrigin(0.5).setVisible(true).setDepth(10);

    this.buildHangarButtons();

    this.bladeDescText = this.add.text(
      TuningConfig.arena.centerX,
      332,
      '',
      {
        fontFamily: "'Rajdhani', sans-serif",
        fontSize: '15px',
        fontStyle: '600',
        color: '#a0d8ef',
        align: 'center',
      }
    ).setOrigin(0.5).setVisible(true).setDepth(10);
    this.updateHangarUI();

    this.instructionText = this.add.text(TuningConfig.arena.centerX, 395, [
      t('instructions_1'),
      t('instructions_2'),
      t('instructions_3')
    ], {
      fontFamily: "'Rajdhani', sans-serif",
      fontSize: '14px',
      fontStyle: '600',
      color: '#90d4f7',
      align: 'center',
      lineSpacing: 4
    }).setOrigin(0.5).setVisible(true).setDepth(10);

    // Botão Arcade de Iniciar Jogo (Start Game) na tela de título
    this.startButton = this.add.text(TuningConfig.arena.centerX, 461, t('btn_start_game'), {
      fontFamily: "'Orbitron', monospace",
      fontSize: '18px',
      fontStyle: 'bold',
      align: 'center',
      color: '#00f3ff',
      backgroundColor: '#0c253d',
      padding: { x: 30, y: 10 },
    }).setOrigin(0.5).setVisible(true).setInteractive({ useHandCursor: true }).setDepth(10);

    this.startButton.on('pointerover', () => {
      this.startButton.setColor('#ffea00').setBackgroundColor('#1c385c');
    });
    this.startButton.on('pointerout', () => {
      this.startButton.setColor('#00f3ff').setBackgroundColor('#0c253d');
    });
    this.startButton.on('pointerdown', () => {
      if (!this.isRoundActive) {
        this.startNewGame();
      }
    });

    this.popupText = this.add.text(TuningConfig.arena.centerX, 90, '', {
      fontFamily: "'Orbitron', monospace",
      fontSize: '18px',
      fontStyle: 'bold',
      align: 'center',
    }).setOrigin(0.5).setAlpha(0).setDepth(10);

    this.powerupLabel = this.add.text(0, 0, '', {
      fontFamily: "'Orbitron', monospace",
      fontSize: '13px',
      fontStyle: 'bold',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5).setVisible(false).setDepth(10);

    // Game Over UI Elements
    this.gameOverTitle = this.add.text(TuningConfig.arena.centerX, 89, t('game_over_title'), {
      fontFamily: "'Orbitron', monospace",
      fontSize: '26px',
      fontStyle: '900',
      align: 'center',
      color: '#ff1744',
    }).setOrigin(0.5).setVisible(false).setDepth(10);

    this.gameOverRecordBanner = this.add.text(TuningConfig.arena.centerX, 121, t('game_over_new_record'), {
      fontFamily: "'Orbitron', monospace",
      fontSize: '15px',
      fontStyle: 'bold',
      align: 'center',
      color: '#ffea00',
    }).setOrigin(0.5).setVisible(false).setDepth(10);

    this.gameOverStatsText = this.add.text(TuningConfig.arena.centerX, 150, '', {
      fontFamily: "'Rajdhani', sans-serif",
      fontSize: '15px',
      fontStyle: '600',
      align: 'center',
      color: '#8ce8ff',
      lineSpacing: 4,
    }).setOrigin(0.5, 0).setVisible(false).setDepth(10);

    // Rewarded Video Revive Button (Poki Compliance: neutral cyan styling, not green, balanced hierarchy)
    this.reviveButton = this.add.text(TuningConfig.arena.centerX, 301, t('btn_revive'), {
      fontFamily: "'Orbitron', monospace",
      fontSize: '15px',
      fontStyle: 'bold',
      align: 'center',
      color: '#00f3ff',
      padding: { x: 30, y: 8 },
    }).setOrigin(0.5).setVisible(false).setInteractive({ useHandCursor: true }).setDepth(10);

    this.reviveButton.on('pointerover', () => {
      this.reviveButton.setColor('#ffffff');
    });
    this.reviveButton.on('pointerout', () => {
      this.reviveButton.setColor('#00f3ff');
    });
    this.reviveButton.on('pointerdown', () => {
      if (!this.isRoundActive && this.canReviveThisSession && !this.isShowingAd) {
        this.requestReviveWithAd();
      }
    });

    this.restartButton = this.add.text(TuningConfig.arena.centerX, 349, t('btn_restart'), {
      fontFamily: "'Orbitron', monospace",
      fontSize: '15px',
      fontStyle: 'bold',
      align: 'center',
      color: '#ffea00',
      padding: { x: 30, y: 8 },
    }).setOrigin(0.5).setVisible(false).setInteractive({ useHandCursor: true }).setDepth(10);

    this.restartButton.on('pointerover', () => {
      this.restartButton.setColor('#ffffff');
    });
    this.restartButton.on('pointerout', () => {
      this.restartButton.setColor('#ffea00');
    });
    this.restartButton.on('pointerdown', () => {
      this.triggerRestart('button');
    });

    this.restartHintText = this.add.text(TuningConfig.arena.centerX, 395, t('restart_hint'), {
      fontFamily: "'Rajdhani', sans-serif",
      fontSize: '13px',
      align: 'center',
      color: '#8094ae',
    }).setOrigin(0.5).setVisible(false).setDepth(10);

    // Pause UI Elements
    this.pauseOverlayText = this.add.text(TuningConfig.arena.centerX, 230, t('pause_title'), {
      fontFamily: "'Orbitron', monospace",
      fontSize: '44px',
      fontStyle: '900',
      align: 'center',
      color: '#00f3ff',
    }).setOrigin(0.5).setVisible(false).setDepth(10);

    this.pauseSubText = this.add.text(TuningConfig.arena.centerX, 285, t('pause_subtitle'), {
      fontFamily: "'Rajdhani', sans-serif",
      fontSize: '20px',
      fontStyle: '600',
      align: 'center',
      color: '#ffea00',
    }).setOrigin(0.5).setVisible(false).setInteractive({ useHandCursor: true }).setDepth(10);

    this.pauseSubText.on('pointerdown', () => {
      this.resumeGame();
    });

    const initialBgmVol = this.audioManager.getBgmVolume();
    const initialBgmLabel = initialBgmVol === 0 ? 'OFF' : `${Math.round(initialBgmVol * 100)}%`;
    this.pauseBgmBtn = this.add.text(TuningConfig.arena.centerX - 110, 335, t('pause_music_btn', { val: initialBgmLabel }), {
      fontFamily: "'Orbitron', monospace",
      fontSize: '13px',
      fontStyle: 'bold',
      color: '#00f3ff',
      backgroundColor: '#0c1626',
      padding: { x: 12, y: 7 },
    }).setOrigin(0.5).setVisible(false).setInteractive({ useHandCursor: true }).setDepth(15);

    this.pauseBgmBtn.on('pointerdown', () => {
      const cur = this.audioManager.getBgmVolume();
      const next = cur >= 0.9 ? 0.5 : cur >= 0.4 ? 0 : 1.0;
      this.audioManager.setBgmVolume(next);
      const label = next === 0 ? 'OFF' : `${Math.round(next * 100)}%`;
      this.pauseBgmBtn.setText(t('pause_music_btn', { val: label }));
      this.pauseBgmBtn.setColor(next === 0 ? '#8094ae' : '#00f3ff');
      this.recordMetric('bgm_volume_changed', { volume: next });
    });

    const initialSfxVol = this.audioManager.getSfxVolume();
    const initialSfxLabel = initialSfxVol === 0 ? 'OFF' : `${Math.round((initialSfxVol / 0.85) * 100)}%`;
    this.pauseSfxBtn = this.add.text(TuningConfig.arena.centerX + 110, 335, t('pause_sfx_btn', { val: initialSfxLabel }), {
      fontFamily: "'Orbitron', monospace",
      fontSize: '13px',
      fontStyle: 'bold',
      color: '#00f3ff',
      backgroundColor: '#0c1626',
      padding: { x: 12, y: 7 },
    }).setOrigin(0.5).setVisible(false).setInteractive({ useHandCursor: true }).setDepth(15);

    this.pauseSfxBtn.on('pointerdown', () => {
      const cur = this.audioManager.getSfxVolume();
      const next = cur >= 0.8 ? 0.4 : cur >= 0.3 ? 0 : 0.85;
      this.audioManager.setSfxVolume(next);
      const label = next === 0 ? 'OFF' : `${Math.round((next / 0.85) * 100)}%`;
      this.pauseSfxBtn.setText(t('pause_sfx_btn', { val: label }));
      this.pauseSfxBtn.setColor(next === 0 ? '#8094ae' : '#00f3ff');
      this.recordMetric('sfx_volume_changed', { volume: next });
    });

    // Mute, CRT Scanlines & Help Interactive Buttons
    this.muteBtn = this.add.text(TuningConfig.arena.width - 24, TuningConfig.arena.height - 24, t('btn_sound_on'), {
      fontFamily: "'Orbitron', monospace",
      fontSize: '12px',
      fontStyle: 'bold',
      color: '#00f3ff',
      backgroundColor: '#0c1626',
      padding: { x: 10, y: 6 },
    }).setOrigin(1, 1).setDepth(15).setInteractive({ useHandCursor: true });

    this.muteBtn.on('pointerdown', () => {
      this.toggleAudioMute();
    });

    this.crtBtn = this.add.text(TuningConfig.arena.width - 150, TuningConfig.arena.height - 24, t('btn_crt_on'), {
      fontFamily: "'Orbitron', monospace",
      fontSize: '12px',
      fontStyle: 'bold',
      color: '#ffea00',
      backgroundColor: '#0c1626',
      padding: { x: 10, y: 6 },
    }).setOrigin(1, 1).setDepth(15).setInteractive({ useHandCursor: true });

    this.crtBtn.on('pointerdown', () => {
      const crtEl = document.getElementById('crt-screen');
      if (crtEl) {
        const isHidden = crtEl.style.display === 'none';
        crtEl.style.display = isHidden ? 'block' : 'none';
        this.crtBtn.setText(t(isHidden ? 'btn_crt_on' : 'btn_crt_off'));
        this.crtBtn.setColor(isHidden ? '#ffea00' : '#8094ae');
      }
    });

    this.helpBtn = this.add.text(24, TuningConfig.arena.height - 24, getLang() === 'en' ? '? GUIDE [H]' : '? GUIA [H]', {
      fontFamily: "'Orbitron', monospace",
      fontSize: '12px',
      fontStyle: 'bold',
      color: '#00f3ff',
      backgroundColor: '#0c1626',
      padding: { x: 10, y: 6 },
    }).setOrigin(0, 1).setDepth(15).setInteractive({ useHandCursor: true });

    this.helpBtn.on('pointerdown', () => {
      this.toggleHelp(!this.isHelpOpen);
    });

    this.langBtn = this.add.text(145, TuningConfig.arena.height - 24, t('lang_toggle'), {
      fontFamily: "'Orbitron', monospace",
      fontSize: '12px',
      fontStyle: 'bold',
      color: '#00f3ff',
      backgroundColor: '#0c1626',
      padding: { x: 10, y: 6 },
    }).setOrigin(0, 1).setDepth(15).setInteractive({ useHandCursor: true });

    this.langBtn.on('pointerdown', () => {
      toggleLang();
      this.applyLanguageChange();
    });

    // Botão de Tela Cheia (Fullscreen) para Staging / GitHub Pages / Vercel (oculto no portal do Poki)
    this.fullscreenBtn = this.add.text(250, TuningConfig.arena.height - 24, t('btn_fullscreen'), {
      fontFamily: "'Orbitron', monospace",
      fontSize: '12px',
      fontStyle: 'bold',
      color: '#00f3ff',
      backgroundColor: '#0c1626',
      padding: { x: 10, y: 6 },
    }).setOrigin(0, 1).setDepth(15).setInteractive({ useHandCursor: true });

    if (PokiService.isPokiEnvironment()) {
      this.fullscreenBtn.setVisible(false);
    }

    this.fullscreenBtn.on('pointerdown', async () => {
      try {
        const doc = document as any;
        const docEl = document.documentElement as any;
        const isFs = !!(
          doc.fullscreenElement ||
          doc.webkitFullscreenElement ||
          doc.mozFullScreenElement ||
          doc.msFullscreenElement ||
          this.scale.isFullscreen
        );

        if (isFs) {
          if (doc.exitFullscreen) {
            await doc.exitFullscreen().catch(() => {});
          } else if (doc.webkitExitFullscreen) {
            doc.webkitExitFullscreen();
          } else if (doc.mozCancelFullScreen) {
            doc.mozCancelFullScreen();
          } else if (doc.msExitFullscreen) {
            doc.msExitFullscreen();
          }
          try { this.scale.stopFullscreen(); } catch (_) {}
        } else {
          const req =
            docEl.requestFullscreen ||
            docEl.webkitRequestFullscreen ||
            docEl.webkitRequestFullScreen ||
            docEl.mozRequestFullScreen ||
            docEl.msRequestFullscreen;

          if (req) {
            await req.call(docEl).catch((err: any) => {
              console.warn('[GameScene] document requestFullscreen failed, trying canvas scale:', err);
              try { this.scale.startFullscreen(); } catch (_) {}
            });
          } else {
            // iOS Safari (iPhone) não expõe API Fullscreen para DOM/canvas
            window.scrollTo(0, 1);
            this.showPopup(t('ios_fullscreen_hint'), '#00f3ff');
          }
        }
      } catch (e) {
        console.warn('[GameScene] Fullscreen toggle error:', e);
      }
      setTimeout(() => this.updateFullscreenBtnText(), 200);
    });

    ['fullscreenchange', 'webkitfullscreenchange', 'mozfullscreenchange', 'MSFullscreenChange'].forEach(evt => {
      document.addEventListener(evt, () => this.updateFullscreenBtnText());
    });

    // Botão Tátil Arcade de Parry no Mobile (Polegar Direito)
    this.parryBtnText = this.add.text(this.parryBtnX, this.parryBtnY, t('btn_parry_mobile'), {
      fontFamily: "'Orbitron', monospace",
      fontSize: '15px',
      fontStyle: 'bold',
      color: '#00f3ff',
      align: 'center',
    }).setOrigin(0.5).setDepth(16).setVisible(false).setInteractive({ useHandCursor: true });

    this.parryBtnText.on('pointerdown', (p: Phaser.Input.Pointer) => {
      if (this.isShowingAd) return;
      this.audioManager.init();
      this.isParryBtnPressed = true;
      this.parryPointerId = p.id;
      this.updateMobileControlsVisibility();
      this.triggerParry();
    });

    this.parryBtnText.on('pointerup', () => {
      this.isParryBtnPressed = false;
      this.parryPointerId = null;
      this.updateMobileControlsVisibility();
    });

    // Help Modal Overlay Text Elements
    this.helpTitleText = this.add.text(TuningConfig.arena.centerX, TuningConfig.arena.centerY - 145, t('help_title'), {
      fontFamily: "'Orbitron', monospace",
      fontSize: '22px',
      fontStyle: 'bold',
      color: '#00f3ff',
      align: 'center',
    }).setOrigin(0.5).setDepth(25).setVisible(false);

    this.helpBodyText = this.add.text(TuningConfig.arena.centerX, TuningConfig.arena.centerY - 20, [
      t('help_line1'),
      t('help_line2'),
      t('help_line3'),
      t('help_line4'),
      t('help_line5'),
      t('help_line6'),
    ], {
      fontFamily: "'Rajdhani', sans-serif",
      fontSize: '15px',
      fontStyle: '600',
      color: '#b0e0ff',
      align: 'left',
      lineSpacing: 8,
    }).setOrigin(0.5).setDepth(25).setVisible(false);

    this.helpCloseBtn = this.add.text(TuningConfig.arena.centerX, TuningConfig.arena.centerY + 145, t('help_close_hint'), {
      fontFamily: "'Orbitron', monospace",
      fontSize: '15px',
      fontStyle: 'bold',
      color: '#ffea00',
      backgroundColor: '#0d1829',
      padding: { x: 18, y: 8 },
    }).setOrigin(0.5).setDepth(25).setVisible(false).setInteractive({ useHandCursor: true });

    this.helpCloseBtn.on('pointerdown', () => {
      this.toggleHelp(false);
    });

    // Patch Notes Modal Overlay Elements
    this.patchNotesTitleText = this.add.text(TuningConfig.arena.centerX, TuningConfig.arena.centerY - 150, t('patch_notes_title'), {
      fontFamily: "'Orbitron', monospace",
      fontSize: '22px',
      fontStyle: 'bold',
      color: '#00f3ff',
      align: 'center',
    }).setOrigin(0.5).setDepth(25).setVisible(false);

    this.patchNotesSubtitleText = this.add.text(TuningConfig.arena.centerX, TuningConfig.arena.centerY - 120, `${GAME_VERSION} • BUILD ${GAME_BUILD_DATE} • LASER RICOCHET`, {
      fontFamily: "'Rajdhani', sans-serif",
      fontSize: '15px',
      fontStyle: '600',
      color: '#ffea00',
      align: 'center',
    }).setOrigin(0.5).setDepth(25).setVisible(false);

    this.patchNotesBodyText = this.add.text(TuningConfig.arena.centerX, TuningConfig.arena.centerY - 98, '', {
      fontFamily: "'Rajdhani', sans-serif",
      fontSize: '13px',
      fontStyle: '600',
      color: '#b0e0ff',
      align: 'left',
      lineSpacing: 2,
    }).setOrigin(0.5, 0).setDepth(25).setVisible(false);

    this.patchNotesCloseBtn = this.add.text(TuningConfig.arena.centerX, TuningConfig.arena.centerY + 168, t('btn_close_patch_notes'), {
      fontFamily: "'Orbitron', monospace",
      fontSize: '13px',
      fontStyle: 'bold',
      color: '#00f3ff',
      backgroundColor: '#0c253d',
      padding: { x: 22, y: 7 },
    }).setOrigin(0.5).setDepth(25).setVisible(false).setInteractive({ useHandCursor: true });

    this.patchNotesCloseBtn.on('pointerover', () => {
      this.patchNotesCloseBtn.setColor('#ffea00').setBackgroundColor('#1c385c');
    });
    this.patchNotesCloseBtn.on('pointerout', () => {
      this.patchNotesCloseBtn.setColor('#00f3ff').setBackgroundColor('#0c253d');
    });
    this.patchNotesCloseBtn.on('pointerdown', () => {
      this.togglePatchNotes(false);
    });

    this.isRoundActive = false;
    this.restartAllowed = true;
    this.updateUI();
  }

  public toggleAudioMute(): void {
    this.audioManager.init();
    const muted = this.audioManager.toggleMute();
    this.muteBtn.setText(t(muted ? 'btn_sound_muted' : 'btn_sound_on'));
    this.muteBtn.setColor(muted ? '#ff1744' : '#00f3ff');
    this.recordMetric('audio_muted_toggled', { isMuted: muted });
  }

  public toggleHelp(open: boolean): void {
    this.isHelpOpen = open;
    this.helpTitleText.setVisible(open);
    this.helpBodyText.setVisible(open);
    this.helpCloseBtn.setVisible(open);

    if (open) {
      this.helpOpenedTime = this.time.now;
      if (this.isPatchNotesOpen) {
        this.togglePatchNotes(false);
      }
    }

    // If game has not started, hide title screen text underneath modal to avoid overlap
    if (!this.isRoundActive && this.coreHealth > 0) {
      this.bannerText.setVisible(!open);
      this.subText.setVisible(!open);
      if (this.versionBadgeText) this.versionBadgeText.setVisible(!open);
      this.instructionText.setVisible(!open);
      if (this.startButton) this.startButton.setVisible(!open);
      if (this.fragmentsTitleText) this.fragmentsTitleText.setVisible(!open);
      this.bladeButtons.forEach(b => b.setVisible(!open));
      if (this.bladeDescText) this.bladeDescText.setVisible(!open);
    }

    this.recordMetric(open ? 'help_opened' : 'help_closed');
    this.render();
  }

  public togglePatchNotes(open: boolean): void {
    this.isPatchNotesOpen = open;
    this.patchNotesTitleText.setVisible(open);
    this.patchNotesSubtitleText.setVisible(open);
    this.patchNotesBodyText.setVisible(open);
    this.patchNotesCloseBtn.setVisible(open);

    if (open) {
      this.patchNotesOpenedTime = this.time.now;
      if (this.isHelpOpen) {
        this.toggleHelp(false);
      }
      const curLang = getLang();
      const lines: string[] = [];
      PATCH_NOTES.slice(0, 3).forEach((entry, idx) => {
        lines.push(`【 ${entry.version} — ${entry.codename} (${entry.date}) 】`);
        const hl = entry.highlights[curLang] || entry.highlights.en;
        const maxBullets = idx === 0 ? 4 : 2;
        hl.slice(0, maxBullets).forEach((item) => {
          lines.push(`  ▶ ${item}`);
        });
        if (idx < 2) lines.push('');
      });
      this.patchNotesBodyText.setText(lines);
    }

    if (!this.isRoundActive && this.coreHealth > 0) {
      this.bannerText.setVisible(!open);
      this.subText.setVisible(!open);
      if (this.versionBadgeText) this.versionBadgeText.setVisible(!open);
      this.instructionText.setVisible(!open);
      if (this.startButton) this.startButton.setVisible(!open);
      if (this.fragmentsTitleText) this.fragmentsTitleText.setVisible(!open);
      this.bladeButtons.forEach(b => b.setVisible(!open));
      if (this.bladeDescText) this.bladeDescText.setVisible(!open);
    }

    this.recordMetric(open ? 'patch_notes_opened' : 'patch_notes_closed');
    this.render();
  }

  public applyLanguageChange(): void {
    if (this.langBtn) this.langBtn.setText(t('lang_toggle'));
    if (this.bannerText) this.bannerText.setText(t('game_title'));
    if (this.subText) this.subText.setText(t('game_subtitle'));
    if (this.startButton) this.startButton.setText(t('btn_start_game'));
    if (this.instructionText) {
      this.instructionText.setText([
        t('instructions_1'),
        t('instructions_2'),
        t('instructions_3'),
      ]);
    }
    if (this.gameOverTitle) this.gameOverTitle.setText(t('game_over_title'));
    if (this.gameOverRecordBanner) this.gameOverRecordBanner.setText(t('game_over_new_record'));
    if (this.reviveButton) this.reviveButton.setText(t('btn_revive'));
    if (this.restartButton) this.restartButton.setText(t('btn_restart'));
    if (this.restartHintText) this.restartHintText.setText(t('restart_hint'));
    if (this.pauseOverlayText) this.pauseOverlayText.setText(t('pause_title'));
    if (this.pauseSubText) this.pauseSubText.setText(t('pause_subtitle'));
    if (this.helpTitleText) this.helpTitleText.setText(t('help_title'));
    if (this.helpBodyText) {
      this.helpBodyText.setText([
        t('help_line1'),
        t('help_line2'),
        t('help_line3'),
        t('help_line4'),
        t('help_line5'),
        t('help_line6'),
      ]);
    }
    if (this.helpBtn) this.helpBtn.setText(getLang() === 'en' ? '? GUIDE [H]' : '? GUIA [H]');
    if (this.helpCloseBtn) this.helpCloseBtn.setText(t('help_close_hint'));

    const bgmVol = this.audioManager ? this.audioManager.getBgmVolume() : 1.0;
    const bgmLabel = bgmVol === 0 ? 'OFF' : `${Math.round(bgmVol * 100)}%`;
    if (this.pauseBgmBtn) this.pauseBgmBtn.setText(t('pause_music_btn', { val: bgmLabel }));

    const sfxVol = this.audioManager ? this.audioManager.getSfxVolume() : 0.85;
    const sfxLabel = sfxVol === 0 ? 'OFF' : `${Math.round((sfxVol / 0.85) * 100)}%`;
    if (this.pauseSfxBtn) this.pauseSfxBtn.setText(t('pause_sfx_btn', { val: sfxLabel }));

    const isMuted = this.audioManager ? this.audioManager.getIsMuted() : false;
    if (this.muteBtn) this.muteBtn.setText(t(isMuted ? 'btn_sound_muted' : 'btn_sound_on'));

    const crtEl = document.getElementById('crt-screen');
    const isCrtOn = crtEl ? crtEl.style.display !== 'none' : true;
    if (this.crtBtn) this.crtBtn.setText(t(isCrtOn ? 'btn_crt_on' : 'btn_crt_off'));

    this.updateFullscreenBtnText();
    if (this.parryBtnText) this.parryBtnText.setText(t('btn_parry_mobile'));

    if (this.versionBadgeText) {
      this.versionBadgeText.setText(t('btn_patch_notes', { version: GAME_VERSION }));
    }
    if (this.patchNotesTitleText) {
      this.patchNotesTitleText.setText(t('patch_notes_title'));
    }
    if (this.patchNotesCloseBtn) {
      this.patchNotesCloseBtn.setText(t('btn_close_patch_notes'));
    }
    if (this.isPatchNotesOpen) {
      this.togglePatchNotes(true);
    }

    this.updateHangarUI();
    this.updateUI();
    this.updateQuestUI();
    this.updateMobileControlsVisibility();
    this.render();
  }

  public updateFullscreenBtnText(): void {
    if (this.fullscreenBtn) {
      if (PokiService.isPokiEnvironment()) {
        this.fullscreenBtn.setVisible(false);
        return;
      }
      const doc = document as any;
      const isFs = !!(
        doc.fullscreenElement ||
        doc.webkitFullscreenElement ||
        doc.mozFullScreenElement ||
        doc.msFullscreenElement ||
        this.scale.isFullscreen
      );
      this.fullscreenBtn.setText(t(isFs ? 'btn_fullscreen_exit' : 'btn_fullscreen'));
    }
  }

  public updateMobileControlsVisibility(): void {
    if (this.parryBtnText) {
      const show = this.isTouchDevice && this.isRoundActive && !this.isPaused && !this.isHelpOpen && !this.isMiniRogueOpen;
      this.parryBtnText.setVisible(show);
      this.parryBtnText.setColor(this.isParryBtnPressed ? '#ffea00' : '#00f3ff');
    }
  }

  private showPopup(msg: string, color = '#ffea00'): void {
    if (this.popupTween) {
      this.popupTween.stop();
    }
    this.popupText.setText(msg).setColor(color).setAlpha(1).setScale(1.1);
    this.popupTween = this.tweens.add({
      targets: this.popupText,
      scale: 1.0,
      alpha: 0,
      duration: 2000,
      ease: 'Power2',
    });
  }

  private initAsteroids(): void {
    this.asteroids = [];
    const cfg = TuningConfig.asteroids;
    for (let i = 0; i < cfg.count; i++) {
      const orbitAngle = (i / cfg.count) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
      const orbitRadius = cfg.minOrbitRadius + Math.random() * (cfg.maxOrbitRadius - cfg.minOrbitRadius);
      const orbitSpeed =
        (cfg.minOrbitSpeed + Math.random() * (cfg.maxOrbitSpeed - cfg.minOrbitSpeed)) *
        (i % 2 === 0 ? 1 : -1);
      const radius = cfg.minSize + Math.random() * (cfg.maxSize - cfg.minSize);
      const numVerts = 6 + Math.floor(Math.random() * 3);
      const vertices: AsteroidVertex[] = [];
      for (let v = 0; v < numVerts; v++) {
        const a = (v / numVerts) * Math.PI * 2;
        const r = radius * (0.75 + Math.random() * 0.5);
        vertices.push({ x: Math.cos(a) * r, y: Math.sin(a) * r });
      }
      this.asteroids.push({
        orbitRadius,
        orbitAngle,
        orbitSpeed,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.35,
        radius,
        vertices,
        midSplit: Math.floor(numVerts / 2),
        darkColor: 0x090e1c,
        lightColor: 0x162438,
        rimColor: 0x3d7099,
      });
    }
  }



  private spawnFloatingScore(x: number, y: number, text: string, color = '#00ffcc'): void {
    let slot = this.floatingScores.find(fs => !fs.active);
    if (!slot) {
      let minLife = Infinity;
      for (const fs of this.floatingScores) {
        if (fs.life < minLife) {
          minLife = fs.life;
          slot = fs;
        }
      }
    }
    if (slot) {
      slot.active = true;
      slot.life = 0.8;
      slot.maxLife = 0.8;
      slot.textObj.setText(text);
      slot.textObj.setColor(color);
      slot.textObj.setPosition(x, y);
      slot.textObj.setAlpha(1);
      slot.textObj.setVisible(true);
    }
  }

  private triggerParry(): void {
    this.audioManager.init();
    if (this.parryActiveTimerMs <= 0 && this.isRoundActive && !this.waveTransitioning) {
      this.parryActiveTimerMs = TuningConfig.blade.parryWindowMs;
      this.cameras.main.shake(60, 0.005);
    }
  }

  public startNewGame(): void {
    this.audioManager.init();
    this.audioManager.startAmbientHum();
    this.audioManager.setBgmMode('regular');
    this.coreHealth = TuningConfig.arena.coreMaxHealth;
    this.currentWave = 1;
    if (typeof window !== 'undefined' && window.location && window.location.search) {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const waveParam = urlParams.get('wave');
        if (waveParam) {
          const parsed = parseInt(waveParam, 10);
          if (!isNaN(parsed) && parsed > 0) {
            this.currentWave = parsed;
          }
        }
      } catch (e) {
        // Fallback silently if query parsing fails
      }
    }
    this.score = 0;
    this.comboCount = 0;
    this.isOverloaded = false;
    this.activePowerup = null;
    this.powerupTimerMs = 0;
    this.hasCoreShield = false;
    this.powerups = [];
    this.sparks = [];
    this.deflectVectors = [];
    this.bladeTrail = [];
    this.debris = [];
    this.shockwaves = [];
    this.powerupLabel.setVisible(false);
    this.waveTransitioning = false;
    this.restartAllowed = false;
    this.duelBannerTimerMs = 0;
    this.isPaused = false;
    this.nemesis = GameScene.blankNemesis();
    this.bestRallyRun = 0;

    // Reset FTUE & Boss Tracking
    this.hasMovedBlade = false;
    this.ftueIdleTimerMs = 0;
    this.ftueHintShown = false;
    this.ftueFirstRicochetDone = false;
    this.ftueFirstParryDone = false;
    this.ftueFirstAggressiveDone = false;
    this.parryCueTimerMs = 0;
    this.lastBossPattern = '';
    this.bossWarningTimerMs = 0;

    // Reset Session Stats
    this.perfectParriesCount = 0;
    this.bossesDefeatedCount = 0;
    this.maxComboSession = 0;
    this.isNewHighScore = false;
    this.coreDamageFlashTimerMs = 0;
    this.canReviveThisSession = true;

    // Hide Start, Hangar & Game Over UI Elements
    this.bannerText.setVisible(false);
    this.subText.setVisible(false);
    if (this.versionBadgeText) this.versionBadgeText.setVisible(false);
    if (this.isPatchNotesOpen) this.togglePatchNotes(false);
    if (this.startButton) this.startButton.setVisible(false);
    this.instructionText.setVisible(false);
    this.hideHangarUI();

    this.gameOverTitle.setVisible(false);
    this.gameOverRecordBanner.setVisible(false);
    this.gameOverStatsText.setVisible(false);
    this.restartButton.setVisible(false);
    this.restartHintText.setVisible(false);
    this.reviveButton.setVisible(false);

    this.pauseOverlayText.setVisible(false);
    this.pauseSubText.setVisible(false);
    this.pauseBgmBtn.setVisible(false);
    this.pauseSfxBtn.setVisible(false);

    // Reset Floating Scores static pool
    for (const fs of this.floatingScores) {
      fs.active = false;
      fs.textObj.setVisible(false);
    }

    // Reset Mini-Rogue Modifiers & Quest
    this.activeModifiers = [];
    this.isMiniRogueOpen = false;
    this.clearMiniRogueDom();

    const qList = TuningConfig.microQuests;
    const pickedQ = qList[Math.floor(Math.random() * qList.length)];
    this.activeQuest = {
      id: pickedQ.id,
      title: t(`quest_${pickedQ.id}_title`) || pickedQ.title,
      description: t(`quest_${pickedQ.id}_desc`) || pickedQ.description,
      type: pickedQ.type,
      target: pickedQ.target,
      current: 0,
      rewardFragments: pickedQ.rewardFragments,
      isCompleted: false,
    };
    this.updateQuestUI();

    this.uiText.setVisible(true);
    this.coreHudText.setVisible(true);

    this.recordMetric('game_started');
    PokiService.gameplayStart();
    this.setupWave(this.currentWave);
  }

  private setupWave(waveNumber: number): void {
    this.isRoundActive = true;
    this.lasers = [];
    this.cannons = [];
    this.powerups = [];
    this.sparks = [];
    this.deflectVectors = [];
    this.hitstopTimerMs = 0;
    this.parryActiveTimerMs = 0;
    this.duelBannerTimerMs = 0;

    const cx = TuningConfig.arena.centerX;
    const cy = TuningConfig.arena.centerY;
    const dist = TuningConfig.cannons.distanceFromCenter;

    interface ArchetypeDef {
      type: CannonType;
      hp: number;
      color: number;
      radius: number;
      bossPhase?: 'barrage' | 'vulnerable';
      bossPhaseTimerMs?: number;
      shieldHp?: number;
      maxShieldHp?: number;
    }

    const archetypeList: ArchetypeDef[] = [];
    let baseOrbit = 0;

    if (waveNumber === 1) {
      // Wave 1 Onboarding: Exatamente 1 Standard Cannon, calmo e previsível
      this.recordMetric('wave_1_started');
      baseOrbit = 0;
      archetypeList.push({
        type: 'standard',
        hp: 1,
        color: TuningConfig.cannons.colorStandard,
        radius: TuningConfig.cannons.radius
      });
    } else if (waveNumber === 2) {
      // Wave 2: 4 Standard in orbit
      baseOrbit = TuningConfig.waves.orbitSpeedBase;
      for (let i = 0; i < 4; i++) {
        archetypeList.push({ type: 'standard', hp: 1, color: TuningConfig.cannons.colorStandard, radius: TuningConfig.cannons.radius });
      }
    } else if (waveNumber === 3) {
      // Wave 3: 1 Heavy (gold, 2 HP), 1 Scatter (purple, dual shot), 2 Standard
      baseOrbit = -TuningConfig.waves.orbitSpeedBase;
      archetypeList.push({ type: 'heavy', hp: 2, color: TuningConfig.cannons.colorHeavy, radius: TuningConfig.cannons.radius });
      archetypeList.push({ type: 'scatter', hp: 1, color: TuningConfig.cannons.colorScatter, radius: TuningConfig.cannons.radius });
      archetypeList.push({ type: 'standard', hp: 1, color: TuningConfig.cannons.colorStandard, radius: TuningConfig.cannons.radius });
      archetypeList.push({ type: 'standard', hp: 1, color: TuningConfig.cannons.colorStandard, radius: TuningConfig.cannons.radius });
      this.showPopup(getLang() === 'en' ? '⚠️ NEW HOSTILES: SCATTER & ARMORED!' : '⚠️ NOVOS INIMIGOS: DISPERSOR ROXO & BLINDADO!', '#cc66ff');
    } else if (waveNumber === 4) {
      // Wave 4: 1 Sniper (cyan railgun), 1 Heavy (gold), 1 Scatter (purple), 2 Standard (counter-rotating)
      baseOrbit = TuningConfig.waves.orbitSpeedBase * 1.15;
      archetypeList.push({ type: 'sniper', hp: 1, color: TuningConfig.cannons.colorSniper, radius: TuningConfig.cannons.radius });
      archetypeList.push({ type: 'heavy', hp: 2, color: TuningConfig.cannons.colorHeavy, radius: TuningConfig.cannons.radius });
      archetypeList.push({ type: 'scatter', hp: 1, color: TuningConfig.cannons.colorScatter, radius: TuningConfig.cannons.radius });
      archetypeList.push({ type: 'standard', hp: 1, color: TuningConfig.cannons.colorStandard, radius: TuningConfig.cannons.radius });
      archetypeList.push({ type: 'standard', hp: 1, color: TuningConfig.cannons.colorStandard, radius: TuningConfig.cannons.radius });
      this.showPopup(t('hud_sniper_lock'), '#00ccff');
    } else if (waveNumber % 5 === 0) {
      // DREADNOUGHT (Orbital Fortress Boss — Wave 5, 10, 15, 20...)
      const bossTier = Math.floor(waveNumber / 5);
      const bossHp = TuningConfig.boss.baseHp + (bossTier - 1) * TuningConfig.boss.hpPerTier;
      const bossShield = TuningConfig.boss.shieldMaxHp + Math.floor((bossTier - 1) * TuningConfig.boss.shieldPipsPerTier);

      baseOrbit = TuningConfig.waves.orbitSpeedBase * 0.65 * (bossTier % 2 === 0 ? -1 : 1);
      archetypeList.push({
        type: 'boss',
        hp: bossHp,
        color: TuningConfig.cannons.colorBoss,
        radius: TuningConfig.cannons.bossRadius,
        bossPhase: 'barrage',
        bossPhaseTimerMs: TuningConfig.boss.barrageDurationMs,
        shieldHp: bossShield,
        maxShieldHp: bossShield,
      });

      // Escort wingmen based on boss tier
      archetypeList.push({ type: 'sniper', hp: 1, color: TuningConfig.cannons.colorSniper, radius: TuningConfig.cannons.radius });
      if (bossTier >= 2) {
        archetypeList.push({ type: 'heavy', hp: 2, color: TuningConfig.cannons.colorHeavy, radius: TuningConfig.cannons.radius });
      } else {
        archetypeList.push({ type: 'scatter', hp: 1, color: TuningConfig.cannons.colorScatter, radius: TuningConfig.cannons.radius });
      }
      if (bossTier >= 3) {
        archetypeList.push({ type: 'scatter', hp: 1, color: TuningConfig.cannons.colorScatter, radius: TuningConfig.cannons.radius });
      }

      this.bossWarningTimerMs = 1500;
      this.recordMetric('boss_entered', { wave: waveNumber, tier: bossTier, hp: bossHp, shield: bossShield });
      this.cameras.main.shake(250, 0.016);
      this.showPopup(
        getLang() === 'en'
          ? `🚨 RED ALERT: DREADNOUGHT TIER ${bossTier}! (${bossHp} HP)\n[HIT SHIELD ${bossShield}X TO DESTROY IT!]`
          : `🚨 ALERTA GERAL: DREADNOUGHT TIER ${bossTier}! (${bossHp} HP)\n[ATINJA O ESCUDO ${bossShield}X PARA DESTRUÍ-LO!]`,
        '#ff0055'
      );
      this.audioManager.setBgmMode('boss');
    } else {
      // Wave 6+, 11+, 16+...: Procedural dynamic mix with regular combat BGM
      this.audioManager.setBgmMode('regular');
      baseOrbit = TuningConfig.waves.orbitSpeedBase * (waveNumber % 2 === 0 ? 1.2 : -1.2);
      const count = Math.min(TuningConfig.cannons.maxCount, 4 + Math.floor((waveNumber - 5) / 2));
      archetypeList.push({ type: 'sniper', hp: 1, color: TuningConfig.cannons.colorSniper, radius: TuningConfig.cannons.radius });
      archetypeList.push({ type: 'heavy', hp: 2, color: TuningConfig.cannons.colorHeavy, radius: TuningConfig.cannons.radius });
      archetypeList.push({ type: 'scatter', hp: 1, color: TuningConfig.cannons.colorScatter, radius: TuningConfig.cannons.radius });
      for (let i = 3; i < count; i++) {
        const isH = i % 2 === 0;
        archetypeList.push({
          type: isH ? 'heavy' : 'standard',
          hp: isH ? 2 : 1,
          color: isH ? TuningConfig.cannons.colorHeavy : TuningConfig.cannons.colorStandard,
          radius: TuningConfig.cannons.radius,
        });
      }
    }

    const cannonCount = archetypeList.length;
    const now = performance.now();
    for (let i = 0; i < cannonCount; i++) {
      let orbitAngle = (i / cannonCount) * Math.PI * 2;
      let initialDelay = 1.0 + Math.random() * 1.4 + i * 0.35;

      if (waveNumber === 1) {
        // Wave 1 Onboarding: Top position facing directly down to core
        orbitAngle = -Math.PI / 2;
        initialDelay = TuningConfig.waves.wave1InitialDelaySeconds;
      }

      const x = cx + Math.cos(orbitAngle) * dist;
      const y = cy + Math.sin(orbitAngle) * dist;
      const def = archetypeList[i];

      const orbitSpeed = waveNumber >= 4 ? (i % 2 === 0 ? baseOrbit : -baseOrbit) : baseOrbit;

      this.cannons.push({
        id: i,
        x,
        y,
        radius: def.radius,
        orbitAngle,
        orbitSpeed,
        type: def.type,
        hp: def.hp,
        maxHp: def.hp,
        angle: orbitAngle + Math.PI,
        nextFireTime: now + initialDelay * 1000,
        isDestroyed: false,
        hitFlashTimerMs: 0,
        isEnraged: false,
        attackCycle: 0,
        color: def.color,
        bossPhase: def.type === 'boss' ? 'barrage' : undefined,
        bossPhaseTimerMs: def.type === 'boss' ? TuningConfig.boss.barrageDurationMs : undefined,
        bossChargingMegaBeam: false,
        shieldHp: def.shieldHp,
        maxShieldHp: def.maxShieldHp,
        spawnTimeMs: this.time.now,
      });
    }

    this.updateUI();
  }

  // =========================================================================
  // SHADOW DEFLECTOR (Nemesis Duel & Deadly Rally Mechanics — LRN-054)
  // =========================================================================

  private spawnNemesis(wave: number): void {
    const tier = Math.max(1, Math.round(wave / 10));
    const n = this.nemesis;
    Object.assign(n, GameScene.blankNemesis());
    n.active = true;
    n.tier = tier;
    n.maxHp = 3 + (tier - 1) * 2;
    n.hp = n.maxHp;

    const cx = TuningConfig.arena.centerX;
    const cy = TuningConfig.arena.centerY;
    const rMax = TuningConfig.nemesis.orbitMax;

    // Spawns diametrically opposite player's blade
    n.angle = this.bladeAngle + Math.PI;
    n.radius = rMax;
    n.targetAngle = n.angle;
    n.targetRadius = rMax;
    n.x = cx + Math.cos(n.angle) * n.radius;
    n.y = cy + Math.sin(n.angle) * n.radius;
    n.bladeAngle = n.angle + Math.PI / 2;
    n.state = 'stalk';
    const now = performance.now();
    n.stateUntil = now + 1400; // Duel reading grace window
    n.nextFireTime = now + 2000;

    this.audioManager.nemesisSpawn();
    this.audioManager.setBgmMode('boss');
    this.cameras.main.flash(120, 255, 30, 60);
    this.cameras.main.shake(320, 0.014);

    this.shockwaves.push({
      x: n.x,
      y: n.y,
      currentRadius: 10,
      maxRadius: 140,
      color: 0xff1744,
      life: 0.4,
      maxLife: 0.4,
    });

    this.showPopup(
      getLang() === 'en'
        ? `⚔ SHADOW DEFLECTOR TIER ${tier}!\n[DEADLY RALLY: WIN 3X EXCHANGES TO BREAK ITS GUARD]`
        : `⚔ SHADOW DEFLECTOR TIER ${tier}!\n[DEADLY RALLY: REBATA 3X PARA QUEBRAR A GUARDA]`,
      '#ff1744'
    );
    this.recordMetric('nemesis_spawned', { wave, tier, hp: n.maxHp });
  }

  private nemesisEnds(): { ax: number; ay: number; bx: number; by: number } {
    const n = this.nemesis;
    const half = TuningConfig.nemesis.bladeHalf;
    const hx = Math.cos(n.bladeAngle) * half;
    const hy = Math.sin(n.bladeAngle) * half;
    return { ax: n.x - hx, ay: n.y - hy, bx: n.x + hx, by: n.y + hy };
  }

  private updateNemesis(now: number, dt: number): void {
    const n = this.nemesis;
    if (!n.active) return;
    const cx = TuningConfig.arena.centerX;
    const cy = TuningConfig.arena.centerY;

    n.spawnT = Math.min(1, n.spawnT + dt * 1.4);
    if (n.hitFlash > 0) n.hitFlash = Math.max(0, n.hitFlash - dt * 3.5);
    if (n.parryFlash > 0) n.parryFlash = Math.max(0, n.parryFlash - dt * 4);

    const aggression = 1 + (n.tier - 1) * 0.22 + (1 - n.hp / n.maxHp) * 0.45;

    switch (n.state) {
      case 'stalk': {
        const toPlayer = Phaser.Math.Angle.Wrap(this.bladeAngle - n.angle);
        const flankSide = toPlayer >= 0 ? 1 : -1;
        const desired = this.bladeAngle - flankSide * (0.85 + Math.random() * 0.3);
        const delta = Phaser.Math.Angle.Wrap(desired - n.angle);
        n.angle += Math.sign(delta) * Math.min(Math.abs(delta), TuningConfig.nemesis.stalkSpeed * aggression * dt);

        n.radius += Math.sin(now * 0.0021) * 26 * dt;
        n.radius = Phaser.Math.Clamp(n.radius, TuningConfig.nemesis.orbitMin, TuningConfig.nemesis.orbitMax);
        if (now >= n.stateUntil || (!this.rallyInFlight() && now - n.nextFireTime > 2200)) {
          this.nemesisEnterDash(now);
        }
        break;
      }
      case 'dash': {
        const k = 1 - Math.max(0, (n.stateUntil - now) / TuningConfig.nemesis.dashMs);
        const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2; // easeInOutQuad
        n.angle = n.dashFrom + Phaser.Math.Angle.Wrap(n.dashTo - n.dashFrom) * e;
        n.radius = n.dashRadiusFrom + (n.dashRadiusTo - n.dashRadiusFrom) * e;

        n.ghostTick += dt;
        if (n.ghostTick > 0.028) {
          n.ghostTick = 0;
          for (let i = Math.min(n.ghostLen, 4); i > 0; i--) {
            n.ghostX[i] = n.ghostX[i - 1];
            n.ghostY[i] = n.ghostY[i - 1];
            n.ghostA[i] = n.ghostA[i - 1];
          }
          n.ghostX[0] = n.x;
          n.ghostY[0] = n.y;
          n.ghostA[0] = n.bladeAngle;
          if (n.ghostLen < 5) n.ghostLen++;
        }

        if (now >= n.stateUntil) {
          n.state = 'strike';
          n.stateUntil = now + TuningConfig.nemesis.strikeMs / aggression;
        }
        break;
      }
      case 'strike': {
        if (now >= n.stateUntil) {
          if (!this.rallyInFlight()) {
            this.nemesisFire(now);
            n.nextFireTime = now + (1400 + Math.random() * 800) / aggression;
          }
          n.state = 'stalk';
          const stalkMin = TuningConfig.nemesis.stalkMin;
          const stalkMax = TuningConfig.nemesis.stalkMax;
          n.stateUntil = now + (stalkMin + Math.random() * (stalkMax - stalkMin)) / aggression;
          n.ghostLen = 0;
        }
        break;
      }
      case 'recover': {
        n.angle += 0.35 * dt;
        if (now >= n.stateUntil) {
          n.state = 'stalk';
          n.stateUntil = now + 450;
        }
        break;
      }
    }

    n.x = cx + Math.cos(n.angle) * n.radius;
    n.y = cy + Math.sin(n.angle) * n.radius;

    const threat = this.nearestRallyBolt(n.x, n.y);
    if (threat) {
      n.bladeAngle = Math.atan2(threat.y - n.y, threat.x - n.x) + Math.PI / 2;
    } else {
      n.bladeAngle = n.angle + Math.PI / 2;
    }
  }

  private nemesisEnterDash(now: number): void {
    const n = this.nemesis;
    const side = Math.random() < 0.5 ? 1 : -1;
    n.dashFrom = n.angle;
    n.dashTo = this.bladeAngle + side * (1.5 + Math.random() * 1.3);
    n.dashRadiusFrom = n.radius;
    const rMin = TuningConfig.nemesis.orbitMin;
    const rMax = TuningConfig.nemesis.orbitMax;
    n.dashRadiusTo = rMin + Math.random() * (rMax - rMin);
    n.state = 'dash';
    n.stateUntil = now + TuningConfig.nemesis.dashMs;
    n.ghostLen = 0;
    this.audioManager.nemesisDash();
  }

  private nemesisFire(now: number): void {
    const n = this.nemesis;
    const cx = TuningConfig.arena.centerX;
    const cy = TuningConfig.arena.centerY;
    const a = Math.atan2(cy - n.y, cx - n.x) + (Math.random() - 0.5) * 0.18;
    const sp = 230 + n.tier * 22;
    this.lasers.push({
      x: n.x + Math.cos(a) * 30,
      y: n.y + Math.sin(a) * 30,
      vx: Math.cos(a) * sp,
      vy: Math.sin(a) * sp,
      radius: 8,
      isReflected: false,
      isOverloadShard: false,
      sourceCannonId: -99,
      rally: 0,
      rallyLock: 2,
      fromNemesis: true,
    });
    this.audioManager.playSniperShot();
    this.spawnSparks(n.x + Math.cos(a) * 30, n.y + Math.sin(a) * 30, 0xff8fa3, 10);
  }

  private nemesisReturn(laser: LaserOrb, t: number, now: number): void {
    const n = this.nemesis;
    const cx = TuningConfig.arena.centerX;
    const cy = TuningConfig.arena.centerY;

    let nx = Math.cos(n.angle);
    let ny = Math.sin(n.angle);
    if (laser.vx * nx + laser.vy * ny > 0) {
      nx = -nx;
      ny = -ny;
    }
    const d2 = laser.vx * nx + laser.vy * ny;
    let rx = laser.vx - 2 * d2 * nx;
    let ry = laser.vy - 2 * d2 * ny;

    const s = t * 2 - 1;
    const slice = s * 0.55;
    const cs = Math.cos(slice);
    const sn = Math.sin(slice);
    const tmp = rx * cs - ry * sn;
    ry = rx * sn + ry * cs;
    rx = tmp;

    const toCore = Math.atan2(cy - n.y, cx - n.x) + s * 0.34;
    const blend = 0.55;
    let ux = Math.cos(Math.atan2(ry, rx)) * (1 - blend) + Math.cos(toCore) * blend;
    let uy = Math.sin(Math.atan2(ry, rx)) * (1 - blend) + Math.sin(toCore) * blend;
    const ul = Math.hypot(ux, uy) || 1;
    ux /= ul;
    uy /= ul;

    const tier = (laser.rally || 0) + 1;
    const currentSpeed = Math.hypot(laser.vx, laser.vy) || 300;
    const speed = Math.min(
      TuningConfig.nemesis.rallyMaxSpeed,
      Math.max(300, currentSpeed) * TuningConfig.nemesis.rallySpeedStep
    );

    laser.isReflected = false;
    laser.rally = tier;
    laser.rallyLock = 2;
    laser.fromNemesis = true;
    laser.radius = Math.min(16, laser.radius * TuningConfig.nemesis.rallyRadiusStep);
    laser.vx = ux * speed;
    laser.vy = uy * speed;
    laser.x = n.x + ux * 26;
    laser.y = n.y + uy * 26;

    n.parryFlash = 1;
    n.rageTier = Math.max(n.rageTier, tier);
    this.onRallyExchange(tier, laser.x, laser.y, false);
  }

  private onRallyExchange(tier: number, x: number, y: number, byPlayer: boolean): void {
    this.bestRallyRun = Math.max(this.bestRallyRun, tier);
    this.audioManager.rallyClash(tier, byPlayer);

    const colors = TuningConfig.nemesis.rallyColors;
    const col = colors[Math.min(tier, colors.length - 1)];

    this.shockwaves.push({
      x,
      y,
      currentRadius: 12,
      maxRadius: 44 + tier * 9,
      color: col,
      life: 0.26,
      maxLife: 0.26,
    });
    this.spawnSparks(x, y, col, 6 + Math.min(12, tier * 2));

    this.hitstopTimerMs = Math.max(this.hitstopTimerMs, Math.min(70, 16 + tier * 7));
    this.cameras.main.shake(70 + tier * 12, Math.min(0.012, 0.002 + tier * 0.0012));

    if (tier === TuningConfig.nemesis.rallyLethalTier) {
      this.showPopup(
        getLang() === 'en'
          ? '⚡ LETHAL CHARGE! THIS BOLT CAN BREAK THE GUARD!'
          : '⚡ CARGA LETAL! ESTE DISPARO QUEBRA A GUARDA!',
        '#ffea00'
      );
      this.spawnFloatingScore(x, y - 28, '⚡ LETHAL CHARGE!', '#ffea00');
    } else if (tier > TuningConfig.nemesis.rallyLethalTier && tier % 2 === 1) {
      this.showPopup(`⚔ RALLY ×${tier}!`, '#ffaa00');
      this.spawnFloatingScore(x, y - 25, `RALLY ×${tier}`, '#ffaa00');
    }
  }

  private hitNemesis(laser: LaserOrb, now: number): void {
    const n = this.nemesis;
    const isRecovering = n.state === 'recover';
    const lethal = (laser.rally || 0) >= TuningConfig.nemesis.rallyLethalTier || isRecovering;
    if (!lethal) {
      // Option A: Non-lethal hull contact is absorbed/dissipated by Nemesis armored chassis!
      const idx = this.lasers.indexOf(laser);
      if (idx !== -1) this.lasers.splice(idx, 1);
      this.spawnSparks(laser.x, laser.y, 0x8899aa, 18);
      this.audioManager.playShieldRicochet();
      this.spawnFloatingScore(n.x, n.y - 34, getLang() === 'en' ? 'GUARDED' : 'BLOQUEADO', '#8899aa');
      n.nextFireTime = Math.min(n.nextFireTime, now + 1200);
      return;
    }

    const idx = this.lasers.indexOf(laser);
    if (idx !== -1) this.lasers.splice(idx, 1);

    const dmg = 1;
    n.hp -= dmg;
    n.hitFlash = 1;
    n.state = 'recover';
    n.stateUntil = now + TuningConfig.nemesis.recoverMs;
    n.ghostLen = 0;

    this.audioManager.rallyBreak();
    this.cameras.main.shake(260, 0.014);
    this.cameras.main.flash(90, 255, 220, 120);

    this.shockwaves.push({
      x: n.x,
      y: n.y,
      currentRadius: 15,
      maxRadius: 130,
      color: 0xffea00,
      life: 0.35,
      maxLife: 0.35,
    });
    this.spawnSparks(n.x, n.y, 0xffea00, 24);

    const pts = 250 * (laser.rally || 3);
    this.score += pts;
    this.spawnFloatingScore(n.x, n.y - 40, `💥 GUARD BREAK −${dmg}`, '#ffea00');

    if (n.hp <= 0) {
      this.killNemesis(now);
    }
  }

  private killNemesis(now: number): void {
    const n = this.nemesis;
    n.active = false;
    this.bossesDefeatedCount++;
    const pts = 1500 * n.tier;
    this.score += pts;
    this.spawnFloatingScore(n.x, n.y - 40, `+${pts}`, '#ff1744');

    this.spawnFlyingFragment(n.x, n.y, 80, 0xff1744);

    this.shockwaves.push({
      x: n.x,
      y: n.y,
      currentRadius: 20,
      maxRadius: 180,
      color: 0xff1744,
      life: 0.5,
      maxLife: 0.5,
    });
    this.shockwaves.push({
      x: n.x,
      y: n.y,
      currentRadius: 10,
      maxRadius: 120,
      color: 0xffea00,
      life: 0.35,
      maxLife: 0.35,
    });
    this.spawnSparks(n.x, n.y, 0xff1744, 36);

    this.cameras.main.shake(460, 0.018);
    this.cameras.main.flash(110, 255, 60, 90);

    this.audioManager.nemesisDown();
    this.audioManager.setBgmMode('regular');

    this.showPopup(
      getLang() === 'en'
        ? `⚔ SHADOW DEFLECTOR DOWN!\n[DUEL WON • BEST RALLY ×${this.bestRallyRun}]`
        : `⚔ SHADOW DEFLECTOR DESTRUÍDO!\n[DUELO VENCIDO • MELHOR RALLY ×${this.bestRallyRun}]`,
      '#ffea00'
    );

    const remaining = this.cannons.filter(c => !c.isDestroyed).length;
    if (remaining === 0 && !this.waveTransitioning) {
      this.handleWaveClear();
    }
  }

  private rallyInFlight(): boolean {
    for (const l of this.lasers) {
      if (l.rally && l.rally > 0) return true;
    }
    return false;
  }

  public currentRallyTier(): number {
    let t = 0;
    for (const l of this.lasers) {
      if (l.rally && l.rally > t) t = l.rally;
    }
    return t;
  }

  private nearestRallyBolt(x: number, y: number): LaserOrb | null {
    let best: LaserOrb | null = null;
    let bd = 260 * 260;
    for (const l of this.lasers) {
      if (!l.isReflected) continue;
      const d = (l.x - x) ** 2 + (l.y - y) ** 2;
      if (d < bd) {
        bd = d;
        best = l;
      }
    }
    return best;
  }

  private updateUI(): void {
    const healthPips = '♥ '.repeat(Math.max(0, this.coreHealth));
    const aliveCannons = this.cannons.filter(c => !c.isDestroyed).length;
    const comboStr = this.comboCount > 0 ? `${t('hud_combo')}: ${this.comboCount}x` : `${t('hud_combo')}: 0`;
    const overloadNotice = this.isOverloaded ? ` | ${t('hud_overload_active')}` : '';

    this.uiText.setText(
      `${t('hud_wave', { wave: this.currentWave })} | ${t('hud_core')}: ${healthPips}| ${t('hud_cannons')}: ${aliveCannons} | ${comboStr} | ${t('hud_score')}: ${this.score}${overloadNotice}`
    );

    const hpRatio = Math.max(0, this.coreHealth / TuningConfig.arena.coreMaxHealth);
    const hpPct = Math.round(hpRatio * 100);
    const totalBars = 5;
    const filledBars = Math.max(0, Math.min(totalBars, this.coreHealth));
    const emptyBars = totalBars - filledBars;
    const barStr = '█'.repeat(filledBars) + '░'.repeat(emptyBars);

    let coreColor = '#00f3ff';
    if (this.coreHealth <= 1) {
      coreColor = '#ff1744';
    } else if (this.coreHealth <= 3) {
      coreColor = '#ffea00';
    }

    if (this.coreHudText) {
      this.coreHudText.setText(`${t('hud_core_integrity')} [${barStr}] ${hpPct}%`).setColor(coreColor);
    }

    // Active powerup status
    const statusParts: string[] = [];
    const boss = this.cannons.find(c => c.type === 'boss' && !c.isDestroyed);
    if (boss) {
      if (boss.bossPhase === 'barrage') {
        const sHp = boss.shieldHp ?? 3;
        statusParts.push(getLang() === 'en' ? `🛡️ [BOSS: SHIELD ${sHp}/3 - STRIKE TO BREAK!]` : `🛡️ [BOSS: ESCUDO ${sHp}/3 - ACERTE PARA QUEBRAR!]`);
      } else {
        statusParts.push(getLang() === 'en' ? '⚠️ [BOSS: REACTOR EXPOSED! PARRY MEGA-BEAM!]' : '⚠️ [BOSS: REATOR EXPOSTO! ACERTE O PARRY NO MEGA-RAIO!]');
      }
    }
    if (this.hasCoreShield) {
      statusParts.push(getLang() === 'en' ? '🛡️ [CORE SHIELD ONLINE]' : '🛡️ [ESCUDO DO NÚCLEO]');
    }
    if (this.activePowerup === 'blade_boost') {
      const secs = Math.ceil(this.powerupTimerMs / 1000);
      statusParts.push(getLang() === 'en' ? `⚡ [EXTENDED BLADE: ${secs}s]` : `⚡ [LÂMINA ESTENDIDA: ${secs}s]`);
    } else if (this.activePowerup === 'slow_mo') {
      const secs = Math.ceil(this.powerupTimerMs / 1000);
      statusParts.push(getLang() === 'en' ? `⏱️ [BULLET-TIME: ${secs}s]` : `⏱️ [BULLET-TIME: ${secs}s]`);
    } else if (this.activePowerup === 'multi_beam') {
      const secs = Math.ceil(this.powerupTimerMs / 1000);
      statusParts.push(getLang() === 'en' ? `🔱 [MULTI-LASER: ${secs}s]` : `🔱 [MULTI-LASER: ${secs}s]`);
    }
    if (aliveCannons === 1 && this.currentWave > 1 && this.isRoundActive && !boss) {
      statusParts.push(t('hud_enrage_active'));
    }

    if (this.activeModifiers.length > 0) {
      const modLabels = this.activeModifiers.map(mId => {
        const m = TuningConfig.miniRogue.modifiers.find(mod => mod.id === mId);
        const name = t(`mod_${mId}_name`) || (m ? m.name : mId);
        return m ? `${m.icon} ${name}` : mId;
      }).join(' | ');
      statusParts.push(`⚡ [${modLabels}]`);
    }

    this.statusText.setText(statusParts.join(' '));
    this.updateQuestUI();
    this.updateMobileControlsVisibility();
  }

  private updateQuestUI(): void {
    if (!this.questHudText) return;
    if (this.activeQuest && this.isRoundActive) {
      const isEn = getLang() === 'en';
      const check = this.activeQuest.isCompleted ? (isEn ? '✔ COMPLETED' : '✔ CONCLUÍDA') : '⚡';
      const color = this.activeQuest.isCompleted ? '#00ffcc' : '#ffea00';
      const prefix = t('quest_prefix');
      const desc = t(`quest_${this.activeQuest.id}_desc`) || this.activeQuest.description;
      this.questHudText.setText(
        `${check} ${prefix}: ${desc} (${this.activeQuest.current}/${this.activeQuest.target}) [+${this.activeQuest.rewardFragments}💎]`
      ).setColor(color).setVisible(true);
    } else {
      this.questHudText.setVisible(false);
    }
  }

  private progressQuest(type: string, amount = 1): void {
    if (!this.activeQuest || this.activeQuest.isCompleted) return;
    if (this.activeQuest.type === type) {
      this.activeQuest.current = Math.min(this.activeQuest.target, this.activeQuest.current + amount);
      this.updateQuestUI();
      if (this.activeQuest.current >= this.activeQuest.target) {
        this.activeQuest.isCompleted = true;
        this.audioManager.playStreakTier(5);
        this.showPopup(t('quest_completed_popup', { reward: this.activeQuest.rewardFragments }), '#00ffcc');
        this.spawnFlyingFragment(TuningConfig.arena.centerX, 180, this.activeQuest.rewardFragments, 0x00ffcc);
        this.recordMetric('micro_quest_completed', { quest: this.activeQuest.id });
        this.updateQuestUI();
      }
    }
  }

  public spawnFlyingFragment(x: number, y: number, value: number, color = 0xffea00): void {
    const slot = this.flyingFragments.find(f => !f.active);
    if (!slot) {
      let finalVal = value;
      if (this.activeModifiers.includes('plasma_magnet')) {
        finalVal = Math.round(finalVal * 1.5);
      }
      this.plasmaFragments += finalVal;
      return;
    }
    slot.active = true;
    slot.startX = x;
    slot.startY = y;
    slot.targetX = 35;
    slot.targetY = 22;
    slot.controlX = (x + 35) / 2 + (Math.random() - 0.5) * 140;
    slot.controlY = Math.min(y, 22) - 60 - Math.random() * 40;
    slot.progress = 0;
    slot.speed = 1.3 + Math.random() * 0.4;
    slot.color = color;
    slot.value = value;
  }

  private openMiniRogueSelection(nextWaveNumber: number): void {
    this.isMiniRogueOpen = true;
    this.miniRogueTimerMs = TuningConfig.miniRogue.autoSelectTimeoutMs;
    this.pendingNextWave = nextWaveNumber;

    const allMods = TuningConfig.miniRogue.modifiers;
    const available = allMods.filter(m => !this.activeModifiers.includes(m.id));
    const pool = available.length >= 3 ? available : allMods;
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    const picked = shuffled.slice(0, 3);

    const cx = TuningConfig.arena.centerX;
    const cardW = 230;
    const cardH = 245;
    const gap = 25;
    const startX = cx - (3 * cardW + 2 * gap) / 2;
    const cardY = 125;

    this.miniRogueCards = picked.map((m, i) => {
      const localizedName = t(`mod_${m.id}_name`) || m.name;
      const localizedDesc = t(`mod_${m.id}_desc`) || m.description;
      return {
        id: m.id,
        name: localizedName,
        icon: m.icon,
        description: localizedDesc,
        x: startX + i * (cardW + gap),
        y: cardY,
        w: cardW,
        h: cardH,
        isHovered: false,
      };
    });

    this.clearMiniRogueDom();
    if (this.statusText) this.statusText.setVisible(false);
    if (this.questHudText) this.questHudText.setVisible(false);

    const title = this.add.text(cx, 75, t('mini_rogue_title'), {
      fontFamily: "'Orbitron', monospace",
      fontSize: '22px',
      fontStyle: 'bold',
      color: '#00f3ff',
      align: 'center',
    }).setOrigin(0.5).setDepth(30);
    this.miniRogueUiElements.push(title);

    this.miniRogueCards.forEach((c) => {
      const iconTxt = this.add.text(c.x + c.w / 2, c.y + 32, c.icon, {
        fontSize: '36px',
        align: 'center',
      }).setOrigin(0.5).setDepth(30);

      const nameTxt = this.add.text(c.x + c.w / 2, c.y + 84, c.name, {
        fontFamily: "'Orbitron', monospace",
        fontSize: '16px',
        fontStyle: 'bold',
        color: '#ffea00',
        align: 'center',
      }).setOrigin(0.5).setDepth(30);

      const descTxt = this.add.text(c.x + c.w / 2, c.y + 144, c.description, {
        fontFamily: "'Rajdhani', sans-serif",
        fontSize: '15px',
        fontStyle: '600',
        color: '#d6ecff',
        align: 'center',
        lineSpacing: 4,
        wordWrap: { width: c.w - 24 },
      }).setOrigin(0.5).setDepth(30);

      const pickBtn = this.add.text(c.x + c.w / 2, c.y + c.h - 26, t('mini_rogue_select_btn'), {
        fontFamily: "'Orbitron', monospace",
        fontSize: '13px',
        fontStyle: 'bold',
        color: '#00f3ff',
        backgroundColor: '#0c1626',
        padding: { x: 16, y: 7 },
      }).setOrigin(0.5).setDepth(30).setInteractive({ useHandCursor: true });

      pickBtn.on('pointerdown', () => {
        this.selectMiniRogueModifier(c.id);
      });

      this.miniRogueUiElements.push(iconTxt, nameTxt, descTxt, pickBtn);
    });

    this.recordMetric('mini_rogue_opened', { wave: this.currentWave });
  }

  private selectMiniRogueModifier(modifierId: string): void {
    if (!this.isMiniRogueOpen) return;
    this.isMiniRogueOpen = false;
    this.activeModifiers.push(modifierId);
    this.audioManager.playStreakTier(5);

    const modDef = TuningConfig.miniRogue.modifiers.find(m => m.id === modifierId);
    if (modDef) {
      const modName = t(`mod_${modifierId}_name`) || modDef.name;
      this.showPopup(t('mini_rogue_activated_popup', { name: modName }), '#ffea00');
      if ('coreHealthCost' in modDef && modDef.coreHealthCost) {
        this.coreHealth = Math.max(1, this.coreHealth - modDef.coreHealthCost);
      }
    }
    this.clearMiniRogueDom();
    if (this.statusText) this.statusText.setVisible(true);
    if (this.questHudText) this.questHudText.setVisible(true);
    this.recordMetric('mini_rogue_selected', { modifier: modifierId, wave: this.currentWave });
    this.currentWave = this.pendingNextWave;
    this.waveTransitioning = false;
    this.setupWave(this.currentWave);
    this.updateUI();
  }

  private clearMiniRogueDom(): void {
    this.miniRogueUiElements.forEach(el => el.destroy());
    this.miniRogueUiElements = [];
  }

  public update(_time: number, delta: number): void {
    if (this.isPaused) {
      this.render();
      return;
    }

    if (this.isMiniRogueOpen) {
      this.miniRogueTimerMs -= delta;
      if (this.miniRogueTimerMs <= 0 && this.miniRogueCards.length > 0) {
        this.selectMiniRogueModifier(this.miniRogueCards[0].id);
      }
    }

    const speedFactor = this.isMiniRogueOpen ? TuningConfig.miniRogue.bulletTimeScale : 1.0;
    const dt = Math.min(delta / 1000, 0.04) * speedFactor;

    // Update Asteroids Drift and Rotation
    for (const ast of this.asteroids) {
      ast.orbitAngle += ast.orbitSpeed * dt;
      ast.rotation += ast.rotationSpeed * dt;
    }

    // Record Blade Motion Trail (Past 5 frames for smooth plasma trailing)
    if (this.isRoundActive) {
      const cx = TuningConfig.arena.centerX;
      const cy = TuningConfig.arena.centerY;
      const bladeCfg = TuningConfig.blades[this.selectedBlade as keyof typeof TuningConfig.blades] || TuningConfig.blades.standard;
      const titanBonus = this.activeModifiers.includes('titan_grip') ? 20 : 0;
      const currentBladeLength =
        (this.activePowerup === 'blade_boost'
          ? TuningConfig.blade.boostedLength
          : bladeCfg.length) + titanBonus;
      const halfLen = currentBladeLength / 2;
      const ax = this.bladeX - Math.cos(this.bladeAngle) * halfLen;
      const ay = this.bladeY - Math.sin(this.bladeAngle) * halfLen;
      const bx = this.bladeX + Math.cos(this.bladeAngle) * halfLen;
      const by = this.bladeY + Math.sin(this.bladeAngle) * halfLen;

      const orbitRadius = Math.hypot(this.bladeX - cx, this.bladeY - cy) || 1;
      const playerAngle = Math.atan2(this.bladeY - cy, this.bladeX - cx);
      const halfBladeAngle = halfLen / orbitRadius;
      const startAngle = playerAngle - halfBladeAngle;
      const endAngle = playerAngle + halfBladeAngle;

      let trailColor: number = bladeCfg.color;
      if (this.isOverloaded) {
        trailColor = TuningConfig.blade.overloadColor;
      } else if (this.activePowerup === 'blade_boost') {
        trailColor = 0x00ffcc;
      } else if (this.parryActiveTimerMs > 0) {
        trailColor = TuningConfig.blade.parryColor;
      }

      this.bladeTrail.push({ ax, ay, bx, by, orbitRadius, startAngle, endAngle, color: trailColor });
      if (this.bladeTrail.length > 5) {
        this.bladeTrail.shift();
      }
    } else {
      this.bladeTrail = [];
    }

    if (this.coreDamageFlashTimerMs > 0) {
      this.coreDamageFlashTimerMs -= delta;
    }

    if (this.hitstopTimerMs > 0) {
      this.hitstopTimerMs -= delta;
      return;
    }

    if (this.parryActiveTimerMs > 0) {
      this.parryActiveTimerMs -= delta;
    }

    if (this.bossWarningTimerMs > 0) {
      this.bossWarningTimerMs -= delta;
    }

    if (this.parryCueTimerMs > 0) {
      this.parryCueTimerMs -= delta;
    }

    // FTUE: Wave 1 idle check
    if (this.isRoundActive && this.currentWave === 1 && !this.hasMovedBlade) {
      this.ftueIdleTimerMs += delta;
      if (this.ftueIdleTimerMs >= TuningConfig.ftue.idleHintDelayMs && !this.ftueHintShown) {
        this.ftueHintShown = true;
        this.recordMetric('tutorial_hint_shown', { type: 'orbit_movement', delayMs: this.ftueIdleTimerMs });
      }
    }

    if (this.duelBannerTimerMs > 0) {
      this.duelBannerTimerMs -= delta;
    }

    // Powerup countdown
    if (this.powerupTimerMs > 0) {
      this.powerupTimerMs -= delta;
      if (this.powerupTimerMs <= 0) {
        this.activePowerup = null;
        this.updateUI();
      }
    }

    // Cannon hit flashes & recoil decay
    for (const c of this.cannons) {
      if (c.hitFlashTimerMs > 0) {
        c.hitFlashTimerMs -= delta;
      }
      if (c.recoilOffset && c.recoilOffset > 0) {
        c.recoilOffset = Math.max(0, c.recoilOffset - dt * 26);
      }
    }

    // Update Debris (300ms destruction fragments)
    for (let i = this.debris.length - 1; i >= 0; i--) {
      const d = this.debris[i];
      d.x += d.vx * dt;
      d.y += d.vy * dt;
      d.vx *= 0.94;
      d.vy *= 0.94;
      d.rotation += d.vRot * dt;
      d.life -= dt;
      if (d.life <= 0) {
        this.debris.splice(i, 1);
      }
    }

    // Update Shockwaves (300ms expanding rings)
    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const sw = this.shockwaves[i];
      sw.life -= dt;
      const progress = 1 - sw.life / sw.maxLife;
      sw.currentRadius = 8 + (sw.maxRadius - 8) * progress;
      if (sw.life <= 0) {
        this.shockwaves.splice(i, 1);
      }
    }

    // Update Sparks
    for (let i = this.sparks.length - 1; i >= 0; i--) {
      const s = this.sparks[i];
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.life -= dt;
      if (s.life <= 0) {
        this.sparks.splice(i, 1);
      }
    }

    // Update Deflect Vectors (Micro-vetor transitório de feedback tátil de 160ms)
    for (let i = this.deflectVectors.length - 1; i >= 0; i--) {
      const dv = this.deflectVectors[i];
      dv.life -= dt;
      if (dv.life <= 0) {
        this.deflectVectors.splice(i, 1);
      }
    }

    // Update Floating Scores (RNF-01.3: Zero-GC static pool)
    for (let i = 0; i < this.floatingScores.length; i++) {
      const fs = this.floatingScores[i];
      if (!fs.active) continue;
      fs.life -= dt;
      fs.textObj.y -= 36 * dt;
      fs.textObj.setAlpha(Math.max(0, fs.life / fs.maxLife));
      if (fs.life <= 0) {
        fs.active = false;
        fs.textObj.setVisible(false);
      }
    }

    // Update Flying Fragments (RNF-01.3: in-place static pool)
    for (let i = 0; i < this.flyingFragments.length; i++) {
      const f = this.flyingFragments[i];
      if (!f.active) continue;
      f.progress += dt * f.speed;
      if (f.progress >= 1.0) {
        f.active = false;
        let finalVal = f.value;
        if (this.activeModifiers.includes('plasma_magnet')) {
          finalVal = Math.round(finalVal * 1.5);
        }
        this.plasmaFragments += finalVal;
        if (this.uiText) {
          this.tweens.add({
            targets: this.uiText,
            scaleX: 1.15,
            scaleY: 1.15,
            duration: 60,
            yoyo: true,
          });
        }
        this.updateUI();
      }
    }

    if (this.isRoundActive) {
      const nowMs = performance.now();
      this.updateCannons(nowMs, dt);
      if (this.nemesis.active) {
        this.updateNemesis(nowMs, dt);
      }
      this.updateLasers(dt);
      this.updatePowerups(dt);
      this.checkCollisions();
    }

    this.render();
  }

  private updateCannons(now: number, dt: number): void {
    const cx = TuningConfig.arena.centerX;
    const cy = TuningConfig.arena.centerY;
    const dist = TuningConfig.cannons.distanceFromCenter;

    const aliveCannons = this.cannons.filter(c => !c.isDestroyed);
    const nonBossCannons = this.cannons.filter(c => c.type !== 'boss');
    const aliveNonBoss = aliveCannons.filter(c => c.type !== 'boss');
    const destroyedNonBoss = Math.max(0, nonBossCannons.length - aliveNonBoss.length);

    // Frenesi Progressivo (Solução 3A): Cadência acelera progressivamente a cada destruição de canhão
    const cadenceMultiplier = Math.max(
      0.45,
      1.0 - destroyedNonBoss * TuningConfig.cannons.cadenceRampPerLoss
    );

    // ANTI-CAMPING & DUEL: When only 1 cannon remains (from Wave 2 onwards), activate Overdrive!
    if (aliveCannons.length === 1 && this.currentWave > 1 && !this.waveTransitioning) {
      const lone = aliveCannons[0];
      if (!lone.isEnraged) {
        lone.isEnraged = true;
        lone.color = TuningConfig.cannons.colorEnraged;
        // Boost orbit speed so it never stays in front of the player
        lone.orbitSpeed =
          lone.orbitSpeed === 0 ? 0.42 : lone.orbitSpeed * TuningConfig.cannons.enrageOrbitMultiplier;
        this.audioManager.playEnrage();
        this.audioManager.playEnrageAlarm();
        this.showPopup(t('hud_enrage_popup'), '#ff1144');
        this.cameras.main.shake(120, 0.008);
        this.updateUI();
      }
    }

    const waveLaserSpeed =
      (TuningConfig.laser.initialSpeed + (this.currentWave - 1) * TuningConfig.laser.speedRampPerWave) *
      (this.activePowerup === 'slow_mo' ? 0.5 : 1.0);

    for (const cannon of this.cannons) {
      if (cannon.isDestroyed) continue;

      if (cannon.orbitSpeed !== 0) {
        cannon.orbitAngle += cannon.orbitSpeed * dt;
        cannon.x = cx + Math.cos(cannon.orbitAngle) * dist;
        cannon.y = cy + Math.sin(cannon.orbitAngle) * dist;
        cannon.angle = cannon.orbitAngle + Math.PI;
      }

      // BOSS STATE & SHIELD MACHINE (Ticked continuously every frame!)
      if (cannon.type === 'boss') {
        cannon.bossPhaseTimerMs =
          (cannon.bossPhaseTimerMs ?? TuningConfig.boss.barrageDurationMs) - dt * 1000;

        if (cannon.bossPhase === 'barrage') {
          // Transitions if timer runs out OR if shield was shattered by player hits
          if (
            cannon.bossPhaseTimerMs <= 0 ||
            (cannon.shieldHp !== undefined && cannon.shieldHp <= 0)
          ) {
            cannon.bossPhase = 'vulnerable';
            cannon.bossPhaseTimerMs = TuningConfig.boss.vulnerableDurationMs;
            cannon.bossChargingMegaBeam = false;
            this.audioManager.playBossOverheat();
            this.showPopup(t('hud_boss_shield_broken'), '#ff0055');
            this.cameras.main.shake(160, 0.012);
            cannon.nextFireTime = now + 1200; // Mega-beam fires in 1.2s
            this.time.delayedCall(400, () => {
              if (!cannon.isDestroyed && cannon.bossPhase === 'vulnerable') {
                this.audioManager.playMegaBeamCharge();
                cannon.bossChargingMegaBeam = true;
              }
            });
            this.updateUI();
          }
        } else if (cannon.bossPhase === 'vulnerable') {
          if (cannon.bossPhaseTimerMs <= 0) {
            // Re-arm shield and transition back to barrage
            cannon.bossPhase = 'barrage';
            cannon.bossPhaseTimerMs = TuningConfig.boss.barrageDurationMs;
            cannon.shieldHp = TuningConfig.boss.shieldRestoreOnCycle; // Restores only 1 emergency shield pip (fairer rebalance)
            cannon.bossChargingMegaBeam = false;
            this.showPopup(t('hud_boss_shield_restored'), '#00e1ff');
            this.audioManager.playDeflect(true);
            cannon.nextFireTime = now + 1500;
            this.updateUI();
          }
        }
      }

      if (!this.waveTransitioning && now >= cannon.nextFireTime) {
        const dirX = cx - cannon.x;
        const dirY = cy - cannon.y;
        const len = Math.hypot(dirX, dirY) || 1;
        const normX = dirX / len;
        const normY = dirY / len;

        if (cannon.type === 'boss') {
          if (cannon.bossPhase === 'vulnerable') {
            // Firing the MEGA-BEAM!
            const beamSpeed = TuningConfig.boss.megaBeamSpeed;
            cannon.recoilOffset = 10;
            this.lasers.push({
              x: cannon.x,
              y: cannon.y,
              vx: normX * beamSpeed,
              vy: normY * beamSpeed,
              radius: TuningConfig.boss.megaBeamRadius,
              isReflected: false,
              isOverloadShard: false,
              isMegaBeam: true,
              sourceCannonId: cannon.id,
            });
            this.audioManager.playMegaBeamFire();
            this.cameras.main.shake(220, 0.018);
            cannon.nextFireTime = now + 99999; // Only 1 mega-beam per vulnerable cycle
          } else {
            // Controlled Boss Tactical Attack Variation (4 distinct patterns with anti-repetition)
            const availablePatterns = TuningConfig.boss.patterns.filter(p => p !== this.lastBossPattern);
            const chosenPattern = availablePatterns[Math.floor(Math.random() * availablePatterns.length)];
            this.lastBossPattern = chosenPattern;
            this.recordMetric('boss_pattern_selected', { pattern: chosenPattern, wave: this.currentWave });

            cannon.recoilOffset = 8;
            const baseAngle = Math.atan2(normY, normX);

            if (chosenPattern === 'heavy_double') {
              // PATTERN 1: Heavy Double — two high-mass concentrated plasma orbs
              for (const off of [-0.12, 0.12]) {
                const a = baseAngle + off;
                this.lasers.push({
                  x: cannon.x,
                  y: cannon.y,
                  vx: Math.cos(a) * waveLaserSpeed * 1.15,
                  vy: Math.sin(a) * waveLaserSpeed * 1.15,
                  radius: TuningConfig.laser.heavyRadius,
                  isReflected: false,
                  isOverloadShard: false,
                  isHeavy: true,
                  sourceCannonId: cannon.id,
                });
              }
              this.audioManager.playLaserShot();
              this.cameras.main.shake(120, 0.01);
              cannon.nextFireTime = now + 2400;
            } else if (chosenPattern === 'sweep_barrage') {
              // PATTERN 2: Sweep Barrage — 5-way spread covering a wide radial angle
              for (const off of [-0.36, -0.18, 0, 0.18, 0.36]) {
                const a = baseAngle + off;
                this.lasers.push({
                  x: cannon.x,
                  y: cannon.y,
                  vx: Math.cos(a) * waveLaserSpeed * 0.95,
                  vy: Math.sin(a) * waveLaserSpeed * 0.95,
                  radius: TuningConfig.laser.radius,
                  isReflected: false,
                  isOverloadShard: false,
                  sourceCannonId: cannon.id,
                });
              }
              this.audioManager.playScatterShot();
              cannon.nextFireTime = now + 2600;
            } else if (chosenPattern === 'twin_flank') {
              // PATTERN 3: Twin Flank — high-speed angled shots targeting paddle flanks
              const bossTier = Math.floor(this.currentWave / TuningConfig.boss.bossIntervalWaves);
              for (const off of [-0.32, 0.32]) {
                const a = baseAngle + off;
                const isHarmonic = bossTier >= 2;
                this.lasers.push({
                  x: cannon.x,
                  y: cannon.y,
                  vx: Math.cos(a) * waveLaserSpeed * 1.35,
                  vy: Math.sin(a) * waveLaserSpeed * 1.35,
                  radius: TuningConfig.laser.radius + 1,
                  isReflected: false,
                  isOverloadShard: false,
                  trajectoryType: isHarmonic ? 'sine' : 'linear',
                  sinePhase: off > 0 ? 0 : Math.PI,
                  sineFrequency: 0.036,
                  sineAmplitude: 18,
                  sineOriginX: cannon.x,
                  sineOriginY: cannon.y,
                  sineDist: 0,
                  sineAngle: a,
                  sineSpeed: waveLaserSpeed * 1.35,
                  sourceCannonId: cannon.id,
                });
              }
              this.audioManager.playLaserShot();
              cannon.nextFireTime = now + 2100;
            } else if (chosenPattern === 'harmonic_surge') {
              // PATTERN 5: Harmonic Surge — intertwined sinusoidal weaving orbs
              for (const phase of [0, Math.PI]) {
                this.lasers.push({
                  x: cannon.x,
                  y: cannon.y,
                  vx: normX * waveLaserSpeed,
                  vy: normY * waveLaserSpeed,
                  radius: TuningConfig.laser.radius + 1,
                  isReflected: false,
                  isOverloadShard: false,
                  trajectoryType: 'sine',
                  sinePhase: phase,
                  sineFrequency: TuningConfig.boss.harmonicFrequency,
                  sineAmplitude: TuningConfig.boss.harmonicAmplitude,
                  sineOriginX: cannon.x,
                  sineOriginY: cannon.y,
                  sineDist: 0,
                  sineAngle: baseAngle,
                  sineSpeed: TuningConfig.boss.harmonicSurgeSpeed,
                  sourceCannonId: cannon.id,
                });
              }
              // Central standard projectile down the median line
              this.lasers.push({
                x: cannon.x,
                y: cannon.y,
                vx: normX * waveLaserSpeed * 1.05,
                vy: normY * waveLaserSpeed * 1.05,
                radius: TuningConfig.laser.radius,
                isReflected: false,
                isOverloadShard: false,
                sourceCannonId: cannon.id,
              });
              this.audioManager.playScatterShot();
              this.cameras.main.shake(140, 0.012);
              cannon.nextFireTime = now + 2600;
            } else {
              // PATTERN 4: Rapid Pulse — concentrated fast triple burst down the center line
              for (let seq = 0; seq < 3; seq++) {
                this.time.delayedCall(seq * 160, () => {
                  if (!cannon.isDestroyed && cannon.bossPhase === 'barrage') {
                    cannon.recoilOffset = 5;
                    this.lasers.push({
                      x: cannon.x,
                      y: cannon.y,
                      vx: normX * waveLaserSpeed * 1.25,
                      vy: normY * waveLaserSpeed * 1.25,
                      radius: TuningConfig.laser.radius,
                      isReflected: false,
                      isOverloadShard: false,
                      sourceCannonId: cannon.id,
                    });
                    this.audioManager.playLaserShot();
                  }
                });
              }
              cannon.nextFireTime = now + 2700;
            }
          }
        } else if (cannon.type === 'sniper') {
          // SNIPER: Supersonic focused laser rail
          cannon.recoilOffset = 6;
          const sniperSpeed = waveLaserSpeed * 1.95;
          this.lasers.push({
            x: cannon.x,
            y: cannon.y,
            vx: normX * sniperSpeed,
            vy: normY * sniperSpeed,
            radius: TuningConfig.laser.radius * 0.85,
            isReflected: false,
            isOverloadShard: false,
            isSniper: true,
            sourceCannonId: cannon.id,
          });
          this.audioManager.playSniperShot();
          const baseInterval = (aliveCannons.length === 1 || cannon.isEnraged)
            ? TuningConfig.cannons.loneDuelFireIntervalMin * 1.25
            : (2.6 + Math.random() * 1.2) * cadenceMultiplier;
          cannon.nextFireTime = now + baseInterval * 1000;
        } else if (cannon.type === 'scatter') {
          // SCATTER: Wide 32-degree divergent twin shots
          cannon.recoilOffset = 5;
          for (const angleOff of [-0.28, 0.28]) {
            const baseAngle = Math.atan2(normY, normX) + angleOff;
            this.lasers.push({
              x: cannon.x,
              y: cannon.y,
              vx: Math.cos(baseAngle) * waveLaserSpeed,
              vy: Math.sin(baseAngle) * waveLaserSpeed,
              radius: TuningConfig.laser.radius * 0.9,
              isReflected: false,
              isOverloadShard: false,
              sourceCannonId: cannon.id,
            });
          }
          this.audioManager.playScatterShot();
          const baseInterval = (aliveCannons.length === 1 || cannon.isEnraged)
            ? TuningConfig.cannons.loneDuelFireIntervalMin * 1.15
            : (2.5 + Math.random() * 1.1) * cadenceMultiplier;
          cannon.nextFireTime = now + baseInterval * 1000;
        } else if (cannon.type === 'heavy') {
          // HEAVY: Massive, slow-moving plasma orb (dense spatial zoning threat)
          cannon.recoilOffset = 8;
          const heavySpeed = waveLaserSpeed * 0.52;
          this.lasers.push({
            x: cannon.x,
            y: cannon.y,
            vx: normX * heavySpeed,
            vy: normY * heavySpeed,
            radius: TuningConfig.laser.heavyRadius,
            isReflected: false,
            isOverloadShard: false,
            isHeavy: true,
            sourceCannonId: cannon.id,
          });
          this.audioManager.playLaserShot();
          const baseInterval = (aliveCannons.length === 1 || cannon.isEnraged)
            ? TuningConfig.cannons.loneDuelFireIntervalMin * 1.3
            : (3.0 + Math.random() * 1.2) * cadenceMultiplier;
          cannon.nextFireTime = now + baseInterval * 1000;
        } else {
          // Standard: Predictable rhythm laser
          cannon.recoilOffset = 5;
          this.lasers.push({
            x: cannon.x,
            y: cannon.y,
            vx: normX * waveLaserSpeed,
            vy: normY * waveLaserSpeed,
            radius: TuningConfig.laser.radius,
            isReflected: false,
            isOverloadShard: false,
            sourceCannonId: cannon.id,
          });

          this.audioManager.playLaserShot();

          // Solução Onboarding: Cadência deliberadamente lenta na Wave 1
          if (this.currentWave === 1) {
            const nextInterval =
              TuningConfig.waves.wave1FireIntervalMin +
              Math.random() *
                (TuningConfig.waves.wave1FireIntervalMax - TuningConfig.waves.wave1FireIntervalMin);
            cannon.nextFireTime = now + nextInterval * 1000;
          } else if (cannon.isEnraged || aliveCannons.length === 1) {
            const duelMin = TuningConfig.cannons.loneDuelFireIntervalMin;
            const duelMax = TuningConfig.cannons.loneDuelFireIntervalMax;
            const nextInterval = duelMin + Math.random() * (duelMax - duelMin);
            cannon.nextFireTime = now + nextInterval * 1000;
          } else {
            const baseMin = TuningConfig.cannons.fireIntervalMinSeconds * cadenceMultiplier;
            const baseMax = TuningConfig.cannons.fireIntervalMaxSeconds * cadenceMultiplier;
            const nextInterval = baseMin + Math.random() * (baseMax - baseMin);
            cannon.nextFireTime = now + nextInterval * 1000;
          }
        }
      }
    }
  }

  private updateLasers(dt: number): void {
    for (let i = this.lasers.length - 1; i >= 0; i--) {
      const laser = this.lasers[i];
      if (laser.trajectoryType === 'sine' && !laser.isReflected) {
        laser.sineDist = (laser.sineDist || 0) + (laser.sineSpeed || 175) * dt;
        const forwardDist = laser.sineDist;
        const freq = laser.sineFrequency || 0.032;
        const amp = laser.sineAmplitude || 24;
        const phase = laser.sinePhase || 0;
        const waveOffset = Math.sin(forwardDist * freq + phase) * amp;
        const baseAngle = laser.sineAngle || 0;
        const perpAngle = baseAngle + Math.PI / 2;
        const nextX =
          (laser.sineOriginX || 0) + Math.cos(baseAngle) * forwardDist + Math.cos(perpAngle) * waveOffset;
        const nextY =
          (laser.sineOriginY || 0) + Math.sin(baseAngle) * forwardDist + Math.sin(perpAngle) * waveOffset;
        laser.vx = (nextX - laser.x) / dt;
        laser.vy = (nextY - laser.y) / dt;
        laser.x = nextX;
        laser.y = nextY;
      } else {
        laser.x += laser.vx * dt;
        laser.y += laser.vy * dt;
      }

      // Safeguard Anti-Freeze (LRN-056): Autodissipate any anomalous or near-zero velocity lasers (< 45 px/s)
      const currentSpeed = Math.hypot(laser.vx, laser.vy);
      if (currentSpeed < 45) {
        this.spawnSparks(laser.x, laser.y, 0x00f3ff, 8);
        this.lasers.splice(i, 1);
        continue;
      }

      if (
        laser.x < -60 ||
        laser.x > TuningConfig.arena.width + 60 ||
        laser.y < -60 ||
        laser.y > TuningConfig.arena.height + 60
      ) {
        this.lasers.splice(i, 1);
      }
    }
  }

  private updatePowerups(dt: number): void {
    const cx = TuningConfig.arena.centerX;
    const cy = TuningConfig.arena.centerY;

    if (this.powerups.length > 0) {
      const p = this.powerups[0];
      const secLeft = Math.max(0, p.lifeTimeRemainingMs / 1000).toFixed(1);
      this.powerupLabel
        .setPosition(p.x, p.y - 28)
        .setText(`${p.label} (${secLeft}s)`)
        .setVisible(true);
    } else {
      this.powerupLabel.setVisible(false);
    }

    for (let i = this.powerups.length - 1; i >= 0; i--) {
      const p = this.powerups[i];
      p.lifeTimeRemainingMs -= dt * 1000;
      if (p.lifeTimeRemainingMs <= 0) {
        this.spawnSparks(p.x, p.y, 0x556688, 12);
        this.powerups.splice(i, 1);
        continue;
      }

      // Smooth inward drift towards arena center so it actively approaches
      const dx = cx - p.x;
      const dy = cy - p.y;
      const dist = Math.hypot(dx, dy) || 1;
      p.x += (dx / dist) * TuningConfig.powerups.driftSpeed * dt;
      p.y += (dy / dist) * TuningConfig.powerups.driftSpeed * dt;

      // If it reaches core perimeter, safely absorb
      if (dist <= TuningConfig.arena.coreRadius) {
        this.spawnSparks(p.x, p.y, p.color, 10);
        this.powerups.splice(i, 1);
        continue;
      }

      // Check pickup collision with player blade
      const bladeCfg = TuningConfig.blades[this.selectedBlade as keyof typeof TuningConfig.blades] || TuningConfig.blades.standard;
      const titanBonus = this.activeModifiers.includes('titan_grip') ? 20 : 0;
      const currentBladeLength =
        (this.activePowerup === 'blade_boost'
          ? TuningConfig.blade.boostedLength
          : bladeCfg.length) + titanBonus;
      const halfLen = currentBladeLength / 2;
      const bladeAx = this.bladeX - Math.cos(this.bladeAngle) * halfLen;
      const bladeAy = this.bladeY - Math.sin(this.bladeAngle) * halfLen;
      const bladeBx = this.bladeX + Math.cos(this.bladeAngle) * halfLen;
      const bladeBy = this.bladeY + Math.sin(this.bladeAngle) * halfLen;

      const dBlade = this.distPointToSegment(p.x, p.y, bladeAx, bladeAy, bladeBx, bladeBy);
      if (dBlade <= p.radius + TuningConfig.blade.thickness / 2 + 10) {
        // Heroic Collect Powerup!
        this.applyPowerup(p.type);
        this.spawnSparks(p.x, p.y, p.color, 24);
        this.spawnFloatingScore(p.x, p.y - 20, '⚡ COLETADO!', '#00ffcc');
        this.audioManager.playPowerup();
        this.powerups.splice(i, 1);
        this.updateUI();
        continue;
      }
    }
  }

  private applyPowerup(type: PowerupType): void {
    if (type === 'core_shield') {
      this.hasCoreShield = true;
      this.score += 150;
      this.showPopup(t('powerup_core_shield'), '#33bbff');
    } else if (type === 'blade_boost') {
      this.activePowerup = type;
      this.powerupTimerMs = TuningConfig.powerups.durationMs;
      this.score += 100;
      this.showPopup(t('powerup_blade_boost'), '#00ffcc');
    } else if (type === 'slow_mo') {
      this.activePowerup = type;
      this.powerupTimerMs = TuningConfig.powerups.durationMs;
      this.score += 100;
      this.showPopup(t('powerup_slow_mo'), '#ffaa00');
    } else if (type === 'multi_beam') {
      this.activePowerup = type;
      this.powerupTimerMs = TuningConfig.powerups.durationMs;
      this.score += 100;
      this.showPopup(t('powerup_multi_beam'), '#ff00cc');
    }
  }

  private spawnSparks(x: number, y: number, color: number, count: number): void {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 60 + Math.random() * 160;
      this.sparks.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.25 + Math.random() * 0.15,
        maxLife: 0.4,
        color,
      });
    }
  }

  private checkCollisions(): void {
    const cx = TuningConfig.arena.centerX;
    const cy = TuningConfig.arena.centerY;
    const bladeCfg = TuningConfig.blades[this.selectedBlade as keyof typeof TuningConfig.blades] || TuningConfig.blades.standard;
    const titanBonus = this.activeModifiers.includes('titan_grip') ? 20 : 0;
    const currentBladeLength =
      (this.activePowerup === 'blade_boost'
        ? TuningConfig.blade.boostedLength
        : bladeCfg.length) + titanBonus;
    const halfLen = currentBladeLength / 2;

    const bladeAx = this.bladeX - Math.cos(this.bladeAngle) * halfLen;
    const bladeAy = this.bladeY - Math.sin(this.bladeAngle) * halfLen;
    const bladeBx = this.bladeX + Math.cos(this.bladeAngle) * halfLen;
    const bladeBy = this.bladeY + Math.sin(this.bladeAngle) * halfLen;

    let bladeNx = -Math.sin(this.bladeAngle);
    let bladeNy = Math.cos(this.bladeAngle);
    const toBladeX = this.bladeX - cx;
    const toBladeY = this.bladeY - cy;
    if (bladeNx * toBladeX + bladeNy * toBladeY < 0) {
      bladeNx = -bladeNx;
      bladeNy = -bladeNy;
    }

    for (let i = this.lasers.length - 1; i >= 0; i--) {
      const laser = this.lasers[i];

      // 1. Core Collision
      if (!laser.isReflected) {
        const distToCore = Math.hypot(laser.x - cx, laser.y - cy);
        if (distToCore <= TuningConfig.arena.coreRadius + laser.radius) {
          const isMega = laser.isMegaBeam;
          this.lasers.splice(i, 1);

          // Check if Reactive Core Shield absorbs hit
          if (this.hasCoreShield) {
            this.hasCoreShield = false;
            this.audioManager.playDeflect(true);
            this.spawnSparks(laser.x, laser.y, 0x00ffff, 20);
            this.cameras.main.shake(90, 0.008);
            this.updateUI();
            continue;
          }

          const dmg = isMega ? 2 : 1;
          this.coreHealth = Math.max(0, this.coreHealth - dmg);
          this.comboCount = 0;
          this.isOverloaded = false;
          this.coreDamageFlashTimerMs = 110; // ~100ms flash visual feedback
          this.audioManager.playCoreDamage();
          this.spawnSparks(laser.x, laser.y, 0xff0044, isMega ? 30 : 18);
          this.cameras.main.shake(isMega ? 220 : 150, isMega ? 0.02 : 0.014);
          this.updateUI();

          if (this.coreHealth <= 0) {
            this.handleDefeat();
            return;
          }
          continue;
        }
      }

      // 2. Blade Deflection with Angular Slicing (Player Aiming Agency)
      if (!laser.isReflected) {
        const dLine = this.distPointToSegment(laser.x, laser.y, bladeAx, bladeAy, bladeBx, bladeBy);
        if (dLine <= laser.radius + TuningConfig.blade.thickness / 2 + 5) {
          const isParry = this.parryActiveTimerMs > 0;

          // SPECIAL INTERCEPT: Boss Mega-Beam
          if (laser.isMegaBeam) {
            if (isParry) {
              // EPIC MEGA PARRY: Turn into supercharged green beam towards the boss! (2 DMG)
              this.perfectParriesCount++;
              this.plasmaFragments += TuningConfig.economy.fragmentsPerParry * 3;
              laser.isReflected = true;
              laser.trajectoryType = 'linear';
              laser.vx = -laser.vx * 1.5;
              laser.vy = -laser.vy * 1.5;
              laser.megaDmg = TuningConfig.boss.megaBeamParryDamage;
              this.audioManager.playSuperRicochet();
              this.hitstopTimerMs = 90;
              this.cameras.main.shake(220, 0.02);
              this.spawnSparks(laser.x, laser.y, 0x00ffaa, 30);
              this.showPopup(t('hud_mega_parry'), '#00ffaa');
              this.spawnFloatingScore(this.bladeX, this.bladeY - 30, t('score_mega_parry'), '#00ffaa');
              this.score += 300;
              this.updateUI();
              continue;
            } else {
              // Normal contact reflects beam back to boss with standard 1 DMG
              laser.isReflected = true;
              laser.trajectoryType = 'linear';
              laser.vx = -laser.vx * 1.1;
              laser.vy = -laser.vy * 1.1;
              laser.megaDmg = TuningConfig.boss.megaBeamNormalDamage;
              this.audioManager.playDeflect(false);
              this.hitstopTimerMs = 45;
              this.cameras.main.shake(120, 0.012);
              this.spawnSparks(laser.x, laser.y, 0x00ffff, 20);
              this.showPopup(t('hud_deflect'), '#00e5ff');
              this.score += 100;
              this.updateUI();
              continue;
            }
          }

          // SPECIAL INTERCEPT: Heavy Plasma Shockwave
          if (laser.isHeavy && isParry) {
            // Cleansing shockwave destroys nearby enemy lasers within 95px!
            this.showPopup(t('hud_shockwave_clear'), '#ffaa00');
            this.spawnFloatingScore(this.bladeX, this.bladeY - 25, t('score_shockwave'), '#ffaa00');
            this.cameras.main.shake(110, 0.012);
            for (let j = this.lasers.length - 1; j >= 0; j--) {
              const other = this.lasers[j];
              if (!other.isReflected && other !== laser) {
                const d = Math.hypot(other.x - laser.x, other.y - laser.y);
                if (d <= 95) {
                  this.spawnSparks(other.x, other.y, 0xffaa00, 10);
                  this.lasers.splice(j, 1);
                  this.score += 50;
                }
              }
            }
          }

          laser.isReflected = true;
          laser.trajectoryType = 'linear';
          this.comboCount++;
          this.maxComboSession = Math.max(this.maxComboSession, this.comboCount);
          if (isParry) {
            this.perfectParriesCount++;
            this.progressQuest('parry', 1);
            this.spawnFlyingFragment(laser.x, laser.y, TuningConfig.economy.fragmentsPerParry, 0xffea00);
          } else {
            this.progressQuest('deflect', 1);
            this.spawnFlyingFragment(laser.x, laser.y, TuningConfig.economy.fragmentsPerDeflect, 0x00f3ff);
          }
          this.progressQuest('streak', this.comboCount);
          this.score += 25 * this.comboCount;

          // MODIFICADOR CRYO PARRY: Parry congela projéteis próximos em 50% por 1.5s
          if (isParry && this.activeModifiers.includes('cryo_parry')) {
            for (const otherL of this.lasers) {
              if (!otherL.isReflected && Math.hypot(otherL.x - laser.x, otherL.y - laser.y) < 130) {
                otherL.vx *= 0.5;
                otherL.vy *= 0.5;
                this.spawnSparks(otherL.x, otherL.y, 0x00ffcc, 5);
              }
            }
          }

          // MODIFICADOR SPARK RICOCHET: Ricochete dispara faísca teleguiada extra
          if (this.activeModifiers.includes('spark_ricochet')) {
            const nearestCannon = this.findNearestAliveCannon(laser.x, laser.y);
            if (nearestCannon) {
              const spkAngle = Math.atan2(nearestCannon.y - laser.y, nearestCannon.x - laser.x);
              this.lasers.push({
                x: laser.x,
                y: laser.y,
                vx: Math.cos(spkAngle) * 360,
                vy: Math.sin(spkAngle) * 360,
                radius: 5,
                isReflected: true,
                isOverloadShard: true,
                sourceCannonId: -1,
              });
            }
          }

          // Spawn particle sparks at impact point
          this.spawnSparks(laser.x, laser.y, isParry ? 0xffea00 : 0x00ffff, isParry ? 16 : 8);

          // Moments of Mastery: Audiovisual streak milestones
          if (this.comboCount === 3) {
            this.audioManager.playStreakTier(3);
            this.showPopup(getLang() === 'en' ? '★ 3x STREAK! FAST REFLEX! ★' : '★ 3x STREAK! REFLEXO RÁPIDO! ★', '#00ffcc');
            this.spawnFloatingScore(this.bladeX, this.bladeY - 25, '★ 3x STREAK!', '#00ffcc');
          } else if (this.comboCount === 5) {
            this.audioManager.playStreakTier(5);
            this.showPopup(getLang() === 'en' ? '★★ 5x STREAK! UNSTOPPABLE! ★★' : '★★ 5x STREAK! INSUPERÁVEL! ★★', '#ffea00');
            this.spawnFloatingScore(this.bladeX, this.bladeY - 25, getLang() === 'en' ? '★★ 5x UNSTOPPABLE!' : '★★ 5x INSUPERÁVEL!', '#ffea00');
            this.hitstopTimerMs = 45;
            this.cameras.main.shake(80, 0.01);
          } else if (this.comboCount === 8) {
            this.audioManager.playStreakTier(8);
            this.showPopup(getLang() === 'en' ? '★★★ 8x STREAK! ABSOLUTE DOMINION! ★★★' : '★★★ 8x STREAK! DOMÍNIO ABSOLUTO! ★★★', '#ff00ff');
            this.spawnFloatingScore(this.bladeX, this.bladeY - 25, '★★★ GODLIKE!', '#ff00ff');
            this.hitstopTimerMs = 70;
            this.cameras.main.shake(140, 0.016);
          }

          const wasOverloaded = this.isOverloaded;

          if (wasOverloaded) {
            this.isOverloaded = false;
            this.comboCount = 0;
            this.audioManager.playSuperRicochet();
            this.cameras.main.shake(160, 0.016);
            this.cameras.main.zoom = 1.05;
            this.tweens.add({
              targets: this.cameras.main,
              zoom: 1.0,
              duration: 250,
              ease: 'Quad.easeOut',
            });
            this.hitstopTimerMs = 50;

            this.lasers.splice(i, 1);
            this.spawnOverloadSplitters(laser.x, laser.y, bladeNx, bladeNy);
            this.updateUI();
            continue;
          } else {
            const overloadThreshold = this.activeModifiers.includes('rapid_overload') ? 2 : TuningConfig.combo.overloadThreshold;
            if (this.comboCount >= overloadThreshold && !this.isOverloaded) {
              this.isOverloaded = true;
              this.audioManager.playOverloadReady();
            }

            // Standard specular reflection
            const dot = laser.vx * bladeNx + laser.vy * bladeNy;
            let rx = laser.vx - 2 * dot * bladeNx;
            let ry = laser.vy - 2 * dot * bladeNy;

            // ANGULAR SLICING (Solução 1A: Agência ofensiva sem Aim Line permanente)
            // O ponto de impacto ao longo da lâmina confere autoridade direcional de até ±55°
            const bladeDx = Math.cos(this.bladeAngle);
            const bladeDy = Math.sin(this.bladeAngle);
            const offsetAlongBlade =
              (laser.x - this.bladeX) * bladeDx + (laser.y - this.bladeY) * bladeDy;
            const sliceFactor = Math.max(-1, Math.min(1, offsetAlongBlade / halfLen));
            const sliceAngle = sliceFactor * TuningConfig.blade.slicingAngleMax;

            const cosS = Math.cos(sliceAngle);
            const sinS = Math.sin(sliceAngle);
            const slicedRx = rx * cosS - ry * sinS;
            const slicedRy = rx * sinS + ry * cosS;
            rx = slicedRx;
            ry = slicedRy;

            // Subtle magnetic homing assist with smooth angular difference wrap
            const bestCannon = this.findNearestAliveCannon(laser.x, laser.y);
            if (this.nemesis.active && (laser.fromNemesis || (laser.rally !== undefined && laser.rally > 0) || !bestCannon)) {
              const toNemesis = Math.atan2(this.nemesis.y - laser.y, this.nemesis.x - laser.x);
              const curA = Math.atan2(ry, rx);
              let diff = toNemesis - curA;
              diff = Math.atan2(Math.sin(diff), Math.cos(diff));
              const newA = curA + diff * (TuningConfig.blade.homingAssistance * 1.5);
              const mag = Math.hypot(rx, ry);
              rx = Math.cos(newA) * mag;
              ry = Math.sin(newA) * mag;
            } else if (bestCannon) {
              const toTargetAngle = Math.atan2(bestCannon.y - laser.y, bestCannon.x - laser.x);
              const currentAngle = Math.atan2(ry, rx);
              let angleDiff = toTargetAngle - currentAngle;
              angleDiff = Math.atan2(Math.sin(angleDiff), Math.cos(angleDiff));
              const newAngle = currentAngle + angleDiff * TuningConfig.blade.homingAssistance;
              const curMag = Math.hypot(rx, ry);
              rx = Math.cos(newAngle) * curMag;
              ry = Math.sin(newAngle) * curMag;
            }

            const currentSpeed = Math.hypot(rx, ry) || 1;
            const isRallyBolt = this.nemesis.active && (laser.fromNemesis || (laser.rally !== undefined && laser.rally > 0));
            let targetSpeed: number;
            if (isRallyBolt) {
              laser.rally = (laser.rally || 0) + 1;
              laser.rallyLock = 2;
              targetSpeed = Math.min(
                TuningConfig.nemesis.rallyMaxSpeed,
                Math.max(300, currentSpeed) * TuningConfig.nemesis.rallySpeedStep
              );
              this.onRallyExchange(laser.rally, laser.x, laser.y, true);
            } else {
              targetSpeed = Math.min(
                TuningConfig.laser.maxSpeed,
                (TuningConfig.laser.initialSpeed + (this.currentWave - 1) * 8) *
                  (isParry ? 1.8 : TuningConfig.blade.deflectBoostMultiplier)
              );
            }
            laser.vx = (rx / currentSpeed) * targetSpeed;
            laser.vy = (ry / currentSpeed) * targetSpeed;

            // Micro-vetor neon de feedback transitório de 160ms (sem poluição permanente)
            const rNorm = Math.hypot(rx, ry) || 1;
            this.deflectVectors.push({
              startX: laser.x,
              startY: laser.y,
              dirX: rx / rNorm,
              dirY: ry / rNorm,
              life: 0.16,
              maxLife: 0.16,
              color: isParry ? 0xffea00 : 0x00ffcc,
            });

            // Faíscas direcionais de alta velocidade na rota do ricochete
            for (let k = 0; k < 6; k++) {
              const sparkSpread = (Math.random() - 0.5) * 0.4;
              const sAngle = Math.atan2(laser.vy, laser.vx) + sparkSpread;
              const spd = 120 + Math.random() * 180;
              this.sparks.push({
                x: laser.x,
                y: laser.y,
                vx: Math.cos(sAngle) * spd,
                vy: Math.sin(sAngle) * spd,
                life: 0.18 + Math.random() * 0.12,
                maxLife: 0.3,
                color: isParry ? 0xffffaa : 0x88ffff,
              });
            }

            // MULTI-BEAM (Arkanoid Multi-ball): Spawns 2 extra side lasers!
            if (this.activePowerup === 'multi_beam') {
              const currentDeflectSpeed = Math.hypot(laser.vx, laser.vy);
              const angle = Math.atan2(laser.vy, laser.vx);
              for (const off of [-0.35, 0.35]) {
                const sideAngle = angle + off;
                this.lasers.push({
                  x: laser.x,
                  y: laser.y,
                  vx: Math.cos(sideAngle) * currentDeflectSpeed,
                  vy: Math.sin(sideAngle) * currentDeflectSpeed,
                  radius: laser.radius,
                  isReflected: true,
                  isOverloadShard: false,
                  sourceCannonId: -1,
                });
              }
              this.spawnFloatingScore(laser.x, laser.y - 15, '🔱 MULTI!', '#ff00cc');
            }

            this.audioManager.playDeflect(isParry, this.comboCount);
            this.hitstopTimerMs = isParry ? 45 : 20;
            this.cameras.main.shake(isParry ? 90 : 40, isParry ? 0.008 : 0.004);

            // FTUE: Telemetry & In-Game Educational Feedback
            if (!this.ftueFirstRicochetDone) {
              this.ftueFirstRicochetDone = true;
              this.recordMetric('first_ricochet', { wave: this.currentWave, isParry });
              if (this.currentWave === 1 && !isParry) {
                // Flash subtle cue showing parry opportunity for 500ms
                this.parryCueTimerMs = TuningConfig.ftue.parryHintDurationMs;
              }
            }
            if (isParry && !this.ftueFirstParryDone) {
              this.ftueFirstParryDone = true;
              this.recordMetric('first_parry', { wave: this.currentWave, combo: this.comboCount });
            }
            if (Math.abs(sliceFactor) > 0.45 && !this.ftueFirstAggressiveDone) {
              this.ftueFirstAggressiveDone = true;
              this.recordMetric('first_aggressive_return', { sliceFactor, sliceAngle });
              if (!isParry) {
                this.showPopup(t('hud_angular_slicing_cue'), '#00f3ff');
              }
            }

            if (isParry) {
              this.showPopup(t('score_parry'), '#ffff00');
              this.spawnFloatingScore(this.bladeX, this.bladeY - 20, t('score_parry'), '#ffff00');
            }
            this.updateUI();
            continue;
          }
        }
      }

      // 3. Collision with Shadow Deflector (Nemesis Blade & Hull) — LRN-054
      if (laser.isReflected && this.nemesis.active) {
        if (laser.rallyLock && laser.rallyLock > 0) {
          laser.rallyLock--;
        } else {
          const isLethal = (laser.rally || 0) >= TuningConfig.nemesis.rallyLethalTier;

          // Check collision with Nemesis Scythe Blade (if not in recover state)
          if (this.nemesis.state !== 'recover') {
            const ends = this.nemesisEnds();
            const dBlade = this.distPointToSegment(laser.x, laser.y, ends.ax, ends.ay, ends.bx, ends.by);
            if (dBlade <= laser.radius + TuningConfig.nemesis.bladeThickness / 2 + 8) {
              if (isLethal) {
                // CLASH BREAK (Option A): Lethal bolt (Tier 3+) overpowers and shatters the Nemesis scythe guard!
                this.hitNemesis(laser, performance.now());
                continue;
              }

              const segLen = Math.hypot(ends.bx - ends.ax, ends.by - ends.ay) || 1;
              const t = Phaser.Math.Clamp(
                ((laser.x - ends.ax) * (ends.bx - ends.ax) + (laser.y - ends.ay) * (ends.by - ends.ay)) / (segLen * segLen),
                0,
                1
              );
              this.nemesisReturn(laser, t, performance.now());
              continue;
            }
          }

          // Check collision with Nemesis Chassis Hull
          const distToNemesis = Math.hypot(laser.x - this.nemesis.x, laser.y - this.nemesis.y);
          if (distToNemesis <= laser.radius + 32) {
            this.hitNemesis(laser, performance.now());
            continue;
          }
        }
      }

      // 4. Reflected Laser Collision with Cannons
      if (laser.isReflected) {
        for (const cannon of this.cannons) {
          if (cannon.isDestroyed) continue;

          const hitRadius = (cannon.radius || TuningConfig.cannons.radius) + laser.radius + 6;
          const distToCannon = Math.hypot(laser.x - cannon.x, laser.y - cannon.y);
          if (distToCannon <= hitRadius) {
            // BOSS SHIELD MECHANIC
            if (cannon.type === 'boss' && cannon.bossPhase === 'barrage') {
              this.lasers.splice(i, 1);
              cannon.shieldHp = Math.max(0, (cannon.shieldHp ?? 3) - 1);
              this.spawnSparks(laser.x, laser.y, 0x00e1ff, 22);
              this.cameras.main.shake(70, 0.008);

              if (cannon.shieldHp <= 0) {
                this.audioManager.playShieldBreak();
                this.audioManager.playSuperRicochet();
                this.spawnFloatingScore(cannon.x, cannon.y - 32, '💥 ESCUDO DESTRUÍDO!', '#ffff00');
                cannon.bossPhaseTimerMs = 0; // Triggers immediate switch to vulnerable!
              } else {
                this.audioManager.playShieldRicochet();
                this.spawnFloatingScore(
                  cannon.x,
                  cannon.y - 32,
                  `🛡️ ESCUDO: ${cannon.shieldHp}/${cannon.maxShieldHp || 3}!`,
                  '#00e1ff'
                );
              }
              this.updateUI();
              break;
            }

            this.lasers.splice(i, 1);
            const dmg = laser.isMegaBeam ? (laser.megaDmg || 1) : 1;
            cannon.hp -= dmg;
            cannon.hitFlashTimerMs = 140;
            this.spawnSparks(cannon.x, cannon.y, 0xffaa00, cannon.type === 'boss' ? 26 : 14);

            if (cannon.hp <= 0) {
              cannon.isDestroyed = true;

              // Dramatic 300ms destruction burst: expanding shockwave + metallic shrapnel debris
              this.shockwaves.push({
                x: cannon.x,
                y: cannon.y,
                currentRadius: 8,
                maxRadius: cannon.type === 'boss' ? 130 : 60,
                color: cannon.type === 'boss' ? 0xff0055 : cannon.color || 0x00f3ff,
                life: 0.3,
                maxLife: 0.3,
              });

              const debrisCount = cannon.type === 'boss' ? 24 : 12;
              for (let k = 0; k < debrisCount; k++) {
                const a = Math.random() * Math.PI * 2;
                const spd = 70 + Math.random() * 190;
                this.debris.push({
                  x: cannon.x,
                  y: cannon.y,
                  vx: Math.cos(a) * spd,
                  vy: Math.sin(a) * spd,
                  rotation: Math.random() * Math.PI * 2,
                  vRot: (Math.random() - 0.5) * 16,
                  size: 3 + Math.random() * 5,
                  color: Math.random() > 0.4 ? 0x222c3d : cannon.color || 0x00f3ff,
                  life: 0.3,
                  maxLife: 0.3,
                });
              }

              let pts = 150;
              if (cannon.type === 'boss') pts = 1500;
              else if (cannon.type === 'heavy') pts = 250;
              else if (cannon.type === 'sniper') pts = 200;
              else if (cannon.type === 'scatter') pts = 180;

              this.score += pts;
              this.spawnFloatingScore(
                cannon.x,
                cannon.y - 20,
                `+${pts}`,
                cannon.type === 'boss' ? '#ff0055' : '#00ffcc'
              );

              // Spawn Flying Fragment (5 para drones comuns, 50 para Boss)
              const fragVal = cannon.type === 'boss' ? TuningConfig.economy.fragmentsPerBoss : 5;
              this.spawnFlyingFragment(cannon.x, cannon.y, fragVal, cannon.type === 'boss' ? 0xff0055 : 0x00ffcc);
              if (cannon.type === 'sniper') {
                this.progressQuest('destroy_sniper', 1);
              }

              this.audioManager.playExplosion(cannon.type);
              this.cameras.main.shake(
                cannon.type === 'boss' ? 300 : 160,
                cannon.type === 'boss' ? 0.026 : 0.016
              );

              if (cannon.type === 'boss') {
                this.bossesDefeatedCount++;
                this.coreHealth = TuningConfig.arena.coreMaxHealth;
                this.spawnFloatingScore(cannon.x, cannon.y - 45, `+${TuningConfig.economy.fragmentsPerBoss} 💎`, '#00ffcc');
                this.audioManager.playBossVictoryStinger();
                this.audioManager.setBgmMode('regular');
                this.recordMetric('boss_defeated', { wave: this.currentWave, bossesTotal: this.bossesDefeatedCount });
                this.showPopup(t('hud_boss_cleared'), '#ff0055');
              }
              this.maybeSpawnPowerup(cannon.x, cannon.y);
            } else {
              if (laser.isMegaBeam) {
                this.score += 300;
                this.spawnFloatingScore(cannon.x, cannon.y - 20, getLang() === 'en' ? '★ CRITICAL -3 HP! ★' : '★ CRÍTICO -3 HP! ★', '#ff0055');
                this.audioManager.playSuperRicochet();
                this.cameras.main.shake(250, 0.02);
                this.hitstopTimerMs = 90;
              } else {
                this.score += 75;
                this.spawnFloatingScore(cannon.x, cannon.y - 15, '-1 HP', '#ffcc00');
                this.audioManager.playDeflect(true);
                this.cameras.main.shake(80, 0.008);
              }
            }

            this.updateUI();

            const remaining = this.cannons.filter(c => !c.isDestroyed).length;
            if (remaining === 0 && !this.nemesis.active && !this.waveTransitioning) {
              this.handleWaveClear();
              return;
            }
            break;
          }
        }
      }
    }
  }

  private maybeSpawnPowerup(x: number, y: number): void {
    if (this.powerups.length >= TuningConfig.powerups.maxSimultaneous) return;
    if (Math.random() <= TuningConfig.powerups.dropChance) {
      const types: PowerupType[] = ['blade_boost', 'core_shield', 'slow_mo', 'multi_beam'];
      const chosen = types[Math.floor(Math.random() * types.length)];
      const colors: Record<PowerupType, number> = {
        blade_boost: 0x00ffcc,
        core_shield: 0x3399ff,
        slow_mo: 0xffaa00,
        multi_beam: 0xff00cc,
      };
      const isEn = getLang() === 'en';
      const labels: Record<PowerupType, string> = {
        blade_boost: isEn ? '⚡ LONG BLADE' : '⚡ LÂMINA LONGA',
        core_shield: isEn ? '🛡️ SHIELD' : '🛡️ ESCUDO',
        slow_mo: isEn ? '⏱️ BULLET-TIME' : '⏱️ BULLET-TIME',
        multi_beam: isEn ? '🔱 MULTI-LASER' : '🔱 MULTI-LASER',
      };

      const cx = TuningConfig.arena.centerX;
      const cy = TuningConfig.arena.centerY;
      const angle = Math.atan2(y - cy, x - cx);
      const orbitRadius = TuningConfig.powerups.spawnOrbitRadius;
      const px = cx + Math.cos(angle) * orbitRadius;
      const py = cy + Math.sin(angle) * orbitRadius;

      this.powerups.push({
        id: this.nextPowerupId++,
        x: px,
        y: py,
        type: chosen,
        radius: 15,
        color: colors[chosen],
        label: labels[chosen],
        orbitAngle: angle,
        orbitRadius,
        lifeTimeRemainingMs: TuningConfig.powerups.lifetimeMs,
        maxLifeTimeMs: TuningConfig.powerups.lifetimeMs,
      });

      this.showPopup(
        isEn
          ? `⚡ CAPSULE DETECTED: ${labels[chosen]}!\n[RISK: INTERCEPT BEFORE EXPIRING]`
          : `⚡ CÁPSULA NA BORDA: ${labels[chosen]}!\n[RISCO: BUSQUE NA BORDA ANTES DE EXPIRAR]`,
        '#00e1ff'
      );
    }
  }

  private spawnOverloadSplitters(x: number, y: number, nx: number, ny: number): void {
    const baseAngle = Math.atan2(ny, nx);
    const spreadAngles = [-0.44, 0, 0.44];
    const speed = TuningConfig.laser.maxSpeed * 0.95;

    for (const offset of spreadAngles) {
      const angle = baseAngle + offset;
      let vx = Math.cos(angle) * speed;
      let vy = Math.sin(angle) * speed;

      const targetCannon = this.findNearestAliveCannon(x, y);
      if (targetCannon) {
        const toTargetX = targetCannon.x - x;
        const toTargetY = targetCannon.y - y;
        const dist = Math.hypot(toTargetX, toTargetY) || 1;
        vx = (toTargetX / dist) * speed * 0.6 + vx * 0.4;
        vy = (toTargetY / dist) * speed * 0.6 + vy * 0.4;
      }

      this.lasers.push({
        x,
        y,
        vx,
        vy,
        radius: TuningConfig.laser.radius + 1,
        isReflected: true,
        isOverloadShard: true,
        sourceCannonId: -1,
      });
    }
  }

  private findNearestAliveCannon(x: number, y: number): Cannon | null {
    let bestCannon: Cannon | null = null;
    let bestDist = Infinity;
    for (const c of this.cannons) {
      if (!c.isDestroyed) {
        const d = Math.hypot(c.x - x, c.y - y);
        if (d < bestDist) {
          bestDist = d;
          bestCannon = c;
        }
      }
    }
    return bestCannon;
  }

  private distPointToSegment(px: number, py: number, ax: number, ay: number, bx: number, by: number): number {
    const l2 = (bx - ax) * (bx - ax) + (by - ay) * (by - ay);
    if (l2 === 0) return Math.hypot(px - ax, py - ay);
    let t = ((px - ax) * (bx - ax) + (py - ay) * (by - ay)) / l2;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(px - (ax + t * (bx - ax)), py - (ay + t * (by - ay)));
  }

  private handleWaveClear(): void {
    this.waveTransitioning = true;
    const cx = TuningConfig.arena.centerX;
    const cy = TuningConfig.arena.centerY;

    // Cleanly absorb any lingering powerups on wave end into the core with bonus score!
    if (this.powerups.length > 0) {
      for (const p of this.powerups) {
        this.score += 100;
        this.spawnSparks(cx, cy, p.color, 20);
        this.spawnFloatingScore(cx, cy - 25, getLang() === 'en' ? '+100 ENERGY BONUS!' : '+100 BÔNUS ENERGIA!', '#00ffcc');
      }
      this.audioManager.playAbsorb();
      this.powerups = [];
      this.powerupLabel.setVisible(false);
    }

    this.score += 200 * this.currentWave;
    this.spawnFlyingFragment(cx, cy, TuningConfig.economy.fragmentsPerWave, 0x00ffcc);
    this.coreHealth = Math.min(TuningConfig.arena.coreMaxHealth, this.coreHealth + TuningConfig.waves.healthBonusPerWave);

    if (this.currentWave === 1) {
      this.recordMetric('wave_1_completed');
    }

    this.audioManager.playWaveClear();
    this.lasers = this.lasers.filter(l => l.isReflected);

    const isBoss = this.currentWave % TuningConfig.boss.bossIntervalWaves === 0;
    const waveClearMsg = isBoss
      ? (getLang() === 'en'
          ? `★★★ DREADNOUGHT DESTROYED! ★★★\nREPAIR (+1 ♥) | +${TuningConfig.economy.fragmentsPerWave} 💎`
          : `★★★ DREADNOUGHT DESTRUÍDO! ★★★\nREPARO (+1 ♥) | +${TuningConfig.economy.fragmentsPerWave} 💎`)
      : (getLang() === 'en'
          ? `WAVE ${this.currentWave} CLEARED!\nREPAIR (+1 ♥) | +${TuningConfig.economy.fragmentsPerWave} 💎`
          : `FASE ${this.currentWave} CONCLUÍDA!\nREPARO (+1 ♥) | +${TuningConfig.economy.fragmentsPerWave} 💎`);

    this.bannerText
      .setText(waveClearMsg)
      .setColor('#00ffaa')
      .setVisible(true);

    this.updateUI();

    this.time.delayedCall(1500, () => {
      this.bannerText.setVisible(false);
      const nextW = this.currentWave + 1;

      const proceed = () => {
        if (this.currentWave % TuningConfig.miniRogue.waveInterval === 0) {
          this.openMiniRogueSelection(nextW);
        } else {
          this.currentWave = nextW;
          this.waveTransitioning = false;
          this.setupWave(this.currentWave);
        }
      };

      // Poki SDK: Commercial break pacing valley after Boss wave victory (Waves 5, 10, 15...)
      if (isBoss) {
        PokiService.showCommercial(
          () => {
            this.audioManager.muteForAd();
            this.disableGameplayInput();
          },
          () => {
            this.enableGameplayInput();
            this.audioManager.unmuteAfterAd();
            PokiService.gameplayStart();
            proceed();
          }
        );
      } else {
        proceed();
      }
    });
  }

  private handleDefeat(): void {
    this.isRoundActive = false;
    this.restartAllowed = false;
    this.powerupLabel.setVisible(false);
    this.audioManager.stopAmbientHum();
    PokiService.gameplayStop();

    const saved = this.loadStats();
    this.isNewHighScore = this.score > saved.highScore;
    const newStats: GameStats = {
      highScore: Math.max(saved.highScore, this.score),
      highestWave: Math.max(saved.highestWave, this.currentWave),
      highestCombo: Math.max(saved.highestCombo, this.maxComboSession),
      totalParries: saved.totalParries + this.perfectParriesCount,
      bossesDefeated: saved.bossesDefeated + this.bossesDefeatedCount,
      plasmaFragments: this.plasmaFragments,
      unlockedBlades: this.unlockedBlades,
      selectedBlade: this.selectedBlade,
    };
    this.saveStats(newStats);

    if (this.isNewHighScore) {
      this.recordMetric('new_high_score', { score: this.score, prevHighScore: saved.highScore });
    }
    this.recordMetric('game_over', {
      score: this.score,
      wave: this.currentWave,
      combo: this.maxComboSession,
      parries: this.perfectParriesCount,
      bosses: this.bossesDefeatedCount,
      fragments: this.plasmaFragments,
    });

    const cx = TuningConfig.arena.centerX;
    this.gameOverTitle.setText(t('game_over_title')).setVisible(true);
    if (this.isNewHighScore) {
      this.gameOverTitle.setPosition(cx, 89);
      this.gameOverRecordBanner.setText(t('game_over_new_record')).setPosition(cx, 121).setVisible(true);
      this.gameOverStatsText.setPosition(cx, 150);
    } else {
      this.gameOverTitle.setPosition(cx, 95);
      this.gameOverRecordBanner.setVisible(false);
      this.gameOverStatsText.setPosition(cx, 126);
    }

    const isEn = getLang() === 'en';
    const headerLine = isEn
      ? '── CURRENT RUN ────────────── ALL-TIME BEST ──'
      : '── SESSÃO ATUAL ───────────── RECORDE HISTÓRICO ──';
    const scoreLine = isEn
      ? `Score: ${this.score.toString().padEnd(17)} Best: ${newStats.highScore}`
      : `Pontos: ${this.score.toString().padEnd(16)} Recorde: ${newStats.highScore}`;
    const waveLine = isEn
      ? `Wave: ${this.currentWave.toString().padEnd(18)} Best Wave: ${newStats.highestWave}`
      : `Fase: ${this.currentWave.toString().padEnd(18)} Melhor Fase: ${newStats.highestWave}`;
    const comboLine = isEn
      ? `Max Combo: ${this.maxComboSession.toString().padEnd(13)} Total Parries: ${newStats.totalParries}`
      : `Combo Máx: ${this.maxComboSession.toString().padEnd(13)} Total Parries: ${newStats.totalParries}`;
    const bossLine = isEn
      ? `Bosses Defeated: ${this.bossesDefeatedCount.toString().padEnd(6)} Total Bosses: ${newStats.bossesDefeated}`
      : `Chefões Derrotados: ${this.bossesDefeatedCount.toString().padEnd(6)} Total Chefões: ${newStats.bossesDefeated}`;
    const fragLine = isEn
      ? `💎 Plasma Fragments: ${this.plasmaFragments}`
      : `💎 Fragmentos de Plasma: ${this.plasmaFragments}`;

    this.gameOverStatsText.setText([
      headerLine,
      scoreLine,
      waveLine,
      comboLine,
      bossLine,
      fragLine,
    ]).setVisible(true);

    this.coreHudText.setVisible(false);
    this.uiText.setVisible(false);
    this.statusText.setText('');
    if (this.questHudText) this.questHudText.setVisible(false);

    if (this.canReviveThisSession) {
      this.reviveButton.setPosition(cx, 301).setVisible(true);
      this.restartButton.setPosition(cx, 349).setVisible(true);
      this.restartHintText.setPosition(cx, 395).setVisible(true);
    } else {
      this.reviveButton.setVisible(false);
      this.restartButton.setPosition(cx, 315).setVisible(true);
      this.restartHintText.setPosition(cx, 365).setVisible(true);
    }

    this.render();

    window.setTimeout(() => {
      this.restartAllowed = true;
    }, 350);
  }


  private render(): void {
    const g = this.graphics;
    g.clear();

    const cx = TuningConfig.arena.centerX;
    const cy = TuningConfig.arena.centerY;
    const width = TuningConfig.arena.width;
    const height = TuningConfig.arena.height;
    const now = performance.now();

    // Fundo Estelar e Nebulosa Cósmica já pré-assados no ArenaRenderer com 0ms de custo de draw
    // Cinturão Periférico de Asteroides Facetados (Profundidade Espacial 3D)
    HudRenderer.renderAsteroids(g, this.asteroids, cx, cy);

    // 2. Grade Cibernética e Cantoneiras de Arcade
    HudRenderer.renderGridAndFraming(g, width, height, cx, cy);

    // 3. Ticks de Navegação na Órbita
    HudRenderer.renderNavigationTicks(g, cx, cy);

    // 4. Ondas de Choque, Estilhaços e Fragmentos Voadores
    EffectsRenderer.renderShockwaves(g, this.shockwaves);
    EffectsRenderer.renderDebris(g, this.debris);
    EffectsRenderer.renderFlyingFragments(g, this.flyingFragments);

    // 5. Reator Quântico Volumétrico
    CoreRenderer.render(
      g,
      cx,
      cy,
      now,
      this.coreHealth,
      this.coreDamageFlashTimerMs,
      this.hasCoreShield,
      this.sparks,
      this.isRoundActive
    );

    // 6. Cápsulas e Orbes de Power-Up
    EffectsRenderer.renderPowerups(g, this.powerups, now);

    // 7. Naves de Combate Inimigas por Silhueta Militar
    CannonRenderer.render(g, this.cannons, cx, cy, now);

    // 7.1 Shadow Deflector (Nemesis Duel) & Rally Link Telemetry (LRN-054)
    if (this.nemesis.active) {
      CannonRenderer.renderNemesis(g, this.nemesis, cx, cy, now * 0.001);
      const activeRallyTier = this.currentRallyTier();
      if (activeRallyTier > 0) {
        CannonRenderer.drawRallyLink(g, this.bladeX, this.bladeY, this.nemesis.x, this.nemesis.y, activeRallyTier, now * 0.001);
        HudRenderer.renderRallyGauge(g, activeRallyTier, cx, cy, now);
      }
    }

    // 8. Centelhas e Micro-Vetores de Deflexão
    EffectsRenderer.renderSparks(g, this.sparks);
    EffectsRenderer.renderDeflectVectors(g, this.deflectVectors);

    // 9. Projéteis de Plasma e Caudas em Cometa
    LaserRenderer.render(g, this.lasers, now);

    // 10. Lâmina Curva Crescente de Plasma
    if (this.isRoundActive) {
      const titanBonus = this.activeModifiers.includes('titan_grip') ? 20 : 0;
      BladeRenderer.render(
        g,
        cx,
        cy,
        this.bladeX,
        this.bladeY,
        now,
        this.activePowerup,
        this.isOverloaded,
        this.parryActiveTimerMs,
        this.bladeTrail,
        this.selectedBlade,
        titanBonus
      );

      // FTUE Prompt: Wave 1 idle movement prompt & parry opportunity cue
      const showMoveCue = this.currentWave === 1 && !this.hasMovedBlade && this.ftueHintShown;
      const showParryCue = this.parryCueTimerMs > 0;
      if (showMoveCue || showParryCue) {
        HudRenderer.renderFtuePrompt(
          g,
          cx,
          cy,
          this.bladeX,
          this.bladeY,
          now,
          showMoveCue,
          showParryCue
        );
      }
    }

    // 11. Clarão de Dano Crítico Fullscreen
    EffectsRenderer.renderFullscreenDamageFlash(g, this.coreDamageFlashTimerMs);

    // Boss Warning Entrance Pulse (Red & Gold lighting aura across arena perimeter)
    if (this.bossWarningTimerMs > 0) {
      const bRatio = this.bossWarningTimerMs / 1500;
      const bPulse = 0.5 + 0.5 * Math.sin(now * 0.015);
      g.lineStyle(4, 0xff0055, bRatio * bPulse * 0.85);
      g.strokeCircle(cx, cy, TuningConfig.cannons.distanceFromCenter + 35);
      g.lineStyle(2, 0xffea00, bRatio * bPulse * 0.6);
      g.strokeCircle(cx, cy, TuningConfig.cannons.distanceFromCenter - 25);
    }

    // 12. Cartões de Vidro Fosco Táticos (Game Over / Pause / Start / Help / Patch Notes / Mini-Rogue)
    if (this.isMiniRogueOpen) {
      const timeRatio = Math.max(0, this.miniRogueTimerMs / TuningConfig.miniRogue.autoSelectTimeoutMs);
      HudRenderer.renderMiniRogueCards(g, cx, cy, width, height, this.miniRogueCards, timeRatio);
    } else if (this.isPatchNotesOpen) {
      HudRenderer.renderPatchNotesCard(g, cx, cy, width, height);
    } else if (this.isHelpOpen) {
      HudRenderer.renderHelpCard(g, cx, cy, width, height);
    } else if (!this.isRoundActive && this.coreHealth <= 0) {
      HudRenderer.renderGameOverCard(g, cx, cy, this.isNewHighScore, this.canReviveThisSession);
    } else if (this.isPaused) {
      HudRenderer.renderPauseCard(g, cx, cy, width, height);
    } else if (!this.isRoundActive && this.coreHealth > 0 && !this.restartAllowed) {
      HudRenderer.renderStartCard(g, cx, cy);
    }

    // 13. Controles Táteis Mobile Dual-Thumb (Joystick Flutuante + Botão Neon de Parry)
    const showMobileParry = this.isTouchDevice && this.isRoundActive && !this.isPaused && !this.isHelpOpen && !this.isPatchNotesOpen && !this.isMiniRogueOpen;
    HudRenderer.renderMobileControls(
      g,
      this.isJoystickActive,
      this.joystickOriginX,
      this.joystickOriginY,
      this.joystickCurrentX,
      this.joystickCurrentY,
      showMobileParry,
      this.parryBtnX,
      this.parryBtnY,
      this.parryBtnRadius,
      this.isParryBtnPressed
    );
  }

  // ---------------------------------------------------------------------------
  // Hangar de Lâminas / Meta-Game Helpers
  // ---------------------------------------------------------------------------
  private buildHangarButtons(): void {
    const cx = TuningConfig.arena.centerX;
    const bladeEntries = Object.entries(TuningConfig.blades);
    const count = bladeEntries.length;
    const spacing = 156;
    const startX = cx - ((count - 1) * spacing) / 2;

    this.bladeButtons = bladeEntries.map(([id, cfg], index) => {
      const btn = this.add.text(startX + index * spacing, 190, '', {
        fontFamily: "'Orbitron', monospace",
        fontSize: '11px',
        fontStyle: 'bold',
        align: 'center',
        backgroundColor: '#0c1626',
        padding: { x: 8, y: 6 },
      })
      .setOrigin(0.5)
      .setDepth(10)
      .setInteractive({ useHandCursor: true });

      btn.on('pointerdown', () => {
        if (!this.isRoundActive && !this.isShowingAd) {
          this.handleBladeButtonClick(id);
        }
      });

      btn.on('pointerover', () => {
        btn.setBackgroundColor('#16253d');
      });

      btn.on('pointerout', () => {
        btn.setBackgroundColor('#0c1626');
      });

      return btn;
    });
  }

  private updateHangarUI(): void {
    if (this.fragmentsTitleText) {
      this.fragmentsTitleText.setText(t('wallet_fragments', { count: this.plasmaFragments }));
    }

    const bladeEntries = Object.entries(TuningConfig.blades);
    bladeEntries.forEach(([id, cfg], index) => {
      const btn = this.bladeButtons[index];
      if (!btn) return;

      const isEquipped = this.selectedBlade === id;
      const isUnlocked = this.unlockedBlades.includes(id);
      const bladeName = t(`blade_${id}_name`) || cfg.name;

      if (isEquipped) {
        btn.setText(t('btn_equipped', { name: bladeName }));
        btn.setColor('#00ffcc');
      } else if (isUnlocked) {
        btn.setText(t('btn_equip', { name: bladeName }));
        btn.setColor('#00f3ff');
      } else {
        btn.setText(t('btn_locked', { name: bladeName, cost: cfg.cost }));
        btn.setColor('#ffaa00');
      }
    });

    const activeCfg =
      TuningConfig.blades[this.selectedBlade as keyof typeof TuningConfig.blades] ||
      TuningConfig.blades.standard;
    if (this.bladeDescText) {
      const bladeName = t(`blade_${this.selectedBlade}_name`) || activeCfg.name;
      const bladeDesc = t(`blade_${this.selectedBlade}_desc`) || activeCfg.description;
      this.bladeDescText.setText(
        t('blade_desc_format', { name: bladeName, desc: bladeDesc })
      );
      this.bladeDescText.setColor(activeCfg.colorHex);
    }
  }

  private handleBladeButtonClick(bladeId: string): void {
    const isUnlocked = this.unlockedBlades.includes(bladeId);
    const bladeCfg = TuningConfig.blades[bladeId as keyof typeof TuningConfig.blades];
    if (!bladeCfg) return;

    const bladeName = t(`blade_${bladeId}_name`) || bladeCfg.name;

    if (isUnlocked) {
      this.selectedBlade = bladeId;
      this.audioManager.playDeflect(true);
      this.saveCurrentPlayerProgress();
      this.updateHangarUI();
      this.showPopup(t('blade_equipped_popup', { name: bladeName }), bladeCfg.colorHex);
    } else {
      if (this.plasmaFragments >= bladeCfg.cost) {
        this.plasmaFragments -= bladeCfg.cost;
        this.unlockedBlades.push(bladeId);
        this.selectedBlade = bladeId;
        this.audioManager.playSuperRicochet();
        this.saveCurrentPlayerProgress();
        this.updateHangarUI();
        this.recordMetric('blade_unlocked', { blade: bladeId, cost: bladeCfg.cost });
        this.showPopup(t('blade_unlocked_popup', { name: bladeName }), bladeCfg.colorHex);
      } else {
        this.audioManager.playShieldRicochet();
        const needed = bladeCfg.cost - this.plasmaFragments;
        this.showPopup(t('blade_insufficient_funds', { needed }), '#ffaa00');
      }
    }
  }

  private saveCurrentPlayerProgress(): void {
    const saved = this.loadStats();
    saved.plasmaFragments = this.plasmaFragments;
    saved.unlockedBlades = this.unlockedBlades;
    saved.selectedBlade = this.selectedBlade;
    this.saveStats(saved);
  }

  private hideHangarUI(): void {
    if (this.versionBadgeText) this.versionBadgeText.setVisible(false);
    if (this.fragmentsTitleText) this.fragmentsTitleText.setVisible(false);
    this.bladeButtons.forEach((b) => b.setVisible(false));
    if (this.bladeDescText) this.bladeDescText.setVisible(false);
  }

  private showHangarUI(): void {
    if (this.versionBadgeText) this.versionBadgeText.setVisible(true);
    if (this.fragmentsTitleText) this.fragmentsTitleText.setVisible(true);
    this.bladeButtons.forEach((b) => b.setVisible(true));
    if (this.bladeDescText) this.bladeDescText.setVisible(true);
    this.updateHangarUI();
  }

  // ---------------------------------------------------------------------------
  // Poki Input & Lifecycle Suspension
  // ---------------------------------------------------------------------------
  private disableGameplayInput(): void {
    this.isShowingAd = true;
    if (this.input) {
      this.input.enabled = false;
    }
    this.isJoystickActive = false;
    this.joystickPointerId = null;
    this.isParryBtnPressed = false;
    this.parryPointerId = null;
  }

  private enableGameplayInput(): void {
    this.isShowingAd = false;
    if (this.input) {
      this.input.enabled = true;
    }
  }

  // ---------------------------------------------------------------------------
  // Centralized Restart Trigger
  // ---------------------------------------------------------------------------
  private triggerRestart(triggerSource: string): void {
    if (this.isShowingAd) return;
    if (this.isRoundActive) return;
    if (!this.restartAllowed) return;

    // Immediately lock restart to prevent multiple clicks or keypresses
    this.restartAllowed = false;
    this.recordMetric('restart_clicked', { trigger: triggerSource });
    this.recordMetric('restart');

    if (this.coreHealth <= 0) {
      this.requestRestartWithAd();
    } else {
      this.startNewGame();
    }
  }

  // ---------------------------------------------------------------------------
  // Poki Ad Breaks & Revive Handling
  // ---------------------------------------------------------------------------
  private requestRestartWithAd(): Promise<void> {
    if (this.isShowingAd) return Promise.resolve();
    this.restartAllowed = false;

    // Sequence:
    // 1. gameplayStop (inside showCommercial)
    // 2. mute audio
    // 3. disable input
    // 4. commercialBreak
    // 5. restore input
    // 6. restore audio
    // 7. startNewGame -> gameplayStart
    return PokiService.showCommercial(
      () => {
        this.audioManager.muteForAd();
        this.disableGameplayInput();
      },
      () => {
        this.enableGameplayInput();
        this.audioManager.unmuteAfterAd();
        this.startNewGame();
      }
    );
  }

  private requestReviveWithAd(): Promise<boolean> {
    if (this.isShowingAd || !this.canReviveThisSession) return Promise.resolve(false);
    this.restartAllowed = false;
    this.recordMetric('revive_ad_requested', { wave: this.currentWave });

    return PokiService.showRewarded(
      () => {
        this.audioManager.muteForAd();
        this.disableGameplayInput();
      },
      () => {
        this.enableGameplayInput();
        this.audioManager.unmuteAfterAd();
      }
    ).then((rewardSuccess) => {
      if (rewardSuccess) {
        this.performRevive();
      } else {
        // Canceled or failed ad: allow restarting without granting an undeserved revive
        this.restartAllowed = true;
      }
      return rewardSuccess;
    });
  }

  private performRevive(): void {
    this.canReviveThisSession = false;
    this.coreHealth = 2;
    this.isRoundActive = true;
    this.restartAllowed = false;

    const cx = TuningConfig.arena.centerX;
    const cy = TuningConfig.arena.centerY;

    // Push away or destroy any dangerous incoming enemy lasers within 140px
    this.lasers = this.lasers.filter(
      (l) => l.isReflected || Math.hypot(l.x - cx, l.y - cy) > 140
    );

    // Hide defeat UI
    this.gameOverTitle.setVisible(false);
    this.gameOverRecordBanner.setVisible(false);
    this.gameOverStatsText.setVisible(false);
    this.restartButton.setVisible(false);
    this.restartHintText.setVisible(false);
    this.reviveButton.setVisible(false);

    this.uiText.setVisible(true);
    this.coreHudText.setVisible(true);
    this.updateQuestUI();

    // Shockwave effect for revive
    this.shockwaves.push({
      x: cx,
      y: cy,
      currentRadius: 10,
      maxRadius: 180,
      color: 0x00f3ff,
      life: 0.5,
      maxLife: 0.5,
    });

    this.audioManager.playShieldBreak();
    this.audioManager.startAmbientHum();
    const hasBoss = this.cannons.some((c) => c.type === 'boss' && !c.isDestroyed);
    this.audioManager.setBgmMode(hasBoss ? 'boss' : 'regular');

    this.showPopup(t('hud_core_revived'), '#00f3ff');
    this.recordMetric('core_revived_ad', { wave: this.currentWave });
    PokiService.gameplayStart();
    this.updateUI();
  }
}

