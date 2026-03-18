import { GAMEPLAY_Y, S } from './gameConfig'

export interface LevelItem {
  x: number
  y: number
  type: 'obstacle' | 'coin'
}

// y is given as an offset ABOVE GROUND_Y (0 = on ground, 80 = floating).
const ITEM_Y_OFFSET = 0
// Converted to world y below.
const raw: Array<{ x: number; above: number; type: 'obstacle' | 'coin' }> = [
  // ── zone 1 (x 450–900) ───────────────────────────────────────────────────
  { x: 450,  above: 60,  type: 'coin' },
  { x: 510,  above: 60,  type: 'coin' },
  { x: 570,  above: 60,  type: 'coin' },
  { x: 700,  above: 0,   type: 'obstacle' },
  { x: 820,  above: 100, type: 'coin' },
  { x: 880,  above: 100, type: 'coin' },

  // ── zone 2 (x 1000–1500) ────────────────────────────────────────────────
  { x: 1050, above: 0,   type: 'obstacle' },
  { x: 1200, above: 60,  type: 'coin' },
  { x: 1260, above: 60,  type: 'coin' },
  { x: 1320, above: 60,  type: 'coin' },
  { x: 1450, above: 0,   type: 'obstacle' },
  { x: 1530, above: 0,   type: 'obstacle' },

  // ── zone 3 (x 1650–2200) ────────────────────────────────────────────────
  { x: 1700, above: 100, type: 'coin' },
  { x: 1760, above: 100, type: 'coin' },
  { x: 1820, above: 100, type: 'coin' },
  { x: 1950, above: 0,   type: 'obstacle' },
  { x: 2080, above: 60,  type: 'coin' },
  { x: 2140, above: 60,  type: 'coin' },

  // ── zone 4 (x 2300–3000) ────────────────────────────────────────────────
  { x: 2350, above: 0,   type: 'obstacle' },
  { x: 2430, above: 0,   type: 'obstacle' },
  { x: 2580, above: 60,  type: 'coin' },
  { x: 2640, above: 60,  type: 'coin' },
  { x: 2700, above: 60,  type: 'coin' },
  { x: 2760, above: 60,  type: 'coin' },
  { x: 2900, above: 0,   type: 'obstacle' },
]

export const LEVEL_DATA: LevelItem[] = raw.map(r => ({
  x: Math.round(r.x * S),
  y: GAMEPLAY_Y + ITEM_Y_OFFSET - Math.round(r.above * S),
  type: r.type,
}))
