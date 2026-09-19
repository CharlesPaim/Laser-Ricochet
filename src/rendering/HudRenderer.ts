import Phaser from 'phaser';
import { TuningConfig } from '../TuningConfig';

export interface StarData {
  x: number;
  y: number;
  size: number;
  alpha: number;
  blinkSpeed: number;
  blinkOffset: number;
  color: number;
}

export interface AsteroidVertex {
  x: number;
  y: number;
}

export interface AsteroidData {
  orbitRadius: number;
  orbitAngle: number;
  orbitSpeed: number;
  rotation: number;
  rotationSpeed: number;
  radius: number;
  vertices: AsteroidVertex[];
  midSplit: number;
  darkColor: number;
  lightColor: number;
  rimColor: number;
}

/**
 * HudRenderer — Molduras Táticas, Asteroides Facetados e Cyber-Cards Holográficos (v3.0)
 * Renderiza os elementos de framing tático da tela, grades, ticks de navegação,
 * cinturão periférico de asteroides com sombreamento facetado 3D e cartões com chanfros.
 */
export class HudRenderer {
  public static renderStars(
    g: Phaser.GameObjects.Graphics,
    stars: StarData[],
    now: number
  ): void {
    for (const star of stars) {
      const twinkle = 0.55 + 0.45 * Math.sin(now * star.blinkSpeed + star.blinkOffset);
      g.fillStyle(star.color, star.alpha * twinkle);
      g.fillCircle(star.x, star.y, star.size);
    }
  }

  public static renderAsteroids(
    g: Phaser.GameObjects.Graphics,
    asteroids: AsteroidData[],
    cx: number,
    cy: number
  ): void {
    for (const ast of asteroids) {
      const ax = cx + Math.cos(ast.orbitAngle) * ast.orbitRadius;
      const ay = cy + Math.sin(ast.orbitAngle) * ast.orbitRadius;

      const cosR = Math.cos(ast.rotation);
      const sinR = Math.sin(ast.rotation);

      // Transform rotated vertices
      const worldVerts = ast.vertices.map(v => ({
        x: ax + (v.x * cosR - v.y * sinR),
        y: ay + (v.x * sinR + v.y * cosR),
      }));

      const len = worldVerts.length;
      if (len < 3) continue;

      // Draw Facet 1 (Dark Shadow Side)
      const facet1Points: Phaser.Math.Vector2[] = [new Phaser.Math.Vector2(ax, ay)];
      for (let i = 0; i <= ast.midSplit; i++) {
        facet1Points.push(new Phaser.Math.Vector2(worldVerts[i].x, worldVerts[i].y));
      }
      g.fillStyle(ast.darkColor, 0.72);
      g.fillPoints(facet1Points, true);

      // Draw Facet 2 (Light Illuminated Side)
      const facet2Points: Phaser.Math.Vector2[] = [new Phaser.Math.Vector2(ax, ay)];
      for (let i = ast.midSplit; i < len; i++) {
        facet2Points.push(new Phaser.Math.Vector2(worldVerts[i].x, worldVerts[i].y));
      }
      facet2Points.push(new Phaser.Math.Vector2(worldVerts[0].x, worldVerts[0].y));
      g.fillStyle(ast.lightColor, 0.82);
      g.fillPoints(facet2Points, true);

      // Facet Boundary Ridge
      g.lineStyle(1, 0x3d5a80, 0.4);
      g.lineBetween(ax, ay, worldVerts[0].x, worldVerts[0].y);
      g.lineBetween(ax, ay, worldVerts[ast.midSplit].x, worldVerts[ast.midSplit].y);

      // Outer Silhouette Rim Line
      const polyPoints = worldVerts.map(v => new Phaser.Math.Vector2(v.x, v.y));
      g.lineStyle(1.5, ast.rimColor, 0.5);
      g.strokePoints(polyPoints, true);
    }
  }

