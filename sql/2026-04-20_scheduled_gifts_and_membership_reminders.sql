-- 2026-04-20 pass28
-- Scheduled e-gift delivery automation and reminder-first recurring maintenance.

alter table if exists public.membership_interest_requests add column if not exists reminder_opt_in boolean not null default true;
alter table if exists public.membership_interest_requests add column if not exists reminder_status text not null default 'pending';
alter table if exists public.membership_interest_requests add column if not exists reminder_count integer not null default 0;
alter table if exists public.membership_interest_requests add column if not exists last_reminder_at timestamptz null;
alter table if exists public.membership_interest_requests add column if not exists next_reminder_at timestamptz null;
create index if not exists membership_interest_requests_next_reminder_at_idx on public.membership_interest_requests (next_reminder_at);

-- Gift delivery automation intentionally reuses purchase_context JSON on public.gift_certificates
-- and public.notification_events for queued / sent / failed delivery audit data.
