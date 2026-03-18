import Phaser from 'phaser'
import { S } from '../config/gameConfig'

const DISPLAY_SIZE = Math.round(70 * S)
const PAYPAL_DISPLAY_SIZE = Math.round(50 * S)
const COIN_KEYS = ['dollar1', 'paypal1']

export class Coin extends Phaser.Physics.Arcade.Image {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    const key = COIN_KEYS[Math.floor(Math.random() * COIN_KEYS.length)]
    super(scene, x, y, key)
    scene.add.existing(this)
    scene.physics.add.existing(this, true)

    // Fit into size box while keeping aspect ratio
    const size = key === 'paypal1' ? PAYPAL_DISPLAY_SIZE : DISPLAY_SIZE
    const src = this.texture.getSourceImage()
    const ratio = src.width / src.height
    if (ratio >= 1) {
      this.setDisplaySize(size, size / ratio)
    } else {
      this.setDisplaySize(size * ratio, size)
    }
    this.setDepth(10)

    // Correct the static body offset so it's centered on (x, y).
    // updateFromGameObject uses unscaled displayOrigin for position but
    // display-pixel dimensions for size, which misaligns scaled sprites.
    const body = this.body as Phaser.Physics.Arcade.StaticBody
    const offsetX = this.displayOriginX - this.displayWidth / 2
    const offsetY = this.displayOriginY - this.displayHeight / 2
    body.setOffset(offsetX, offsetY)
    body.updateFromGameObject()
  }

  collect(): void {
    this.disableBody(true, true)
  }
}
