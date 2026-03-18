import Phaser from 'phaser'
import { Background } from '../objects/Background'
import { Player } from '../objects/Player'
import { Obstacle } from '../objects/Obstacle'
import { Coin } from '../objects/Coin'
import { Enemy } from '../objects/Enemy'
import { FinishLine } from '../objects/FinishLine'
import { EnvDecor } from '../objects/EnvDecor'
import { WORLD_WIDTH, WORLD_HEIGHT, GROUND_Y, GROUND_HEIGHT, STORE_URL } from '../config/gameConfig'
import { LEVEL_DATA } from '../config/levelData'

const RESTART_DELAY = 1200   // ms after death before scene restarts
const MAX_LIVES = 3
const HEART_SIZE = 32        // display size of each heart icon
const HEART_GAP = 8          // spacing between hearts

export class GameScene extends Phaser.Scene {
    private bg!: Background
    private player!: Player
    private coinCount = 0
    private coinText!: Phaser.GameObjects.Text
    private finishLine!: FinishLine
    private lives = MAX_LIVES
    private hearts: Phaser.GameObjects.Image[] = []
    private enemies!: Phaser.Physics.Arcade.Group
    private hudIcon!: Phaser.GameObjects.Image
    private hudIconX = 0
    private hudIconY = 0
    private hudIconBaseScaleX = 1
    private hudIconBaseScaleY = 1
    private started = false
    private shownJumpHint = false
    private bannerContainer!: Phaser.GameObjects.Container

    constructor() {
        super({ key: 'GameScene' })
    }

    create(): void {
        // ── World bounds ──────────────────────────────────────────────────────────
        this.physics.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT)

        // ── Parallax background ───────────────────────────────────────────────────
        this.bg = new Background(this)

        // ── Static ground ─────────────────────────────────────────────────────────
        const ground = this.physics.add.staticImage(
            WORLD_WIDTH / 2,
            GROUND_Y + GROUND_HEIGHT / 2,
            '__DEFAULT',
        )
        ground.setDisplaySize(WORLD_WIDTH, GROUND_HEIGHT)
        ground.setAlpha(0)
        ground.refreshBody()

        // ── Environment decoration ────────────────────────────────────────────────
        new EnvDecor(this)

        // ── Player ────────────────────────────────────────────────────────────────
        Player.createAnims(this.anims)
        this.player = new Player(this, 300, GROUND_Y)

        // ── Obstacles & Coins from level data ─────────────────────────────────────
        const obstacles = this.physics.add.staticGroup()
        const coins = this.physics.add.staticGroup()

        for (const item of LEVEL_DATA) {
            if (item.type === 'obstacle') {
                obstacles.add(new Obstacle(this, item.x, item.y))
            } else {
                coins.add(new Coin(this, item.x, item.y))
            }
        }

        // ── Enemies ──────────────────────────────────────────────────────────────
        Enemy.createAnims(this.anims)
        this.enemies = this.physics.add.group()
        const ENEMY_POSITIONS = [1100, 1750, 2400, 3200]
        for (const ex of ENEMY_POSITIONS) {
            this.enemies.add(new Enemy(this, ex))
        }

        // ── Finish line ───────────────────────────────────────────────────────────
        this.finishLine = new FinishLine(this)

        // ── Collisions ────────────────────────────────────────────────────────────
        this.physics.add.collider(this.player, ground)

        this.physics.add.collider(this.enemies, ground)

        // Obstacle → die
        this.physics.add.collider(this.player, obstacles, () => {
            this.handleDeath()
        })

        // Enemy → die (overlap so they pass through, no physics push)
        this.physics.add.overlap(this.player, this.enemies, () => {
            this.handleDeath()
        })

        // Coin → collect with fly-to-icon animation
        this.physics.add.overlap(this.player, coins, (_player, coinObj) => {
            const coin = coinObj as Coin
            coin.collect()
            this.coinCount++
            this.coinText.setText(`$${this.coinCount}`)
            this.flyCoinToIcon(coin.x, coin.y, coin.texture.key)
        })

        // Finish line → win
        this.physics.add.overlap(this.player, this.finishLine.getTriggerZone(), () => {
            this.handleFinish()
        })

