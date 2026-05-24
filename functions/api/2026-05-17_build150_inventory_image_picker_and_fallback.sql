-- Build 150 inventory image picker and fallback image persistence support
-- 2026-05-17
-- Keeps saved DB inventory rows from masking bundled consumable/tool images and ensures
-- the current catalog_inventory_items table shape matches the Admin Catalog editor.

alter table if exists public.catalog_inventory_items
  add column if not exists receipt_url text,
  add column if not exists assigned_station text,
  add column if not exists service_tags text[],
  add column if not exists last_counted_at timestamptz,
  add column if not exists public_badge text,
  add column if not exists amazon_asin text,
  add column if not exists amazon_title text,
  add column if not exists amazon_match_status text,
  add column if not exists amazon_match_score numeric(6,3),
  add column if not exists amazon_seller_name text,
  add column if not exists amazon_brand text,
  add column if not exists amazon_category text,
  add column if not exists amazon_quantity_total numeric(12,2),
  add column if not exists amazon_net_total_cents integer;

create index if not exists idx_catalog_inventory_items_image_url
  on public.catalog_inventory_items(image_url)
  where image_url is not null and image_url <> '';

create index if not exists idx_catalog_inventory_items_service_tags
  on public.catalog_inventory_items using gin(service_tags);

create index if not exists catalog_inventory_items_amazon_asin_idx
  on public.catalog_inventory_items(amazon_asin);

create index if not exists catalog_inventory_items_amazon_match_status_idx
  on public.catalog_inventory_items(amazon_match_status);

comment on column public.catalog_inventory_items.image_url is 'Primary product image URL. Admin Catalog can pick from bundled consumables/tools images, helpers, or pasted R2 URLs.';
comment on column public.catalog_inventory_items.service_tags is 'Optional service/add-on tags for connecting products and tools to detailing workflows.';
comment on column public.catalog_inventory_items.amazon_asin is 'Amazon ASIN matched from Amazon Business CSV import review.';
comment on column public.catalog_inventory_items.amazon_match_status is 'CSV match status: strong, review, unmatched, or manual.';
