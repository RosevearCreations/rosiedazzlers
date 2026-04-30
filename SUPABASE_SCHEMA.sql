-- 2026-04-25 note: no DDL change in this pass; admin range blocking continues to use date_blocks(blocked_date, reason) and slot_blocks(blocked_date, slot, reason).
-- Schema synchronization note: April 25, 2026 — no new DDL in this pass. Docs refreshed for folder-backed routes, special-service landing pages, recent-work proof mounts, and unchanged analytics rollup schema.
-- April 23, 2026 live vehicle-size guide + chart helper pass.
-- Added live SVG vehicle size guide generation beside the existing live price and package-details charts.
-- /pricing and /services now prefer live chart renders for price, details, and size guidance, with packaged image assets retained only as fallback/reference.
-- App Management now has a staff-facing helper to preview/download SVG charts from the current pricing editor JSON.
-- No database DDL was added in this pass; schema docs were synchronized to state that the change is frontend/helper logic only.
-- Next: deploy-test the admin chart helper, validate structured data on rendered pages, and continue the vehicle-media crop/editor hardening path.

-- Last synchronized: April 22, 2026. Reviewed during the live SVG pricing-chart, structured-data local SEO, static-check hardening, and docs/schema synchronization pass.
-- 2026-04-22 sync note: no new DDL landed in this pass; the main work moved public pricing charts to live SVG rendering from the canonical pricing catalog, extended structured-data markup on core local pages, and tightened static SEO checks.
-- Last synchronized: April 16, 2026. Reviewed during the App Management checkbox-alignment repair, package family/size-price clarification pass, pricing catalog UI polish, and docs/schema synchronization pass.
-- 2026-04-13 build-stability note: no new DDL landed in this pass; added the missing public social-feed API route at the application layer, removed duplicate GL actor keys, kept booking locked/stable, and kept _redirects as the current complete compatibility layer.
-- 2026-04-12 pricing-control-center note: booking remains stable and unchanged in this pass; _redirects is treated as complete; app_management_settings.pricing_catalog now also carries booking_rules.travel_pricing and booking_rules.price_controls for centralized travel/default pricing governance.
-- 2026-04-12 sync note: public booking/services/pricing/checkout/shared site helpers now preserve the full canonical pricing_catalog contract (charts, packages, service areas, booking_rules, public_requirements) via /api/pricing_catalog_public, with bundled JSON fallback and no SQL table shape change in this pass.
-- Last synchronized: April 11, 2026. Reviewed during the booking layout/date-picker repair, paged 21-day availability, structured service-area/bylaw logic, service-area reporting, analytics funnel/export pass, and docs/schema synchronization pass.
-- Last synchronized: April 11, 2026. Reviewed during the live clean-route verification pass, remaining session-first internal-screen cleanup, profitability labor-estimate pass, and docs/schema sync pass.
-- 2026-04-11 pass 8 note: no schema shape change in this pass; route cleanup, session-first screen convergence, and accounting/reporting logic were updated at the application layer.
-- Last synchronized: April 11, 2026. Reviewed during the route-safety carry-forward, crew-summary workflow pass, runtime error-handling hardening pass, and docs/schema sync pass.
-- 2026-04-11 route hotfix sync: no schema shape change in this pass.
-- Last synchronized: April 10, 2026. Reviewed during the canonical add-on media restore, crew assignment/senior detailer workflow, app-shell responsiveness pass, and docs/schema synchronization pass.
-- Last synchronized: April 9, 2026. Reviewed during the accounting actor normalization, receivables-aging, profitability, export expansion, auth/session convergence, and docs/schema synchronization pass.
-- Last synchronized: April 8, 2026. Reviewed during the accounting access/admin dashboard/menu pass. No schema change in this pass; documentation and access paths were updated.
-- March 29, 2026 sync note: no new tables were required for this pass; this refresh mainly extends signed-in staff session coverage, reduces shared-password-only endpoint usage, and improves actor attribution in time/intake/media/booking flows.
-- 
-- 
> Last synchronized: March 28, 2026. Reviewed during the pricing chart zoom/modal, manufacturer callout, local SEO metadata, and current-build synchronization pass.

-- Last synchronized: March 27, 2026. Reviewed during the booking wizard sticky-fix, two-way active-job communication pass, and docs/schema refresh.
-- March 27, 2026 mobile booking + account widget pass: no new DDL required; booking flow, account widget, and customer progress filtering changed application behavior only.

-- March 26, 2026 pass note: no new table was required in this pass; the focus moved to UI coverage over existing catalog inventory, movement, booking-linked usage, and progress/session flows.
-- Rosie Dazzlers - Current Supabase Schema Snapshot
-- Updated: 2026-03-25

create extension if not exists pgcrypto;

create table if not exists public.app_management_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);


