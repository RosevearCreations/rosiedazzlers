-- Build 167 — COMPETETIVE completion matrix follow-up
-- Adds structured public lead capture and optional public photo-estimate upload audit rows.
-- Safe to run after earlier Build 162-165 booking-intake migrations.

create table if not exists public.public_inquiry_leads (
  id uuid primary key default gen_random_uuid(),
  topic text not null default 'general',
  full_name text not null,
  email text,
  phone text,
  service_area text,
  vehicle_count integer,
  preferred_cadence text,
  source_path text,
  message text not null,
  photo_estimate_links jsonb not null default '[]'::jsonb,
  status text not null default 'new',
  staff_note text,
  converted_booking_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists public_inquiry_leads_topic_status_idx
  on public.public_inquiry_leads(topic, status, created_at desc);

create index if not exists public_inquiry_leads_created_at_idx
  on public.public_inquiry_leads(created_at desc);

create table if not exists public.photo_estimate_uploads (
  id uuid primary key default gen_random_uuid(),
  intake_id uuid,
  booking_id uuid,
  lead_id uuid,
  source text not null default 'public_booking',
  bucket text not null,
  object_path text not null,
  media_url text,
  filename text,
  content_type text,
  file_size_bytes bigint,
  customer_email text,
  customer_name text,
  status text not null default 'signed',
  privacy_status text not null default 'pending_review',
  created_at timestamptz not null default now(),
  linked_at timestamptz
);

create unique index if not exists photo_estimate_uploads_bucket_path_uidx
  on public.photo_estimate_uploads(bucket, object_path);

create index if not exists photo_estimate_uploads_status_created_idx
  on public.photo_estimate_uploads(status, created_at desc);

comment on table public.public_inquiry_leads is
  'Build 167 public structured lead intake for fleet, maintenance, specials, gift cards, and quote-first requests.';

comment on table public.photo_estimate_uploads is
  'Build 167 optional public photo-estimate upload audit table. Direct upload is also gated by PUBLIC_PHOTO_ESTIMATE_UPLOADS_ENABLED=true.';
