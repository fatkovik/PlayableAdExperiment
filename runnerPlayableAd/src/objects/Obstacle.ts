import Phaser from 'phaser'
import { S } from '../config/gameConfig'

const SCALE = 0.6 * S

export class Obstacle extends Phaser.Physics.Arcade.Image {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'obstacle1')
    scene.add.existing(this)
    scene.physics.add.existing(this, true)  // static body

    this.setScale(SCALE)
    this.setOrigin(0.5, 1.0)   // bottom-centre — y sits on the ground
    this.setDepth(10)

    // Sync the static body to the scaled size (body was created at full texture size).
    ;(this.body as Phaser.Physics.Arcade.StaticBody).updateFromGameObject()
  }
}
