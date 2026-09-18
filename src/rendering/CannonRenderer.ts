import Phaser from 'phaser';
import { TuningConfig } from '../TuningConfig';

export type CannonType = 'standard' | 'heavy' | 'sniper' | 'scatter' | 'boss';

export interface CannonData {
  id: number;
  x: number;
  y: number;
  radius: number;
  orbitAngle: number;
  orbitSpeed: number;
  type: CannonType;
  hp: number;
  maxHp: number;
  angle: number;
  nextFireTime: number;
  isDestroyed: boolean;
  hitFlashTimerMs: number;
  isEnraged: boolean;
  attackCycle?: number;
  color: number;
  bossPhase?: 'barrage' | 'vulnerable';
  bossPhaseTimerMs?: number;
  bossChargingMegaBeam?: boolean;
  shieldHp?: number;
  maxShieldHp?: number;
  recoilOffset?: number;
  spawnTimeMs?: number;
}

/**
 * CannonRenderer — Naves de Combate Militar Sci-Fi (v3.0)
 * Renderiza os inimigos seguindo a regra de materialidade:
 * BASE + STRUCTURE + EMISSIVE CORE + LIGHT + DETAIL.
 */
export class CannonRenderer {
  public static render(
    g: Phaser.GameObjects.Graphics,
    cannons: CannonData[],
    cx: number,
    cy: number,
    now: number
  ): void {
    for (const c of cannons) {
      const cradius = c.radius || TuningConfig.cannons.radius;
      const recoilDist = c.recoilOffset || 0;
      const drawX = c.x - Math.cos(c.angle) * recoilDist;
      const drawY = c.y - Math.sin(c.angle) * recoilDist;

      // ---------------------------------------------------------------------
      // 1. Destroços de Carcaça Queimada (Wreckage Metálico Residual)
      // ---------------------------------------------------------------------
      if (c.isDestroyed) {
        g.fillStyle(0x070a12, 0.9);
        g.fillCircle(drawX, drawY, cradius * 0.65);
        g.lineStyle(1.5, 0x141c2c, 0.85);
        g.strokeCircle(drawX, drawY, cradius * 0.65);

        for (let w = 0; w < 3; w++) {
          const wa = (w * Math.PI * 2) / 3 + 0.3;
          g.fillStyle(0x0e1522, 0.95);
          g.fillCircle(drawX + Math.cos(wa) * (cradius * 0.5), drawY + Math.sin(wa) * (cradius * 0.5), 3.5);
        }
        continue;
      }

      // ---------------------------------------------------------------------
      // 2. Teleporte / Warp-In Holográfico de Surgimento (Primeiros 350ms)
      // ---------------------------------------------------------------------
      const spawnAge = now - (c.spawnTimeMs || 0);
      if (spawnAge >= 0 && spawnAge < 350) {
        const prog = spawnAge / 350;
        const ringColor = c.type === 'boss' ? 0xff0055 : 0x00f3ff;
        g.lineStyle(2.5 * (1 - prog), ringColor, (1 - prog) * 0.9);
        g.strokeCircle(drawX, drawY, cradius + prog * 30);
        g.lineStyle(1.5 * (1 - prog), 0xffffff, (1 - prog) * 0.8);
        g.strokeCircle(drawX, drawY, cradius + prog * 15);
      }

      // ---------------------------------------------------------------------
      // 3. Telegrafia de Mira e Carregamento de Tiro
      // ---------------------------------------------------------------------
      const timeUntilShot = c.nextFireTime - now;
      const aliveCount = cannons.filter((item) => !item.isDestroyed).length;
      const isLoneDuel = aliveCount === 1 || c.isEnraged;
      const telegraphDuration = isLoneDuel
        ? TuningConfig.cannons.loneDuelTelegraphMs
        : c.type === 'sniper'
        ? TuningConfig.cannons.sniperTelegraphDurationMs
        : TuningConfig.cannons.telegraphDurationMs;

      if (timeUntilShot > 0 && timeUntilShot <= telegraphDuration) {
        const chargeRatio = 1 - timeUntilShot / telegraphDuration;

        // Mira laser de alta precisão para o Sniper
        if (c.type === 'sniper') {
          g.lineStyle(1.8, 0x00f3ff, 0.4 + 0.6 * chargeRatio);
          g.lineBetween(drawX, drawY, cx, cy);
          g.strokeCircle(cx, cy, 14 * (1 - chargeRatio * 0.5));
          g.fillStyle(0x00f3ff, 0.8 * chargeRatio);
          g.fillCircle(cx, cy, 3.5);
        }

        // Esfera de energia acumulando no cano
        const glowCol = c.isEnraged ? 0xff1144 : c.color || 0x00f3ff;
        g.fillStyle(glowCol, 0.35 * chargeRatio);
        g.fillCircle(drawX, drawY, cradius + 16 * chargeRatio);
        g.lineStyle(2, 0xffffff, 0.9 * chargeRatio);
        g.strokeCircle(drawX, drawY, cradius + 16 * chargeRatio);
      }

      // ---------------------------------------------------------------------
      // 4. Renderização por Arquétipo Militar Específico
      // ---------------------------------------------------------------------
      switch (c.type) {
        case 'boss':
          this.drawBoss(g, drawX, drawY, cradius, c, now);
          break;
        case 'sniper':
          this.drawSniper(g, drawX, drawY, cradius, c, now);
          break;
        case 'scatter':
          this.drawScatter(g, drawX, drawY, cradius, c, now);
          break;
        case 'heavy':
          this.drawHeavy(g, drawX, drawY, cradius, c, now);
          break;
        case 'standard':
        default:
          this.drawStandard(g, drawX, drawY, cradius, c, now);
          break;
      }
    }
  }

