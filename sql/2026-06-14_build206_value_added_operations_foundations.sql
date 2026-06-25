-- Build 206: Value-added operations foundations.
-- Purpose: Give the next high-value modules proper DB destinations instead of long-term JSON-only storage.
-- Safe to run after the current schema. Tables are additive and guarded with IF NOT EXISTS.

create table if not exists public.gallery_approval_queue (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid null,
  title text not null,
  service_label text null,
  town text null,
  before_media_url text not null,
  after_media_url text not null,
  consent_status text not null default 'pending_review',
  media_privacy_status text not null default 'pending_review',
  customer_safe_note text null,
  internal_note text null,
  approved_by uuid null,
  approved_at timestamptz null,
  is_public boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.quote_pipeline_items (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid null,
  customer_id uuid null,
  booking_id uuid null,
  quote_number text null,
  customer_name text null,
  town text null,
  service_label text null,
  status text not null default 'draft',
  source_channel text null,
  quoted_amount_cents integer not null default 0,
  accepted_amount_cents integer not null default 0,
  probability numeric(5,2) null,
  follow_up_stage text null,
  next_follow_up_at timestamptz null,
  sent_at timestamptz null,
  accepted_at timestamptz null,
  declined_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.meta_ads_roi_reports (
  id uuid primary key default gen_random_uuid(),
  campaign_name text not null,
  campaign_start date null,
  campaign_end date null,
  spend_cents integer not null default 0,
  leads_count integer not null default 0,
  booked_jobs_count integer not null default 0,
  revenue_cents integer not null default 0,
  notes text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.customer_maintenance_plans (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid null,
  vehicle_id uuid null,
  plan_name text not null,
  cycle_weeks integer not null default 8,
  status text not null default 'interest',
  credit_balance_cents integer not null default 0,
  next_reminder_at timestamptz null,
  notes text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.vehicle_history_events (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid null,
  vehicle_id uuid null,
  booking_id uuid null,
  event_type text not null,
  event_title text not null,
  event_note text null,
  recommended_next_service text null,
  customer_visible boolean not null default false,
  event_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.proof_of_work_checklists (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid null,
  checklist_name text not null,
  status text not null default 'draft',
  required_steps jsonb not null default '[]'::jsonb,
  completed_steps jsonb not null default '[]'::jsonb,
  start_photo_urls jsonb not null default '[]'::jsonb,
  finish_photo_urls jsonb not null default '[]'::jsonb,
  customer_signature_url text null,
  customer_signed_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.fleet_accounts (
  id uuid primary key default gen_random_uuid(),
  company_name text not null,
  contact_name text null,
  contact_email text null,
  contact_phone text null,
  town text null,
  vehicle_count integer not null default 0,
  service_interval text null,
  contract_status text not null default 'prospect',
  quote_terms text null,
  notes text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.review_request_queue (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid null,
  customer_id uuid null,
  trigger_event text not null default 'completed_booking',
  status text not null default 'queued',
  channel text null,
  send_after timestamptz null,
  sent_at timestamptz null,
  review_url text null,
  reusable_as_public_proof boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.seasonal_campaigns (
  id uuid primary key default gen_random_uuid(),
  campaign_name text not null,
  season text null,
  town_focus text null,
  service_focus text null,
  offer_summary text null,
  hero_image_url text null,
  status text not null default 'draft',
  starts_at timestamptz null,
  ends_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.route_cluster_hints (
  id uuid primary key default gen_random_uuid(),
  town text not null,
  preferred_day text null,
  reason text null,
  status text not null default 'suggested',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