create table if not exists public.staff_users (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  full_name text not null,
  email text not null unique,
  role_code text not null default 'detailer' check (role_code in ('admin','senior_detailer','detailer')),
  is_active boolean not null default true,
  password_hash text null,
  can_override_lower_entries boolean not null default false,
  can_manage_bookings boolean not null default false,
  can_manage_blocks boolean not null default false,
  can_manage_progress boolean not null default false,
  can_manage_promos boolean not null default false,
  can_manage_staff boolean not null default false,
  preferred_contact_name text null,
  sms_phone text null,
  phone text null,
  address_line1 text null,
  address_line2 text null,
  city text null,
  province text null,
  postal_code text null,
  employee_code text null,
  position_title text null,
  hire_date date null,
  emergency_contact_name text null,
  emergency_contact_phone text null,
  vehicle_notes text null,
  vehicle_info jsonb not null default '{}'::jsonb,
  notes text null,
  department text null,
  admin_level text null,
  pay_schedule text null,
  hourly_rate_cents integer not null default 0,
  max_hours_per_day numeric(6,2) not null default 8,
  max_hours_per_week numeric(6,2) not null default 40,
  payroll_enabled boolean not null default true,
  payroll_notes text null,
  preferred_work_hours jsonb not null default '{}'::jsonb,
  admin_private_notes text null,
  detailer_level text null,
  permissions_profile jsonb not null default '{}'::jsonb,
  personal_admin_notes text null,
  tips_payout_notes text null,
  supervisor_staff_user_id uuid null references public.staff_users(id) on delete set null
);

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  status text not null default 'pending',
  job_status text null,
  service_date date not null,
  start_slot text not null check (start_slot in ('AM','PM')),
  duration_slots integer not null default 1 check (duration_slots in (1,2)),
  service_area text not null,
  service_area_county text null,
  service_area_municipality text null,
  service_area_zone text null,
  package_code text not null,
  vehicle_size text not null,
  addons jsonb not null default '[]'::jsonb,
  customer_name text not null,
  customer_email text not null,
  customer_phone text null,
  address_line1 text not null,
  address_line2 text null,
  city text null,
  postal_code text null,
  currency text not null default 'CAD',
  price_total_cents integer not null default 0,
  deposit_cents integer not null default 0,
  stripe_session_id text null,
  stripe_payment_intent text null,
  payment_provider text null,
  paypal_order_id text null,
  paypal_capture_id text null,
  progress_enabled boolean not null default false,
  progress_token uuid null default gen_random_uuid(),
  assigned_to text null,
  assigned_staff_user_id uuid null,
  customer_profile_id uuid null,
  customer_tier_code text null,
  waiver_accepted_at timestamptz null,
  waiver_ip text null,
  waiver_user_agent text null,
  ack_driveway boolean not null default false,
  ack_power_water boolean not null default false,
  ack_bylaw boolean not null default false,
  ack_cancellation boolean not null default false,
  notes text null,
  vehicle_year integer null,
  vehicle_make text null,
  vehicle_model text null,
  vehicle_body_style text null,
  vehicle_category text null,
  vehicle_plate text null,
  vehicle_mileage_km numeric null,
  vehicle_photo_url text null,
  current_workflow_stage text null,
  detailer_response_status text null,
  detailer_response_reason text null,
  trusted_service_latitude numeric null,
  trusted_service_longitude numeric null,
  trusted_service_coordinate_source text null,
  trusted_service_coordinate_status text not null default 'pending',
  trusted_service_coordinate_label text null,
  trusted_service_coordinate_resolved_at timestamptz null,
  trusted_service_geofence_radius_m numeric not null default 250,
  arrival_device_latitude numeric null,
  arrival_device_longitude numeric null,
  arrival_geofence_status text null,
  arrival_distance_m numeric null,
  arrival_geofence_checked_at timestamptz null,
  dispatched_at timestamptz null,
  arrived_at timestamptz null,
  detailing_started_at timestamptz null,
  detailing_paused_at timestamptz null,
  detailing_completed_at timestamptz null,
  completed_at timestamptz null
);

create table if not exists public.booking_staff_assignments (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  staff_user_id uuid null references public.staff_users(id) on delete set null,
  staff_email text null,
  staff_name text null,
  assignment_role text not null default 'crew' check (assignment_role in ('lead','crew')),
  sort_order integer not null default 0,
  assigned_by_staff_user_id uuid null references public.staff_users(id) on delete set null,
  assigned_by_name text null,
  notes text null
);

-- 2026-04-24 pass sync:
-- Schedule blocks still use the legacy `blocked_date` / `slot` schema.
-- Current compatibility endpoints normalize around this shape instead of requiring newer `block_date`, `slot_code`, or `updated_at` columns.
create table if not exists public.date_blocks (id uuid primary key default gen_random_uuid(), blocked_date date not null unique, reason text null, created_at timestamptz not null default now());
create table if not exists public.slot_blocks (id uuid primary key default gen_random_uuid(), blocked_date date not null, slot text not null check (slot in ('AM','PM')), reason text null, created_at timestamptz not null default now(), unique (blocked_date, slot));
create table if not exists public.booking_events (id uuid primary key default gen_random_uuid(), booking_id uuid not null references public.bookings(id) on delete cascade, created_at timestamptz not null default now(), event_type text not null, event_note text null, actor_name text null, payload jsonb not null default '{}'::jsonb);

create table if not exists public.job_time_entries (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  staff_user_id uuid null references public.staff_users(id) on delete set null,
  staff_name text null,
  created_by_name text null,
  source text not null default 'admin',
  entry_type text not null,
  minutes numeric(10,2) not null default 0,
  event_time timestamptz null,
  note text null
);

