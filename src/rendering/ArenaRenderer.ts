import Phaser from 'phaser';
import { TuningConfig } from '../TuningConfig';

/**
 * ArenaRenderer — Plataforma Orbital Citadel Cinematográfica (v3.0)
 * Renderiza em profundidade multicamada:
 * 1. Fundo cósmico com nebulosa procedural volumétrica.
 * 2. Megaestruturas espaciais distantes em silhueta de parallax.
 * 3. Campo estelar em 3 planos de profundidade com espículas de difração.
 * 4. Plataforma orbital de combate com placas chanfradas, trincheiras mecânicas,
 *    conduítes energéticos e dentes de contenção de estação.
 * 5. Pré-renderizado off-screen via Canvas Texture (0ms draw cost no update loop).
 */
export class ArenaRenderer {
  public static buildCitadelTexture(scene: Phaser.Scene): void {
    const width = TuningConfig.arena.width;
    const height = TuningConfig.arena.height;
    const cx = TuningConfig.arena.centerX;
    const cy = TuningConfig.arena.centerY;

    if (scene.textures.exists('arena_citadel')) {
      scene.textures.remove('arena_citadel');
    }

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;

    // -----------------------------------------------------------------------
    // CAMADA 1: Deep Cosmos & Volumetric Nebula Clouds
    // -----------------------------------------------------------------------
    const bgGrad = ctx.createRadialGradient(cx, cy, 20, cx, cy, 540);
    bgGrad.addColorStop(0, '#0a0e1c');
    bgGrad.addColorStop(0.35, '#070a14');
    bgGrad.addColorStop(0.7, '#04060d');
    bgGrad.addColorStop(1, '#020307');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Nebulosa volumétrica procedural cósmica multicamada (Ciano elétrico, violeta profundo, magenta cósmico)
    const nebulaSpots = [
      { x: cx - 220, y: cy - 140, r: 360, color: 'rgba(0, 190, 255, 0.075)' },
      { x: cx + 260, y: cy + 150, r: 380, color: 'rgba(140, 40, 230, 0.070)' },
      { x: cx - 140, y: cy + 180, r: 320, color: 'rgba(0, 255, 200, 0.055)' },
      { x: cx + 200, y: cy - 160, r: 340, color: 'rgba(255, 40, 160, 0.050)' },
      { x: cx, y: cy - 200, r: 280, color: 'rgba(40, 90, 220, 0.060)' },
      { x: cx, y: cy + 220, r: 300, color: 'rgba(180, 20, 140, 0.055)' },
    ];
    for (const spot of nebulaSpots) {
      const g = ctx.createRadialGradient(spot.x, spot.y, 15, spot.x, spot.y, spot.r);
      g.addColorStop(0, spot.color);
      g.addColorStop(0.5, spot.color.replace(/[\d\.]+\)$/, '0.025)'));
      g.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, width, height);
    }

    // -----------------------------------------------------------------------
    // CAMADA 2: Megaestruturas Distantes em Silhueta (Deep Space Parallax)
    // -----------------------------------------------------------------------
    ctx.save();
    ctx.strokeStyle = 'rgba(20, 36, 60, 0.25)';
    ctx.lineWidth = 1.5;

    // Grande anel orbital distante em perspectiva
    ctx.beginPath();
    ctx.ellipse(cx, cy + 40, 460, 180, -0.12, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(30, 50, 80, 0.18)';
    ctx.beginPath();
    ctx.ellipse(cx, cy + 40, 490, 195, -0.12, 0, Math.PI * 2);
    ctx.stroke();

    // Spiras e treliças industriais da estação ao longe
    for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) {
      const rotA = a - 0.12;
      const x1 = cx + Math.cos(rotA) * 440;
      const y1 = cy + 40 + Math.sin(rotA) * 170;
      const x2 = cx + Math.cos(rotA) * 520;
      const y2 = cy + 40 + Math.sin(rotA) * 205;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();

      // Luzes vermelhas e ciano de aviso aeronáutico distantes
      ctx.fillStyle = a % (Math.PI / 2) === 0 ? 'rgba(255, 40, 60, 0.6)' : 'rgba(0, 240, 255, 0.5)';
      ctx.beginPath();
      ctx.arc(x2, y2, 1.8, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // -----------------------------------------------------------------------
    // CAMADA 3: Starfield Estático em 3 Planos com Espículas
    // -----------------------------------------------------------------------
    const pseudoRand = (seed: number) => {
      const x = Math.sin(seed++) * 10000;
      return x - Math.floor(x);
    };

    let seed = 42;
    for (let i = 0; i < 180; i++) {
      const sx = pseudoRand(seed++) * width;
      const sy = pseudoRand(seed++) * height;
      const sz = pseudoRand(seed++);
      const brightness = pseudoRand(seed++) * 0.7 + 0.2;

      ctx.fillStyle = sz > 0.85 ? `rgba(180, 230, 255, ${brightness})` : `rgba(120, 160, 210, ${brightness * 0.7})`;
      const radius = sz > 0.9 ? 1.4 : sz > 0.5 ? 0.9 : 0.5;

      ctx.beginPath();
      ctx.arc(sx, sy, radius, 0, Math.PI * 2);
      ctx.fill();

      // Espículas de difração em estrelas proeminentes
      if (sz > 0.96) {
        ctx.strokeStyle = `rgba(200, 240, 255, ${brightness * 0.45})`;
        ctx.lineWidth = 0.75;
        ctx.beginPath();
        ctx.moveTo(sx - 4, sy);
        ctx.lineTo(sx + 4, sy);
        ctx.moveTo(sx, sy - 4);
        ctx.lineTo(sx, sy + 4);
        ctx.stroke();
      }
    }

    // -----------------------------------------------------------------------
    // CAMADA 4: Plataforma Orbital Citadel — Deck Mecânico e Painéis
    // -----------------------------------------------------------------------
    const outerDeckRadius = 265;
    const cannonTrenchRadius = TuningConfig.cannons.distanceFromCenter; // 235
    const combatRailMaxRadius = TuningConfig.blade.maxOrbitRadius;      // 160
    const combatRailMinRadius = TuningConfig.blade.minOrbitRadius;      // 65
    const innerPitRadius = TuningConfig.arena.coreRadius + 16;         // 48

    // 4.1 Sub-base do Deck Principal (Anel de Titânio Chanfrado)
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, outerDeckRadius + 14, 0, Math.PI * 2);
    ctx.arc(cx, cy, innerPitRadius - 6, 0, Math.PI * 2, true);
    const deckGrad = ctx.createRadialGradient(cx, cy, innerPitRadius, cx, cy, outerDeckRadius);
    deckGrad.addColorStop(0, '#090d19');
    deckGrad.addColorStop(0.5, '#0b1222');
    deckGrad.addColorStop(0.85, '#0e1628');
    deckGrad.addColorStop(1, '#070b16');
    ctx.fillStyle = deckGrad;
    ctx.fill('evenodd');

    // Borda chanfrada externa metálica com highlight superior
    ctx.strokeStyle = 'rgba(70, 110, 160, 0.45)';
    ctx.lineWidth = 3;
    ctx.stroke();

    // 4.2 Segmentação de Placas Radiais de Blindagem (16 painéis industriais)
    const numPanels = 16;
    ctx.strokeStyle = 'rgba(6, 10, 18, 0.9)';
    ctx.lineWidth = 2.5;
    for (let i = 0; i < numPanels; i++) {
      const a = (i * Math.PI * 2) / numPanels;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * innerPitRadius, cy + Math.sin(a) * innerPitRadius);
      ctx.lineTo(cx + Math.cos(a) * (outerDeckRadius + 10), cy + Math.sin(a) * (outerDeckRadius + 10));
      ctx.stroke();

      // Highlight de bisel em cada placa
      ctx.strokeStyle = 'rgba(90, 140, 200, 0.15)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a + 0.012) * innerPitRadius, cy + Math.sin(a + 0.012) * innerPitRadius);
      ctx.lineTo(cx + Math.cos(a + 0.012) * (outerDeckRadius + 8), cy + Math.sin(a + 0.012) * (outerDeckRadius + 8));
      ctx.stroke();
    }

    // 4.3 Dentes Mecânicos de Fixação Externa (48 nós hexagonais)
    const numTeeth = 48;
    for (let i = 0; i < numTeeth; i++) {
      const a = (i * Math.PI * 2) / numTeeth;
      const tx = cx + Math.cos(a) * (outerDeckRadius + 8);
      const ty = cy + Math.sin(a) * (outerDeckRadius + 8);
      ctx.fillStyle = i % 4 === 0 ? 'rgba(255, 170, 0, 0.7)' : 'rgba(50, 90, 140, 0.6)';
      ctx.beginPath();
      ctx.arc(tx, ty, i % 4 === 0 ? 3 : 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // 4.4 Trincheira dos Canhões Inimigos (Recessed Hazard Trench a 235px)
    // Sombra interna de profundidade
    ctx.beginPath();
    ctx.arc(cx, cy, cannonTrenchRadius + 16, 0, Math.PI * 2);
    ctx.arc(cx, cy, cannonTrenchRadius - 16, 0, Math.PI * 2, true);
    ctx.fillStyle = 'rgba(3, 5, 10, 0.75)';
    ctx.fill('evenodd');

    ctx.strokeStyle = 'rgba(25, 45, 75, 0.6)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Trilho de aceleração em pontilhado neon âmbar
    ctx.strokeStyle = 'rgba(255, 150, 0, 0.28)';
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 14]);
    ctx.beginPath();
    ctx.arc(cx, cy, cannonTrenchRadius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // 4.5 Zona Defensiva da Lâmina (Combat Rail entre 65px e 160px)
    // Leve banho de luz de indução ciano
    const railGrad = ctx.createRadialGradient(cx, cy, combatRailMinRadius, cx, cy, combatRailMaxRadius);
    railGrad.addColorStop(0, 'rgba(0, 240, 255, 0.015)');
    railGrad.addColorStop(0.5, 'rgba(0, 240, 255, 0.045)');
    railGrad.addColorStop(1, 'rgba(0, 240, 255, 0.015)');
    ctx.beginPath();
    ctx.arc(cx, cy, combatRailMaxRadius, 0, Math.PI * 2);
    ctx.arc(cx, cy, combatRailMinRadius, 0, Math.PI * 2, true);
    ctx.fillStyle = railGrad;
    ctx.fill('evenodd');

    // Trilho central de corrida da lâmina (raio médio ~125px)
    const midRailRadius = (combatRailMinRadius + combatRailMaxRadius) / 2;
    ctx.strokeStyle = 'rgba(0, 243, 255, 0.22)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 12]);
    ctx.beginPath();
    ctx.arc(cx, cy, midRailRadius, 0, Math.PI * 2);
    ctx.stroke();

    // Limites de segurança (mínimo e máximo) com anéis de contenção
    ctx.setLineDash([]);
    ctx.strokeStyle = 'rgba(0, 243, 255, 0.35)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(cx, cy, combatRailMaxRadius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(0, 243, 255, 0.4)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, combatRailMinRadius, 0, Math.PI * 2);
    ctx.stroke();

    // 4.6 Conduítes Energéticos Radiais conectando a trincheira ao poço do reator
    ctx.strokeStyle = 'rgba(0, 220, 255, 0.12)';
    ctx.lineWidth = 3;
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI) / 4 + Math.PI / 8;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * (innerPitRadius + 4), cy + Math.sin(a) * (innerPitRadius + 4));
      ctx.lineTo(cx + Math.cos(a) * (cannonTrenchRadius - 18), cy + Math.sin(a) * (cannonTrenchRadius - 18));
      ctx.stroke();
    }

    // 4.7 Poço de Contenção do Reator (Recessed Containment Well)
    // Sombra interna profunda criando o efeito de recesso tridimensional
    const pitGrad = ctx.createRadialGradient(cx, cy, 10, cx, cy, innerPitRadius);
    pitGrad.addColorStop(0, '#04070e');
    pitGrad.addColorStop(0.7, '#060a15');
    pitGrad.addColorStop(1, '#0e1828');
    ctx.fillStyle = pitGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, innerPitRadius, 0, Math.PI * 2);
    ctx.fill();

    // Anel chanfrado de contenção com alto contraste
    ctx.strokeStyle = 'rgba(100, 160, 230, 0.55)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(cx, cy, innerPitRadius, 0, Math.PI * 2);
    ctx.stroke();

    // 4.8 Elementos Estáticos de Enquadramento e Grade (Baking Estático Claude / LRN-021)
    ctx.strokeStyle = 'rgba(0, 243, 255, 0.024)';
    ctx.lineWidth = 1;
    for (let x = 60; x < width; x += 60) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 60; y < height; y += 60) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Cantoneiras táticas nos quatro cantos da tela (Framing de Arcade)
    const bOff = 14;
    const bLen = 22;
    ctx.strokeStyle = 'rgba(0, 243, 255, 0.35)';
    ctx.lineWidth = 2;
    // Top-Left
    ctx.beginPath();
    ctx.moveTo(bOff, bOff + bLen);
    ctx.lineTo(bOff, bOff);
    ctx.lineTo(bOff + bLen, bOff);
    ctx.stroke();
    // Top-Right
    ctx.beginPath();
    ctx.moveTo(width - bOff - bLen, bOff);
    ctx.lineTo(width - bOff, bOff);
    ctx.lineTo(width - bOff, bOff + bLen);
    ctx.stroke();
    // Bottom-Left
    ctx.beginPath();
    ctx.moveTo(bOff, height - bOff - bLen);
    ctx.lineTo(bOff, height - bOff);
    ctx.lineTo(bOff + bLen, height - bOff);
    ctx.stroke();
    // Bottom-Right
    ctx.beginPath();
    ctx.moveTo(width - bOff - bLen, height - bOff);
    ctx.lineTo(width - bOff, height - bOff);
    ctx.lineTo(width - bOff, height - bOff - bLen);
    ctx.stroke();

    // 12 marcas cibernéticas radiais na órbita dos canhões inimigos
    ctx.strokeStyle = 'rgba(0, 243, 255, 0.22)';
    ctx.lineWidth = 1.5;
    for (let a = 0; a < Math.PI * 2; a += Math.PI / 6) {
      const r1 = cannonTrenchRadius - 4;
      const r2 = cannonTrenchRadius + 4;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1);
      ctx.lineTo(cx + Math.cos(a) * r2, cy + Math.sin(a) * r2);
      ctx.stroke();
    }

    ctx.restore();

    // Injeta a textura gerada no Texture Manager do Phaser
    scene.textures.addCanvas('arena_citadel', canvas);
  }
}
