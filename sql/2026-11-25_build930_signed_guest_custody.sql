-- Private append-only original witness custody. Apply only to verified Rosie production DB.
create table if not exists public.rosie_sysop_custody_cases_v930 (
 id uuid primary key,binding jsonb not null,config_digest text not null check(config_digest ~ '^[a-f0-9]{64}$'),
 issued_by uuid not null references public.staff_users(id),created_at timestamptz not null default now(),expires_at timestamptz not null default(now()+interval '5 minutes'),
 check(expires_at>created_at and expires_at<=created_at+interval '5 minutes')
);
create table if not exists public.rosie_sysop_custody_receipts_v930 (
 id uuid primary key default gen_random_uuid(),case_id uuid not null unique references public.rosie_sysop_custody_cases_v930(id),
 prior_receipt_id uuid unique references public.rosie_sysop_custody_receipts_v930(id),
 binding_digest text not null unique check(binding_digest ~ '^[a-f0-9]{64}$'),
 guest_digest text not null unique check(guest_digest ~ '^[a-f0-9]{64}$'),
 launcher_digest text not null unique check(launcher_digest ~ '^[a-f0-9]{64}$'),
 authority_digest text not null unique check(authority_digest ~ '^[a-f0-9]{64}$'),
 result jsonb not null check(result->>'build'='930' and result->>'fieldCertified'='false' and result->>'sevenSourceConnected'='false' and result->>'authorizesAction'='false'),
 evidence jsonb not null,recorded_by uuid not null references public.staff_users(id),created_at timestamptz not null default now()
);
create unique index if not exists rosie930_one_chain_root on public.rosie_sysop_custody_receipts_v930 ((1)) where prior_receipt_id is null;
create or replace function public.rosie930_receipt_guard() returns trigger language plpgsql security invoker set search_path=public as $$
begin
 if not exists(select 1 from public.rosie_sysop_custody_cases_v930 c where c.id=new.case_id and c.expires_at>now() and c.issued_by=new.recorded_by and (c.binding->>'priorReceiptId') is not distinct from new.prior_receipt_id::text) then raise exception 'ORIGINAL_CUSTODY_CASE_INVALID'; end if;
 return new;
end $$;
revoke all on function public.rosie930_receipt_guard() from public,anon,authenticated;
grant execute on function public.rosie930_receipt_guard() to service_role;
drop trigger if exists rosie930_receipt_guard on public.rosie_sysop_custody_receipts_v930;
create trigger rosie930_receipt_guard before insert on public.rosie_sysop_custody_receipts_v930 for each row execute function public.rosie930_receipt_guard();
do $$ declare t text; begin foreach t in array array['rosie_sysop_custody_cases_v930','rosie_sysop_custody_receipts_v930'] loop
 execute format('alter table public.%I enable row level security',t);
 execute format('revoke all on public.%I from public,anon,authenticated,service_role',t);
 execute format('grant select,insert on public.%I to service_role',t);
end loop; end $$;