create table if not exists public.staff_availability_blocks (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  staff_user_id uuid not null references public.staff_users(id) on delete cascade,
  start_at timestamptz not null,
  end_at timestamptz not null,
  availability_type text not null default 'unavailable' check (availability_type in ('unavailable','vacation','sick','training','light_duty')),
  note text null,
  created_by_name text null,
  created_by_staff_user_id uuid null references public.staff_users(id) on delete set null
);
create table if not exists public.promo_codes (id uuid primary key default gen_random_uuid(), created_at timestamptz not null default now(), updated_at timestamptz not null default now(), code text not null unique, active boolean not null default true, is_active boolean not null default true, discount_type text null, discount_percent numeric(6,2) null, discount_cents integer null, percent_off numeric(6,2) null, amount_off_cents integer null, starts_at timestamptz null, ends_at timestamptz null, starts_on date null, ends_on date null, max_uses integer null, uses integer not null default 0, notes text null);
create table if not exists public.gift_products (id uuid primary key default gen_random_uuid(), created_at timestamptz not null default now(), updated_at timestamptz not null default now(), sku text not null unique, type text not null check (type in ('service','open','fixed_amount')), package_code text null, vehicle_size text null, face_value_cents integer not null default 0, currency text not null default 'CAD', is_active boolean not null default true, title text null, description text null);
create table if not exists public.gift_certificates (id uuid primary key default gen_random_uuid(), created_at timestamptz not null default now(), updated_at timestamptz not null default now(), code text not null unique, type text not null check (type in ('service','open','fixed_amount')), status text not null default 'active', currency text not null default 'CAD', package_code text null, vehicle_size text null, original_value_cents integer not null default 0, remaining_cents integer not null default 0, purchaser_email text null, recipient_name text null, recipient_email text null, stripe_session_id text null, redeemed_at timestamptz null, expires_at timestamptz null, notes text null);
create table if not exists public.job_updates (id uuid primary key default gen_random_uuid(), booking_id uuid not null references public.bookings(id) on delete cascade, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), created_by text not null, note text not null, visibility text not null default 'customer' check (visibility in ('customer','internal')), parent_update_id uuid null references public.job_updates(id) on delete cascade, thread_status text not null default 'visible' check (thread_status in ('visible','hidden','internal_only','pinned')), moderated_at timestamptz null, moderated_by_name text null, moderation_reason text null, staff_user_id uuid null);
create table if not exists public.job_media (id uuid primary key default gen_random_uuid(), booking_id uuid not null references public.bookings(id) on delete cascade, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), created_by text not null, kind text not null check (kind in ('photo','video')), caption text null, media_url text not null, visibility text not null default 'customer' check (visibility in ('customer','internal')), thread_status text not null default 'visible' check (thread_status in ('visible','hidden','internal_only','pinned')), moderated_at timestamptz null, moderated_by_name text null, moderation_reason text null, staff_user_id uuid null);
create table if not exists public.job_signoffs (id uuid primary key default gen_random_uuid(), booking_id uuid not null references public.bookings(id) on delete cascade, created_at timestamptz not null default now(), signed_at timestamptz not null default now(), signer_type text not null check (signer_type in ('customer','staff')), signer_name text not null, signer_email text null, notes text null, user_agent text null, staff_user_id uuid null);
create table if not exists public.recovery_message_templates (id uuid primary key default gen_random_uuid(), created_at timestamptz not null default now(), updated_at timestamptz not null default now(), template_key text not null unique, channel text not null check (channel in ('email','sms')), provider text not null default 'manual', is_active boolean not null default true, subject_template text null, body_template text not null, variables jsonb not null default '[]'::jsonb, rules jsonb not null default '{}'::jsonb, notes text null);
create table if not exists public.catalog_inventory_items (id uuid primary key default gen_random_uuid(), created_at timestamptz not null default now(), updated_at timestamptz not null default now(), item_key text not null unique, item_type text not null check (item_type in ('tool','consumable')), name text not null, category text null, subcategory text null, description text null, image_url text null, amazon_url text null, is_public boolean not null default true, is_active boolean not null default true, qty_on_hand numeric(12,2) not null default 0, reorder_point numeric(12,2) not null default 0, reorder_qty numeric(12,2) not null default 0, unit_label text null, cost_cents integer null, preferred_vendor text null, vendor_sku text null, rating_value numeric(3,2) null, rating_count integer not null default 0, sort_key integer not null default 0, reuse_policy text not null default 'reorder' check (reuse_policy in ('reorder','single_use','never_reuse')), purchase_date date null, estimated_jobs_per_unit numeric(12,2) null, notes text null);
create table if not exists public.catalog_low_stock_alerts (id uuid primary key default gen_random_uuid(), created_at timestamptz not null default now(), item_id uuid not null references public.catalog_inventory_items(id) on delete cascade, item_key text null, qty_snapshot numeric(12,2) null, reorder_point_snapshot numeric(12,2) null, is_resolved boolean not null default false, resolved_at timestamptz null, resolved_by_name text null, resolution_notes text null);
create table if not exists public.catalog_purchase_orders (id uuid primary key default gen_random_uuid(), created_at timestamptz not null default now(), updated_at timestamptz not null default now(), item_id uuid null references public.catalog_inventory_items(id) on delete set null, item_key text null, item_name text null, vendor_name text null, qty_ordered numeric(12,2) not null default 0, unit_cost_cents integer null, status text not null default 'draft' check (status in ('draft','requested','ordered','received','cancelled')), reminder_at timestamptz null, reminder_sent_at timestamptz null, reminder_last_channel text null, ordered_at timestamptz null, received_at timestamptz null, purchase_url text null, note text null);



create table if not exists public.customer_tiers (
  code text primary key,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  sort_order integer not null default 0,
  label text not null,
  description text null,
  is_active boolean not null default true,
  discount_percent numeric(6,2) null default 0,
  benefits jsonb not null default '[]'::jsonb
);

insert into public.customer_tiers (code, sort_order, label, description, is_active, discount_percent, benefits) values
('bronze',10,'Bronze','Default customer tier with standard pricing.',true,0,'[]'::jsonb),
('silver',20,'Silver','Membership tier with selected free upgrades and loyalty benefits.',true,0,'["free upgrade options","member pricing"]'::jsonb),
('gold',30,'Gold','Premium membership tier with stronger loyalty benefits and complimentary cleanings.',true,0,'["free cleanings","priority booking","free upgrades"]'::jsonb)
on conflict (code) do update set
  sort_order = excluded.sort_order,
  label = excluded.label,
  description = excluded.description,
  is_active = excluded.is_active,
  discount_percent = excluded.discount_percent,
  benefits = excluded.benefits,
  updated_at = now();

