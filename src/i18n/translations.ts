export type SupportedLang = 'en' | 'pt';

let currentLang: SupportedLang = 'en';

// Auto-detect browser language at startup
if (typeof navigator !== 'undefined') {
  const browserLang = navigator.language || (navigator as unknown as { userLanguage?: string }).userLanguage || '';
  if (browserLang.toLowerCase().startsWith('pt')) {
    currentLang = 'pt';
  } else {
    currentLang = 'en';
  }
}

export const translations: Record<SupportedLang, Record<string, string>> = {
  en: {
    // Title & Menus
    game_title: 'LASER RICOCHET',
    game_subtitle: 'CLICK OR PRESS SPACE TO PLAY',
    btn_start_game: '▶ START GAME',
    wallet_fragments: '💎 {count} PLASMA FRAGMENTS',
    instructions_1: 'DESKTOP: Mouse to aim | Click or Space to Parry',
    instructions_2: 'MOBILE: Left thumb steers 360° & distance | Right thumb [⚡ PARRY]',
    instructions_3: 'COLLECT CAPSULES: ⚡ Long Blade | 🛡️ Core Shield | ⏱️ Bullet-Time | 🔱 Multi-Laser',
    btn_fullscreen: '⛶ FULLSCREEN',
    btn_fullscreen_exit: '⛶ EXIT FULLSCREEN',
    ios_fullscreen_hint: 'IOS SAFARI: ROTATE DEVICE OR ADD TO HOME SCREEN FOR FULLSCREEN',
    btn_parry_mobile: '⚡ PARRY',
    btn_equipped: '✔ {name}\n[ EQUIPPED ]',
    btn_equip: '⚔ {name}\n[ EQUIP ]',
    btn_locked: '🔒 {name}\n[ {cost} 💎 ]',
    blade_unlocked_popup: '★ {name} UNLOCKED! ★',
    blade_equipped_popup: '⚔️ {name} EQUIPPED!',
    blade_insufficient_funds: '⚠️ NEED {needed} MORE 💎 TO UNLOCK!',
    blade_desc_format: '{name}: {desc} | Parry Window: 160ms (Symmetric)',

    // Blade catalog
    blade_standard_name: 'Pulse Deflector',
    blade_standard_desc: 'Standard Solar Fleet deflector. Absolute equilibrium.',
    blade_titan_crimson_name: 'Titan Crimson',
    blade_titan_crimson_desc: 'Dense heavy-alloy blade with +15% reach. Superior coverage.',
    blade_quantum_gold_name: 'Quantum Gold',
    blade_quantum_gold_desc: 'High-luminosity solar flare core. Concentrated kinetic energy.',
    blade_nova_frost_name: 'Nova Frost',
    blade_nova_frost_desc: 'Glacial cryo-plasma blade with prismatic ion field.',
    blade_vortex_void_name: 'Vortex Void',
    blade_vortex_void_desc: 'Dark void emitter with event-horizon gravitational curvature.',

    // HUD & In-Game
    hud_wave: 'WAVE {wave}',
    hud_core: 'CORE',
    hud_cannons: 'CANNONS',
    hud_combo: 'COMBO',
    hud_score: 'SCORE',
    hud_core_integrity: 'CORE',
    hud_enrage_active: '⚠️ DRONE OVERCLOCK ACTIVE!',
    hud_enrage_popup: '⚠️ DRONE OVERLOADED!',
    hud_boss_warning_hud: '⚠️ [DREADNOUGHT CLASS CAPITAL SHIP DETECTED!]',
    hud_boss_warning_popup: '⚠️ CAPITAL SHIP INBOUND!\n[BREAK HOLOGRAPHIC SHIELD WITH DEFLECTED LASERS!]',
    hud_boss_shield_broken: '💥 BOSS SHIELD SHATTERED! REACTOR EXPOSED!\n[PREPARE PARRY FOR MEGA-BEAM!]',
    hud_boss_shield_restored: '🛡️ BOSS SHIELD RESTORED! (3 POINTS)',
    hud_boss_beam_dissipated: '⚠️ MEGA-BEAM DISSIPATED!\n[Perform Parry to reflect critical damage!]',
    hud_mega_parry: '★★★ MEGA PARRY EXECUTED! COUNTER-ATTACK! ★★★',
    hud_shockwave_clear: '💥 SHOCKWAVE CLEARED INCOMING LASERS! 💥',
    hud_sniper_lock: '⚡ SNIPER TARGETING LOCK DETECTED!\n(Use Perfect Parry on the fast projectile!)',
    hud_angular_slicing_cue: '★ ANGULAR DEFLECTION: EDGE SLICE! ★',
    hud_wave_cleared: '★ WAVE {wave} CLEARED! (+20 💎) ★',
    hud_boss_cleared: '★★★ DREADNOUGHT DESTROYED! (+50 💎) ★★★',
    hud_overload_active: '⚡ OVERLOAD ENGAGED!',
    hud_core_revived: '⚡ CORE REVIVED! (+2 HP)',

    // Powerups
    powerup_blade_boost: '⚡ EXTENDED BLADE!\n(+40% coverage)',
    powerup_core_shield: '🛡️ CORE SHIELD ONLINE!\n(Absorbs 1 hit)',
    powerup_slow_mo: '⏱️ BULLET-TIME!\n(Lasers 50% slower)',
    powerup_multi_beam: '🔱 MULTI-LASER ONLINE!\n(Each deflect fires 3 lasers)',
    powerup_collected: '⚡ COLLECTED!',

    // Floating Scores
    score_parry: '★ PARRY!',
    score_mega_parry: '★★★ MEGA PARRY!',
    score_overload: '⚡ OVERLOAD!',
    score_shockwave: '💥 SHOCKWAVE!',

    // Micro-Quests
    quest_prefix: '⚡ MISSION',
    quest_parry_master_title: 'PARRY MASTER',
    quest_parry_master_desc: 'Execute 4 Perfect Parries',
    quest_streak_elite_title: 'LIGHTNING STREAK',
    quest_streak_elite_desc: 'Reach a 4x Combo Streak',
    quest_deflect_spree_title: 'PURE REFLEX',
    quest_deflect_spree_desc: 'Perform 8 Deflections in one run',
    quest_sniper_hunter_title: 'GAUSS HUNTER',
    quest_sniper_hunter_desc: 'Destroy 1 Sniper with a reflected beam',
    quest_completed_popup: '★ MISSION COMPLETE: +{reward} 💎! ★',

    // Mini-Rogue Dialog
    mini_rogue_title: '⚡ QUANTUM PROTOCOL — SELECT 1 UPGRADE ⚡',
    mini_rogue_select_btn: '[ SELECT ]',
    mini_rogue_activated_popup: '⚡ PROTOCOL ACTIVATED: {name}!',
    mod_titan_grip_name: 'TITAN GRIP',
    mod_titan_grip_desc: '+18% blade length reach (Core -1 Max HP)',
    mod_spark_ricochet_name: 'ION SPARK',
    mod_spark_ricochet_desc: 'Deflections fire 1 bonus homing plasma bolt',
    mod_cryo_parry_name: 'CRYO PARRY',
    mod_cryo_parry_desc: 'Perfect parries slow nearby lasers by 50% for 1.5s',
    mod_rapid_overload_name: 'HYPER CHARGE',
    mod_rapid_overload_desc: 'Overload activates with only 2 deflections',
    mod_plasma_magnet_name: 'QUANTUM MAGNET',
    mod_plasma_magnet_desc: '+50% plasma fragments collected this run',

    // Pause Screen
    pause_title: 'SYSTEMS PAUSED',
    pause_subtitle: 'CLICK OR PRESS SPACE TO RESUME',
    pause_music_btn: '🎵 MUSIC: {val}',
    pause_sfx_btn: '🔊 SFX: {val}',

    // Game Over
    game_over_title: 'CORE DESTROYED!',
    game_over_new_record: '★ NEW PERSONAL RECORD! ★',
    game_over_stats: 'Wave Reached: {wave} | Score: {score}\nMax Combo: {combo} | Parries: {parries} | Bosses: {bosses}\nPlasma Fragments Collected: {fragments}',
    btn_revive: '🎬 REVIVE (+2 HP)',
    btn_restart: '↻ RESTART MISSION',
    restart_hint: 'PRESS R OR SPACE TO RESTART',

    // Help Modal
    help_title: 'TACTICAL DEFENSE MANUAL',
    help_line1: '• MOUSE / TOUCH: Rotates blade on the orbital defense track.',
    help_line2: '• CLICK / TAP AT IMPACT: PARRY (Counter-strike accelerating lasers to 1.45x).',
    help_line3: '• ANGULAR SLICING: Hitting blade edges redirects shots sideways towards your aim.',
    help_line4: '• OVERLOAD: Chain 3 consecutive deflections to fire a 3-way cluster shot.',
    help_line5: '• POWER-UPS: Intercept incoming glowing capsules before they decay.',
    help_line6: '• BOSS ENCOUNTERS: Break holographic shields on Wave 5, 10, 15... then parry the Mega-Beam.',
    help_close_hint: '[ CLICK ANYWHERE TO CLOSE ]',

    // Controls & Settings
    btn_sound_on: '🔊 AUDIO: ON',
    btn_sound_muted: '🔇 AUDIO: MUTED',
    btn_crt_on: '📺 CRT: ON',
    btn_crt_off: '📺 CRT: OFF',

    // Language Toggle
    lang_toggle: '🌐 EN',

    // Patch Notes Modal
    btn_patch_notes: '{version} • PATCH NOTES',
    patch_notes_title: 'SYSTEM PATCH NOTES',
    btn_close_patch_notes: '[ ✕ CLOSE ]',
  },

  pt: {
    // Title & Menus
    game_title: 'LASER RICOCHET',
    game_subtitle: 'CLIQUE OU PRESSIONE ESPAÇO PARA JOGAR',
    btn_start_game: '▶ INICIAR JOGO',
    wallet_fragments: '💎 {count} FRAGMENTOS DE PLASMA',
    instructions_1: 'DESKTOP: Mouse para mirar | Clique ou Espaço para Parry',
    instructions_2: 'CELULAR: Polegar esquerdo mira 360° e distância | Polegar direito [⚡ PARRY]',
    instructions_3: 'COLETE CÁPSULAS: ⚡ Lâmina Longa | 🛡️ Escudo | ⏱️ Bullet-Time | 🔱 Multi-Laser',
    btn_fullscreen: '⛶ TELA CHEIA',
    btn_fullscreen_exit: '⛶ SAIR DA TELA CHEIA',
    ios_fullscreen_hint: 'IOS SAFARI: GIRE O CELULAR OU ADICIONE À TELA DE INÍCIO',
    btn_parry_mobile: '⚡ PARRY',
    btn_equipped: '✔ {name}\n[ EQUIPADA ]',
    btn_equip: '⚔ {name}\n[ EQUIPAR ]',
    btn_locked: '🔒 {name}\n[ {cost} 💎 ]',
    blade_unlocked_popup: '★ {name} DESBLOQUEADA! ★',
    blade_equipped_popup: '⚔️ {name} EQUIPADA!',
    blade_insufficient_funds: '⚠️ FALTAM {needed} 💎 PARA DESBLOQUEAR!',
    blade_desc_format: '{name}: {desc} | Janela de Parry: 160ms (Simétrica)',

    // Blade catalog
    blade_standard_name: 'Pulse Deflector',
    blade_standard_desc: 'Lâmina padrão da Frota Solar. Equilíbrio absoluto.',
    blade_titan_crimson_name: 'Titã Carmesim',
    blade_titan_crimson_desc: 'Liga pesada com +15% de envergadura. Cobertura defensiva estendida.',
    blade_quantum_gold_name: 'Ouro Quântico',
    blade_quantum_gold_desc: 'Núcleo de plasma solar de alta energia. Brilho e impacto reforçados.',
    blade_nova_frost_name: 'Geada Cósmica',
    blade_nova_frost_desc: 'Lâmina de plasma criogênico glacial com campo iônico prismático.',
    blade_vortex_void_name: 'Vórtice Sombrio',
    blade_vortex_void_desc: 'Emissor gravitacional escuro com curvatura de horizonte de eventos.',

    // HUD & In-Game
    hud_wave: 'FASE {wave}',
    hud_core: 'CORE',
    hud_cannons: 'CANHÕES',
    hud_combo: 'COMBO',
    hud_score: 'PONTOS',
    hud_core_integrity: 'NÚCLEO',
    hud_enrage_active: '⚠️ [ÚLTIMO CANHÃO: SOBRECARGA!]',
    hud_enrage_popup: '⚠️ DRONE EM SOBRECARGA!',
    hud_boss_warning_hud: '⚠️ [NAU CAPITÂNIA DREADNOUGHT DETECTADA!]',
    hud_boss_warning_popup: '⚠️ NAU CAPITÂNIA CHEGANDO!\n[QUEBRE O ESCUDO HOLOGRÁFICO COM OS TIROS REFLETIDOS!]',
    hud_boss_shield_broken: '💥 ESCUDO DO CHEFÃO QUEBRADO! REATOR EXPOSTO!\n[PREPARE O PARRY NO MEGA-RAIO!]',
    hud_boss_shield_restored: '🛡️ ESCUDO DO CHEFÃO REATIVADO! (3 PONTOS)',
    hud_boss_beam_dissipated: '⚠️ MEGA-RAIO DISSIPADO!\n[Faça Parry para refletir dano crítico!]',
    hud_mega_parry: '★★★ MEGA PARRY EXECUTADO! CONTRA-ATAQUE! ★★★',
    hud_shockwave_clear: '💥 ONDA DE CHOQUE LIMPANDO A ÁREA! 💥',
    hud_sniper_lock: '⚡ SNIPER AZUL DETECTADO!\n(Use o Parry Perfeito no tiro rápido!)',
    hud_angular_slicing_cue: '★ DESVIO ANGULAR: REBATE NAS BORDAS! ★',
    hud_wave_cleared: '★ FASE {wave} CONCLUÍDA! (+20 💎) ★',
    hud_boss_cleared: '★★★ DREADNOUGHT DESTRUÍDO! (+50 💎) ★★★',
    hud_overload_active: '⚡ SOBRECARGA ATIVADA!',
    hud_core_revived: '⚡ NÚCLEO REVIVIDO! (+2 HP)',

    // Powerups
    powerup_blade_boost: '⚡ LÂMINA ESTENDIDA!\n(+40% de cobertura)',
    powerup_core_shield: '🛡️ ESCUDO DO NÚCLEO ATIVADO!\n(Absorve 1 erro)',
    powerup_slow_mo: '⏱️ BULLET-TIME!\n(Lasers 50% mais lentos)',
    powerup_multi_beam: '🔱 MULTI-LASER ATIVADO!\n(Cada rebate dispara 3 lasers)',
    powerup_collected: '⚡ COLETADO!',

    // Floating Scores
    score_parry: '★ PARRY!',
    score_mega_parry: '★★★ MEGA PARRY!',
    score_overload: '⚡ OVERLOAD!',
    score_shockwave: '💥 SHOCKWAVE!',

    // Micro-Quests
    quest_prefix: '⚡ MISSÃO',
    quest_parry_master_title: 'MESTRE DO PARRY',
    quest_parry_master_desc: 'Execute 4 Parries Perfeitos',
    quest_streak_elite_title: 'STREAK RELÂMPAGO',
    quest_streak_elite_desc: 'Atinja uma sequência de 4x Combos',
    quest_deflect_spree_title: 'REFLEXO PURO',
    quest_deflect_spree_desc: 'Realize 8 deflexões na mesma corrida',
    quest_sniper_hunter_title: 'CAÇADOR DE GAUSS',
    quest_sniper_hunter_desc: 'Destrua 1 Sniper com tiro refletido',
    quest_completed_popup: '★ MISSÃO CONCLUÍDA: +{reward} 💎! ★',

    // Mini-Rogue Dialog
    mini_rogue_title: '⚡ PROTOCOLO QUÂNTICO — ESCOLHA 1 MELHORIA ⚡',
    mini_rogue_select_btn: '[ SELECIONAR ]',
    mini_rogue_activated_popup: '⚡ PROTOCOLO ATIVADO: {name}!',
    mod_titan_grip_name: 'GARRA TITÃ',
    mod_titan_grip_desc: '+18% envergadura da lâmina (Reator -1 HP)',
    mod_spark_ricochet_name: 'FAÍSCA ION',
    mod_spark_ricochet_desc: 'Ricochete dispara faísca teleguiada extra',
    mod_cryo_parry_name: 'CRIOPARADA',
    mod_cryo_parry_desc: 'Parry perfeito desacelera lasers em 50% por 1.5s',
    mod_rapid_overload_name: 'HIPER CARGA',
    mod_rapid_overload_desc: 'Overload ativa com apenas 2 deflexões',
    mod_plasma_magnet_name: 'ÍMÃ QUÂNTICO',
    mod_plasma_magnet_desc: '+50% fragmentos quânticos coletados na run',

    // Pause Screen
    pause_title: 'SISTEMA PAUSADO',
    pause_subtitle: 'CLIQUE OU ESPAÇO PARA CONTINUAR',
    pause_music_btn: '🎵 MÚSICA: {val}',
    pause_sfx_btn: '🔊 EFEITOS: {val}',

    // Game Over
    game_over_title: 'NÚCLEO DESTRUÍDO!',
    game_over_new_record: '★ NOVO RECORDE PESSOAL! ★',
    game_over_stats: 'Fase Alcançada: {wave} | Pontos: {score}\nMaior Combo: {combo} | Parries: {parries} | Chefes: {bosses}\nFragmentos de Plasma Coletados: {fragments}',
    btn_revive: '🎬 REVIVER (+2 HP)',
    btn_restart: '↻ REINICIAR MISSÃO',
    restart_hint: 'PRESSIONE R OU ESPAÇO PARA REINICIAR',

    // Help Modal
    help_title: 'MANUAL TÁTICO DE DEFESA',
    help_line1: '• MOUSE / TOUCH: Posiciona a lâmina no trilho orbital.',
    help_line2: '• CLIQUE / TOQUE NO IMPACTO: PARRY (Contra-ataque reflexivo acelerado a 1.45x).',
    help_line3: '• ANGULAR SLICING: Impactos nas pontas desviam o tiro lateralmente em direção à sua mira.',
    help_line4: '• SOBRECARGA: 3 deflexões consecutivas sem dano ativam disparo de fragmentação tripla.',
    help_line5: '• CÁPSULAS: Intercepte cápsulas orbitais antes que decaiam na borda do núcleo.',
    help_line6: '• CHEFÕES PERIÓDICOS: Quebre os escudos nas Waves 5, 10, 15... e use Parry no Mega-Raio.',
    help_close_hint: '[ CLIQUE EM QUALQUER LUGAR PARA VOLTAR ]',

    // Controls & Settings
    btn_sound_on: '🔊 SOM: ON',
    btn_sound_muted: '🔇 SOM: MUDO',
    btn_crt_on: '📺 CRT: ON',
    btn_crt_off: '📺 CRT: OFF',

    // Language Toggle
    lang_toggle: '🌐 PT',

    // Patch Notes Modal
    btn_patch_notes: '{version} • NOTAS DA VERSÃO',
    patch_notes_title: 'NOTAS DE ATUALIZAÇÃO',
    btn_close_patch_notes: '[ ✕ FECHAR ]',
  },
};

export function getLang(): SupportedLang {
  return currentLang;
}

export function setLang(lang: SupportedLang): void {
  currentLang = lang;
}

export function toggleLang(): SupportedLang {
  currentLang = currentLang === 'en' ? 'pt' : 'en';
  return currentLang;
}

export function t(key: string, params?: Record<string, string | number>): string {
  const dict = translations[currentLang] || translations.en;
  let text = dict[key] || translations.en[key] || key;

  if (params) {
    Object.entries(params).forEach(([paramKey, val]) => {
      text = text.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(val));
    });
  }
  return text;
}
