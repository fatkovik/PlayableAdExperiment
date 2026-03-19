import Phaser from 'phaser'
import { STORE_URL } from '../config/gameConfig'
import { uiScale, fitText } from '../utils/ui'

// Confetti colours
const CONFETTI_COLORS = [0xff0000, 0x00cc44, 0x2288ff, 0xffdd00, 0xff66cc, 0xffffff]

export class EndScene extends Phaser.Scene {
    private coinCount = 0
    private won = true
    private pulseImg!: Phaser.GameObjects.Image

    constructor() {
        super({ key: 'EndScene' })
    }

    init(data: { coins?: number; won?: boolean }): void {
        this.coinCount = data.coins ?? 0
        this.won = data.won ?? true
    }

    create(): void {
        const { width, height } = this.scale
        const cx = width / 2
        const us = uiScale(this)
        const confettiSize = Math.round(6 * us)

        // ── Semi-transparent overlay ───────────────────────────────────────────
        this.cameras.main.setBackgroundColor('rgba(0,0,0,0)')
        this.add.rectangle(cx, height / 2, width, height, 0x1a1a2e, 0.75)
            .setDepth(0)

        // ── Rotating pulse background ──────────────────────────────────────────
        this.pulseImg = this.add.image(cx, height / 2, 'uiBackgroundPulse')
            .setDepth(1).setAlpha(0.3)
        const pulseScale = Math.max(width, height) / Math.min(
            this.pulseImg.width, this.pulseImg.height
        ) * 1.5
        this.pulseImg.setScale(pulseScale)

        this.tweens.add({
            targets: this.pulseImg,
            rotation: Math.PI * 2,
            duration: 20000,
            repeat: -1,
            ease: 'Linear',
        })

        // ── Confetti particles (win only) ────────────────────────────────────
        if (this.won) {
            this.createConfetti(width, confettiSize)
        }

        // ── Title text ─────────────────────────────────────────────────────────
        const titleY = height * 0.12
        const titleStr = this.won ? 'Congratulations!' : "You didn't make it!"
        const titleColor = this.won ? '#ffd700' : '#ff4444'
        const subtitleStr = this.won ? 'Choose your reward!' : 'Try again on the app!'

        const title = this.add.text(cx, titleY, titleStr, {
            fontSize: `${Math.round(36 * us)}px`,
            color: titleColor,
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: Math.round(4 * us),
        }).setOrigin(0.5).setDepth(10).setAlpha(0)
        fitText(title, width * 0.9)

        const subtitle = this.add.text(cx, titleY + Math.round(40 * us), subtitleStr, {
            fontSize: `${Math.round(18 * us)}px`,
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: Math.round(2 * us),
        }).setOrigin(0.5).setDepth(10).setAlpha(0)
        fitText(subtitle, width * 0.9)

        this.tweens.add({
            targets: [title, subtitle],
            alpha: 1,
            y: `-=${Math.round(10 * us)}`,
            duration: 500,
            ease: 'Back.easeOut',
        })

        // ── White card ─────────────────────────────────────────────────────────
        const cardW = Math.min(width * 0.7, Math.round(300 * us))
        const cardH = Math.min(height * 0.28, Math.round(200 * us))
        const cardY = height * 0.42
        const cardR = Math.round(16 * us)

        const card = this.add.graphics().setDepth(10)
        card.fillStyle(0xffffff, 1)
        card.fillRoundedRect(cx - cardW / 2, cardY - cardH / 2, cardW, cardH, cardR)
        // Subtle shadow
        const shadow = this.add.graphics().setDepth(9)
        shadow.fillStyle(0x000000, 0.2)
        shadow.fillRoundedRect(cx - cardW / 2 + Math.round(4 * us), cardY - cardH / 2 + Math.round(4 * us), cardW, cardH, cardR)

        // Scale-in the card
        const cardContainer = this.add.container(0, 0, [shadow, card]).setDepth(10)
        cardContainer.setScale(0)
        this.tweens.add({
            targets: cardContainer,
            scaleX: 1,
            scaleY: 1,
            duration: 600,
            delay: 200,
            ease: 'Back.easeOut',
        })

        // PayPal icon on the card
        const paypalIcon = this.add.image(cx, cardY - cardH * 0.15, 'paypal1')
            .setDepth(11)
        const pSrc = paypalIcon.texture.getSourceImage()
        const pRatio = pSrc.width / pSrc.height
        const iconH = cardH * 0.4
        paypalIcon.setDisplaySize(iconH * pRatio, iconH)
        paypalIcon.setAlpha(0)

        // Money amount with count-up
        const moneyText = this.add.text(cx, cardY + cardH * 0.22, '$0.00', {
            fontSize: `${Math.round(32 * us)}px`,
            color: '#222222',
            fontStyle: 'bold',
        }).setOrigin(0.5).setDepth(11).setAlpha(0)
        fitText(moneyText, cardW * 0.85)

        // Fade in card contents after card scales in
        this.time.delayedCall(500, () => {
            this.tweens.add({
                targets: [paypalIcon, moneyText],
                alpha: 1,
                duration: 300,
            })

            // Count up the money
            const counter = { val: 0 }
            this.tweens.add({
                targets: counter,
                val: this.coinCount,
                duration: 500,
                ease: 'Cubic.easeOut',
                delay: 200,
                onUpdate: () => {
                    moneyText.setText(`$${Math.round(counter.val)}.00`)
                },
            })
        })

        // ── Countdown timer area ───────────────────────────────────────────────
        const timerY = cardY + cardH / 2 + Math.round(40 * us)
        let seconds = 60
        const timerText = this.add.text(cx, timerY, '00:41', {
            fontSize: `${Math.round(28 * us)}px`,
            color: '#ffffff',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: Math.round(3 * us),
        }).setOrigin(0.5).setDepth(10).setAlpha(0)

        const timerSub = this.add.text(cx, timerY + Math.round(28 * us), 'Next payment in one minute', {
            fontSize: `${Math.round(13 * us)}px`,
            color: '#cccccc',
        }).setOrigin(0.5).setDepth(10).setAlpha(0)
        fitText(timerSub, width * 0.85)

        this.tweens.add({
            targets: [timerText, timerSub],
            alpha: 1,
            duration: 400,
            delay: 800,
        })

        // Tick the countdown
        this.time.addEvent({
            delay: 1000,
            repeat: seconds - 1,
            callback: () => {
                seconds--
                const m = String(Math.floor(seconds / 60)).padStart(2, '0')
                const s = String(seconds % 60).padStart(2, '0')
                timerText.setText(`${m}:${s}`)
            },
        })

        // ── "INSTALL AND EARN" button ──────────────────────────────────────────
        const btnY = height - Math.round(60 * us)
        const btnW = Math.min(width * 0.85, Math.round(400 * us))
        const btnH = Math.round(52 * us)
        const btnR = Math.round(12 * us)

        // Button — drawn centered at (0,0) inside container
        const btnBg = this.add.graphics()
        if (this.won) {
            btnBg.fillStyle(0xe68a00, 1)
            btnBg.fillRoundedRect(-btnW / 2, -btnH / 2 + Math.round(3 * us), btnW, btnH - Math.round(3 * us), btnR)
            btnBg.fillStyle(0xffbb00, 1)
            btnBg.fillRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH - Math.round(6 * us), btnR)
            btnBg.lineStyle(Math.round(2 * us), 0xcc7700, 1)
            btnBg.strokeRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, btnR)
        } else {
            btnBg.fillStyle(0x991111, 1)
            btnBg.fillRoundedRect(-btnW / 2, -btnH / 2 + Math.round(3 * us), btnW, btnH - Math.round(3 * us), btnR)
            btnBg.fillStyle(0xcc2222, 1)
            btnBg.fillRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH - Math.round(6 * us), btnR)
            btnBg.lineStyle(Math.round(2 * us), 0x880000, 1)
            btnBg.strokeRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, btnR)
        }

        const btnStroke = this.won ? '#663300' : '#440000'
        const btnLabel = this.add.text(0, -Math.round(2 * us), 'INSTALL AND EARN', {
            fontSize: `${Math.round(22 * us)}px`,
            color: '#ffffff',
            fontStyle: 'bold',
            stroke: btnStroke,
            strokeThickness: Math.round(3 * us),
        }).setOrigin(0.5)
        fitText(btnLabel, btnW * 0.85)

        const btnContainer = this.add.container(cx, btnY, [btnBg, btnLabel]).setDepth(20)

        // Slide up from below
        btnContainer.y = btnY + Math.round(80 * us)
        btnContainer.setAlpha(0)
        this.tweens.add({
            targets: btnContainer,
            y: btnY,
            alpha: 1,
            duration: 600,
            delay: 1000,
            ease: 'Back.easeOut',
            onComplete: () => {
                this.tweens.add({
                    targets: btnContainer,
                    scaleX: 1.03,
                    scaleY: 1.03,
                    duration: 700,
                    yoyo: true,
                    repeat: -1,
                    ease: 'Sine.easeInOut',
                })
            },
        })

        // Hit zone
        const hitZone = this.add.zone(cx, btnY, btnW, btnH)
            .setInteractive({ useHandCursor: true }).setDepth(22)
        hitZone.on('pointerdown', () => {
            window.open(STORE_URL, '_blank')
        })
    }

    update(): void {
        // Continuous rotation is handled by tween, nothing else needed
    }

    // ── Confetti ──────────────────────────────────────────────────────────────
    private createConfetti(w: number, size: number): void {
        const us = uiScale(this)
        CONFETTI_COLORS.forEach((color, i) => {
            const key = `confetti${i}`
            if (this.textures.exists(key)) return
            const gfx = this.add.graphics()
            gfx.fillStyle(color, 1)
            gfx.fillRect(0, 0, size, size)
            gfx.generateTexture(key, size, size)
            gfx.destroy()
        })

        CONFETTI_COLORS.forEach((_color, i) => {
            this.add.particles(w / 2, -Math.round(10 * us), `confetti${i}`, {
                x: { min: -w / 2, max: w / 2 },
                speedY: { min: 60 * us, max: 200 * us },
                speedX: { min: -80 * us, max: 80 * us },
                angle: { min: 0, max: 360 },
                rotate: { min: 0, max: 360 },
                scale: { start: 1, end: 0.3 },
                alpha: { start: 1, end: 0.4 },
                lifespan: { min: 2000, max: 4000 },
                frequency: 120,
                quantity: 1,
                gravityY: 40 * us,
            }).setDepth(5)
        })
    }
}
