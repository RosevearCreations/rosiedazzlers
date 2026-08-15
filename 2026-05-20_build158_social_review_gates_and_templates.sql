-- Build 158 - Social review gates and platform compliance helpers
-- Purpose: make job/crafting-progress social posts safer before any API/webhook/manual publishing.
-- Safe to run more than once in Supabase SQL Editor.

alter table if exists public.social_post_queue
  add column if not exists review_status text not null default 'needs_review';

alter table if exists public.social_post_queue
  add column if not exists customer_consent_confirmed boolean not null default false;

alter table if exists public.social_post_queue
  add column if not exists plate_privacy_confirmed boolean not null default false;

alter table if exists public.social_post_queue
  add column if not exists no_private_info_confirmed boolean not null default false;

alter table if exists public.social_post_queue
  add column if not exists platform_warnings jsonb not null default '[]'::jsonb;

alter table if exists public.social_post_queue
  add column if not exists approved_at timestamptz null;

alter table if exists public.social_post_queue
  add column if not exists approved_by_name text null;

alter table if exists public.social_post_queue
  add column if not exists compliance_note text null;

alter table if exists public.social_post_queue
  add column if not exists caption_template_key text null;

alter table if exists public.social_post_queue
  add column if not exists local_hashtag_set text[] not null default '{}'::text[];

alter table if exists public.social_post_queue
  add column if not exists duplicate_signature text null;

do $$
begin
  if exists (
    select 1
    from information_schema.table_constraints
    where table_schema = 'public'
      and table_name = 'social_post_queue'
      and constraint_name = 'social_post_queue_review_status_check'
  ) then
    alter table public.social_post_queue drop constraint social_post_queue_review_status_check;
  end if;

  alter table public.social_post_queue
    add constraint social_post_queue_review_status_check
    check (review_status in ('needs_review','approved','blocked','not_required'));
end $$;

create index if not exists idx_social_post_queue_review_status on public.social_post_queue(review_status);
create index if not exists idx_social_post_queue_duplicate_signature on public.social_post_queue(duplicate_signature);

create table if not exists public.social_caption_templates (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  template_key text not null unique,
  display_name text not null,
  platform text null,
  service_area text null,
  template_text text not null,
  default_hashtags text[] not null default '{}'::text[],
  is_enabled boolean not null default true,
  notes text null
);

create table if not exists public.social_hashtag_presets (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  preset_key text not null unique,
  display_name text not null,
  platform text null,
  service_area text null,
  hashtags text[] not null default '{}'::text[],
  is_enabled boolean not null default true,
  notes text null
);

insert into public.social_caption_templates (template_key, display_name, platform, service_area, template_text, default_hashtags, notes)
values
  (
    'progress_general_southern_ontario',
    'Progress update - Southern Ontario',
    null,
    'Southern Ontario',
    'Another Rosie Dazzlers progress update from the shop: {summary}\n\nSee the process and recent work here: {public_url}',
    array['RosieDazzlers','AutoDetailing','SouthernOntario'],
    'General reviewable job/crafting progress caption template.'
  ),
  (
    'before_after_oxford_norfolk',
    'Before/after proof - Oxford and Norfolk',
    null,
    'Oxford and Norfolk Counties',
    'Before/after detail progress for a local Rosie Dazzlers job: {summary}\n\nServing Tillsonburg, Oxford County, Norfolk County, and nearby Southern Ontario communities.',
    array['RosieDazzlers','MobileDetailing','OxfordCounty','NorfolkCounty'],
    'Local SEO caption template for approved job media.'
  )
on conflict (template_key) do nothing;

insert into public.social_hashtag_presets (preset_key, display_name, platform, service_area, hashtags, notes)
values
  (
    'rosie_local_core',
    'Rosie local core',
    null,
    'Southern Ontario',
    array['RosieDazzlers','AutoDetailing','MobileDetailing','SouthernOntario'],
    'Safe default hashtags for most progress drafts.'
  ),
  (
    'rosie_oxford_norfolk',
    'Oxford/Norfolk local',
    null,
    'Oxford and Norfolk Counties',
    array['RosieDazzlers','Tillsonburg','OxfordCounty','NorfolkCounty','MobileAutoDetailing'],
    'Local discovery hashtag preset for service-area proof posts.'
  )
on conflict (preset_key) do nothing;

comment on column public.social_post_queue.review_status is 'Build 158 social review state before API/webhook/manual publishing.';
comment on column public.social_post_queue.platform_warnings is 'Platform-specific warnings and blocking checks captured before publishing.';
comment on column public.social_post_queue.duplicate_signature is 'Simple duplicate-content signature used to spot repeated media/caption drafts.';
