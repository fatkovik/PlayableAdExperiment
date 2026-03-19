import Phaser from 'phaser'
import { Background } from '../objects/Background'
import { Player } from '../objects/Player'
import { Obstacle } from '../objects/Obstacle'
import { Coin } from '../objects/Coin'
import { Enemy } from '../objects/Enemy'
import { FinishLine } from '../objects/FinishLine'
import { EnvDecor } from '../objects/EnvDecor'
import { WORLD_WIDTH, WORLD_HEIGHT, GAMEPLAY_Y, GROUND_HEIGHT, STORE_URL, S } from '../config/gameConfig'
import { LEVEL_DATA } from '../config/levelData'

const MAX_LIVES = 3
const HEART_GAP = Math.round(8 * S)

const CHEERS = [
    { x: 1200,  text: 'Awesome!' },
    { x: 2100, text: 'Amazing!' },
    { x: 3400, text: "You're a pro!" },
]

export class GameScene extends Phaser.Scene {
    private bg!: Background
    private player!: Player
    private coinCount = 0
    private coinText!: Phaser.GameObjects.Text
    private finishLine!: FinishLine
    private lives = MAX_LIVES
    private hearts: Phaser.GameObjects.Text[] = []
    private enemies!: Phaser.Physics.Arcade.Group
    private hudIcon!: Phaser.GameObjects.Image
    private hudIconX = 0
    private hudIconY = 0
    private hudIconBaseScaleX = 1
    private hudIconBaseScaleY = 1
    private started = false
    private shownJumpHint = false
    private bannerContainer!: Phaser.GameObjects.Container
    private nextCheerIdx = 0

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
            GAMEPLAY_Y + GROUND_HEIGHT / 2,
            '__DEFAULT',
        )
        ground.setDisplaySize(WORLD_WIDTH, GROUND_HEIGHT)
        ground.setAlpha(0)
        ground.refreshBody()

        // ── Environment decoration ────────────────────────────────────────────────
        new EnvDecor(this)

        // ── Player ────────────────────────────────────────────────────────────────
        Player.createAnims(this.anims)
        this.player = new Player(this, Math.round(300 * S), GAMEPLAY_Y)

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
        const ENEMY_POSITIONS = [1350, 2500, 3200].map(x => Math.round(x * S))
        for (const ex of ENEMY_POSITIONS) {
            this.enemies.add(new Enemy(this, ex))
        }

        // ── Finish line ───────────────────────────────────────────────────────────
        this.finishLine = new FinishLine(this)

        // ── Collisions ────────────────────────────────────────────────────────────
        this.physics.add.collider(this.player, ground)

        this.physics.add.collider(this.enemies, ground)

        // Obstacle → damage (overlap so player passes through)
        this.physics.add.overlap(this.player, obstacles, () => {
            this.handleDeath()
        })

        // Enemy → die (overlap so they pass through, no physics push)
        this.physics.add.overlap(this.player, this.enemies, () => {
            this.handleDeath()
        })

        const coinAmount = Math.round(Math.random() * 100)

        // Coin → collect with fly-to-icon animation
        this.physics.add.overlap(this.player, coins, (_player, coinObj) => {
            const coin = coinObj as Coin
            coin.collect()
            this.coinCount += coinAmount
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
        this.cameras.main.setFollowOffset(Math.round(100 * S), 0)

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
        const coinIconSize = Math.round(80 * S)
        const coinIconX = width - Math.round(100 * S)
        const coinIconY = Math.round(45 * S)
        this.hudIconX = coinIconX
        this.hudIconY = coinIconY
        this.hudIcon = this.add.image(coinIconX, coinIconY, 'uiPaypalHeader')
            .setScrollFactor(0).setDepth(100)
        const pSrc = this.hudIcon.texture.getSourceImage()
        const pRatio = pSrc.width / pSrc.height
        this.hudIcon.setDisplaySize(coinIconSize * pRatio, coinIconSize)
        this.hudIconBaseScaleX = this.hudIcon.scaleX
        this.hudIconBaseScaleY = this.hudIcon.scaleY

        const cointTextX = coinIconX + Math.round(20 * S)
        const coinTextY = coinIconY

        this.coinText = this.add
            .text(cointTextX, coinTextY, '$0', {
                fontSize: `${Math.round(20 * S)}px`, color: '#1b49f2',
                stroke: '#000000', strokeThickness: Math.round(2 * S),
            })
            .setOrigin(0.5)
            .setScrollFactor(0)
            .setDepth(101)

        // Hearts — top-left
        this.hearts = []
        const heartFontSize = Math.round(24 * S)
        for (let i = 0; i < MAX_LIVES; i++) {
            const heart = this.add.text(
                Math.round(16 * S) + i * (heartFontSize + HEART_GAP),
                Math.round(14 * S),
                '❤️',
                { fontSize: `${heartFontSize}px` },
            )
            heart.setScrollFactor(0)
            heart.setDepth(100)
            this.hearts.push(heart)
        }

        // ── Bottom banner (CTA) ─────────────────────────────────────────────────
        this.createBottomBanner()

        // ── Tap to start ────────────────────────────────────────────────────────
        this.started = false
        // Player origin is (2, 0.5) — position y is the vertical center.
        // Nudge slightly below GAMEPLAY_Y so feet sit on the visible road.
        this.player.setY(GAMEPLAY_Y - this.player.displayHeight / 2)
        this.player.play('idle')
        this.physics.pause()

        const tapText = this.add.text(width / 2, height * 0.38, 'Tap to start earning!', {
            fontSize: `${Math.round(36 * S)}px`,
            color: '#ffffff',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: Math.round(4 * S),
        }).setOrigin(0.5).setScrollFactor(0).setDepth(150)

        const hand = this.add.image(width / 2, height * 0.52, 'uiPointerHand')
            .setScrollFactor(0).setDepth(150)
        const handSrc = hand.texture.getSourceImage()
        const handRatio = handSrc.width / handSrc.height
        const handH = Math.round(60 * S)
        hand.setDisplaySize(handH * handRatio, handH)

        // Small bobbing animation on the hand
        this.tweens.add({
            targets: hand,
            y: height * 0.52 + Math.round(10 * S),
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

        // Pause and show jump hint when approaching first obstacle
        if (this.started && !this.shownJumpHint && this.player.x >= Math.round(900 * S)) {
            this.shownJumpHint = true
            this.showJumpHint()
        }

        // Cheer texts at predetermined positions
        if (this.started && this.nextCheerIdx < CHEERS.length) {
            const cheer = CHEERS[this.nextCheerIdx]
            if (this.player.x >= Math.round(cheer.x * S)) {
                this.nextCheerIdx++
                this.showCheerText(cheer.text)
            }
        }
    }

    // ── Jump hint ─────────────────────────────────────────────────────────────
    private showJumpHint(): void {
        this.physics.pause()
        this.player.anims.pause()
        const { width, height } = this.scale

        const hintText = this.add.text(width / 2, height * 0.38, 'Jump to avoid enemies!', {
            fontSize: `${Math.round(28 * S)}px`,
            color: '#ffffff',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: Math.round(4 * S),
        }).setOrigin(0.5).setScrollFactor(0).setDepth(150)

        const hand = this.add.image(width / 2, height * 0.52, 'uiPointerHand')
            .setScrollFactor(0).setDepth(150)
        const handSrc = hand.texture.getSourceImage()
        const handRatio = handSrc.width / handSrc.height
        hand.setDisplaySize(Math.round(60 * S) * handRatio, Math.round(60 * S))

        this.tweens.add({
            targets: hand,
            y: height * 0.52 + Math.round(10 * S),
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

    // ── Cheer text popup ──────────────────────────────────────────────────────
    private showCheerText(message: string): void {
        const { width, height } = this.scale
        const txt = this.add.text(width / 2, height * 0.3, message, {
            fontSize: `${Math.round(36 * S)}px`,
            color: '#ffffff',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: Math.round(5 * S),
        }).setOrigin(0.5).setScrollFactor(0).setDepth(150).setScale(0).setAlpha(0)

        // Pop in, float up, fade out
        this.tweens.add({
            targets: txt,
            scaleX: 1,
            scaleY: 1,
            alpha: 1,
            duration: 300,
            ease: 'Back.easeOut',
            onComplete: () => {
                this.tweens.add({
                    targets: txt,
                    y: txt.y - Math.round(40 * S),
                    alpha: 0,
                    duration: 800,
                    delay: 400,
                    ease: 'Sine.easeIn',
                    onComplete: () => { txt.destroy() },
                })
            },
        })
    }

    // ── Coin fly-to-icon animation ─────────────────────────────────────────────
    private flyCoinToIcon(worldX: number, worldY: number, textureKey: string): void {
        const cam = this.cameras.main
        const screenX = worldX - cam.scrollX
        const screenY = worldY - cam.scrollY

        const clone = this.add.image(screenX, screenY, textureKey)
            .setScrollFactor(0)
            .setDepth(150)
            .setDisplaySize(Math.round(30 * S), Math.round(30 * S))

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

        // Background bar — preserve native aspect ratio
        const bg = this.add.image(0, 0, 'uiBannerLandscape').setScrollFactor(0)
        const bannerSrc = bg.texture.getSourceImage()
        const bannerRatio = bannerSrc.width / bannerSrc.height
        const bannerH = Math.round(width / bannerRatio)
        const bannerY = height - bannerH / 2
        bg.setPosition(width / 2, bannerY)
        bg.setDisplaySize(width, bannerH)

        // "Download Now" button — drawn centered at (0,0) inside a container
        const btnW = Math.round(160 * S)
        const btnH = Math.round(40 * S)
        const btnX = width - Math.round(100 * S)
        const btnY = bannerY + Math.round(10 * S)
        const btnBg = this.add.graphics()
        btnBg.fillStyle(0x00cc55, 1)
        btnBg.fillRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, Math.round(10 * S))
        btnBg.lineStyle(2, 0xffffff, 0.5)
        btnBg.strokeRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, Math.round(10 * S))

        const btnLabel = this.add.text(0, 0, 'Download Now', {
            fontSize: `${Math.round(18 * S)}px`, color: '#ffffff', fontStyle: 'bold',
        }).setOrigin(0.5)

        const btnContainer = this.add.container(btnX, btnY, [btnBg, btnLabel])
            .setScrollFactor(0)

        this.tweens.add({
            targets: btnContainer,
            scaleX: 1.08,
            scaleY: 1.08,
            duration: 600,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut',
        })

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

        this.bannerContainer = this.add.container(0, 0, [bannerZone, bg, btnContainer, hitZone])
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

    // ── Fail icon ─────────────────────────────────────────────────────────────
    private showFailIcon(onComplete: () => void): void {
        const { width, height } = this.scale

        // Semi-transparent overlay (same as EndScene)
        const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x1a1a2e, 0.75)
            .setScrollFactor(0)
            .setDepth(199)
            .setAlpha(0)

        // Rotating pulse background (same as EndScene)
        const pulse = this.add.image(width / 2, height / 2, 'uiBackgroundPulse')
            .setScrollFactor(0)
            .setDepth(199.5)
            .setAlpha(0)
        const pulseScale = Math.max(width, height) / Math.min(pulse.width, pulse.height) * 1.5
        pulse.setScale(pulseScale)
        this.tweens.add({
            targets: pulse,
            rotation: Math.PI * 2,
            duration: 20000,
            repeat: -1,
            ease: 'Linear',
        })

        const icon = this.add.image(width / 2, height * 0.4, 'uiFailIcon')
            .setScrollFactor(0)
            .setDepth(200)
            .setScale(0)
            .setAlpha(0)

        // Fade in overlay + pulse, then scale up icon
        this.tweens.add({
            targets: [overlay, pulse],
            alpha: { getStart: () => 0, getEnd: (_t: any, _k: any, _v: any, i: number) => i === 0 ? 0.75 : 0.3 },
            duration: 300,
            ease: 'Sine.easeOut',
        })

        // Scale up from 0 → 1 with a bounce
        this.tweens.add({
            targets: icon,
            scaleX: 1,
            scaleY: 1,
            alpha: 1,
            duration: 500,
            ease: 'Back.easeOut',
            onComplete: () => {
                // Hold for a moment, then fade and launch end scene
                this.time.delayedCall(800, () => {
                    this.tweens.add({
                        targets: [icon, overlay, pulse],
                        alpha: 0,
                        duration: 300,
                        ease: 'Sine.easeIn',
                        onComplete: () => {
                            icon.destroy()
                            overlay.destroy()
                            pulse.destroy()
                            onComplete()
                        },
                    })
                })
            },
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
            this.showFailIcon(() => {
                this.scene.launch('EndScene', { coins: this.coinCount, won: false })
            })
        } else {
            this.player.takeHit()
        }
    }
}
