import Phaser from 'phaser'
import { Background } from '../objects/Background'
import { WORLD_WIDTH, WORLD_HEIGHT, GROUND_Y, GROUND_HEIGHT } from '../config/gameConfig'

const CAMERA_SPEED = 3   // px/frame — temporary auto-scroll until player drives camera

export class GameScene extends Phaser.Scene {
  private bg!: Background

  constructor() {
    super({ key: 'GameScene' })
  }

  create(): void {
    // ── World bounds ──────────────────────────────────────────────────────────
    this.physics.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT)

    // ── Parallax background ───────────────────────────────────────────────────
    this.bg = new Background(this)

    // ── Static ground ─────────────────────────────────────────────────────────
    // A single wide static physics rectangle — invisible, just for collision.
    const ground = this.physics.add.staticImage(
      WORLD_WIDTH / 2,
      GROUND_Y + GROUND_HEIGHT / 2,
      '__DEFAULT',
    )
    ground.setDisplaySize(WORLD_WIDTH, GROUND_HEIGHT)
    ground.setAlpha(0)          // invisible; the background image provides the visual
    ground.refreshBody()

    // ── Camera ────────────────────────────────────────────────────────────────
    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT)
    this.cameras.main.setScroll(0, 0)   // start at world origin
  }

  update(): void {
    // Temporary: advance camera automatically until the player drives it.
    const cam = this.cameras.main
    cam.scrollX = Math.min(cam.scrollX + CAMERA_SPEED, WORLD_WIDTH - this.scale.width)

    this.bg.update(cam.scrollX)
  }
}
