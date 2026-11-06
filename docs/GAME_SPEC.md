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

### Phase 3B gameplay asset register

| Asset | Source, license, and intended use |
| --- | --- |
| `public/art/gameplay/hunter-atlas.png` | Generated for TreasureHunt with OpenAI's built-in image-generation tool on 5 November 2026, then padded without resampling for exact Phaser frames. Original teal-hatted explorer in eight consistent poses: idle, two run frames, jump, fall, damage, magic shooting, and checkpoint celebration. No supplied or franchise character was copied. Project output is used under the applicable OpenAI output terms. |
| `public/art/gameplay/emerald-jungle-panorama.png` | Generated for TreasureHunt with OpenAI's built-in image-generation tool on 5 November 2026. Original side-view emerald valley with distant ruins, waterfalls, mist and sunlight; no characters, text, logos or copied locations. Project output is used under the applicable OpenAI output terms. |
| `public/art/gameplay/jungle-objects-atlas.png` | Generated for TreasureHunt with OpenAI's built-in image-generation tool on 5 November 2026, then frame-padded. Original leafy armadillo-lizard enemy, compass coin, magical fish, orb, thorns, checkpoint and impact art. No mushroom/franchise enemy or gun is included. Project output is used under the applicable OpenAI output terms. |
| `public/art/gameplay/jungle-terrain-atlas.png` | Generated for TreasureHunt with OpenAI's built-in image-generation tool on 5 November 2026, then frame-padded. Original mossy carved ground, floating temple ledges, stepping stone and ruin arch. Project output is used under the applicable OpenAI output terms. |

The final prompts specified premium hand-painted 2D cartoon artwork, emerald/teal/gold/earth colours, transparent atlases with exact grids, consistent lighting, no text/watermarks, and explicit exclusion of copied Nintendo or other franchise designs. The earlier Phase 3A procedural artwork is retained only for tiny collision/particle utility textures, not visible character or environment presentation.

### Phase 4 Sunset Ruins asset register

| Asset | Source, license, and intended use |
| --- | --- |
| `public/art/gameplay/sunset-ruins-panorama.png` | Generated for TreasureHunt with OpenAI's built-in image-generation tool on 5 November 2026. Original wide golden-hour ruins, aqueducts and mountain valley; no characters, platforms, text, logos or copied locations. Project output is used under the applicable OpenAI output terms. |
| `public/art/gameplay/sunset-terrain-atlas.png` | Generated for TreasureHunt with the same tool, then cropped, scaled and padded into four deterministic Phaser frames. Original sandstone ground, broken bridge, step and arch scenery. |
| `public/art/gameplay/sunset-objects-atlas.png` | Generated for TreasureHunt with the same tool, then transparently padded to a 3x3 frame grid. Original scarab-stone enemy, compass coin, magical fish/orb, spikes, checkpoint, impact and vine art. |

Prompts requested original premium cartoon side-view assets in warm sandstone, turquoise and gold, with transparent atlas cells and explicit exclusions for text, watermarks, trademarks and recognizable copyrighted designs. Mechanical atlas processing changed only framing and dimensions.

### Phase 5 Crystal Cavern asset register

| Asset | Source, license, and intended use |
| --- | --- |
| `public/art/gameplay/crystal-cavern-panorama.png` | Generated specifically for TreasureHunt with OpenAI's built-in image-generation tool on 6 November 2026. Original wide luminous cavern with cyan/amethyst crystals, ruins, mist and underground waterfalls; no characters, text, logos, copied locations or foreground gameplay platforms. |
| `public/art/gameplay/crystal-terrain-atlas.png` | Generated with the same tool as an original transparent 2x2 sheet: crystal-stone ground, bridge, step and decorative broken arch. The exact 627px cells and measured crop metadata are consumed directly by Phaser. |
| `public/art/gameplay/crystal-objects-atlas.png` | Generated with the same tool as an original transparent 3x3 sheet: two matching crystal-beetle poses, medallion coin, magical fish, magic orb, crystal hazard, legendary treasure chest, impact sparkle and crystal decoration. The exact 418px cells are consumed directly by Phaser. |

The prompts specified project-original polished cartoon fantasy game art, strict equal atlas cells, transparent backgrounds where required, blue/violet/cyan crystal lighting, restrained gold accents, and explicit exclusions for copied characters, guns, text, logos and watermarks. Project output is used under the applicable OpenAI output terms; no supplied reference image is shipped.

## Phase 3A playable scope

