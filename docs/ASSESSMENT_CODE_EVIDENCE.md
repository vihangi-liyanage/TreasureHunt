# Assessment Code Evidence

This guide maps the current TreasureHunt source to the four assessment themes. It separates evidence that can be demonstrated now from work reserved for later phases; planned architecture is not presented as finished code.

## 1. Software design principles

### Implemented evidence

- `app/` contains thin App Router pages that compose screens instead of owning domain rules.
- `components/auth/`, `components/overlays/`, `components/settings/`, and `components/worlds/` group focused presentation responsibilities. `components/worlds/use-guest-world-progress.js` owns browser storage-event synchronization so `world-map.js` can focus on map state and rendering.
- `lib/validation/auth.js` contains pure form rules; forms call it through a small values/errors contract and do not know Supabase details.
- `game/config/worlds.js` is the single source for the three worlds and fixed run rules. The UI receives world configuration as data rather than copying it into three screen implementations.
- `lib/progress/guest-progress.js` owns sequential guest-progression rules and storage serialization. Its functions accept a storage object, so the rules can be tested without a browser.

**Why this approach:** feature-focused components and small service boundaries give each module a clear reason to change. Configuration and pure rules remain reusable by the future Phaser scene, React UI, and tests without those consumers depending on one another.

**Alternative and trade-off:** a single page component could own validation, local storage, and screen rendering. It would initially use fewer files, but UI changes would risk progression and validation code, and isolated tests would be harder. A deeper repository/service-class hierarchy would add interfaces but is premature while persistence and gameplay are not implemented.

### Planned work

Phaser entities, systems, a run state machine, persistence repositories, and authenticated route handlers do not exist yet. They must preserve the current direction: game rules in `game/`, orchestration at Route Handlers, and Supabase details behind `lib/supabase/` or focused repositories.

## 2. Event-driven programming

### Implemented evidence

- `components/screens/splash-screen.js` reacts to image load/error events and timers, then cancels its transition timer when unmounted.
- Welcome, forms, overlays, settings, and the World Map use focused React handlers for click, submit, change, keyboard, and storage events.
- `components/overlays/game-overlay.js` adds an Escape handler only while open and removes it on close/unmount.
- `components/worlds/use-guest-world-progress.js` subscribes to the browser `storage` event and removes the listener and initial animation frame during cleanup. `tests/guest-progress-subscription.test.js` verifies synchronization, event filtering, and teardown with injected browser boundaries.
- `game/core/events.js` defines the intended serialisable gameplay event names. These constants are a contract only; no Phaser gameplay event publisher or React bridge is implemented yet.

**Why this approach:** local UI interactions use callbacks and component state because their ownership is clear. Cross-boundary gameplay events will use small serialisable payloads, allowing Phaser to publish outcomes without importing React components.

**Alternative and trade-off:** a global event bus for all UI actions would reduce some prop callbacks, but it would hide control flow and make listener lifetime bugs more likely. Direct React access to Phaser scenes would be simpler for one screen, but would tightly couple rendering lifecycles to game objects.

### Planned work

Phase 3 must implement the bridge, event payload validation, listener teardown on scene shutdown, and a run state machine that prevents duplicate world-complete and game-over transitions. Tests must prove those behaviours; the event-name constants alone are not proof of a working gameplay event system.

## 3. Interoperability

### Implemented evidence

- `lib/fish/fish-service.js` is the only Fish API adapter. It builds the verified HTTPS query, applies a timeout, disables caching, parses response text despite the inaccurate upstream content type, and normalises the response.
- The adapter validates the observed `{ question, fish, chest }` contract, accepts verified PNG URL/base64 encodings, restricts remote images to the observed HTTPS provider path, and converts transport/HTTP/JSON/schema failures into stable `FishServiceError` codes.
- `requestFishChallenge` accepts a `fetchImpl`, making network behaviour independently testable in `tests/fish-service.test.js`.
- No React component imports Fish response fields, and no fake challenge response is used.

**Why this approach:** an anti-corruption adapter prevents an unstable third-party schema and unusual headers from spreading through the application. The future Route Handler can return an application DTO without exposing solution fields to the browser.

**Alternative and trade-off:** calling the Fish endpoint directly from React would require less server code, but would expose solutions, couple UI to upstream fields, and make outages/CORS behaviour part of every screen. A generic API-client framework would add dependency weight without improving this single, small contract.

### Planned work

There is not yet a Fish Route Handler, server-side attempt record, answer-verification transaction, challenge UI, achievement, or revive flow. Later work must store solutions server-side with expiry and single-use metadata, return only a local challenge ID plus image, and keep failures optional to progression. If the verified image host changes, it must be re-verified before updating the allow-list.

## 4. Virtual identity

### Implemented evidence

- `lib/supabase/client.js` creates the browser client from browser-safe `NEXT_PUBLIC_` values.
- `lib/supabase/server.js` creates the SSR server client through the Next.js cookie store and keeps session-cookie handling outside UI components.
- `.env.example` documents only the public project URL/publishable key and server-only Fish configuration. Real environment files and secrets remain ignored.
- Login and registration currently perform client-side validation only. Their Google and submit actions explicitly state that no request, account, or session was created.

**Why this approach:** Supabase Auth supplies the external identity mechanism while `@supabase/ssr` supports cookie-backed server rendering. Server routes will derive the user from the verified session rather than trusting user IDs submitted by the browser; PostgreSQL Row Level Security provides a second authorization boundary.

**Alternative and trade-off:** custom password hashing and a bespoke session-cookie table would offer maximum control, but would substantially increase responsibility for credential storage, rotation, OAuth, recovery, and cookie security. A client-only token in local storage would be simpler but is more exposed to script access and is unsuitable as the server authorization source.

### Planned Phase 2B security work

- Configure email/password and Google providers, allowed redirect URLs, and a callback that exchanges the OAuth code securely.
- Add the Next.js session-refresh proxy/middleware path required by the installed Supabase SSR version.
- Verify identity on the server with a trusted claims/user call; never authorize from form data or client-supplied IDs.
- Add logout, protected-route checks, safe return URLs, generic authentication errors, and appropriate rate limiting.
- Create profile/progression tables with least-privilege RLS policies and test cross-user denial. Keep any service-role key server-only and out of ordinary user flows.
- Define secure cookie behaviour, account recovery/email verification, and atomic score/checkpoint mutations before persistence is enabled.

