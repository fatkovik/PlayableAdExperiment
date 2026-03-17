import Phaser from 'phaser'

const SCALE = 0.15  // 1024×1024 source → ~51×51 displayed

export class Coin extends Phaser.Physics.Arcade.Image {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'dollar1')
    scene.add.existing(this)
    scene.physics.add.existing(this, true)  // static body (no gravity)

    this.setScale(SCALE)
    this.setDepth(10)

    // Sync the static body to the scaled size (body was created at full texture size).
    ;(this.body as Phaser.Physics.Arcade.StaticBody).updateFromGameObject()

    // Idle "spin" — squish scaleX to fake a 3-D coin flip.
    scene.tweens.add({
      targets: this,
      scaleX: { from: SCALE, to: SCALE * 0.15 },
      duration: 400,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    })
  }

  collect(): void {
    this.disableBody(true, true)  // remove from physics + display
  }
}
