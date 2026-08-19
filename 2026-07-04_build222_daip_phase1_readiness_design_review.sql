-- Build 222 — DAIP Phase 1 readiness record for written private-MVP design review.
--
-- This migration stores governance evidence only. A ready_for_design_review record authorizes
-- a written design review, not a storage bucket, file upload, signed link, worker, processing task,
-- customer-media route, export, Gallery/Social handoff, or public publishing capability.
--
-- Run after Build 218 internal test mode and Build 219 governance workspace in development/staging.
-- Browser roles are deliberately denied direct table access; Cloudflare Functions and the service role
-- remain the only application boundary.

begin;

create table if not exists public.daip_phase1_readiness_reviews (
  id uuid primary key default gen_random_uuid(),
  review_status text not null default 'draft' check (review_status in ('draft','ready_for_design_review','paused')),
  review_owner_label text not null check (char_length(review_owner_label) between 2 and 120),
  review_summary text not null check (char_length(review_summary) between 12 and 2400),
  budget_stop_rule_summary text not null check (char_length(budget_stop_rule_summary) between 12 and 1200),
  review_due_on date not null,
  consent_separation_confirmed boolean not null default false,
  retention_legal_hold_confirmed boolean not null default false,
  non_production_acknowledged boolean not null default false,
  gate_a_ready boolean not null default false,
  gate_b_ready boolean not null default false,
  decision_count integer not null default 0 check (decision_count between 0 and 12),
  test_passed_count integer not null default 0 check (test_passed_count between 0 and 3),
  test_control_safe boolean not null default false,
  approved_by_staff_user_id uuid null references public.staff_users(id) on delete set null,
  approved_by_staff_email text null check (approved_by_staff_email is null or char_length(approved_by_staff_email) <= 320),
  approved_at timestamptz null,
  recorded_by_staff_user_id uuid null references public.staff_users(id) on delete set null,
  recorded_by_staff_email text null check (recorded_by_staff_email is null or char_length(recorded_by_staff_email) <= 320),
  created_at timestamptz not null default now(),
  check (
    (review_status = 'ready_for_design_review' and gate_a_ready is true and gate_b_ready is true and consent_separation_confirmed is true and retention_legal_hold_confirmed is true and non_production_acknowledged is true and approved_at is not null)
    or (review_status in ('draft','paused') and approved_at is null)
  )
);

create table if not exists public.daip_phase1_readiness_audit_events (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references public.daip_phase1_readiness_reviews(id) on delete restrict,
  event_type text not null check (event_type in ('readiness_drafted','readiness_paused','written_design_review_authorized')),
  actor_staff_user_id uuid null references public.staff_users(id) on delete set null,
  actor_staff_email text null check (actor_staff_email is null or char_length(actor_staff_email) <= 320),
  safe_note text not null check (char_length(safe_note) between 3 and 500),
  created_at timestamptz not null default now()
);

create index if not exists daip_phase1_readiness_reviews_created_idx
  on public.daip_phase1_readiness_reviews (created_at desc);
create index if not exists daip_phase1_readiness_reviews_status_created_idx
  on public.daip_phase1_readiness_reviews (review_status, created_at desc);
create index if not exists daip_phase1_readiness_audit_events_review_created_idx
  on public.daip_phase1_readiness_audit_events (review_id, created_at desc);

alter table public.daip_phase1_readiness_reviews enable row level security;
alter table public.daip_phase1_readiness_audit_events enable row level security;

revoke all privileges on table public.daip_phase1_readiness_reviews from public, anon, authenticated;
revoke all privileges on table public.daip_phase1_readiness_audit_events from public, anon, authenticated;
grant all privileges on table public.daip_phase1_readiness_reviews to service_role;
grant all privileges on table public.daip_phase1_readiness_audit_events to service_role;

comment on table public.daip_phase1_readiness_reviews is
  'Build 222 DAIP Phase 1 readiness snapshots. A ready_for_design_review snapshot authorizes only a written private-MVP design review and cannot enable storage, uploads, signed links, workers, processing, customer media, exports, or publishing.';
comment on table public.daip_phase1_readiness_audit_events is
  'Build 222 DAIP readiness audit trail. Store governance-safe text only; never secrets, credentials, URLs, signed links, customer data, addresses, VINs, payment data, private media, or incident evidence.';

commit;
