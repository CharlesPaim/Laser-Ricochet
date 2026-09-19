export interface PatchNoteEntry {
  version: string;
  codename: string;
  date: string;
  highlights: {
    en: string[];
    pt: string[];
  };
}

export const GAME_VERSION = 'v5.4.0';
export const GAME_BUILD_DATE = '2026-09-19';

export const PATCH_NOTES: PatchNoteEntry[] = [
  {
    version: 'v5.4.0',
    codename: 'Shadow Deflector & Deadly Rally',
    date: '2026-09-19',
    highlights: {
      en: [
        'New Mirror Boss: Shadow Deflector (Nemesis) on Waves 10, 20, 30...',
        'Deadly Rally Mechanic: Bolts accelerate +16% per clash up to 1150 px/s with 4-tier chromatic shift.',
        'Guard Break: Lethal bolts (Tier 3+) stagger Nemesis for 950ms and deal hull damage.',
        'Procedural Web Audio: 6 new inharmonic FM synthesizers for boss clash and telemetry.',
        'Rapid playtest: Added URL parameter support (?wave=10 or ?wave=5).',
      ],
      pt: [
        'Novo Chefe de Espelho: Shadow Deflector (Nemesis) nas Ondas 10, 20, 30...',
        'Mecânica Deadly Rally: Disparos aceleram +16% por clash até 1150 px/s com transição de 4 cores.',
        'Quebra de Guarda: Disparos letais (Tier 3+) atordoam o Nemesis por 950ms e causam dano.',
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