  // -------------------------------------------------------------------------
  // STANDARD: Caça Interceptor Delta de Vanguarda
  // -------------------------------------------------------------------------
  private static drawStandard(
    g: Phaser.GameObjects.Graphics,
    x: number,
    y: number,
    r: number,
    c: CannonData,
    now: number
  ): void {
    const fx = Math.cos(c.angle);
    const fy = Math.sin(c.angle);
    const nx = -fy;
    const ny = fx;

    // Fuselagem Delta Triangular com Asas Enflechadas
    const pNose = new Phaser.Math.Vector2(x + fx * (r + 5), y + fy * (r + 5));
    const pWingR = new Phaser.Math.Vector2(x - fx * (r * 0.4) + nx * (r * 1.1), y - fy * (r * 0.4) + ny * (r * 1.1));
    const pRearR = new Phaser.Math.Vector2(x - fx * (r * 0.85) + nx * (r * 0.42), y - fy * (r * 0.85) + ny * (r * 0.42));
    const pNotch = new Phaser.Math.Vector2(x - fx * (r * 0.6), y - fy * (r * 0.6));
    const pRearL = new Phaser.Math.Vector2(x - fx * (r * 0.85) - nx * (r * 0.42), y - fy * (r * 0.85) - ny * (r * 0.42));
    const pWingL = new Phaser.Math.Vector2(x - fx * (r * 0.4) - nx * (r * 1.1), y - fy * (r * 0.4) - ny * (r * 1.1));

    const poly = [pNose, pWingR, pRearR, pNotch, pRearL, pWingL];

    // Base de liga metálica escura
    g.fillStyle(0x0b101c, 0.96);
    g.fillPoints(poly, true);

    const isHit = c.hitFlashTimerMs > 0;
    const outlineColor = isHit ? 0xffffff : c.isEnraged ? 0xff1744 : 0xff2a6d;

    // Placas de blindagem chanfradas com linha de contorno
    g.lineStyle(2.8, outlineColor, 1.0);
    g.strokePoints(poly, true);

    // Propulsores Traseiros com Plumas de Íons
    const thrustFlame = 0.7 + 0.3 * Math.sin(now * 0.04 + c.id);
    g.fillStyle(0x00f3ff, thrustFlame);
    g.fillCircle(pRearR.x - fx * 3, pRearR.y - fy * 3, 2.5);
    g.fillCircle(pRearL.x - fx * 3, pRearL.y - fy * 3, 2.5);

    // Sensor Óptico Central de Aquisição de Alvos
    g.fillStyle(outlineColor, 0.95);
    g.fillCircle(x + fx * 2, y + fy * 2, 4.2);
    g.fillStyle(0xffffff, 1.0);
    g.fillCircle(x + fx * 2, y + fy * 2, 1.8);

    // Cano Heavy Blaster de Alta Resistência
    g.lineStyle(4.5, 0xffffff, 0.95);
    g.lineBetween(x + fx * (r * 0.5), y + fy * (r * 0.5), x + fx * (r + 11), y + fy * (r + 11));
    g.lineStyle(2, outlineColor, 0.8);
    g.lineBetween(x + fx * (r * 0.7), y + fy * (r * 0.7), x + fx * (r + 11), y + fy * (r + 11));
  }

