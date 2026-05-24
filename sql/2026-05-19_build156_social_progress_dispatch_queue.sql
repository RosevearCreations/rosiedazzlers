-- Build 156 - Social progress dispatch queue
-- Purpose: stage Rosie Dazzlers job progress photos/summaries for reviewable social posting.
-- This migration is safe to run more than once in Supabase SQL Editor.

create table if not exists public.social_channels (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  platform text not null check (platform in ('facebook','instagram','x','tiktok','google_business_profile','linkedin','youtube_shorts','manual')),
  display_name text not null,
  handle text null,
  is_enabled boolean not null default true,
  dispatch_mode text not null default 'draft' check (dispatch_mode in ('draft','manual','webhook','api')),
  notes text null,
  unique (platform, display_name)
);

create table if not exists public.social_post_queue (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  booking_id uuid null references public.bookings(id) on delete set null,
  source_type text not null default 'manual',
  source_id uuid null,
  platform text not null check (platform in ('facebook','instagram','x','tiktok','google_business_profile','linkedin','youtube_shorts','manual')),
  status text not null default 'draft' check (status in ('draft','ready','posted','failed','skipped')),
  post_text text not null,
  media_urls jsonb not null default '[]'::jsonb,
  public_url text null,
  hashtags text[] not null default '{}'::text[],
  created_by_staff_user_id uuid null references public.staff_users(id) on delete set null,
  created_by_name text null,
  scheduled_for timestamptz null,
  posted_at timestamptz null,
  external_post_id text null,
  external_post_url text null,
  last_error text null,
  attempt_count integer not null default 0
);

create table if not exists public.social_dispatch_attempts (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  social_post_id uuid not null references public.social_post_queue(id) on delete cascade,
  platform text not null,
  status text not null,
  request_summary jsonb not null default '{}'::jsonb,
  response_summary jsonb not null default '{}'::jsonb,
  error_message text null
);

create index if not exists idx_social_post_queue_booking_id on public.social_post_queue(booking_id);
create index if not exists idx_social_post_queue_status on public.social_post_queue(status);
create index if not exists idx_social_post_queue_platform on public.social_post_queue(platform);
create index if not exists idx_social_post_queue_scheduled_for on public.social_post_queue(scheduled_for);
create index if not exists idx_social_dispatch_attempts_post_id on public.social_dispatch_attempts(social_post_id);

insert into public.social_channels (platform, display_name, dispatch_mode, notes)
values
  ('facebook', 'Facebook Page', 'draft', 'Stage job photos/summaries for page review before API/webhook posting.'),
  ('instagram', 'Instagram Business', 'draft', 'Stage photo/video captions for Meta content publishing once credentials are approved.'),
  ('x', 'X', 'draft', 'Stage short text/photo posts before X API or manual publishing.'),
  ('tiktok', 'TikTok', 'draft', 'Stage vertical video/photo posts; direct posting requires TikTok approval and creator authorization.'),
  ('google_business_profile', 'Google Business Profile', 'draft', 'Stage local proof/recent-work posts for manual or future profile publishing.'),
  ('manual', 'Manual Copy/Paste', 'manual', 'Fallback channel for any platform without a direct API connection yet.')
on conflict (platform, display_name) do nothing;
