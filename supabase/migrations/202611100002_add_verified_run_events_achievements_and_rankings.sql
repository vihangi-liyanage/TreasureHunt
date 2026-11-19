alter table public.player_progress
  add column total_gems bigint not null default 0 check (total_gems >= 0),
  add column fish_powerups_collected bigint not null default 0 check (fish_powerups_collected >= 0);

alter table public.game_runs
  add column world_number smallint check (world_number between 1 and 3);

create table public.game_run_events (
  id bigint generated always as identity primary key,
  run_id uuid not null references public.game_runs(id) on delete cascade,
  event_type text not null check (event_type in ('coin', 'gem', 'fish', 'enemy', 'objective')),
  event_id text not null check (char_length(event_id) between 2 and 80),
  created_at timestamptz not null default now(),
  unique (run_id, event_type, event_id)
);

alter table public.game_run_events enable row level security;
revoke all on public.game_run_events from public, anon, authenticated, service_role;
revoke all on sequence public.game_run_events_id_seq from public, anon, authenticated, service_role;
grant select, insert on public.game_run_events to service_role;
grant usage, select on sequence public.game_run_events_id_seq to service_role;

alter table public.leaderboard_entries add column user_id uuid references auth.users(id) on delete cascade;
update public.leaderboard_entries entry
set user_id = run.user_id
from public.game_runs run
where run.id = entry.run_id;
alter table public.leaderboard_entries alter column user_id set not null;
create index leaderboard_user_best_idx
  on public.leaderboard_entries (user_id, score desc, duration_seconds asc, completed_at asc);

grant select, insert on public.achievements to service_role;
grant usage, select on sequence public.achievements_id_seq to service_role;
grant select on public.leaderboard_entries to service_role;
revoke select on public.leaderboard_entries from authenticated;
grant select (run_id, username, score, coins, world_reached, duration_seconds, completed_at)
  on public.leaderboard_entries to authenticated;

drop function public.complete_game_run_admin(uuid, uuid, bigint, integer, smallint, integer, boolean);

create or replace function public.start_game_run_admin(
  p_user_id uuid,
  p_world smallint
)
returns public.game_runs
language plpgsql
set search_path = ''
as $$
declare
  progress public.player_progress;
  run public.game_runs;
begin
  if p_world not between 1 and 3 then raise exception 'invalid world'; end if;

  select * into progress
  from public.player_progress
  where user_id = p_user_id
  for update;

  if progress.user_id is null or p_world > least(3, progress.completed_worlds + 1) then
    raise exception 'world is locked';
  end if;

  insert into public.game_runs (user_id, world_number)
  values (p_user_id, p_world)
  returning * into run;
  return run;
end;
$$;

create or replace function public.record_game_run_event_admin(
  p_user_id uuid,
  p_run_id uuid,
  p_world smallint,
  p_event_type text,
  p_event_id text
)
returns jsonb
language plpgsql
set search_path = ''
as $$
declare
  run public.game_runs;
  inserted_event_id bigint;
  inserted_count integer;
  progress public.player_progress;
  unlocked text[] := array[]::text[];
begin
  if p_world not between 1 and 3
     or p_event_type not in ('coin', 'gem', 'fish', 'enemy', 'objective')
     or char_length(p_event_id) not between 2 and 80 then
    raise exception 'invalid gameplay event';
  end if;

  select * into run
  from public.game_runs
  where id = p_run_id and user_id = p_user_id and world_number = p_world
  for update;

  if run.id is null or run.submitted_at is not null or run.started_at < now() - interval '30 minutes' then
    raise exception 'run is not active';
  end if;

  insert into public.game_run_events (run_id, event_type, event_id)
  values (run.id, p_event_type, p_event_id)
  on conflict (run_id, event_type, event_id) do nothing
  returning id into inserted_event_id;

  if inserted_event_id is null then
    return jsonb_build_object('recorded', false, 'unlockedAchievementKeys', unlocked);
  end if;

  if p_event_type = 'gem' then
    update public.player_progress
    set total_gems = total_gems + 1
    where user_id = p_user_id
    returning * into progress;

    if progress.total_gems = 1 then
      insert into public.achievements (user_id, achievement_key, metadata)
      values (p_user_id, 'first_gem', jsonb_build_object('totalGems', progress.total_gems))
      on conflict (user_id, achievement_key) do nothing;
      get diagnostics inserted_count = row_count;
      if inserted_count = 1 then unlocked := array_append(unlocked, 'first_gem'); end if;
    end if;
    if progress.total_gems >= 5 then
      insert into public.achievements (user_id, achievement_key, metadata)
      values (p_user_id, 'five_gems', jsonb_build_object('totalGems', progress.total_gems))
      on conflict (user_id, achievement_key) do nothing;
      get diagnostics inserted_count = row_count;
      if inserted_count = 1 then unlocked := array_append(unlocked, 'five_gems'); end if;
    end if;
  elsif p_event_type = 'fish' then
    update public.player_progress
    set fish_powerups_collected = fish_powerups_collected + 1
    where user_id = p_user_id
    returning * into progress;

    insert into public.achievements (user_id, achievement_key, metadata)
    values (p_user_id, 'first_fish_power', jsonb_build_object('totalFishPowerUps', progress.fish_powerups_collected))
    on conflict (user_id, achievement_key) do nothing;
    get diagnostics inserted_count = row_count;
    if inserted_count = 1 then unlocked := array_append(unlocked, 'first_fish_power'); end if;
  end if;

  return jsonb_build_object('recorded', true, 'unlockedAchievementKeys', unlocked);