create table if not exists public.customer_profiles (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  email text not null unique,
  full_name text null,
  phone text null,
  tier_code text null,
  notes text null,
  address_line1 text null,
  address_line2 text null,
  city text null,
  province text null,
  postal_code text null,
  vehicle_notes text null,
  password_hash text null,
  is_active boolean not null default true,
  notification_opt_in boolean not null default true,
  notification_channel text null,
  detailer_chat_opt_in boolean not null default true,
  email_verified_at timestamptz null,
  marketing_source text null,
  last_login_at timestamptz null
);
create table if not exists public.customer_auth_sessions (
  id uuid primary key default gen_random_uuid(),
  customer_profile_id uuid not null references public.customer_profiles(id) on delete cascade,
  token_hash text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  expires_at timestamptz not null,
  revoked_at timestamptz null,
  last_seen_at timestamptz null,
  ip_address text null,
  user_agent text null
);
create table if not exists public.customer_auth_tokens (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  customer_profile_id uuid not null references public.customer_profiles(id) on delete cascade,
  purpose text not null check (purpose in ('password_reset','email_verification')),
  token_hash text not null unique,
  expires_at timestamptz not null,
  used_at timestamptz null,
  payload jsonb not null default '{}'::jsonb
);
-- Analytics reporting notes:
-- Raw analytics events continue to land in `public.site_activity_events`.
-- Admin reporting now prefers the pre-aggregated rollup tables below when they are populated by `/api/admin/analytics_rollups_refresh`, and safely falls back to raw-event reporting if rollups are empty.
create table if not exists public.site_activity_events (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  visitor_id text not null,
  session_id text not null,
  event_type text not null,
  page_path text not null,
  page_title text null,
  referrer text null,
  country text null,
  ip_address text null,
  user_agent text null,
  locale text null,
  timezone text null,
  screen text null,
  source text null,
  campaign text null,
  checkout_state text null,
  payload jsonb not null default '{}'::jsonb
);
create index if not exists idx_site_activity_events_created_at on public.site_activity_events (created_at desc);
create index if not exists idx_site_activity_events_event_type_created_at on public.site_activity_events (event_type, created_at desc);
create index if not exists idx_site_activity_events_page_path_created_at on public.site_activity_events (page_path, created_at desc);
create index if not exists idx_site_activity_events_payload_city_created_at on public.site_activity_events ((payload->>'city'), created_at desc);
create index if not exists idx_site_activity_events_payload_region_created_at on public.site_activity_events ((payload->>'region'), created_at desc);
create index if not exists idx_site_activity_events_payload_device_created_at on public.site_activity_events ((payload->>'device_type'), created_at desc);

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

create table if not exists public.notification_events (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  event_type text not null,
  channel text null,
  booking_id uuid null,
  customer_profile_id uuid null,
  recipient_email text null,
  recipient_phone text null,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'queued',
  attempt_count integer not null default 0,
  next_attempt_at timestamptz null,
  max_attempts integer not null default 5,
  provider_response jsonb null,
  subject text null,
  body_text text null,
  body_html text null
);
create index if not exists idx_notification_events_event_type_created_at on public.notification_events (event_type, created_at desc);
create index if not exists idx_notification_events_template_key_created_at on public.notification_events ((payload->>'template_key'), created_at desc);

create table if not exists public.customer_vehicles (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  customer_profile_id uuid not null references public.customer_profiles(id) on delete cascade,
  vehicle_name text null,
  model_year integer null,
  make text null,
  model text null,
  vehicle_size text null,
  body_style text null,
  vehicle_category text null,
  is_exotic boolean not null default false,
  color text null,
  mileage_km numeric null,
  parking_location text null,
  alternate_service_address text null,
  notes_for_team text null,
  detailer_visible_notes text null,
  admin_private_notes text null,
  preferred_contact_name text null,
  contact_email text null,
  contact_phone text null,
  text_updates_opt_in boolean not null default false,
  live_updates_opt_in boolean not null default true,
  has_water_hookup boolean not null default false,
  has_power_hookup boolean not null default false,
  save_billing_on_file boolean not null default false,
  billing_label text null,
  display_order integer not null default 0,
  last_wash_at date null,
  next_cleaning_due_at date null,
  service_interval_days integer null,
  auto_schedule_opt_in boolean not null default false,
  last_package_code text null,
  last_addons jsonb not null default '[]'::jsonb,
  is_primary boolean not null default false
);

create table if not exists public.vehicle_catalog_cache (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  model_year integer not null,
  make text not null,
  model text not null,
  vehicle_type text not null default '',
  size_bucket text null,
  is_exotic boolean not null default false,
  source text not null default 'nhtsa_vpic',
  last_seen_at timestamptz not null default now(),
  unique (model_year, make, model, vehicle_type)
);

create table if not exists public.observation_annotations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  media_id uuid null references public.job_media(id) on delete cascade,
  author_type text null,
  author_name text null,
  annotation_text text null,
  thread_status text not null default 'visible',
  moderated_at timestamptz null,
  moderated_by_staff_user_id uuid null,
  moderated_by_name text null,
  moderation_reason text null
);

