-- Build 185 — Next 20 operational foundations
-- Adds DB-backed media tasking, payment fee/application/final-balance tracking,
-- month-end close checklist, and local SEO task cards. Apply after Build 182 SQL.

create table if not exists public.media_asset_tasks (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  category text not null default 'media',
  r2_key text not null,
  public_url text null,
  required_width integer null,
  required_height integer null,
  required_size text null,
  upload_method text null,
  status text not null default 'needed',
  priority integer not null default 50,
  sort_order integer not null default 100,
  assigned_to text null,
  notes text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint media_asset_tasks_unique_key unique (r2_key)
);

alter table public.quote_deposit_payment_requests
  add column if not exists processor_fee_cents integer not null default 0,
  add column if not exists processor_fee_currency text not null default 'CAD',
  add column if not exists processor_fee_source text null,
  add column if not exists processor_fee_recorded_at timestamptz null,
  add column if not exists final_balance_request_id uuid null;

create table if not exists public.final_balance_payment_requests (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid null references public.bookings(id) on delete set null,
  customer_name text null,
  customer_email text null,
  status text not null default 'draft',
  amount_cents integer not null default 0,
  currency text not null default 'CAD',
  notes text null,
  token_hash text null,
  payment_url text null,
  paid_at timestamptz null,
  created_by_staff_id uuid null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.payment_applications (
  id uuid primary key default gen_random_uuid(),
  source_type text not null default 'deposit',
  source_id text null,
  target_type text not null default 'booking',
  target_id text null,
  booking_id uuid null references public.bookings(id) on delete set null,
  amount_cents integer not null default 0,
  currency text not null default 'CAD',
  application_status text not null default 'applied',
  notes text null,
  created_by_staff_id uuid null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.month_end_close_checklists (
  period text primary key,
  status text not null default 'open',
  items jsonb not null default '[]'::jsonb,
  notes text null,
  updated_by_staff_id uuid null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.local_seo_task_cards (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  task_type text not null default 'local_seo',
  town text null,
  service text null,
  status text not null default 'needed',
  priority integer not null default 50,
  notes text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.media_asset_tasks (label, category, r2_key, required_width, required_height, required_size, priority, notes)
values
  ('Pet hair removal add-on photo','addon','packages/pet_hair_removal.png',1200,800,'1200x800 minimum, 1600x1067 preferred',95,'Build 185 seed from IMAGES.md'),
  ('Odor treatment add-on photo','addon','packages/odor_treatment.png',1200,800,'1200x800 minimum',92,'Build 185 seed from IMAGES.md'),
  ('Seat shampoo add-on photo','addon','packages/seat_shampoo.png',1200,800,'1200x800 minimum',88,'Build 185 seed from IMAGES.md'),
  ('Tillsonburg local hero photo','regional','landing-pages/tillsonburg-auto-detailing.webp',1600,900,'1600x900 preferred',85,'Replace placeholder with Rosie-owned local proof image'),
  ('Port Dover local hero photo','regional','landing-pages/port-dover-auto-detailing.webp',1600,900,'1600x900 preferred',80,'Replace placeholder with Rosie-owned local proof image')
on conflict (r2_key) do nothing;
