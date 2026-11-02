-- Build 744: customer-initiated, deduplicated interest; no schedule, send or revenue authority.
create table if not exists public.customer_followup_interests_v744 (
  id uuid primary key default gen_random_uuid(),
  customer_profile_id uuid not null references public.customer_profiles(id) on delete restrict,
  source_booking_id uuid not null references public.bookings(id) on delete restrict,
  client_request_id uuid not null,
  interest_kind text not null check (interest_kind in ('rebook', 'maintenance', 'seasonal')),
  cycle_hint text not null default 'unsure' check (cycle_hint in ('unsure', 'quarterly', 'twice_yearly', 'seasonal')),
  interest_month text not null check (interest_month ~ '^[0-9]{4}-[0-9]{2}$'),
  customer_note text not null default '' check (char_length(customer_note) <= 300),
  submitted_at timestamptz not null default now(),
  consent_preference_version_id uuid references public.customer_communication_preference_versions(id) on delete restrict,
  consent_eligible_snapshot boolean not null default false,
  review_status text not null default 'pending_review' check (review_status = 'pending_review'),
  outreach_dispatched boolean not null default false check (outreach_dispatched = false),
  appointment_created boolean not null default false check (appointment_created = false),
  subscription_enrolled boolean not null default false check (subscription_enrolled = false),
  confirmed_revenue_cents integer not null default 0 check (confirmed_revenue_cents = 0),
  unique (customer_profile_id, client_request_id),
  unique (customer_profile_id, source_booking_id, interest_kind, interest_month)
);
create index if not exists build744_customer_interest_timeline
  on public.customer_followup_interests_v744(customer_profile_id, submitted_at desc);
create index if not exists build744_staff_interest_queue
  on public.customer_followup_interests_v744(submitted_at desc);
alter table public.customer_followup_interests_v744 enable row level security;
revoke all on public.customer_followup_interests_v744 from anon, authenticated;
grant select, insert on public.customer_followup_interests_v744 to service_role;
comment on table public.customer_followup_interests_v744 is
  'Interest separate from confirmed bookings, subscriptions, marketing sends, and revenue. Repeat interest for the same service/type/month is suppressed. Staff must recheck current consent before separate contact.';
