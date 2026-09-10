-- Build 373 — Fleet Account Operations.
-- Additive staff-only operational records. No fleet pricing, invoicing, payment-provider, recurring-billing, or booking mutation authority.

create table if not exists public.fleet_account_contacts (
  id uuid primary key default gen_random_uuid(),
  fleet_account_id uuid not null references public.fleet_accounts(id) on delete cascade,
  contact_name text not null,
  contact_title text null,
  email text null,
  phone text null,
  is_primary boolean not null default false,
  notes text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by_staff_user_id uuid null references public.staff_users(id) on delete set null,
  updated_by_staff_user_id uuid null references public.staff_users(id) on delete set null
);

create table if not exists public.fleet_account_vehicles (
  id uuid primary key default gen_random_uuid(),
  fleet_account_id uuid not null references public.fleet_accounts(id) on delete cascade,
  unit_reference text not null,
  vehicle_year integer null check (vehicle_year is null or vehicle_year between 1900 and 2100),
  make text null,
  model text null,
  body_style text null,
  plate_reference text null,
  active boolean not null default true,
  notes text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by_staff_user_id uuid null references public.staff_users(id) on delete set null,
  updated_by_staff_user_id uuid null references public.staff_users(id) on delete set null,
  unique(fleet_account_id, unit_reference)
);

create table if not exists public.fleet_request_groups (
  id uuid primary key default gen_random_uuid(),
  fleet_account_id uuid not null references public.fleet_accounts(id) on delete cascade,
  group_reference text not null,
  title text null,
  requested_start_date date null,
  requested_end_date date null,
  po_reference text null,
  invoice_group_reference text null,
  status text not null default 'planning' check (status in ('planning','requested','scheduled','completed','cancelled')),
  notes text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by_staff_user_id uuid null references public.staff_users(id) on delete set null,
  updated_by_staff_user_id uuid null references public.staff_users(id) on delete set null,
  unique(fleet_account_id, group_reference),
  check (requested_end_date is null or requested_start_date is null or requested_end_date >= requested_start_date)
);

create table if not exists public.fleet_request_jobs (
  id uuid primary key default gen_random_uuid(),
  fleet_account_id uuid not null references public.fleet_accounts(id) on delete cascade,
  request_group_id uuid not null references public.fleet_request_groups(id) on delete cascade,
  vehicle_id uuid not null references public.fleet_account_vehicles(id) on delete restrict,
  booking_id uuid null references public.bookings(id) on delete set null,
  service_request text not null,
  status text not null default 'planning' check (status in ('planning','linked','scheduled','completed','cancelled')),
  notes text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by_staff_user_id uuid null references public.staff_users(id) on delete set null,
  updated_by_staff_user_id uuid null references public.staff_users(id) on delete set null
);

create table if not exists public.fleet_vehicle_service_history (
  id uuid primary key default gen_random_uuid(),
  fleet_account_id uuid not null references public.fleet_accounts(id) on delete cascade,
  vehicle_id uuid not null references public.fleet_account_vehicles(id) on delete restrict,
  booking_id uuid null references public.bookings(id) on delete set null,
  request_job_id uuid null references public.fleet_request_jobs(id) on delete set null,
  serviced_at timestamptz not null,
  service_summary text not null,
  notes text null,
  created_at timestamptz not null default now(),
  created_by_staff_user_id uuid null references public.staff_users(id) on delete set null
);

create index if not exists fleet_account_contacts_account_idx on public.fleet_account_contacts(fleet_account_id, is_primary desc, contact_name);
create index if not exists fleet_account_vehicles_account_idx on public.fleet_account_vehicles(fleet_account_id, active desc, unit_reference);
create index if not exists fleet_request_groups_account_idx on public.fleet_request_groups(fleet_account_id, created_at desc);
create index if not exists fleet_request_jobs_account_idx on public.fleet_request_jobs(fleet_account_id, created_at desc);
create index if not exists fleet_request_jobs_group_idx on public.fleet_request_jobs(request_group_id, created_at desc);
create index if not exists fleet_request_jobs_booking_idx on public.fleet_request_jobs(booking_id) where booking_id is not null;
create index if not exists fleet_vehicle_service_history_vehicle_idx on public.fleet_vehicle_service_history(vehicle_id, serviced_at desc);
create index if not exists fleet_vehicle_service_history_booking_idx on public.fleet_vehicle_service_history(booking_id) where booking_id is not null;

alter table public.fleet_account_contacts enable row level security;
alter table public.fleet_account_vehicles enable row level security;
alter table public.fleet_request_groups enable row level security;
alter table public.fleet_request_jobs enable row level security;
alter table public.fleet_vehicle_service_history enable row level security;

revoke all on table public.fleet_account_contacts from anon, authenticated;
revoke all on table public.fleet_account_vehicles from anon, authenticated;
revoke all on table public.fleet_request_groups from anon, authenticated;
revoke all on table public.fleet_request_jobs from anon, authenticated;
revoke all on table public.fleet_vehicle_service_history from anon, authenticated;
grant select, insert, update, delete on table public.fleet_account_contacts to service_role;
grant select, insert, update, delete on table public.fleet_account_vehicles to service_role;
grant select, insert, update, delete on table public.fleet_request_groups to service_role;
grant select, insert, update, delete on table public.fleet_request_jobs to service_role;
grant select, insert, update, delete on table public.fleet_vehicle_service_history to service_role;

comment on table public.fleet_account_contacts is 'Build 373 staff-only fleet business contacts; no billing authority.';
comment on table public.fleet_account_vehicles is 'Build 373 staff-only fleet vehicle roster.';
comment on table public.fleet_request_groups is 'Build 373 operational grouping for fleet requests/jobs; PO and invoice-group references are metadata only.';
comment on table public.fleet_request_jobs is 'Build 373 fleet work planning records that may link to, but never create or mutate, canonical bookings.';
comment on table public.fleet_vehicle_service_history is 'Build 373 per-vehicle service history; financial amounts remain outside this table.';