end;
$$;

create or replace function public.complete_verified_game_run_admin(
  p_user_id uuid,
  p_run_id uuid,
  p_duration_seconds integer
)
returns jsonb
language plpgsql
set search_path = ''
as $$
declare
  run public.game_runs;
  progress public.player_progress;
  player_username text;
  timer_seconds integer;
  coin_count integer;
  gem_count integer;
  enemy_count integer;
  computed_score bigint;
  objective_id text;
  achievement_key text;
  inserted_count integer;
  unlocked text[] := array[]::text[];
begin
  select * into run
  from public.game_runs
  where id = p_run_id and user_id = p_user_id
  for update;

  if run.id is null or run.world_number is null or run.submitted_at is not null then
    raise exception 'run is missing or already submitted';
  end if;

  timer_seconds := case run.world_number when 1 then 120 when 2 then 105 else 90 end;
  if p_duration_seconds not between 1 and timer_seconds
     or p_duration_seconds > extract(epoch from (now() - run.started_at))::integer + 5 then
    raise exception 'invalid run duration';
  end if;

  objective_id := case run.world_number
    when 1 then 'emerald-jungle'
    when 2 then 'sunset-ruins'
    else 'crystal-cavern'
  end;
  if not exists (
    select 1 from public.game_run_events
    where run_id = run.id and event_type = 'objective' and event_id = objective_id
  ) then
    raise exception 'completion objective was not recorded';
  end if;

  select
    count(*) filter (where event_type = 'coin')::integer,
    count(*) filter (where event_type = 'gem')::integer,
    count(*) filter (where event_type = 'enemy')::integer
  into coin_count, gem_count, enemy_count
  from public.game_run_events
  where run_id = run.id;

  computed_score := coin_count * 100 + gem_count * 200 + enemy_count * 250 + (timer_seconds - p_duration_seconds) * 10;

  select * into progress
  from public.player_progress
  where user_id = p_user_id
  for update;
  if progress.user_id is null or run.world_number > least(3, progress.completed_worlds + 1) then
    raise exception 'run exceeds unlocked progression';
  end if;

  if run.world_number = progress.completed_worlds + 1 then
    update public.player_progress
    set completed_worlds = run.world_number,
        current_world = least(3, run.world_number + 1),
        checkpoint_world = case when run.world_number < 3 then run.world_number + 1 else checkpoint_world end,
        total_coins = total_coins + coin_count
    where user_id = p_user_id;
  end if;

  update public.game_runs
  set score = computed_score,
      coins = coin_count,
      world_reached = run.world_number,
      duration_seconds = p_duration_seconds,
      completed = true,
      completed_at = now(),
      submitted_at = now()
  where id = run.id
  returning * into run;

  achievement_key := case run.world_number
    when 1 then 'world_1_compass'
    when 2 then 'world_2_compass'
    else 'world_3_treasure'
  end;
  insert into public.achievements (user_id, achievement_key, metadata)
  values (p_user_id, achievement_key, jsonb_build_object('runId', run.id, 'score', run.score))
  on conflict (user_id, achievement_key) do nothing;
  get diagnostics inserted_count = row_count;
  if inserted_count = 1 then unlocked := array_append(unlocked, achievement_key); end if;

  if run.world_number = 3 then
    select username into player_username from public.profiles where id = p_user_id;
    insert into public.leaderboard_entries (
      run_id, user_id, username, score, coins, world_reached, duration_seconds, completed_at
    ) values (
      run.id, p_user_id, player_username, run.score, run.coins, run.world_reached, run.duration_seconds, run.completed_at
    );
  end if;

  return jsonb_build_object('run', to_jsonb(run), 'unlockedAchievementKeys', unlocked);
end;
$$;

create or replace function public.get_leaderboard_admin(p_user_id uuid)
returns table (
  rank bigint,
  run_id uuid,
  username text,
  score bigint,
  coins integer,
  world_reached smallint,
  duration_seconds integer,
  completed_at timestamptz,
  is_current boolean
)
language sql
stable
set search_path = ''
as $$
  with player_best as (
    select entry.*,
      row_number() over (
        partition by entry.user_id
        order by entry.score desc, entry.duration_seconds asc, entry.completed_at asc
      ) as player_run_number
    from public.leaderboard_entries entry
  ), ranked as (
    select best.*,
      row_number() over (order by best.score desc, best.duration_seconds asc, best.completed_at asc) as player_rank
    from player_best best
    where best.player_run_number = 1
  )
  select ranked.player_rank, ranked.run_id, ranked.username, ranked.score, ranked.coins,
    ranked.world_reached, ranked.duration_seconds, ranked.completed_at, ranked.user_id = p_user_id
  from ranked
  where ranked.player_rank <= 10 or ranked.user_id = p_user_id
  order by ranked.player_rank;
$$;

revoke execute on function public.start_game_run_admin(uuid, smallint) from public, anon, authenticated;
revoke execute on function public.record_game_run_event_admin(uuid, uuid, smallint, text, text) from public, anon, authenticated;
revoke execute on function public.complete_verified_game_run_admin(uuid, uuid, integer) from public, anon, authenticated;
revoke execute on function public.get_leaderboard_admin(uuid) from public, anon, authenticated;
grant execute on function public.start_game_run_admin(uuid, smallint) to service_role;
grant execute on function public.record_game_run_event_admin(uuid, uuid, smallint, text, text) to service_role;
grant execute on function public.complete_verified_game_run_admin(uuid, uuid, integer) to service_role;
grant execute on function public.get_leaderboard_admin(uuid) to service_role;
