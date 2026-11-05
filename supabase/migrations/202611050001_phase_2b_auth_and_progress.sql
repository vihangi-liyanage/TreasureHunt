create extension if not exists pgcrypto;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null check (char_length(username) between 3 and 24 and username ~ '^[A-Za-z0-9_-]+$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index profiles_username_lower_key on public.profiles (lower(username));

create table public.player_progress (
  user_id uuid primary key references auth.users(id) on delete cascade,
  completed_worlds smallint not null default 0 check (completed_worlds between 0 and 3),
  current_world smallint not null default 1 check (current_world between 1 and 3),
  checkpoint_world smallint not null default 1 check (checkpoint_world between 1 and 3),
  total_coins bigint not null default 0 check (total_coins >= 0),
  updated_at timestamptz not null default now()
);

create table public.achievements (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  achievement_key text not null check (char_length(achievement_key) between 2 and 80),
  metadata jsonb not null default '{}'::jsonb,
  earned_at timestamptz not null default now(),
  unique (user_id, achievement_key)
);

create table public.game_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  score bigint check (score is null or score between 0 and 100000000),
  coins integer check (coins is null or coins between 0 and 1000000),
  world_reached smallint check (world_reached is null or world_reached between 1 and 3),
  duration_seconds integer check (duration_seconds is null or duration_seconds between 1 and 86400),
  completed boolean not null default false,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  submitted_at timestamptz
);

create index game_runs_user_started_idx on public.game_runs (user_id, started_at desc);

create table public.leaderboard_entries (
  run_id uuid primary key references public.game_runs(id) on delete cascade,
  username text not null,
  score bigint not null check (score between 0 and 100000000),
  coins integer not null check (coins between 0 and 1000000),
  world_reached smallint not null check (world_reached between 1 and 3),
  duration_seconds integer not null check (duration_seconds between 1 and 86400),
  completed_at timestamptz not null
);

create index leaderboard_score_idx
  on public.leaderboard_entries (score desc, duration_seconds asc, completed_at asc);

alter table public.profiles enable row level security;
alter table public.player_progress enable row level security;
alter table public.achievements enable row level security;
alter table public.game_runs enable row level security;
alter table public.leaderboard_entries enable row level security;

revoke all on public.profiles from anon, authenticated;
revoke all on public.player_progress from anon, authenticated;
revoke all on public.achievements from anon, authenticated;
revoke all on public.game_runs from anon, authenticated;
revoke all on public.leaderboard_entries from anon, authenticated;

-- This project does not auto-grant new public tables. Give the server role only
-- the operations used by the current Route Handlers and invoker functions.
revoke all on public.profiles from service_role;
revoke all on public.player_progress from service_role;
revoke all on public.achievements from service_role;
revoke all on public.game_runs from service_role;
revoke all on public.leaderboard_entries from service_role;
revoke all on sequence public.achievements_id_seq from anon, authenticated, service_role;

grant usage on schema public to service_role;
grant select on public.profiles to service_role;
grant select, update on public.player_progress to service_role;
grant select, insert, update on public.game_runs to service_role;
grant insert on public.leaderboard_entries to service_role;

grant select on public.profiles to authenticated;
grant update (username) on public.profiles to authenticated;
grant select on public.player_progress to authenticated;
grant select on public.achievements to authenticated;
grant select on public.game_runs to authenticated;
grant select on public.leaderboard_entries to authenticated;

create policy "players read own profile"
  on public.profiles for select to authenticated
  using ((select auth.uid()) is not null and (select auth.uid()) = id);

create policy "players update own profile"
  on public.profiles for update to authenticated
  using ((select auth.uid()) is not null and (select auth.uid()) = id)
  with check ((select auth.uid()) is not null and (select auth.uid()) = id);

create policy "players read own progress"
  on public.player_progress for select to authenticated
  using ((select auth.uid()) is not null and (select auth.uid()) = user_id);

create policy "players read own achievements"
  on public.achievements for select to authenticated
  using ((select auth.uid()) is not null and (select auth.uid()) = user_id);

create policy "players read own runs"
  on public.game_runs for select to authenticated
  using ((select auth.uid()) is not null and (select auth.uid()) = user_id);

create policy "signed-in players read leaderboard"
  on public.leaderboard_entries for select to authenticated
  using (true);

create or replace function private.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_touch_updated_at
before update on public.profiles
for each row execute function private.touch_updated_at();

create trigger progress_touch_updated_at
before update on public.player_progress
for each row execute function private.touch_updated_at();

revoke all on function private.touch_updated_at() from public, anon, authenticated, service_role;

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  requested_username text;
  provider_name text;
