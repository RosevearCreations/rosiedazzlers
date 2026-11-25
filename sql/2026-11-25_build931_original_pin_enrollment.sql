-- Additive private enrollment ledger. No key creation or evidence seeding.
create table if not exists public.rosie_sysop_pin_challenges_v931 (
 id uuid primary key,role text not null check(role in ('GUEST_WITNESS','LAUNCHER_INSPECTOR','CUSTODY_AUTHORITY')),
 staff_id uuid not null references public.staff_users(id),config_digest text not null check(config_digest ~ '^[a-f0-9]{64}$'),binding jsonb not null,
 created_at timestamptz not null default now(),expires_at timestamptz not null default(now()+interval '5 minutes'),check(expires_at>created_at and expires_at<=created_at+interval '5 minutes')
);
create table if not exists public.rosie_sysop_pin_enrollments_v931 (
 id uuid primary key default gen_random_uuid(),challenge_id uuid not null unique references public.rosie_sysop_pin_challenges_v931(id),
 role text not null check(role in ('GUEST_WITNESS','LAUNCHER_INSPECTOR','CUSTODY_AUTHORITY')),staff_id uuid not null references public.staff_users(id),
 fingerprint text not null check(fingerprint ~ '^[a-f0-9]{64}$'),config_digest text not null check(config_digest ~ '^[a-f0-9]{64}$'),
 enrollment_digest text not null unique check(enrollment_digest ~ '^[a-f0-9]{64}$'),envelope jsonb not null,created_at timestamptz not null default now(),
 unique(config_digest,role),unique(config_digest,staff_id),unique(config_digest,fingerprint)
);
create or replace function public.rosie931_enrollment_guard() returns trigger language plpgsql security invoker set search_path=public as $$
begin
 if not exists(select 1 from public.rosie_sysop_pin_challenges_v931 c where c.id=new.challenge_id and c.role=new.role and c.staff_id=new.staff_id and c.config_digest=new.config_digest and c.binding->>'fingerprint'=new.fingerprint and c.expires_at>now()) then raise exception 'ORIGINAL_ENROLLMENT_CASE_INVALID'; end if;
 return new;
end $$;
revoke all on function public.rosie931_enrollment_guard() from public,anon,authenticated;
grant execute on function public.rosie931_enrollment_guard() to service_role;
drop trigger if exists rosie931_enrollment_guard on public.rosie_sysop_pin_enrollments_v931;
create trigger rosie931_enrollment_guard before insert on public.rosie_sysop_pin_enrollments_v931 for each row execute function public.rosie931_enrollment_guard();
do $$ declare t text; begin foreach t in array array['rosie_sysop_pin_challenges_v931','rosie_sysop_pin_enrollments_v931'] loop
 execute format('alter table public.%I enable row level security',t);
 execute format('revoke all on public.%I from public,anon,authenticated,service_role',t);
 execute format('grant select,insert on public.%I to service_role',t);
end loop; end $$;
