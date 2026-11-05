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

The migration creates `profiles`, `player_progress`, `achievements`, `game_runs`, and a denormalised safe `leaderboard_entries` projection. RLS restricts private rows to `auth.uid()`. Direct player writes to progression, achievements, and runs are revoked. Server Route Handlers validate bounds and call service-role-only database functions for sequential world completion and single-use run submission. The secret key never enters a client bundle.

Guest progress remains versioned local storage and is disabled by the World Map hook for authenticated players. Guests cannot read or submit leaderboard data. The UI consumes stable profile/progress/leaderboard shapes from `lib/data/player-repository.js`, not database internals.

Fully authoritative score validation is impossible while Phaser executes in the browser. The design reduces casual tampering through server-issued run IDs, bounds, unlocked-world checks, atomic one-time submission, and rate limits; Phase 3 must connect actual game events before score submission is considered complete.

## Phase 2A interface boundary

App Router pages compose reusable presentation components from `components/ui`, `components/auth`, `components/overlays`, and `components/worlds`. Pure form rules live in `lib/validation` so validation is testable without coupling it to Supabase. Login and registration stop after local validation and state clearly that no request or account mutation occurred.

Welcome is the single main menu. Settings and About use accessible in-place dialogs instead of separate information pages. Guest play opens the World Map directly and reads sequential completion state through `lib/progress/guest-progress.js`; Phase 3 gameplay will call its completion function. Authenticated persistence remains behind the future Phase 2B session boundary.

The World Map delegates browser storage subscription and cleanup to `components/worlds/use-guest-world-progress.js`. This keeps the persistence event lifecycle out of the visual map component while retaining the pure progression rules in `lib/progress/guest-progress.js`.

## Implementation status

- **Implemented:** focused App Router screens, real Supabase auth Route Handlers, SSR cookie refresh, PKCE callback, logout/profile controls, pure validation, separate guest/auth progress, RLS migration, trusted progression/run endpoints, Fish response normalization, and React/browser cleanup.
- **Configuration-dependent:** email delivery, Google consent, live cookie persistence, and deployed RLS behaviour require the owner's Supabase/Google project and are not claimed as locally integrated.
- **Planned for Phase 3+:** Phaser scenes and bridge implementation, trusted gameplay event connection to progress/run routes, Fish challenge attempt records/routes/UI, and achievement awarding.
