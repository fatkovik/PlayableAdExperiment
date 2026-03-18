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
    heartUrl,
    uiBannerLandscapeUrl,
    uiPaypalHeader,
    uiBackgroundPulse,
    uiFailIcon,
    uiPointerHand,
} from '../assets'

// Player:  848×1233, 4 cols × 4 rows → 212×308 px per frame
//   Row 0 (frames  0– 3): idle / standing still
//   Row 1 (frames  4– 7): run
//   Row 2 (frames  8–11): jump
//   Row 3 (frames 12–15): hit / die
// (1 px remainder at bottom is ignored by Phaser)
const PLAYER_FRAME = { frameWidth: 212, frameHeight: 308 }

// Enemy spritesheet: dimensions are approximate — TODO if frames look wrong.
const ENEMY_FRAME = { frameWidth: 252, frameHeight: 260 }

export class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' })
    }

    preload(): void {
        this.createLoadingBar()

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

        // UI
        this.load.image('heart', heartUrl)
        this.load.image('uiBannerLandscape', uiBannerLandscapeUrl)

        this.load.image('uiFailIcon', uiFailIcon)
        this.load.image('uiPaypalHeader', uiPaypalHeader)
        this.load.image('uiBackgroundPulse', uiBackgroundPulse)
        this.load.image('uiPointerHand', uiPointerHand)
    }

    create(): void {
        this.scene.start('GameScene')
    }

    private createLoadingBar(): void {
        const { width, height } = this.scale
        const cx = width / 2
        const cy = height / 2
        const s = Math.max(1, height / 600)
        const barW = Math.round(400 * s)
        const barH = Math.round(20 * s)

        this.add.text(cx, cy - Math.round(40 * s), 'Loading…', {
            fontSize: `${Math.round(18 * s)}px`,
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