-- March 24, 2026 late-pass note
-- Public analytics continues to store raw events in public.site_activity_events.
-- Admin reporting now has pre-aggregated rollup tables for daily / weekly / monthly / yearly summaries, plus daily dimension and funnel rollups.
-- `/api/admin/analytics_rollups_refresh` rebuilds those tables from raw events for the selected window and `/api/admin/analytics_overview` prefers rollups before falling back to raw-event computation.


-- March 25, 2026 indexes / settings helpers
create index if not exists catalog_purchase_orders_status_idx on public.catalog_purchase_orders(status);
create index if not exists catalog_purchase_orders_reminder_at_idx on public.catalog_purchase_orders(reminder_at);
create index if not exists catalog_purchase_orders_item_key_idx on public.catalog_purchase_orders(item_key);
create index if not exists catalog_inventory_items_category_idx on public.catalog_inventory_items(category);
create index if not exists catalog_inventory_items_subcategory_idx on public.catalog_inventory_items(subcategory);
create index if not exists catalog_inventory_items_sort_key_idx on public.catalog_inventory_items(sort_key);
create index if not exists catalog_inventory_items_reuse_policy_idx on public.catalog_inventory_items(reuse_policy);
-- app_management_settings.pricing_catalog is now the canonical DB-backed pricing source, with bundled JSON as fallback. The expected JSON contract includes packages, addons, charts, service_areas, booking_rules, public_requirements, booking_rules.travel_pricing, and booking_rules.price_controls.

create index if not exists vehicle_catalog_cache_year_make_idx on public.vehicle_catalog_cache(model_year, make);
create index if not exists vehicle_catalog_cache_make_model_idx on public.vehicle_catalog_cache(make, model);


create table if not exists public.catalog_inventory_movements (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  item_id uuid null references public.catalog_inventory_items(id) on delete set null,
  item_key text null,
  booking_id uuid null references public.bookings(id) on delete set null,
  movement_type text not null check (movement_type in ('adjustment','job_use','receive','recount','waste','return')),
  qty_delta numeric(12,2) not null default 0,
  previous_qty numeric(12,2) null,
  new_qty numeric(12,2) null,
  unit_label text null,
  note text null,
  actor_name text null,
  actor_staff_user_id uuid null references public.staff_users(id) on delete set null,
  actor_customer_profile_id uuid null references public.customer_profiles(id) on delete set null
);

create table if not exists public.job_completion_checklists (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  booking_id uuid not null unique references public.bookings(id) on delete cascade,
  keys_returned boolean not null default false,
  water_disconnected boolean not null default false,
  electricity_disconnected boolean not null default false,
  debrief_completed boolean not null default false,
  suggested_next_steps text null,
  suggested_interval_days integer null,
  auto_schedule_requested boolean not null default false,
  completed_by_name text null,
  completed_by_staff_user_id uuid null references public.staff_users(id) on delete set null,
  completed_at timestamptz null,
  notes text null
);



alter table if exists public.customer_vehicles
  add column if not exists next_service_mileage_km numeric null;
alter table if exists public.customer_vehicles
  add column if not exists garage_display_media_url text null;
alter table if exists public.customer_vehicles
  add column if not exists garage_display_media_kind text null;

create table if not exists public.customer_vehicle_media (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  customer_profile_id uuid not null references public.customer_profiles(id) on delete cascade,
  vehicle_id uuid not null references public.customer_vehicles(id) on delete cascade,
  media_kind text not null default 'photo' check (media_kind in ('photo','video')),
  media_url text not null,
  capture_role text null,
  caption text null,
  alt_text text null,
  image_title text null,
  crop_history jsonb null,
  media_width_px integer null,
  media_height_px integer null,
  media_orientation text null,
  media_analysis jsonb null,
  is_primary boolean not null default false,
  is_deleted boolean not null default false,
  uploaded_by_customer boolean not null default true,
  media_score numeric null,
  media_score_label text null,
  media_score_status text not null default 'pending',
  admin_override_reason text null,
  original_media_id uuid null references public.customer_vehicle_media(id) on delete set null
);
create index if not exists customer_vehicle_media_vehicle_idx on public.customer_vehicle_media(vehicle_id, created_at desc);
create index if not exists customer_vehicle_media_customer_idx on public.customer_vehicle_media(customer_profile_id, created_at desc);

create table if not exists public.customer_reviews (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  customer_profile_id uuid null references public.customer_profiles(id) on delete set null,
  booking_id uuid null references public.bookings(id) on delete set null,
  vehicle_id uuid null references public.customer_vehicles(id) on delete set null,
  review_source text not null default 'app' check (review_source in ('app','google')),
  rating integer not null check (rating between 1 and 5),
  review_title text null,
  review_text text null,
  is_public boolean not null default false,
  status text not null default 'submitted' check (status in ('submitted','approved','rejected')),
  google_review_url text null,
  reviewer_name text null
);

create index if not exists catalog_inventory_movements_item_key_idx on public.catalog_inventory_movements(item_key);
create index if not exists catalog_inventory_movements_booking_id_idx on public.catalog_inventory_movements(booking_id);
create index if not exists customer_reviews_booking_id_idx on public.customer_reviews(booking_id);
create index if not exists customer_reviews_customer_profile_id_idx on public.customer_reviews(customer_profile_id);


-- Pass note: March 26, 2026
-- No new schema migration was required for the booking add-on imagery, public catalog autofill hardening,
-- low-stock reorder UI, or Amazon-link inventory intake pass.


-- 2026-03-28 late pass
-- No schema changes were required in this pass.
-- This pass repaired shared staff-auth compatibility, admin-shell loading UX, button contrast, and image-path issues.

-- March 29, 2026 gift / upload / endpoint pass
-- No new schema objects were required in this pass. Work focused on staff-session coverage, gift/account polish, upload validation, and documentation synchronization.

