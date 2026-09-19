/**
 * Laser Ricochet: Blade Deflector - Centralized Tuning Configuration
 */
export const TuningConfig = {
  arena: {
    width: 960,
    height: 540,
    centerX: 480,
    centerY: 270,
    coreRadius: 32,
    coreMaxHealth: 5,
  },
  blade: {
    length: 110,
    boostedLength: 155, // When Blade Boost powerup is active
    thickness: 16,
    minOrbitRadius: 65,  // Strict defensive ring
    maxOrbitRadius: 160, // Outer hazard reach (cannons are at 235, so 75px safe standoff remains)
    deflectBoostMultiplier: 1.45,
    parryWindowMs: 160,
    color: 0x00f3ff,
    parryColor: 0xffea00,
    overloadColor: 0xff0099,
    homingAssistance: 0.16, // Substantially reduced so player slicing vector dictates the shot!
    slicingAngleMax: 0.96, // ±55 degrees deflection authority on paddle tips
    polarDeadzoneRadius: 42, // Polar deadzone near core center to prevent chaotic 180 flips on touch/drag
  },
  laser: {
    radius: 9,
    heavyRadius: 15,
    initialSpeed: 190,
    speedRampPerWave: 8,
    maxSpeed: 650,
    colorEnemy: 0xff1744,
    colorReflected: 0x00ff88,
    colorOverload: 0xffea00,
    colorHeavy: 0xff8c00,
    colorSniper: 0x00f3ff,
  },
  cannons: {
    baseCount: 3,
    maxCount: 7,
    radius: 24,
    bossRadius: 42,
    bossShieldRadius: 52,
    distanceFromCenter: 235,
    fireIntervalMinSeconds: 2.2,
    fireIntervalMaxSeconds: 3.6,
    cadenceRampPerLoss: 0.22, // Progressive speedup: each destroyed cannon cuts remaining interval by 22%
    loneDuelFireIntervalMin: 0.95, // High-tension duel minimum interval
    loneDuelFireIntervalMax: 1.35, // High-tension duel maximum interval
    loneDuelTelegraphMs: 400, // Snappier telegraph in 1v1 duel
    telegraphDurationMs: 650,
    sniperTelegraphDurationMs: 1200,
    colorStandard: 0xff2a6d,
    colorHeavy: 0xff9900,
    colorSniper: 0x05d9e8,
    colorScatter: 0xa020f0,
    colorBoss: 0xff003c,
    colorEnraged: 0xff1144, // Last cannon enrage color
    enrageOrbitMultiplier: 1.85, // Enraged lone cannon speeds up dynamically
  },
  boss: {
    barrageDurationMs: 6000,
    vulnerableDurationMs: 5000,
    megaBeamSpeed: 380,
    megaBeamRadius: 18,
    shieldMaxHp: 3,
    bossIntervalWaves: 5, // Boss appears every 5 waves (Wave 5, 10, 15...)
    hpPerTier: 2, // +2 HP each subsequent boss appearance
    shieldPipsPerTier: 1, // +1 shield hit every 2 appearances
    patterns: ['heavy_double', 'sweep_barrage', 'twin_flank', 'rapid_pulse', 'harmonic_surge'] as const,
    harmonicSurgeSpeed: 175,
    harmonicAmplitude: 24,
    harmonicFrequency: 0.032,
  },
  nemesis: {
    orbitMin: 178,
    orbitMax: 248,
    bladeHalf: 44,
    bladeThickness: 9,
    stalkMin: 620,
    stalkMax: 1150,
    dashMs: 330,
    strikeMs: 260,
    recoverMs: 950,
    stalkSpeed: 1.15,
    dashSpeed: 5.4,
    color: 0xff1744,
    colorAccent: 0xff8fa3,
    colorDark: 0x0b0509,
    colorRib: 0x3d1420,
    rallyLethalTier: 3,
    rallyMaxSpeed: 1150,
    rallySpeedStep: 1.16,
    rallyRadiusStep: 1.1,
    rallyColors: [0x9ffcff, 0x7df9ff, 0xffea00, 0xffaa00, 0xff6a2a, 0xff1744, 0xffffff],
  },
  ftue: {
    idleHintDelayMs: 1200, // Time without movement in Wave 1 before pulsing guidance
    parryHintDurationMs: 500, // Brief visual prompt for parry opportunity
  },
  waves: {
    healthBonusPerWave: 1,
    orbitSpeedBase: 0.22, // rad/s
    wave1CannonCount: 1, // Onboarding: Exactly 1 cannon in Wave 1
    wave1InitialDelaySeconds: 2.8, // Calm opening delay for the inaugural shot
    wave1FireIntervalMin: 3.4, // Deliberate relaxed cadence
    wave1FireIntervalMax: 4.0,
  },
  combo: {
    overloadThreshold: 3,
  },
  powerups: {
    dropChance: 0.35,
    maxSimultaneous: 1, // Only 1 power-up capsule on screen at any time
    durationMs: 7000,
    spawnOrbitRadius: 185, // Risk zone: between defensive rail (125) and cannons (235)
    driftSpeed: 28, // Slowly floats inward towards the player and core
    lifetimeMs: 7000, // Ticking decay ring
  },
  asteroids: {
    count: 8,
    minOrbitRadius: 280,
    maxOrbitRadius: 390,
    minSize: 12,
    maxSize: 24,
    minOrbitSpeed: 0.014,
    maxOrbitSpeed: 0.032,
  },
  audio: {
    masterVolume: 0.8,
    sfxVolume: 0.85,
    ambientHumVolume: 0.035, // Very subtle background spatial drone
    bgmRegularVolume: 0.36,  // Synthwave combat bassline & arp volume (amplificado de 0.16 para 0.36)
    bgmBossVolume: 0.50,     // High-tension industrial boss music volume (amplificado de 0.22 para 0.50)
    bgmRegularBpm: 120,
    bgmBossBpm: 138,
  },
  economy: {
    welcomeFragments: 50,
    fragmentsPerDeflect: 1,
    fragmentsPerParry: 3,
    fragmentsPerWave: 20,
    fragmentsPerBoss: 50,
  },
  touchpad: {
    touchSensitivity: 0.0082, // rad/px for horizontal trackball drag
    touchZoneY: 270, // Lower screen half activates relative touch
  },
  blades: {
    standard: {
      id: 'standard',
      name: 'PULSE DEFLECTOR',
      cost: 0,
      length: 110,
      color: 0x00f3ff,
      colorHex: '#00f3ff',
      beamColor: 0x00f3ff,
      description: 'Lâmina padrão da Frota Solar. Equilíbrio absoluto.',
    },
    titan_crimson: {
      id: 'titan_crimson',
      name: 'TITÃ CARMESIM',
      cost: 80,
      length: 126, // +15% reach
      color: 0xff1744,
      colorHex: '#ff1744',
      beamColor: 0xff3366,
      description: 'Chassi blindado reforçado com +15% de envergadura.',
    },
    quantum_gold: {
      id: 'quantum_gold',
      name: 'OURO QUÂNTICO',
      cost: 200,
      length: 110,
      color: 0xffd700,
      colorHex: '#ffd700',
      beamColor: 0xffe066,
      description: 'Feixe de fótons ionizados e plasma dourado solar.',
    },
    nova_frost: {
      id: 'nova_frost',
      name: 'GEADA CÓSMICA',
      cost: 350,
      length: 118,
      color: 0x00ffcc,
      colorHex: '#00ffcc',
      beamColor: 0x33ffee,
      description: 'Plasma criogênico de alta luminescência ártica.',
    },
    vortex_void: {
      id: 'vortex_void',
      name: 'VÓRTICE SOMBRIO',
      cost: 500,
      length: 112,
      color: 0xb300ff,
      colorHex: '#b300ff',
      beamColor: 0xcc33ff,
      description: 'Condensador de energia do vácuo com rastro violeta.',
    },
  },
  miniRogue: {
    waveInterval: 3, // Selection offered every 3 waves (Wave 3, 6, 9...)
    bulletTimeScale: 0.10, // 10% world speed (smooth tactical slowdown)
    autoSelectTimeoutMs: 8000, // 8s auto-select timer to never halt web gameplay
    modifiers: [
      {
        id: 'titan_grip',
        name: 'GARRA TITÃ',
        icon: '🛡️',
        description: '+18% envergadura da lâmina (Reator -1 HP)',
        lengthBonus: 20,
        coreHealthCost: 1,
      },
      {
        id: 'spark_ricochet',
        name: 'FAÍSCA ION',
        icon: '⚡',
        description: 'Ricochete dispara faísca teleguiada extra',
      },
      {
        id: 'cryo_parry',
        name: 'PARRI GELO',
        icon: '❄️',
        description: 'Parry desacelera lasers em 50% por 1.5s',
      },
      {
        id: 'rapid_overload',
        name: 'HIPER CARGA',
        icon: '🔥',
        description: 'Overload ativa com apenas 2 deflexões',
      },
      {
        id: 'plasma_magnet',
        name: 'ÍMÃ QUÂNTICO',
        icon: '🧲',
        description: '+50% fragmentos quânticos coletados na run',
      },
    ] as const,
  },
  microQuests: [
    {
      id: 'parry_master',
      title: 'MAESTRIA DO PARRY',
      description: 'Execute 2 Parries Perfeitos',
      type: 'parry',
      target: 2,
      rewardFragments: 35,
    },
    {
      id: 'streak_elite',
      title: 'STREAK RELÂMPAGO',
      description: 'Atinja uma sequência de 4x Combos',
      type: 'streak',
      target: 4,
      rewardFragments: 30,
    },
    {
      id: 'deflect_spree',
      title: 'ESCUDO ATIVO',
      description: 'Reflita 8 projéteis de plasma',
      type: 'deflect',
      target: 8,
      rewardFragments: 40,
    },
    {
      id: 'sniper_hunter',
      title: 'CAÇADOR DE GAUSS',
      description: 'Destrua 1 Sniper com tiro refletido',
      type: 'destroy_sniper',
      target: 1,
      rewardFragments: 45,
    },
  ] as const,
  storage: {
    key: 'laser_ricochet_stats',
  },
} as const;
