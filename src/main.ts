import Phaser from 'phaser';
import { GameScene } from './GameScene';
import { TuningConfig } from './TuningConfig';

// Note: Keydown scroll prevention for Space and Arrow keys is already registered inline in index.html
// and captured by Phaser below to avoid duplicate event listeners across the portal.

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
    activePointers: 3,
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
