# TreasureHunt Architecture

## System shape

The browser contains two presentation layers: React owns navigation, forms, menus, dialogs, and accessible HUD overlays; Phaser owns the canvas, physics, animation, and moment-to-moment play. They exchange small typed-by-convention JavaScript event payloads through a game bridge. Neither layer talks directly to PostgreSQL or the upstream Fish service.

Next.js Route Handlers form the server boundary. They validate the Supabase cookie session, authorise changes, call focused services, and return stable application responses. Supabase stores profiles, runs, checkpoints, challenge attempts, achievements, and completed scores under Row Level Security.

## Boundaries

| Area | Responsibility | Must not know |
| --- | --- | --- |
| `game/` | Deterministic rules, entities, systems, scenes, world configuration, domain events | React components, cookies, SQL, Fish response fields |
| `components/` and `app/` | Screens, forms, HUD, navigation, accessibility | Phaser internals, database implementation |
| `lib/supabase/` | Browser/server Supabase clients and session boundary | Game physics or Fish payloads |
| `lib/fish/` | Timeout, upstream fetch, response validation, normalisation | UI layout, checkpoint policy, score mutation |
| Route Handlers | Authentication, validation, orchestration, safe DTOs | Phaser sprites and scene lifecycle |

## Event-driven flow

Phaser input, overlaps, collisions, timers, and scene lifecycle callbacks create domain events such as `coin:collected`, `player:damaged`, `power:started`, `power:expired`, `world:completed`, and `run:ended`. Focused systems update local state once and the bridge publishes a serialisable snapshot to React. Scene shutdown must remove listeners and timers. A run state machine prevents duplicate completion or Game Over transitions.

Phase 3A implements this boundary in `game/core/game-bridge.js` and `game/core/events.js`. React sends only input, pause, resume, and restart commands. Phaser returns ready, state snapshot, completion, and game-over events. `GameScreen` never receives a scene, sprite, or physics object. `WorldScene` owns Arcade Physics and delegates input to `PlayerController`, patrol behaviour to `EnemySystem`, and deterministic score/lives/timer transitions to `RunState`. Scene shutdown destroys those systems and their bridge subscriptions before Phaser is destroyed.

`game/config/emerald-jungle.js` and `game/config/sunset-ruins.js` are level data consumed by the reusable `WorldScene`; they contain art metadata, dimensions, platforms, coins, enemies, hazards, spawn, and checkpoint positions rather than scene-specific control flow. `game/config/levels.js` is the small lookup contract. World 2 therefore adds no scene, controller, combat service, HUD or persistence copy.

## Phase 3B gameplay composition

`WorldScene` remains an event/lifecycle coordinator rather than a rule container. `PlayerController` owns keyboard/virtual input translation, acceleration, coyote time, buffering and animation selection. `InputState` tracks sources per control, so two touch pointers can hold movement and jump independently. `CombatState` owns the exact eight-second window, shot cooldown, pause shifting, repeated pickup and single expiry transition. `ProjectileSystem`, `EnemySystem`, and `CameraController` own their Phaser objects/listeners. The pure `collision-rules` module keeps stomp decisions testable without Phaser. Jump-envelope assertions remain test helpers because the former production `physics-model` had no runtime consumer and added a needless public module.

The render boundary is `load-assets.js` plus `create-textures.js`: the former knows project asset URLs and atlas geometry; the latter owns animation registration and measured presentation metadata. `getTerrainVisualLayout` converts the painted surface coordinate in each atlas frame to the configured Arcade collision top; hunter and enemy body offsets likewise use measured opaque baselines. World configuration never imports asset files, React or persistence. Generated terrain art remains separate from invisible collision strips, so correcting transparent padding or render origins does not change platform physics.

`WorldScene` owns Arcade collider registration, while `canLandOnPlatform` is a pure process predicate: contact resolves only for a descending body whose previous bottom was above the surface. `PlayerController` treats only `body.blocked.down` as grounded. Gravity is configured once on the Arcade world and enabled through `player.body.setAllowGravity`, including after respawn; the body API matters because Phaser's display `Sprite` does not provide that method. Falling below the configured world margin remains an event-driven damage/respawn or Game Over transition.

