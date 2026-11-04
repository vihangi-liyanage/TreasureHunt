# TreasureHunt Project Instructions

## Authority and scope

- The current user brief is the source of truth. Older material in `documents/` is historical context only.
- Use JavaScript, Next.js App Router, React, Phaser 3, Tailwind CSS, Supabase PostgreSQL/Auth, `@supabase/ssr`, Route Handlers, Vitest, Vercel, and Git.
- Do not introduce Neon, Auth.js, Prisma, Firebase, Express, or Redux.

## Architecture rules

- Keep Phaser/gameplay code independent from React screens, Supabase persistence, and the Fish API.
- Put reusable level differences in world configuration rather than separate copied scenes.
- Prefer small explicit contracts and event payloads over shared mutable state.
- External services must be called through server-side adapters. Never trust client-supplied user IDs, scores, checkpoint state, or challenge solutions.
- The Fish API is optional: outages must never block world progression or treasure collection.
- Preserve the fixed rules: 3 starting lives; world timers of 120, 105, and 90 seconds; checkpoints after Worlds 1 and 2; treasure completes World 3; fish power-up enables shooting for 8 seconds; at most one Fish API revive per run.

## Quality and delivery

- Use original or properly licensed art/audio. Treat supplied images as references only; do not copy recognizable characters or designs.
- Record third-party asset source and license before adding it. Temporary assets must be clearly identified.
- Add or update tests for deterministic game rules and service adapters.
- Before a phase handoff run `npm test`, `npm run lint`, and `npm run build`.
- Do not commit secrets. Keep public examples in `.env.example` and real values in ignored local environment files.
- Keep documentation concise and update the decision log only for decisions that affect later work.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
