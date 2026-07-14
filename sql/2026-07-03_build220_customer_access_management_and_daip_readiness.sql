-- Build 220 — controlled customer access management, recovery intake, and DAIP readiness evidence.
--
-- This migration turns the customer directory into a role-aware management surface
-- without allowing staff to see or set passwords. Customer deletion is archive-first
-- so booking, payment, tax, incident, and consent records keep their audit links.
-- DAIP remains governance/test-only: no bucket, storage key, upload URL, worker, processing task, customer asset route, export, or publishing capability is created.

begin;

alter table if exists public.customer_profiles
  add column if not exists archived_at timestamptz null;
alter table if exists public.customer_profiles
  add column if not exists archived_by_staff_user_id uuid null references public.staff_users(id) on delete set null;
alter table if exists public.customer_profiles
  add column if not exists archived_by_staff_email text null;
alter table if exists public.customer_profiles
  add column if not exists archive_reason text null;

create table if not exists public.customer_admin_audit_events (
  id uuid primary key default gen_random_uuid(),
  customer_profile_id uuid not null references public.customer_profiles(id) on delete restrict,
  event_type text not null check (event_type in (
    'profile_created','profile_updated','email_changed','password_reset_issued',
    'account_setup_issued','verification_issued','sessions_revoked','account_suspended',
    'account_reactivated','account_archived','account_restored'
  )),
  actor_staff_user_id uuid null references public.staff_users(id) on delete set null,
  actor_staff_email text null check (actor_staff_email is null or char_length(actor_staff_email) <= 320),
  safe_summary text not null check (char_length(safe_summary) between 3 and 500),
  created_at timestamptz not null default now()
);

create index if not exists customer_admin_audit_events_profile_created_idx
  on public.customer_admin_audit_events (customer_profile_id, created_at desc);

create table if not exists public.customer_account_recovery_requests (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  full_name_hint text null check (full_name_hint is null or char_length(full_name_hint) <= 160),
  phone_hint text null check (phone_hint is null or char_length(phone_hint) <= 60),
  email_hint text null check (email_hint is null or char_length(email_hint) <= 320),
  message text null check (message is null or char_length(message) <= 700),
  request_fingerprint text not null check (char_length(request_fingerprint) between 32 and 128),
  status text not null default 'queued' check (status in ('queued','reviewed','resolved','declined')),
  reviewed_at timestamptz null,
  reviewed_by_staff_user_id uuid null references public.staff_users(id) on delete set null,
  reviewed_by_staff_email text null check (reviewed_by_staff_email is null or char_length(reviewed_by_staff_email) <= 320),
  safe_resolution_note text null check (safe_resolution_note is null or char_length(safe_resolution_note) <= 500)
);

create index if not exists customer_account_recovery_requests_status_created_idx
  on public.customer_account_recovery_requests (status, created_at desc);
create index if not exists customer_account_recovery_requests_fingerprint_created_idx
  on public.customer_account_recovery_requests (request_fingerprint, created_at desc);

alter table public.customer_admin_audit_events enable row level security;
alter table public.customer_account_recovery_requests enable row level security;
alter table if exists public.customer_auth_sessions enable row level security;
alter table if exists public.customer_auth_tokens enable row level security;

revoke all privileges on table public.customer_admin_audit_events from public, anon, authenticated;
revoke all privileges on table public.customer_account_recovery_requests from public, anon, authenticated;
revoke all privileges on table public.customer_auth_sessions from public, anon, authenticated;
revoke all privileges on table public.customer_auth_tokens from public, anon, authenticated;

grant all privileges on table public.customer_admin_audit_events to service_role;
grant all privileges on table public.customer_account_recovery_requests to service_role;
grant all privileges on table public.customer_auth_sessions to service_role;
grant all privileges on table public.customer_auth_tokens to service_role;

comment on column public.customer_profiles.archived_at is
  'Build 220 archive-first account control. Archived customer profiles keep historical booking/payment/audit links and cannot sign in.';
comment on table public.customer_admin_audit_events is
  'Build 220 staff audit history for customer profile, access, and account lifecycle actions. Never store passwords, raw tokens, reset links, session tokens, payment data, or private media.';
comment on table public.customer_account_recovery_requests is
  'Build 220 customer sign-in-email assistance intake. This does not reveal whether an account exists and does not reset access automatically.';

commit;
