-- Build 213 — owner-action controls and customer-trust closeout.
-- Run after Builds 209–212. It adds task ownership/snoozing, customer acknowledgement
-- for priced in-job recommendations, completed-summary revision/audit support, and
-- optional walkaround/caption metadata. Do not store card data or private incident facts
-- in these fields.

create table if not exists public.owner_attention_tasks (
  id uuid primary key default gen_random_uuid(),
  source_type text not null default 'generated',
  source_key text not null,
  booking_id uuid null,
  title text not null,
  detail text null,
  urgency text not null default 'normal' check (urgency in ('urgent','high','normal','low')),
  status text not null default 'open' check (status in ('open','snoozed','resolved')),
  assigned_to_staff_user_id uuid null,
  assigned_to_staff_name text null,
  snoozed_until timestamptz null,
  suppress_source_until timestamptz null,
  resolution_note text null,
  resolved_at timestamptz null,
  resolved_by_staff_user_id uuid null,
  resolved_by_staff_name text null,
  created_by_staff_user_id uuid null,
  created_by_staff_name text null,
  last_action_by_staff_user_id uuid null,
  last_action_by_staff_name text null,
  last_action_at timestamptz null,
  target_url text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists owner_attention_tasks_source_idx on public.owner_attention_tasks (source_type, source_key, updated_at desc);
create index if not exists owner_attention_tasks_active_idx on public.owner_attention_tasks (status, snoozed_until, suppress_source_until, updated_at desc);

create table if not exists public.live_interaction_audit_events (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid null,
  event_type text not null,
  entity_type text null,
  entity_id uuid null,
  actor_name text null,
  detail text null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists live_interaction_audit_events_booking_idx on public.live_interaction_audit_events (booking_id, created_at asc);

alter table if exists public.job_updates
  add column if not exists customer_acknowledgement_name text null,
  add column if not exists customer_acknowledged_at timestamptz null,
  add column if not exists customer_acknowledgement_version text null,
  add column if not exists vehicle_area text null,
  add column if not exists condition_tag text null;

alter table if exists public.job_media
  add column if not exists vehicle_area text null,
  add column if not exists condition_tag text null,
  add column if not exists transcript_text text null,
  add column if not exists poster_storage_bucket text null,
  add column if not exists poster_storage_path text null;

create table if not exists public.recommendation_price_acknowledgements (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null,
  job_update_id uuid not null,
  payment_request_id uuid null,
  recommendation_title text null,
  amount_cents integer not null,
  acknowledgement_name text not null,
  acknowledgement_version text not null default 'in_job_add_on_terms_v1',
  acknowledged_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index if not exists recommendation_price_acknowledgements_booking_idx on public.recommendation_price_acknowledgements (booking_id, acknowledged_at desc);

alter table if exists public.completed_job_summaries
  add column if not exists revision_number integer not null default 1,
  add column if not exists customer_acknowledged_at timestamptz null,
  add column if not exists customer_acknowledged_name text null,
  add column if not exists customer_acknowledgement_version text null;

create table if not exists public.completed_job_summary_revisions (
  id uuid primary key default gen_random_uuid(),
  summary_id uuid not null,
  booking_id uuid not null,
  revision_number integer not null,
  snapshot jsonb not null,
  revised_by_staff_name text null,
  revised_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index if not exists completed_job_summary_revisions_booking_idx on public.completed_job_summary_revisions (booking_id, revised_at desc);

comment on table public.owner_attention_tasks is 'Build 213 owner task controls: assignment, snooze and temporary resolution of generated operational attention items.';
comment on table public.live_interaction_audit_events is 'Build 213 non-sensitive staff/audit event export stream for a booking. Never store secrets or private incident media.';
comment on table public.recommendation_price_acknowledgements is 'Customer typed-name acknowledgement of a priced in-job recommendation; not a substitute for legal advice or a signed contract where one is required.';