        // ── Camera ────────────────────────────────────────────────────────────────
        this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT)
        this.cameras.main.startFollow(this.player, false, 1, 1)
        this.cameras.main.setFollowOffset(100, 0)

        // ── Input ─────────────────────────────────────────────────────────────────
        this.input.keyboard!.on('keydown-SPACE', () => {
            if (!this.started) return
            this.player.jump()
        })
        this.input.on('pointerdown', (_pointer: Phaser.Input.Pointer, currentlyOver: Phaser.GameObjects.GameObject[]) => {
            if (!this.started) return
            // Don't jump when tapping the bottom banner
            if (currentlyOver.length > 0) return
            this.player.jump()
        })

        // ── HUD ───────────────────────────────────────────────────────────────────
        this.coinCount = 0
        this.lives = MAX_LIVES

        const { width, height } = this.scale

        // Coin counter — top-right with PayPal icon underneath
        const coinIconSize = 80
        const coinIconX = width - 100
        const coinIconY = 45
        this.hudIconX = coinIconX
        this.hudIconY = coinIconY
        this.hudIcon = this.add.image(coinIconX, coinIconY, 'uiPaypalHeader')
            .setScrollFactor(0).setDepth(100)
        const pSrc = this.hudIcon.texture.getSourceImage()
        const pRatio = pSrc.width / pSrc.height
        this.hudIcon.setDisplaySize(coinIconSize * pRatio, coinIconSize)
        this.hudIconBaseScaleX = this.hudIcon.scaleX
        this.hudIconBaseScaleY = this.hudIcon.scaleY

        const cointTextX = coinIconX + 20
        const coinTextY = coinIconY

        this.coinText = this.add
            .text(cointTextX, coinTextY, '$0', {
                fontSize: '20px', color: '#1b49f2',
                stroke: '#000000', strokeThickness: 2,
            })
            .setOrigin(0.5)
            .setScrollFactor(0)
            .setDepth(101)

        // Hearts — top-left
        this.hearts = []
        for (let i = 0; i < MAX_LIVES; i++) {
            const heart = this.add.image(
                16 + HEART_SIZE / 2 + i * (HEART_SIZE + HEART_GAP),
                24,
                'heart',
            )
            heart.setDisplaySize(HEART_SIZE, HEART_SIZE)
            heart.setScrollFactor(0)
            heart.setDepth(100)
            this.hearts.push(heart)
        }

        // ── Bottom banner (CTA) ─────────────────────────────────────────────────
        this.createBottomBanner()

        // ── Tap to start ────────────────────────────────────────────────────────
        this.started = false
        this.player.setY(GROUND_Y)
        this.player.play('idle')
        this.physics.pause()

        const tapText = this.add.text(width / 2, height * 0.38, 'Tap to start earning!', {
            fontSize: '28px',
            color: '#ffffff',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 4,
        }).setOrigin(0.5).setScrollFactor(0).setDepth(150)

        const hand = this.add.image(width / 2, height * 0.52, 'uiPointerHand')
            .setScrollFactor(0).setDepth(150)
        const handSrc = hand.texture.getSourceImage()
        const handRatio = handSrc.width / handSrc.height
        const handH = 60
        hand.setDisplaySize(handH * handRatio, handH)

        // Small bobbing animation on the hand
        this.tweens.add({
            targets: hand,
            y: height * 0.52 + 10,
            duration: 600,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut',
        })

        // Pulse the text slightly
        this.tweens.add({
            targets: tapText,
            scaleX: 1.05,
            scaleY: 1.05,
            duration: 800,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut',
        })

        // On first tap, start the game
        const startGame = () => {
            if (this.started) return
            this.started = true
            this.physics.resume()
            this.player.play('run', true)
            this.tweens.killTweensOf([tapText, hand])
            tapText.destroy()
            hand.destroy()
        }
        this.input.once('pointerdown', startGame)
        this.input.keyboard!.once('keydown-SPACE', startGame)
    }

    update(_time: number, dt: number): void {
        this.player.update()
        this.bg.update(this.cameras.main.scrollX)
        this.finishLine.update(dt)
        this.enemies.getChildren().forEach(e => (e as Enemy).update())

        // Pause and show jump hint when approaching first obstacle (x=850)
        if (this.started && !this.shownJumpHint && this.player.x >= 750) {
            this.shownJumpHint = true
            this.showJumpHint()
        }
    }

    // ── Jump hint ─────────────────────────────────────────────────────────────
    private showJumpHint(): void {
        this.physics.pause()
        this.player.anims.pause()
        const { width, height } = this.scale

        const hintText = this.add.text(width / 2, height * 0.38, 'Jump to avoid enemies!', {
            fontSize: '28px',
            color: '#ffffff',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 4,
        }).setOrigin(0.5).setScrollFactor(0).setDepth(150)

        const hand = this.add.image(width / 2, height * 0.52, 'uiPointerHand')
            .setScrollFactor(0).setDepth(150)
        const handSrc = hand.texture.getSourceImage()
        const handRatio = handSrc.width / handSrc.height
        hand.setDisplaySize(60 * handRatio, 60)

        this.tweens.add({
            targets: hand,
            y: height * 0.52 + 10,
            duration: 600,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut',
        })

        this.tweens.add({
            targets: hintText,
            scaleX: 1.05,
            scaleY: 1.05,
            duration: 800,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut',
        })

        const resume = () => {
            this.physics.resume()
            this.player.anims.resume()
            this.tweens.killTweensOf([hintText, hand])
            hintText.destroy()
            hand.destroy()
        }
        this.input.once('pointerdown', resume)
        this.input.keyboard!.once('keydown-SPACE', resume)
    }

    // ── Coin fly-to-icon animation ─────────────────────────────────────────────
    private flyCoinToIcon(worldX: number, worldY: number, textureKey: string): void {
        // Convert world position to screen position
        const cam = this.cameras.main
        const screenX = worldX - cam.scrollX
        const screenY = worldY - cam.scrollY

        // Create a small clone that flies to the HUD icon
        const clone = this.add.image(screenX, screenY, textureKey)
            .setScrollFactor(0)
            .setDepth(150)
            .setDisplaySize(30, 30)

        this.tweens.add({
            targets: clone,
            x: this.hudIconX,
            y: this.hudIconY,
            scaleX: 0.08,
            scaleY: 0.08,
            alpha: 0.8,
            duration: 450,
            ease: 'Cubic.easeIn',
            onComplete: () => {
                clone.destroy()
                // Bounce the HUD icon — reset to true base scales first, then animate
                this.hudIcon.setScale(this.hudIconBaseScaleX, this.hudIconBaseScaleY)
                this.coinText.setScale(1)
                this.tweens.killTweensOf([this.hudIcon, this.coinText])
                this.tweens.add({
                    targets: this.hudIcon,
                    scaleX: this.hudIconBaseScaleX * 1.15,
                    scaleY: this.hudIconBaseScaleY * 1.15,
                    duration: 120,
                    yoyo: true,
                    ease: 'Sine.easeOut',
                    onComplete: () => {
                        this.hudIcon.setScale(this.hudIconBaseScaleX, this.hudIconBaseScaleY)
                    },
                })
                this.tweens.add({
                    targets: this.coinText,
                    scaleX: 1.15,
                    scaleY: 1.15,
                    duration: 120,
                    yoyo: true,
                    ease: 'Sine.easeOut',
                    onComplete: () => {
                        this.coinText.setScale(1)
                    },
                })
            },
        })
    }

    // ── Bottom banner ─────────────────────────────────────────────────────────
    private createBottomBanner(): void {
        const { width, height } = this.scale
        const bannerH = 70
        const bannerY = height - bannerH / 2

        // Background bar
        const bg = this.add.image(width / 2, bannerY, 'uiBannerLandscape')
            .setScrollFactor(0).setDisplaySize(width, bannerH)

        // "Download Now" button
        const btnW = 160
        const btnH = 40
        const btnX = width - 100
        const btnY = bannerY + 10
        const btnBg = this.add.graphics().setScrollFactor(0)
        btnBg.fillStyle(0x00cc55, 1)
        btnBg.fillRoundedRect(btnX - btnW / 2, btnY - btnH / 2, btnW, btnH, 10)
        btnBg.lineStyle(2, 0xffffff, 0.5)
        btnBg.strokeRoundedRect(btnX - btnW / 2, btnY - btnH / 2, btnW, btnH, 10)

        const btnLabel = this.add.text(btnX, btnY, 'Download Now', {
            fontSize: '18px', color: '#ffffff', fontStyle: 'bold',
        }).setOrigin(0.5).setScrollFactor(0)

        // Hit zone
        const hitZone = this.add.zone(btnX, btnY, btnW, btnH)
            .setInteractive({ useHandCursor: true }).setScrollFactor(0)
        hitZone.on('pointerdown', (p: Phaser.Input.Pointer) => {
            p.event.stopPropagation()
            window.open(STORE_URL, '_blank')
        })

        // Make the whole banner also clickable
        const bannerZone = this.add.zone(width / 2, bannerY, width, bannerH)
            .setInteractive({ useHandCursor: true }).setScrollFactor(0)
        bannerZone.on('pointerdown', (p: Phaser.Input.Pointer) => {
            p.event.stopPropagation()
            window.open(STORE_URL, '_blank')
        })

        this.bannerContainer = this.add.container(0, 0, [bannerZone, bg, btnBg, btnLabel, hitZone])
            .setDepth(200)
    }

    // ── Finish handling ────────────────────────────────────────────────────────
    private gameOver = false

    private handleFinish(): void {
        if (this.gameOver || this.player.isDead) return
        this.gameOver = true
        this.bannerContainer.destroy()
        this.player.halt()
        this.finishLine.snap(() => {
            this.scene.launch('EndScene', { coins: this.coinCount, won: true })
        })
    }

    // ── Hit handling ───────────────────────────────────────────────────────────
    private handleDeath(): void {
        if (this.gameOver || this.player.isInvincible) return
        this.lives--

        // remove a heart with a shrink + fade tween
        const heart = this.hearts[this.lives]
        if (heart) {
            this.tweens.add({
                targets: heart,
                scaleX: 0,
                scaleY: 0,
                alpha: 0,
                duration: 300,
                ease: 'Back.easeIn',
            })
        }

        if (this.lives <= 0) {
            this.gameOver = true
            this.bannerContainer.destroy()
            this.player.die()
            this.time.delayedCall(RESTART_DELAY, () => {
                this.scene.launch('EndScene', { coins: this.coinCount, won: false })
            })
        } else {
            this.player.takeHit()
        }
    }
}
