-- Build 142 service-area DB/admin/SEO value pass — 2026-05-15
-- Optional DB-first foundation for service-area rules.
-- Runtime remains safe without this migration because public pages fall back to bundled JSON and app_management_settings.

create table if not exists public.service_area_rules (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  county text,
  label text not null,
  value text not null,
  municipality text,
  zone text,
  travel_tier text,
  area_type text,
  aliases jsonb not null default '[]'::jsonb,
  bylaw_note text,
  parking_rule text,
  noise_rule text,
  water_rule text,
  access_rule text,
  official_links jsonb not null default '[]'::jsonb,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_service_area_rules_active_county
  on public.service_area_rules (is_active, county, sort_order, label);

create index if not exists idx_service_area_rules_value
  on public.service_area_rules (lower(value));

create index if not exists idx_service_area_rules_label
  on public.service_area_rules (lower(label));

comment on table public.service_area_rules is
  'DB-first optional source for Rosie Dazzlers service-area, county, water-rule, parking/access, and travel-tier rows. Bundled JSON remains the deploy-safe fallback.';

comment on column public.service_area_rules.official_links is
  'JSON array of official-source links such as Oxford County water conservation and Norfolk County watering restriction pages.';

comment on column public.service_area_rules.water_rule is
  'Staff/customer reminder text for seasonal water-use restrictions. Always verify official county pages before dispatch.';

-- Suggested seed path:
-- 1) Deploy this migration in Supabase dev.
-- 2) Use Admin App/API to save the rows from data/service_area_rules.json.
-- 3) Public pages will read /api/service_area_rules_public first, then bundled JSON fallback if unavailable.