Emerald Jungle is playable with Arcade Physics, camera-following traversal, layered parallax, platforms and gaps, coins, hazards, patrolling enemies, stomping, three lives, a 120-second timer, checkpoint completion, pause/resume/restart, keyboard controls, and mobile controls. Completion updates temporary in-memory guest progress or calls the authenticated progression endpoint. Sunset Ruins is also playable through the shared scene; Crystal Cavern, production audio, and remote Fish challenge gameplay remain later-phase work.

## Phase 3B polished scope

Emerald Jungle now uses the painted gameplay assets above, full-viewport resize behavior, a larger animated hunter, measured jump physics, coyote time, jump buffering, air steering, independent multi-touch controls, reachable upper collectibles, landing/collection/impact feedback, and patrol bounds that keep enemies on terrain. The local fish collectible grants exactly eight seconds of pause-safe magic-orb shooting; F or the mobile Shoot control fires in the facing direction, and projectile overlap defeats an enemy. Repeated pickup rules reset rather than stack the eight-second window. World 1 ends only with “World Complete” and “Checkpoint Reached,” then unlocks World 2 through the existing guest/authenticated progression boundary.

Painted terrain surfaces and opaque character baselines are measured against their Arcade bodies so standing, patrol and landing frames remain visually grounded. One-way collision accepts the player only while descending from above a platform; leaving an edge restores normal gravity and a gap fall uses the existing damage/respawn rule. Replaying World 1 creates a fresh 3-life, 120-second run with new enemies and collectibles.

Guest completion is temporary for one active client-side adventure. Map-to-game navigation retains sequential unlocks, but choosing Play as Guest again, refreshing, or opening a new browser session resets to World 1. Registered progression remains Supabase-backed and is never merged with guest state.

The local collectible is a deterministic gameplay mechanic and never calls the university Fish Game API. The remote API remains an optional later checkpoint/achievement/revive interaction.

## Phase 4 playable scope

Sunset Ruins is a real 105-second World 2 configuration consumed by the same `WorldScene`. It adds a longer golden-hour route, seven ground sections, fourteen elevated bridge/step platforms, 31 coins, five faster scarab enemies, three hazards, one reachable fish power-up and a checkpoint. It reuses the hunter, movement, gravity, stomp/projectile combat, eight-second power rule, pause/restart, mobile input, HUD and progression events. Completion says “World Complete / Checkpoint Reached” and unlocks World 3; it never claims final treasure victory.

The World Map selectively warms the currently selected playable world's route, Phaser runtime and required local artwork. Gameplay is considered ready only after Phaser completes real loading and scene creation. Cached normal launches should not show a loading screen; slow first loads retain a short fallback, and failed runtime/art loads offer Retry or return to the World Map.

## Phase 5 playable scope

Crystal Cavern is the real 90-second final configuration consumed by the same `WorldScene`. It provides seven separated ground sections, fifteen elevated crystal platforms, 33 coins, seven faster crystal beetles, five crystal hazards, one reachable eight-second fish power-up and an end-of-level legendary treasure. Painted terrain and enemy baselines use measured body/presentation metadata; real 180–200px gaps remain unsupported but inside the tested jump envelope.

Worlds 1–2 expose checkpoint goals and World 3 exposes a treasure goal through the same level contract. Only a player overlap with the actual treasure calls the guarded completion transition. The final overlay reads “Mission Complete / Treasure Discovered” and reports score, coins, remaining time and lives. Guest completion remains in memory for the active adventure; authenticated completion sends only bounded world/coin data to the verified-identity progression route. It does not submit a leaderboard score or claim that client-side scoring is cheat-proof.

## Phase 6 player-experience scope

Selecting World 1 from the World Map opens an accessible field briefing with the implemented keyboard and touch controls. Phaser is not constructed, so physics, enemies, power duration and the 120-second timer cannot advance until Start Adventure. The same factual guide remains available under About → How to Play without interrupting Worlds 2–3 or direct re-entry.

Pause freezes Arcade Physics, the active run clock and fish power. Resume is a React-owned 3–2–1–GO presentation; the bridge sends the existing resume command only after GO. World 1–2 completion keeps Next World disabled until guest progression is updated or the authenticated `/api/progress` request succeeds. World 3 has only replay and map actions. Profile and leaderboard surfaces display only RLS-authorized server data, with explicit empty/sign-in states and no invented achievements or scores.

## Acceptance boundaries

- World progression and final treasure do not depend on the Fish API.
- Game logic emits domain events and does not call React, Supabase, or remote services directly.
- Signed-in players may persist checkpoints, achievements, profiles, and leaderboard results. Guest play remains possible, but guest progression exists only for the current in-memory adventure and resets on refresh or a new Guest entry.
