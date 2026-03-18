// ── World ─────────────────────────────────────────────────────────────────────
export const WORLD_WIDTH  = 4000
export const WORLD_HEIGHT = 600

// ── Ground ────────────────────────────────────────────────────────────────────
// The physics ground body sits at the very bottom of the canvas.
// GROUND_Y is the top edge; the body extends to WORLD_HEIGHT.
export const GROUND_Y      = 350
export const GROUND_HEIGHT = WORLD_HEIGHT - GROUND_Y   // 220 px

// ── Physics ───────────────────────────────────────────────────────────────────
export const GRAVITY = 800

// ── Player ────────────────────────────────────────────────────────────────────
export const PLAYER_SPEED  = 300   // px / s horizontal run speed
export const JUMP_VELOCITY = -550  // px / s upward (negative = up in Phaser)
export const PLAYER_SCALE  = 0.5   // display scale applied to the raw spritesheet frame

export const STORE_URL = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'