import Phaser from 'phaser'
import { Background } from '../objects/Background'
import { Player } from '../objects/Player'
import { WORLD_WIDTH, WORLD_HEIGHT, GROUND_Y, GROUND_HEIGHT } from '../config/gameConfig'

export class GameScene extends Phaser.Scene {
  private bg!: Background
  private player!: Player

  constructor() {
    super({ key: 'GameScene' })
  }

  create(): void {
    // ── World bounds ──────────────────────────────────────────────────────────
    this.physics.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT)

    // ── Parallax background ───────────────────────────────────────────────────
    this.bg = new Background(this)

    // ── Static ground ─────────────────────────────────────────────────────────
    const ground = this.physics.add.staticImage(
      WORLD_WIDTH / 2,
      GROUND_Y + GROUND_HEIGHT / 2,
      '__DEFAULT',
    )
    ground.setDisplaySize(WORLD_WIDTH, GROUND_HEIGHT)
    ground.setAlpha(0)
    ground.refreshBody()

    // ── Player ────────────────────────────────────────────────────────────────
    Player.createAnims(this.anims)
    // Player origin is (0.5, 1.0), so y = GROUND_Y puts feet on the ground.
    this.player = new Player(this, 150, GROUND_Y)

    // ── Collisions ────────────────────────────────────────────────────────────
    this.physics.add.collider(this.player, ground)

    // ── Camera ────────────────────────────────────────────────────────────────
    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT)
    // Offset keeps the player in the left-centre so more of the ahead is visible.
    this.cameras.main.startFollow(this.player, false, 1, 1)
    this.cameras.main.setFollowOffset(100, 0)

    // ── Input ─────────────────────────────────────────────────────────────────
    this.input.keyboard!.on('keydown-SPACE', () => { this.player.jump() })
    this.input.on('pointerdown', () => { this.player.jump() })
  }

  update(): void {
    this.player.update()
    this.bg.update(this.cameras.main.scrollX)
  }
}
