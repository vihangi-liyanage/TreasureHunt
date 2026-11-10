# TreasureHunt Decision Log

## D001 Final brief overrides older proposals

**Decision:** Use Supabase Auth/PostgreSQL and `@supabase/ssr`, with timers 120/105/90. Reject the older Auth.js, Neon, and 90/100/110 suggestions.

**Reason:** The user explicitly marked the final stack and current rules as authoritative.

## D002 One reusable Phaser world scene

**Decision:** Build worlds from configuration and focused systems rather than three copied scenes.

**Reason:** Shared mechanics stay cohesive, level differences remain visible as data, and fixes apply consistently.

## D003 React and Phaser communicate through a narrow event bridge

**Decision:** React owns application UI; Phaser owns gameplay. Only serialisable commands, events, and snapshots cross the boundary.

**Reason:** This prevents UI concerns from leaking into physics code and makes both sides testable.

## D004 Fish integration is optional and server-side

**Decision:** Route Handlers call a validating Fish adapter; solutions never go to the browser. Challenges may add a bonus or permit the single revive, but never unlock normal progression.

**Reason:** This isolates an unstable third party, protects answers, demonstrates interoperability, and preserves the core game during outages.

## D005 Use HTTPS despite the documented HTTP base URL

**Decision:** Default to the successfully verified HTTPS endpoint and keep it configurable through `FISH_API_BASE_URL`.

**Reason:** An HTTPS Vercel application should not depend on mixed-content HTTP. Connectivity was verified, while configuration allows a future provider change.

## D006 Delay production art without blocking mechanics

**Decision:** Use clean original placeholders during core implementation and manage final art/audio as a separate licensed asset track.

**Reason:** Phase 0 should establish reliable gameplay architecture; the reference images cannot be copied or shipped.

## D007 Isolate the UI preview from production access

**Decision:** Expose the Phase 1 menu and world-selection review flow only in the Next.js development environment. In production those routes resolve to 404 until Phase 2 adds real session checks.

**Reason:** Reviewers need a clear navigation path now, but a temporary route must not become a production authentication bypass.

**Status:** Superseded by D009 in Phase 2A. Guest access is now an intentional product mode rather than a development preview.

## D008 Use two original generated key-art assets

**Decision:** Use one cinematic hero scene and one three-world panorama, with CSS gradients, crops, and motion providing reusable variations.

**Reason:** This creates a cohesive premium visual language without copying the supplied references, multiplying large assets, or adding an animation dependency.

## D009 Make Welcome the main game menu

**Decision:** Remove the dashboard-style Main Menu route. Welcome now exposes exactly Play as Guest, Player Login, Settings, and About the Game; informational content uses overlays.

**Reason:** A single fullscreen menu better matches a game flow, removes redundant navigation, and keeps the hunter artwork central.

## D010 Keep guest progression local and sequential

**Decision:** Store only ordered completed-world IDs in versioned browser storage. Derive locked, unlocked, current, and completed states from the shared world configuration.

**Reason:** Guests need durable progress without authentication, while deriving states prevents out-of-order world unlocking and keeps Supabase concerns out of the UI until Phase 2B.

**Status:** Superseded by D021. Guest progress is no longer durable.

## D011 Isolate browser progression synchronization

**Decision:** Keep pure progression and storage serialization in `lib/progress/guest-progress.js`, and move the browser `storage` subscription into a focused World Map hook.

**Reason:** The map should render journey state without owning persistence-event lifecycle details. The hook supplies a small `{ states, journeyProgress }` interface and cleans up its listener independently.

**Status:** Superseded by D021. The focused hook remains, but subscribes to in-memory adventure events rather than browser storage.

## D012 Restrict Fish question images to the verified contract

**Decision:** Accept remote Fish questions only as HTTPS PNGs under the observed `www.sanfoh.com/uob/fish/data/` path, while retaining the observed raw PNG base64 form.

**Reason:** A URL prefix alone accepted malformed or untrusted values. The stricter adapter protects downstream UI from arbitrary image origins and can be updated only after a provider change is re-verified.

## D013 Use Supabase SSR claims as the identity boundary

**Decision:** Refresh cookie sessions in the Next.js proxy and derive every protected mutation's user ID from `getClaims()`. Keep the secret key in a server-only client used only after that check.

**Reason:** A browser-provided user ID is forgeable. Verified claims plus RLS create independent application and database authorization boundaries.

## D014 Make trusted progression and run writes server-only

**Decision:** Revoke direct authenticated writes to progress and runs. Route Handlers validate bounded inputs and call service-role-only PostgreSQL functions that lock rows, enforce sequential completion, and prevent repeat run submissions.

**Reason:** RLS ownership alone would still let a player unlock worlds or rewrite scores. Atomic functions keep cross-row invariants in one transaction while the UI receives a small application contract.

