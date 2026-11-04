# TreasureHunt

A cinematic three-world 2D web platformer built with Next.js, React, Phaser 3, Tailwind CSS, Supabase, and Vitest.

## Local setup

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env.local` and add Supabase values when authentication work begins. The Phase 0 page does not require secrets.
3. Run `npm run dev` and open `http://localhost:3000`.

In development, the Welcome screen includes **Preview adventure UI**, which opens the temporary Main Menu and World Selection review flow. That preview is intentionally unavailable in production; Phase 2 will replace it with authenticated access.

Quality checks: `npm test`, `npm run lint`, and `npm run build`.

Project rules and phase decisions live in `AGENTS.md` and `docs/`.
