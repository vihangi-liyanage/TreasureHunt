create table public.fish_challenges (
  id uuid primary key default gen_random_uuid(),
  owner_key text not null check (owner_key ~ '^(auth|guest):[0-9a-f-]{36}$'),
  run_attempt_id uuid not null,
  world_id text not null check (world_id in ('emerald-jungle', 'sunset-ruins', 'crystal-cavern')),
  solution integer not null check (solution between 0 and 1000),
  answer_attempts smallint not null default 0 check (answer_attempts between 0 and 5),
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_at timestamptz not null default now()
);

create index fish_challenges_owner_run_idx on public.fish_challenges (owner_key, run_attempt_id, created_at desc);
create unique index fish_challenges_one_revival_per_run
  on public.fish_challenges (owner_key, run_attempt_id)
  where consumed_at is not null;

alter table public.fish_challenges enable row level security;
revoke all on public.fish_challenges from public, anon, authenticated, service_role;
grant select, insert, update on public.fish_challenges to service_role;

create or replace function public.verify_fish_challenge_admin(
  p_challenge_id uuid,
  p_owner_key text,
  p_run_attempt_id uuid,
  p_answer integer
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  challenge public.fish_challenges;
begin
  select * into challenge
  from public.fish_challenges
  where id = p_challenge_id
    and owner_key = p_owner_key
    and run_attempt_id = p_run_attempt_id
  for update;

  if not found then return 'invalid'; end if;
  if challenge.consumed_at is not null then return 'used'; end if;
  if challenge.expires_at <= now() then return 'expired'; end if;
  if exists (
    select 1 from public.fish_challenges
    where owner_key = p_owner_key and run_attempt_id = p_run_attempt_id and consumed_at is not null
  ) then return 'already_revived'; end if;
  if challenge.answer_attempts >= 5 then return 'locked'; end if;

  if challenge.solution <> p_answer then
    update public.fish_challenges
    set answer_attempts = answer_attempts + 1
    where id = p_challenge_id;
    return 'incorrect';
  end if;

  begin
    update public.fish_challenges
    set consumed_at = now(), answer_attempts = answer_attempts + 1
    where id = p_challenge_id;
  exception when unique_violation then
    return 'already_revived';
  end;
  return 'correct';
end;
$$;

revoke all on function public.verify_fish_challenge_admin(uuid, text, uuid, integer) from public, anon, authenticated;
grant execute on function public.verify_fish_challenge_admin(uuid, text, uuid, integer) to service_role;