  public static renderGridAndFraming(
    g: Phaser.GameObjects.Graphics,
    width: number,
    height: number,
    cx: number,
    cy: number
  ): void {
    // Grade de coordenadas cibernética sutil
    g.lineStyle(1, 0x00f3ff, 0.024);
    for (let x = 60; x < width; x += 60) {
      g.lineBetween(x, 0, x, height);
    }
    for (let y = 60; y < height; y += 60) {
      g.lineBetween(0, y, width, y);
    }

    // Anéis de referência espacial concêntricos (linhas de radar)
    g.lineStyle(1, 0x00f3ff, 0.04);
    g.strokeCircle(cx, cy, 110);
    g.strokeCircle(cx, cy, 190);

    // Retículo central de mira
    g.lineStyle(1, 0x00f3ff, 0.18);
    g.lineBetween(cx - 20, cy, cx - 8, cy);
    g.lineBetween(cx + 8, cy, cx + 20, cy);
    g.lineBetween(cx, cy - 20, cx, cy - 8);
    g.lineBetween(cx, cy + 8, cx, cy + 20);

    // Cantoneiras táticas nos quatro cantos da tela (Framing de Arcade)
    const bOff = 14;
    const bLen = 22;
    g.lineStyle(2, 0x00f3ff, 0.25);
    // Top-Left
    g.lineBetween(bOff, bOff, bOff + bLen, bOff);
    g.lineBetween(bOff, bOff, bOff, bOff + bLen);
    // Top-Right
    g.lineBetween(width - bOff, bOff, width - bOff - bLen, bOff);
    g.lineBetween(width - bOff, bOff, width - bOff, bOff + bLen);
    // Bottom-Left
    g.lineBetween(bOff, height - bOff, bOff + bLen, height - bOff);
    g.lineBetween(bOff, height - bOff, bOff, height - bOff - bLen);
    // Bottom-Right
    g.lineBetween(width - bOff, height - bOff, width - bOff - bLen, height - bOff);
    g.lineBetween(width - bOff, height - bOff, width - bOff, height - bOff - bLen);
  }

  public static renderNavigationTicks(
    g: Phaser.GameObjects.Graphics,
    cx: number,
    cy: number
  ): void {
    // 12 marcas cibernéticas radiais na órbita dos canhões inimigos
    g.lineStyle(1, 0x00f3ff, 0.18);
    for (let a = 0; a < Math.PI * 2; a += Math.PI / 6) {
      const r1 = TuningConfig.cannons.distanceFromCenter - 4;
      const r2 = TuningConfig.cannons.distanceFromCenter + 4;
      g.lineBetween(
        cx + Math.cos(a) * r1,
        cy + Math.sin(a) * r1,
        cx + Math.cos(a) * r2,
        cy + Math.sin(a) * r2
      );
    }
  }

  public static renderGameOverCard(
    g: Phaser.GameObjects.Graphics,
    cx: number,
    cy: number,
    isNewHighScore: boolean,
    canRevive: boolean = true
  ): void {
    const cardW = 580;
    const cardH = 360;
    const cardX = cx - cardW / 2;
    const cardY = cy - cardH / 2 - 10;
    const chamfer = 18;

    const cardPoly = [
      new Phaser.Math.Vector2(cardX + chamfer, cardY),
      new Phaser.Math.Vector2(cardX + cardW - chamfer, cardY),
      new Phaser.Math.Vector2(cardX + cardW, cardY + chamfer),
      new Phaser.Math.Vector2(cardX + cardW, cardY + cardH - chamfer),
      new Phaser.Math.Vector2(cardX + cardW - chamfer, cardY + cardH),
      new Phaser.Math.Vector2(cardX + chamfer, cardY + cardH),
      new Phaser.Math.Vector2(cardX, cardY + cardH - chamfer),
      new Phaser.Math.Vector2(cardX, cardY + chamfer),
    ];

    g.fillStyle(0x090d1a, 0.88);
    g.fillPoints(cardPoly, true);

    const cardBorderColor = isNewHighScore ? 0xffea00 : 0xff1744;
    g.lineStyle(2, cardBorderColor, 0.85);
    g.strokePoints(cardPoly, true);

    // Separador holográfico interno
    g.lineStyle(1, 0x00f3ff, 0.28);
    g.lineBetween(cardX + 28, cardY + 74, cardX + cardW - 28, cardY + 74);

    // Caixas diegéticas de botão arcade (Revive & Restart)
    const btnW = 320;
    const btnH = 42;
    const btnX = cx - btnW / 2;

    if (canRevive) {
      // 1. Botão Arcade Reviver (Ciano com chanfro e halo)
      const rY = 309;
      g.fillStyle(0x0c223c, 0.9);
      g.fillRoundedRect(btnX, rY, btnW, btnH, 8);
      g.lineStyle(2, 0x00f3ff, 0.9);
      g.strokeRoundedRect(btnX, rY, btnW, btnH, 8);

      // 2. Botão Arcade Reiniciar (Âmbar com chanfro e halo)
      const resY = 359;
      g.fillStyle(0x2b1e06, 0.9);
      g.fillRoundedRect(btnX, resY, btnW, btnH, 8);
      g.lineStyle(2, 0xffea00, 0.9);
      g.strokeRoundedRect(btnX, resY, btnW, btnH, 8);
    } else {
      // Apenas Botão Arcade Reiniciar centralizado
      const resY = 334;
      g.fillStyle(0x2b1e06, 0.9);
      g.fillRoundedRect(btnX, resY, btnW, btnH, 8);
      g.lineStyle(2, 0xffea00, 0.9);
      g.strokeRoundedRect(btnX, resY, btnW, btnH, 8);
    }
  }

