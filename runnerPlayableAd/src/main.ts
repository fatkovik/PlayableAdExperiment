import Phaser from 'phaser'
import { BootScene } from './scenes/BootScene'
import { GameScene } from './scenes/GameScene'
import { EndScene } from './scenes/EndScene'
import { GRAVITY, WORLD_HEIGHT } from './config/gameConfig'

// Canvas internal height is always WORLD_HEIGHT.  Width is set to match the
// viewport aspect ratio so the game fills the screen without distortion.
// We use Scale.NONE and manually stretch the canvas via CSS — this avoids all
// FIT-mode quirks and guarantees resize works in DevTools, orientation flips, etc.

function calcWidth(): number {
  return Math.ceil(WORLD_HEIGHT * (window.innerWidth / window.innerHeight))
}

const game = new Phaser.Game({
  type: Phaser.AUTO,
  width: calcWidth(),
  height: WORLD_HEIGHT,
  backgroundColor: '#000000',
  render: {
    antialias: true,
  },
  scale: {
    mode: Phaser.Scale.NONE,
    parent: 'app',
  },
  physics: {
    default: 'arcade',
    arcade: { gravity: { x: 0, y: GRAVITY }, debug: false },
  },
  scene: [BootScene, GameScene, EndScene],
})

// Stretch the canvas to fill #app (which fills the viewport).
// Because the internal aspect ratio matches the viewport ratio, there is no
// distortion — only the pixel density changes.
function fitCanvas(): void {
  game.canvas.style.width  = '100%'
  game.canvas.style.height = '100%'
}
fitCanvas()

window.addEventListener('resize', () => {
  game.scale.resize(calcWidth(), WORLD_HEIGHT)
  fitCanvas()
})