create index if not exists catalog_purchase_orders_reminder_sent_at_idx on public.catalog_purchase_orders(reminder_sent_at);

-- Last synchronized: 2026-03-29. Reviewed during the promo/block/session conversion and purchase-order reminder lifecycle pass.

-- April 8, 2026 admin route stabilization pass: no schema change; docs/build routing and shell repair only.


-- 2026-04-08 general ledger accounting backend foundation
create table if not exists public.accounting_accounts (
  code text primary key,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  sort_order integer not null default 0,
  label text not null,
  account_type text not null,
  account_group text null,
  normal_balance text not null default 'debit',
  is_active boolean not null default true,
  is_system boolean not null default false,
  notes text null
);

insert into public.accounting_accounts (code, sort_order, label, account_type, account_group, normal_balance, is_active, is_system, notes) values
('payroll_expense',250,'Payroll Expense','expense','direct_labor','debit',true,true,'Crew payroll cost posted from payroll runs.'),
('wages_payable',85,'Wages Payable','liability','current_liability','credit',true,true,'Crew payroll payable created when payroll runs are posted before payout.')
on conflict (code) do update set
  sort_order = excluded.sort_order,
  label = excluded.label,
  account_type = excluded.account_type,
  account_group = excluded.account_group,
  normal_balance = excluded.normal_balance,
  is_active = excluded.is_active,
  is_system = excluded.is_system,
  notes = excluded.notes,
  updated_at = now();

create table if not exists public.accounting_journal_entries (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  entry_date date not null default current_date,
  entry_type text not null default 'manual',
  status text not null default 'posted',
  reference_type text null,
  reference_id text null,
  payee_name text null,
  vendor_name text null,
  memo text null,
  subtotal_cad numeric(12,2) not null default 0,
  tax_cad numeric(12,2) not null default 0,
  total_cad numeric(12,2) not null default 0,
  due_date date null,
  paid_at timestamptz null,
  created_by_name text null,
  last_recorded_by_name text null,
  created_by_staff_user_id uuid null references public.staff_users(id) on delete set null,
  last_recorded_by_staff_user_id uuid null references public.staff_users(id) on delete set null
);

create table if not exists public.accounting_journal_lines (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  entry_id uuid not null references public.accounting_journal_entries(id) on delete cascade,
  line_order integer not null default 0,
  account_code text not null references public.accounting_accounts(code),
  direction text not null,
  amount_cad numeric(12,2) not null default 0,
  memo text null
);


create table if not exists public.staff_payroll_runs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  period_start date not null,
  period_end date not null,
  status text not null default 'draft' check (status in ('draft','posted','cancelled')),
  staff_count integer not null default 0,
  total_hours numeric(12,2) not null default 0,
  total_gross_cad numeric(12,2) not null default 0,
  note text null,
  accounting_entry_id uuid null references public.accounting_journal_entries(id) on delete set null,
  created_by_name text null,
  created_by_staff_user_id uuid null references public.staff_users(id) on delete set null,
  posted_at timestamptz null,
  posted_by_name text null,
  posted_by_staff_user_id uuid null references public.staff_users(id) on delete set null
);

create table if not exists public.staff_payroll_run_lines (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  payroll_run_id uuid not null references public.staff_payroll_runs(id) on delete cascade,
  staff_user_id uuid null references public.staff_users(id) on delete set null,
  staff_name text null,
  staff_email text null,
  line_order integer not null default 0,
  regular_hours numeric(12,2) not null default 0,
  overtime_hours numeric(12,2) not null default 0,
  total_hours numeric(12,2) not null default 0,
  scheduled_hours numeric(12,2) not null default 0,
  hourly_rate_cents integer not null default 0,
  gross_pay_cad numeric(12,2) not null default 0,
  booking_count integer not null default 0,
  availability_conflicts integer not null default 0,
  is_overworked boolean not null default false,
  note text null
);


create table if not exists public.accounting_month_end_checklists (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  month_start date not null unique,
  remittance_reviewed boolean not null default false,
  payables_reviewed boolean not null default false,
  receivables_reviewed boolean not null default false,
  statements_exported boolean not null default false,
  inventory_costs_reviewed boolean not null default false,
  profitability_reviewed boolean not null default false,
  notes text null,
  updated_by_name text null,
  updated_by_staff_user_id uuid null references public.staff_users(id) on delete set null
);


-- 2026-04-09 accounting reporting / inventory cost coverage support
create index if not exists accounting_journal_entries_reference_type_date_idx
  on public.accounting_journal_entries(reference_type, entry_date, status);

create index if not exists catalog_inventory_items_active_cost_idx
  on public.catalog_inventory_items(is_active, item_type, cost_cents, qty_on_hand);


-- 2026-04-09 accounting actor / receivables / profitability support
create index if not exists accounting_journal_entries_actor_date_idx
  on public.accounting_journal_entries(created_by_staff_user_id, entry_date);

create index if not exists accounting_records_balance_service_idx
  on public.accounting_records(order_status, service_date, balance_due_cad);


-- 2026-04-09 accounting month-end checklist support
create index if not exists accounting_month_end_checklists_month_start_idx
  on public.accounting_month_end_checklists(month_start);

create index if not exists idx_bookings_service_area_zone_date on public.bookings (service_area_zone, service_date desc);
create index if not exists idx_bookings_service_area_municipality_date on public.bookings (service_area_municipality, service_date desc);
create index if not exists idx_bookings_service_area_county_date on public.bookings (service_area_county, service_date desc);
create index if not exists idx_bookings_trusted_service_coordinate_status on public.bookings (trusted_service_coordinate_status, service_date desc);
create index if not exists idx_bookings_arrival_geofence_status on public.bookings (arrival_geofence_status, service_date desc);
-- Pass update 2026-04-12: No schema shape changes in this pass. Synced docs/build after removing duplicate clean-route folders, refreshing the deployed booking analytics smoke check, and tightening login form autocomplete attributes.


