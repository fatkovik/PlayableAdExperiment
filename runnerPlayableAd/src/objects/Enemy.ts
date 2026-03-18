import Phaser from 'phaser'
import { GAMEPLAY_Y, PLAYER_SPEED, S } from '../config/gameConfig'

const ENEMY_SCALE = 0.5 * S
const TOTAL_SPEED = -(PLAYER_SPEED * 0.6)
// Frame-local pixels (Phaser multiplies by sprite scale automatically)
const BODY_W = 50
const BODY_H = 70

// Spritesheet layout: 4 cols × 4 rows, 252×260 per frame
// Row 0 (0-3):  idle
// Row 1 (4-7):  run
// Row 2 (8-11): run alt / attack
// Row 3 (12-15): other
const RUN_ANIM = { start: 4, end: 7, frameRate: 10, repeat: -1 }

export class Enemy extends Phaser.Physics.Arcade.Sprite {
  constructor(scene: Phaser.Scene, x: number) {
    super(scene, x, GAMEPLAY_Y, 'enemy', RUN_ANIM.start)
    scene.add.existing(this)
    scene.physics.add.existing(this)

    this.setScale(ENEMY_SCALE)
    this.setDepth(10)
    this.setOrigin(0.5, 1.0)

    // Flip to face left (toward the player)
    this.setFlipX(true)

    const body = this.body as Phaser.Physics.Arcade.Body
    body.setVelocityX(TOTAL_SPEED)
    // Offset in frame-local coords (252×260 frame).
    body.setSize(BODY_W, BODY_H)
    body.setOffset(
      (252 - BODY_W) / 2,
      260 - BODY_H,
    )

    this.play('enemy_run')
  }

  update(): void {
    // Re-assert horizontal velocity each frame so ground friction can't stop us
    const body = this.body as Phaser.Physics.Arcade.Body
    body.setVelocityX(TOTAL_SPEED)
  }

  static createAnims(anims: Phaser.Animations.AnimationManager): void {
    if (anims.exists('enemy_run')) return
    anims.create({
      key: 'enemy_run',
      frames: anims.generateFrameNumbers('enemy', {
        start: RUN_ANIM.start,
        end: RUN_ANIM.end,
      }),
      frameRate: RUN_ANIM.frameRate,
      repeat: RUN_ANIM.repeat,
    })
  }
}
