-- Rosie Dazzlers Build 270 — server-only Web Push subscription authority
-- Applied to Development on 2026-08-29.
-- Reuses notification_events and customer_profiles preference fields.
-- Browser roles receive no direct table access; Cloudflare Functions use service_role.

alter table public.notification_events
  add column if not exists recipient_staff_user_id uuid null
  references public.staff_users(id) on delete set null;

create index if not exists idx_notification_events_staff_status_created
  on public.notification_events (recipient_staff_user_id, status, created_at desc)
  where recipient_staff_user_id is not null;

create table if not exists public.notification_push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  revoked_at timestamptz null,
  owner_type text not null,
  staff_user_id uuid null references public.staff_users(id) on delete cascade,
  customer_profile_id uuid null references public.customer_profiles(id) on delete cascade,
  endpoint text not null,
  p256dh text not null,
  auth_secret text not null,
  content_encoding text not null default 'aes128gcm',
  expires_at timestamptz null,
  user_agent text null,
  platform text null,
  timezone text not null default 'America/Toronto',
  push_enabled boolean not null default true,
  event_preferences jsonb not null default '{}'::jsonb,
  quiet_hours_start time null,
  quiet_hours_end time null,
  last_success_at timestamptz null,
  last_failure_at timestamptz null,
  last_error text null,
  constraint notification_push_subscriptions_owner_type_check
    check (owner_type in ('staff','customer')),
  constraint notification_push_subscriptions_exactly_one_owner_check
    check (
      (owner_type='staff' and staff_user_id is not null and customer_profile_id is null)
      or
      (owner_type='customer' and customer_profile_id is not null and staff_user_id is null)
    ),
  constraint notification_push_subscriptions_endpoint_key unique (endpoint)
);

create index if not exists idx_notification_push_subscriptions_staff_active
  on public.notification_push_subscriptions (staff_user_id, updated_at desc)
  where owner_type='staff' and push_enabled=true and revoked_at is null;

create index if not exists idx_notification_push_subscriptions_customer_active
  on public.notification_push_subscriptions (customer_profile_id, updated_at desc)
  where owner_type='customer' and push_enabled=true and revoked_at is null;

alter table public.notification_push_subscriptions enable row level security;

revoke all on table public.notification_push_subscriptions from public, anon, authenticated;
grant select, insert, update, delete on table public.notification_push_subscriptions to service_role;
