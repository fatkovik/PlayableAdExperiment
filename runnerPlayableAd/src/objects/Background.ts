import Phaser from 'phaser'
import { GROUND_Y, S } from '../config/gameConfig'

// Background.png is 1707×704 — one image containing sky, fields and road.
// We fake 3-layer parallax by stacking:
//   Layer 0  sky       — solid colour rectangle, completely static
//   Layer 1  mid       — mirrored-tiled Background, scrolls at 40 % camera speed
//   Layer 2  near      — mirrored-tiled Background cropped to bottom portion,
//                        scrolls at 100 % camera speed (matches world objects)
//
// Both tile layers use setTileScale(1, S) so the background texture scales
// proportionally with the higher-res canvas.  This way the road in the texture
// always lines up with GROUND_Y regardless of screen resolution.

const BG_TEXTURE_H = 704   // source image height in px

const SPEED = {
  mid:  0.40,
  near: 1.00,
}

// How many SOURCE texture pixels above the road surface to include in the
// near layer.  At S=1 the original nearY was 330 with GROUND_Y=350 → 20 px.
const NEAR_OVERLAP_SRC = 20

export class Background {
  private readonly sky:  Phaser.GameObjects.Rectangle
  private readonly mid:  Phaser.GameObjects.TileSprite
  private readonly near: Phaser.GameObjects.TileSprite

  constructor(scene: Phaser.Scene) {
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
    this.mid.setTileScale(1, S)

    // ── Layer 2: near (bottom crop, faster scroll) ────────────────────────────
    // nearY is placed NEAR_OVERLAP_SRC source-pixels (scaled by S) above GROUND_Y.
    // tilePositionY crops to the bottom of the source texture so the road lines up.
    const nearY   = GROUND_Y - Math.round(NEAR_OVERLAP_SRC * S)
    const nearH   = height - nearY
    const srcCrop = nearH / S                      // how many source px the crop spans
    const tileOffY = BG_TEXTURE_H - srcCrop        // start from this far into the texture

    this.near = scene.add
      .tileSprite(0, nearY, width, nearH, 'bgMirrored')
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(2)
    this.near.setTileScale(1, S)
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

    const nearY   = GROUND_Y - Math.round(NEAR_OVERLAP_SRC * S)
    const nearH   = h - nearY
    const srcCrop = nearH / S
    this.near.setPosition(0, nearY)
    this.near.setSize(w, nearH)
    this.near.tilePositionY = BG_TEXTURE_H - srcCrop
  }
}
