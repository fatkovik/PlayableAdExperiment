import Phaser from 'phaser'
import { WORLD_WIDTH, GROUND_Y, GAMEPLAY_Y, S } from '../config/gameConfig'

const FINISH_X = WORLD_WIDTH - Math.round(200 * S)
const POLE_WIDTH = Math.round(10 * S)
const POLE_HEIGHT = Math.round(90 * S)
const TAPE_WIDTH = Math.round(260 * S)
const TAPE_THICKNESS = Math.round(10 * S)
const NUM_POINTS = 32
const SWAY_AMP = 3 * S
const SWAY_SPEED = 1.2
const SAG_AMOUNT = 22 * S
const ROPE_Y = GROUND_Y - Math.round(50 * S)
const ROPE_LOW_OFFSET = Math.round(135 * S)

// Confetti
const CONFETTI_COLORS = [0xff0000, 0x00cc00, 0x0066ff, 0xffdd00, 0xff66cc, 0x00ddff, 0xff8800]
const CONFETTI_COUNT = 500

// Cut animation
const CUT_GRAVITY = 600 * S
const CUT_SWING_SPEED = 8
const CUT_SWING_DECAY = 3
const CUT_INITIAL_FLING = -120 * S

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
    private leftBaseY: number[] = []     // initial y offsets at moment of cut
    private rightBaseY: number[] = []

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
            const slope = norm * ROPE_LOW_OFFSET
            const sag = SAG_AMOUNT * 4 * norm * (1 - norm)
            const sway = Math.sin(this.elapsed * SWAY_SPEED * Math.PI * 2 + norm * Math.PI) * SWAY_AMP
            const bounce = Math.sin(this.elapsed * 3.5 + norm * Math.PI * 2) * 1.2 * S
            points[i].y = slope + sag + sway + bounce
        }

        this.rope.setDirty()
    }

    snap(onComplete: () => void): void {
        if (this.finished) return
        this.finished = true

        this.createCutHalves()
        this.rope.setVisible(false)
        this.isCut = true
        this.cutTime = 0

        this.launchConfetti()

        this.scene.time.delayedCall(1000, onComplete)
    }

    /* ── Cut halves ──────────────────────────────────────────────────────── */

    private createCutHalves(): void {
        const midIdx = Math.floor(NUM_POINTS / 2)
        const srcPoints = this.rope.points as Phaser.Math.Vector2[]

        const leftPts: Phaser.Math.Vector2[] = []
        this.leftBaseY = []
        for (let i = 0; i <= midIdx; i++) {
            leftPts.push(new Phaser.Math.Vector2(srcPoints[i].x, srcPoints[i].y))
            this.leftBaseY.push(srcPoints[i].y)
        }
        this.leftHalf = this.scene.add.rope(FINISH_X, ROPE_Y, 'finishTape', undefined, leftPts)
        this.leftHalf.setDepth(9)

        const rightPts: Phaser.Math.Vector2[] = []
        this.rightBaseY = []
        for (let i = midIdx; i < NUM_POINTS; i++) {
            rightPts.push(new Phaser.Math.Vector2(srcPoints[i].x, srcPoints[i].y))
            this.rightBaseY.push(srcPoints[i].y)
        }
        this.rightHalf = this.scene.add.rope(FINISH_X, ROPE_Y, 'finishTape', undefined, rightPts)
        this.rightHalf.setDepth(9)
    }

    private updateCutHalves(dt: number): void {
        this.cutTime += dt
        const t = this.cutTime

        const leftPts = this.leftHalf.points as Phaser.Math.Vector2[]
        for (let i = 0; i < leftPts.length; i++) {
            const norm = i / (leftPts.length - 1)
            const swing = Math.sin(t * CUT_SWING_SPEED) * Math.exp(-t * CUT_SWING_DECAY)
            const gravity = 0.5 * CUT_GRAVITY * t * t * norm
            const fling = CUT_INITIAL_FLING * t * norm * Math.exp(-t * 3)
            leftPts[i].y = this.leftBaseY[i] + norm * (gravity + fling + swing * 30 * S)
        }
        this.leftHalf.setDirty()

        const rightPts = this.rightHalf.points as Phaser.Math.Vector2[]
        const lastIdx = rightPts.length - 1
        for (let i = 0; i < rightPts.length; i++) {
            const norm = 1 - i / lastIdx
            const swing = Math.sin(t * CUT_SWING_SPEED + 0.5) * Math.exp(-t * CUT_SWING_DECAY)
            const gravity = 0.5 * CUT_GRAVITY * t * t * norm
            const fling = CUT_INITIAL_FLING * t * norm * Math.exp(-t * 3)
            rightPts[i].y = this.rightBaseY[i] + norm * (gravity + fling + swing * 30 * S)
        }
        this.rightHalf.setDirty()

        const maxDrop = GROUND_Y - ROPE_Y + 40 * S
        if (0.5 * CUT_GRAVITY * t * t > maxDrop) {
            this.isCut = false
        }
    }

    /* ── Confetti ───────────────────────────────────────────────────────── */

    private createConfettiTextures(): void {
        const sz = Math.max(Math.round(8 * S), 4)
        const szH = Math.max(Math.round(6 * S), 3)
        for (let i = 0; i < CONFETTI_COLORS.length; i++) {
            const key = `confetti_${i}`
            if (this.scene.textures.exists(key)) continue
            const gfx = this.scene.add.graphics()
            gfx.fillStyle(CONFETTI_COLORS[i], 1)
            gfx.fillRect(0, 0, sz, szH)
            gfx.generateTexture(key, sz, szH)
            gfx.destroy()
        }
    }

    private launchConfetti(): void {
        this.createConfettiTextures()
        const halfSpan = TAPE_WIDTH / 2
        const leftX = FINISH_X - halfSpan
        const rightX = FINISH_X + halfSpan
        const leftY = GROUND_Y - POLE_HEIGHT
        const rightY = GROUND_Y - POLE_HEIGHT + ROPE_LOW_OFFSET

        this.emitConfettiAt(leftX, leftY)
        this.emitConfettiAt(rightX, rightY)
    }

    private emitConfettiAt(x: number, y: number): void {
        for (let i = 0; i < CONFETTI_COUNT; i++) {
            const colorIdx = Phaser.Math.Between(0, CONFETTI_COLORS.length - 1)
            const piece = this.scene.add.image(x, y, `confetti_${colorIdx}`)
                .setDepth(12)
                .setRotation(Math.random() * Math.PI * 2)
                .setScale(Phaser.Math.FloatBetween(0.6, 1.4))

            const spreadX = Phaser.Math.FloatBetween(-60 * S, 60 * S)
            const launchVY = Phaser.Math.FloatBetween(-350 * S, -550 * S)
            const peakTime = 0.45
            const gravity = 600 * S

            const peakX = x + spreadX
            const peakY = y + launchVY * peakTime + 0.5 * gravity * peakTime * peakTime

            const driftX = Phaser.Math.FloatBetween(-80 * S, 80 * S)
            const fallTime = Phaser.Math.FloatBetween(0.6, 1.0)
            const endX = peakX + driftX
            const endY = peakY + 0.5 * gravity * fallTime * fallTime

            const delay = Phaser.Math.Between(0, 1000)

            this.scene.tweens.add({
                targets: piece,
                x: peakX,
                y: peakY,
                rotation: piece.rotation + Phaser.Math.FloatBetween(-3, 3),
                duration: peakTime * 1000,
                ease: 'Cubic.easeOut',
                delay,
                onComplete: () => {
                    this.scene.tweens.add({
                        targets: piece,
                        x: endX,
                        y: endY,
                        rotation: piece.rotation + Phaser.Math.FloatBetween(-4, 4),
                        alpha: 0,
                        scaleX: Phaser.Math.FloatBetween(0.3, 0.6),
                        scaleY: Phaser.Math.FloatBetween(0.3, 0.6),
                        duration: fallTime * 1000,
                        ease: 'Sine.easeIn',
                        onComplete: () => piece.destroy(),
                    })
                },
            })
        }
    }

    /* ── Internal setup ─────────────────────────────────────────────────── */

    private createTapeTexture(): void {
        const gfx = this.scene.add.graphics()
        const stripeW = Math.round(14 * S)
        const numStripes = Math.ceil((TAPE_WIDTH + 40 * S) / stripeW)
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
        gfx.fillRect(0, 0, Math.round(3 * S), POLE_HEIGHT)
        gfx.fillStyle(0xffd700, 1)
        gfx.fillRoundedRect(-Math.round(2 * S), -Math.round(6 * S), POLE_WIDTH + Math.round(4 * S), Math.round(10 * S), Math.round(3 * S))
        gfx.generateTexture('finishPole', POLE_WIDTH + Math.round(4 * S), POLE_HEIGHT + Math.round(6 * S))
        gfx.destroy()

        const leftPoleTop = GROUND_Y - POLE_HEIGHT
        this.leftPole = this.scene.add.image(FINISH_X - halfSpan, leftPoleTop, 'finishPole')
        this.leftPole.setOrigin(0.5, 0).setDepth(8)

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
        this.triggerZone = this.scene.physics.add.sprite(FINISH_X, GAMEPLAY_Y - POLE_HEIGHT / 2, '__DEFAULT')
        this.triggerZone.setDisplaySize(Math.round(30 * S), GAMEPLAY_Y - ROPE_Y + POLE_HEIGHT)
        this.triggerZone.setAlpha(0)
        const body = this.triggerZone.body as Phaser.Physics.Arcade.Body
        body.setAllowGravity(false)
        body.setImmovable(true)
    }
}
