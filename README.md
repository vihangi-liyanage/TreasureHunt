# TreasureHunt

A cinematic three-world 2D web platformer built with Next.js, React, Phaser 3, Tailwind CSS, Supabase, and Vitest.

## Local setup

1. Install dependencies with `npm install`.
2. Follow `docs/SUPABASE_SETUP.md` to create the Supabase project, apply the migration, and configure email and Google authentication.
3. Copy `.env.example` to `.env.local` and add values from your own Supabase project. Never commit this file or paste its secrets into chat.
4. Run `npm run dev` and open `http://localhost:3000`.

The fullscreen Welcome screen is the main game menu. **Play as Guest** opens the World Map with separate local-browser progression. Email/password and Google sign-in use real Supabase sessions once the project is configured; authenticated profile, progress, runs, and leaderboard data use PostgreSQL with Row Level Security.

Guests cannot submit scores and receive a sign-in prompt when they open the leaderboard. Phase 3 will connect the existing trusted progress/run endpoints to Phaser gameplay; no fake gameplay completion is exposed in the UI.

Quality checks: `npm test`, `npm run lint`, and `npm run build`.

Project rules and phase decisions live in `AGENTS.md` and `docs/`.
