import Phaser from 'phaser'

const DISPLAY_SIZE = 70   // target displayed size in px (both width & height capped)
const COIN_KEYS = ['dollar1', 'paypal1']

export class Coin extends Phaser.Physics.Arcade.Image {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    const key = COIN_KEYS[Math.floor(Math.random() * COIN_KEYS.length)]
    super(scene, x, y, key)
    scene.add.existing(this)
    scene.physics.add.existing(this, true)

    // Fit into DISPLAY_SIZE box while keeping aspect ratio
    const src = this.texture.getSourceImage()
    const ratio = src.width / src.height
    if (ratio >= 1) {
      this.setDisplaySize(DISPLAY_SIZE, DISPLAY_SIZE / ratio)
    } else {
      this.setDisplaySize(DISPLAY_SIZE * ratio, DISPLAY_SIZE)
    }
    this.setDepth(10)

    // Set explicit body size to match displayed size
    const body = this.body as Phaser.Physics.Arcade.StaticBody
    body.setSize(this.displayWidth, this.displayHeight)
    body.setOffset(
      (src.width - this.displayWidth / this.scaleX) / 2,
      (src.height - this.displayHeight / this.scaleY) / 2,
    )
    body.updateFromGameObject()
  }

  collect(): void {
    this.disableBody(true, true)
  }
}
