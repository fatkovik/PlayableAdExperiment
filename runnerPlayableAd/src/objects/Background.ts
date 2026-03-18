import Phaser from 'phaser'

// Background.png is 1707×704 — one image containing sky, fields and road.
// We fake 3-layer parallax by stacking:
//   Layer 0  sky       — solid colour rectangle, completely static
//   Layer 1  mid       — mirrored-tiled Background, scrolls at 40 % camera speed
//   Layer 2  near      — mirrored-tiled Background cropped to bottom portion,
//                        scrolls at 100 % camera speed (matches world objects)
//
// To get seamless looping each 2nd repetition is horizontally mirrored.
// We build a "bgMirrored" texture that is [original | flipped] side-by-side
// and tile *that*, so every other copy is automatically the mirror image.

const BG_TEXTURE_H = 704   // source image height in px

const SPEED = {
  mid:  0.40,
  near: 1.00,
}

export class Background {
  private readonly sky:  Phaser.GameObjects.Rectangle
  private readonly mid:  Phaser.GameObjects.TileSprite
  private readonly near: Phaser.GameObjects.TileSprite
  private readonly scene: Phaser.Scene

  constructor(scene: Phaser.Scene) {
    this.scene = scene
    const { width, height } = scene.scale

    // ── Build mirrored texture ────────────────────────────────────────────────
    if (!scene.textures.exists('bgMirrored')) {
      const srcTex = scene.textures.get('background')
      const srcImg = srcTex.getSourceImage() as HTMLImageElement
      const srcW   = srcImg.width
      const srcH   = srcImg.height

      const canvas = document.createElement('canvas')
      canvas.width  = srcW * 2
      canvas.height = srcH
      const ctx = canvas.getContext('2d')!

      ctx.drawImage(srcImg, 0, 0)
      ctx.save()
      ctx.translate(srcW * 2, 0)
      ctx.scale(-1, 1)
      ctx.drawImage(srcImg, 0, 0)
      ctx.restore()

      scene.textures.addCanvas('bgMirrored', canvas)
    }

    // ── Layer 0: sky ──────────────────────────────────────────────────────────
    this.sky = scene.add
      .rectangle(0, 0, width, height, 0xf2bfa8)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(0)

    // ── Layer 1: mid (full scene, slow scroll) ────────────────────────────────
    this.mid = scene.add
      .tileSprite(0, 0, width, height, 'bgMirrored')
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(1)

    // ── Layer 2: near (bottom crop, faster scroll) ────────────────────────────
    const nearH   = Math.round(height * 0.45)
    const nearY   = height - nearH
    const tileOffY = BG_TEXTURE_H - nearH

    this.near = scene.add
      .tileSprite(0, nearY, width, nearH, 'bgMirrored')
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(2)

    this.near.tilePositionY = tileOffY

    // Listen for resize
    scene.scale.on('resize', this.handleResize, this)
    scene.events.on('shutdown', () => {
      scene.scale.off('resize', this.handleResize, this)
    })
  }

  update(cameraScrollX: number): void {
    this.mid.tilePositionX  = cameraScrollX * SPEED.mid
    this.near.tilePositionX = cameraScrollX * SPEED.near
  }

  private handleResize(gameSize: Phaser.Structs.Size): void {
    const w = gameSize.width
    const h = gameSize.height

    this.sky.setSize(w, h)
    this.mid.setSize(w, h)

    const nearH  = Math.round(h * 0.45)
    const nearY  = h - nearH
    this.near.setPosition(0, nearY)
    this.near.setSize(w, nearH)
    this.near.tilePositionY = BG_TEXTURE_H - nearH
  }
}
