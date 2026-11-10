create or replace function private.enforce_run_submission_window()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.submitted_at is null
     and new.submitted_at is not null
     and old.started_at < now() - interval '30 minutes' then
    raise exception 'run submission window expired';
  end if;
  return new;
end;
$$;

create trigger game_runs_submission_window
before update of submitted_at on public.game_runs
for each row execute function private.enforce_run_submission_window();

revoke all on function private.enforce_run_submission_window() from public, anon, authenticated, service_role;
