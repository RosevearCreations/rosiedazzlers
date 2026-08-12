-- Build 253 — application-wide Photo Management Studio
-- Extends the existing app_media_library instead of creating a second media source of truth.
-- Safe to run more than once in Supabase SQL Editor.

begin;

alter table if exists public.app_media_library
  add column if not exists r2_key text,
  add column if not exists filename text,
  add column if not exists r2_prefix text,
  add column if not exists seo_title text,
  add column if not exists tags text[] not null default array[]::text[],
  add column if not exists mime_type text,
  add column if not exists width integer,
  add column if not exists height integer,
  add column if not exists byte_size bigint,
  add column if not exists r2_etag text,
  add column if not exists uploaded_at timestamptz,
  add column if not exists last_seen_at timestamptz,
  add column if not exists source_type text not null default 'manual',
  add column if not exists focal_point text not null default 'center',
  add column if not exists decorative boolean not null default false,
  add column if not exists attribution text,
  add column if not exists license_notes text;

create unique index if not exists app_media_library_r2_key_uq
  on public.app_media_library(r2_key)
  where r2_key is not null and btrim(r2_key) <> '';

create index if not exists app_media_library_r2_prefix_idx
  on public.app_media_library(r2_prefix, source_status, updated_at desc);

create index if not exists app_media_library_tags_idx
  on public.app_media_library using gin(tags);

create table if not exists public.app_media_assignments (
  id uuid primary key default gen_random_uuid(),
  target_key text not null unique,
  target_label text not null,
  target_type text not null default 'component',
  page_path text,
  component_key text,
  variant text,
  media_id uuid not null references public.app_media_library(id) on delete restrict,
  alt_override text,
  title_override text,
  caption_override text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by text
);

create index if not exists app_media_assignments_media_idx
  on public.app_media_assignments(media_id, is_active);

create index if not exists app_media_assignments_page_idx
  on public.app_media_assignments(page_path, target_type, is_active);

alter table public.app_media_assignments enable row level security;

-- Public pages do not query this table directly. Pages Functions return only sanitized,
-- active assignments for approved public R2 folders. Service-role access bypasses RLS.

commit;
