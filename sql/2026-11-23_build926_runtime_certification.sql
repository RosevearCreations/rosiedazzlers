-- Original evidence only. All records immutable. No customer or finance data.
create table if not exists public.rosie_sysop_enrollment_challenges_v926 (
 id uuid primary key, binding jsonb not null, config_digest text not null check(config_digest ~ '^[a-f0-9]{64}$'),
 issued_by uuid not null references public.staff_users(id),
 created_at timestamptz not null default now(), expires_at timestamptz not null default(now()+interval '5 minutes'),
 check(expires_at>created_at and expires_at<=created_at+interval '5 minutes')
);
create table if not exists public.rosie_sysop_witness_enrollment_v926 (
 id uuid primary key default gen_random_uuid(), challenge_id uuid not null unique references public.rosie_sysop_enrollment_challenges_v926(id),
 staff_id uuid not null references public.staff_users(id), fingerprint text not null check(fingerprint ~ '^[a-f0-9]{64}$'),
 enrollment_digest text not null unique check(enrollment_digest ~ '^[a-f0-9]{64}$'), config_digest text not null check(config_digest ~ '^[a-f0-9]{64}$'),
 envelope jsonb not null, created_at timestamptz not null default now()
);
create table if not exists public.rosie_sysop_runtime_cases_v926 (
 id uuid primary key, review_id uuid not null references public.rosie_sysop_field_reviews_v925(id), enrollment_id uuid not null references public.rosie_sysop_witness_enrollment_v926(id),
 binding jsonb not null, config_digest text not null check(config_digest ~ '^[a-f0-9]{64}$'), issued_by uuid not null references public.staff_users(id),
 created_at timestamptz not null default now(), expires_at timestamptz not null default(now()+interval '5 minutes'),
 check(expires_at>created_at and expires_at<=created_at+interval '5 minutes')
);
create table if not exists public.rosie_sysop_operational_certifications_v926 (
 id uuid primary key default gen_random_uuid(), case_id uuid not null unique references public.rosie_sysop_runtime_cases_v926(id),
 binding_digest text not null unique check(binding_digest ~ '^[a-f0-9]{64}$'), runtime_digest text not null unique check(runtime_digest ~ '^[a-f0-9]{64}$'),
 approval_digest text not null unique check(approval_digest ~ '^[a-f0-9]{64}$'), certified boolean not null,
 result jsonb not null check(result->>'scope'='ORIGINAL_HOST_RUNTIME_AT_OBSERVATION' and result->>'authorizesAction'='false' and result->>'sevenSourceConnected'='false' and result->>'continuousHealthCertified'='false'),
 evidence jsonb not null, recorded_by uuid not null references public.staff_users(id), created_at timestamptz not null default now()
);
create or replace function public.rosie926_original_expiry_guard() returns trigger language plpgsql security invoker set search_path=public as $$
begin
 if TG_TABLE_NAME='rosie_sysop_witness_enrollment_v926' then
  if not exists(select 1 from public.rosie_sysop_enrollment_challenges_v926 where id=new.challenge_id and expires_at>now()) then raise exception 'ENROLLMENT_EXPIRED'; end if;
 else
  if not exists(select 1 from public.rosie_sysop_runtime_cases_v926 where id=new.case_id and expires_at>now()) then raise exception 'RUNTIME_CASE_EXPIRED'; end if;
 end if; return new;
end $$;
revoke all on function public.rosie926_original_expiry_guard() from public,anon,authenticated;
grant execute on function public.rosie926_original_expiry_guard() to service_role;
drop trigger if exists rosie926_enrollment_guard on public.rosie_sysop_witness_enrollment_v926;
create trigger rosie926_enrollment_guard before insert on public.rosie_sysop_witness_enrollment_v926 for each row execute function public.rosie926_original_expiry_guard();
drop trigger if exists rosie926_cert_guard on public.rosie_sysop_operational_certifications_v926;
create trigger rosie926_cert_guard before insert on public.rosie_sysop_operational_certifications_v926 for each row execute function public.rosie926_original_expiry_guard();
do $$ declare t text; begin
 foreach t in array array['rosie_sysop_enrollment_challenges_v926','rosie_sysop_witness_enrollment_v926','rosie_sysop_runtime_cases_v926','rosie_sysop_operational_certifications_v926'] loop
 execute format('alter table public.%I enable row level security',t);
 execute format('revoke all on public.%I from public,anon,authenticated,service_role',t);
 execute format('grant select,insert on public.%I to service_role',t);
 end loop;
end $$;
