import Phaser from 'phaser'
import { GROUND_Y } from '../config/gameConfig'

// Environment decoration items placed along the world ground plane.
// All items sit at GROUND_Y with origin (0.5, 1.0) so they stand on the ground.
// Depth 3 keeps them behind player (10) and obstacles (10) but above the
// near background TileSprite (depth 2).

interface DecorItem {
  key: string
  x: number
  scale: number
}

const ITEMS: DecorItem[] = [
  // ── Opening stretch (x 80–500) ──────────────────────────────────────────
  { key: 'bush2', x:   80, scale: 0.40 },
  { key: 'tree1', x:  200, scale: 1 },
  { key: 'bush3', x:  370, scale: 0.38 },
  { key: 'lamp1', x:  470, scale: 0.45 },

  // ── Zone 1 (x 580–1300) ─────────────────────────────────────────────────
  { key: 'bush1', x:  580, scale: 0.36 },
  { key: 'tree2', x:  690, scale: 1 },
  { key: 'bush3', x:  820, scale: 0.40 },   // obstacle @ 850
  { key: 'bush2', x:  975, scale: 0.38 },
  { key: 'tree1', x: 1090, scale: 1 },
  { key: 'lamp1', x: 1240, scale: 0.45 },

  // ── Zone 2 (x 1340–2100) ────────────────────────────────────────────────
  { key: 'bush3', x: 1340, scale: 0.38 },   // obstacle @ 1350
  { key: 'tree2', x: 1450, scale: 1 },
  { key: 'bush1', x: 1610, scale: 0.36 },
  { key: 'lamp1', x: 1730, scale: 0.45 },
  { key: 'bush2', x: 1830, scale: 0.40 },   // obstacle @ 1850
  { key: 'bush3', x: 1975, scale: 0.38 },   // obstacle @ 1950
  { key: 'tree1', x: 2090, scale: 1 },

  // ── Zone 3 (x 2200–2830) ────────────────────────────────────────────────
  { key: 'bush2', x: 2200, scale: 0.38 },
  { key: 'lamp1', x: 2330, scale: 0.45 },
  { key: 'bush3', x: 2430, scale: 0.40 },
  { key: 'tree2', x: 2545, scale: 1 },   // obstacle @ 2500
  { key: 'bush1', x: 2700, scale: 0.36 },
  { key: 'tree1', x: 2830, scale: 1 },

  // ── Zone 4 (x 2900–3800) ────────────────────────────────────────────────
  { key: 'lamp1', x: 2910, scale: 0.45 },
  { key: 'bush2', x: 3010, scale: 0.38 },   // obstacles @ 2950, 3050
  { key: 'tree2', x: 3150, scale: 1 },
  { key: 'bush3', x: 3290, scale: 0.40 },
  { key: 'lamp1', x: 3390, scale: 0.45 },
  { key: 'tree1', x: 3510, scale: 1 },   // obstacle @ 3600
  { key: 'bush1', x: 3640, scale: 0.36 },
  { key: 'bush2', x: 3720, scale: 0.40 },
  { key: 'bush3', x: 3780, scale: 0.38 },   // finish line @ 3800
]

export class EnvDecor {
  constructor(scene: Phaser.Scene) {
    for (const item of ITEMS) {
      scene.add
        .image(item.x, GROUND_Y - 50, item.key)
        .setOrigin(0.5, 1.0)
        .setScale(item.scale)
        .setDepth(3)
    }
  }
}