## D015 Keep guest and authenticated persistence separate

**Decision:** Guest progression stays in versioned local storage; authenticated progression comes only from Supabase. Guests may view the map but cannot read or submit leaderboard records.

**Reason:** This preserves optional play without creating anonymous database identities, prevents accidental local progress merging, and makes the virtual-identity boundary explicit.

**Status:** Partly superseded by D021. Identity separation remains; guest progression is now temporary rather than persisted locally.

## D016 Explicit least-privilege service grants

**Decision:** With automatic table exposure disabled, revoke broad `service_role` access on Phase 2B tables and grant only the operations required by current server routes and invoker functions. Do not grant the unused achievements identity sequence. Accept completed leaderboard rows only when the owned run declares World 3 and persistent progression already confirms all three worlds complete.

**Reason:** The service key bypasses RLS, so its SQL privileges must remain narrow. Database invariants provide a second check behind server-side claims verification, while unused achievement access can be added later with the feature that needs it.

## D017 Build World 1 with procedural temporary art and focused Phaser systems

**Decision:** Render original temporary sprites and jungle layers at runtime, drive one reusable `WorldScene` from level configuration, and cross the React boundary only through serialisable bridge events.

**Reason:** This produces a polished playable demonstration without unlicensed assets, keeps art replacement independent of mechanics, and prevents Phaser objects, React state, and persistence services from becoming coupled.

## D018 Separate painted presentation from collision geometry

**Decision:** Load original generated gameplay atlases through one asset module, render terrain art independently, and collide against invisible configuration-sized strips.

**Reason:** Stretching one tile into every platform looked crude and made hitboxes follow decorative transparent padding. Separate layers preserve visual quality, accurate collisions and future art replacement without changing level rules.

## D019 Model local fish combat as deterministic gameplay state

**Decision:** Keep the collectible's eight-second power window, cooldown, pause/restart behavior and expiry in `CombatState`, separate from projectile rendering and completely separate from the remote Fish API adapter.

**Reason:** A pure state model gives exact tests and one expiry transition. Extending a pickup from its latest collection is understandable, while stacking durations could exceed the fixed eight-second rule. Using Phaser timers directly was rejected after browser throttling demonstrated catch-up bursts.

## D020 Align painted surfaces and reset runs at the route boundary

**Decision:** Store measured terrain surface coordinates and sprite body baselines in the render module, then align those pixels to configuration-owned collision tops. Enter gameplay from the World Map with a normal document navigation so every attempt creates a new Phaser scene and `RunState`, while completed-world progress remains in its existing guest or authenticated store.

**Reason:** The floating characters were a presentation-origin error, not faulty physics; changing collision geometry would have broken reachable layouts. A fresh route lifecycle prevents a cached terminal UI from becoming run state without adding run IDs or another reset service. The test-only `physics-model` wrapper was removed because it had no runtime consumer; reachability calculations now live beside the tests that use them.

**Status:** Route-navigation portion superseded by D021; measured visual alignment remains current.

## D021 Keep guest progression in one active adventure only

**Decision:** Store ordered guest completions only in module memory. Reset them on every Welcome-screen guest entry, let refresh/new sessions reset naturally, and remove only the obsolete TreasureHunt guest key. Use client navigation plus a simple attempt number to retain map progress while reconstructing each gameplay run. Registered progress remains exclusively Supabase-backed.

**Reason:** Guest mode must allow a three-world journey without becoming a second identity store. Session storage or another cookie would still restore progress after refresh and blur the guest/authenticated boundary; a global state framework is unnecessary for one small array and subscription set.

## D022 Validate one-way platform contact from above

**Decision:** Keep configuration-owned static strips, but accept collision resolution only when the hunter is descending and its previous body bottom was at the platform top. Treat `blocked.down` as the grounded signal and keep gravity explicitly enabled after spawn/respawn.

**Reason:** Global Arcade gravity was already correct. The permissive collision/grounded checks could classify non-supporting contact as ground. A small pure process rule fixes platform pass-through and edge falls without changing art, level spacing or introducing a physics manager.

## D023 Add World 2 through the existing level contract

**Decision:** Add `sunset-ruins.js` plus one `levels.js` lookup, and let `WorldScene` load generic world asset keys from level art metadata. Keep shared movement, collision, combat, HUD and progression systems unchanged.

**Reason:** A copied scene would make fixes and event cleanup diverge. One small lookup and explicit presentation data handle genuine art differences without a class hierarchy, manager registry or framework.

## D024 Replace registration form after confirmation-required signup

**Decision:** After a successful Supabase signup without a session, clear both password values and replace the form with a compact “Check Your Email” state and direct Login action. Let the auth panel scroll internally only when a very short viewport requires it.

**Reason:** Appending a notice preserved sensitive fields and pushed navigation below the viewport. The success state reflects the real server result without pretending confirmation or authentication succeeded.

