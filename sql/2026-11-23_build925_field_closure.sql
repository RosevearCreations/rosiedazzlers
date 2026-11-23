-- Original-only Build 925 append-only case and signed closure review custody.
create table if not exists public.rosie_sysop_field_cases_v925 (
 id uuid primary key,
 binding jsonb not null check (jsonb_typeof(binding)='object' and binding->>'caseId'=id::text and binding->>'nonce' ~ '^[a-f0-9]{64}$'),
 config_digest text not null check(config_digest ~ '^[a-f0-9]{64}$'),
 issued_by uuid not null references public.staff_users(id),
 created_at timestamptz not null default now(),
 expires_at timestamptz not null default (now()+interval '5 minutes'),
 check(expires_at>created_at and expires_at<=created_at+interval '5 minutes')
);
create unique index if not exists rosie925_nonce on public.rosie_sysop_field_cases_v925 ((binding->>'nonce'));
create table if not exists public.rosie_sysop_field_reviews_v925 (
 id uuid primary key default gen_random_uuid(),
 case_id uuid not null unique references public.rosie_sysop_field_cases_v925(id),
 case_digest text not null unique check(case_digest ~ '^[a-f0-9]{64}$'),
 review_digest text not null unique check(review_digest ~ '^[a-f0-9]{64}$'),
 closure_ready boolean not null,
 result jsonb not null check(result->>'fieldCertified'='false' and result->>'sevenSourceConnected'='false' and result->>'authorizesAction'='false'),
 evidence jsonb not null check(jsonb_typeof(evidence)='object'),
 recorded_by uuid not null references public.staff_users(id),
 created_at timestamptz not null default now()
);
create or replace function public.rosie925_case_guard() returns trigger language plpgsql security invoker set search_path=public as $$
begin
 if not exists(select 1 from public.rosie_sysop_field_cases_v925 c where c.id=new.case_id and c.expires_at>now()) then raise exception 'ROSIE925_CASE_EXPIRED'; end if;
 return new;
end; $$;
revoke all on function public.rosie925_case_guard() from public,anon,authenticated;
grant execute on function public.rosie925_case_guard() to service_role;
drop trigger if exists rosie925_case_guard_t on public.rosie_sysop_field_reviews_v925;
create trigger rosie925_case_guard_t before insert on public.rosie_sysop_field_reviews_v925 for each row execute function public.rosie925_case_guard();
do $$ declare t text; begin
 foreach t in array array['rosie_sysop_field_cases_v925','rosie_sysop_field_reviews_v925'] loop
 execute format('alter table public.%I enable row level security',t);
 execute format('revoke all on public.%I from public,anon,authenticated,service_role',t);
 execute format('grant select,insert on public.%I to service_role',t);
 end loop;
end $$;
