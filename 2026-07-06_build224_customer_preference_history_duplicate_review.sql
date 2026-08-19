-- Build 224 — customer contact-preference history and duplicate-profile review safeguards.
-- Review only: this migration never merges profiles, changes consent, changes customer access, or exposes data publicly.
begin;
create table if not exists public.customer_contact_preference_events (
  id uuid primary key default gen_random_uuid(),
  customer_profile_id uuid not null references public.customer_profiles(id) on delete restrict,
  event_type text not null check (event_type in ('contact_preferences_changed')),
  old_snapshot jsonb not null default '{}'::jsonb,
  new_snapshot jsonb not null default '{}'::jsonb,
  actor_staff_user_id uuid null references public.staff_users(id) on delete set null,
  actor_staff_email text null check (actor_staff_email is null or char_length(actor_staff_email) <= 320),
  safe_summary text not null check (char_length(safe_summary) between 3 and 500),
  created_at timestamptz not null default now()
);
create index if not exists customer_contact_preference_events_profile_idx on public.customer_contact_preference_events(customer_profile_id,created_at desc);
alter table public.customer_contact_preference_events enable row level security;
revoke all privileges on table public.customer_contact_preference_events from public, anon, authenticated;
grant all privileges on table public.customer_contact_preference_events to service_role;
comment on table public.customer_contact_preference_events is 'Build 224 safe staff audit history of operational notification and live-update preference changes. It is not a consent source and never changes customer records itself.';
commit;