begin
  provider_name := coalesce(new.raw_app_meta_data ->> 'provider', 'email');
  requested_username := coalesce(
    nullif(new.raw_user_meta_data ->> 'username', ''),
    nullif(new.raw_user_meta_data ->> 'user_name', ''),
    nullif(new.raw_user_meta_data ->> 'name', ''),
    split_part(coalesce(new.email, ''), '@', 1),
    'Explorer'
  );
  requested_username := regexp_replace(requested_username, '[^A-Za-z0-9_-]', '', 'g');
  if char_length(requested_username) < 3 then requested_username := 'Explorer'; end if;
  requested_username := left(requested_username, 24);

  if provider_name <> 'email' or exists (
    select 1 from public.profiles where lower(username) = lower(requested_username)
  ) then
    requested_username := left(requested_username, 15) || '_' || substr(replace(new.id::text, '-', ''), 1, 8);
  end if;

  insert into public.profiles (id, username) values (new.id, requested_username);
  insert into public.player_progress (user_id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function private.handle_new_user();

revoke all on function private.handle_new_user() from public, anon, authenticated, service_role;

create or replace function public.username_exists_admin(p_username text)
returns boolean
language sql
stable
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where lower(username) = lower(trim(p_username))
  );
$$;

create or replace function public.complete_world_admin(
  p_user_id uuid,
  p_world smallint,
  p_coins bigint default 0
)
returns public.player_progress
language plpgsql
set search_path = ''
as $$
declare
  progress public.player_progress;
begin
  if p_world not between 1 and 3 or p_coins not between 0 and 1000000 then
    raise exception 'invalid world completion';
  end if;

  select * into progress
  from public.player_progress
  where user_id = p_user_id
  for update;

  if progress.user_id is null or p_world <> progress.completed_worlds + 1 then
    raise exception 'world completion is out of order';
  end if;

  update public.player_progress
  set completed_worlds = p_world,
      current_world = least(3, p_world + 1),
      checkpoint_world = case when p_world < 3 then p_world + 1 else checkpoint_world end,
      total_coins = total_coins + p_coins
  where user_id = p_user_id
  returning * into progress;

  return progress;
end;
$$;

create or replace function public.complete_game_run_admin(
  p_user_id uuid,
  p_run_id uuid,
  p_score bigint,
  p_coins integer,
  p_world_reached smallint,
  p_duration_seconds integer,
  p_completed boolean
)
returns public.game_runs
language plpgsql
set search_path = ''
as $$
declare
  run public.game_runs;
  progress public.player_progress;
  player_username text;
begin
  if p_score not between 0 and 100000000
     or p_coins not between 0 and 1000000
     or p_world_reached not between 1 and 3
     or p_duration_seconds not between 1 and 86400 then
    raise exception 'invalid run result';
  end if;

  select * into run
  from public.game_runs
  where id = p_run_id and user_id = p_user_id
  for update;

  if run.id is null or run.submitted_at is not null then
    raise exception 'run is missing or already submitted';
  end if;

  select * into progress from public.player_progress where user_id = p_user_id;
  if progress.user_id is null or p_world_reached > least(3, progress.completed_worlds + 1) then
    raise exception 'run exceeds unlocked progression';
  end if;

  if p_completed and (p_world_reached <> 3 or progress.completed_worlds <> 3) then
    raise exception 'completed leaderboard run requires a completed world 3 mission';
  end if;

  update public.game_runs
  set score = p_score,
      coins = p_coins,
      world_reached = p_world_reached,
      duration_seconds = p_duration_seconds,
      completed = p_completed,
      completed_at = case when p_completed then now() else null end,
      submitted_at = now()
  where id = p_run_id
  returning * into run;

  if p_completed then
    select username into player_username from public.profiles where id = p_user_id;
    insert into public.leaderboard_entries (
      run_id, username, score, coins, world_reached, duration_seconds, completed_at
    ) values (
      run.id, player_username, p_score, p_coins, p_world_reached, p_duration_seconds, run.completed_at
    );
  end if;

  return run;
end;
$$;

revoke execute on function public.complete_world_admin(uuid, smallint, bigint) from public, anon, authenticated;
revoke execute on function public.complete_game_run_admin(uuid, uuid, bigint, integer, smallint, integer, boolean) from public, anon, authenticated;
revoke execute on function public.username_exists_admin(text) from public, anon, authenticated;
grant execute on function public.complete_world_admin(uuid, smallint, bigint) to service_role;
grant execute on function public.complete_game_run_admin(uuid, uuid, bigint, integer, smallint, integer, boolean) to service_role;
grant execute on function public.username_exists_admin(text) to service_role;
