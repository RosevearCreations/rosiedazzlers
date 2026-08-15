-- Build 159 - Social templates, scheduling helpers, duplicate review, and manual post metrics
-- Purpose: make Admin Social Queue more useful after Build 158 review gates.
-- Safe to run more than once in Supabase SQL Editor.

alter table if exists public.social_post_queue
  add column if not exists duplicate_review_status text not null default 'unreviewed';

alter table if exists public.social_post_queue
  add column if not exists duplicate_review_note text null;

alter table if exists public.social_post_queue
  add column if not exists manual_posted_by_name text null;

alter table if exists public.social_post_queue
  add column if not exists manual_posted_note text null;

alter table if exists public.social_post_queue
  add column if not exists social_metrics jsonb not null default '{}'::jsonb;

create index if not exists idx_social_post_queue_scheduled_for on public.social_post_queue(scheduled_for);
create index if not exists idx_social_post_queue_status_scheduled_for on public.social_post_queue(status, scheduled_for);
create index if not exists idx_social_post_queue_duplicate_review_status on public.social_post_queue(duplicate_review_status);

create table if not exists public.social_post_metrics_snapshots (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  social_post_id uuid null references public.social_post_queue(id) on delete cascade,
  platform text not null,
  external_post_url text null,
  views_count integer null,
  likes_count integer null,
  comments_count integer null,
  shares_count integer null,
  clicks_count integer null,
  saves_count integer null,
  captured_by_name text null,
  notes text null
);

create index if not exists idx_social_post_metrics_snapshots_post on public.social_post_metrics_snapshots(social_post_id, created_at desc);
create index if not exists idx_social_post_metrics_snapshots_platform on public.social_post_metrics_snapshots(platform, created_at desc);

insert into public.social_caption_templates (template_key, display_name, platform, service_area, template_text, default_hashtags, notes)
values
  (
    'winter_salt_cleanup',
    'Winter salt cleanup',
    null,
    'Southern Ontario',
    'Southern Ontario roads can be hard on vehicles. Rosie Dazzlers progress update: {summary}\n\nAsk us about interior cleanup, salt residue, and seasonal protection.',
    array['RosieDazzlers','WinterDetailing','SouthernOntario','MobileAutoDetailing'],
    'Build 159 seasonal local-service caption template.'
  ),
  (
    'interior_refresh_tillsonburg',
    'Interior refresh - Tillsonburg area',
    null,
    'Tillsonburg',
    'Interior refresh progress from Rosie Dazzlers: {summary}\n\nLocal mobile auto detailing for Tillsonburg and nearby Oxford/Norfolk communities.',
    array['RosieDazzlers','Tillsonburg','InteriorDetailing','MobileAutoDetailing'],
    'Build 159 local-service caption template.'
  )
on conflict (template_key) do update
set display_name = excluded.display_name,
    platform = excluded.platform,
    service_area = excluded.service_area,
    template_text = excluded.template_text,
    default_hashtags = excluded.default_hashtags,
    notes = excluded.notes,
    updated_at = now();

insert into public.social_hashtag_presets (preset_key, display_name, platform, service_area, hashtags, notes)
values
  (
    'rosie_services_core',
    'Detailing services core',
    null,
    'Southern Ontario',
    array['InteriorDetailing','ExteriorDetailing','VehicleCare','RosieDazzlers'],
    'Build 159 service keyword hashtags.'
  ),
  (
    'rosie_tillsonburg_focus',
    'Tillsonburg focus',
    null,
    'Tillsonburg',
    array['RosieDazzlers','Tillsonburg','OxfordCounty','MobileAutoDetailing'],
    'Build 159 local discovery preset.'
  )
on conflict (preset_key) do update
set display_name = excluded.display_name,
    platform = excluded.platform,
    service_area = excluded.service_area,
    hashtags = excluded.hashtags,
    notes = excluded.notes,
    updated_at = now();

comment on column public.social_post_queue.duplicate_review_status is 'Build 159 duplicate review status for similar social drafts.';
comment on column public.social_post_queue.social_metrics is 'Build 159 latest manually entered or API-collected social performance metrics.';
comment on table public.social_post_metrics_snapshots is 'Build 159 optional snapshots for social post performance metrics by platform.';
