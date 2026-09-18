import Phaser from 'phaser';
import { TuningConfig } from '../TuningConfig';

export interface LaserOrbData {
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
}

/**
 * LaserRenderer — Projéteis como Descargas de Plasma de Alta Energia (v3.0)
 * Transforma os projéteis em munição energética autêntica:
 * 1. Cápsula aerodinâmica em gota com ponta superaquecida branca.
 * 2. Manto de plasma saturado na cor do arquétipo.
 * 3. Cauda em cometa trançada com filamento central e atenuação quadrática.
 * 4. Geometrias específicas:
 *    - Sniper: agulha hiper-acelerada com rastro iônico.
 *    - Heavy: esfera densa de fusão com corona borbulhante.
 *    - Mega-Beam: pilar de plasma de alto calibre com diamantes de choque.
 */
export class LaserRenderer {
  public static render(
    g: Phaser.GameObjects.Graphics,
    lasers: LaserOrbData[],
    now: number
  ): void {
    for (const laser of lasers) {
      let color: number = laser.isReflected
        ? TuningConfig.laser.colorReflected
        : TuningConfig.laser.colorEnemy;

      if (laser.isOverloadShard) {
        color = TuningConfig.laser.colorOverload;
      } else if (laser.isMegaBeam) {
        color = laser.isReflected ? 0x00ff88 : 0xff003c;
      } else if (laser.isHeavy) {
        color = laser.isReflected ? 0x00f3ff : TuningConfig.laser.colorHeavy;
      } else if (laser.isSniper && !laser.isReflected) {
        color = TuningConfig.laser.colorSniper;
      }

      const speed = Math.hypot(laser.vx, laser.vy) || 1;
      const dirX = laser.vx / speed;
      const dirY = laser.vy / speed;

      // ---------------------------------------------------------------------
      // 1. MEGA-BEAM (Colossal Roaring Energy Pillar)
      // ---------------------------------------------------------------------
      if (laser.isMegaBeam) {
        const tailLen = 55;
        // Halo de dispersão massiva
        g.fillStyle(color, 0.28);
        g.fillCircle(laser.x, laser.y, laser.radius + 14);

        // Diamantes de choque ao longo do raio
        for (let d = 1; d <= 3; d++) {
          const dx = laser.x - dirX * (d * 14);
          const dy = laser.y - dirY * (d * 14);
          const diamR = laser.radius * (1 - d * 0.2);
          g.lineStyle(2, 0xffffff, 0.8 - d * 0.2);
          g.strokeCircle(dx, dy, diamR);
        }

        // Cauda de cometa espessa
        g.lineStyle(12, color, 0.75);
        g.lineBetween(laser.x, laser.y, laser.x - dirX * tailLen, laser.y - dirY * tailLen);

        // Núcleo branco denso
        g.lineStyle(5.5, 0xffffff, 0.95);
        g.lineBetween(laser.x, laser.y, laser.x - dirX * (tailLen * 0.6), laser.y - dirY * (tailLen * 0.6));

        // Cabeça do projétil
        g.fillStyle(color, 0.95);
        g.fillCircle(laser.x, laser.y, laser.radius);
        g.fillStyle(0xffffff, 1.0);
        g.fillCircle(laser.x, laser.y, laser.radius * 0.65);
        continue;
      }

      // ---------------------------------------------------------------------
      // 2. HEAVY PLASMA (Esfera Densa de Fusão)
      // ---------------------------------------------------------------------
      if (laser.isHeavy) {
        const tailLen = 28;
        const wobble = Math.sin(now * 0.03 + laser.x) * 1.5;

        // Corona borbulhante externa
        g.fillStyle(color, 0.25);
        g.fillCircle(laser.x, laser.y, laser.radius + 7 + wobble);

        // Rastro cometa denso
        g.lineStyle(9, color, 0.7);
        g.lineBetween(laser.x, laser.y, laser.x - dirX * tailLen, laser.y - dirY * tailLen);

        // Núcleo cometa branco
        g.lineStyle(4, 0xffffff, 0.9);
        g.lineBetween(laser.x, laser.y, laser.x - dirX * (tailLen * 0.5), laser.y - dirY * (tailLen * 0.5));

        // Núcleo fundido
        g.fillStyle(color, 0.92);
        g.fillCircle(laser.x, laser.y, laser.radius);
        g.fillStyle(0xffffff, 1.0);
        g.fillCircle(laser.x, laser.y, laser.radius * 0.5);
        continue;
      }

      // ---------------------------------------------------------------------
      // 3. SNIPER BOLT (Agulha Hiper-Acelerada de Trilho Gauss)
      // ---------------------------------------------------------------------
      if (laser.isSniper) {
        const tailLen = 42;
        // Rastro iônico fino de alta voltagem
        g.lineStyle(6, color, 0.6);
        g.lineBetween(laser.x, laser.y, laser.x - dirX * tailLen, laser.y - dirY * tailLen);

        g.lineStyle(2, 0xffffff, 1.0);
        g.lineBetween(laser.x, laser.y, laser.x - dirX * (tailLen * 0.85), laser.y - dirY * (tailLen * 0.85));

        // Cabeça cônica aerodinâmica em agulha
        g.fillStyle(color, 0.9);
        g.fillCircle(laser.x, laser.y, laser.radius);
        g.fillStyle(0xffffff, 1.0);
        g.fillCircle(laser.x, laser.y, laser.radius * 0.55);
        continue;
      }

      // ---------------------------------------------------------------------
      // 4. HARMONIC SINE WAVE BOLT (Oscilação Senoidal Ondulante)
      // ---------------------------------------------------------------------
      if (laser.trajectoryType === 'sine' && !laser.isReflected) {
        const sineColor = 0xff00cc;
        const tailLen = 28;
        const perpX = -dirY;
        const perpY = dirX;
        const wave = Math.sin(now * 0.02 + (laser.sinePhase || 0)) * 4;

        // Halo pulsante duplo
        g.fillStyle(sineColor, 0.35);
        g.fillCircle(laser.x, laser.y, laser.radius + 6);
        g.fillStyle(0x00f3ff, 0.25);
        g.fillCircle(laser.x + perpX * wave, laser.y + perpY * wave, laser.radius + 3);

        // Cauda com ondulação harmônica
        g.lineStyle(6, sineColor, 0.8);
        g.lineBetween(laser.x, laser.y, laser.x - dirX * tailLen + perpX * wave, laser.y - dirY * tailLen + perpY * wave);

        // Filamento elétrico central
        g.lineStyle(2.5, 0xffffff, 0.95);
        g.lineBetween(laser.x, laser.y, laser.x - dirX * (tailLen * 0.6), laser.y - dirY * (tailLen * 0.6));

        // Cabeça do projétil
        g.fillStyle(sineColor, 0.95);
        g.fillCircle(laser.x, laser.y, laser.radius + 1);
        g.fillStyle(0xffffff, 1.0);
        g.fillCircle(laser.x, laser.y, laser.radius * 0.55);
        continue;
      }

      // ---------------------------------------------------------------------
      // 5. STANDARD & OVERLOAD / REFLECTED SHARDS (Plasma Sleek Bolt)
      // ---------------------------------------------------------------------
      const tailLen = laser.isOverloadShard ? 30 : 22;
      const mainWidth = laser.isOverloadShard ? 7 : 5;

      // Cauda de cometa com gradiente de largura
      g.lineStyle(mainWidth, color, 0.7);
      g.lineBetween(laser.x, laser.y, laser.x - dirX * tailLen, laser.y - dirY * tailLen);

      // Filamento central incandescente
      g.lineStyle(mainWidth * 0.45, 0xffffff, 0.95);
      g.lineBetween(laser.x, laser.y, laser.x - dirX * (tailLen * 0.5), laser.y - dirY * (tailLen * 0.5));

      // Halo difuso
      g.fillStyle(color, 0.3);
      g.fillCircle(laser.x, laser.y, laser.radius + 5);

      // Corpo da gota de plasma
      g.fillStyle(color, 0.9);
      g.fillCircle(laser.x, laser.y, laser.radius);

      // Ponta superaquecida branca
      g.fillStyle(0xffffff, 1.0);
      g.fillCircle(laser.x, laser.y, laser.radius * 0.52);
    }
  }
}
