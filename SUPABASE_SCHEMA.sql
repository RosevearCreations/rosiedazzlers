
-- -----------------------------
-- JOBSITE INTAKE (detailer pre-job inspection)
-- -----------------------------
create table if not exists public.jobsite_intake (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  detailer_name text null,

  exterior_condition_notes text null,
  interior_condition_notes text null,
  existing_damage_notes text null,

  valuables_present boolean null,
  valuables_notes text null,
  valuables_photo_urls jsonb not null default '[]'::jsonb,

  exterior_photo_urls jsonb not null default '[]'::jsonb,
  interior_photo_urls jsonb not null default '[]'::jsonb,
  damage_photo_urls jsonb not null default '[]'::jsonb,

  keys_collected boolean not null default false,
  owner_present_for_visual_inspection boolean not null default false,
  water_hookup_located boolean not null default false,
  water_tested boolean not null default false,
  power_hookup_located boolean not null default false,
  power_tested boolean not null default false,
  vehicle_accessible_and_safe boolean not null default false,

  garbage_bag_estimate text null,
  extra_bag_count integer null,
  extra_debris_charge_possible boolean null,
  extra_charge_notes text null,

  owner_name text null,
  owner_email text null,
  inspection_acknowledged boolean null,
  existing_condition_acknowledged boolean null,
  keys_handed_over_acknowledged boolean null,
  owner_notes text null,

  detailer_pre_job_notes text null,
  site_weather_notes text null,
  intake_complete text null,

  unique(booking_id)
);

create index if not exists jobsite_intake_booking_idx on public.jobsite_intake(booking_id);

alter table public.jobsite_intake enable row level security;
-- -----------------------------
-- STAFF USERS / ROLES / ACCESS TIERS
-- -----------------------------
create table if not exists public.staff_users (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  full_name text not null,
  email text not null unique,
  role_code text not null default 'detailer',         -- admin | senior_detailer | detailer
  is_active boolean not null default true,

  can_override_lower_entries boolean not null default false,
  can_manage_bookings boolean not null default false,
  can_manage_blocks boolean not null default false,
  can_manage_progress boolean not null default false,
  can_manage_promos boolean not null default false,
  can_manage_staff boolean not null default false,

  notes text null
);

create index if not exists staff_users_role_code_idx on public.staff_users(role_code);
create index if not exists staff_users_active_idx on public.staff_users(is_active);

alter table public.staff_users enable row level security;

-- -----------------------------
-- CUSTOMER TIERS
-- -----------------------------
create table if not exists public.customer_tiers (
  code text primary key,                                -- random | regular | silver | gold | vip
  sort_order integer not null default 100,
  label text not null,
  description text null,
  is_active boolean not null default true
);

insert into public.customer_tiers (code, sort_order, label, description, is_active)
values
  ('random', 100, 'Random Customer', 'One-off or unknown customer', true),
  ('regular', 80, 'Regular Customer', 'Returning customer', true),
  ('silver', 60, 'Silver Customer', 'Frequent returning customer', true),
  ('gold', 40, 'Gold Customer', 'High-value or priority customer', true),
  ('vip', 20, 'VIP Customer', 'Top-tier preferred customer', true)
on conflict (code) do update set
  sort_order = excluded.sort_order,
  label = excluded.label,
  description = excluded.description,
  is_active = excluded.is_active;

alter table public.customer_tiers enable row level security;

-- -----------------------------
-- CUSTOMER PROFILES
-- -----------------------------
create table if not exists public.customer_profiles (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  email text not null unique,
  full_name text null,
  phone text null,

  tier_code text not null default 'random' references public.customer_tiers(code),
  lifetime_bookings integer not null default 0,
  lifetime_spend_cents integer not null default 0,
  big_tipper boolean not null default false,
  notes text null
);

create index if not exists customer_profiles_tier_code_idx on public.customer_profiles(tier_code);

alter table public.customer_profiles enable row level security;

-- -----------------------------
-- BOOKING ACCESS / STAFF LINK FIELDS
-- -----------------------------
alter table public.bookings
  add column if not exists assigned_staff_user_id uuid null references public.staff_users(id) on delete set null;

alter table public.bookings
  add column if not exists customer_profile_id uuid null references public.customer_profiles(id) on delete set null;

alter table public.bookings
  add column if not exists customer_tier_code text null references public.customer_tiers(code);

create index if not exists bookings_assigned_staff_user_id_idx on public.bookings(assigned_staff_user_id);
create index if not exists bookings_customer_profile_id_idx on public.bookings(customer_profile_id);
create index if not exists bookings_customer_tier_code_idx on public.bookings(customer_tier_code);

-- -----------------------------
-- JOBSITE / PROGRESS AUDIT OVERRIDES
-- -----------------------------
alter table public.jobsite_intake
  add column if not exists last_updated_by_staff_user_id uuid null references public.staff_users(id) on delete set null;

alter table public.job_updates
  add column if not exists staff_user_id uuid null references public.staff_users(id) on delete set null;

alter table public.job_media
  add column if not exists staff_user_id uuid null references public.staff_users(id) on delete set null;

alter table public.job_signoffs
  add column if not exists staff_user_id uuid null references public.staff_users(id) on delete set null;

-- -----------------------------
-- ENTRY OVERRIDE LOG
-- tracks when a senior detailer/admin overrides something created by another staff member
-- -----------------------------
create table if not exists public.staff_override_log (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  booking_id uuid null references public.bookings(id) on delete set null,
  source_table text not null,                           -- jobsite_intake | job_updates | job_media | etc
  source_row_id uuid null,
  overridden_by_staff_user_id uuid null references public.staff_users(id) on delete set null,
  previous_staff_user_id uuid null references public.staff_users(id) on delete set null,

  override_reason text null,
  change_summary text null
);

create index if not exists staff_override_log_booking_idx on public.staff_override_log(booking_id);
create index if not exists staff_override_log_source_idx on public.staff_override_log(source_table, source_row_id);

alter table public.staff_override_log enable row level security;
-- -----------------------------
-- JOB TIME ENTRIES (detailer live time tracking)
-- -----------------------------
create table if not exists public.job_time_entries (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  staff_user_id uuid null references public.staff_users(id) on delete set null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  entry_type text not null check (
    entry_type in (
      'arrival',
      'work_start',
      'work_stop',
      'break_start',
      'break_stop',
      'rain_break_start',
      'rain_break_stop',
      'heat_break_start',
      'heat_break_stop',
      'job_complete'
    )
  ),

  event_time timestamptz not null default now(),
  note text null,

  created_by_name text null,
  source text null default 'jobsite' -- jobsite | admin | system
);

create index if not exists job_time_entries_booking_idx on public.job_time_entries(booking_id);
create index if not exists job_time_entries_staff_idx on public.job_time_entries(staff_user_id);
create index if not exists job_time_entries_event_time_idx on public.job_time_entries(event_time);

alter table public.job_time_entries enable row level security;

-- NOTE: latest incremental migrations also add catalog ratings/recovery settings via
-- sql/2026-03-24_catalog_ratings_public_and_recovery_templates.sql
