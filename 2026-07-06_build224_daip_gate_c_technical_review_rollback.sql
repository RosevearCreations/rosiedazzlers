-- Build 224 — DAIP Gate C technical-review and rollback acceptance evidence.
-- Test-only review records; this migration creates no media storage, upload/download authorization,
-- object path, worker, queue, processing, customer-media route, public destination, or publishing control.
begin;
create table if not exists public.daip_gate_c_technical_reviews (
  id uuid primary key default gen_random_uuid(),
  review_status text not null default 'draft' check (review_status in ('draft','blocked','accepted_for_test_only_implementation_review')),
  technical_owner_label text not null check (char_length(technical_owner_label) between 2 and 120),
  independent_reviewer_label text not null check (char_length(independent_reviewer_label) between 2 and 120),
  acceptance_scope_summary text not null check (char_length(acceptance_scope_summary) between 12 and 2400),
  rollback_plan_summary text not null check (char_length(rollback_plan_summary) between 12 and 2400),
  failure_test_summary text not null check (char_length(failure_test_summary) between 12 and 2000),
  cost_stop_validation_summary text not null check (char_length(cost_stop_validation_summary) between 12 and 1600),
  review_due_on date not null,
  design_review_id uuid null references public.daip_private_mvp_design_reviews(id) on delete restrict,
  design_submission_valid boolean not null default false,
  zero_public_destination_confirmed boolean not null default false,
  no_customer_media_confirmed boolean not null default false,
  technical_capabilities_still_disabled boolean not null default false,
  gate_c_held boolean not null default true check (gate_c_held is true),
  accepted_by_staff_user_id uuid null references public.staff_users(id) on delete set null,
  accepted_by_staff_email text null check (accepted_by_staff_email is null or char_length(accepted_by_staff_email) <= 320),
  accepted_at timestamptz null,
  recorded_by_staff_user_id uuid null references public.staff_users(id) on delete set null,
  recorded_by_staff_email text null check (recorded_by_staff_email is null or char_length(recorded_by_staff_email) <= 320),
  created_at timestamptz not null default now(),
  check ((review_status='accepted_for_test_only_implementation_review' and design_review_id is not null and design_submission_valid is true and zero_public_destination_confirmed is true and no_customer_media_confirmed is true and technical_capabilities_still_disabled is true and accepted_at is not null) or (review_status in ('draft','blocked') and accepted_at is null))
);
create table if not exists public.daip_gate_c_technical_review_audit_events (
  id uuid primary key default gen_random_uuid(), technical_review_id uuid not null references public.daip_gate_c_technical_reviews(id) on delete restrict,
  event_type text not null check (event_type in ('technical_review_drafted','technical_review_blocked','technical_review_accepted_for_test_only')),
  actor_staff_user_id uuid null references public.staff_users(id) on delete set null,
  actor_staff_email text null check (actor_staff_email is null or char_length(actor_staff_email) <= 320),
  safe_note text not null check (char_length(safe_note) between 3 and 600), created_at timestamptz not null default now()
);
create index if not exists daip_gate_c_technical_reviews_created_idx on public.daip_gate_c_technical_reviews(created_at desc);
create index if not exists daip_gate_c_technical_review_audit_idx on public.daip_gate_c_technical_review_audit_events(technical_review_id,created_at desc);
alter table public.daip_gate_c_technical_reviews enable row level security;
alter table public.daip_gate_c_technical_review_audit_events enable row level security;
revoke all privileges on table public.daip_gate_c_technical_reviews from public, anon, authenticated;
revoke all privileges on table public.daip_gate_c_technical_review_audit_events from public, anon, authenticated;
grant all privileges on table public.daip_gate_c_technical_reviews to service_role;
grant all privileges on table public.daip_gate_c_technical_review_audit_events to service_role;
comment on table public.daip_gate_c_technical_reviews is 'Build 224 DAIP Gate C technical-review and rollback acceptance record. It records test-only design evidence and cannot enable storage, uploads, processing, customer media, public destinations, or publishing.';
comment on table public.daip_gate_c_technical_review_audit_events is 'Build 224 Gate C audit trail. Store plain-language review evidence only; never credentials, URLs, external service configuration, customer data, private media, payment data, or incident evidence.';
commit;
