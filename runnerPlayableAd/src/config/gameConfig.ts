// ── World ─────────────────────────────────────────────────────────────────────
export const WORLD_WIDTH  = 4000
export const WORLD_HEIGHT = 600

// ── Ground ────────────────────────────────────────────────────────────────────
// The physics ground body sits at the very bottom of the canvas.
// GROUND_Y is the top edge; the body extends to WORLD_HEIGHT.
export const GROUND_Y      = 560
export const GROUND_HEIGHT = WORLD_HEIGHT - GROUND_Y   // 40 px

// ── Physics ───────────────────────────────────────────────────────────────────
export const GRAVITY = 800
