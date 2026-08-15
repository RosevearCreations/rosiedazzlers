-- sql/2026-04-10_booking_crew_assignments_and_app_shell_hardening.sql
--
-- Crew assignment support for bookings.
--
-- What this file does:
-- - adds booking_staff_assignments so one booking can have a crew, not just one assigned detailer
-- - keeps one lead / senior-on-job assignment by storing assignment_role = lead on the chosen crew member
-- - keeps cached staff name/email on each crew row for operational reporting even if a staff profile changes later
-- - adds supporting indexes for booking and staff lookups

begin;

create table if not exists public.booking_staff_assignments (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  staff_user_id uuid null references public.staff_users(id) on delete set null,
  staff_email text null,
  staff_name text null,
  assignment_role text not null default 'crew' check (assignment_role in ('lead','crew')),
  sort_order integer not null default 0,
  assigned_by_staff_user_id uuid null references public.staff_users(id) on delete set null,
  assigned_by_name text null,
  notes text null
);

create index if not exists idx_booking_staff_assignments_booking
  on public.booking_staff_assignments (booking_id, assignment_role, sort_order, created_at);

create index if not exists idx_booking_staff_assignments_staff_user
  on public.booking_staff_assignments (staff_user_id, booking_id);

create index if not exists idx_booking_staff_assignments_staff_email
  on public.booking_staff_assignments (staff_email, booking_id);

commit;
