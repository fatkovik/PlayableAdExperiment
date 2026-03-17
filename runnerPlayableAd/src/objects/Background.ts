import Phaser from 'phaser'

// Background.png is 1707×704 — one image containing sky, fields and road.
// We fake 3-layer parallax by stacking:
//   Layer 0  sky       — solid colour rectangle, completely static
//   Layer 1  mid       — full Background.png TileSprite, scrolls at 40 % camera speed
//   Layer 2  near      — Background.png TileSprite cropped to bottom portion (road/grass),
//                        scrolls at 80 % camera speed
//
// In update() pass camera.scrollX so tilePositionX tracks the camera.

const BG_TEXTURE_H = 704   // source image height in px

const SPEED = {
  mid:  0.40,
  near: 0.80,
}

export class Background {
  private readonly mid:  Phaser.GameObjects.TileSprite
  private readonly near: Phaser.GameObjects.TileSprite

  constructor(scene: Phaser.Scene) {
    const { width, height } = scene.scale

    // ── Layer 0: sky ──────────────────────────────────────────────────────────
    // Colour-matched to the top of Background.png (#f2bfa8 pinkish).
    scene.add
      .rectangle(0, 0, width, height, 0xf2bfa8)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(0)

    // ── Layer 1: mid (full scene, slow scroll) ────────────────────────────────
    this.mid = scene.add
      .tileSprite(0, 0, width, height, 'background')
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(1)

    // ── Layer 2: near (bottom crop, faster scroll) ────────────────────────────
    // Show only the bottom ~45 % of the source image (the road + grass strip).
    const nearH   = Math.round(height * 0.45)          // visible strip height
    const nearY   = height - nearH                      // y where strip starts on canvas
    const tileOffY = BG_TEXTURE_H - nearH               // texture row to start from

    this.near = scene.add
      .tileSprite(0, nearY, width, nearH, 'background')
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(2)

    this.near.tilePositionY = tileOffY
  }

  update(cameraScrollX: number): void {
    this.mid.tilePositionX  = cameraScrollX * SPEED.mid
    this.near.tilePositionX = cameraScrollX * SPEED.near
  }
}
