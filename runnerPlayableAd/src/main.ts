import Phaser from 'phaser'
import { BootScene } from './scenes/BootScene'
import { GameScene } from './scenes/GameScene'
import { EndScene } from './scenes/EndScene'
import { GRAVITY, WORLD_HEIGHT } from './config/gameConfig'

// Keep design height fixed (GROUND_Y and all y-positions stay valid).
// Compute width from viewport aspect ratio so the canvas fills the screen
// with zero black bars — works in landscape, portrait, and any size.
const aspect = window.innerWidth / window.innerHeight
const gameWidth = Math.ceil(WORLD_HEIGHT * aspect)

const game = new Phaser.Game({
  type: Phaser.AUTO,
  width: gameWidth,
  height: WORLD_HEIGHT,
  backgroundColor: '#000000',
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

// Handle orientation changes / window resize — recalculate and restart
window.addEventListener('resize', () => {
  const newAspect = window.innerWidth / window.innerHeight
  const newWidth = Math.ceil(WORLD_HEIGHT * newAspect)
  game.scale.resize(newWidth, WORLD_HEIGHT)
})
