-- Build 151 — media-library inventory image workflow (2026-05-18)
-- Keeps the Build 150 inventory picker deploy-safe while preparing a DB-backed media picker.
-- The admin UI still falls back to bundled JSON/R2 image URLs if this table has not been populated yet.

create table if not exists public.app_media_library (
  id uuid primary key default gen_random_uuid(),
  media_key text not null unique,
  label text not null,
  media_type text not null default 'image',
  media_url text not null,
  fallback_url text,
  alt_text text,
  caption text,
  group_key text,
  usage_contexts text[] not null default array[]::text[],
  recommended_size text,
  source_status text not null default 'active',
  sort_order integer not null default 0,
  updated_at timestamptz not null default now(),
  updated_by text
);

create index if not exists idx_app_media_library_group_key on public.app_media_library(group_key);
create index if not exists idx_app_media_library_usage_contexts on public.app_media_library using gin(usage_contexts);
create index if not exists idx_app_media_library_source_status on public.app_media_library(source_status);
create index if not exists idx_app_media_library_media_type on public.app_media_library(media_type);
create index if not exists idx_app_media_library_inventory_images
  on public.app_media_library(group_key, sort_order)
  where source_status <> 'archived' and media_type in ('image', 'photo');

-- No destructive migration is required. Populate app_media_library over time from R2/upload workflows.
-- Admin Catalog now reads /api/admin/media_library_list first, then keeps bundled consumables/tools images as fallback.
