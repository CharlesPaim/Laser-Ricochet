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

  // =========================================================================
  // SHADOW DEFLECTOR (Nemesis Duel — Waves 10 / 20 / 30...) LRN-054
  // =========================================================================

  public static renderNemesis(
    g: Phaser.GameObjects.Graphics,
    n: {
      active: boolean;
      x: number;
      y: number;
      angle: number;
      radius: number;
      bladeAngle: number;
      hp: number;
      maxHp: number;
      tier: number;
      state: string;
      hitFlash: number;
      parryFlash: number;
      spawnT: number;
      ghostX: number[];
      ghostY: number[];
      ghostA: number[];
      ghostLen: number;
      rageTier: number;
    },
    cx: number,
    cy: number,
    time: number
  ): void {
    if (!n.active) return;

    const rage = Math.min(1, (n.rageTier || 0) / 6);
    const glow = n.state === 'recover' ? 0xffea00 : 0xff1744;
    const accent = n.state === 'recover' ? 0xfff59d : 0xff8fa3;
    const half = TuningConfig.nemesis.bladeHalf;

    // 1. Motion afterimages (Dash ghosts from ring-buffer)
    for (let i = 0; i < n.ghostLen; i++) {
      const k = (i + 1) / (n.ghostLen + 1);
      g.fillStyle(glow, 0.05 * k);
      g.fillCircle(n.ghostX[i], n.ghostY[i], 16 * k);
      g.lineStyle(1.2, glow, 0.16 * k);
      const ga = n.ghostA[i];
      g.lineBetween(
        n.ghostX[i] - Math.cos(ga) * half * 0.8,
        n.ghostY[i] - Math.sin(ga) * half * 0.8,
        n.ghostX[i] + Math.cos(ga) * half * 0.8,
        n.ghostY[i] + Math.sin(ga) * half * 0.8
      );
    }

    // 2. Crimson Scythe Blade (bowed outward)
    CannonRenderer.nemesisBlade(g, n, time, glow, accent, rage, cx, cy);

    // 3. Chassis / Hull
    const spawn = Math.min(1, n.spawnT || 1);
    g.save();
    g.translateCanvas(n.x, n.y);
    // Nose points inward toward the reactor center
    g.rotateCanvas(Math.atan2(cy - n.y, cx - n.x));
    if (spawn < 1) g.scaleCanvas(0.4 + 0.6 * spawn, 0.4 + 0.6 * spawn);

    // Layer 4: Menace aura halo, swells with rally rage
    g.fillStyle(glow, 0.07 + rage * 0.06);
    g.fillCircle(0, 0, 26 + rage * 10);

    // Layer 1: Inverted delta wedge chassis
    g.fillStyle(TuningConfig.nemesis.colorDark, 1);
    g.beginPath();
    g.moveTo(21, 0);
    g.lineTo(2, -9);
    g.lineTo(-13, -16);
    g.lineTo(-8, 0);
    g.lineTo(-13, 16);
    g.lineTo(2, 9);
    g.closePath();
    g.fillPath();
    g.lineStyle(1.6, glow, 0.85);
    g.strokePath();

    // Layer 2: Reinforcement ribs
    g.lineStyle(1, TuningConfig.nemesis.colorRib, 0.95);
    g.lineBetween(16, 0, -10, -13);
    g.lineBetween(16, 0, -10, 13);
    g.lineBetween(-2, -11, -2, 11);

    // Horned sensor crown
    for (const sy of [-1, 1]) {
      g.lineStyle(2.2, TuningConfig.nemesis.colorDark, 1);
      g.beginPath();
      g.moveTo(-6, sy * 12);
      g.lineTo(-16, sy * 22);
      g.lineTo(-4, sy * 19);
      g.strokePath();
      g.lineStyle(1.1, glow, 0.8);
      g.strokePath();
      g.fillStyle(accent, 0.85);
      g.fillCircle(-16, sy * 22, 1.7);
    }

    // Layer 3: Cyclopean optic with slit pupil
    const p = 0.55 + 0.45 * Math.sin(time * (n.state === 'dash' ? 16 : 5));
    g.fillStyle(glow, 0.35);
    g.fillCircle(4, 0, 9 + p * 2.5);
    g.fillStyle(glow, 0.95);
    g.fillCircle(4, 0, 4.2);
    g.fillStyle(0xffffff, 0.92 * p + 0.08);
    g.fillCircle(4, 0, 1.6);
    g.lineStyle(1.4, 0x220208, 0.9);
    g.lineBetween(4, -3.4, 4, 3.4);

    // Rear thrusters flare during dash
    const th = n.state === 'dash' ? 1 : 0.35;
    for (const sy of [-6, 6]) {
      g.fillStyle(0x140810, 1);
      g.fillRect(-14, sy - 2.6, 6, 5.2);
      g.fillStyle(glow, 0.5 + 0.4 * th * Math.abs(Math.sin(time * 22 + sy)));
      g.fillRect(-19 - th * 6, sy - 1.5, 5 + th * 6, 3);
      g.fillStyle(accent, 0.22);
      g.fillCircle(-20 - th * 6, sy, 4 + th * 3);
    }

    // Layer 5: Chassis details & telemetry LEDs
    g.fillStyle(0xcf9aa8, 0.45);
    g.fillCircle(-4, -12, 1);
    g.fillCircle(-4, 12, 1);
    g.fillCircle(10, 0, 1);

    if (n.hitFlash > 0) {
      g.fillStyle(0xffffff, Math.min(0.75, n.hitFlash));
      g.fillCircle(0, 0, 26);
    }
    g.restore();

    // 4. Vulnerability tell: RECOVER state cracks the guard open
    if (n.state === 'recover') {
      const fl = 0.45 + 0.4 * Math.sin(time * 14);
      g.lineStyle(2, 0xffea00, fl);
      g.strokeCircle(n.x, n.y, 30 + Math.sin(time * 9) * 2);
      g.lineStyle(1, 0xfff59d, fl * 0.6);
      g.strokeCircle(n.x, n.y, 38);
    }

    // 5. Parry flare when it returns a bolt
    if (n.parryFlash > 0) {
      g.fillStyle(0xff1744, 0.2 * n.parryFlash);
      g.fillCircle(n.x, n.y, 40 + (1 - n.parryFlash) * 28);
      g.lineStyle(2.4, 0xffffff, 0.8 * n.parryFlash);
      g.strokeCircle(n.x, n.y, 24 + (1 - n.parryFlash) * 26);
    }

    // 6. Boss HP bar with segmented ticks
    const bw = 88;
    const by = n.y - 54;
    g.fillStyle(0x000000, 0.6);
    g.fillRect(n.x - bw / 2, by, bw, 7);
    g.fillStyle(glow, 0.95);
    g.fillRect(n.x - bw / 2 + 1, by + 1, (bw - 2) * Math.max(0, n.hp / n.maxHp), 5);
    g.lineStyle(1, 0xffffff, 0.4);
    g.strokeRect(n.x - bw / 2, by, bw, 7);
    g.lineStyle(1, 0x000000, 0.7);
    for (let i = 1; i < n.maxHp; i++) {
      const sx = n.x - bw / 2 + (bw * i) / n.maxHp;
      g.lineBetween(sx, by + 1, sx, by + 6);
    }
  }

  private static nemesisBlade(
    g: Phaser.GameObjects.Graphics,
    n: any,
    time: number,
    glow: number,
    accent: number,
    rage: number,
    cx: number,
    cy: number
  ): void {
    const a = n.bladeAngle;
    const half = TuningConfig.nemesis.bladeHalf;
    const tanX = Math.cos(a);
    const tanY = Math.sin(a);
    const polar = Math.atan2(n.y - cy, n.x - cx);
    const radX = Math.cos(polar);
    const radY = Math.sin(polar);
    const STEPS = 14;
    const BOW = 7;

    const fill = (scale: number, color: number, alpha: number) => {
      g.fillStyle(color, alpha);
      g.beginPath();
      for (let i = 0; i <= STEPS; i++) {
        const s = -1 + (2 * i) / STEPS;
        const bulge = Math.sqrt(Math.max(0, 1 - s * s));
        const th = (1.2 + 5.4 * bulge) * scale;
        const bx = n.x + tanX * half * s + radX * BOW * bulge;
        const by = n.y + tanY * half * s + radY * BOW * bulge;
        const px = bx + radX * th;
        const py = by + radY * th;
        if (i === 0) g.moveTo(px, py);
        else g.lineTo(px, py);
      }
      for (let i = STEPS; i >= 0; i--) {
        const s = -1 + (2 * i) / STEPS;
        const bulge = Math.sqrt(Math.max(0, 1 - s * s));
        const th = (1.2 + 5.4 * bulge) * scale;
        const bx = n.x + tanX * half * s + radX * BOW * bulge;
        const by = n.y + tanY * half * s + radY * BOW * bulge;
        g.lineTo(bx - radX * th * 0.7, by - radY * th * 0.7);
      }
      g.closePath();
      g.fillPath();
    };

    fill(3.2, accent, 0.06 + rage * 0.04);
    fill(2.0, accent, 0.1);
    fill(1.3, glow, 0.38);
    fill(1.0, glow, 0.75);
    fill(0.32, 0xffffff, 0.9);

    // Carbon spine
    g.lineStyle(2.4, 0x14040a, 0.95);
    g.lineBetween(n.x - tanX * half * 0.95, n.y - tanY * half * 0.95, n.x + tanX * half * 0.95, n.y + tanY * half * 0.95);
    g.lineStyle(1, glow, 0.6);
    g.strokePath();

    // Tip emitters
    for (const s of [-1, 1]) {
      const tx = n.x + tanX * half * s;
      const ty = n.y + tanY * half * s;
      g.fillStyle(accent, 0.28);
      g.fillCircle(tx, ty, 5.5);
      g.fillStyle(0xffffff, 0.9);
      g.fillCircle(tx, ty, 1.7);
    }

    // Rage arcs
    if (rage > 0.3) {
      for (let i = 0; i < 3; i++) {
        const t0 = -1 + Math.random() * 2;
        const j = 5 + Math.random() * 8;
        g.lineStyle(1, accent, 0.7 * rage);
        g.lineBetween(
          n.x + tanX * half * t0,
          n.y + tanY * half * t0,
          n.x + tanX * half * t0 + radX * (Math.random() - 0.5) * j,
          n.y + tanY * half * t0 + radY * (Math.random() - 0.5) * j
        );
      }
    }
  }

  /** Rally link: dynamic beam between duellists during active volley */
  public static drawRallyLink(
    g: Phaser.GameObjects.Graphics,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    tier: number,
    time: number
  ): void {
    const colors = TuningConfig.nemesis.rallyColors;
    const col = colors[Math.min(tier, colors.length - 1)];
    const a = 0.1 + Math.min(0.35, tier * 0.05);
    g.lineStyle(1.2, col, a * (0.6 + 0.4 * Math.sin(time * 10)));
    g.lineBetween(x1, y1, x2, y2);
  }
}
