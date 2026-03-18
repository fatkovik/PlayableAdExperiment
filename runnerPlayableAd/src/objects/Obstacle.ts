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

    // ── Outline image drawn under the obstacle ───────────────────────────────
    scene.add.image(x, y, 'obstacleOutline')
      .setScale(SCALE)
      .setOrigin(0.5, 1.0)
      .setDepth(9)

    // ── "EVADE" label above obstacle ─────────────────────────────────────────
    const labelY = y - this.displayHeight - Math.round(12 * S)
    const fontSize = Math.round(14 * S)
    const padX = Math.round(10 * S)
    const padY = Math.round(4 * S)

    const label = scene.add.text(x, labelY, 'EVADE', {
      fontSize: `${fontSize}px`,
      color: '#ff0000',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: Math.round(2 * S),
    }).setOrigin(0.5).setDepth(11)

    const boxW = label.width + padX * 2
    const boxH = label.height + padY * 2
    const box = scene.add.graphics().setDepth(10.5)
    box.fillStyle(0x000000, 0.6)
    box.fillRoundedRect(x - boxW / 2, labelY - boxH / 2, boxW, boxH, Math.round(4 * S))
    box.lineStyle(Math.round(2 * S), 0xff0000, 0.8)
    box.strokeRoundedRect(x - boxW / 2, labelY - boxH / 2, boxW, boxH, Math.round(4 * S))
  }
}
