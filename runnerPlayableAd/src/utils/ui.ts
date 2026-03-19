import Phaser from 'phaser'

/**
 * Returns a UI-safe scale factor for the current canvas dimensions.
 * Uses the smaller of width/height so text never overflows in portrait.
 */
export function uiScale(scene: Phaser.Scene): number {
    const { width, height } = scene.scale
    return Math.max(1, Math.min(width, height) / 600)
}

/**
 * If a text object is wider than maxWidth, uniformly scale it down to fit.
 * Call after creating any screen-pinned text.
 */
export function fitText(text: Phaser.GameObjects.Text, maxWidth: number): void {
    if (text.displayWidth > maxWidth) {
        const ratio = maxWidth / text.displayWidth
        text.setScale(ratio)
    }
}
