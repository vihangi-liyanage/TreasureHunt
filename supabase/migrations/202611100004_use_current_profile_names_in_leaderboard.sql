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
  select ranked.player_rank, ranked.run_id, profile.username, ranked.score, ranked.coins,
    ranked.world_reached, ranked.duration_seconds, ranked.completed_at, ranked.user_id = p_user_id
  from ranked
  join public.profiles profile on profile.id = ranked.user_id
  where ranked.player_rank <= 10 or ranked.user_id = p_user_id
  order by ranked.player_rank;
$$;

revoke execute on function public.get_leaderboard_admin(uuid) from public, anon, authenticated;
grant execute on function public.get_leaderboard_admin(uuid) to service_role;
