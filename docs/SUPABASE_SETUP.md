# Supabase setup

Complete these steps in order. Do not paste a database password or Supabase secret key into chat. Store application values only in the ignored `.env.local` file.

## 1. Create the project

1. Open [Supabase Dashboard](https://supabase.com/dashboard) and select **New project**.
2. Choose an organisation, enter `TreasureHunt`, generate a strong database password, choose the nearest region, and create the project.
3. Save the database password in a password manager. The application does not put it in `.env.local`.

## 2. Apply the database migration

1. In the project dashboard open **SQL Editor** > **New query**.
2. Copy the complete contents of `supabase/migrations/202611050001_phase_2b_auth_and_progress.sql`, paste it into the editor, and select **Run** once.
3. Open **Table Editor** and confirm `profiles`, `player_progress`, `achievements`, `game_runs`, and `leaderboard_entries` exist.
4. Open **Authentication** > **Policies** and confirm Row Level Security is enabled for all five tables.

Do not run files in `supabase/tests/` against production. They create temporary test identities and are intended for a disposable local Supabase database.

## 3. Configure email/password authentication

1. Open **Authentication** > **Sign In / Providers** > **Email**.
2. Keep the Email provider enabled.
3. Enable new-user signup.
4. Disable **Confirm email** so `signUp()` immediately returns the authenticated session used by the assignment flow.
5. Disable the Google provider if it was previously enabled. The application exposes no OAuth route or button.

## 4. Add local environment values

1. In Supabase open **Project Settings** > **API Keys** (or the project's **Connect** dialog if the dashboard labels differ).
2. Copy the project URL and publishable key. Copy the server secret key for server-side trusted operations.
3. Copy `.env.example` to `.env.local` and replace only these placeholders:

```text
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT-REF.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR-PUBLISHABLE-KEY
SUPABASE_SECRET_KEY=YOUR-SERVER-SECRET-KEY
```

The secret key must never use a `NEXT_PUBLIC_` name, enter a client component, or be committed. Restart `npm run dev` after changing environment variables.

## 5. Configure limits and verify

1. Open **Authentication** > **Rate Limits** and review email, token refresh, verification, and anonymous sign-in limits for the expected assessment traffic.
2. Run `npm run dev` and verify: immediate registration, invalid password, email/password login, refresh persistence, profile rename, logout, guest map access, and the guest leaderboard sign-in prompt.
3. Use two confirmed accounts to verify one account cannot read/update the other's private rows. For automated RLS tests, install the Supabase CLI and run the SQL tests only against a disposable local database.

Official references: [Supabase SSR client setup](https://supabase.com/docs/guides/auth/server-side/creating-a-client?framework=nextjs&queryGroups=framework), [password authentication](https://supabase.com/docs/guides/auth/passwords), [Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security), and [Auth rate limits](https://supabase.com/docs/guides/auth/rate-limits).
