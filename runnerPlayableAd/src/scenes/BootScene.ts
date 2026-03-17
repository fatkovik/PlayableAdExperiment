import Phaser from 'phaser'
import {
  playerSheetUrl,
  enemySheetUrl,
  backgroundUrl,
  bush1Url,
  bush2Url,
  bush3Url,
  lamp1Url,
  tree1Url,
  tree2Url,
  dollar1Url,
  paypal1Url,
  obstacle1Url,
} from '../assets'

// Frame dimensions measured from spritesheet pixel sizes:
//   Player: 932×1506 → 4 cols × 9 rows → 233×167 px per frame
//   Enemy:  1682×1771 → 8 cols × 10 rows → 210×177 px per frame
const PLAYER_FRAME = { frameWidth: 233, frameHeight: 167 }
const ENEMY_FRAME = { frameWidth: 210, frameHeight: 177 }

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' })
  }

  preload(): void {
    this.createLoadingBar()

    // Spritesheets
    this.load.spritesheet('player', playerSheetUrl, PLAYER_FRAME)
    this.load.spritesheet('enemy', enemySheetUrl, ENEMY_FRAME)

    // Environment
    this.load.image('background', backgroundUrl)
    this.load.image('bush1', bush1Url)
    this.load.image('bush2', bush2Url)
    this.load.image('bush3', bush3Url)
    this.load.image('lamp1', lamp1Url)
    this.load.image('tree1', tree1Url)
    this.load.image('tree2', tree2Url)

    // Gatherables
    this.load.image('dollar1', dollar1Url)
    this.load.image('paypal1', paypal1Url)

    // Obstacles
    this.load.image('obstacle1', obstacle1Url)
  }

  create(): void {
    this.scene.start('GameScene')
  }

  private createLoadingBar(): void {
    const { width, height } = this.scale
    const cx = width / 2
    const cy = height / 2
    const barW = 400
    const barH = 20

    this.add.text(cx, cy - 40, 'Loading…', {
      fontSize: '18px',
      color: '#ffffff',
    }).setOrigin(0.5)

    // Border
    this.add.rectangle(cx, cy, barW + 6, barH + 6, 0x444444)
    // Fill — origin left-centre so width grows rightward
    const fill = this.add.rectangle(cx - barW / 2, cy, 0, barH, 0x00cc44)
    fill.setOrigin(0, 0.5)

    this.load.on('progress', (value: number) => {
      fill.width = barW * value
    })
  }
}
