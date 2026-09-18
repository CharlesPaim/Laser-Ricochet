import Phaser from 'phaser';
import { TuningConfig } from '../TuningConfig';

export interface BladeTrailGhost {
  ax: number;
  ay: number;
  bx: number;
  by: number;
  orbitRadius: number;
  startAngle: number;
  endAngle: number;
  color: number;
}

/**
 * BladeRenderer — Lâmina de Plasma como Arma Energética (v3.0)
 * Transforma o paddle em um dispositivo tecnológico sofisticado:
 * 1. Armadura metálica / espinha de contenção em liga de carbono na borda traseira.
 * 2. Cápsulas emissoras magnéticas reforçadas nas extremidades com micro-propulsores e bobinas.
 * 3. Feixe guia diegético duplo conectando o núcleo da estação à lâmina.
 * 4. Fio de corte de plasma incandescente branco na borda frontal.
 * 5. Arcos de alta voltagem crepitantes no modo Overload.
 * 6. Rastro cinético de pós-imagem reativo à velocidade de rotação.
 */
export class BladeRenderer {
  public static render(
    g: Phaser.GameObjects.Graphics,
    cx: number,
    cy: number,
    bladeX: number,
    bladeY: number,
    now: number,
    activePowerup: string | null,
    isOverloaded: boolean,
    parryActiveTimerMs: number,
    bladeTrail: BladeTrailGhost[],
    selectedBladeId: string = 'standard',
    titanGripBonus: number = 0
  ): void {
    const orbitRadius = Math.hypot(bladeX - cx, bladeY - cy) || 1;
    const playerAngle = Math.atan2(bladeY - cy, bladeX - cx);

    const bladeCfg = TuningConfig.blades[selectedBladeId as keyof typeof TuningConfig.blades] || TuningConfig.blades.standard;
    const currentBladeLength =
      (activePowerup === 'blade_boost'
        ? TuningConfig.blade.boostedLength
        : bladeCfg.length) + titanGripBonus;
    const halfLen = currentBladeLength / 2;
    const halfBladeAngle = halfLen / orbitRadius;
    const startAngle = playerAngle - halfBladeAngle;
    const endAngle = playerAngle + halfBladeAngle;

    const tipAx = cx + Math.cos(startAngle) * orbitRadius;
    const tipAy = cy + Math.sin(startAngle) * orbitRadius;
    const tipBx = cx + Math.cos(endAngle) * orbitRadius;
    const tipBy = cy + Math.sin(endAngle) * orbitRadius;

    // -----------------------------------------------------------------------
    // 1. Rastro Cinético de Movimento (Curved Motion Wake)
    // -----------------------------------------------------------------------
    for (let t = 0; t < bladeTrail.length; t++) {
      const ghost = bladeTrail[t];
      const trailAlpha = ((t + 1) / (bladeTrail.length + 1)) * 0.25;
      g.lineStyle(TuningConfig.blade.thickness * 0.65, ghost.color, trailAlpha);
      g.beginPath();
      g.arc(cx, cy, ghost.orbitRadius, ghost.startAngle, ghost.endAngle, false);
      g.strokePath();
    }

    // -----------------------------------------------------------------------
    // 2. Determinação de Cores e Estados de Energia
    // -----------------------------------------------------------------------
    const isParry = parryActiveTimerMs > 0;
    let bladeColor: number = bladeCfg.color;
    if (isOverloaded) {
      bladeColor = Math.sin(now * 0.02) > 0 ? TuningConfig.blade.overloadColor : 0xffea00;
    } else if (activePowerup === 'blade_boost') {
      bladeColor = 0x00ffcc;
    } else if (isParry) {
      bladeColor = TuningConfig.blade.parryColor;
    }

    // -----------------------------------------------------------------------
    // 3. Feixe de Ancoragem e Conduíte de Energia Diegético (Hub Tether & Photons)
    // -----------------------------------------------------------------------
    const tetherInnerR = TuningConfig.arena.coreRadius + 14;
    const tetherOuterR = orbitRadius - 10;
    const normalOffset = 0.025; // Leve abertura angular dupla

    // Feixes duplos de alinhamento
    for (const sign of [-1, 1]) {
      const rayA = playerAngle + sign * normalOffset;
      g.lineStyle(1.2, bladeColor, 0.22);
      g.lineBetween(
        cx + Math.cos(rayA) * tetherInnerR,
        cy + Math.sin(rayA) * tetherInnerR,
        cx + Math.cos(rayA) * tetherOuterR,
        cy + Math.sin(rayA) * tetherOuterR
      );
    }

    // Feixe central e pulso de fótons transitando do Reator para a Lâmina
    g.lineStyle(1.0, bladeColor, 0.35);
    g.lineBetween(
      cx + Math.cos(playerAngle) * tetherInnerR,
      cy + Math.sin(playerAngle) * tetherInnerR,
      cx + Math.cos(playerAngle) * tetherOuterR,
      cy + Math.sin(playerAngle) * tetherOuterR
    );

    // Micro-fótons em fluxo contínuo
    for (let f = 0; f < 2; f++) {
      const tPulse = ((now * 0.0015 + f * 0.5) % 1.0);
      const pulseR = tetherInnerR + (tetherOuterR - tetherInnerR) * tPulse;
      const pulseX = cx + Math.cos(playerAngle) * pulseR;
      const pulseY = cy + Math.sin(playerAngle) * pulseR;
      g.fillStyle(0xffffff, 0.9);
      g.fillCircle(pulseX, pulseY, 1.8);
      g.fillStyle(bladeColor, 0.5);
      g.fillCircle(pulseX, pulseY, 3.2);
    }

    // Ponto focal central de engate na base da lâmina
    const baseCenterX = cx + Math.cos(playerAngle) * (orbitRadius - 6);
    const baseCenterY = cy + Math.sin(playerAngle) * (orbitRadius - 6);
    g.fillStyle(0x0c1424, 0.95);
    g.fillCircle(baseCenterX, baseCenterY, 5);
    g.lineStyle(1.5, bladeColor, 0.8);
    g.strokeCircle(baseCenterX, baseCenterY, 5);
    g.fillStyle(0xffffff, 1.0);
    g.fillCircle(baseCenterX, baseCenterY, 2);

    // -----------------------------------------------------------------------
    // 4. Espinha / Armadura Mecânica de Contenção (Borda Traseira Côncava)
    // -----------------------------------------------------------------------
    const spineRadius = orbitRadius - TuningConfig.blade.thickness * 0.35;
    g.lineStyle(TuningConfig.blade.thickness * 0.5, 0x0c1220, 0.95);
    g.beginPath();
    g.arc(cx, cy, spineRadius, startAngle, endAngle, false);
    g.strokePath();

    g.lineStyle(1.5, 0x223650, 0.8);
    g.beginPath();
    g.arc(cx, cy, spineRadius, startAngle, endAngle, false);
    g.strokePath();

    // -----------------------------------------------------------------------
    // 5. Manto de Plasma e Fio de Corte Energético (Borda Frontal Convexa)
    // -----------------------------------------------------------------------
    // 5.1 Aura Difusa de Emissão Radial
    const glowThickness = TuningConfig.blade.thickness + (isOverloaded ? 20 : isParry ? 16 : 9);
    g.lineStyle(glowThickness, bladeColor, isOverloaded ? 0.85 : isParry ? 0.8 : 0.35);
    g.beginPath();
    g.arc(cx, cy, orbitRadius, startAngle, endAngle, false);
    g.strokePath();

    // 5.2 Manto de Plasma Sólido Saturado
    g.lineStyle(TuningConfig.blade.thickness * 0.85, bladeColor, 0.92);
    g.beginPath();
    g.arc(cx, cy, orbitRadius, startAngle, endAngle, false);
    g.strokePath();

    // 5.3 Lâmina Incandescente Superaquecida (White Plasma Cutting Edge)
    g.lineStyle(Math.max(3, TuningConfig.blade.thickness * 0.38), 0xffffff, 1.0);
    g.beginPath();
    g.arc(cx, cy, orbitRadius, startAngle, endAngle, false);
    g.strokePath();

    // -----------------------------------------------------------------------
    // 6. Cápsulas Emitter Pods de Confinamento Magnético nas Pontas
    // -----------------------------------------------------------------------
    for (const pt of [{ x: tipAx, y: tipAy, a: startAngle }, { x: tipBx, y: tipBy, a: endAngle }]) {
      // Corpo da cápsula em liga escura chanfrada
      g.fillStyle(0x0a101d, 1.0);
      g.fillCircle(pt.x, pt.y, TuningConfig.blade.thickness * 0.72);
      g.lineStyle(2, bladeColor, 0.95);
      g.strokeCircle(pt.x, pt.y, TuningConfig.blade.thickness * 0.72);

      // Anel magnético intermediário
      g.lineStyle(1.5, 0xffffff, 0.7);
      g.strokeCircle(pt.x, pt.y, TuningConfig.blade.thickness * 0.42);

      // Micro lente de emissão no centro
      g.fillStyle(0xffffff, 1.0);
      g.fillCircle(pt.x, pt.y, 2.5);
    }

    // -----------------------------------------------------------------------
    // 7. Arcos Elétricos Crepitantes de Alta Voltagem (Modo Overload)
    // -----------------------------------------------------------------------
    if (isOverloaded) {
      for (let k = 0; k < 4; k++) {
        const a1 = startAngle + (endAngle - startAngle) * Math.random();
        const a2 = startAngle + (endAngle - startAngle) * Math.random();
        const rOff1 = (Math.random() - 0.5) * 14;
        const rOff2 = (Math.random() - 0.5) * 14;
        const p1x = cx + Math.cos(a1) * (orbitRadius + rOff1);
        const p1y = cy + Math.sin(a1) * (orbitRadius + rOff1);
        const p2x = cx + Math.cos(a2) * (orbitRadius + rOff2);
        const p2y = cy + Math.sin(a2) * (orbitRadius + rOff2);
        g.lineStyle(1.8, 0xff00cc, 0.9);
        g.lineBetween(p1x, p1y, p2x, p2y);
        g.fillStyle(0xffffff, 1.0);
        g.fillCircle((p1x + p2x) / 2, (p1y + p2y) / 2, 1.5);
      }
    }
  }
}
