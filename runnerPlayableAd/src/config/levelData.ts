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
  // triangle ▲
  { x: 450,  above: 60,  type: 'coin' },
  { x: 550, above: 160, type: 'coin' },
  { x: 650, above: 260,  type: 'coin' },
  { x: 750, above: 160,  type: 'coin' },
  { x: 850, above: 60,  type: 'coin' },
  { x: 1100,  above: 60, type: 'coin' },
  { x: 1300,  above: 60, type: 'coin' },

  //// ── zone 2 (x 1000–1600) ────────────────────────────────────────────────
  //{ x: 1050, above: 60,  type: 'coin' },
  //{ x: 1110, above: 60,  type: 'coin' },
  //{ x: 1170, above: 60,  type: 'coin' },
  //{ x: 1600, above: 0,   type: 'obstacle' },

  // ── zone 3 (x 1650–2200) ────────────────────────────────────────────────
  // triangle ▲
  { x: 1700, above: 60,  type: 'coin' },
  { x: 1800, above: 160, type: 'coin' },
  { x: 1900, above: 260, type: 'coin' },
  { x: 2000, above: 160, type: 'coin' },
    { x: 2100, above: 60,  type: 'coin' },
  { x: 2250, above: 0,   type: 'obstacle' },
  { x: 2300, above: 60,  type: 'coin' },
  { x: 2360, above: 60,  type: 'coin' },

  // ── zone 4 (x 2600–3000) ────────────────────────────────────────────────
  { x: 2500, above: 0,   type: 'obstacle' },
  // triangle ▲ (4 coins: 3 base + 1 top)
  { x: 2700, above: 60,  type: 'coin' },
  { x: 2780, above: 130, type: 'coin' },
  { x: 2860, above: 60,  type: 'coin' },
  { x: 2780, above: 60,  type: 'coin' },
  { x: 3100, above: 0, type: 'obstacle' },
  { x: 3500, above: 60,  type: 'coin' },
]

export const LEVEL_DATA: LevelItem[] = raw.map(r => ({
  x: Math.round(r.x * S),
  y: GAMEPLAY_Y + ITEM_Y_OFFSET - Math.round(r.above * S),
  type: r.type,
}))