  public static renderPauseCard(
    g: Phaser.GameObjects.Graphics,
    cx: number,
    cy: number,
    width: number,
    height: number
  ): void {
    // Escurecimento suave de fundo
    g.fillStyle(0x060812, 0.75);
    g.fillRect(0, 0, width, height);

    const pCardW = 500;
    const pCardH = 190;
    const pCardX = cx - pCardW / 2;
    const pCardY = cy - pCardH / 2;
    const pChamfer = 16;

    const pPoly = [
      new Phaser.Math.Vector2(pCardX + pChamfer, pCardY),
      new Phaser.Math.Vector2(pCardX + pCardW - pChamfer, pCardY),
      new Phaser.Math.Vector2(pCardX + pCardW, pCardY + pChamfer),
      new Phaser.Math.Vector2(pCardX + pCardW, pCardY + pCardH - pChamfer),
      new Phaser.Math.Vector2(pCardX + pCardW - pChamfer, pCardY + pCardH),
      new Phaser.Math.Vector2(pCardX + pChamfer, pCardY + pCardH),
      new Phaser.Math.Vector2(pCardX, pCardY + pCardH - pChamfer),
      new Phaser.Math.Vector2(pCardX, pCardY + pChamfer),
    ];

    g.fillStyle(0x060914, 0.92);
    g.fillPoints(pPoly, true);
    g.lineStyle(2, 0x00f3ff, 0.85);
    g.strokePoints(pPoly, true);
  }

  public static renderStartCard(
    g: Phaser.GameObjects.Graphics,
    cx: number,
    cy: number
  ): void {
    const sCardW = 620;
    const sCardH = 340;
    const sCardX = cx - sCardW / 2;
    const sCardY = cy - sCardH / 2 + 50;
    const sChamfer = 16;

    const sPoly = [
      new Phaser.Math.Vector2(sCardX + sChamfer, sCardY),
      new Phaser.Math.Vector2(sCardX + sCardW - sChamfer, sCardY),
      new Phaser.Math.Vector2(sCardX + sCardW, sCardY + sChamfer),
      new Phaser.Math.Vector2(sCardX + sCardW, sCardY + sCardH - sChamfer),
      new Phaser.Math.Vector2(sCardX + sCardW - sChamfer, sCardY + sCardH),
      new Phaser.Math.Vector2(sCardX + sChamfer, sCardY + sCardH),
      new Phaser.Math.Vector2(sCardX, sCardY + sCardH - sChamfer),
      new Phaser.Math.Vector2(sCardX, sCardY + sChamfer),
    ];

    g.fillStyle(0x060914, 0.88);
    g.fillPoints(sPoly, true);
    g.lineStyle(2, 0x00f3ff, 0.85);
    g.strokePoints(sPoly, true);

    // Linhas decorativas de scanline
    g.lineStyle(1, 0x00f3ff, 0.2);
    g.lineBetween(sCardX + 24, sCardY + 54, sCardX + sCardW - 24, sCardY + 54);

    // Caixa diegética de botão arcade "INICIAR JOGO / START GAME"
    const startBtnW = 320;
    const startBtnH = 46;
    const startBtnX = cx - startBtnW / 2;
    const startBtnY = 438;

    g.fillStyle(0x0c253d, 0.95);
    g.fillRoundedRect(startBtnX, startBtnY, startBtnW, startBtnH, 8);
    g.lineStyle(2.5, 0x00f3ff, 0.95);
    g.strokeRoundedRect(startBtnX, startBtnY, startBtnW, startBtnH, 8);
  }