Progression and a temporary run have different owners. `guest-progress.js` holds one guest adventure's ordered completed-world IDs in module memory and publishes small change events; it never writes progress to storage. Welcome resets that state and removes only the obsolete `treasurehunt.guest-progress.v1` key. Client-side Map ↔ Game navigation retains the active adventure, while refresh naturally creates a new one. A per-adventure attempt number changes the gameplay URL so `GameScreen`, Phaser, `RunState`, enemies and collectibles are reconstructed for every replay. Authenticated pages ignore this module and continue loading progress from Supabase.

The event ordering for a fish is overlap callback -> `CombatState.activate` -> `fish:collected` and `power:started` -> serialisable `state:changed` snapshot. F/touch input crosses as `input:changed`; `PlayerController` exposes a shoot action; `ProjectileSystem` emits `projectile:fired`; Arcade overlap disables the projectile/enemy before `enemy:defeated` and the updated snapshot. Expiry is edge-triggered once by `CombatState.consumeExpiry`. Completion first transitions `RunState`, pauses physics, publishes final state, then emits `world:completed`; React persists progression once. Terminal `RunState` guards reject duplicate mutations.

Scene shutdown owns bridge unsubscribe callbacks, Escape removal, resize removal and collider destruction. Phaser owns physics-group disposal; custom cleanup deliberately does not clear groups after Arcade Physics shutdown. The scene active clock clamps large throttled-frame deltas and stops while paused, preventing browser catch-up bursts from consuming the timer or power window.

## Phase 4 reuse and progression

`WorldScene` loads generic `world-panorama`, `world-terrain` and `world-objects` keys from the selected level's `art` metadata. Render modules still own atlas loading and animation; configuration supplies filenames, frame geometry and measured presentation values. `getTerrainVisualLayout` maps each painted surface to the configuration-owned Arcade collision top. `EnemySystem` accepts one presentation record because the scarab atlas has different transparent padding; it does not know which world selected it.

The route page permits only implemented Worlds 1–2. For authenticated users it compares the requested world number with server-loaded `completed_worlds` before rendering. For guests, `GameScreen` checks the in-memory derived state before Phaser boot, so refresh or direct entry cannot restore or bypass the active-adventure sequence. Completion still emits once from Phaser; React sends `{ world, coins }` to `/api/progress`, which derives the player from verified cookie claims. No player ID crosses from gameplay.

Event ordering is unchanged across both worlds: overlap or collision updates deterministic state, emits a narrow domain event and snapshot, then React performs optional persistence. Restart uses the same level object and constructs new run state, enemies and collectibles. Scene shutdown owns command, keyboard, collider, system and resize cleanup. A separate `SunsetRuinsScene` or inheritance hierarchy would duplicate lifecycle behavior and let fixes diverge; the explicit configuration contract is smaller and easier to explain.

Remote flows are asynchronous events at the application boundary. A checkpoint or Game Over screen requests a challenge from a Route Handler; the server obtains and validates an upstream response, stores the solution server-side with expiry/single-use metadata, and returns only the challenge image and local challenge ID. Answer validation and any bonus/revive mutation happen atomically on the server.

## Fish Game API verification

Verified on 4 November 2026 against the provider documentation and live service:

- Documentation: `https://marcconrad.com/uob/fish/doc.php` (page updated June 2026).
- Documented base URL: `http://marcconrad.com/uob/fish/api.php`; HTTPS at `https://marcconrad.com/uob/fish/api.php` also returned HTTP 200 and is the configured default to avoid mixed content.
- Optional query parameters: `out=json|csv` (default `json`) and `base64=yes|no` (default `no`).
- Observed URL JSON response: `{ "question": "https://www.sanfoh.com/uob/fish/data/...png", "fish": 9, "chest": 1 }`.
- Observed base64 JSON uses the same keys with `question` containing raw PNG base64 text.
- Observed CSV is `question,fish,chest`; `question` is a URL or raw base64 depending on the switch.
- Responses reported `Content-Type: text/html`, even for JSON, so the adapter parses text explicitly and validates every field.
- Four live variants returned HTTP 200 in about 0.7-1.1 seconds during the check. This is a point-in-time connectivity result, not an uptime guarantee.
- Provider terms say the service is supplied as-is, may be discontinued without notice, and must not be used commercially.

