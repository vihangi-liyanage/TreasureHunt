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

## D011 Isolate browser progression synchronization

**Decision:** Keep pure progression and storage serialization in `lib/progress/guest-progress.js`, and move the browser `storage` subscription into a focused World Map hook.

**Reason:** The map should render journey state without owning persistence-event lifecycle details. The hook supplies a small `{ states, journeyProgress }` interface and cleans up its listener independently.

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

## D016 Explicit least-privilege service grants

**Decision:** With automatic table exposure disabled, revoke broad `service_role` access on Phase 2B tables and grant only the operations required by current server routes and invoker functions. Do not grant the unused achievements identity sequence. Accept completed leaderboard rows only when the owned run declares World 3 and persistent progression already confirms all three worlds complete.

**Reason:** The service key bypasses RLS, so its SQL privileges must remain narrow. Database invariants provide a second check behind server-side claims verification, while unused achievement access can be added later with the feature that needs it.

## D017 Build World 1 with procedural temporary art and focused Phaser systems

**Decision:** Render original temporary sprites and jungle layers at runtime, drive one reusable `WorldScene` from level configuration, and cross the React boundary only through serialisable bridge events.

**Reason:** This produces a polished playable demonstration without unlicensed assets, keeps art replacement independent of mechanics, and prevents Phaser objects, React state, and persistence services from becoming coupled.
