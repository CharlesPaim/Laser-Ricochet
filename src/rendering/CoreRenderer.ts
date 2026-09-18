import Phaser from 'phaser';
import { TuningConfig } from '../TuningConfig';

/**
 * CoreRenderer — Reator Quântico Cinematográfico (v3.0)
 * Transforma o reator central em uma câmara de contenção volumétrica de fusão:
 * 1. Berço de retenção hidráulico pesado (6 garras de liga de titânio com parafusos e LEDs de status).
 * 2. Poço de dissipação térmica com dentes mecânicos de resfriamento em rotação inercial.
 * 3. Anéis de conduíte de fluxo eletromagnético contra-rotativos.
 * 4. Núcleo volumétrico de plasma com singularidade superaquecida e corona pulsante.
 * 5. Pips radiais de integridade com brilho de confinamento ativo e soquetes vazios escurecidos.
 * 6. Escudo hexagonal holográfico com satélites de defesa orbitantes.
 * 7. Estados reativos orgânicos: Estável (Ciano), Alerta (Âmbar), Crítico (Carmesim estroboscópico com fuga de centelhas) e Dano Imediato.
 */
export class CoreRenderer {
  public static render(
    g: Phaser.GameObjects.Graphics,
    cx: number,
    cy: number,
    now: number,
    coreHealth: number,
    coreDamageFlashTimerMs: number,
    hasCoreShield: boolean,
    sparksArray: Array<{ x: number; y: number; vx: number; vy: number; life: number; maxLife: number; color: number }>,
    isRoundActive: boolean
  ): void {
    const baseRadius = TuningConfig.arena.coreRadius;

    // -----------------------------------------------------------------------
    // 1. Determinação de Cores e Parâmetros de Estado Reativo
    // -----------------------------------------------------------------------
    let coreHue = 0x00f3ff;       // Estável: Ciano elétrico
    let pulseSpeed = 0.004;
    let pulseAmp = 2.5;
    let clampColor = 0x16263e;
    let glowAlpha = 0.18;

    if (coreHealth <= 1) {
      // Estado Crítico: Alerta Vermelho Carmesim / Estroboscópio de Sobrecarga
      coreHue = Math.sin(now * 0.02) > 0 ? 0xff1744 : 0xffea00;
      pulseSpeed = 0.022;
      pulseAmp = 6.0;
      clampColor = 0x5a1422;
      glowAlpha = 0.35;

      // Centelhas de fuga de confinamento emergencial
      if (isRoundActive && Math.random() < 0.28) {
        const spkA = Math.random() * Math.PI * 2;
        const spkR = baseRadius + 8;
        sparksArray.push({
          x: cx + Math.cos(spkA) * spkR,
          y: cy + Math.sin(spkA) * spkR,
          vx: (Math.random() - 0.5) * 60,
          vy: (Math.random() - 0.5) * 60,
          life: 0.2,
          maxLife: 0.22,
          color: Math.random() > 0.4 ? 0xff1744 : 0xffea00,
        });
      }
    } else if (coreHealth <= 3) {
      // Estado Alerta: Âmbar Aquecido / Atividade Radiativa
      coreHue = 0xffaa00;
      pulseSpeed = 0.009;
      pulseAmp = 3.8;
      clampColor = 0x463014;
      glowAlpha = 0.24;
    }

    // -----------------------------------------------------------------------
    // 2. Banho de Luz Volumétrico no Deck ao Redor do Reator
    // -----------------------------------------------------------------------
    const ambientPulse = Math.sin(now * pulseSpeed) * pulseAmp;
    g.fillStyle(coreHue, glowAlpha * 0.45);
    g.fillCircle(cx, cy, baseRadius * 2.2 + ambientPulse);
    g.fillStyle(coreHue, glowAlpha);
    g.fillCircle(cx, cy, baseRadius * 1.5 + ambientPulse * 0.6);

    // -----------------------------------------------------------------------
    // 3. Garras Hidráulicas Pesadas de Retenção (6 Clamps Mecânicos)
    // -----------------------------------------------------------------------
    const numClamps = 6;
    for (let i = 0; i < numClamps; i++) {
      const a = (i * Math.PI * 2) / numClamps;
      const rInner = baseRadius + 3;
      const rOuter = baseRadius + 18;

      // Haste do clamp com acabamento de liga escura
      g.lineStyle(5.5, clampColor, 0.95);
      g.lineBetween(
        cx + Math.cos(a) * rInner,
        cy + Math.sin(a) * rInner,
        cx + Math.cos(a) * rOuter,
        cy + Math.sin(a) * rOuter
      );

      // Highlight de bisel chanfrado
      g.lineStyle(1.5, 0x6a8ab8, 0.4);
      g.lineBetween(
        cx + Math.cos(a + 0.04) * (rInner + 2),
        cy + Math.sin(a + 0.04) * (rInner + 2),
        cx + Math.cos(a + 0.04) * (rOuter - 1),
        cy + Math.sin(a + 0.04) * (rOuter - 1)
      );

      // Cabeça do pistão / pino com LED de status de contenção
      const headX = cx + Math.cos(a) * (rOuter + 1);
      const headY = cy + Math.sin(a) * (rOuter + 1);
      g.fillStyle(0x0a101d, 1.0);
      g.fillCircle(headX, headY, 4.2);
      g.lineStyle(1.5, 0x223650, 0.85);
      g.strokeCircle(headX, headY, 4.2);

      // Micro LED de telemetria
      g.fillStyle(coreHealth <= 1 ? 0xff1744 : coreHealth <= 3 ? 0xffaa00 : 0x00f3ff, 0.95);
      g.fillCircle(headX, headY, 1.8);
    }

    // -----------------------------------------------------------------------
    // 4. Anel Radiador de Dissipação Térmica com Dentes Mecânicos em Rotação
    // -----------------------------------------------------------------------
    const notchCount = 12;
    const notchAngle = now * 0.00065;
    g.lineStyle(2, coreHue, 0.45);
    for (let i = 0; i < notchCount; i++) {
      const a = notchAngle + (i / notchCount) * Math.PI * 2;
      const r1 = baseRadius + 7;
      const r2 = baseRadius + 14;
      g.lineBetween(
        cx + Math.cos(a) * r1,
        cy + Math.sin(a) * r1,
        cx + Math.cos(a) * r2,
        cy + Math.sin(a) * r2
      );
    }

    // Anel estrutural de contenção magnética
    g.lineStyle(2.5, clampColor, 0.95);
    g.strokeCircle(cx, cy, baseRadius + 11);
    g.lineStyle(1, 0x00f3ff, 0.35);
    g.strokeCircle(cx, cy, baseRadius + 12.5);

    // -----------------------------------------------------------------------
    // 5. Conduítes Contra-Rotativos de Fluxo Eletromagnético
    // -----------------------------------------------------------------------
    const conduitAngle = -now * (coreHealth <= 1 ? 0.0032 : 0.0014);
    g.lineStyle(2.8, coreHue, 0.7);
    for (let i = 0; i < 4; i++) {
      const startA = conduitAngle + i * (Math.PI / 2) + 0.16;
      const endA = conduitAngle + (i + 1) * (Math.PI / 2) - 0.16;
      g.beginPath();
      g.arc(cx, cy, baseRadius + 5, startA, endA, false);
      g.strokePath();

      // Nó de indução no início de cada segmento
      const nodeX = cx + Math.cos(startA) * (baseRadius + 5);
      const nodeY = cy + Math.sin(startA) * (baseRadius + 5);
      g.fillStyle(0xffffff, 0.95);
      g.fillCircle(nodeX, nodeY, 2.2);
    }

    // -----------------------------------------------------------------------
    // 6. Núcleo Volumétrico de Plasma e Singularidade de Fusão
    // -----------------------------------------------------------------------
    // Manto de plasma saturado
    g.fillStyle(coreHue, 0.78);
    g.fillCircle(cx, cy, baseRadius * 0.78 + ambientPulse * 0.4);

    // Corona incandescente intermediária
    g.fillStyle(coreHue, 0.95);
    g.fillCircle(cx, cy, baseRadius * 0.52);

    // Singularidade central branca hiperaquecida
    g.fillStyle(0xffffff, 1.0);
    g.fillCircle(cx, cy, baseRadius * 0.28);

    // -----------------------------------------------------------------------
    // 7. Pips Radiais de Integridade Orbitando a 22px do Reator (Visão Periférica)
    // -----------------------------------------------------------------------
    const pipRadius = baseRadius + 23;
    const maxHp = TuningConfig.arena.coreMaxHealth;
    for (let i = 0; i < maxHp; i++) {
      const pipAngle = -Math.PI / 2 + (i / maxHp) * Math.PI * 2;
      const px = cx + Math.cos(pipAngle) * pipRadius;
      const py = cy + Math.sin(pipAngle) * pipRadius;

      if (i < coreHealth) {
        // Pip Ativo: Aura + Corpo Sólido + Centro Branco Incandescente
        g.fillStyle(coreHue, 0.35);
        g.fillCircle(px, py, 6.5);
        g.fillStyle(coreHue, 0.95);
        g.fillCircle(px, py, 4.2);
        g.fillStyle(0xffffff, 1.0);
        g.fillCircle(px, py, 2.0);
        g.lineStyle(1.2, 0xffffff, 0.85);
        g.strokeCircle(px, py, 4.5);
      } else {
        // Pip Esgotado: Soquete Metálico Vazio com Pequeno Resíduo
        g.fillStyle(0x060c18, 0.8);
        g.fillCircle(px, py, 3.8);
        g.lineStyle(1.2, 0x1e2e46, 0.5);
        g.strokeCircle(px, py, 3.8);
      }
    }

    // -----------------------------------------------------------------------
    // 8. Ondas de Choque de Dano no Núcleo (Impacto Imediato)
    // -----------------------------------------------------------------------
    if (coreDamageFlashTimerMs > 0) {
      const ringAlpha = Math.max(0, (coreDamageFlashTimerMs / 110) * 0.95);
      const ringExpand = (1 - coreDamageFlashTimerMs / 110) * 60;
      g.lineStyle(4, 0xff1744, ringAlpha);
      g.strokeCircle(cx, cy, baseRadius + ringExpand);
      g.lineStyle(2, 0xffea00, ringAlpha * 0.8);
      g.strokeCircle(cx, cy, baseRadius + ringExpand * 0.65);
    }

    // -----------------------------------------------------------------------
    // 9. Escudo Hexagonal Holográfico (Quando Ativo)
    // -----------------------------------------------------------------------
    if (hasCoreShield) {
      const hexAngle = now * 0.001;
      const hexRadius = baseRadius + 20;
      const hexPoints: Phaser.Math.Vector2[] = [];
      for (let i = 0; i < 6; i++) {
        const a = hexAngle + (i * Math.PI) / 3;
        hexPoints.push(
          new Phaser.Math.Vector2(cx + Math.cos(a) * hexRadius, cy + Math.sin(a) * hexRadius)
        );
      }
      g.fillStyle(0x00f3ff, 0.15);
      g.fillPoints(hexPoints, true);
      g.lineStyle(2.8, 0x00f3ff, 0.9);
      g.strokePoints(hexPoints, true);

      // Micro-linhas de grade nos vértices
      for (let i = 0; i < 6; i++) {
        const a = hexAngle + (i * Math.PI) / 3;
        g.lineStyle(1.5, 0xffffff, 0.8);
        g.lineBetween(
          cx + Math.cos(a) * (hexRadius - 5),
          cy + Math.sin(a) * (hexRadius - 5),
          cx + Math.cos(a) * (hexRadius + 5),
          cy + Math.sin(a) * (hexRadius + 5)
        );
      }

      // Satélites orbitantes de polarização defensiva
      for (const sOffset of [0, Math.PI]) {
        const satAngle = hexAngle * 1.6 + sOffset;
        const sx = cx + Math.cos(satAngle) * hexRadius;
        const sy = cy + Math.sin(satAngle) * hexRadius;
        g.fillStyle(0xffffff, 1.0);
        g.fillCircle(sx, sy, 4.5);
        g.lineStyle(1.8, 0x00f3ff, 0.95);
        g.strokeCircle(sx, sy, 7.5);
      }
    }
  }
}