  public static renderHelpCard(
    g: Phaser.GameObjects.Graphics,
    cx: number,
    cy: number,
    width: number,
    height: number
  ): void {
    // Backdrop escuro
    g.fillStyle(0x04060d, 0.82);
    g.fillRect(0, 0, width, height);

    const hCardW = 680;
    const hCardH = 370;
    const hCardX = cx - hCardW / 2;
    const hCardY = cy - hCardH / 2;
    const hChamfer = 18;

    const hPoly = [
      new Phaser.Math.Vector2(hCardX + hChamfer, hCardY),
      new Phaser.Math.Vector2(hCardX + hCardW - hChamfer, hCardY),
      new Phaser.Math.Vector2(hCardX + hCardW, hCardY + hChamfer),
      new Phaser.Math.Vector2(hCardX + hCardW, hCardY + hCardH - hChamfer),
      new Phaser.Math.Vector2(hCardX + hCardW - hChamfer, hCardY + hCardH),
      new Phaser.Math.Vector2(hCardX + hChamfer, hCardY + hCardH),
      new Phaser.Math.Vector2(hCardX, hCardY + hCardH - hChamfer),
      new Phaser.Math.Vector2(hCardX, hCardY + hChamfer),
    ];

    g.fillStyle(0x070c18, 0.94);
    g.fillPoints(hPoly, true);
    g.lineStyle(2, 0x00f3ff, 0.9);
    g.strokePoints(hPoly, true);

    // Separadores holográficos
    g.lineStyle(1, 0x00f3ff, 0.3);
    g.lineBetween(hCardX + 28, hCardY + 60, hCardX + hCardW - 28, hCardY + 60);
    g.lineBetween(hCardX + 28, hCardY + hCardH - 55, hCardX + hCardW - 28, hCardY + hCardH - 55);
  }

  public static renderFtuePrompt(
    g: Phaser.GameObjects.Graphics,
    cx: number,
    cy: number,
    bladeX: number,
    bladeY: number,
    now: number,
    showMoveCue: boolean,
    showParryCue: boolean
  ): void {
    if (showMoveCue) {
      // Pista visual orgânica e não intrusiva na Wave 1:
      // Arco suave pontilhado pulsando no trilho orbital em torno da posição atual
      const bladeAngle = Math.atan2(bladeY - cy, bladeX - cx);
      const orbitR = Math.hypot(bladeX - cx, bladeY - cy) || 120;
      const pulse = 0.45 + 0.45 * Math.sin(now * 0.006);

      g.lineStyle(2, 0x00f3ff, pulse * 0.7);
      g.beginPath();
      g.arc(cx, cy, orbitR, bladeAngle - 0.4, bladeAngle + 0.4, false);
      g.strokePath();

      // Chevrons indicando direção do trilho
      for (const dir of [-0.35, 0.35]) {
        const ca = bladeAngle + dir;
        const arrowX = cx + Math.cos(ca) * orbitR;
        const arrowY = cy + Math.sin(ca) * orbitR;
        g.fillStyle(0x00f3ff, pulse * 0.8);
        g.fillCircle(arrowX, arrowY, 3.5);
      }
    }

    if (showParryCue) {
      // Pista de Parry sutil: flash solar de oportunidade
      const pulseP = 0.5 + 0.5 * Math.sin(now * 0.02);
      g.lineStyle(3, 0xffea00, pulseP * 0.9);
      g.strokeCircle(bladeX, bladeY, 28);
    }
  }

