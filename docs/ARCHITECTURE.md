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

The meaning and permitted ranges of `fish` and `chest` are not specified on the documentation page. The adapter therefore preserves them as validated non-negative integers without inventing additional semantics. Gameplay integration will be confirmed against the provider’s example UI before the challenge screen is finalized. Server requests will use an abort timeout, validate image origins/data, avoid logging solutions, and degrade to a skippable unavailable state.

## Security and persistence direction

`@supabase/ssr` will read and refresh HttpOnly cookie sessions through the Next.js server boundary. Route Handlers derive identity from the session rather than request bodies. RLS provides a second authorisation layer. Completed score submissions require a server-issued run ID, valid progression, bounds checks, single completion, and rate limits; fully authoritative anti-cheat is outside a client-side platformer’s scope and will be documented honestly.

## Phase 1 interface boundary

App Router pages compose reusable presentation components from `components/ui`, `components/auth`, `components/menu`, and `components/worlds`. Pure form rules live in `lib/validation` so validation is testable without coupling it to Supabase. Login and registration stop after local validation and state clearly that no request or account mutation occurred.

The temporary menu and world-selection review flow is development-only. `requireDevelopmentPreview()` returns a Next.js 404 whenever `NODE_ENV` is not `development`; the production welcome screen routes players to login instead. Phase 2 will replace this preview boundary with authenticated server-side access checks rather than reusing it as an auth bypass.
