
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