  public static renderMiniRogueCards(
    g: Phaser.GameObjects.Graphics,
    cx: number,
    cy: number,
    width: number,
    height: number,
    cards: Array<{ x: number; y: number; w: number; h: number; isHovered: boolean }>,
    timeRatio: number
  ): void {
    // Backdrop escuro suave com vinheta
    g.fillStyle(0x030610, 0.80);
    g.fillRect(0, 0, width, height);

    // Barra de contagem regressiva de auto-select no topo
    const barW = 540;
    const barH = 6;
    const barX = cx - barW / 2;
    const barY = 96;
    g.fillStyle(0x162238, 0.8);
    g.fillRect(barX, barY, barW, barH);
    g.fillStyle(timeRatio > 0.3 ? 0x00f3ff : 0xff2a6d, 0.92);
    g.fillRect(barX, barY, barW * Math.max(0, Math.min(1, timeRatio)), barH);

    // Renderizar os 3 cyber-cards chanfrados
    for (const c of cards) {
      const chamfer = 14;
      const poly = [
        new Phaser.Math.Vector2(c.x + chamfer, c.y),
        new Phaser.Math.Vector2(c.x + c.w - chamfer, c.y),
        new Phaser.Math.Vector2(c.x + c.w, c.y + chamfer),
        new Phaser.Math.Vector2(c.x + c.w, c.y + c.h - chamfer),
        new Phaser.Math.Vector2(c.x + c.w - chamfer, c.y + c.h),
        new Phaser.Math.Vector2(c.x + chamfer, c.y + c.h),
        new Phaser.Math.Vector2(c.x, c.y + c.h - chamfer),
        new Phaser.Math.Vector2(c.x, c.y + chamfer),
      ];
      g.fillStyle(c.isHovered ? 0x0e1b30 : 0x070d1a, 0.94);
      g.fillPoints(poly, true);
      g.lineStyle(c.isHovered ? 2.5 : 1.5, c.isHovered ? 0xffea00 : 0x00f3ff, c.isHovered ? 1.0 : 0.7);
      g.strokePoints(poly, true);

      // Linha de sotaque interna (abaixo do ícone ampliado)
      g.lineStyle(1, c.isHovered ? 0xffea00 : 0x00f3ff, 0.3);
      g.lineBetween(c.x + 16, c.y + 60, c.x + c.w - 16, c.y + 60);
    }
  }

  /**
   * Renderiza os controles de toque tátil para mobile:
   * 1. Mini-joystick virtual flutuante (polegar esquerdo)
   * 2. Botão neon de Parry com anéis concêntricos (polegar direito)
   */
  public static renderMobileControls(
    g: Phaser.GameObjects.Graphics,
    isJoystickActive: boolean,
    joyOriginX: number,
    joyOriginY: number,
    joyCurrentX: number,
    joyCurrentY: number,
    showParryBtn: boolean,
    parryBtnX: number,
    parryBtnY: number,
    parryBtnRadius: number,
    isParryPressed: boolean
  ): void {
    // 1. Virtual Joystick flutuante no polegar esquerdo
    if (isJoystickActive) {
      // Anel de base translúcido (limite de curso máximo: órbita externa 160px)
      g.lineStyle(2, 0x00f3ff, 0.5);
      g.strokeCircle(joyOriginX, joyOriginY, 52);
      g.fillStyle(0x0c1626, 0.4);
      g.fillCircle(joyOriginX, joyOriginY, 52);

      // Anel tático interno (guia de aproximação do núcleo: minOrbitRadius 65px)
      g.lineStyle(1, 0x00f3ff, 0.22);
      g.strokeCircle(joyOriginX, joyOriginY, 20);

      // Anel tático intermediário (órbita média de equilíbrio ~112px)
      g.lineStyle(1, 0x00f3ff, 0.15);
      g.strokeCircle(joyOriginX, joyOriginY, 36);

      // Linha de tensão entre a base e o polegar
      g.lineStyle(2, 0x00f3ff, 0.35);
      g.lineBetween(joyOriginX, joyOriginY, joyCurrentX, joyCurrentY);

      // Manípulo táctil de controle
      g.fillStyle(0x00f3ff, 0.85);
      g.fillCircle(joyCurrentX, joyCurrentY, 20);
      g.fillStyle(0xffffff, 0.95);
      g.fillCircle(joyCurrentX, joyCurrentY, 8);
    }

    // 2. Botão Arcade de Parry no polegar direito
    if (showParryBtn) {
      const ringColor = isParryPressed ? 0xffea00 : 0x00f3ff;
      const fillColor = isParryPressed ? 0x302500 : 0x081324;
      const alpha = isParryPressed ? 0.85 : 0.65;
      const r = isParryPressed ? parryBtnRadius * 0.94 : parryBtnRadius;

      // Halo de luz externo
      g.lineStyle(3, ringColor, isParryPressed ? 1.0 : 0.8);
      g.strokeCircle(parryBtnX, parryBtnY, r);

      // Fundo em vidro escuro
      g.fillStyle(fillColor, alpha);
      g.fillCircle(parryBtnX, parryBtnY, r);

      // Anel tático interno concêntrico
      g.lineStyle(1.5, ringColor, isParryPressed ? 0.7 : 0.35);
      g.strokeCircle(parryBtnX, parryBtnY, r - 7);
    }
  }
}