  // -------------------------------------------------------------------------
  // HEAVY: Casamata Blindada em Diamante Chanfrado
  // -------------------------------------------------------------------------
  private static drawHeavy(
    g: Phaser.GameObjects.Graphics,
    x: number,
    y: number,
    r: number,
    c: CannonData,
    now: number
  ): void {
    const fx = Math.cos(c.angle);
    const fy = Math.sin(c.angle);
    const nx = -fy;
    const ny = fx;

    const pFront = new Phaser.Math.Vector2(x + fx * (r + 6), y + fy * (r + 6));
    const pFrontR = new Phaser.Math.Vector2(x + fx * (r * 0.35) + nx * (r * 1.15), y + fy * (r * 0.35) + ny * (r * 1.15));
    const pRearR = new Phaser.Math.Vector2(x - fx * (r * 0.75) + nx * (r * 0.85), y - fy * (r * 0.75) + ny * (r * 0.85));
    const pRear = new Phaser.Math.Vector2(x - fx * (r * 0.92), y - fy * (r * 0.92));
    const pRearL = new Phaser.Math.Vector2(x - fx * (r * 0.75) - nx * (r * 0.85), y - fy * (r * 0.75) - ny * (r * 0.85));
    const pFrontL = new Phaser.Math.Vector2(x + fx * (r * 0.35) - nx * (r * 1.15), y + fy * (r * 0.35) - ny * (r * 1.15));

    const poly = [pFront, pFrontR, pRearR, pRear, pRearL, pFrontL];

    g.fillStyle(0x131722, 0.96);
    g.fillPoints(poly, true);

    const isHit = c.hitFlashTimerMs > 0;
    const outlineColor = isHit ? 0xffffff : c.isEnraged ? 0xff1744 : 0xff9900;

    g.lineStyle(3.8, outlineColor, 1.0);
    g.strokePoints(poly, true);

    // Costuras de Blindagem Dupla e Rebites de Titânio
    g.lineStyle(1.8, 0x36445a, 0.9);
    g.lineBetween(pFrontL.x, pFrontL.y, pFrontR.x, pFrontR.y);
    g.lineBetween(pRearL.x, pRearL.y, pRearR.x, pRearR.y);

    // Núcleo de Fusão Âmbar Rotativo
    const coreColor = c.hp === 2 ? 0xff9900 : 0xff3b00;
    g.fillStyle(coreColor, 0.95);
    g.fillCircle(x, y, 6.5);
    g.fillStyle(0xffffff, 1.0);
    g.fillCircle(x, y, 2.8);

    // Cano Maciço de Morteiro de Plasma
    g.lineStyle(9, 0x222c3d, 1.0);
    g.lineBetween(x + fx * (r * 0.4), y + fy * (r * 0.4), x + fx * (r + 14), y + fy * (r + 14));
    g.lineStyle(4, outlineColor, 0.95);
    g.lineBetween(x + fx * (r * 0.7), y + fy * (r * 0.7), x + fx * (r + 15), y + fy * (r + 15));
  }

