-- SUPABASE_SCHEMA.sql
-- Create/repair schema for tables referenced by the repo.
-- Safe to run multiple times: uses IF NOT EXISTS and ADD COLUMN IF NOT EXISTS.

create extension if not exists "pgcrypto";

-- -----------------------------
-- BOOKINGS (core)
-- -----------------------------
create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),

  status text not null default 'pending',
  created_at timestamptz not null default now(),

  service_date date not null,
  start_slot text not null check (start_slot in ('AM','PM')),
  duration_slots int not null check (duration_slots in (1,2)),

  service_area text not null check (service_area in ('Norfolk','Oxford')),
  package_code text not null,
  vehicle_size text not null check (vehicle_size in ('small','mid','oversize')),

  customer_name text not null,
  customer_email text not null,
  customer_phone text null,

  address_line1 text not null,
  city text null,
  postal_code text null,

  addons jsonb null,

  currency text not null default 'CAD',
  price_total_cents int not null default 0,
  deposit_cents int not null default 0,

  stripe_session_id text null,
  stripe_payment_intent text null,

  ack_driveway boolean not null default false,
  ack_power_water boolean not null default false,
  ack_bylaw boolean not null default false,
  ack_cancellation boolean not null default false,

  waiver_accepted_at timestamptz null,
  waiver_ip text null,
  waiver_user_agent text null,

  notes text null,

  assigned_to text null,

  progress_token uuid null unique,
  progress_enabled boolean not null default false,
  job_status text null,
  completed_at timestamptz null
);

create index if not exists bookings_service_date_idx on public.bookings(service_date);
create index if not exists bookings_status_idx on public.bookings(status);

alter table public.bookings enable row level security;

-- -----------------------------
-- DATE BLOCKS
-- -----------------------------
create table if not exists public.date_blocks (
  id uuid primary key default gen_random_uuid(),
  blocked_date date not null unique,
  reason text null,
  created_at timestamptz not null default now()
);

alter table public.date_blocks enable row level security;

-- -----------------------------
-- SLOT BLOCKS
-- -----------------------------
create table if not exists public.slot_blocks (
  id uuid primary key default gen_random_uuid(),
  blocked_date date not null,
  slot text not null check (slot in ('AM','PM')),
  reason text null,
  created_at timestamptz not null default now(),
  unique(blocked_date, slot)
);

create index if not exists slot_blocks_date_idx on public.slot_blocks(blocked_date);

alter table public.slot_blocks enable row level security;

-- -----------------------------
-- PROMO CODES
-- -----------------------------
create table if not exists public.promo_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  is_active boolean not null default true,
  percent_off numeric null check (percent_off is null or (percent_off >= 0 and percent_off <= 100)),
  amount_off_cents integer null check (amount_off_cents is null or amount_off_cents >= 0),
  starts_on date null,
  ends_on date null,
  note text null,
  created_at timestamptz not null default now()
);

create unique index if not exists promo_codes_code_unique on public.promo_codes(lower(code));

alter table public.promo_codes enable row level security;

-- -----------------------------
-- GIFT PRODUCTS
-- -----------------------------
create table if not exists public.gift_products (
  id uuid primary key default gen_random_uuid(),
  sku text not null unique,
  type text not null,
  name text not null,
  description text null,

  package_code text null,
  vehicle_size text null,

  face_value_cents int null,
  sale_price_cents int not null,
  currency text not null default 'CAD',

  image_url text null,
  is_active boolean not null default true,

  created_at timestamptz not null default now()
);

alter table public.gift_products enable row level security;

-- -----------------------------
-- GIFT CERTIFICATES
-- -----------------------------
create table if not exists public.gift_certificates (
  id uuid primary key default gen_random_uuid(),

  code text not null unique,
  sku text not null,
  type text not null,
  currency text not null default 'CAD',

  face_value_cents int not null default 0,
  remaining_cents int not null default 0,

  package_code text null,
  vehicle_size text null,

  status text not null default 'active',

  purchaser_email text null,
  recipient_name text null,
  recipient_email text null,

  stripe_session_id text null,
  stripe_payment_intent text null,

  expires_at timestamptz null,

  purchase_context jsonb null,

  created_at timestamptz not null default now()
);

create index if not exists gift_certificates_session_idx on public.gift_certificates(stripe_session_id);

alter table public.gift_certificates enable row level security;

-- -----------------------------
-- BOOKING EVENTS
-- -----------------------------
create table if not exists public.booking_events (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid null references public.bookings(id) on delete set null,
  event_type text not null,
  details jsonb null,
  created_at timestamptz not null default now()
);

create index if not exists booking_events_booking_idx on public.booking_events(booking_id);

alter table public.booking_events enable row level security;

-- -----------------------------
-- SIMPLE PROGRESS UPDATES
-- -----------------------------
create table if not exists public.progress_updates (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,

  stage text not null default 'update',
  progress_percent int null check (progress_percent between 0 and 100),
  visibility text not null default 'public' check (visibility in ('public','private')),

  photo_url text null,
  note text null,

  created_at timestamptz not null default now()
);

create index if not exists progress_updates_booking_idx on public.progress_updates(booking_id);

alter table public.progress_updates enable row level security;

-- -----------------------------
-- TOKEN-BASED PROGRESS SYSTEM
-- -----------------------------
create table if not exists public.job_updates (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  created_at timestamptz not null default now(),
  created_by text null,
  note text null,
  visibility text not null default 'customer' check (visibility in ('customer','internal'))
);

create index if not exists job_updates_booking_idx on public.job_updates(booking_id);

alter table public.job_updates enable row level security;

create table if not exists public.job_media (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  created_at timestamptz not null default now(),
  created_by text null,
  kind text null,
  caption text null,
  media_url text not null,
  visibility text not null default 'customer' check (visibility in ('customer','internal'))
);

create index if not exists job_media_booking_idx on public.job_media(booking_id);

alter table public.job_media enable row level security;

create table if not exists public.job_signoffs (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  signer_type text not null default 'customer' check (signer_type in ('customer','staff','admin')),
  signer_name text not null,
  signer_email text not null,
  notes text null,
  signed_at timestamptz not null default now(),
  user_agent text null
);

create index if not exists job_signoffs_booking_idx on public.job_signoffs(booking_id);

alter table public.job_signoffs enable row level security;
