// ── Resolution scale ─────────────────────────────────────────────────────────
// The game was designed for a 600 px-tall canvas.  On modern screens the canvas
// is CSS-upscaled which looks blurry.  We compute a scale factor so the canvas
// renders at (approximately) the device's native resolution.
const DESIGN_H = 600
export const S = Math.max(1, window.innerHeight / DESIGN_H)

// ── World ─────────────────────────────────────────────────────────────────────
export const WORLD_WIDTH  = Math.round(4000 * S)
export const WORLD_HEIGHT = Math.round(DESIGN_H * S)

// ── Ground ────────────────────────────────────────────────────────────────────
// The physics ground body sits at the very bottom of the canvas.
// GROUND_Y is the top edge; the body extends to WORLD_HEIGHT.
export const GROUND_Y      = Math.round(350 * S)
// GAMEPLAY_Y is where objects (player, enemies, obstacles) stand — 20% lower than GROUND_Y.
export const GAMEPLAY_Y    = Math.round(450 * S)
export const GROUND_HEIGHT = WORLD_HEIGHT - GAMEPLAY_Y

// ── Physics ───────────────────────────────────────────────────────────────────
export const GRAVITY = Math.round(1400 * S)

// ── Player ────────────────────────────────────────────────────────────────────
export const PLAYER_SPEED  = Math.round(300 * S)
export const JUMP_VELOCITY = Math.round(-650 * S)
export const PLAYER_SCALE  = 0.5 * S

export const STORE_URL = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