  // -------------------------------------------------------------------------
  // SNIPER: Fragata em Agulha com Trilhos Gauss Aceleradores
  // -------------------------------------------------------------------------
  private static drawSniper(
    g: Phaser.GameObjects.Graphics,
    x: number,
    y: number,
    r: number,
    c: CannonData,
    now: number
  ): void {
    const fx = Math.cos(c.angle);
    const fy = Math.sin(c.angle);
    const nx = -fy;
    const ny = fx;

    // Chassi alongado em agulha aerodinâmica
    const pTip = new Phaser.Math.Vector2(x + fx * (r + 16), y + fy * (r + 16));
    const pRailR = new Phaser.Math.Vector2(x + fx * (r * 0.2) + nx * (r * 0.6), y + fy * (r * 0.2) + ny * (r * 0.6));
    const pRearR = new Phaser.Math.Vector2(x - fx * (r * 0.9) + nx * (r * 0.35), y - fy * (r * 0.9) + ny * (r * 0.35));
    const pEngine = new Phaser.Math.Vector2(x - fx * (r * 0.75), y - fy * (r * 0.75));
    const pRearL = new Phaser.Math.Vector2(x - fx * (r * 0.9) - nx * (r * 0.35), y - fy * (r * 0.9) - ny * (r * 0.35));
    const pRailL = new Phaser.Math.Vector2(x + fx * (r * 0.2) - nx * (r * 0.6), y + fy * (r * 0.2) - ny * (r * 0.6));

    const poly = [pTip, pRailR, pRearR, pEngine, pRearL, pRailL];

    g.fillStyle(0x0c1322, 0.96);
    g.fillPoints(poly, true);

    const isHit = c.hitFlashTimerMs > 0;
    const outlineColor = isHit ? 0xffffff : c.isEnraged ? 0xff1744 : 0x05d9e8;

    g.lineStyle(2.8, outlineColor, 1.0);
    g.strokePoints(poly, true);

    // Trilhos Gauss Paralelos de Indução Magnética
    g.lineStyle(2, 0x00f3ff, 0.85);
    g.lineBetween(x + fx * 4 + nx * 5, y + fy * 4 + ny * 5, pTip.x + nx * 3, pTip.y + ny * 3);
    g.lineBetween(x + fx * 4 - nx * 5, y + fy * 4 - ny * 5, pTip.x - nx * 3, pTip.y - ny * 3);

    // Bobinas de Indução Transversais
    for (let b = 1; b <= 3; b++) {
      const bx = x + fx * (b * 6);
      const by = y + fy * (b * 6);
      g.lineStyle(1.5, 0xffea00, 0.8);
      g.lineBetween(bx + nx * 4.5, by + ny * 4.5, bx - nx * 4.5, by - ny * 4.5);
    }

    // Emissor Tungstênio Incandescente
    g.fillStyle(0xffffff, 1.0);
    g.fillCircle(pTip.x, pTip.y, 2.5);
  }

