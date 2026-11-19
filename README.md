# TreasureHunt

A cinematic three-world 2D web platformer built with Next.js, React, Phaser 3, Tailwind CSS, Supabase, and Vitest.

## Local setup

1. Install dependencies with `npm install`.
2. Follow `docs/SUPABASE_SETUP.md` to create the Supabase project, apply the migrations, and configure email/password authentication.
3. Copy `.env.example` to `.env.local` and add values from your own Supabase project. Never commit this file or paste its secrets into chat.
4. Run `npm run dev` and open `http://localhost:3000`.

The fullscreen Welcome screen is the main game menu. **Play as Guest** opens the World Map with temporary in-memory progression, while registered explorers use Supabase-backed progression. Choose an unlocked world to play Emerald Jungle, Sunset Ruins, or Crystal Cavern. Use A/D or arrow keys to move, Space/Up to jump, F to shoot while powered, and Escape to pause; touch controls appear on smaller devices. Email/password sign-in uses Supabase sessions, and authenticated profile, progress, verified runs, achievements, and leaderboard data use PostgreSQL with Row Level Security.

Guests cannot submit ranked scores and receive a sign-in prompt when they open the leaderboard. The reusable Phaser scene drives all three configured worlds, including Fish power-up shooting, Compass Shrines, final treasure completion, and the optional Fish API revival challenge. Background music and gameplay effects use validated CC0 Freesound previews through the server-side audio catalogue.

Quality checks: `npm test`, `npm run lint`, `npm run build`, and `npm run verify:freesound` for the separate live integration check.

Project rules and phase decisions live in `AGENTS.md` and `docs/`.
