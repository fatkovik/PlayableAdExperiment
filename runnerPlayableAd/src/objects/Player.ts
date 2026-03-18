import Phaser from 'phaser'
import { PLAYER_SPEED, JUMP_VELOCITY, PLAYER_SCALE } from '../config/gameConfig'

// Spritesheet layout: 4 cols × 4 rows, 212×308 px per frame
// Row 0 (frames  0– 3): idle / standing still
// Row 1 (frames  4– 7): run
// Row 2 (frames  8–11): jump
// Row 3 (frames 12–15): hit / die
const ANIMS = {
    idle: { start: 0, end: 3, frameRate: 6, repeat: -1 },
    run: { start: 4, end: 7, frameRate: 10, repeat: -1 },
    jump: { start: 9, end: 10, frameRate: 8, repeat: -1 },
    hit: { start: 13, end: 13, frameRate: 1, repeat: 0 },
    die: { start: 12, end: 15, frameRate: 8, repeat: 0 },
} as const

// Hitbox — frame-local pixels (Phaser multiplies by sprite scale automatically).
const BODY_W = 50
const BODY_H = 180

const HIT_SLOWDOWN = 0.4       // speed multiplier during hit stagger
const HIT_SLOW_DURATION = 400  // ms at reduced speed
const INVINCIBLE_DURATION = 1200 // ms of invincibility after hit (includes slow period)
const BLINK_RATE = 100          // ms per blink toggle during invincibility

export class Player extends Phaser.Physics.Arcade.Sprite {
    private isJumping = false
    isDead = false
    isInvincible = false

    constructor(scene: Phaser.Scene, x: number, y: number) {
        super(scene, x, y, 'player', 0)
        scene.add.existing(this)
        scene.physics.add.existing(this)

        this.setScale(PLAYER_SCALE)
        this.setDepth(10)
        this.setOrigin(2, 0.5)        // (x, y) = feet / bottom-centre
        this.setCollideWorldBounds(true)

        // Offset is in frame-local coords (Phaser multiplies by scale).
        // Frame: 212×308 px.
        const body = this.body as Phaser.Physics.Arcade.Body
        body.setSize(BODY_W, BODY_H)
        body.setOffset(
            (212 - BODY_W) / 2,   // center horizontally in frame
            308 - BODY_H,          // align to bottom of frame
        )

        this.play('run')
    }

    // Call once from GameScene.create() after 'player' texture is loaded.
    static createAnims(anims: Phaser.Animations.AnimationManager): void {
        for (const [key, cfg] of Object.entries(ANIMS)) {
            anims.create({
                key,
                frames: anims.generateFrameNumbers('player', { start: cfg.start, end: cfg.end }),
                frameRate: cfg.frameRate,
                repeat: cfg.repeat,
            })
        }
    }

    jump(): void {
        if (this.isDead) return
        const body = this.body as Phaser.Physics.Arcade.Body
        if (!body.blocked.down) return   // single jump only
        this.isJumping = true
        body.setVelocityY(JUMP_VELOCITY)
        this.play('jump', true)
    }

    takeHit(): void {
        if (this.isInvincible || this.isDead) return
        this.isInvincible = true

        const body = this.body as Phaser.Physics.Arcade.Body

        // Play hit animation, then resume run
        this.play('hit', true)
        this.scene.time.delayedCall(HIT_SLOW_DURATION, () => {
            if (!this.isDead) this.play('run', true)
        })

        // Red flash
        this.setTint(0xff0000)
        this.scene.time.delayedCall(150, () => { this.clearTint() })

        // brief slowdown
        body.setVelocityX(PLAYER_SPEED * HIT_SLOWDOWN)

        // resume full speed after slow period
        this.scene.time.delayedCall(HIT_SLOW_DURATION, () => {
            if (!this.isDead) body.setVelocityX(PLAYER_SPEED)
        })

        // blink effect during invincibility
        const blink = this.scene.time.addEvent({
            delay: BLINK_RATE,
            repeat: Math.floor(INVINCIBLE_DURATION / BLINK_RATE) - 1,
            callback: () => { this.setAlpha(this.alpha === 1 ? 0.3 : 1) },
        })

        // end invincibility
        this.scene.time.delayedCall(INVINCIBLE_DURATION, () => {
            blink.destroy()
            this.setAlpha(1)
            this.isInvincible = false
        })
    }

    halt(): void {
        if (this.isDead) return
        this.isDead = true   // reuse flag to halt movement
        this.play('idle', true)
        const body = this.body as Phaser.Physics.Arcade.Body
        body.setVelocityX(0)
    }

    die(): void {
        if (this.isDead) return
        this.isDead = true
        this.play('die', true)
        const body = this.body as Phaser.Physics.Arcade.Body
        body.setVelocityX(0)
        body.setVelocityY(0)
    }

    update(): void {
        if (this.isDead) return
        const body = this.body as Phaser.Physics.Arcade.Body
        body.setVelocityX(PLAYER_SPEED)

        if (this.isJumping && body.blocked.down) {
            this.isJumping = false
            this.play('run', true)
        }
    }
}
