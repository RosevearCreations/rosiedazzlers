-- Build 223 — DAIP private-MVP written design blueprint and independent-review queue.
--
-- This migration stores safe, design-level governance evidence only. It does not create a bucket,
-- storage policy, upload/download endpoint, signed URL, object key, queue, Worker, processor,
-- customer media route, public export, Gallery/Social/GBP handoff, or publishing control.
--
-- Run after Build 218, Build 219, and Build 222 in development/staging only. Browser roles are
-- deliberately denied direct access. Cloudflare Functions using the service role remain the only boundary.

begin;

create table if not exists public.daip_private_mvp_design_reviews (
  id uuid primary key default gen_random_uuid(),
  review_status text not null default 'draft' check (review_status in ('draft','submitted_for_independent_review','paused')),
  design_owner_label text not null check (char_length(design_owner_label) between 2 and 120),
  independent_reviewer_label text not null check (char_length(independent_reviewer_label) between 2 and 120),
  design_summary text not null check (char_length(design_summary) between 12 and 2400),
  threat_model_summary text not null check (char_length(threat_model_summary) between 12 and 2400),
  upload_control_summary text not null check (char_length(upload_control_summary) between 12 and 2400),
  storage_separation_summary text not null check (char_length(storage_separation_summary) between 12 and 2400),
  cost_telemetry_summary text not null check (char_length(cost_telemetry_summary) between 12 and 1600),
  rollback_acceptance_summary text not null check (char_length(rollback_acceptance_summary) between 12 and 1600),
  review_due_on date not null,
  readiness_review_id uuid null references public.daip_phase1_readiness_reviews(id) on delete restrict,
  readiness_authorization_valid boolean not null default false,
  zero_public_destination_confirmed boolean not null default false,
  no_customer_media_confirmed boolean not null default false,
  non_production_acknowledged boolean not null default false,
  gate_c_held boolean not null default true check (gate_c_held is true),
  submitted_by_staff_user_id uuid null references public.staff_users(id) on delete set null,
  submitted_by_staff_email text null check (submitted_by_staff_email is null or char_length(submitted_by_staff_email) <= 320),
  submitted_at timestamptz null,
  recorded_by_staff_user_id uuid null references public.staff_users(id) on delete set null,
  recorded_by_staff_email text null check (recorded_by_staff_email is null or char_length(recorded_by_staff_email) <= 320),
  created_at timestamptz not null default now(),
  check (
    (review_status = 'submitted_for_independent_review'
      and readiness_review_id is not null
      and readiness_authorization_valid is true
      and zero_public_destination_confirmed is true
      and no_customer_media_confirmed is true
      and non_production_acknowledged is true
      and submitted_at is not null)
    or (review_status in ('draft','paused') and submitted_at is null)
  )
);

create table if not exists public.daip_private_mvp_design_audit_events (
  id uuid primary key default gen_random_uuid(),
  design_review_id uuid not null references public.daip_private_mvp_design_reviews(id) on delete restrict,
  event_type text not null check (event_type in ('blueprint_drafted','blueprint_paused','blueprint_submitted_for_independent_review')),
  actor_staff_user_id uuid null references public.staff_users(id) on delete set null,
  actor_staff_email text null check (actor_staff_email is null or char_length(actor_staff_email) <= 320),
  safe_note text not null check (char_length(safe_note) between 3 and 600),
  created_at timestamptz not null default now()
);

create index if not exists daip_private_mvp_design_reviews_created_idx
  on public.daip_private_mvp_design_reviews (created_at desc);
create index if not exists daip_private_mvp_design_reviews_status_created_idx
  on public.daip_private_mvp_design_reviews (review_status, created_at desc);
create index if not exists daip_private_mvp_design_audit_events_review_created_idx
  on public.daip_private_mvp_design_audit_events (design_review_id, created_at desc);

alter table public.daip_private_mvp_design_reviews enable row level security;
alter table public.daip_private_mvp_design_audit_events enable row level security;

revoke all privileges on table public.daip_private_mvp_design_reviews from public, anon, authenticated;
revoke all privileges on table public.daip_private_mvp_design_audit_events from public, anon, authenticated;
grant all privileges on table public.daip_private_mvp_design_reviews to service_role;
grant all privileges on table public.daip_private_mvp_design_audit_events to service_role;

comment on table public.daip_private_mvp_design_reviews is
  'Build 223 DAIP private-MVP design blueprints. This is an independent-review queue only; Gate C stays held and the record cannot provision storage, upload/download, signed links, queues, workers, processing, customer media, exports, or publishing.';
comment on table public.daip_private_mvp_design_audit_events is
  'Build 223 DAIP design-blueprint audit trail. Store governance-safe text only; never credentials, URLs, bucket/object paths, customer data, addresses, VINs, payment data, private media, or incident evidence.';

commit;
