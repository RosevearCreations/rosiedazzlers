-- 2026-04-16 crew time / payroll support
-- Adds staff schema coverage, availability blocks, payroll runs, and payroll account seeds.

create table if not exists public.staff_users (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  full_name text not null,
  email text not null unique,
  role_code text not null default 'detailer' check (role_code in ('admin','senior_detailer','detailer')),
  is_active boolean not null default true,
  password_hash text null,
  can_override_lower_entries boolean not null default false,
  can_manage_bookings boolean not null default false,
  can_manage_blocks boolean not null default false,
  can_manage_progress boolean not null default false,
  can_manage_promos boolean not null default false,
  can_manage_staff boolean not null default false,
  preferred_contact_name text null,
  sms_phone text null,
  phone text null,
  address_line1 text null,
  address_line2 text null,
  city text null,
  province text null,
  postal_code text null,
  employee_code text null,
  position_title text null,
  hire_date date null,
  emergency_contact_name text null,
  emergency_contact_phone text null,
  vehicle_notes text null,
  vehicle_info jsonb not null default '{}'::jsonb,
  notes text null,
  department text null,
  admin_level text null,
  pay_schedule text null,
  hourly_rate_cents integer not null default 0,
  max_hours_per_day numeric(6,2) not null default 8,
  max_hours_per_week numeric(6,2) not null default 40,
  payroll_enabled boolean not null default true,
  payroll_notes text null,
  preferred_work_hours jsonb not null default '{}'::jsonb,
  admin_private_notes text null,
  detailer_level text null,
  permissions_profile jsonb not null default '{}'::jsonb,
  personal_admin_notes text null,
  tips_payout_notes text null,
  supervisor_staff_user_id uuid null references public.staff_users(id) on delete set null
);

create table if not exists public.job_time_entries (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  staff_user_id uuid null references public.staff_users(id) on delete set null,
  staff_name text null,
  created_by_name text null,
  source text not null default 'admin',
  entry_type text not null,
  minutes numeric(10,2) not null default 0,
  event_time timestamptz null,
  note text null
);

create table if not exists public.staff_availability_blocks (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  staff_user_id uuid not null references public.staff_users(id) on delete cascade,
  start_at timestamptz not null,
  end_at timestamptz not null,
  availability_type text not null default 'unavailable' check (availability_type in ('unavailable','vacation','sick','training','light_duty')),
  note text null,
  created_by_name text null,
  created_by_staff_user_id uuid null references public.staff_users(id) on delete set null
);

alter table if exists public.staff_users add column if not exists max_hours_per_day numeric(6,2) not null default 8;
alter table if exists public.staff_users add column if not exists max_hours_per_week numeric(6,2) not null default 40;
alter table if exists public.staff_users add column if not exists payroll_enabled boolean not null default true;
alter table if exists public.staff_users add column if not exists payroll_notes text null;

create table if not exists public.staff_payroll_runs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  period_start date not null,
  period_end date not null,
  status text not null default 'draft' check (status in ('draft','posted','cancelled')),
  staff_count integer not null default 0,
  total_hours numeric(12,2) not null default 0,
  total_gross_cad numeric(12,2) not null default 0,
  note text null,
  accounting_entry_id uuid null references public.accounting_journal_entries(id) on delete set null,
  created_by_name text null,
  created_by_staff_user_id uuid null references public.staff_users(id) on delete set null,
  posted_at timestamptz null,
  posted_by_name text null,
  posted_by_staff_user_id uuid null references public.staff_users(id) on delete set null
);

create table if not exists public.staff_payroll_run_lines (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  payroll_run_id uuid not null references public.staff_payroll_runs(id) on delete cascade,
  staff_user_id uuid null references public.staff_users(id) on delete set null,
  staff_name text null,
  staff_email text null,
  line_order integer not null default 0,
  regular_hours numeric(12,2) not null default 0,
  overtime_hours numeric(12,2) not null default 0,
  total_hours numeric(12,2) not null default 0,
  scheduled_hours numeric(12,2) not null default 0,
  hourly_rate_cents integer not null default 0,
  gross_pay_cad numeric(12,2) not null default 0,
  booking_count integer not null default 0,
  availability_conflicts integer not null default 0,
  is_overworked boolean not null default false,
  note text null
);

insert into public.accounting_accounts (code, sort_order, label, account_type, account_group, normal_balance, is_active, is_system, notes) values
('payroll_expense',250,'Payroll Expense','expense','direct_labor','debit',true,true,'Crew payroll cost posted from payroll runs.'),
('wages_payable',85,'Wages Payable','liability','current_liability','credit',true,true,'Crew payroll payable created when payroll runs are posted before payout.')
on conflict (code) do update set
  sort_order = excluded.sort_order,
  label = excluded.label,
  account_type = excluded.account_type,
  account_group = excluded.account_group,
  normal_balance = excluded.normal_balance,
  is_active = excluded.is_active,
  is_system = excluded.is_system,
  notes = excluded.notes,
  updated_at = now();

create index if not exists staff_users_role_active_idx on public.staff_users(role_code, is_active, full_name);
create index if not exists job_time_entries_booking_staff_event_idx on public.job_time_entries(booking_id, staff_user_id, created_at desc);
create index if not exists job_time_entries_staff_created_idx on public.job_time_entries(staff_user_id, created_at desc);
create index if not exists staff_availability_blocks_staff_window_idx on public.staff_availability_blocks(staff_user_id, start_at, end_at);
create index if not exists staff_payroll_runs_period_idx on public.staff_payroll_runs(period_start, period_end, status);
create index if not exists staff_payroll_run_lines_run_staff_idx on public.staff_payroll_run_lines(payroll_run_id, staff_user_id, line_order);
