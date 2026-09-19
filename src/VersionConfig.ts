export interface PatchNoteEntry {
  version: string;
  codename: string;
  date: string;
  highlights: {
    en: string[];
    pt: string[];
  };
}

export const GAME_VERSION = 'v5.4.2';
export const GAME_BUILD_DATE = '2026-09-19';

export const PATCH_NOTES: PatchNoteEntry[] = [
  {
    version: 'v5.4.2',
    codename: 'Nemesis Hull Absorption & Anti-Freeze Safeguard',
    date: '2026-09-19',
    highlights: {
      en: [
        'Hull Absorption: Non-lethal bolts hitting Nemesis chassis are cleanly dissipated by armor, preventing infinite velocity decays.',
        'Anti-Freeze Safeguard: Automated cleanup of anomalous low-velocity projectiles ensures zero frozen bolts on screen.',
        'Guaranteed Attack Cadence: Nemesis reliably engages new strikes every 1.4s–2.2s when no rally is active.',
      ],
      pt: [
        'Absorção de Blindagem: Disparos não-letais na carcaça do Nemesis são dissipados pelo escudo, eliminando desaceleração infinita.',
        'Safeguard Anti-Congelamento: Limpeza autônoma de projéteis de baixa velocidade garante zero tiros parados na arena.',
        'Cadência Ofensiva Garantida: Nemesis retoma novos ataques a cada 1.4s–2.2s sempre que não houver rali ativo.',
      ],
    },
  },
  {
    version: 'v5.4.1',
    codename: 'Nemesis Clash Break & Balanced Duel',
    date: '2026-09-19',
    highlights: {
      en: [
        'Clash Break: Lethal bolts (Tier 3+) now shatter Nemesis scythe guard on impact, guaranteeing Guard Break!',
        'Rebalanced Nemesis HP to 3 on Wave 10 (3 clean rally wins to defeat).',
        'Extended vulnerable recover window to 1500ms for solid counter-attacks.',
        'Capped rally velocity to 750 px/s for responsive reflex play on mobile and desktop.',
      ],
      pt: [
        'Clash Break: Disparos letais (Tier 3+) agora estilhaçam a foice do Nemesis no impacto, garantindo Quebra de Guarda!',
        'HP do Nemesis balanceado para 3 na Onda 10 (3 ralis perfeitos para vencer).',
        'Janela de vulnerabilidade estendida para 1500ms para contra-ataques sólidos.',
        'Velocidade máxima de rali limitada a 750 px/s para reflexos precisos em celular e PC.',
      ],
    },
  },
  {
    version: 'v5.4.0',
    codename: 'Shadow Deflector & Deadly Rally',
    date: '2026-09-19',
    highlights: {
      en: [
        'New Mirror Boss: Shadow Deflector (Nemesis) on Waves 10, 20, 30...',
        'Deadly Rally Mechanic: Bolts accelerate per clash with 4-tier chromatic shift.',
        'Procedural Web Audio: 6 new inharmonic FM synthesizers for boss clash and telemetry.',
        'Rapid playtest: Added URL parameter support (?wave=10 or ?wave=5).',
      ],
      pt: [
        'Novo Chefe de Espelho: Shadow Deflector (Nemesis) nas Ondas 10, 20, 30...',
        'Mecânica Deadly Rally: Disparos aceleram a cada troca com transição de 4 cores.',
        'Web Audio Procedural: 6 novos sintetizadores FM inarmônicos para clash e telemetria.',
        'Playtest rápido: Suporte a parâmetro de URL (?wave=10 ou ?wave=5).',
      ],
    },
  },
  {
    version: 'v5.3.0',
    codename: 'Game Over Ergonomics & Pacing',
    date: '2026-09-19',
    highlights: {
      en: [
        'Fixed Game Over text overlap: Top-anchored stats with guaranteed 10-45px vertical breathing room.',
        'New tactile arcade action buttons for Restart and Rewarded Revive.',
        'Dynamic Personal Best record banner positioning on desktop and mobile.',
      ],
      pt: [
        'Correção de sobreposição no Game Over: Estatísticas ancoradas no topo com respiro de 10-45px.',
        'Novos botões táteis estilo arcade para Reiniciar e Reviver.',
        'Posicionamento dinâmico do banner de Novo Recorde Pessoal em desktop e mobile.',
      ],
    },
  },
  {
    version: 'v5.2.0',
    codename: 'Audio Dynamics & Gain Staging',
    date: '2026-09-19',
    highlights: {
      en: [
        'Calibrated Web Audio gain staging: Boosted regular BGM (0.36) and Boss BGM (0.50).',
        'Balanced SFX and procedural synthwave master headroom.',
      ],
      pt: [
        'Calibração de ganho Web Audio: Aumento do volume da BGM regular (0.36) e do Chefe (0.50).',
        'Headroom balanceado entre efeitos sonoros e sintetizadores procedurais.',
      ],
    },
  },
  {
    version: 'v5.1.0',
    codename: 'Arcade Polish & Responsive UI',
    date: '2026-09-19',
    highlights: {
      en: [
        'Tactile Start, Revive, and Restart arcade-style buttons.',
        'Increased typography scale and touch targets in Mini-Rogue selection cards.',
        'Poki SDK offline staging fallback without unauthorized console noise.',
      ],
      pt: [
        'Botões arcade táteis para Iniciar, Reviver e Reiniciar.',
        'Aumento do tamanho de fontes e botões de toque nos cards Mini-Rogue.',
        'Modo sandbox resiliente fora do domínio Poki sem ruído de site-lock.',
      ],
    },
  },
  {
    version: 'v5.0.0',
    codename: 'Dual-Thumb Mobile Architecture',
    date: '2026-09-19',
    highlights: {
      en: [
        'Dual-Thumb Arcade controls: Floating 360° virtual joystick on left + Neon Parry button on right.',
        '2D thumb displacement maps angle and orbital radius with concentric radar HUD rings.',
        'Clean desktop HUD with pure 1:1 mouse tracking.',
      ],
      pt: [
        'Controles Mobile Dual-Thumb: Joystick virtual flutuante 360° na esquerda + Botão Parry na direita.',
        'Deslocamento do polegar mapeia ângulo e raio com anéis concêntricos diegéticos.',
        'HUD limpo no desktop com rastreamento 1:1 de mouse.',
      ],
    },
  },
];
