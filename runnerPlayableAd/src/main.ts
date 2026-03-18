import Phaser from 'phaser'
import { BootScene } from './scenes/BootScene'
import { GameScene } from './scenes/GameScene'
import { EndScene } from './scenes/EndScene'
import { GRAVITY, WORLD_HEIGHT } from './config/gameConfig'

// WORLD_HEIGHT is already scaled to match the screen height, so the canvas
// renders at native resolution instead of being CSS-upscaled (which caused blur).
const aspect = window.innerWidth / window.innerHeight
const gameWidth = Math.ceil(WORLD_HEIGHT * aspect)

const game = new Phaser.Game({
  type: Phaser.AUTO,
  width: gameWidth,
  height: WORLD_HEIGHT,
  backgroundColor: '#000000',
  render: {
    antialias: true,
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: 'arcade',
    arcade: { gravity: { x: 0, y: GRAVITY }, debug: false },
  },
  scene: [BootScene, GameScene, EndScene],
})

// Handle orientation changes / window resize
window.addEventListener('resize', () => {
  const newAspect = window.innerWidth / window.innerHeight
  const newWidth = Math.ceil(WORLD_HEIGHT * newAspect)
  game.scale.resize(newWidth, WORLD_HEIGHT)
})
