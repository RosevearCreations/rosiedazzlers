-- Build 235: Inventory JSON table editing, seven-image galleries, and launch readiness.
-- Apply in Supabase before relying on gallery persistence. Existing image_url remains the featured image.

begin;

alter table if exists public.catalog_inventory_items
  add column if not exists gallery_image_urls jsonb not null default '[]'::jsonb;

alter table if exists public.catalog_items
  add column if not exists gallery_image_urls jsonb not null default '[]'::jsonb;

do $$
begin
  if to_regclass('public.catalog_inventory_items') is not null and not exists (select 1 from pg_constraint where conname='catalog_inventory_items_gallery_image_urls_check') then
    alter table public.catalog_inventory_items add constraint catalog_inventory_items_gallery_image_urls_check
      check (jsonb_typeof(gallery_image_urls)='array' and jsonb_array_length(gallery_image_urls)<=7);
  end if;
  if to_regclass('public.catalog_items') is not null and not exists (select 1 from pg_constraint where conname='catalog_items_gallery_image_urls_check') then
    alter table public.catalog_items add constraint catalog_items_gallery_image_urls_check
      check (jsonb_typeof(gallery_image_urls)='array' and jsonb_array_length(gallery_image_urls)<=7);
  end if;
end $$;

commit;
