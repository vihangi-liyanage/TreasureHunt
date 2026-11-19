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

  select * into run from public.game_runs
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
    update public.player_progress set total_gems = total_gems + 1, updated_at = now()
    where user_id = p_user_id returning * into progress;

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
    if progress.total_gems >= 10 then
      insert into public.achievements (user_id, achievement_key, metadata)
      values (p_user_id, 'gem_treasure_chest', jsonb_build_object('totalGems', progress.total_gems))
      on conflict (user_id, achievement_key) do nothing;
      get diagnostics inserted_count = row_count;
      if inserted_count = 1 then unlocked := array_append(unlocked, 'gem_treasure_chest'); end if;
    end if;
    if progress.total_gems >= 20 then
      insert into public.achievements (user_id, achievement_key, metadata)
      values (p_user_id, 'crystal_collector', jsonb_build_object('totalGems', progress.total_gems))
      on conflict (user_id, achievement_key) do nothing;
      get diagnostics inserted_count = row_count;
      if inserted_count = 1 then unlocked := array_append(unlocked, 'crystal_collector'); end if;
    end if;
  elsif p_event_type = 'fish' then
    update public.player_progress set fish_powerups_collected = fish_powerups_collected + 1, updated_at = now()
    where user_id = p_user_id returning * into progress;

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
  earned_achievement_key text;
  inserted_count integer;
  unlocked text[] := array[]::text[];
begin
  select * into run from public.game_runs
  where id = p_run_id and user_id = p_user_id for update;

  if run.id is null or run.world_number is null then raise exception 'run is missing'; end if;
  if run.submitted_at is not null then
    if run.completed then return jsonb_build_object('run', to_jsonb(run), 'unlockedAchievementKeys', unlocked); end if;
    raise exception 'run is already submitted';
  end if;

  timer_seconds := case run.world_number when 1 then 120 when 2 then 105 else 90 end;
  if p_duration_seconds not between 1 and timer_seconds
     or p_duration_seconds > extract(epoch from (now() - run.started_at))::integer + 5 then
    raise exception 'invalid run duration';
  end if;

  objective_id := case run.world_number when 1 then 'emerald-jungle' when 2 then 'sunset-ruins' else 'crystal-cavern' end;
  if not exists (select 1 from public.game_run_events where run_id = run.id and event_type = 'objective' and event_id = objective_id) then
    raise exception 'completion objective was not recorded';
  end if;

  select count(*) filter (where event_type = 'coin')::integer,
         count(*) filter (where event_type = 'gem')::integer,
         count(*) filter (where event_type = 'enemy')::integer
  into coin_count, gem_count, enemy_count from public.game_run_events where run_id = run.id;

  computed_score := coin_count * 100 + gem_count * 200 + enemy_count * 250 + (timer_seconds - p_duration_seconds) * 10;

  select * into progress from public.player_progress where user_id = p_user_id for update;
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
    where user_id = p_user_id returning * into progress;
  end if;

  update public.game_runs
  set score = computed_score, coins = coin_count, world_reached = run.world_number,
      duration_seconds = p_duration_seconds, completed = true, completed_at = now(), submitted_at = now()
  where id = run.id returning * into run;

  earned_achievement_key := case run.world_number when 1 then 'world_1_compass' when 2 then 'world_2_compass' else 'world_3_treasure' end;
  insert into public.achievements (user_id, achievement_key, metadata)
  values (p_user_id, earned_achievement_key, jsonb_build_object('runId', run.id, 'score', run.score))
  on conflict (user_id, achievement_key) do nothing;
  get diagnostics inserted_count = row_count;
  if inserted_count = 1 then unlocked := array_append(unlocked, earned_achievement_key); end if;

  if progress.total_coins >= 50 then
    insert into public.achievements (user_id, achievement_key, metadata)
    values (p_user_id, 'gold_treasure_chest', jsonb_build_object('totalCoins', progress.total_coins, 'runId', run.id))
    on conflict (user_id, achievement_key) do nothing;
    get diagnostics inserted_count = row_count;
    if inserted_count = 1 then unlocked := array_append(unlocked, 'gold_treasure_chest'); end if;
  end if;

  if run.world_number = 3 then
    select username into player_username from public.profiles where id = p_user_id;
    insert into public.leaderboard_entries (run_id, user_id, username, score, coins, world_reached, duration_seconds, completed_at)
    values (run.id, p_user_id, player_username, run.score, run.coins, run.world_reached, run.duration_seconds, run.completed_at)
    on conflict (run_id) do nothing;
  end if;

  return jsonb_build_object('run', to_jsonb(run), 'unlockedAchievementKeys', unlocked);
end;
$$;

insert into public.achievements (user_id, achievement_key, metadata)
select user_id, 'gem_treasure_chest', jsonb_build_object('totalGems', total_gems, 'backfilled', true)
from public.player_progress where total_gems >= 10
on conflict (user_id, achievement_key) do nothing;

insert into public.achievements (user_id, achievement_key, metadata)
select user_id, 'crystal_collector', jsonb_build_object('totalGems', total_gems, 'backfilled', true)
from public.player_progress where total_gems >= 20
on conflict (user_id, achievement_key) do nothing;

insert into public.achievements (user_id, achievement_key, metadata)
select user_id, 'gold_treasure_chest', jsonb_build_object('totalCoins', total_coins, 'backfilled', true)
from public.player_progress where total_coins >= 50
on conflict (user_id, achievement_key) do nothing;

revoke execute on function public.record_game_run_event_admin(uuid, uuid, smallint, text, text) from public, anon, authenticated;
revoke execute on function public.complete_verified_game_run_admin(uuid, uuid, integer) from public, anon, authenticated;
grant execute on function public.record_game_run_event_admin(uuid, uuid, smallint, text, text) to service_role;
grant execute on function public.complete_verified_game_run_admin(uuid, uuid, integer) to service_role;
