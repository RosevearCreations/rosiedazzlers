-- 2026-04-24_site_activity_rollups.sql
-- Pre-aggregated analytics rollups for admin reporting.

create table if not exists public.site_activity_rollups (
  period_type text not null check (period_type in ('day','week','month','year')),
  period_key text not null,
  period_start date not null,
  period_end date not null,
  service_area_label text not null default '__all__',
  events integer not null default 0,
  page_views integer not null default 0,
  unique_visitors integer not null default 0,
  unique_sessions integer not null default 0,
  booking_starts integer not null default 0,
  booking_completions integer not null default 0,
  cart_snapshots integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (period_type, period_key, service_area_label)
);
create index if not exists idx_site_activity_rollups_period_start on public.site_activity_rollups (period_start desc, period_type, service_area_label);

create table if not exists public.site_activity_dimension_daily_rollups (
  rollup_date date not null,
  service_area_label text not null default '__all__',
  dimension_type text not null,
  dimension_value text not null,
  count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (rollup_date, service_area_label, dimension_type, dimension_value)
);
create index if not exists idx_site_activity_dimension_daily_rollups_lookup on public.site_activity_dimension_daily_rollups (rollup_date desc, service_area_label, dimension_type);

create table if not exists public.site_activity_funnel_daily_rollups (
  rollup_date date not null,
  service_area_label text not null default '__all__',
  step_1_views integer not null default 0,
  step_2_views integer not null default 0,
  step_3_views integer not null default 0,
  step_4_views integer not null default 0,
  step_5_views integer not null default 0,
  service_area_picks integer not null default 0,
  date_picks integer not null default 0,
  package_picks integer not null default 0,
  addon_toggles integer not null default 0,
  customer_continue integer not null default 0,
  checkout_started integer not null default 0,
  checkout_completed integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (rollup_date, service_area_label)
);
create index if not exists idx_site_activity_funnel_daily_rollups_lookup on public.site_activity_funnel_daily_rollups (rollup_date desc, service_area_label);
