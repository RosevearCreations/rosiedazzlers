-- Build 145 catalog DB import / admin app backend foundations — 2026-05-15
-- Safe, optional migration for moving bundled consumables/gear toward DB-first operation.
-- Runtime remains fallback-safe if this SQL has not been applied yet.

alter table if exists public.catalog_inventory_items
  add column if not exists receipt_url text,
  add column if not exists assigned_station text,
  add column if not exists service_tags text[],
  add column if not exists last_counted_at timestamptz,
  add column if not exists public_badge text;

create table if not exists public.catalog_import_batches (
  id uuid primary key default gen_random_uuid(),
  source_name text not null,
  source_kind text not null,
  status text not null default 'preview',
  total_rows integer not null default 0,
  create_rows integer not null default 0,
  update_rows integer not null default 0,
  skip_rows integer not null default 0,
  review_rows integer not null default 0,
  notes text,
  created_by_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.catalog_import_batch_rows (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid references public.catalog_import_batches(id) on delete cascade,
  item_key text not null,
  item_type text not null,
  name text not null,
  decision text not null default 'review',
  reason text,
  row_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.vendor_directory (
  id uuid primary key default gen_random_uuid(),
  vendor_name text not null unique,
  contact_name text,
  email text,
  phone text,
  website_url text,
  default_purchase_url text,
  payment_terms text,
  notes text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.catalog_item_receipts (
  id uuid primary key default gen_random_uuid(),
  item_key text not null,
  vendor_name text,
  receipt_url text,
  purchase_date date,
  subtotal_cad numeric(12,2),
  tax_cad numeric(12,2),
  total_cad numeric(12,2),
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.catalog_item_assignments (
  id uuid primary key default gen_random_uuid(),
  item_key text not null,
  assigned_station text not null,
  assigned_to_staff_user_id uuid,
  assigned_to_name text,
  qty_assigned numeric(12,2) not null default 1,
  status text not null default 'assigned',
  notes text,
  assigned_at timestamptz not null default now(),
  returned_at timestamptz
);

create table if not exists public.service_product_links (
  id uuid primary key default gen_random_uuid(),
  service_slug text not null,
  service_name text not null,
  item_key text,
  keyword text,
  public_story text,
  sort_key integer not null default 0,
  is_public boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_catalog_inventory_items_public_active on public.catalog_inventory_items(is_public, is_active);
create index if not exists idx_catalog_inventory_items_service_tags on public.catalog_inventory_items using gin(service_tags);
create index if not exists idx_catalog_import_batch_rows_batch on public.catalog_import_batch_rows(batch_id);
create index if not exists idx_catalog_item_receipts_item_key on public.catalog_item_receipts(item_key);
create index if not exists idx_catalog_item_assignments_item_key on public.catalog_item_assignments(item_key);
create index if not exists idx_service_product_links_service_slug on public.service_product_links(service_slug);
