begin;
select plan(20);

select ok((select relrowsecurity from pg_class where oid = 'public.profiles'::regclass), 'profiles has RLS');
select ok((select relrowsecurity from pg_class where oid = 'public.player_progress'::regclass), 'player_progress has RLS');
select ok((select relrowsecurity from pg_class where oid = 'public.achievements'::regclass), 'achievements has RLS');
select ok((select relrowsecurity from pg_class where oid = 'public.game_runs'::regclass), 'game_runs has RLS');
select ok((select relrowsecurity from pg_class where oid = 'public.leaderboard_entries'::regclass), 'leaderboard_entries has RLS');

select ok(not has_table_privilege('anon', 'public.profiles', 'select'), 'anonymous users cannot read profiles');
select ok(not has_table_privilege('anon', 'public.player_progress', 'select'), 'anonymous users cannot read progress');
select ok(not has_table_privilege('anon', 'public.achievements', 'select'), 'anonymous users cannot read achievements');
select ok(not has_table_privilege('anon', 'public.game_runs', 'select'), 'anonymous users cannot read runs');
select ok(not has_table_privilege('anon', 'public.leaderboard_entries', 'select'), 'anonymous users cannot read leaderboard data');

select ok(has_table_privilege('authenticated', 'public.profiles', 'select'), 'authenticated users can read RLS-filtered profiles');
select ok(has_column_privilege('authenticated', 'public.profiles', 'username', 'update'), 'authenticated users can update only the username column');
select ok(not has_table_privilege('authenticated', 'public.player_progress', 'update'), 'players cannot directly update progress');
select ok(not has_table_privilege('authenticated', 'public.game_runs', 'insert'), 'players cannot directly create runs');
select ok(not has_table_privilege('authenticated', 'public.leaderboard_entries', 'insert'), 'players cannot directly insert leaderboard scores');

select ok(not has_function_privilege('authenticated', 'public.complete_world_admin(uuid,smallint,bigint)', 'execute'), 'players cannot call trusted progress mutation');
select ok(has_function_privilege('service_role', 'public.complete_world_admin(uuid,smallint,bigint)', 'execute'), 'service role can call trusted progress mutation');
select ok(not has_function_privilege('authenticated', 'public.complete_game_run_admin(uuid,uuid,bigint,integer,smallint,integer,boolean)', 'execute'), 'players cannot call trusted run completion');
select ok(not has_function_privilege('authenticated', 'public.username_exists_admin(text)', 'execute'), 'players cannot enumerate usernames through the trusted lookup');
select ok(has_function_privilege('service_role', 'public.username_exists_admin(text)', 'execute'), 'service role can check username uniqueness');

select * from finish();
rollback;
