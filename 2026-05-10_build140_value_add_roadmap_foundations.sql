-- Build 140 value-add roadmap pass — 2026-05-10
-- Adds optional DB-first foundations for reusable admin dropdowns, shared media, review proof, and before/after content.
-- The app can still fall back to JSON/app_settings if these tables are not deployed yet.

create table if not exists app_option_libraries (
  id uuid primary key default gen_random_uuid(),
  library_key text not null unique,
  label text not null,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by text
);

create table if not exists app_media_library (
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

create table if not exists app_content_entries (
  id uuid primary key default gen_random_uuid(),
  content_type text not null,
  slug text not null,
  title text not null,
  value jsonb not null default '{}'::jsonb,
  status text not null default 'draft',
  sort_order integer not null default 0,
  updated_at timestamptz not null default now(),
  updated_by text,
  unique (content_type, slug)
);

create index if not exists idx_app_media_library_group_key on app_media_library(group_key);
create index if not exists idx_app_media_library_usage_contexts on app_media_library using gin(usage_contexts);
create index if not exists idx_app_content_entries_type_status on app_content_entries(content_type, status, sort_order);