## D025 Trim painted terrain to its measured walkable bounds

**Decision:** Register cropped Phaser frames from each existing terrain atlas, align crop-relative painted surface rows to configuration-owned collision tops, and size the visible walkable span to the real collider width. Widen ground gaps only where their prior spacing allowed a running body to contact the next platform before falling.

**Reason:** Sunset's stale full-frame measurements placed physics 19–35 pixels above the art and transparent side padding visually hid collider edges. Gravity and the shared one-way collision rule were already valid. Correcting the art/collider contract and level data fixes both worlds without invisible supports, visual-only offsets, a copied scene, or a new physics layer. A tilemap conversion would offer richer contours but is unnecessary disruption for the existing platform model.

## D026 Preload only the selected playable world

**Decision:** While the World Map is visible, manually prefetch the selected game route and cache the dynamically imported Phaser factory plus that world's four required image resources. `GameScreen` consumes the same cache but still waits for the scene's real `game:ready` event. Hide the loading fallback for the first 250 ms and show a retryable error for genuine failures.

**Reason:** The former button navigation triggered route work, Phaser import and 6–7 MB of image requests only after Play, then displayed an overlay immediately. Selective preloading moves useful work into map viewing time without increasing Splash cost or downloading locked/unselected worlds. Retaining a global Phaser game would risk stale runs and leaked GPU/input state; preloading every world or adding a global store would spend more bandwidth and add lifecycle complexity.

## D027 Remove deprecated `baseUrl` without suppressing TypeScript 6

**Decision:** Remove only `baseUrl` from `jsconfig.json` and keep `"@/*": ["./*"]`.

**Reason:** The installed/VS Code workspace language service is TypeScript 6.0.3 and reports TS5101 because `baseUrl` will stop functioning in TypeScript 7. Relative `paths` targets are resolved from the config file without `baseUrl`, so this removes the cause while preserving imports. `ignoreDeprecations`, a TypeScript migration or extra module-resolution settings would hide or enlarge a one-line fix.

## D028 Represent checkpoints and treasure through one goal contract

**Decision:** Each level supplies `goal: { type, x, y }`. The shared scene creates the corresponding art/body and completes only on its Arcade overlap; `RunState.complete` remains the duplicate guard. World 3 remains configuration plus original assets, not a copied scene.

**Reason:** Checkpoint and treasure differ in meaning/presentation, not physics lifecycle. One narrow data contract keeps collision, timer, combat, cleanup and persistence shared while making the final treasure explicit and testable. A separate final scene would duplicate mechanics; completing from route entry or an x-coordinate would be fake and bypass genuine collection.

## D029 Gate World 1 boot and resume through existing lifecycle commands

**Decision:** Add the World 1 briefing before Phaser construction, and keep Phaser paused throughout a React-rendered 3–2–1–GO countdown. Send the existing resume command only after GO; Escape may pause but cannot bypass that countdown.

**Reason:** Delaying scene construction proves physics and the run timer have not started. Leaving countdown presentation in React keeps accessibility and navigation out of Phaser while one bridge command remains the authoritative resume edge. A second Phaser timer, polling, or a global UI store would create duplicate clocks or unclear ownership.

## D030 Require persistence success before next-world navigation

**Decision:** Treat checkpoint completion, persistence and navigation as three ordered states. Guests update their active in-memory adventure synchronously; authenticated players wait for the verified progress Route Handler. Enable Next World only after success, expose Retry Save on failure, and omit Next World after final treasure.

**Reason:** A local collision proves gameplay completion but not database persistence. This ordering avoids claiming a durable unlock before the server-authorised transaction succeeds, without moving Supabase into Phaser or trusting a client user ID.

## D031 Keep resume presentation over the live canvas and crop backdrops by data

**Decision:** Render 3–2–1–GO as a transparent, input-blocking React layer over the existing canvas/HUD while Phaser remains paused. Use one pure aspect-preserving cover calculation for panoramas, with a configuration-owned 1.12 overscan only for Crystal Cavern's narrower 2:1 artwork.

**Reason:** The previous countdown reused the full pause card and looked like a separate screen. Crystal's apparent gutter was an opaque dark painted edge exposed by its different aspect ratio, not a canvas, camera or physics gap. These focused presentation changes retain one resume edge, preserve accessibility, avoid stretching and do not alter collisions.

## D032 Do not equate saved progress with an eligible ranked run

**Decision:** Keep leaderboard reads on the authorised projection and describe the empty state accurately. Do not create entries until gameplay is connected to the existing server-issued, owned, single-use run lifecycle with an acceptable integrity model.

**Reason:** The live project has saved World 3 progress but no issued or submitted runs. Login and `/api/progress` are identity/progression operations, not score evidence. Automatically copying a client score into the leaderboard would bypass the intended run boundary and overstate integrity; that work belongs in the dedicated leaderboard/security phase.

