begin;

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values
  ('00000000-0000-0000-0000-000000000000', '11111111-1111-4111-8111-111111111111', 'authenticated', 'authenticated', 'one@example.com', '', now(), '{"provider":"email","providers":["email"]}', '{"username":"ExplorerOne"}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '22222222-2222-4222-8222-222222222222', 'authenticated', 'authenticated', 'two@example.com', '', now(), '{"provider":"email","providers":["email"]}', '{"username":"ExplorerTwo"}', now(), now());

select plan(5);
set local role authenticated;
select set_config('request.jwt.claim.sub', '11111111-1111-4111-8111-111111111111', true);

select results_eq(
  $$ select username from public.profiles order by username $$,
  array['ExplorerOne'::text],
  'a player reads only their own profile'
);

select is(
  (select count(*)::integer from public.player_progress),
  1,
  'a player reads only their own progress'
);

select is(
  (select count(*)::integer from public.achievements),
  0,
  'achievement access is scoped to the current player'
);

select throws_ok(
  $$ insert into public.game_runs (user_id) values ('11111111-1111-4111-8111-111111111111') $$,
  '42501',
  null,
  'players cannot bypass the trusted run-start route'
);

select throws_ok(
  $$ update public.player_progress set completed_worlds = 3 where user_id = '11111111-1111-4111-8111-111111111111' $$,
  '42501',
  null,
  'players cannot directly unlock worlds'
);

select * from finish();
rollback;
