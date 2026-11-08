-- Build 811: private customer worksite concern intake and staff disposition.
-- Supabase hosted migration history version: 20261108141300.
-- Only server-side verified customer/staff sessions may use the service-role API.
-- Browser anon/authenticated roles have no table access; this is not a notification,
-- booking-change, dispatch, payment, or approval mechanism.
create table if not exists public.customer_worksite_issues_v811 (
  id uuid primary key default gen_random_uuid(),
  customer_profile_id uuid not null references public.customer_profiles(id) on delete restrict,
  booking_id uuid not null references public.bookings(id) on delete restrict,
  client_request_id uuid not null,
  category text not null check (category in (
    'parking_access', 'site_rules', 'utilities_restriction', 'weather',
    'vehicle_condition', 'arrival_contact', 'other'
  )),
  customer_description text not null check (char_length(customer_description) between 15 and 1000),
  status text not null default 'pending_review' check (status in (
    'pending_review', 'reviewing', 'resolved', 'closed_no_action'
  )),
  submitted_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by_staff_user_id uuid,
  staff_private_note text check (staff_private_note is null or char_length(staff_private_note) <= 800),
  customer_visible_resolution text check (customer_visible_resolution is null or char_length(customer_visible_resolution) <= 1000),
  constraint build811_unique_customer_retry unique (customer_profile_id, client_request_id)
);

create unique index if not exists build811_one_open_issue_per_booking
  on public.customer_worksite_issues_v811 (booking_id)
  where status in ('pending_review', 'reviewing');
create index if not exists build811_customer_issue_history
  on public.customer_worksite_issues_v811 (customer_profile_id, submitted_at desc);
create index if not exists build811_staff_issue_queue
  on public.customer_worksite_issues_v811 (status, submitted_at desc);

alter table public.customer_worksite_issues_v811 enable row level security;
revoke all on public.customer_worksite_issues_v811 from public, anon, authenticated;
grant select, insert, update on public.customer_worksite_issues_v811 to service_role;
comment on table public.customer_worksite_issues_v811 is
  'Build 811: separately reviewed appointment worksite issues; no direct client access and no automatic booking, payment, dispatch or outreach actions.';
