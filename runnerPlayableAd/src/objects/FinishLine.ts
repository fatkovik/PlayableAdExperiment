import Phaser from 'phaser'
import { WORLD_WIDTH, GROUND_Y } from '../config/gameConfig'

const FINISH_X = WORLD_WIDTH - 200
const POLE_WIDTH = 10
const POLE_HEIGHT = 90               // shorter poles — rope is at player level
const TAPE_WIDTH = 260                // wider span between poles
const TAPE_THICKNESS = 10             // thinner ribbon for rope look
const NUM_POINTS = 32                 // more vertices for smoother longer rope
const SWAY_AMP = 3                    // gentle idle sway in px
const SWAY_SPEED = 1.2                // cycles / sec
const SAG_AMOUNT = 22                 // more sag for longer rope
const ROPE_Y = GROUND_Y - 50         // chest-height of the player
const ROPE_LOW_OFFSET = 50                  // right pole sits this many px lower than left

// Cut animation
const CUT_GRAVITY = 600               // px/s² gravity on cut halves
const CUT_SWING_SPEED = 8             // radial swing speed
const CUT_SWING_DECAY = 3             // how fast swing dampens
const CUT_INITIAL_FLING = -120        // initial upward fling on cut ends

export class FinishLine {
  private scene: Phaser.Scene
  private rope!: Phaser.GameObjects.Rope
  private triggerZone!: Phaser.Physics.Arcade.Sprite
  private leftPole!: Phaser.GameObjects.Image
  private rightPole!: Phaser.GameObjects.Image
  private elapsed = 0
  private finished = false

  // Cut state — two separate halves
  private isCut = false
  private cutTime = 0
  private leftHalf!: Phaser.GameObjects.Rope
  private rightHalf!: Phaser.GameObjects.Rope

  constructor(scene: Phaser.Scene) {
    this.scene = scene
    this.createTapeTexture()
    this.createPoles()
    this.createRope()
    this.createTriggerZone()
  }

  getTriggerZone(): Phaser.Physics.Arcade.Sprite {
    return this.triggerZone
  }

  update(dt: number): void {
    this.elapsed += dt / 1000

    if (this.isCut) {
      this.updateCutHalves(dt / 1000)
      return
    }

    if (this.finished) return

    // Idle animation: sway + sag (catenary) + slope from lower right pole
    const points = this.rope.points as Phaser.Math.Vector2[]
    for (let i = 0; i < points.length; i++) {
      const norm = i / (points.length - 1)
      // Slope: right pole sits lower
      const slope = norm * ROPE_LOW_OFFSET
      // Catenary / parabolic sag — peaks in the middle
      const sag = SAG_AMOUNT * 4 * norm * (1 - norm)
      // Gentle wave sway
      const sway = Math.sin(this.elapsed * SWAY_SPEED * Math.PI * 2 + norm * Math.PI) * SWAY_AMP
      // Additional subtle bounce that travels along the rope
      const bounce = Math.sin(this.elapsed * 3.5 + norm * Math.PI * 2) * 1.2
      points[i].y = slope + sag + sway + bounce
    }

    this.rope.setDirty()
  }

  snap(onComplete: () => void): void {
    if (this.finished) return
    this.finished = true

    // Create two rope halves, then hide the original
    this.createCutHalves()
    this.rope.setVisible(false)
    this.isCut = true
    this.cutTime = 0

    this.scene.time.delayedCall(1000, onComplete)
  }

  /* ── Cut halves ──────────────────────────────────────────────────────── */

  private createCutHalves(): void {
    const halfCount = Math.ceil(NUM_POINTS / 2)
    const halfSpan = TAPE_WIDTH / 2

    // Snapshot current rope point y-offsets
    const srcPoints = this.rope.points as Phaser.Math.Vector2[]

    // Left half — attached to left pole, free end in the middle
    const leftPts: Phaser.Math.Vector2[] = []
    for (let i = 0; i < halfCount; i++) {
      const t = i / (halfCount - 1)
      leftPts.push(new Phaser.Math.Vector2(
        -halfSpan + t * halfSpan,
        srcPoints[i]?.y ?? 0,
      ))
    }
    this.leftHalf = this.scene.add.rope(FINISH_X, ROPE_Y, 'finishTape', undefined, leftPts)
    this.leftHalf.setDepth(9)

    // Right half — attached to right pole, free end in the middle
    const rightPts: Phaser.Math.Vector2[] = []
    for (let i = 0; i < halfCount; i++) {
      const t = i / (halfCount - 1)
      rightPts.push(new Phaser.Math.Vector2(
        t * halfSpan,
        srcPoints[halfCount - 1 + i]?.y ?? 0,
      ))
    }
    this.rightHalf = this.scene.add.rope(FINISH_X, ROPE_Y, 'finishTape', undefined, rightPts)
    this.rightHalf.setDepth(9)
  }

