-- 2026-04-30 job time entries compatibility patch
-- Fixes live databases that have job_time_entries but were created before the manual minutes column was added.
-- Safe to run more than once.

alter table if exists public.job_time_entries
  add column if not exists minutes numeric(10,2) not null default 0;

alter table if exists public.job_time_entries
  add column if not exists staff_name text null;

alter table if exists public.job_time_entries
  add column if not exists created_by_name text null;

alter table if exists public.job_time_entries
  add column if not exists source text not null default 'admin';

create index if not exists job_time_entries_booking_staff_event_idx
  on public.job_time_entries(booking_id, staff_user_id, created_at desc);

create index if not exists job_time_entries_staff_created_idx
  on public.job_time_entries(staff_user_id, created_at desc);
