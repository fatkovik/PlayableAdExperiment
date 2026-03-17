import { GROUND_Y } from './gameConfig'

export interface LevelItem {
  x: number
  y: number
  type: 'obstacle' | 'coin'
}

// y is given as an offset ABOVE GROUND_Y (0 = on ground, 80 = floating).
// ITEM_Y_OFFSET pushes obstacles/coins lower than GROUND_Y (positive = lower on screen).
const ITEM_Y_OFFSET = 80
// Converted to world y below.
const raw: Array<{ x: number; above: number; type: 'obstacle' | 'coin' }> = [
  // ── zone 1 (x 500–1200) ──────────────────────────────────────────────────
  { x: 550,  above: 60,  type: 'coin' },
  { x: 620,  above: 60,  type: 'coin' },
  { x: 690,  above: 60,  type: 'coin' },
  { x: 850,  above: 0,   type: 'obstacle' },
  { x: 1000, above: 100, type: 'coin' },
  { x: 1070, above: 100, type: 'coin' },

  // ── zone 2 (x 1300–2000) ─────────────────────────────────────────────────
  { x: 1350, above: 0,   type: 'obstacle' },
  { x: 1550, above: 60,  type: 'coin' },
  { x: 1620, above: 60,  type: 'coin' },
  { x: 1690, above: 60,  type: 'coin' },
  { x: 1850, above: 0,   type: 'obstacle' },
  { x: 1950, above: 0,   type: 'obstacle' },

  // ── zone 3 (x 2100–2800) ─────────────────────────────────────────────────
  { x: 2200, above: 100, type: 'coin' },
  { x: 2270, above: 100, type: 'coin' },
  { x: 2340, above: 100, type: 'coin' },
  { x: 2500, above: 0,   type: 'obstacle' },
  { x: 2650, above: 60,  type: 'coin' },
  { x: 2720, above: 60,  type: 'coin' },

  // ── zone 4 (x 2900–3600) ─────────────────────────────────────────────────
  { x: 2950, above: 0,   type: 'obstacle' },
  { x: 3050, above: 0,   type: 'obstacle' },
  { x: 3250, above: 60,  type: 'coin' },
  { x: 3320, above: 60,  type: 'coin' },
  { x: 3390, above: 60,  type: 'coin' },
  { x: 3460, above: 60,  type: 'coin' },
  { x: 3600, above: 0,   type: 'obstacle' },
]

export const LEVEL_DATA: LevelItem[] = raw.map(r => ({
  x: r.x,
  y: GROUND_Y + ITEM_Y_OFFSET - r.above,
  type: r.type,
}))
