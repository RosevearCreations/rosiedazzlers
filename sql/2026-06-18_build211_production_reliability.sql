-- Build 211 — production reliability hardening.
-- Adds safe metadata for provider tests, hosted final-balance checkout links,
-- storage-retention review, and production reliability audit snapshots.

alter table if exists public.final_balance_payment_requests
  add column if not exists provider text default 'manual',
  add column if not exists provider_status text,
  add column if not exists checkout_url text,
  add column if not exists external_checkout_id text,
  add column if not exists checkout_created_at timestamptz,
  add column if not exists payment_url text,
  add column if not exists paid_at timestamptz;

alter table if exists public.job_media
  add column if not exists retention_status text default 'active',
  add column if not exists updated_at timestamptz default now();

alter table if exists public.live_upload_sessions
  add column if not exists file_size_bytes bigint,
  add column if not exists content_type text,
  add column if not exists media_kind text,
  add column if not exists retry_count integer default 0,
  add column if not exists last_error text,
  add column if not exists progress_percent integer default 0,
  add column if not exists completed_at timestamptz;

create table if not exists public.notification_provider_test_logs (
  id uuid primary key default gen_random_uuid(),
  channel text not null,
  recipient text,
  ok boolean not null default false,
  error text,
  provider_response jsonb,
  staff_user_id uuid,
  created_at timestamptz not null default now()
);

create index if not exists notification_provider_test_logs_created_idx
  on public.notification_provider_test_logs (created_at desc);

create table if not exists public.storage_retention_audit (
  id uuid primary key default gen_random_uuid(),
  job_media_id uuid,
  booking_id uuid,
  action text not null,
  dry_run boolean not null default true,
  details jsonb not null default '{}'::jsonb,
  staff_user_id uuid,
  created_at timestamptz not null default now()
);

create index if not exists storage_retention_audit_booking_idx
  on public.storage_retention_audit (booking_id, created_at desc);

create index if not exists storage_retention_audit_media_idx
  on public.storage_retention_audit (job_media_id, created_at desc);

create table if not exists public.production_reliability_audits (
  id uuid primary key default gen_random_uuid(),
  audit_kind text not null default 'manual_report',
  status text not null default 'generated',
  counts jsonb not null default '{}'::jsonb,
  checks jsonb not null default '[]'::jsonb,
  attention jsonb not null default '[]'::jsonb,
  created_by_staff_user_id uuid,
  created_at timestamptz not null default now()
);

create index if not exists production_reliability_audits_created_idx
  on public.production_reliability_audits (created_at desc);

comment on table public.production_reliability_audits is
  'Build 211 production-readiness snapshots for provider/payment/upload/retention/end-to-end diagnostics.';