The meaning and permitted ranges of `fish` and `chest` are not specified on the documentation page. The adapter therefore preserves them as validated non-negative integers without inventing additional semantics. Gameplay integration will be confirmed against the provider’s example UI before the challenge screen is finalized. Server requests use an abort timeout and validate the observed HTTPS image host/path or PNG base64 data. Future challenge routes must avoid logging solutions and degrade to a skippable unavailable state.

## Phase 2B identity and persistence

`proxy.js` and `lib/supabase/proxy.js` refresh Supabase SSR cookies with `getClaims()`. Browser and server client construction remains isolated in `lib/supabase/`; the server-only secret client is created only for narrowly scoped trusted operations. Route Handlers call `lib/auth/session.js` and derive the player ID from verified claims, never from a request body.

Email registration, password login, Google PKCE initiation/callback, email token-hash confirmation, and logout are Route Handlers under `app/api/auth/` and `app/auth/`. Safe local return paths prevent open redirects. Responses use no-store headers and focused public-error mapping. A bounded per-instance request guard supplements Supabase Auth provider limits; production must also configure provider/dashboard limits because an in-memory limiter is not distributed across Vercel instances.

The migration creates `profiles`, `player_progress`, `achievements`, `game_runs`, and a denormalised safe `leaderboard_entries` projection. RLS restricts private rows to `auth.uid()`. Direct player writes to progression, achievements, and runs are revoked. Because automatic table exposure is disabled, `service_role` receives only the table operations used by the server adapters: profile lookup, progress read/update, run read/insert/update, and leaderboard insert. It receives no achievement or identity-sequence access. Trigger functions are not directly executable by API roles.

Server Route Handlers validate bounds and call service-role-only database functions for sequential world completion and single-use run submission. A completed leaderboard submission must identify World 3 and the locked progress row must already record all three worlds complete; earlier-world, out-of-order, foreign, and repeated submissions are rejected. The secret key never enters a client bundle.

Guest progress is memory-only and is ignored by authenticated pages. Guests cannot read or submit leaderboard data. Registered progress remains PostgreSQL-backed across refresh/logout/login and the UI consumes stable profile/progress/leaderboard shapes from `lib/data/player-repository.js`, not database internals.

Fully authoritative score calculation is impossible while Phaser executes in the browser. The server does not blindly accept a user ID or completion flag: it derives identity from verified claims and cross-checks the owned server-issued run, numeric bounds, unlocked progression, persistent World 3 completion, and single submission in one transaction. The numeric score remains client-originated; Phase 3 must connect trusted gameplay evidence or server-recomputable scoring before treating it as cheat-proof.

## Phase 2A interface boundary

App Router pages compose reusable presentation components from `components/ui`, `components/auth`, `components/overlays`, and `components/worlds`. Pure form rules live in `lib/validation` so validation is testable without coupling it to Supabase. Login and registration stop after local validation and state clearly that no request or account mutation occurred.

Welcome is the single main menu. Settings and About use accessible in-place dialogs instead of separate information pages. Guest play opens the World Map directly and reads temporary sequential completion state through `lib/progress/guest-progress.js`; gameplay calls its completion function. Authenticated persistence uses the Phase 2B session boundary.

The World Map delegates in-memory progress subscription and cleanup to `components/worlds/use-guest-world-progress.js`. This keeps event lifecycle out of the visual map while retaining pure sequential progression rules in `lib/progress/guest-progress.js`.

## Implementation status

- **Implemented:** focused App Router screens, compact post-registration email-confirmation UI, real Supabase auth Route Handlers, SSR cookie refresh, PKCE callback, logout/profile controls, pure validation, separate guest/auth progress, RLS migration, trusted progression/run endpoints, Fish response normalization, and React/browser cleanup. Gameplay includes original painted World 1/2 art, measured terrain grounding, tuned movement, source-aware multi-touch, local fish/orb combat, pause-safe timing, focused systems, fresh replay runs, fullscreen rendering, and sequential World 1/2 checkpoint progression.
- **Configuration-dependent:** email delivery, Google consent, live cookie persistence, and deployed RLS behaviour require the owner's Supabase/Google project and are not claimed as locally integrated.
- **Planned:** Crystal Cavern treasure completion, production audio, richer frame counts, trusted score evidence, Fish challenge attempt records/routes/UI, and achievement awarding.
