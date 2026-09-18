import Phaser from 'phaser';
import { TuningConfig } from '../TuningConfig';

export interface SparkData {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: number;
}

export interface DeflectVectorData {
  startX: number;
  startY: number;
  dirX: number;
  dirY: number;
  life: number;
  maxLife: number;
  color: number;
}

export interface ExplosionDebrisData {
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

export interface ShockwaveRingData {
  x: number;
  y: number;
  currentRadius: number;
  maxRadius: number;
  color: number;
  life: number;
  maxLife: number;
}

export interface PowerUpItemData {
  id: number;
  x: number;
  y: number;
  type: string;
  radius: number;
  color: number;
  label: string;
  orbitAngle: number;
  orbitRadius: number;
  lifeTimeRemainingMs: number;
  maxLifeTimeMs: number;
}

export interface FlyingFragmentParticleData {
  active: boolean;
  startX: number;
  startY: number;
  controlX: number;
  controlY: number;
  targetX: number;
  targetY: number;
  progress: number;
  speed: number;
  color: number;
  value: number;
}

/**
 * EffectsRenderer — Sistema de Partículas e Efeitos Cinematográficos (v4.0)
 * Renderiza feedback de destruição, ricochete, partículas de plasma, orbes de power-up e fragmentos voadores Bezier.
 */
export class EffectsRenderer {
  public static renderFlyingFragments(
    g: Phaser.GameObjects.Graphics,
    fragments: FlyingFragmentParticleData[]
  ): void {
    for (const f of fragments) {
      if (!f.active) continue;
      const t = f.progress;
      const invT = 1 - t;
      // Curva Bezier Quadrática: B(t) = (1-t)^2 P0 + 2(1-t)t P1 + t^2 P2
      const curX = invT * invT * f.startX + 2 * invT * t * f.controlX + t * t * f.targetX;
      const curY = invT * invT * f.startY + 2 * invT * t * f.controlY + t * t * f.targetY;

      // Halo difuso
      g.fillStyle(f.color, 0.45);
      g.fillCircle(curX, curY, 9);

      // Orbe de plasma condensado
      g.fillStyle(f.color, 0.95);
      g.fillCircle(curX, curY, 5);

      // Núcleo incandescente branco
      g.fillStyle(0xffffff, 1.0);
      g.fillCircle(curX, curY, 2.8);

      // Rastro iônico
      const prevT = Math.max(0, t - 0.08);
      const prevInvT = 1 - prevT;
      const trailX = prevInvT * prevInvT * f.startX + 2 * prevInvT * prevT * f.controlX + prevT * prevT * f.targetX;
      const trailY = prevInvT * prevInvT * f.startY + 2 * prevInvT * prevT * f.controlY + prevT * prevT * f.targetY;
      g.lineStyle(2.5, f.color, 0.7);
      g.lineBetween(curX, curY, trailX, trailY);
    }
  }
  public static renderShockwaves(
    g: Phaser.GameObjects.Graphics,
    shockwaves: ShockwaveRingData[]
  ): void {
    for (const sw of shockwaves) {
      const alpha = Math.max(0, sw.life / sw.maxLife);
      g.lineStyle(3, sw.color, alpha * 0.9);
      g.strokeCircle(sw.x, sw.y, sw.currentRadius);
      g.lineStyle(1.5, 0xffffff, alpha * 0.7);
      g.strokeCircle(sw.x, sw.y, Math.max(1, sw.currentRadius - 3));
    }
  }

  public static renderDebris(
    g: Phaser.GameObjects.Graphics,
    debris: ExplosionDebrisData[]
  ): void {
    for (const d of debris) {
      const alpha = Math.max(0, d.life / d.maxLife);
      g.fillStyle(d.color, alpha);
      const cosR = Math.cos(d.rotation) * d.size;
      const sinR = Math.sin(d.rotation) * d.size;
      const poly = [
        new Phaser.Math.Vector2(d.x + cosR, d.y + sinR),
        new Phaser.Math.Vector2(d.x - sinR * 0.7, d.y + cosR * 0.7),
        new Phaser.Math.Vector2(d.x - cosR, d.y - sinR),
      ];
      g.fillPoints(poly, true);
      g.lineStyle(1, 0xffffff, alpha * 0.5);
      g.strokePoints(poly, true);
    }
  }

  public static renderSparks(
    g: Phaser.GameObjects.Graphics,
    sparks: SparkData[]
  ): void {
    for (const s of sparks) {
      const alpha = Math.max(0, s.life / s.maxLife);
      g.fillStyle(s.color, alpha);
      g.fillCircle(s.x, s.y, 3);
    }
  }

  public static renderDeflectVectors(
    g: Phaser.GameObjects.Graphics,
    deflectVectors: DeflectVectorData[]
  ): void {
    for (const dv of deflectVectors) {
      const alpha = Math.max(0, dv.life / dv.maxLife);
      const beamLen = 65 * (0.6 + 0.4 * (1 - alpha));
      g.lineStyle(3.5, dv.color, alpha * 0.95);
      g.lineBetween(
        dv.startX,
        dv.startY,
        dv.startX + dv.dirX * beamLen,
        dv.startY + dv.dirY * beamLen
      );
      g.fillStyle(0xffffff, alpha);
      g.fillCircle(dv.startX, dv.startY, 4);
    }
  }

  public static renderPowerups(
    g: Phaser.GameObjects.Graphics,
    powerups: PowerUpItemData[],
    now: number
  ): void {
    for (const p of powerups) {
      const bob = Math.sin(now * 0.008 + p.id) * 3;
      const lifeRatio = Math.max(0, p.lifeTimeRemainingMs / p.maxLifeTimeMs);
      const isExpiring = p.lifeTimeRemainingMs < 2000;
      const flash = isExpiring && Math.sin(now * 0.02) > 0;

      // Anel decrescente de tempo de vida
      g.lineStyle(2.5, flash ? 0xff0044 : p.color, 0.88);
      g.beginPath();
      g.arc(
        p.x,
        p.y + bob,
        p.radius + 7,
        -Math.PI / 2,
        -Math.PI / 2 + Math.PI * 2 * lifeRatio,
        false
      );
      g.strokePath();

      // Halo de beacon pulsante
      g.fillStyle(p.color, flash ? 0.6 : 0.35);
      g.fillCircle(p.x, p.y + bob, p.radius + 4);

      // Núcleo saturado
      g.fillStyle(flash ? 0xffffff : p.color, 0.95);
      g.fillCircle(p.x, p.y + bob, p.radius);
      g.fillStyle(0xffffff, 1.0);
      g.fillCircle(p.x, p.y + bob, p.radius * 0.38);
    }
  }

  public static renderFullscreenDamageFlash(
    g: Phaser.GameObjects.Graphics,
    timerMs: number
  ): void {
    if (timerMs <= 0) return;
    const flashAlpha = Math.max(0, (timerMs / 110) * 0.28);
    g.fillStyle(0xff0033, flashAlpha);
    g.fillRect(0, 0, TuningConfig.arena.width, TuningConfig.arena.height);
  }
}
