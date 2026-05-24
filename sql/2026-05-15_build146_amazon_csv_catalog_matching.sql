-- Build 146 Amazon CSV catalog matching and inventory enrichment support
-- Optional columns; APIs include compatibility fallback if these columns are not applied yet.

alter table public.catalog_inventory_items add column if not exists amazon_asin text;
alter table public.catalog_inventory_items add column if not exists amazon_title text;
alter table public.catalog_inventory_items add column if not exists amazon_match_status text;
alter table public.catalog_inventory_items add column if not exists amazon_match_score numeric(6,3);
alter table public.catalog_inventory_items add column if not exists amazon_seller_name text;
alter table public.catalog_inventory_items add column if not exists amazon_brand text;
alter table public.catalog_inventory_items add column if not exists amazon_category text;
alter table public.catalog_inventory_items add column if not exists amazon_quantity_total numeric(12,2);
alter table public.catalog_inventory_items add column if not exists amazon_net_total_cents integer;

create index if not exists catalog_inventory_items_amazon_asin_idx on public.catalog_inventory_items(amazon_asin);
create index if not exists catalog_inventory_items_amazon_match_status_idx on public.catalog_inventory_items(amazon_match_status);

comment on column public.catalog_inventory_items.amazon_asin is 'Amazon ASIN matched from Amazon Business CSV import review.';
comment on column public.catalog_inventory_items.amazon_match_status is 'CSV match status: strong, review, or unmatched/manual.';
comment on column public.catalog_inventory_items.amazon_match_score is 'Fuzzy match confidence used by scripts/amazon_catalog_match.py.';
