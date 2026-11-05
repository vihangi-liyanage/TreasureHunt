begin;

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values (
  '00000000-0000-0000-0000-000000000000',
  '33333333-3333-4333-8333-333333333333',
  'authenticated', 'authenticated', 'runner@example.com', '', now(),
  '{"provider":"email","providers":["email"]}', '{"username":"WorldRunner"}', now(), now()
);

set local role service_role;

insert into public.game_runs (id, user_id) values (
  '44444444-4444-4444-8444-444444444444',
  '33333333-3333-4333-8333-333333333333'
);

select plan(5);

select public.complete_world_admin('33333333-3333-4333-8333-333333333333', 1::smallint, 5);
select public.complete_world_admin('33333333-3333-4333-8333-333333333333', 2::smallint, 5);

select throws_ok(
  $$ select public.complete_game_run_admin(
    '33333333-3333-4333-8333-333333333333', '44444444-4444-4444-8444-444444444444',
    1000, 10, 3::smallint, 300, true
  ) $$,
  'P0001',
  'completed leaderboard run requires a completed world 3 mission',
  'World 3 cannot be claimed before persistent progression confirms it'
);

select public.complete_world_admin('33333333-3333-4333-8333-333333333333', 3::smallint, 5);

select throws_ok(
  $$ select public.complete_game_run_admin(
    '33333333-3333-4333-8333-333333333333', '44444444-4444-4444-8444-444444444444',
    1000, 10, 2::smallint, 300, true
  ) $$,
  'P0001',
  'completed leaderboard run requires a completed world 3 mission',
  'a completed leaderboard run must identify World 3'
);

select lives_ok(
  $$ select public.complete_game_run_admin(
    '33333333-3333-4333-8333-333333333333', '44444444-4444-4444-8444-444444444444',
    1000, 10, 3::smallint, 300, true
  ) $$,
  'a completed World 3 mission is accepted once'
);

select is(
  (select count(*)::integer from public.leaderboard_entries where run_id = '44444444-4444-4444-8444-444444444444'),
  1,
  'accepted World 3 completion creates one leaderboard entry'
);

select throws_ok(
  $$ select public.complete_game_run_admin(
    '33333333-3333-4333-8333-333333333333', '44444444-4444-4444-8444-444444444444',
    2000, 20, 3::smallint, 250, true
  ) $$,
  'P0001',
  'run is missing or already submitted',
  'an accepted run cannot be resubmitted with a different score'
);

select * from finish();
rollback;
