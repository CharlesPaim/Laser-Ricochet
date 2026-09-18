import Phaser from 'phaser';
import { GameScene } from './GameScene';
import { TuningConfig } from './TuningConfig';

// Poki SDK Compliance: Prevent scrolling on space and arrow keys across the portal
window.addEventListener(
  'keydown',
  (ev: KeyboardEvent) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(ev.code) || ev.keyCode === 32) {
      ev.preventDefault();
    }
  },
  { passive: false }
);

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: TuningConfig.arena.width,
  height: TuningConfig.arena.height,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  input: {
    keyboard: {
      capture: [
        Phaser.Input.Keyboard.KeyCodes.SPACE,
        Phaser.Input.Keyboard.KeyCodes.UP,
        Phaser.Input.Keyboard.KeyCodes.DOWN,
        Phaser.Input.Keyboard.KeyCodes.LEFT,
        Phaser.Input.Keyboard.KeyCodes.RIGHT,
      ],
    },
  },
  backgroundColor: '#0a0c18',
  scene: [GameScene],
};

const game = new Phaser.Game(config);
(window as unknown as { __PHASER_GAME__: Phaser.Game }).__PHASER_GAME__ = game;
