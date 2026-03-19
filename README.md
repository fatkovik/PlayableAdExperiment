## NOTE: Contains heavy use of Generative AI. Mainly Claude Code for everything code related, Nano Banana for asset generation.

# Playable Ad — Runner Game

A browser-based playable ad built as a self-contained HTML file. a side-scrolling runner where the player jumps over obstacles, collects coins, and dodges enemies on the way to the finish line.

The player taps or clicks to start, then taps again to jump. Three obstacles, three enemies, and a series of collectible coins are spread across a scrolling level. Reaching the finish line triggers a win screen. Losing all three lives triggers a lose screen. Both screens have a call-to-action button that links to the app store page.

## Tech stack

- **Phaser 3** — game engine
- **TypeScript** — source language
- **Vite** + **vite-plugin-singlefile** — builds everything into one inlined HTML file

### Why Phaser 3 instead of Pixi.js?
The answer is that Phaser 3 is just a game framework build on top of Pixi.js, It ships with everything for game/playable ad making out of the box. 
So no need to handlee the physics, animation, tweens. Mainly done to save time.

## Project structure

```
runnerPlayableAd/src/
  main.ts               entry point, Phaser config, resize handling
  assets.ts             all asset imports
  config/
    gameConfig.ts       physics constants, world dimensions, scale factor
    levelData.ts        obstacle, enemy, and coin positions
  scenes/
    BootScene.ts        asset loading
    GameScene.ts        main gameplay
    EndScene.ts         win/lose screen
  objects/
    Background.ts       three-layer parallax scrolling
    Player.ts           character, animations, physics body
    Obstacle.ts         static hazards with EVADE label
    Coin.ts             collectible items (dollar and PayPal variants)
    Enemy.ts            moving hazards
    FinishLine.ts       rope-cut finish animation
    EnvDecor.ts         background decorations
  utils/
    ui.ts               scale helpers for responsive layout
```

## Resolution scaling

All coordinates and physics values are multiplied by a scale factor `S`, calculated from the device screen size. This means the game renders at native resolution instead of being CSS-upscaled, which keeps it sharp on high-density displays.
This could lead to some troubles with resize nad responsiveness, Its a know issue, and could be fixed.

## Pages Link
https://fatkovik.github.io/PlayableAdExperiment/
