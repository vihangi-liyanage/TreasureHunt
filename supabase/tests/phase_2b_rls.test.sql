begin;
select plan(38);

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

select ok(has_schema_privilege('service_role', 'public', 'usage'), 'service role can access the explicitly exposed schema');
select ok(has_table_privilege('service_role', 'public.profiles', 'select'), 'service role can check profile usernames');
select ok(not has_table_privilege('service_role', 'public.profiles', 'insert'), 'service role cannot insert profiles directly');
select ok(has_table_privilege('service_role', 'public.player_progress', 'select'), 'service role can validate progress');
select ok(has_table_privilege('service_role', 'public.player_progress', 'update'), 'service role can apply trusted progress updates');
select ok(not has_table_privilege('service_role', 'public.player_progress', 'insert'), 'service role cannot create progress outside the auth trigger');
select ok(not has_table_privilege('service_role', 'public.achievements', 'select'), 'service role has no unused achievement access');
select ok(not has_sequence_privilege('service_role', 'public.achievements_id_seq', 'usage'), 'service role has no unused identity-sequence access');
select ok(has_table_privilege('service_role', 'public.game_runs', 'select'), 'service role can return owned runs');
select ok(has_table_privilege('service_role', 'public.game_runs', 'insert'), 'service role can issue run IDs');
select ok(has_table_privilege('service_role', 'public.game_runs', 'update'), 'service role can finalize runs once');
select ok(not has_table_privilege('service_role', 'public.game_runs', 'delete'), 'service role cannot delete runs');
select ok(has_table_privilege('service_role', 'public.leaderboard_entries', 'insert'), 'service role can publish accepted scores');
select ok(not has_table_privilege('service_role', 'public.leaderboard_entries', 'update'), 'service role cannot rewrite leaderboard entries');
select ok(not has_function_privilege('authenticated', 'private.touch_updated_at()', 'execute'), 'players cannot invoke the timestamp trigger function');
select ok(not has_function_privilege('service_role', 'private.touch_updated_at()', 'execute'), 'service role cannot invoke the timestamp trigger function directly');
select ok(not has_function_privilege('authenticated', 'private.handle_new_user()', 'execute'), 'players cannot invoke the auth provisioning trigger function');
select ok(not has_function_privilege('service_role', 'private.handle_new_user()', 'execute'), 'service role cannot invoke the auth provisioning trigger function directly');

select * from finish();
rollback;
