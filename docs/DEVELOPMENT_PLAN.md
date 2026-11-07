# TreasureHunt Development Plan

## Phase sequence

1. **Foundation** - verified Next.js/React/Tailwind/Vitest scaffold, core boundaries, world configuration, environment contract, Fish API research, and CI-ready commands.
2. **Playable core** - Phaser scene, explorer movement, platforms, camera, coins, enemies, hazards, lives, timers, pause, power-up, projectiles, and unit-tested rule systems using temporary original assets.
3. **Three worlds** - data-driven Emerald Jungle, Sunset Ruins, and Crystal Cavern; checkpoints, treasure completion, transitions, audio hooks, and balancing.
4. **Identity and data** - Supabase schema/RLS, email login/register, SSR cookie sessions, profile, checkpoint persistence, protected runs, and leaderboard.
5. **Fish interoperability** - server adapter, challenge persistence, answer endpoint, optional achievements, one-revive enforcement, timeouts, failures, and mocked plus live contract checks.
6. **Presentation and release** - all required screens, original/licensed asset pass, accessibility, responsive polish, security review, browser tests, Vercel configuration, and demonstration evidence.

## Definition of done for every phase

- Scope works without secrets where a fallback is expected.
- Game rules stay independent of React, Supabase, and upstream payloads.
- New deterministic behaviour has Vitest coverage; external calls have mocked failure/invalid/timeout cases.
- Asset additions include source and license records.
- `npm test`, `npm run lint`, and `npm run build` pass before commit.
- Significant tradeoffs are added to `DECISION_LOG.md` without duplicating the full specification.

## Current verified status

- **Phase 3A complete:** reusable playable Emerald Jungle foundation, physics, HUD, progression bridge and responsive controls.
- **Phase 3B complete:** painted original gameplay assets, tuned/reachability-tested movement, multi-touch input, local eight-second fish power, magical projectiles, projectile enemy defeat, active-clock pause/restart safety, full-viewport desktop/mobile polish and real World 1 checkpoint completion.
- **Post-3B corrections complete:** measured sprite/terrain grounding, descending-only platform contact and fresh run construction are regression-tested. Guest unlocks now last only for one active adventure; registered Supabase progression remains persistent and separate.
- **Phase 4 complete:** the reusable scene now loads per-world art and presentation metadata; Sunset Ruins supplies a tested 105-second route, distinct enemies/hazards, reachable coins/fish, checkpoint completion and World 3 unlocking. Registration now replaces the form with a compact email-confirmation state and clears password fields.
- **Phase 4 physics correction:** terrain presentation uses measured cropped atlas bounds, painted surfaces align with real static bodies, both worlds have unsupported but reachable ground gaps, enemy patrol endpoints remain supported, and fall respawn atomically resets the Arcade body.
- **Phase 4 navigation correction:** the World Map prefetches only the selected playable route, Phaser chunk and required world textures; normal cached launches suppress the transient loading overlay while real slow/error paths remain visible and retryable.
- **Phase 5 complete:** Crystal Cavern is a real 90-second final level in the shared scene, with original crystal art, reachable separated terrain, harder enemies/hazards, local fish combat, a genuine treasure overlap and one guarded Mission Complete transition. TypeScript 6 alias diagnostics are clean without `baseUrl` suppression.
- **Phase 6 complete:** World 1 has a real pre-boot field briefing; pause resumes through a guarded 3–2–1–GO sequence; checkpoints expose persistence-gated next-world navigation; About reuses the actual control guide; authenticated profiles show saved progress and real achievement rows; leaderboard and modal accessibility states are refined.
- **Phase 6 final correction:** countdown now overlays the live canvas without a card, Crystal Cavern uses a tested aspect-preserving crop, and the leaderboard audit confirms that saved progress is not a ranked run. The configured project currently has no issued/submitted runs, so its empty ranking is accurate.
- **Phase 6 final refinement:** auth forms and the World 1 briefing are compact and accessible; World 1/2 checkpoints are presented as Compass Shrines without changing persistence semantics; all levels have longer tested routes, 40/41/45 coins, three fish pickups, progressive enemy/hazard pressure and motion-aware completion effects.
- **Next gameplay work:** production audio hooks and optional external Fish challenge/revive UI. Authoritative server-recomputable score evidence remains future security work before leaderboard scores can be called cheat-proof.
