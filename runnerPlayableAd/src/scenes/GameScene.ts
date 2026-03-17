import Phaser from 'phaser'
import { Background } from '../objects/Background'
import { Player } from '../objects/Player'
import { Obstacle } from '../objects/Obstacle'
import { Coin } from '../objects/Coin'
import { FinishLine } from '../objects/FinishLine'
import { WORLD_WIDTH, WORLD_HEIGHT, GROUND_Y, GROUND_HEIGHT } from '../config/gameConfig'
import { LEVEL_DATA } from '../config/levelData'

const RESTART_DELAY = 1200   // ms after death before scene restarts

export class GameScene extends Phaser.Scene {
  private bg!: Background
  private player!: Player
  private coinCount = 0
  private coinText!: Phaser.GameObjects.Text
  private finishLine!: FinishLine

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
    this.player = new Player(this, 150, GROUND_Y)

    // ── Obstacles & Coins from level data ─────────────────────────────────────
    const obstacles = this.physics.add.staticGroup()
    const coins = this.physics.add.staticGroup()

    for (const item of LEVEL_DATA) {
      if (item.type === 'obstacle') {
        obstacles.add(new Obstacle(this, item.x, item.y))
      } else {
        coins.add(new Coin(this, item.x, item.y))
      }
    }

    // ── Finish line ───────────────────────────────────────────────────────────
    this.finishLine = new FinishLine(this)

    // ── Collisions ────────────────────────────────────────────────────────────
    this.physics.add.collider(this.player, ground)

    // Obstacle → die
    this.physics.add.collider(this.player, obstacles, () => {
      this.handleDeath()
    })

    // Coin → collect
    this.physics.add.overlap(this.player, coins, (_player, coinObj) => {
      const coin = coinObj as Coin
      coin.collect()
      this.coinCount++
      this.coinText.setText(`$ ${this.coinCount}`)
    })

    // Finish line → win
    this.physics.add.overlap(this.player, this.finishLine.getTriggerZone(), () => {
      this.handleFinish()
    })

    // ── Camera ────────────────────────────────────────────────────────────────
    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT)
    this.cameras.main.startFollow(this.player, false, 1, 1)
    this.cameras.main.setFollowOffset(100, 0)

    // ── Input ─────────────────────────────────────────────────────────────────
    this.input.keyboard!.on('keydown-SPACE', () => { this.player.jump() })
    this.input.on('pointerdown', () => { this.player.jump() })

    // ── HUD ───────────────────────────────────────────────────────────────────
    this.coinCount = 0
    this.coinText = this.add
      .text(16, 16, '$ 0', { fontSize: '28px', color: '#ffffff', fontStyle: 'bold' })
      .setScrollFactor(0)
      .setDepth(100)
  }

  update(_time: number, dt: number): void {
    this.player.update()
    this.bg.update(this.cameras.main.scrollX)
    this.finishLine.update(dt)
  }

  // ── Finish handling ────────────────────────────────────────────────────────
  private handleFinish(): void {
    if (this.player.isDead) return
    this.player.halt()
    this.finishLine.snap(() => {
      this.scene.start('EndScene', { coins: this.coinCount })
    })
  }

  // ── Death handling ──────────────────────────────────────────────────────────
  private handleDeath(): void {
    if (this.player.isDead) return
    this.player.die()

    this.time.delayedCall(RESTART_DELAY, () => {
      this.scene.restart()
    })
  }
}