-- Pass 14 addition: accounting_records can track office-entered discounts for scope changes, weather adjustments, and service-recovery credits.
alter table if exists public.accounting_records
  add column if not exists discount_cad numeric(12,2) not null default 0;

-- App management settings keys in active use: pricing_catalog, document_templates, social_feeds.
-- Pass sync 2026-04-14 (pass 16): no DDL changes in this pass. Admin App Management repair, menu exposure, and documentation refresh only.


-- 2026-04-14 note: no DDL change in this pass; schema documentation refreshed to reflect App Management UI clarification and package family vs size-price reporting.
-- April 15, 2026 note: generated local legacy pricing-chart PNG assets from the bundled canonical pricing catalog and rewired chart fallbacks to `/assets/brand`; no relational DDL change in this pass.

-- Update note — 2026-04-16 pass20
-- No schema DDL change in this pass. Added explicit admin Pages Function wrappers for social feed and vehicle catalog endpoints to stop build-time import path failures.


-- 2026-04-16 crew time, availability, and payroll support
create index if not exists staff_users_role_active_idx
  on public.staff_users(role_code, is_active, full_name);

create index if not exists job_time_entries_booking_staff_event_idx
  on public.job_time_entries(booking_id, staff_user_id, created_at desc);

create index if not exists job_time_entries_staff_created_idx
  on public.job_time_entries(staff_user_id, created_at desc);

create index if not exists staff_availability_blocks_staff_window_idx
  on public.staff_availability_blocks(staff_user_id, start_at, end_at);

create index if not exists staff_payroll_runs_period_idx
  on public.staff_payroll_runs(period_start, period_end, status);

create index if not exists staff_payroll_run_lines_run_staff_idx
  on public.staff_payroll_run_lines(payroll_run_id, staff_user_id, line_order);

-- Update note — 2026-04-16 pass21
-- Added staff_users / job_time_entries schema coverage to the repo snapshot, staff availability blocks, payroll run tables, and payroll account seeds so crew time, workload review, and payroll posting can live in one system.

-- Pass 22 note: no schema DDL change. This pass focused on admin-accounting form layout, admin-staff left-side menu layout, and admin login/route rewrite normalization.

-- 2026-04-16 admin-nav and growth-direction pass
-- No schema DDL change in this pass.
-- App Management now uses additional logical settings keys:
--   quote_booking_settings
--   gift_delivery_settings
--   membership_plan_settings
-- Gift checkout now also captures recipient_name, delivery_date, and gift_message in checkout metadata for future delivery automation.

-- Pass 24 Sync — 2026-04-17
-- No DDL changes in this pass.
-- Existing app_management_settings now also feeds the public growth-settings endpoint for:
--   quote_booking_settings
--   gift_delivery_settings
--   membership_plan_settings
-- Public pages now read those settings for booking-led self-serve presentation, gift-delivery, and maintenance-plan presentation.


-- Pass sync: April 17, 2026 — no schema change. Public self-serve direction shifted away from a separate pricing-page quote builder and back to a booking-led embedded planner that preserves location restrictions, 21-day availability windows, and booking-page logic.

-- 2026-04-17 pass26: No DDL change in this pass. Booking-led self-serve and gift-system work reused existing app settings and purchase_context JSON storage.


-- April 17, 2026 recurring-plan interest capture
create table if not exists membership_interest_requests (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  full_name text not null,
  email text not null,
  phone text,
  postal_code text,
  vehicle_count integer not null default 1,
  preferred_cycle text,
  notes text,
  source_url text,
  status text not null default 'new'
);

create index if not exists membership_interest_requests_created_at_idx on membership_interest_requests (created_at desc);
create index if not exists membership_interest_requests_email_idx on membership_interest_requests (email);

-- 2026-04-20 pass28: Scheduled e-gift delivery automation and reminder-first recurring maintenance.
alter table if exists public.membership_interest_requests add column if not exists reminder_opt_in boolean not null default true;
alter table if exists public.membership_interest_requests add column if not exists reminder_status text not null default 'pending';
alter table if exists public.membership_interest_requests add column if not exists reminder_count integer not null default 0;
alter table if exists public.membership_interest_requests add column if not exists last_reminder_at timestamptz null;
alter table if exists public.membership_interest_requests add column if not exists next_reminder_at timestamptz null;
create index if not exists membership_interest_requests_next_reminder_at_idx on public.membership_interest_requests (next_reminder_at);
-- Gift delivery automation reuses purchase_context JSON on gift_certificates and notification_events for the send audit trail.


-- 2026-04-20 pass29: Move recurring maintenance reminders to customer-history timing.
alter table if exists public.customer_profiles add column if not exists maintenance_reminder_opt_in boolean not null default true;
alter table if exists public.customer_profiles add column if not exists maintenance_cycle_days integer null;
alter table if exists public.customer_profiles add column if not exists maintenance_last_service_at timestamptz null;
alter table if exists public.customer_profiles add column if not exists maintenance_last_reminder_at timestamptz null;
alter table if exists public.customer_profiles add column if not exists maintenance_next_reminder_at timestamptz null;
alter table if exists public.customer_profiles add column if not exists maintenance_reminder_status text not null default 'pending';
alter table if exists public.customer_profiles add column if not exists maintenance_reminder_count integer not null default 0;
create index if not exists customer_profiles_maintenance_next_reminder_at_idx on public.customer_profiles (maintenance_next_reminder_at);
create index if not exists customer_profiles_maintenance_last_service_at_idx on public.customer_profiles (maintenance_last_service_at desc);


