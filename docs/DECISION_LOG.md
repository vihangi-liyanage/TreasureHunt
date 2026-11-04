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
