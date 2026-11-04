# TreasureHunt

A cinematic three-world 2D web platformer built with Next.js, React, Phaser 3, Tailwind CSS, Supabase, and Vitest.

## Local setup

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env.local` and add Supabase values when authentication work begins. The Phase 0 page does not require secrets.
3. Run `npm run dev` and open `http://localhost:3000`.

The fullscreen Welcome screen is the main game menu. Choose **Play as Guest** to open the World Map with local browser progression, or use **Player Login** to review the Phase 2B authentication form without creating a fake session.

Quality checks: `npm test`, `npm run lint`, and `npm run build`.

Project rules and phase decisions live in `AGENTS.md` and `docs/`.
