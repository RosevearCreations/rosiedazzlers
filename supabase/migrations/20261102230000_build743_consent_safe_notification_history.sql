-- Build 743 — append-only preference snapshots and staff-reported handoff outcomes.
-- No trigger, function or table grants direct dispatch/message privileges.
create table if not exists public.customer_communication_preference_versions (
  id uuid primary key default gen_random_uuid(),
  customer_profile_id uuid not null references public.customer_profiles(id) on delete restrict,
  client_request_id uuid not null,
  service_email boolean not null,
  service_sms boolean not null,
  service_phone boolean not null,
  marketing_email boolean not null default false,
  marketing_sms boolean not null default false,
  marketing_phone boolean not null default false,
  source text not null default 'customer_account' check (source = 'customer_account'),
  recorded_at timestamptz not null default now(),
  unique (customer_profile_id, client_request_id)
);

create index if not exists build743_customer_preference_timeline
  on public.customer_communication_preference_versions
  (customer_profile_id, recorded_at desc, id desc);
alter table public.customer_communication_preference_versions enable row level security;
revoke all on public.customer_communication_preference_versions from anon, authenticated;
grant select, insert on public.customer_communication_preference_versions to service_role;
comment on table public.customer_communication_preference_versions is
  'Customer-authenticated purpose/channel preferences with immutable audit history. Absent marketing consent is false; opting in never sends a message.';

create table if not exists public.customer_communication_handoff_audit (
  id uuid primary key default gen_random_uuid(),
  customer_profile_id uuid not null references public.customer_profiles(id) on delete restrict,
  client_request_id uuid not null,
  notification_event_id uuid references public.notification_events(id) on delete restrict,
  channel text not null check (channel in ('email', 'sms', 'phone')),
  purpose text not null check (purpose in ('service', 'marketing')),
  outcome text not null check (outcome in (
    'planned_not_contacted', 'blocked_by_preference', 'attempted_no_answer',
    'voicemail_left', 'customer_contacted', 'followup_requested'
  )),
  staff_actor_name text not null,
  note_summary text not null default '' check (char_length(note_summary) <= 240),
  staff_report_unverified boolean not null default true check (staff_report_unverified = true),
  provider_delivery_verified boolean not null default false check (provider_delivery_verified = false),
  outbound_dispatched boolean not null default false check (outbound_dispatched = false),
  recorded_at timestamptz not null default now(),
  unique (customer_profile_id, client_request_id)
);

create index if not exists build743_handoff_timeline
  on public.customer_communication_handoff_audit
  (customer_profile_id, channel, recorded_at desc);
alter table public.customer_communication_handoff_audit enable row level security;
revoke all on public.customer_communication_handoff_audit from anon, authenticated;
grant select, insert on public.customer_communication_handoff_audit to service_role;
comment on table public.customer_communication_handoff_audit is
  'Staff-reported contact attempts only; no provider receipt, customer notification or delivery proof is created.';
