# Supabase setup

Complete these steps in order. Do not paste a database password or Supabase secret key into chat. Store application values only in the ignored `.env.local` file.

## 1. Create the project

1. Open [Supabase Dashboard](https://supabase.com/dashboard) and select **New project**.
2. Choose an organisation, enter `TreasureHunt`, generate a strong database password, choose the nearest region, and create the project.
3. Save the database password in a password manager. The application does not put it in `.env.local`.

## 2. Apply the database migration

1. In the project dashboard open **SQL Editor** > **New query**.
2. Copy the complete contents of `supabase/migrations/202611050001_create_auth_profiles_progress_and_runs.sql`, paste it into the editor, and select **Run** once.
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

## Migration inventory

Migrations are ordered by their unchanged 12-digit version prefix. Historical files were applied manually through SQL Editor, so their local applied state cannot be inferred from Supabase CLI history in this checkout. The final treasure-achievement migration is pending until explicitly run.

| Migration | Purpose and affected objects | Depends on | Status known locally |
| --- | --- | --- | --- |
| `202611050001_create_auth_profiles_progress_and_runs.sql` | Creates profiles, progress, achievements, runs, leaderboard, signup/update triggers, RLS, grants and trusted RPCs. | Supabase Auth schema | Historical; documented as manually applied |
| `202611100001_add_fish_revival_challenges.sql` | Adds owner-bound Fish challenge storage, indexes, RLS and atomic verification. | Base schema | Historical; committed |
| `202611100002_add_verified_run_events_achievements_and_rankings.sql` | Adds verified run evidence, cumulative gem/fish totals, achievements and ranked completion RPCs. | Base schema | Historical; committed |
| `202611100003_enforce_run_submission_expiry.sql` | Adds the 30-minute submission-window trigger. | Game runs | Historical; committed |
| `202611100004_use_current_profile_names_in_leaderboard.sql` | Makes leaderboard reads resolve current profile usernames. | Ranked leaderboard RPC | Historical; committed |
| `202611100005_make_run_completion_idempotent.sql` | Makes verified completion and leaderboard persistence safe on retries. | Verified run events | Historical; committed |
| `202611180001_add_treasure_achievement_milestones.sql` | Adds 10/20-gem and 50-coin awards plus idempotent backfill. | Verified events and idempotent completion | Pending unless separately applied |

Only descriptive suffixes were improved; version prefixes and historical SQL behavior were retained. Do not run migration repair or reset against the hosted project.

## Inspect registered sessions safely

Supabase Auth owns `auth.users`, `auth.sessions`, and `auth.refresh_tokens`; do not duplicate them in `public`. In **SQL Editor**, run read-only metadata queries without selecting token columns:

```sql
select count(*) as user_count from auth.users;
select count(*) as session_row_count from auth.sessions;
select count(*) as refresh_token_row_count from auth.refresh_tokens;

select id, user_id, created_at, updated_at, not_after,
       case when not_after is null then null else not_after > now() end as before_not_after
from auth.sessions
order by created_at desc
limit 25;
```

A session row is historical server metadata, not proof that a browser currently has a valid unexpired JWT. Never select, copy, log, or expose refresh-token values. Use **Authentication > Users** for safe user inspection and the SQL Editor only with an administrator account.
