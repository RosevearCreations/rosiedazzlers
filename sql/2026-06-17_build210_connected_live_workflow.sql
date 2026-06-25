-- Build 210: connected live-detail workflow hardening.
-- Adds unread state, upload resilience metadata, recommendation approvals,
-- proof-of-work media gates, completion summaries, safe review gating,
-- and reusable approved-media queues.

alter table if exists public.bookings
  add column if not exists progress_last_staff_viewed_at timestamptz null,
  add column if not exists progress_last_customer_notified_at timestamptz null,
  add column if not exists progress_last_staff_notified_at timestamptz null,
  add column if not exists completed_summary_status text not null default 'not_generated',
  add column if not exists completed_summary_generated_at timestamptz null,
  add column if not exists review_request_blocked_reason text null;

alter table if exists public.job_updates
  add column if not exists recommendation_title text null,
  add column if not exists recommendation_amount_cents integer null,
  add column if not exists recommendation_status text null,
  add column if not exists customer_decision text null,
  add column if not exists customer_decision_at timestamptz null,
  add column if not exists customer_decision_note text null,
  add column if not exists linked_incident_report_id uuid null,
  add column if not exists linked_payment_request_id uuid null;

alter table if exists public.job_media
  add column if not exists duration_seconds numeric(10,2) null,
  add column if not exists upload_status text not null default 'complete',
  add column if not exists upload_session_id uuid null,
  add column if not exists retention_policy text not null default 'standard_365_days',
  add column if not exists retention_expires_at timestamptz null,
  add column if not exists gallery_reuse_status text not null default 'not_queued',
  add column if not exists vehicle_history_reuse_status text not null default 'not_queued';

alter table if exists public.proof_of_work_checklists
  add column if not exists required_media_stages jsonb not null default '["arrival","during","final"]'::jsonb,
  add column if not exists media_stage_status jsonb not null default '{}'::jsonb,
  add column if not exists ready_to_complete boolean not null default false,
  add column if not exists completion_override_reason text null,
  add column if not exists completion_override_by uuid null,
  add column if not exists completion_override_at timestamptz null;

create table if not exists public.live_upload_sessions (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null,
  staff_user_id uuid null,
  filename text not null,
  content_type text null,
  file_size_bytes bigint null,
  duration_seconds numeric(10,2) null,
  storage_bucket text null,
  storage_path text null,
  status text not null default 'prepared',
  progress_percent integer not null default 0,
  retry_count integer not null default 0,
  last_error text null,
  retention_policy text not null default 'standard_365_days',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz null,
  cancelled_at timestamptz null
);

create table if not exists public.completed_job_summaries (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null unique,
  customer_profile_id uuid null,
  vehicle_id uuid null,
  status text not null default 'draft',
  summary_title text not null,
  service_summary text null,
  proof_items jsonb not null default '[]'::jsonb,
  products_used jsonb not null default '[]'::jsonb,
  care_advice jsonb not null default '[]'::jsonb,
  maintenance_recommendations jsonb not null default '[]'::jsonb,
  invoice_reference text null,
  payment_status text null,
  customer_visible boolean not null default false,
  generated_by_staff_user_id uuid null,
  generated_by_staff_name text null,
  generated_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.gallery_media_candidates (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null,
  job_media_id uuid not null,
  media_url text null,
  storage_bucket text null,
  storage_path text null,
  caption text null,
  stage text null,
  consent_status text not null default 'needs_pairing_review',
  status text not null default 'queued',
  queued_by_staff_user_id uuid null,
  queued_by_staff_name text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(job_media_id)
);

create index if not exists live_upload_sessions_booking_idx on public.live_upload_sessions (booking_id, updated_at desc);
create index if not exists completed_job_summaries_booking_idx on public.completed_job_summaries (booking_id);
create index if not exists gallery_media_candidates_status_idx on public.gallery_media_candidates (status, created_at desc);
create index if not exists job_updates_recommendation_idx on public.job_updates (booking_id, recommendation_status, created_at desc);
create index if not exists job_media_reuse_idx on public.job_media (booking_id, gallery_reuse_status, vehicle_history_reuse_status);

comment on column public.job_media.retention_policy is 'temporary_90_days, standard_365_days, permanent_proof, or legal_hold.';
comment on column public.job_updates.customer_decision is 'approved, declined, or needs_discussion for customer-visible recommendations.';
comment on table public.completed_job_summaries is 'Customer-safe closeout package containing proof, invoice/payment state, care advice, and maintenance recommendations.';

-- Ensure one proof checklist summary per booking and preserve source links when issue updates become incidents.
create unique index if not exists proof_of_work_checklists_booking_uidx
  on public.proof_of_work_checklists(booking_id);

alter table if exists public.incident_reports
  add column if not exists source_job_update_id uuid references public.job_updates(id) on delete set null,
  add column if not exists source_job_media_id uuid references public.job_media(id) on delete set null;

create index if not exists incident_reports_source_job_update_idx
  on public.incident_reports(source_job_update_id)
  where source_job_update_id is not null;
