# Assessment code evidence

This maps the actual source to the rubric and distinguishes implemented evidence from planned gameplay.

## 1. High cohesion, low coupling, and encapsulation

**Implemented files:** `components/auth/`, `components/profile/profile-panel.js`, `components/leaderboard/leaderboard-panel.js`, `lib/validation/auth.js`, `lib/auth/`, `lib/data/player-repository.js`, `lib/supabase/`, `lib/progress/guest-progress.js`, `components/worlds/use-guest-world-progress.js`, `game/config/worlds.js`, `game/config/emerald-jungle.js`, `game/scenes/world-scene.js`, `game/systems/player-controller.js`, `game/systems/enemy-system.js`, and `game/core/run-state.js`.

**Evidence and justification:** pages compose focused screens; pure validation does not import React or Supabase; session verification, redirect safety, error mapping, HTTP responses, and database queries are separate modules with small function APIs. The World Map receives profile/progress/leaderboard models instead of querying services, while the guest hook owns only local-storage events. Shared world rules remain configuration, so React and future Phaser scenes do not copy them. This creates focused reasons to change and permits unit tests without a browser or database.

**Alternative:** a single page/server action could validate, authenticate, query, and render with fewer files. It would be faster initially, but UI changes would be coupled to identity and persistence, tests would need more infrastructure, and Phaser reuse would be harder. A class/repository hierarchy was also rejected because it adds abstraction without multiple implementations.

Phase 3A extends this separation: `WorldScene` coordinates Phaser lifecycle and collisions, `PlayerController` translates keyboard/touch commands into movement, `EnemySystem` owns patrol and teardown, `RunState` owns deterministic score/lives/timer rules, and the Emerald Jungle layout is configuration data. React does not import these internal systems; it dynamically loads only the game factory.

**Remaining:** Worlds 2 and 3 must supply configuration, and authoritative run evidence must be designed before leaderboard score submission is connected.

## 2. Event-driven programming and handlers

**Implemented files:** `components/screens/splash-screen.js`, `components/overlays/game-overlay.js`, auth forms, `components/worlds/use-guest-world-progress.js`, `game/core/events.js`, `game/core/game-bridge.js`, `components/game/game-screen.js`, `components/game/mobile-controls.js`, `game/scenes/world-scene.js`, `game/systems/player-controller.js`, and their tests.

**Evidence and justification:** submit/click/change handlers perform one UI responsibility and call narrow helpers. Timers, Escape listeners, animation frames, and storage listeners are removed during cleanup. The storage subscription filters unrelated keys and exposes derived map state rather than raw events. `game/core/events.js` defines serialisable React/Phaser event names so neither side needs the other's internal objects.

**Alternative:** a global event bus for every UI action would reduce prop callbacks but obscure control flow and listener ownership. Directly passing Phaser scenes into React would be convenient but couple two lifecycles and make teardown/testing fragile.

Phase 3A now implements the bridge. React publishes small command payloads; Phaser collision, overlap, timer, and lifecycle handlers publish serialisable state or terminal events. Every `on` call returns an unsubscribe function; `GameScreen`, `PlayerController`, `WorldScene`, and the Phaser game all release listeners/resources during cleanup. `RunState` ignores mutations outside the running state, preventing duplicate completion or Game Over transitions.

**Remaining:** fish power-up/projectile and checkpoint challenge events are **planned**, not claimed as implemented.

## 3. Third-party interoperability

**Implemented files:** `lib/fish/fish-service.js`, `tests/fish-service.test.js`, `lib/supabase/*`, auth/progress/run Route Handlers, and the SQL migration.

**Evidence and justification:** the Fish adapter is an anti-corruption layer: it owns URL construction, timeout, text parsing for the provider's inaccurate content type, schema/image validation, and stable errors. It accepts injected fetch for isolated tests, and React never imports the upstream `{ question, fish, chest }` response. Supabase transport/cookies are similarly isolated; UI calls stable application routes/models instead of Auth or PostgREST response shapes.

**Alternative:** React could call Fish/Supabase directly. That would reduce server code, but expose Fish solutions, spread third-party formats through UI, weaken identity checks, and make provider outages screen concerns. A generic integration framework was rejected as unnecessary for two explicit adapters.

**Remaining:** Fish attempt storage, answer verification, achievements, and revive routes/UI are **planned**. The optional service must never block normal progression. Live Supabase interoperability also requires the owner's environment configuration.

## 4. Virtual identity, cookies, and authorization

**Implemented files:** `proxy.js`, `lib/supabase/proxy.js`, `lib/auth/session.js`, `lib/auth/redirects.js`, `app/api/auth/*`, `app/auth/callback/route.js`, `app/auth/confirm/route.js`, `components/profile/profile-panel.js`, `.env.example`, and `supabase/migrations/202611050001_phase_2b_auth_and_progress.sql`.

**Evidence and justification:** `@supabase/ssr` refreshes cookie sessions at the Next.js proxy boundary; protected routes call `getClaims()` and use the verified `sub`, never a submitted user ID. OAuth uses PKCE code exchange, email confirmation exchanges a short-lived token hash with `verifyOtp`, and both use allow-listed local return paths. Public and secret keys have separate factories. RLS limits private selects/updates to `auth.uid()`, while direct progression/run writes are revoked. The RLS-bypassing service role has explicit operation-level grants only for current server work and no unused achievement/sequence access. Trusted mutations are atomic functions reached only after server identity and input checks; leaderboard insertion additionally requires an owned, single-use run, World 3 declaration, and persistent completion of all three worlds. Logout remains inside the authenticated profile panel. Guests use separate versioned local data and cannot submit leaderboard runs.

**Alternative:** custom password hashes/session tables provide control but add credential, recovery, OAuth, rotation, and cookie-security responsibilities. Client-only local-storage tokens are simpler but script-readable and unsuitable as a server authorization source. Supabase SSR plus RLS was selected for managed identity and layered authorization.

**Remaining and limitations:** email delivery, Google consent, live cookie refresh, and RLS cross-user denial require a configured Supabase project. The in-memory request guard is a best-effort application layer; distributed production limits must use Supabase/platform controls. Score values still originate in client-side Phaser and therefore cannot be fully cheat-proof. Phase 3 must provide trusted gameplay evidence or a server-recomputable score; current checks validate identity, ownership, bounds, progression, World 3 completion, and one-time submission without claiming authoritative scoring.

Phase 3A authenticated World 1 completion calls `/api/progress` without submitting a leaderboard score; the Route Handler still derives identity from verified claims. Guest completion uses only the versioned local-progress service. This preserves the identity boundary while the later authoritative score design remains explicitly unfinished.
