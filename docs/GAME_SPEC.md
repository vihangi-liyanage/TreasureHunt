# TreasureHunt Game Specification

## Product promise

TreasureHunt is a cinematic single-player 2D web platformer. A charming original explorer runs, jumps, collects coins, stomps enemies, avoids hazards, and uses a magical fish collectible to shoot for 8 seconds. The main game must remain playable when authentication, persistence, or the Fish Game API is unavailable.

## Fixed game rules

| World | Theme | Timer | Completion |
| --- | --- | ---: | --- |
| 1 | Emerald Jungle | 120 seconds | Reach the exit and save the World 2 checkpoint |
| 2 | Sunset Ruins | 105 seconds | Reach the exit and save the World 3 checkpoint |
| 3 | Crystal Cavern | 90 seconds | Collect the treasure |

- A run starts with 3 lives. Timer expiry or zero lives produces Game Over.
- Enemies can be stomped from above; unsafe contact and hazards cost a life.
- Coins increase score. Exact scoring and damage invulnerability values will be balanced later.
- The local fish-shaped power-up enables projectiles for exactly 8 seconds.
- A checkpoint challenge can grant an optional achievement or bonus. It cannot gate the next world.
- After Game Over, one successful remote challenge may revive the current run from its latest safe checkpoint. Failure or service outage still offers a normal restart.

## Required experience

Screens: splash/loading, welcome, login, register, main menu, world map, gameplay HUD, pause, checkpoint, Fish Challenge, Game Over, Mission Complete, leaderboard, profile, settings, and About/How to Play.

Keyboard baseline: A/D or arrows to move, Space to jump, F to shoot while powered, and Escape to pause. Responsive menu screens are required; gameplay is desktop-first until touch controls are explicitly scoped.

## Art and audio plan

The visual direction is an original, colourful cartoon adventure with expressive silhouettes and cohesive UI/gameplay styling. The explorer will have a hat, practical adventure clothing, backpack, and boots without copying a recognizable character. Enemies will be playful, readable, and threatening without reproducing the supplied mushroom design.

Phase 0 uses styled UI placeholders only. Later asset work is a separate track: hunter animations, enemy animations, coins, fish power-up, projectiles, three parallax world backgrounds, tiles/platforms, hazards, checkpoints, treasure chest, effects, music, and sound effects. Every added asset must be original, commissioned, generated with documented terms, or accompanied by its source and license. The two supplied reference images are not distributable game assets.

## Acceptance boundaries

- World progression and final treasure do not depend on the Fish API.
- Game logic emits domain events and does not call React, Supabase, or remote services directly.
- Signed-in players may persist checkpoints, achievements, profiles, and leaderboard results. Guest play remains possible, with persistence limited to the browser until later decisions.