## D033 Present checkpoints as Compass Shrines without renaming the domain contract

**Decision:** Keep `checkpoint` in world configuration, progression and bridge payloads, but present World 1/2 goals as Compass Shrines and completion as “Shrine Activated / World Complete.” Keep Next World gated on successful progression persistence.

**Reason:** The adventure language improves the player experience and provides a natural future location for an optional Fish challenge. Renaming database/domain values would create migration risk without changing semantics; making a future challenge mandatory would violate the optional-service requirement.

## D034 Balance by explicit level data, not new mechanics

**Decision:** Extend world widths to 6,000/6,300/6,900, raise coin totals to 40/41/45, place three reachable fish in each world, and progress enemy/hazard counts through 6/5, 7/5 and 9/7. Mark only elevated bonus coins as `riskRoute`; retain existing movement, scoring, timers and eight-second refresh/no-stack combat rule.

**Reason:** Deterministic configuration is easy to test, explain and rebalance. Procedural routes or per-world systems would obscure fairness and duplicate the shared scene. The longer routes still leave comfortable time for normal play, while optional scoring choices distinguish leaderboard attempts.

## D035 Keep celebration effects scene-owned and motion-aware

**Decision:** Build shrine/treasure illumination, petals and sparkles from bounded Phaser shapes and existing project utility textures. Track effect objects in `WorldScene`, destroy transient objects after tweens, clear all remaining effects on shutdown, and suppress moving effects/camera flash for reduced-motion users.

**Reason:** Phaser already owns the goal position and scene lifecycle. A React particle package or new asset dependency would split ownership and add weight; unbounded emitters could leak or obscure the HUD.

## D036 Bind Fish revival to server state and the existing bridge

**Decision:** Persist Fish solutions in a service-role-only Supabase table keyed by server-derived virtual owner and an opaque run-attempt UUID. Verify answers in one row-locking SQL function with a partial unique index for one consumed challenge per run. Guests use a signed HttpOnly Fish-only identity cookie; registered players use verified Supabase claims. A challenge has no player-facing answer deadline; an incorrect answer returns to Game Over and a later click creates a fresh challenge. React may emit `game:revive` only after the answer route grants revival, and `RunState` independently enforces one zero-life revival.

**Reason:** A client answer, clear-text signed token, local storage or Phaser fetch would expose or make the solution replayable. Per-instance memory would lose challenges across Vercel instances. The database transaction handles retries, single-use consumption and concurrency without mixing guest/profile data, while the bridge preserves the React/Phaser lifecycle boundary. Revival remains optional: provider or persistence failure leaves replay and map navigation intact.

## D037 Derive ranked totals from a whitelisted gameplay event stream

**Decision:** Issue one owned server run for every authenticated world, record unique configured collision events through a verified Route Handler, and let PostgreSQL derive coins and score when the collected compass or treasure completes the run. Insert a leaderboard entry only for a completed World 3 run, rank each player's best run, and return the top ten plus the requesting player.

**Reason:** The former completion endpoint accepted browser-supplied score, coins, world, and completion state and gameplay never called it. Identity and bounds alone did not make those totals authoritative. Server-side event validation removes arbitrary numeric score submission while preserving Phaser ownership of real-time physics. Completion additionally reloads the ordered stream, requires the objective last, checks configured entity IDs, timing, freshness, ownership, and single use. A full authoritative simulation or replay protocol would be stronger against a modified client but would duplicate Phaser and substantially exceed this game's architecture; trusting the old aggregate payload or inserting on `/api/progress` was rejected. Rankings are therefore integrity-checked, not described as cheat-proof.

## D038 Keep achievement authority transactional and guest rewards temporary

**Decision:** Add gem/fish aggregates to registered progression, unique badge rows to the existing achievements table, and award thresholds inside the same locked SQL transaction that records a run event. Keep the badge catalogue as a pure shared module. Guests use only the existing in-memory adventure snapshot and receive the same notifications without database writes.

**Reason:** Client-only authenticated badges could be replayed or lost, while a second achievement database/service would duplicate identity and ownership. Tying awards to the run event transaction prevents duplicate thresholds and keeps React responsible only for display. Procedural Phaser textures avoid new asset licensing, and configuration-owned placements keep one reusable scene.

## D039 Serialize Next build workers on Windows

**Decision:** Set Next's installed `experimental.cpus` build option to one worker.

**Reason:** Clean builds repeatedly failed with `EPERM` on `mkdir` while the reported directory had already been created, no Node process survived, and ACLs granted normal modify access. The same build completed when generation was serialized. This is a project-local build-concurrency correction; temporary `.next-phase8-verify` output was confirmed as generated build data and removed rather than committed.
