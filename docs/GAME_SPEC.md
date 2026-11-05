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

Screens: splash/loading, Welcome main menu, login, register, world map, gameplay HUD, pause, checkpoint, Fish Challenge, Game Over, Mission Complete, leaderboard, profile, and game-style Settings and About overlays.

Keyboard baseline: A/D or arrows to move, Space/Up to jump, F to shoot while powered, and Escape to pause. Phase 3A also provides hold-to-move and jump controls on touch devices.

## Art and audio plan

The visual direction is an original, colourful cartoon adventure with expressive silhouettes and cohesive UI/gameplay styling. The explorer will have a hat, practical adventure clothing, backpack, and boots without copying a recognizable character. Enemies will be playful, readable, and threatening without reproducing the supplied mushroom design.

Phase 1 establishes the cinematic interface with original generated concept artwork. Later asset work remains a separate track: hunter animations, enemy animations, coins, fish power-up, projectiles, parallax world layers, tiles/platforms, hazards, checkpoints, treasure chest, effects, music, and sound effects. Every added asset must be original, commissioned, generated with documented terms, or accompanied by its source and license. The two supplied reference images are not distributable game assets.

### Phase 1 asset register

| Asset | Source and intended use |
| --- | --- |
| `public/art/treasurehunt-hero.png` | Generated for this project with OpenAI's built-in image-generation tool on 4 November 2026. Prompt: an original teal-hatted explorer overlooking a glowing jungle temple, composed with left-side UI space. The supplied images were mood references only; recognizable characters and franchise elements were explicitly excluded. Used for splash, welcome, forms, and menu backgrounds. |
| `public/art/worlds-atlas.png` | Generated for this project with OpenAI's built-in image-generation tool on 4 November 2026. Prompt: an original three-zone panorama of Emerald Jungle, Sunset Ruins, and Crystal Cavern with no characters, text, logos, or copied locations. Used for the fullscreen journey map and circular destination crops. |

### Phase 3A temporary asset register

| Asset | Source, license, and intended use |
| --- | --- |
| Procedural hunter, jungle critter, coins, platforms, spikes, checkpoint, and parallax layers in `game/render/create-textures.js` | Original shapes drawn at runtime specifically for TreasureHunt. No third-party files or copied character designs are included. These are project-owned temporary gameplay assets and may be replaced by polished, separately licensed sprite sheets later. |

## Phase 3A playable scope

Emerald Jungle is playable with Arcade Physics, camera-following traversal, layered parallax, platforms and gaps, coins, hazards, patrolling enemies, stomping, three lives, a 120-second timer, checkpoint completion, pause/resume/restart, keyboard controls, and mobile controls. Completion updates guest local progress or calls the authenticated progression endpoint. Sunset Ruins, Crystal Cavern, fish shooting, audio, and advanced combat remain later-phase work.

## Acceptance boundaries

- World progression and final treasure do not depend on the Fish API.
- Game logic emits domain events and does not call React, Supabase, or remote services directly.
- Signed-in players may persist checkpoints, achievements, profiles, and leaderboard results. Guest play remains possible, with persistence limited to the browser until later decisions.
