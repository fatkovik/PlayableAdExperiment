import Phaser from 'phaser'
import { WORLD_WIDTH, GROUND_Y } from '../config/gameConfig'

const FINISH_X = WORLD_WIDTH - 200
const POLE_WIDTH = 12
const POLE_HEIGHT = 160
const TAPE_WIDTH = 140          // horizontal span between inner edges of the two poles
const TAPE_THICKNESS = 18       // texture height of the ribbon
const NUM_POINTS = 20           // vertices along the rope
const SWAY_AMP = 3              // gentle idle sway in px
const SWAY_SPEED = 2            // cycles / sec
const SNAP_AMP = 30             // wave amplitude when the player hits
const SNAP_DURATION = 600       // ms for snap animation
const TAPE_Y = GROUND_Y - POLE_HEIGHT * 0.55  // ribbon height

export class FinishLine {
  private scene: Phaser.Scene
  private rope!: Phaser.GameObjects.Rope
  private triggerZone!: Phaser.Physics.Arcade.Sprite
  private elapsed = 0
  private snapping = false
  private snapTimer = 0
  private finished = false

  constructor(scene: Phaser.Scene) {
    this.scene = scene
    this.createTapeTexture()
    this.createPoles()
    this.createRope()
    this.createTriggerZone()
  }

  /* ── Trigger zone (for overlap with player) ─────────────────────────── */
  getTriggerZone(): Phaser.Physics.Arcade.Sprite {
    return this.triggerZone
  }

  /* ── Called by GameScene.update() ────────────────────────────────────── */
  update(dt: number): void {
    this.elapsed += dt / 1000

    const points = this.rope.points as Phaser.Math.Vector2[]

    if (this.snapping) {
      this.snapTimer += dt
      const t = this.snapTimer / SNAP_DURATION
      if (t >= 1) {
        this.snapping = false
        // leave rope drooped
        for (let i = 0; i < points.length; i++) {
          points[i].y = 20 + i * 2   // sagging downward after snap
        }
      } else {
        // propagating wave
        for (let i = 0; i < points.length; i++) {
          const norm = i / (points.length - 1)
          const wave = Math.sin((norm - t * 3) * Math.PI * 4)
          const decay = 1 - t
          points[i].y = wave * SNAP_AMP * decay
        }
      }
    } else if (!this.finished) {
      // gentle idle sway
      for (let i = 0; i < points.length; i++) {
        const norm = i / (points.length - 1)
        points[i].y = Math.sin(this.elapsed * SWAY_SPEED * Math.PI * 2 + norm * Math.PI) * SWAY_AMP
      }
    }

    this.rope.setDirty()
  }

  /* ── Trigger the snap animation ─────────────────────────────────────── */
  snap(onComplete: () => void): void {
    if (this.finished) return
    this.finished = true
    this.snapping = true
    this.snapTimer = 0

    this.scene.time.delayedCall(SNAP_DURATION + 400, onComplete)
  }

  /* ── Internal setup ─────────────────────────────────────────────────── */

  private createTapeTexture(): void {
    const gfx = this.scene.add.graphics()
    const stripeW = 14
    const numStripes = Math.ceil((TAPE_WIDTH + 40) / stripeW)
    for (let i = 0; i < numStripes; i++) {
      gfx.fillStyle(i % 2 === 0 ? 0xff0000 : 0xffffff, 1)
      gfx.fillRect(i * stripeW, 0, stripeW, TAPE_THICKNESS)
    }
    gfx.generateTexture('finishTape', numStripes * stripeW, TAPE_THICKNESS)
    gfx.destroy()
  }

  private createPoles(): void {
    const poleTop = GROUND_Y - POLE_HEIGHT

    const gfx = this.scene.add.graphics()
    // pole body
    gfx.fillStyle(0xcccccc, 1)
    gfx.fillRect(0, 0, POLE_WIDTH, POLE_HEIGHT)
    // dark stripe for depth
    gfx.fillStyle(0x999999, 1)
    gfx.fillRect(0, 0, 3, POLE_HEIGHT)
    // gold cap
    gfx.fillStyle(0xffd700, 1)
    gfx.fillRoundedRect(-2, -6, POLE_WIDTH + 4, 10, 3)
    gfx.generateTexture('finishPole', POLE_WIDTH + 4, POLE_HEIGHT + 6)
    gfx.destroy()

    const halfSpan = TAPE_WIDTH / 2

    const leftPole = this.scene.add.image(FINISH_X - halfSpan, poleTop, 'finishPole')
    leftPole.setOrigin(0.5, 0).setDepth(8)

    const rightPole = this.scene.add.image(FINISH_X + halfSpan, poleTop, 'finishPole')
    rightPole.setOrigin(0.5, 0).setDepth(8)
  }

  private createRope(): void {
    const points: Phaser.Math.Vector2[] = []
    const halfSpan = TAPE_WIDTH / 2

    for (let i = 0; i < NUM_POINTS; i++) {
      const t = i / (NUM_POINTS - 1)
      points.push(new Phaser.Math.Vector2(
        -halfSpan + t * TAPE_WIDTH,
        0,
      ))
    }

    this.rope = this.scene.add.rope(FINISH_X, TAPE_Y, 'finishTape', undefined, points)
    this.rope.setDepth(9)
  }

  private createTriggerZone(): void {
    // invisible sprite used as an overlap sensor
    this.triggerZone = this.scene.physics.add.sprite(FINISH_X, GROUND_Y - POLE_HEIGHT / 2, '__DEFAULT')
    this.triggerZone.setDisplaySize(30, POLE_HEIGHT)
    this.triggerZone.setAlpha(0)
    const body = this.triggerZone.body as Phaser.Physics.Arcade.Body
    body.setAllowGravity(false)
    body.setImmovable(true)
  }
}