  private updateCutHalves(dt: number): void {
    this.cutTime += dt

    const t = this.cutTime
    const halfCount = Math.ceil(NUM_POINTS / 2)

    // Left half — pivot at index 0 (pole), free end swings down
    const leftPts = this.leftHalf.points as Phaser.Math.Vector2[]
    for (let i = 0; i < leftPts.length; i++) {
      const norm = i / (leftPts.length - 1)   // 0 at pole, 1 at cut end
      // Swing: free end drops under gravity + pendulum-like swing
      const swing = Math.sin(t * CUT_SWING_SPEED) * Math.exp(-t * CUT_SWING_DECAY)
      const gravity = 0.5 * CUT_GRAVITY * t * t * norm
      const fling = CUT_INITIAL_FLING * t * norm * Math.exp(-t * 3)
      leftPts[i].y = norm * (gravity + fling + swing * 30)
    }
    this.leftHalf.setDirty()

    // Right half — pivot at last index (pole), free end swings down
    const rightPts = this.rightHalf.points as Phaser.Math.Vector2[]
    for (let i = 0; i < rightPts.length; i++) {
      const norm = 1 - i / (rightPts.length - 1)   // 1 at cut end, 0 at pole
      const swing = Math.sin(t * CUT_SWING_SPEED + 0.5) * Math.exp(-t * CUT_SWING_DECAY)
      const gravity = 0.5 * CUT_GRAVITY * t * t * norm
      const fling = CUT_INITIAL_FLING * t * norm * Math.exp(-t * 3)
      rightPts[i].y = norm * (gravity + fling + swing * 30)
    }
    this.rightHalf.setDirty()

    // Clamp — stop once the halves have fallen to the ground
    const maxDrop = GROUND_Y - ROPE_Y
    if (0.5 * CUT_GRAVITY * t * t > maxDrop + 40) {
      // Freeze in final dangling position along poles
      for (let i = 0; i < leftPts.length; i++) {
        const norm = i / (leftPts.length - 1)
        leftPts[i].x = -TAPE_WIDTH / 2
        leftPts[i].y = norm * maxDrop
      }
      for (let i = 0; i < rightPts.length; i++) {
        const norm = i / (rightPts.length - 1)
        rightPts[i].x = TAPE_WIDTH / 2
        rightPts[i].y = (1 - norm) * maxDrop
      }
      this.leftHalf.setDirty()
      this.rightHalf.setDirty()
      this.isCut = false   // stop updating
    }
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
    const halfSpan = TAPE_WIDTH / 2

    const gfx = this.scene.add.graphics()
    gfx.fillStyle(0xcccccc, 1)
    gfx.fillRect(0, 0, POLE_WIDTH, POLE_HEIGHT)
    gfx.fillStyle(0x999999, 1)
    gfx.fillRect(0, 0, 3, POLE_HEIGHT)
    gfx.fillStyle(0xffd700, 1)
    gfx.fillRoundedRect(-2, -6, POLE_WIDTH + 4, 10, 3)
    gfx.generateTexture('finishPole', POLE_WIDTH + 4, POLE_HEIGHT + 6)
    gfx.destroy()

    const leftPoleTop = GROUND_Y - POLE_HEIGHT
    this.leftPole = this.scene.add.image(FINISH_X - halfSpan, leftPoleTop, 'finishPole')
    this.leftPole.setOrigin(0.5, 0).setDepth(8)

    // Same height pole, just positioned lower on screen
    const rightPoleTop = GROUND_Y - POLE_HEIGHT + ROPE_LOW_OFFSET
    this.rightPole = this.scene.add.image(FINISH_X + halfSpan, rightPoleTop, 'finishPole')
    this.rightPole.setOrigin(0.5, 0).setDepth(8)
  }

  private createRope(): void {
    const points: Phaser.Math.Vector2[] = []
    const halfSpan = TAPE_WIDTH / 2

    for (let i = 0; i < NUM_POINTS; i++) {
      const t = i / (NUM_POINTS - 1)
      const slope = t * ROPE_LOW_OFFSET
      const sag = SAG_AMOUNT * 4 * t * (1 - t)
      points.push(new Phaser.Math.Vector2(
        -halfSpan + t * TAPE_WIDTH,
        slope + sag,
      ))
    }

    this.rope = this.scene.add.rope(FINISH_X, ROPE_Y, 'finishTape', undefined, points)
    this.rope.setDepth(9)
  }

  private createTriggerZone(): void {
    this.triggerZone = this.scene.physics.add.sprite(FINISH_X, ROPE_Y, '__DEFAULT')
    this.triggerZone.setDisplaySize(30, POLE_HEIGHT)
    this.triggerZone.setAlpha(0)
    const body = this.triggerZone.body as Phaser.Physics.Arcade.Body
    body.setAllowGravity(false)
    body.setImmovable(true)
  }
}