  // -------------------------------------------------------------------------
  // SCATTER: Catamarã Duplo de Supressão em Área
  // -------------------------------------------------------------------------
  private static drawScatter(
    g: Phaser.GameObjects.Graphics,
    x: number,
    y: number,
    r: number,
    c: CannonData,
    now: number
  ): void {
    const fx = Math.cos(c.angle);
    const fy = Math.sin(c.angle);
    const nx = -fy;
    const ny = fx;

    // Casco Duplo de Catamarã Articulado com Ponte Central
    const pFrontR = new Phaser.Math.Vector2(x + fx * (r + 7) + nx * (r * 0.75), y + fy * (r + 7) + ny * (r * 0.75));
    const pRearR = new Phaser.Math.Vector2(x - fx * (r * 0.8) + nx * (r * 0.9), y - fy * (r * 0.8) + ny * (r * 0.9));
    const pBridgeR = new Phaser.Math.Vector2(x - fx * (r * 0.1) + nx * (r * 0.25), y - fy * (r * 0.1) + ny * (r * 0.25));
    const pBridgeL = new Phaser.Math.Vector2(x - fx * (r * 0.1) - nx * (r * 0.25), y - fy * (r * 0.1) - ny * (r * 0.25));
    const pRearL = new Phaser.Math.Vector2(x - fx * (r * 0.8) - nx * (r * 0.9), y - fy * (r * 0.8) - ny * (r * 0.9));
    const pFrontL = new Phaser.Math.Vector2(x + fx * (r + 7) - nx * (r * 0.75), y + fy * (r + 7) - ny * (r * 0.75));

    g.fillStyle(0x130e1d, 0.96);
    g.fillPoints([pFrontR, pRearR, pBridgeR, pBridgeL, pRearL, pFrontL], true);

    const isHit = c.hitFlashTimerMs > 0;
    const outlineColor = isHit ? 0xffffff : c.isEnraged ? 0xff1744 : 0xa020f0;

    g.lineStyle(2.8, outlineColor, 1.0);
    g.strokePoints([pFrontR, pRearR, pBridgeR, pBridgeL, pRearL, pFrontL], true);

    // Canos Duplos Paralelos em Magenta
    g.lineStyle(4.5, 0xffffff, 0.95);
    g.lineBetween(x + nx * (r * 0.75), y + ny * (r * 0.75), pFrontR.x, pFrontR.y);
    g.lineBetween(x - nx * (r * 0.75), y - ny * (r * 0.75), pFrontL.x, pFrontL.y);

    // Capacitores Rítmicos Roxo Neon
    g.fillStyle(outlineColor, 0.95);
    g.fillCircle(x + nx * (r * 0.45), y + ny * (r * 0.45), 3.5);
    g.fillCircle(x - nx * (r * 0.45), y - ny * (r * 0.45), 3.5);
  }

