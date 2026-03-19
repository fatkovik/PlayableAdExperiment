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
    // triangle ▲ //was 450
    { x: 1300, above: 60, type: 'coin' },
    { x: 1400, above: 160, type: 'coin' },
    { x: 1500, above: 260, type: 'coin' },
    { x: 1600, above: 160, type: 'coin' },
    { x: 1700, above: 60, type: 'coin' },
    { x: 1900, above: 60, type: 'coin' },
    { x: 2100, above: 60, type: 'coin' },

    { x: 2150, above: 0, type: 'obstacle' },

    // triangle ▲
    { x: 2400, above: 60, type: 'coin' },
    { x: 2500, above: 160, type: 'coin' },
    { x: 2600, above: 260, type: 'coin' },
    { x: 2700, above: 160, type: 'coin' },
    { x: 2800, above: 60, type: 'coin' },
    { x: 2900, above: 0, type: 'obstacle' },
    { x: 3000, above: 60, type: 'coin' },
    { x: 3200, above: 60, type: 'coin' },

    // ── zone 4 (x 2600–3000) ────────────────────────────────────────────────
    //{ x: 2500, above: 0,   type: 'obstacle' },
    //{ x: 2780, above: 60,  type: 'coin' },
    //{ x: 3100, above: 0, type: 'obstacle' },
    //{ x: 3500, above: 60,  type: 'coin' },
]

export const LEVEL_DATA: LevelItem[] = raw.map(r => ({
    x: Math.round(r.x * S),
    y: GAMEPLAY_Y + ITEM_Y_OFFSET - Math.round(r.above * S),
    type: r.type,
}))
