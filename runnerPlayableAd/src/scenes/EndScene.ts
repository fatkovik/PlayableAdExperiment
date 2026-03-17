import Phaser from 'phaser'
import { PLAYER_SCALE } from '../config/gameConfig'
import { STORE_URL } from '../config/gameConfig'

// Confetti colours
const CONFETTI_COLORS = [0xff0000, 0x00cc44, 0x2288ff, 0xffdd00, 0xff66cc, 0xffffff]
const CONFETTI_SIZE = 6

export class EndScene extends Phaser.Scene {
  private coinCount = 0

  constructor() {
    super({ key: 'EndScene' })
  }

  init(data: { coins?: number }): void {
    this.coinCount = data.coins ?? 0
  }

  create(): void {
    const { width, height } = this.scale
    const cx = width / 2

    // ── Dark overlay background ──────────────────────────────────────────────
    this.cameras.main.setBackgroundColor('#1a1a2e')

    // ── Confetti particles ───────────────────────────────────────────────────
    this.createConfetti(width, height)

    // ── "Level Complete!" title ──────────────────────────────────────────────
    const title = this.add.text(cx, 60, 'Level Complete!', {
      fontSize: '44px',
      color: '#ffd700',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5).setAlpha(0)

    this.tweens.add({
      targets: title,
      alpha: 1,
      y: 80,
      duration: 500,
      ease: 'Back.easeOut',
    })

    // ── Player character — idle (victory) pose ──────────────────────────────
    const player = this.add.sprite(cx, height / 2 - 20, 'player', 0)
    player.setScale(PLAYER_SCALE * 1.4)
    player.setOrigin(0.5, 1.0)
    player.play('idle')

    // ── Coin tally with count-up ─────────────────────────────────────────────
    const coinIcon = this.add.image(cx - 60, height / 2 + 30, 'dollar1')
    coinIcon.setScale(0.08).setOrigin(0.5)

    const counter = { val: 0 }
    const coinText = this.add.text(cx - 20, height / 2 + 30, '0', {
      fontSize: '36px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0, 0.5)

    this.tweens.add({
      targets: counter,
      val: this.coinCount,
      duration: Math.max(400, this.coinCount * 120),
      ease: 'Cubic.easeOut',
      delay: 600,
      onUpdate: () => {
        coinText.setText(`${Math.round(counter.val)}`)
      },
    })

    // ── "Install Now" button ─────────────────────────────────────────────────
    const btnY = height / 2 + 120
    const btnW = 260
    const btnH = 60
    const btnR = 14

    // button background
    const btnBg = this.add.graphics()
    btnBg.fillStyle(0x22cc55, 1)
    btnBg.fillRoundedRect(cx - btnW / 2, btnY - btnH / 2, btnW, btnH, btnR)
    btnBg.lineStyle(3, 0xffffff, 0.6)
    btnBg.strokeRoundedRect(cx - btnW / 2, btnY - btnH / 2, btnW, btnH, btnR)

    const btnLabel = this.add.text(cx, btnY, 'Install Now', {
      fontSize: '28px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5)

    // group into a container for tweening
    const btnContainer = this.add.container(0, 0, [btnBg, btnLabel])
    btnContainer.setDepth(20)

    // bounce-in from below
    btnContainer.y = 80
    btnContainer.setAlpha(0)
    this.tweens.add({
      targets: btnContainer,
      y: 0,
      alpha: 1,
      duration: 700,
      delay: 1000,
      ease: 'Bounce.easeOut',
      onComplete: () => {
        // pulsing scale loop to draw attention
        this.tweens.add({
          targets: btnContainer,
          scaleX: 1.06,
          scaleY: 1.06,
          duration: 600,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
        })
      },
    })

    // hit zone for the button (covers the rounded-rect area)
    const hitZone = this.add.zone(cx, btnY, btnW, btnH).setInteractive({ useHandCursor: true })
    hitZone.on('pointerdown', () => {
      window.open(STORE_URL, '_blank')
    })
  }

  // ── Confetti ──────────────────────────────────────────────────────────────
  private createConfetti(w: number, _h: number): void {
    // generate a small square texture for each colour
    CONFETTI_COLORS.forEach((color, i) => {
      const key = `confetti${i}`
      if (this.textures.exists(key)) return
      const gfx = this.add.graphics()
      gfx.fillStyle(color, 1)
      gfx.fillRect(0, 0, CONFETTI_SIZE, CONFETTI_SIZE)
      gfx.generateTexture(key, CONFETTI_SIZE, CONFETTI_SIZE)
      gfx.destroy()
    })

    // one emitter per colour, spread across the top
    CONFETTI_COLORS.forEach((_color, i) => {
      this.add.particles(w / 2, -10, `confetti${i}`, {
        x: { min: -w / 2, max: w / 2 },
        speedY: { min: 60, max: 200 },
        speedX: { min: -80, max: 80 },
        angle: { min: 0, max: 360 },
        rotate: { min: 0, max: 360 },
        scale: { start: 1, end: 0.3 },
        alpha: { start: 1, end: 0.4 },
        lifespan: { min: 2000, max: 4000 },
        frequency: 120,
        quantity: 1,
        gravityY: 40,
      })
    })
  }
}
