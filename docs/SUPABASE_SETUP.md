# Supabase setup

Complete these steps in order. Do not paste a database password, Google client secret, or Supabase secret key into chat. Store application values only in the ignored `.env.local` file.

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

## 3. Configure application URLs and email

1. Open **Authentication** > **URL Configuration**.
2. Set **Site URL** to `http://localhost:3000` during local development.
3. Add `http://localhost:3000/auth/callback` to **Redirect URLs**. Later add `https://YOUR-VERCEL-DOMAIN/auth/callback` before deployment.
4. Open **Authentication** > **Providers** > **Email**. Keep Email enabled and keep **Confirm email** enabled for production-style testing.
5. Open **Authentication** > **Email Templates** > **Confirm signup**. Change the link target to:

```html
<a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email&next=/worlds">Confirm email address</a>
```

6. Supabase's default mail service is suitable only for limited testing; configure custom SMTP before production.

## 4. Add local environment values

1. In Supabase open **Project Settings** > **API Keys** (or the project's **Connect** dialog if the dashboard labels differ).
2. Copy the project URL and publishable key. Copy the server secret key for server-side trusted operations.
3. Copy `.env.example` to `.env.local` and replace only these placeholders:

```text
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT-REF.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR-PUBLISHABLE-KEY
NEXT_PUBLIC_SITE_URL=http://localhost:3000
SUPABASE_SECRET_KEY=YOUR-SERVER-SECRET-KEY
```

The secret key must never use a `NEXT_PUBLIC_` name, enter a client component, or be committed. Restart `npm run dev` after changing environment variables.

## 5. Configure Google OAuth

1. Open [Google Cloud Console](https://console.cloud.google.com/), create or select a project, then open **Google Auth Platform**.
2. Configure **Branding** and **Audience**. For an External testing app, add your Google account as a test user.
3. Open **Clients** > **Create client** > **Web application**.
4. Add `https://YOUR-PROJECT-REF.supabase.co/auth/v1/callback` as an **Authorized redirect URI**. This is Google's callback to Supabase, not the Next.js callback.
5. Copy the Google client ID and client secret into **Supabase Dashboard** > **Authentication** > **Providers** > **Google**, enable the provider, and save. Do not put the Google secret in `.env.local`.
6. Supabase then returns the browser to the allowed Next.js `/auth/callback`, where the application exchanges the PKCE code for the cookie session.

## 6. Configure limits and verify

1. Open **Authentication** > **Rate Limits** and review email, token refresh, verification, and anonymous sign-in limits for the expected assessment traffic.
2. Run `npm run dev` and verify: registration email confirmation, invalid password, email login, Google login, refresh persistence, profile rename, logout, guest map access, and the guest leaderboard sign-in prompt.
3. Use two confirmed accounts to verify one account cannot read/update the other's private rows. For automated RLS tests, install the Supabase CLI and run the SQL tests only against a disposable local database.

Official references: [Supabase SSR client setup](https://supabase.com/docs/guides/auth/server-side/creating-a-client?framework=nextjs&queryGroups=framework), [Google OAuth with PKCE](https://supabase.com/docs/guides/auth/social-login/auth-google?environment=server&platform=web), [Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security), and [Auth rate limits](https://supabase.com/docs/guides/auth/rate-limits).