  // -------------------------------------------------------------------------
  // DREADNOUGHT BOSS: Nau Capitânia Multi-Deck
  // -------------------------------------------------------------------------
  private static drawBoss(
    g: Phaser.GameObjects.Graphics,
    x: number,
    y: number,
    r: number,
    c: CannonData,
    now: number
  ): void {
    const fx = Math.cos(c.angle);
    const fy = Math.sin(c.angle);
    const nx = -fy;
    const ny = fx;

    // Superestrutura Pesada Multi-Deck com Proa Angular
    const pBow = new Phaser.Math.Vector2(x + fx * (r + 16), y + fy * (r + 16));
    const pFrontR = new Phaser.Math.Vector2(x + fx * (r * 0.55) + nx * (r * 1.2), y + fy * (r * 0.55) + ny * (r * 1.2));
    const pMidR = new Phaser.Math.Vector2(x - fx * (r * 0.15) + nx * (r * 1.35), y - fy * (r * 0.15) + ny * (r * 1.35));
    const pSternR = new Phaser.Math.Vector2(x - fx * (r * 0.85) + nx * (r * 0.75), y - fy * (r * 0.85) + ny * (r * 0.75));
    const pStern = new Phaser.Math.Vector2(x - fx * (r * 0.75), y - fy * (r * 0.75));
    const pSternL = new Phaser.Math.Vector2(x - fx * (r * 0.85) - nx * (r * 0.75), y - fy * (r * 0.85) - ny * (r * 0.75));
    const pMidL = new Phaser.Math.Vector2(x - fx * (r * 0.15) - nx * (r * 1.35), y - fy * (r * 0.15) - ny * (r * 1.35));
    const pFrontL = new Phaser.Math.Vector2(x + fx * (r * 0.55) - nx * (r * 1.2), y + fy * (r * 0.55) - ny * (r * 1.2));

    const poly = [pBow, pFrontR, pMidR, pSternR, pStern, pSternL, pMidL, pFrontL];

    g.fillStyle(0x160a12, 0.98);
    g.fillPoints(poly, true);

    const isHit = c.hitFlashTimerMs > 0;
    const outlineColor = isHit ? 0xffffff : 0xff003c;
    g.lineStyle(4.5, outlineColor, 1.0);
    g.strokePoints(poly, true);

    // Baterias Triplas de Railgun Pesado com Bocais Incandescentes
    g.lineStyle(5, 0xffffff, 0.95);
    for (const angleOff of [-0.22, 0, 0.22]) {
      const a = c.angle + angleOff;
      const ex = x + Math.cos(a) * (r + 19);
      const ey = y + Math.sin(a) * (r + 19);
      g.lineBetween(x, y, ex, ey);
      g.fillStyle(0xff003c, 0.95);
      g.fillCircle(ex, ey, 3.8);
    }

    // Estado do Escudo Frontal vs. Reator Vulnerável
    if (c.bossPhase === 'barrage') {
      const shieldAngle = c.angle;
      const shieldRadius = TuningConfig.cannons.bossShieldRadius;
      const shimmer = Math.sin(now * 0.01) * 0.2;
      const sHp = c.shieldHp ?? 3;
      const shieldColor = sHp >= 3 ? 0x00f3ff : sHp === 2 ? 0xffea00 : 0xff1744;

      // Arco de Escudo Holográfico
      g.lineStyle(5, shieldColor, 0.85 + shimmer);
      g.beginPath();
      g.arc(x, y, shieldRadius, shieldAngle - 0.75, shieldAngle + 0.75, false);
      g.strokePath();

      // Pips Retangulares de Integridade do Escudo
      const maxPips = c.maxShieldHp || 3;
      const pipW = Math.max(10, Math.floor(48 / maxPips));
      const pipH = 4;
      const totalPipW = pipW * maxPips + 4 * (maxPips - 1);
      const startPipX = x - totalPipW / 2;
      const pipY = y - r - 10;
      for (let s = 0; s < maxPips; s++) {
        const isFilled = s < sHp;
        g.fillStyle(isFilled ? 0x00f3ff : 0x222a3d, 0.95);
        g.fillRect(startPipX + s * (pipW + 4), pipY, pipW, pipH);
      }

      // Nós Flutuantes de Escudo Orbitando a Carcaça
      for (let sp = 0; sp < maxPips; sp++) {
        const spAngle = c.angle + Math.PI + (sp - (maxPips - 1) / 2) * 0.38;
        const spX = x + Math.cos(spAngle) * (r + 17);
        const spY = y + Math.sin(spAngle) * (r + 17);
        if (sp < sHp) {
          g.fillStyle(0xffea00, 0.95);
          g.fillCircle(spX, spY, 3.8);
          g.fillStyle(0xffffff, 1.0);
          g.fillCircle(spX, spY, 1.8);
        } else {
          g.fillStyle(0x332200, 0.35);
          g.fillCircle(spX, spY, 2.5);
        }
      }
    } else {
      // Reator Exposto Superaquecido (Vulnerable Core)
      const pulse = Math.sin(now * 0.025) * 4;
      g.fillStyle(0xff003c, 0.45);
      g.fillCircle(x, y, 18 + pulse);
      g.fillStyle(0xffea00, 0.95);
      g.fillCircle(x, y, 11);
      g.fillStyle(0xffffff, 1.0);
      g.fillCircle(x, y, 5.5);

      // Retículo de alerta de dano crítico
      g.lineStyle(2, 0xffea00, 0.95);
      g.strokeCircle(x, y, 24 + pulse);
    }

    // Barra de Vida com Moldura Cyber
    const barW = 70;
    const barH = 7;
    const barX = x - barW / 2;
    const barY = y - r - 24;
    g.fillStyle(0x0a0e1c, 0.88);
    g.fillRect(barX - 1, barY - 1, barW + 2, barH + 2);
    const hpPct = Math.max(0, c.hp / c.maxHp);
    g.fillStyle(c.bossPhase === 'vulnerable' ? 0xffea00 : 0xff003c, 0.95);
    g.fillRect(barX, barY, barW * hpPct, barH);
    g.lineStyle(1.5, 0x00f3ff, 0.85);
    g.strokeRect(barX - 1, barY - 1, barW + 2, barH + 2);
  }
}
