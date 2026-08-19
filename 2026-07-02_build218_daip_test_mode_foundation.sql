-- Build 218 — DAIP internal-test foundation.
--
-- This migration deliberately does NOT create a public media route, storage bucket,
-- signed URL issuer, upload endpoint, worker, proxy, AI service, export process, or
-- publication integration. It gives Rosie Dazzlers a private, auditable test registry
-- so owners can prove the DAIP safety process with harmless internal test media first.
--
-- Run only after Build 214 RLS containment is active. Browser clients continue to use
-- protected Cloudflare Functions; service_role is the only database-facing application role.

begin;

create table if not exists public.daip_test_control (
  singleton boolean primary key default true check (singleton is true),
  mode text not null default 'internal_test' check (mode = 'internal_test'),
  storage_provisioned boolean not null default false check (storage_provisioned is false),
  worker_enabled boolean not null default false check (worker_enabled is false),
  public_export_enabled boolean not null default false check (public_export_enabled is false),
  automatic_publishing_enabled boolean not null default false check (automatic_publishing_enabled is false),
  notes text not null default 'Build 218 internal test only. No customer media, public exports, worker execution, or automatic publishing.',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.daip_test_control (singleton)
values (true)
on conflict (singleton) do nothing;

create table if not exists public.daip_test_daily_sequences (
  job_date date primary key,
  next_number integer not null default 0 check (next_number >= 0),
  updated_at timestamptz not null default now()
);

create table if not exists public.daip_media_jobs (
  id uuid primary key default gen_random_uuid(),
  job_code text not null unique check (job_code ~ '^RD-TEST-[0-9]{8}-[0-9]{3,}$'),
  test_booking_reference text not null check (test_booking_reference ~ '^RD-TEST-BOOKING-[A-Z0-9-]{3,80}$'),
  safe_label text not null check (char_length(safe_label) between 3 and 160),
  job_date date not null default current_date,
  status text not null default 'created' check (status in ('created','intake_ready','privacy_review_required','internal_review_complete','archived')),
  test_mode boolean not null default true check (test_mode is true),
  internal_test_only boolean not null default true check (internal_test_only is true),
  contains_customer_data boolean not null default false check (contains_customer_data is false),
  contains_incident_material boolean not null default false check (contains_incident_material is false),
  public_export_blocked boolean not null default true check (public_export_blocked is true),
  processor_execution_blocked boolean not null default true check (processor_execution_blocked is true),
  storage_mode text not null default 'metadata_only' check (storage_mode = 'metadata_only'),
  consent_scope text not null default 'internal_test_only' check (consent_scope = 'internal_test_only'),
  created_by_staff_user_id uuid null references public.staff_users(id) on delete set null,
  archived_by_staff_user_id uuid null references public.staff_users(id) on delete set null,
  archived_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.daip_media_assets (
  id uuid primary key default gen_random_uuid(),
  media_job_id uuid not null references public.daip_media_jobs(id) on delete cascade,
  safe_filename text not null check (safe_filename !~ '[\\/]' and char_length(safe_filename) between 1 and 160),
  asset_kind text not null check (asset_kind in ('test_photo','test_video')),
  capture_stage text not null check (capture_stage in ('before','process','after','other')),
  mime_type text not null check (mime_type in ('image/jpeg','image/png','image/webp','video/mp4','video/quicktime')),
  file_size_bytes bigint not null default 0 check (file_size_bytes >= 0 and file_size_bytes <= 10737418240),
  source_reference_label text not null check (char_length(source_reference_label) between 3 and 240),
  source_mode text not null default 'metadata_only' check (source_mode = 'metadata_only'),
  storage_status text not null default 'not_uploaded' check (storage_status = 'not_uploaded'),
  checksum_sha256 text null check (checksum_sha256 is null or checksum_sha256 ~ '^[A-Fa-f0-9]{64}$'),
  privacy_status text not null default 'not_reviewed' check (privacy_status in ('not_reviewed','manual_review_required','internal_only_cleared','blocked_private')),
  public_export_blocked boolean not null default true check (public_export_blocked is true),
  registered_by_staff_user_id uuid null references public.staff_users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (media_job_id, safe_filename)
);

create table if not exists public.daip_processing_tasks (
  id uuid primary key default gen_random_uuid(),
  media_job_id uuid not null references public.daip_media_jobs(id) on delete cascade,
  task_type text not null check (task_type in ('intake_validation','private_storage_plan','manual_privacy_review','worker_preflight')),
  status text not null default 'not_scheduled' check (status in ('not_scheduled','blocked_pending_worker','ready_for_manual_review','cancelled')),
  execution_blocked boolean not null default true check (execution_blocked is true),
  attempts integer not null default 0 check (attempts = 0),
  safe_note text null check (safe_note is null or char_length(safe_note) <= 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (media_job_id, task_type)
);

create table if not exists public.daip_privacy_reviews (
  id uuid primary key default gen_random_uuid(),
  media_asset_id uuid not null unique references public.daip_media_assets(id) on delete cascade,
  review_status text not null default 'not_started' check (review_status in ('not_started','manual_review_required','internal_only_cleared','blocked_private')),
  reviewer_note text null check (reviewer_note is null or char_length(reviewer_note) <= 2000),
  reviewer_staff_user_id uuid null references public.staff_users(id) on delete set null,
  public_export_blocked boolean not null default true check (public_export_blocked is true),
  reviewed_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.daip_audit_events (
  id uuid primary key default gen_random_uuid(),
  media_job_id uuid null references public.daip_media_jobs(id) on delete cascade,
  media_asset_id uuid null references public.daip_media_assets(id) on delete cascade,
  actor_staff_user_id uuid null references public.staff_users(id) on delete set null,
  event_type text not null check (event_type in ('test_job_created','test_asset_registered','privacy_review_saved','test_job_archived','test_task_seeded')),
  reason text null check (reason is null or char_length(reason) <= 1000),
  safe_metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists daip_media_jobs_status_created_idx
  on public.daip_media_jobs (status, created_at desc);
create index if not exists daip_media_jobs_test_reference_idx
  on public.daip_media_jobs (test_booking_reference, created_at desc);
create index if not exists daip_media_assets_job_created_idx
  on public.daip_media_assets (media_job_id, created_at asc);
create index if not exists daip_processing_tasks_job_status_idx
  on public.daip_processing_tasks (media_job_id, status, created_at asc);
create index if not exists daip_privacy_reviews_status_idx
  on public.daip_privacy_reviews (review_status, reviewed_at asc nulls first);
create index if not exists daip_audit_events_job_created_idx
  on public.daip_audit_events (media_job_id, created_at asc);

create or replace function public.daip_next_test_job_code(p_job_date date default current_date)
returns text
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_date date := coalesce(p_job_date, current_date);
  v_number integer;
begin
  insert into public.daip_test_daily_sequences (job_date, next_number, updated_at)
  values (v_date, 1, now())
  on conflict (job_date) do update
    set next_number = public.daip_test_daily_sequences.next_number + 1,
        updated_at = now()
  returning next_number into v_number;

  return 'RD-TEST-' || to_char(v_date, 'YYYYMMDD') || '-' || lpad(v_number::text, 3, '0');
end;
$$;

-- The test-control row is intentionally not editable through the app. Moving to a
-- different mode requires a separately reviewed future migration and owner approval.
update public.daip_test_control
set mode = 'internal_test', storage_provisioned = false, worker_enabled = false,
    public_export_enabled = false, automatic_publishing_enabled = false,
    updated_at = now()
where singleton = true;

alter table public.daip_test_control enable row level security;
alter table public.daip_test_daily_sequences enable row level security;
alter table public.daip_media_jobs enable row level security;
alter table public.daip_media_assets enable row level security;
alter table public.daip_processing_tasks enable row level security;
alter table public.daip_privacy_reviews enable row level security;
alter table public.daip_audit_events enable row level security;

revoke all privileges on table public.daip_test_control from public, anon, authenticated;
revoke all privileges on table public.daip_test_daily_sequences from public, anon, authenticated;
revoke all privileges on table public.daip_media_jobs from public, anon, authenticated;
revoke all privileges on table public.daip_media_assets from public, anon, authenticated;
revoke all privileges on table public.daip_processing_tasks from public, anon, authenticated;
revoke all privileges on table public.daip_privacy_reviews from public, anon, authenticated;
revoke all privileges on table public.daip_audit_events from public, anon, authenticated;

grant all privileges on table public.daip_test_control to service_role;
grant all privileges on table public.daip_test_daily_sequences to service_role;
grant all privileges on table public.daip_media_jobs to service_role;
grant all privileges on table public.daip_media_assets to service_role;
grant all privileges on table public.daip_processing_tasks to service_role;
grant all privileges on table public.daip_privacy_reviews to service_role;
grant all privileges on table public.daip_audit_events to service_role;
revoke all on function public.daip_next_test_job_code(date) from public, anon, authenticated;
grant execute on function public.daip_next_test_job_code(date) to service_role;

comment on table public.daip_test_control is
  'Build 218 DAIP test-mode hard stop. All flags intentionally enforce internal-test/no-storage/no-worker/no-public-export/no-auto-publish.';
comment on table public.daip_media_jobs is
  'Build 218 internal DAIP test-job registry. No customer data, incident media, public export, storage path, or worker execution is allowed.';
comment on table public.daip_media_assets is
  'Build 218 DAIP metadata-only test asset registry. Deliberately has no public URL, signed URL, bucket, or storage key column.';
comment on table public.daip_processing_tasks is
  'Build 218 DAIP non-executing planning queue. All tasks remain execution_blocked until a future reviewed worker phase.';
comment on table public.daip_privacy_reviews is
  'Build 218 internal-only privacy review record. It cannot approve public export.';
comment on table public.daip_audit_events is
  'Build 218 DAIP audit trail. Store only safe metadata; never secrets, signed URLs, customer data, addresses, VINs, payment data, or incident evidence.';

commit;
