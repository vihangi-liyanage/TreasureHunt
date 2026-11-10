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
  earned_achievement_key text;
  inserted_count integer;
  unlocked text[] := array[]::text[];
begin
  select * into run
  from public.game_runs
  where id = p_run_id and user_id = p_user_id
  for update;

  if run.id is null or run.world_number is null then
    raise exception 'run is missing';
  end if;
  if run.submitted_at is not null then
    if run.completed then
      return jsonb_build_object('run', to_jsonb(run), 'unlockedAchievementKeys', unlocked);
    end if;
    raise exception 'run is already submitted';
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

  computed_score := coin_count * 100 + gem_count * 200 + enemy_count * 250
    + (timer_seconds - p_duration_seconds) * 10;

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
        total_coins = total_coins + coin_count,
        updated_at = now()
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

  earned_achievement_key := case run.world_number
    when 1 then 'world_1_compass'
    when 2 then 'world_2_compass'
    else 'world_3_treasure'
  end;
  insert into public.achievements (user_id, achievement_key, metadata)
  values (p_user_id, earned_achievement_key, jsonb_build_object('runId', run.id, 'score', run.score))
  on conflict (user_id, achievement_key) do nothing;
  get diagnostics inserted_count = row_count;
  if inserted_count = 1 then unlocked := array_append(unlocked, earned_achievement_key); end if;

  if run.world_number = 3 then
    select username into player_username from public.profiles where id = p_user_id;
    insert into public.leaderboard_entries (
      run_id, user_id, username, score, coins, world_reached, duration_seconds, completed_at
    ) values (
      run.id, p_user_id, player_username, run.score, run.coins, run.world_reached, run.duration_seconds, run.completed_at
    ) on conflict (run_id) do nothing;
  end if;

  return jsonb_build_object('run', to_jsonb(run), 'unlockedAchievementKeys', unlocked);
end;
$$;

revoke execute on function public.complete_verified_game_run_admin(uuid, uuid, integer)
  from public, anon, authenticated;
grant execute on function public.complete_verified_game_run_admin(uuid, uuid, integer)
  to service_role;
