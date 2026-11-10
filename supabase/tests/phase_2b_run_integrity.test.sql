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

select plan(6);

select public.complete_world_admin('33333333-3333-4333-8333-333333333333', 1::smallint, 5);
select public.complete_world_admin('33333333-3333-4333-8333-333333333333', 2::smallint, 5);

select (public.start_game_run_admin(
  '33333333-3333-4333-8333-333333333333', 3::smallint
)).id;

select public.record_game_run_event_admin(
  '33333333-3333-4333-8333-333333333333',
  (select id from public.game_runs where user_id = '33333333-3333-4333-8333-333333333333'),
  3::smallint, 'coin', 'coin-1'
);

select throws_ok(
  $$ select public.complete_verified_game_run_admin(
    '33333333-3333-4333-8333-333333333333',
    (select id from public.game_runs where user_id = '33333333-3333-4333-8333-333333333333'),
    1
  ) $$,
  'P0001',
  'completion objective was not recorded',
  'World 3 cannot complete without a recorded treasure collision'
);

select public.record_game_run_event_admin(
  '33333333-3333-4333-8333-333333333333',
  (select id from public.game_runs where user_id = '33333333-3333-4333-8333-333333333333'),
  3::smallint, 'objective', 'crystal-cavern'
);

select lives_ok(
  $$ select public.complete_verified_game_run_admin(
    '33333333-3333-4333-8333-333333333333',
    (select id from public.game_runs where user_id = '33333333-3333-4333-8333-333333333333'),
    1
  ) $$,
  'a treasure-backed World 3 mission is accepted once'
);

select is(
  (select count(*)::integer from public.leaderboard_entries where user_id = '33333333-3333-4333-8333-333333333333'),
  1,
  'accepted World 3 completion creates one leaderboard entry'
);

select throws_ok(
  $$ select public.complete_verified_game_run_admin(
    '33333333-3333-4333-8333-333333333333',
    (select id from public.game_runs where user_id = '33333333-3333-4333-8333-333333333333'),
    1
  ) $$,
  'P0001',
  'run is missing or already submitted',
  'an accepted run cannot be resubmitted with a different score'
);

select is(
  (select score from public.game_runs where user_id = '33333333-3333-4333-8333-333333333333'),
  990::bigint,
  'score is derived from recorded events and remaining time'
);

select is(
  (select completed_worlds from public.player_progress where user_id = '33333333-3333-4333-8333-333333333333'),
  3::smallint,
  'verified completion advances progression atomically'
);

select * from finish();
rollback;
