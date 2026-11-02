-- Build 742: authenticated customer change-request inbox, never a booking mutation.
-- The customer-facing route uses a verified server-side session and a service-role
-- projection; browser and Supabase authenticated roles have no direct table grant.
create table if not exists public.customer_booking_change_requests (
  id uuid primary key default gen_random_uuid(),
  customer_profile_id uuid not null references public.customer_profiles(id) on delete restrict,
  booking_id uuid not null references public.bookings(id) on delete restrict,
  client_request_id uuid not null,
  request_type text not null check (request_type in ('reschedule', 'cancel')),
  status text not null default 'pending_review'
    check (status in ('pending_review', 'approved', 'declined', 'withdrawn')),
  preferred_service_date date,
  preferred_start_slot text,
  customer_reason text not null default '',
  customer_email_snapshot text not null,
  submitted_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by_staff_user_id uuid,
  staff_private_note text,
  customer_visible_resolution text,
  constraint build742_reschedule_requires_date check (
    (request_type = 'reschedule' and preferred_service_date is not null)
    or (request_type = 'cancel' and preferred_service_date is null and preferred_start_slot is null)
  ),
  constraint build742_unique_customer_retry unique (customer_profile_id, client_request_id)
);

create unique index if not exists build742_one_pending_request_per_booking
  on public.customer_booking_change_requests (booking_id)
  where status = 'pending_review';
create index if not exists build742_customer_request_history
  on public.customer_booking_change_requests (customer_profile_id, submitted_at desc);

alter table public.customer_booking_change_requests enable row level security;
revoke all on public.customer_booking_change_requests from anon, authenticated;
grant select, insert, update on public.customer_booking_change_requests to service_role;
comment on table public.customer_booking_change_requests is
  'Build 742: staff-reviewed customer cancellation/reschedule requests; inserts never mutate bookings, payment, availability or notification tables.';
