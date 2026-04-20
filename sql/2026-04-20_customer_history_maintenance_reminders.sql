-- 2026-04-20_customer_history_maintenance_reminders.sql
-- Move recurring maintenance reminders from interest-list timing to customer-history timing.

begin;

alter table if exists public.customer_profiles add column if not exists maintenance_reminder_opt_in boolean not null default true;
alter table if exists public.customer_profiles add column if not exists maintenance_cycle_days integer null;
alter table if exists public.customer_profiles add column if not exists maintenance_last_service_at timestamptz null;
alter table if exists public.customer_profiles add column if not exists maintenance_last_reminder_at timestamptz null;
alter table if exists public.customer_profiles add column if not exists maintenance_next_reminder_at timestamptz null;
alter table if exists public.customer_profiles add column if not exists maintenance_reminder_status text not null default ''pending'';
alter table if exists public.customer_profiles add column if not exists maintenance_reminder_count integer not null default 0;

create index if not exists customer_profiles_maintenance_next_reminder_at_idx on public.customer_profiles (maintenance_next_reminder_at);
create index if not exists customer_profiles_maintenance_last_service_at_idx on public.customer_profiles (maintenance_last_service_at desc);

commit;
