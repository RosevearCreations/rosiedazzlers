-- Rosie 917: append-only staff document custody; never provider deletion or financial authority.
-- First-party originals in Builds 914-916 are prerequisites; all new evidence is UNVERIFIED.
create table if not exists public.rosie_supplier_native_takedown_v917 (
 id uuid primary key default gen_random_uuid(),
 publication_id uuid not null references public.rosie_supplier_publication_v914(id),
 provider_receipt_id uuid not null references public.rosie_supplier_provider_receipts_v915(id),
 submitted_by_staff_id uuid not null references public.staff_users(id),
 provider_case_reference text not null check (provider_case_reference ~ '^[A-Za-z0-9:_-]{8,120}$'),
 receipt_sha256 text not null check (receipt_sha256 ~ '^[a-f0-9]{64}$'),
 evidence_state text not null default 'staff_submitted_unverified'
  check (evidence_state='staff_submitted_unverified'),
 created_at timestamptz not null default now(),
 unique(publication_id,provider_case_reference)
);
create table if not exists public.rosie_supplier_recall_surfaces_v917 (
 id uuid primary key default gen_random_uuid(),
 publication_id uuid not null references public.rosie_supplier_publication_v914(id),
 observed_by_staff_id uuid not null references public.staff_users(id),
 surface_kind text not null check (surface_kind in ('origin','cdn','mirror','search','archive')),
 surface_host text not null check (surface_host ~ '^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,24}$' and length(surface_host)<=120),
 observed_state text not null check (observed_state in ('present','unavailable','staff_reported_removed')),
 evidence_sha256 text not null check (evidence_sha256 ~ '^[a-f0-9]{64}$'),
 evidence_state text not null default 'staff_reported_unverified'
  check (evidence_state='staff_reported_unverified'),
 created_at timestamptz not null default now(),
 unique(publication_id,surface_kind,surface_host,evidence_sha256)
);
create table if not exists public.rosie_supplier_device_second_witness_v917 (
 id uuid primary key default gen_random_uuid(),
 publication_id uuid not null references public.rosie_supplier_publication_v914(id),
 device_evidence_id uuid not null unique references public.rosie_supplier_device_evidence_v916(id),
 witnessed_by_staff_id uuid not null references public.staff_users(id),
 evidence_sha256 text not null check (evidence_sha256 ~ '^[a-f0-9]{64}$'),
 evidence_state text not null default 'second_staff_attested_unverified'
  check (evidence_state='second_staff_attested_unverified'),
 created_at timestamptz not null default now()
);
create or replace function public.rosie_supplier_guard_second_witness_v917()
returns trigger language plpgsql security invoker set search_path=public as $$
declare original record;
begin
 select publication_id,witnessed_by_staff_id,outcome into original
 from public.rosie_supplier_device_evidence_v916 where id=new.device_evidence_id for share;
 if not found or original.publication_id<>new.publication_id or
 original.witnessed_by_staff_id=new.witnessed_by_staff_id or original.outcome<>'passed'
 then raise exception 'ORIGINAL_DISTINCT_PASSED_DEVICE_WITNESS_REQUIRED';
 end if;
 return new;
end;$$;
revoke all on function public.rosie_supplier_guard_second_witness_v917() from public,anon,authenticated;
grant execute on function public.rosie_supplier_guard_second_witness_v917() to service_role;
drop trigger if exists rosie_supplier_second_witness_guard_v917 on public.rosie_supplier_device_second_witness_v917;
create trigger rosie_supplier_second_witness_guard_v917 before insert on public.rosie_supplier_device_second_witness_v917
for each row execute function public.rosie_supplier_guard_second_witness_v917();
create table if not exists public.rosie_supplier_finance_chain_v917 (
 id uuid primary key default gen_random_uuid(),
 publication_id uuid not null references public.rosie_supplier_publication_v914(id),
 journal_entry_id uuid not null references public.accounting_journal_entries(id),
 reviewed_by_staff_id uuid not null references public.staff_users(id),
 payment_source_sha256 text not null check(payment_source_sha256 ~ '^[a-f0-9]{64}$'),
 customer_source_sha256 text not null check(customer_source_sha256 ~ '^[a-f0-9]{64}$'),
 evidence_state text not null default 'documentary_chain_unverified'
  check(evidence_state='documentary_chain_unverified'),
 attributed_revenue_cents bigint check(attributed_revenue_cents is null),
 incremental_sales bigint check(incremental_sales is null),
 roas numeric check(roas is null),
 created_at timestamptz not null default now(),
 unique(publication_id,journal_entry_id)
);
do $$
declare tab text;
begin
 foreach tab in array array[
  'rosie_supplier_native_takedown_v917','rosie_supplier_recall_surfaces_v917',
  'rosie_supplier_device_second_witness_v917','rosie_supplier_finance_chain_v917']
 loop
  execute format('alter table public.%I enable row level security',tab);
  execute format('revoke all on public.%I from public,anon,authenticated',tab);
  execute format('revoke all on public.%I from service_role',tab);
  execute format('grant select,insert on public.%I to service_role',tab);
 end loop;
end;$$;
