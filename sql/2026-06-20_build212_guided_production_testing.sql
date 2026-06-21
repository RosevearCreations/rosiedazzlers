-- Build 212 — guided production testing and audit history.
-- Stores owner/staff acceptance-test outcomes without storing secrets or customer-private evidence.

create table if not exists public.production_test_runs (
  id uuid primary key default gen_random_uuid(),
  test_key text not null,
  test_name text not null,
  status text not null default 'not_started' check (status in ('passed','failed','blocked','not_started')),
  notes text,
  evidence_url text,
  environment text not null default 'unknown',
  build_number integer not null default 212,
  performed_by_staff_user_id uuid,
  performed_by_staff_email text,
  performed_at timestamptz not null default now(),
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists production_test_runs_test_key_performed_idx
  on public.production_test_runs (test_key, performed_at desc);

create index if not exists production_test_runs_status_performed_idx
  on public.production_test_runs (status, performed_at desc);

comment on table public.production_test_runs is
  'Build 212 guided acceptance-test outcomes. Do not store secrets, payment card data, customer addresses, or private incident evidence in notes/evidence_url.';