-- Pass note 2026-04-20: no DDL required for the customer screen / social feed structured editor / garage visualization pass. This pass focused on UI rendering, booking-led maintenance interest gating, polished document output, and cleanup/renaming of obviously obsolete duplicate docs.


-- 2026-04-20 no-DDL note: booking overflow polish, maintenance conversion from complete detail, fleet handoff path.

-- Pass note 2026-04-21: added customer vehicle media, garage-display overrides, next-service mileage tracking, booking mileage capture, gallery slider groundwork, and geolocation arrival groundwork.


-- 2026-04-25 no-DDL pass: pricing embed stabilization, bundled review-proof fallback, and year-end accounting reporting/export built on existing accounting tables.


-- 2026-04-27 accounting workflow foundation: bank reconciliation, document attachments,
-- recurring expenses, payroll payout reconciliation, and accountant lock / close workflow.
create table if not exists public.accounting_documents (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  related_type text not null default 'journal_entry',
  related_id text null,
  document_kind text not null default 'attachment',
  title text not null,
  file_url text null,
  storage_path text null,
  mime_type text null,
  size_bytes bigint null,
  notes text null,
  uploaded_by_name text null,
  uploaded_by_staff_user_id uuid null references public.staff_users(id) on delete set null
);
create index if not exists accounting_documents_related_idx on public.accounting_documents (related_type, related_id, created_at desc);
create index if not exists accounting_documents_kind_idx on public.accounting_documents (document_kind, created_at desc);

create table if not exists public.accounting_recurring_expenses (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  vendor_name text not null,
  memo text null,
  expense_account_code text not null references public.accounting_accounts(code),
  payment_account_code text not null references public.accounting_accounts(code),
  posting_mode text not null default 'cash' check (posting_mode in ('cash','payable')),
  subtotal_cad numeric(12,2) not null default 0,
  tax_cad numeric(12,2) not null default 0,
  total_cad numeric(12,2) not null default 0,
  cadence text not null default 'monthly',
  next_due_date date not null default current_date,
  auto_post boolean not null default false,
  is_active boolean not null default true,
  notes text null,
  last_posted_at timestamptz null,
  last_posted_entry_id uuid null references public.accounting_journal_entries(id) on delete set null,
  created_by_name text null,
  updated_by_name text null,
  created_by_staff_user_id uuid null references public.staff_users(id) on delete set null,
  updated_by_staff_user_id uuid null references public.staff_users(id) on delete set null
);
create index if not exists accounting_recurring_expenses_due_idx on public.accounting_recurring_expenses (is_active, next_due_date asc);

create table if not exists public.accounting_bank_reconciliations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  account_code text not null references public.accounting_accounts(code),
  period_start date not null,
  period_end date not null,
  statement_ending_balance_cad numeric(12,2) not null default 0,
  calculated_book_balance_cad numeric(12,2) not null default 0,
  difference_cad numeric(12,2) not null default 0,
  outstanding_count integer not null default 0,
  cleared_journal_entry_ids jsonb null default '[]'::jsonb,
  status text not null default 'draft' check (status in ('draft','review','reconciled','locked')),
  notes text null,
  reconciled_by_name text null,
  reconciled_by_staff_user_id uuid null references public.staff_users(id) on delete set null
);
create index if not exists accounting_bank_reconciliations_period_idx on public.accounting_bank_reconciliations (account_code, period_start desc, period_end desc);

create table if not exists public.accounting_payroll_payout_reconciliations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  payroll_run_id uuid not null references public.staff_payroll_runs(id) on delete cascade,
  payout_date date not null default current_date,
  payment_account_code text not null references public.accounting_accounts(code),
  expected_gross_cad numeric(12,2) not null default 0,
  paid_gross_cad numeric(12,2) not null default 0,
  difference_cad numeric(12,2) not null default 0,
  status text not null default 'draft' check (status in ('draft','review','reconciled','paid')),
  note text null,
  accounting_entry_id uuid null references public.accounting_journal_entries(id) on delete set null,
  reconciled_by_name text null,
  reconciled_by_staff_user_id uuid null references public.staff_users(id) on delete set null
);
create unique index if not exists accounting_payroll_payout_reconciliations_run_idx on public.accounting_payroll_payout_reconciliations (payroll_run_id);
create index if not exists accounting_payroll_payout_reconciliations_date_idx on public.accounting_payroll_payout_reconciliations (payout_date desc);

create table if not exists public.accounting_period_closes (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  month_start date not null unique,
  status text not null default 'open' check (status in ('open','review','locked','closed')),
  checklist jsonb null,
  notes text null,
  locked_at timestamptz null,
  locked_by_name text null,
  locked_by_staff_user_id uuid null references public.staff_users(id) on delete set null
);
create index if not exists accounting_period_closes_status_idx on public.accounting_period_closes (status, month_start desc);

-- Pass sync 2026-04-27: pricing review-proof image fallback hard-wired on public proof cards, and the accounting workspace now includes foundational workflows for receipts/documents, recurring expenses, bank reconciliation, payroll payout reconciliation, and accountant period lock / close control.

-- 2026-04-29 pass: landing page content, add-on image merge safety, and admin add-on dependency/editor refinements.

-- 2026-04-30 pass note: no new SQL migration required for the product-linked landing-page expansion; this pass extended shared landing content, folder-backed routes, and documentation only.
