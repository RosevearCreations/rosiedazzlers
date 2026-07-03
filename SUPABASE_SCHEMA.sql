-- Build 205 note: sanity report and value-added roadmap only. No new DDL is required in this pass.
-- Future DDL candidates: quote pipeline metrics, Meta campaign ROI, memberships, vehicle history, proof-of-work checklists, and fleet account CRM.

-- Build 204 gallery media resilience pass.
-- No database schema changes are required.
-- Existing app_management_settings.before_after_gallery rows continue to be used.
-- Public gallery rendering now adds application-level field alias normalization,
-- packaged static fallback loading, and local image fallback metadata.

-- Build 201 friendly editor validation and route-copy sync pass.
-- No database schema changes are required.
-- Existing app_management_settings rows continue to store pricing_catalog,
-- landing_pages, social_feeds, and before_after_gallery payloads.
-- Inline validation, media picker hints, schema previews, and save-review summaries
-- run in the admin UI before saving to existing editable-setting rows.

-- Build 179 note — hard social publish blocking, local proof tasks, and quote acceptance tracking (2026-05-26)
-- New migration: sql/2026-05-26_build179_publish_block_tasks_quote_acceptance.sql
-- Adds public.local_seo_proof_tasks and optional quote_proposal_drafts delivery/acceptance fields.
-- Runtime endpoints:
--   functions/api/admin/local_seo_proof_tasks_save.js
--   functions/api/admin/local_seo_proof_tasks_list.js
--   functions/api/admin/quote_proposal_deliver.js
--   functions/api/quote_proposal_respond.js
-- Hard publish blocking is enforced in functions/api/admin/social_post_dispatch.js before webhook/API/manual posted actions.

-- Build 178 note: no new DDL; /api/admin/lead_conversion_status_save and /api/admin/lead_conversion_price_review_save use Build 175 lead_conversion_drafts and Build 177 final_price_review/final_price_status/final_price_total_cents/final_deposit_cents/final_price_reviewed_at fields.
-- Build 173 note — Admin Content Center FAQ editor bridge (2026-05-24)
-- No new DDL is required in Build 173.
-- The protected Admin Content Center uses existing public.public_faq_entries from Build 172.
-- New endpoints:
--   functions/api/admin/content_faqs_list.js
--   functions/api/admin/content_faqs_save.js
-- Route:
--   /admin-content.html and /admin-content/
-- Required live-data order:
--   1. sql/2026-05-24_build172_public_faq_content_foundation.sql
--   2. sql/2026-05-24_build173_admin_content_faq_editor_no_ddl_note.sql

-- ---
-- Build 170 customer dashboard signed-out fallback sync — 2026-05-24
-- Build 169 auth/API fallback sync — 2026-05-23
-- No destructive schema change. Runtime auth_me and analytics now fail open instead of returning browser-visible 500s when Supabase config or tables are temporarily unavailable.
-- Staff/client auth still require Supabase storage for successful login. Confirm staff_auth_sessions, customer_auth_sessions, staff_users, customer_profiles, and site_activity_events are applied.

-- Build 166 note (2026-05-23): no schema shape change.
-- Public routes and catalog fallback metadata were updated for COMPETETIVE.md completion.
-- See sql/2026-05-23_build166_competetive_completion_public_routes_no_ddl_note.sql.

-- Build 165 schema sync — booking photo-estimate link capture
-- Optional bookings.photo_estimate_links jsonb column added by:
-- sql/2026-05-22_build165_booking_photo_estimate_link_capture.sql
-- Checkout remains fallback-safe by also writing submitted links into booking notes.

-- Build 150 inventory image picker/fallback sync — 2026-05-17
-- Adds Admin Catalog image picker support and the matching schema migration in sql/2026-05-17_build150_inventory_image_picker_and_fallback.sql.
-- Saved DB inventory rows now preserve/accept image_url and optional receipt/station/service/Amazon fields while UI merge logic prevents blank DB images from masking bundled consumables/tools images.

-- Build 145 catalog DB import/admin backend workflow — 2026-05-15
-- Adds optional DB-first catalog migration foundations in sql/2026-05-15_build145_catalog_db_import_admin_workflows.sql:
-- catalog_import_batches, catalog_import_batch_rows, vendor_directory, catalog_item_receipts,
-- catalog_item_assignments, service_product_links, and optional catalog_inventory_items fields
-- receipt_url, assigned_station, service_tags, last_counted_at, and public_badge.
-- Runtime remains fallback-safe: public pages still merge bundled JSON with DB rows until import is complete.

-- Build 142 service-area DB/admin/SEO value pass — 2026-05-15
-- Added optional public.service_area_rules table in sql/2026-05-15_build142_service_area_db_admin_seo_value_pass.sql.
-- Public runtime remains fallback-safe: /api/service_area_rules_public reads service_area_rules first, then app_management_settings.service_area_rules, while bundled JSON remains the customer-facing fallback.
-- Admin endpoint added at functions/api/admin/service_area_rules.js for future DB/app-setting service-area editing.
-- SEO/docs/schema synchronized with one-H1 and local Oxford/Norfolk service-area discipline.

-- Build 140 value-add roadmap foundations — 2026-05-10
-- Adds optional DB-first foundation tables in sql/2026-05-10_build140_value_add_roadmap_foundations.sql:
-- app_option_libraries, app_media_library, and app_content_entries.
-- Runtime still falls back to bundled JSON and app_management_settings until these tables are deployed and populated.

-- Build 139 corrected dev cleanup synchronization — 2026-05-10
-- No DDL changes in this pass.
-- Documentation was archived/reset and root-level duplicate API JavaScript was removed from the corrected dev package.
-- The valid API function source remains functions/api/ and functions/api/admin/.
-- See sql/2026-05-10_build139_corrected_dev_cleanup_no_ddl_note.sql for the cleanup note.

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
-- Last synchronized: March 28, 2026. Reviewed during the pricing chart zoom/modal, manufacturer callout, local SEO metadata, and current-build synchronization pass.

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

create table if not exists public.staff_auth_sessions (
  id uuid primary key default gen_random_uuid(),
  staff_user_id uuid not null references public.staff_users(id) on delete cascade,
  token_hash text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  expires_at timestamptz not null,
  revoked_at timestamptz null,
  last_seen_at timestamptz null,
  ip_address text null,
  user_agent text null
);

create index if not exists idx_staff_auth_sessions_staff_user_id
  on public.staff_auth_sessions (staff_user_id);

create index if not exists idx_staff_auth_sessions_expires_at
  on public.staff_auth_sessions (expires_at);

create index if not exists idx_staff_auth_sessions_revoked_at
  on public.staff_auth_sessions (revoked_at);

create index if not exists idx_staff_auth_sessions_last_seen_at
  on public.staff_auth_sessions (last_seen_at);

create index if not exists idx_staff_auth_sessions_staff_active
  on public.staff_auth_sessions (staff_user_id, revoked_at, expires_at);

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
  completed_at timestamptz null,
  progress_last_viewed_at timestamptz null,
  progress_last_customer_message_at timestamptz null,
  progress_last_staff_update_at timestamptz null
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
create table if not exists public.promo_codes (id uuid primary key default gen_random_uuid(), created_at timestamptz not null default now(), updated_at timestamptz not null default now(), code text not null unique, active boolean not null default true, is_active boolean not null default true, discount_type text null, discount_percent numeric(6,2) null, discount_cents integer null, percent_off numeric(6,2) null, amount_off_cents integer null, starts_at timestamptz null, ends_at timestamptz null, starts_on date null, ends_on date null, max_uses integer null, uses integer not null default 0, notes text null, amazon_asin text null, amazon_title text null, amazon_match_status text null, amazon_match_score numeric(6,3) null, amazon_seller_name text null, amazon_brand text null, amazon_category text null, amazon_quantity_total numeric(12,2) null, amazon_net_total_cents integer null);
create table if not exists public.gift_products (id uuid primary key default gen_random_uuid(), created_at timestamptz not null default now(), updated_at timestamptz not null default now(), sku text not null unique, type text not null check (type in ('service','open','fixed_amount')), package_code text null, vehicle_size text null, face_value_cents integer not null default 0, currency text not null default 'CAD', is_active boolean not null default true, title text null, description text null);
create table if not exists public.gift_certificates (id uuid primary key default gen_random_uuid(), created_at timestamptz not null default now(), updated_at timestamptz not null default now(), code text not null unique, type text not null check (type in ('service','open','fixed_amount')), status text not null default 'active', currency text not null default 'CAD', package_code text null, vehicle_size text null, original_value_cents integer not null default 0, remaining_cents integer not null default 0, purchaser_email text null, recipient_name text null, recipient_email text null, stripe_session_id text null, redeemed_at timestamptz null, expires_at timestamptz null, notes text null);
create table if not exists public.job_updates (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by text not null,
  note text not null,
  visibility text not null default 'customer' check (visibility in ('customer','internal')),
  stage text not null default 'general',
  source_channel text not null default 'admin',
  review_status text not null default 'not_required',
  requires_admin_review boolean not null default false,
  customer_action_required boolean not null default false,
  customer_visible_at timestamptz null,
  approved_by_staff_user_id uuid null,
  approved_by_staff_name text null,
  parent_update_id uuid null references public.job_updates(id) on delete cascade,
  thread_status text not null default 'visible' check (thread_status in ('visible','hidden','internal_only','pinned')),
  moderated_at timestamptz null,
  moderated_by_name text null,
  moderation_reason text null,
  staff_user_id uuid null
);
create table if not exists public.job_media (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by text not null,
  kind text not null check (kind in ('photo','video')),
  caption text null,
  media_url text null,
  storage_bucket text null,
  storage_path text null,
  content_type text null,
  file_size_bytes bigint null,
  visibility text not null default 'customer' check (visibility in ('customer','internal')),
  stage text not null default 'general',
  source_channel text not null default 'admin',
  review_status text not null default 'not_required',
  requires_admin_review boolean not null default false,
  customer_action_required boolean not null default false,
  customer_visible_at timestamptz null,
  approved_by_staff_user_id uuid null,
  approved_by_staff_name text null,
  thread_status text not null default 'visible' check (thread_status in ('visible','hidden','internal_only','pinned')),
  moderated_at timestamptz null,
  moderated_by_name text null,
  moderation_reason text null,
  staff_user_id uuid null
);
create table if not exists public.job_signoffs (id uuid primary key default gen_random_uuid(), booking_id uuid not null references public.bookings(id) on delete cascade, created_at timestamptz not null default now(), signed_at timestamptz not null default now(), signer_type text not null check (signer_type in ('customer','staff')), signer_name text not null, signer_email text null, notes text null, user_agent text null, staff_user_id uuid null);
create table if not exists public.recovery_message_templates (id uuid primary key default gen_random_uuid(), created_at timestamptz not null default now(), updated_at timestamptz not null default now(), template_key text not null unique, channel text not null check (channel in ('email','sms')), provider text not null default 'manual', is_active boolean not null default true, subject_template text null, body_template text not null, variables jsonb not null default '[]'::jsonb, rules jsonb not null default '{}'::jsonb, notes text null);
create table if not exists public.catalog_inventory_items (id uuid primary key default gen_random_uuid(), created_at timestamptz not null default now(), updated_at timestamptz not null default now(), item_key text not null unique, item_type text not null check (item_type in ('tool','consumable')), name text not null, category text null, subcategory text null, description text null, image_url text null, amazon_url text null, is_public boolean not null default true, is_active boolean not null default true, qty_on_hand numeric(12,2) not null default 0, reorder_point numeric(12,2) not null default 0, reorder_qty numeric(12,2) not null default 0, unit_label text null, cost_cents integer null, preferred_vendor text null, vendor_sku text null, rating_value numeric(3,2) null, rating_count integer not null default 0, sort_key integer not null default 0, reuse_policy text not null default 'reorder' check (reuse_policy in ('reorder','single_use','never_reuse')), purchase_date date null, estimated_jobs_per_unit numeric(12,2) null, receipt_url text null, assigned_station text null, service_tags text[] null, last_counted_at timestamptz null, public_badge text null, amazon_asin text null, amazon_title text null, amazon_match_status text null, amazon_match_score numeric(6,3) null, amazon_seller_name text null, amazon_brand text null, amazon_category text null, amazon_quantity_total numeric(12,2) null, amazon_net_total_cents integer null, notes text null);
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

-- Build 132 — Admin add-on image hydration repair (May 8, 2026)
-- Admin App add-on selection now hydrates blank saved image_url and image_fallback_url fields
-- from the bundled default pricing catalog by matching add-on code.
-- The selected add-on editor shows a Current image loaded preview.
-- Public pricing catalog merge logic prevents blank saved media fields from masking fallback images.
-- No database DDL is required; see sql/2026-05-08_build132_admin_addon_media_hydration_note.sql.
-- Continue local SEO discipline: one clear H1 per exposed public page, locally relevant wording,
-- visible proof/review media, and no broken asset paths.
-- Restored missing assets/landing-page.js because landing pages still referenced it during static link checks.

-- Build 133 note: admin add-on PNG/R2 image hydration and landingLinksToText repair are frontend/data fallback changes only; no database DDL required. See sql/2026-05-08_build133_admin_addon_png_hydration_no_ddl_note.sql.

-- Build 134 sync 2026-05-08:
-- No DDL required. Admin add-on save button, populated editor suggestions, landing-page media fields, public landing API normalization, static landing metadata, structured data, and sitemap refresh are frontend/API/docs updates only.
-- Future DDL to consider only if media fields need relational storage instead of app_management_settings JSON: landing_page_media, landing_page_related_products, and editor suggestion dictionaries.


-- Build 135 admin landing / inventory option repair note
-- No DDL required for this pass. catalog_dropdown_options is stored through the existing app_settings mechanism; Admin Catalog merges saved rows with bundled gear/consumable JSON fallback.

-- Build 136 no-DDL note (2026-05-09): admin catalog click-to-edit, accounting pricing-window helper, sample homepage reviews, and pricing embedded booking continuation polish. See sql/2026-05-09_build136_admin_catalog_pricing_reviews_no_ddl_note.sql.

-- Build 141 service-area/water-rule fallback note (2026-05-14)
-- This pass is JSON-first and deploy-safe:
--   data/service_area_rules.json now seeds Oxford County and Norfolk County towns,
--   county fallback water-use reminders, and official links.
--   data/rosie_services_pricing_and_packages.json includes expanded service_areas.
-- Future DB-first step:
--   create a canonical service_area_rules table or app_settings key and let JSON remain fallback.

-- Root duplicate API files were removed again in Build 141; no DDL needed.

-- Build 143 note (2026-05-15): no DDL. Public consumables/gear pages now merge Supabase catalog rows over bundled JSON fallbacks so partial DB imports do not hide the rest of the catalog.


-- Build 146: Amazon Business CSV matching supports optional catalog_inventory_items amazon_* enrichment columns.

-- Build 147 schema sync (2026-05-16)
-- No DDL in this pass.
-- Admin App now exposes the catalog_dropdown_options app-setting editor in the UI.
-- Future DB candidate: move dropdown option libraries from app_settings JSON into normalized admin_dropdown_options rows after workflow validation.


-- Build 148 schema sync (2026-05-16)
-- Landing-page regional photos and add-on process/photo fields are currently stored in landing-page JSON/app settings and fallback files.
-- No DDL was required in Build 148; see sql/2026-05-16_build148_landing_photos_addon_pages_no_ddl_note.sql.
-- Future DB direction: landing_pages, media_library, and landing_page_media tables with draft/publish and source/consent metadata.

-- Build 149 note (2026-05-17): no database DDL required.
-- Admin App service areas/travel tiers were converted from a long row list into a compact selected-row editor.
-- Landing image fallback handling was improved in frontend/static files only.


-- Build 150 inventory image picker indexes
create index if not exists idx_catalog_inventory_items_image_url on public.catalog_inventory_items(image_url) where image_url is not null and image_url <> '';
create index if not exists idx_catalog_inventory_items_service_tags on public.catalog_inventory_items using gin(service_tags);
create index if not exists catalog_inventory_items_amazon_asin_idx on public.catalog_inventory_items(amazon_asin);
create index if not exists catalog_inventory_items_amazon_match_status_idx on public.catalog_inventory_items(amazon_match_status);

-- Build 151 media-library inventory image workflow (2026-05-18)
-- Admin Catalog can now read app_media_library through /api/admin/media_library_list,
-- while still falling back to app_management_settings.media_library and bundled JSON/R2 product images.
create table if not exists public.app_media_library (
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
create index if not exists idx_app_media_library_group_key on public.app_media_library(group_key);
create index if not exists idx_app_media_library_usage_contexts on public.app_media_library using gin(usage_contexts);
create index if not exists idx_app_media_library_source_status on public.app_media_library(source_status);
create index if not exists idx_app_media_library_media_type on public.app_media_library(media_type);
create index if not exists idx_app_media_library_inventory_images on public.app_media_library(group_key, sort_order) where source_status <> 'archived' and media_type in ('image', 'photo');
-- Build 151 also adds client-side duplicate image diagnostics, visible-image health scanning, and a bulk selected-row image repair action; those are frontend/API workflow updates over the existing inventory schema.


-- Build 153 deploy hotfix note (2026-05-18)
-- No DDL change. Repaired Cloudflare Pages Functions JavaScript in /api/admin/media_library_list,
-- removed duplicate landing_pages_public normalizePage keys, and added deploy-safety release checks.
-- Active DB baseline remains Build 150 inventory image indexes plus Build 151 app_media_library.
-- Build 153 schema sync note: no DDL changes. Cloudflare Pages Functions import-path hotfix only.
-- Build 154 note: no schema shape change; Cloudflare Pages Function shim hotfix only.

-- Build 155 note (2026-05-18): no schema shape change.
-- Repaired remaining root Cloudflare Pages Function import paths and hardened release checks.
-- Active DB baseline remains Build 150 inventory image indexes plus Build 151 app_media_library.

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



-- ---------------------------------------------------------------------------
-- Build 157 social API publish bridge note (2026-05-19)
-- ---------------------------------------------------------------------------
-- No DDL change is required beyond Build 156. Build 157 uses social_channels,
-- social_post_queue, and social_dispatch_attempts to attempt approved API/webhook
-- publishing for job progress photos and summaries, while retaining manual fallback.



-- Build 158 schema sync note - 2026-05-20
-- Social progress publishing now includes review/compliance gate columns on public.social_post_queue:
-- review_status, customer_consent_confirmed, plate_privacy_confirmed,
-- no_private_info_confirmed, platform_warnings, approved_at, approved_by_name,
-- compliance_note, caption_template_key, local_hashtag_set, and duplicate_signature.
-- Build 158 also adds social_caption_templates and social_hashtag_presets for reusable local captions.
-- Apply sql/2026-05-20_build158_social_review_gates_and_templates.sql after the Build 156 social queue migration.

-- Build 159 sync note - Social templates, scheduling helpers, duplicate review, and metrics snapshots
-- Apply sql/2026-05-20_build159_social_templates_schedule_duplicate_metrics.sql after Build 156 and Build 158 social migrations.
-- Adds duplicate review helper fields, social_metrics jsonb, social_post_metrics_snapshots, and additional caption/hashtag seeds.
-- Build 160 sync note - competitor sanity check and roadmap reset
-- No schema shape change. Build 160 added planning/docs checks and Services-page conversion guidance.


-- Build 161 conversion path / service chooser: no DDL.
-- Package display aliases and photo-estimate guidance are catalog/content metadata, not schema changes.

-- Build 162 booking condition recommender / media consent sync note
-- Apply sql/2026-05-21_build162_booking_condition_recommender_and_consent.sql after Build 161.
-- The booking UI now captures condition helper flags, photo-estimate intent, and
-- media-consent preference. Checkout currently appends those details into booking
-- notes for backwards compatibility; these optional columns prepare the DB for a
-- later admin/reporting pass that stores the values directly.


-- ---------------------------------------------------------------------------
-- Build 163 schema sync note — booking intake admin review
-- ---------------------------------------------------------------------------
-- Apply after Build 162:
--   sql/2026-05-21_build163_booking_intake_admin_review.sql
--
-- Adds optional staff workflow fields on public.bookings:
--   photo_estimate_status
--   condition_review_status
--   media_privacy_status
--   plate_privacy_reviewed
--   face_privacy_reviewed
--   address_privacy_reviewed
--   blur_crop_needed
--   blur_crop_complete
--
-- The application remains fallback-safe before this migration is applied.



-- Build 164 sync note (2026-05-22): booking intake review actions
-- Apply sql/2026-05-22_build164_booking_intake_review_actions.sql after Build 162 and Build 163.
-- Adds optional bookings.intake_review_note, bookings.intake_reviewed_at,
-- and bookings.intake_reviewed_by for staff photo-estimate/condition/media privacy review actions.


-- ---------------------------------------------------------------------------
-- Build 167 note — COMPETETIVE completion matrix structured lead/upload schema
-- ---------------------------------------------------------------------------
-- See sql/2026-05-23_build167_competetive_matrix_leads_upload_schema.sql.
-- Adds public.public_inquiry_leads for structured fleet/maintenance/public inquiry
-- capture and public.photo_estimate_uploads for optional quote-photo upload audit.
-- Direct public upload remains env-gated by PUBLIC_PHOTO_ESTIMATE_UPLOADS_ENABLED=true.

-- ---------------------------------------------------------------------------
-- Build 168 note — Admin Leads and Photo Estimate Review
-- ---------------------------------------------------------------------------
-- See sql/2026-05-23_build168_admin_leads_photo_review.sql.
-- Adds review fields to public.photo_estimate_uploads for /admin-leads:
-- staff_note, privacy_note, reviewed_at, reviewed_by_staff_user_id.
-- Build 168 also adds admin endpoints to list/save public_inquiry_leads and
-- photo_estimate_uploads, with fallback messaging when the Build 167/168 SQL
-- has not been applied yet.

-- ---------------------------------------------------------------------------
-- Build 169 note — auth/analytics graceful fallback
-- ---------------------------------------------------------------------------
-- See sql/2026-05-23_build169_auth_analytics_fallback_no_ddl_note.sql.
-- No new DDL is required for the fallback behavior. The code now returns signed-out
-- JSON from auth_me endpoints and skips analytics ingestion when storage/config is
-- unavailable instead of exposing raw browser 500s. staff_auth_sessions must exist
-- for staff login sessions.

-- ---------------------------------------------------------------------------
-- Build 170 note — customer dashboard signed-out fallback
-- ---------------------------------------------------------------------------
-- See sql/2026-05-24_build170_customer_dashboard_signed_out_fallback_no_ddl_note.sql.
-- No new DDL is required. The customer dashboard endpoint now treats unsigned
-- customer context as optional and returns a signed_out JSON payload instead of 401
-- noise when public pages check dashboard context before login.

-- ---------------------------------------------------------------------------
-- Build 171 note — Admin Leads quote preview
-- ---------------------------------------------------------------------------
-- See sql/2026-05-24_build171_admin_lead_quote_preview_no_ddl_note.sql.
-- No new DDL is required. The staff-protected /api/admin/lead_quote_preview endpoint
-- reads public_inquiry_leads plus linked photo_estimate_uploads to generate a
-- copy-ready internal quote starter. It depends on Build 167/168 tables for live
-- data and stays fallback-safe if optional Build 168 upload review-note columns are
-- not applied yet.


-- ---------------------------------------------------------------------------
-- Build 172 note — Public FAQ content foundation
-- ---------------------------------------------------------------------------
-- See sql/2026-05-24_build172_public_faq_content_foundation.sql.
-- Adds public.public_faq_entries as the DB-managed content target for the new
-- /faq route and /api/public_faqs endpoint. The FAQ page and endpoint remain
-- fallback-safe before this migration by using static Build 172 seed content.

-- ---------------------------------------------------------------------------
-- Build 174 note — quote/proposal draft foundation
-- ---------------------------------------------------------------------------
-- See sql/2026-05-24_build174_quote_proposal_drafts.sql.
-- Adds public.quote_proposal_drafts so /admin-leads can save generated quote
-- starters as persistent staff drafts tied to a public lead and/or booking.
-- The page remains copy-only before this migration, but saved drafts require
-- the table and Supabase service-role access.

-- Build 175 note — lead conversion drafts, expanded content blocks, gallery/privacy filtering, and conversion analytics.
-- See sql/2026-05-25_build175_lead_conversion_content_gallery_analytics.sql.
-- Adds public.lead_conversion_drafts so Admin Leads can create a safe draft booking/quote conversion record before a real booking is scheduled.
-- Adds public.site_content_blocks so Admin Content can manage specials, service blurbs, homepage cards, help article starters, trust proof, fleet copy, and maintenance copy.
-- Public gallery filtering now expects approved public consent/privacy fields before before/after media is reused publicly.
create table if not exists public.lead_conversion_drafts (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  lead_id uuid not null references public.public_inquiry_leads(id) on delete cascade,
  quote_proposal_draft_id uuid null references public.quote_proposal_drafts(id) on delete set null,
  status text not null default 'draft_booking',
  customer_name text null,
  customer_email text null,
  customer_phone text null,
  service_area text null,
  vehicle_count integer not null default 1,
  preferred_cadence text null,
  proposed_package_code text null,
  proposed_vehicle_size text null,
  proposed_booking jsonb not null default '{}'::jsonb,
  proposed_quote jsonb not null default '{}'::jsonb,
  internal_note text null,
  next_action text null,
  created_by_staff_user_id uuid null references public.staff_users(id) on delete set null,
  updated_by_staff_user_id uuid null references public.staff_users(id) on delete set null
);

create table if not exists public.site_content_blocks (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  content_type text not null,
  placement text not null default 'general',
  slug text not null,
  title text not null,
  summary text null,
  body text null,
  cta_label text null,
  cta_href text null,
  image_url text null,
  sort_order integer not null default 100,
  is_active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  unique (content_type, placement, slug)
);

-- ---------------------------------------------------------------------------
-- Build 176 note — reviewed conversion draft to real booking and privacy/dashboard warnings
-- ---------------------------------------------------------------------------
-- See sql/2026-05-25_build176_conversion_to_booking_dashboard_privacy.sql.
-- Adds optional converted_booking_id and converted_at fields to public.lead_conversion_drafts
-- so Admin Leads can trace a reviewed conversion draft to the live public.bookings row.
-- No new table is required. The live booking is only created by /api/admin/lead_conversion_create_booking
-- after staff confirms date, AM/PM slot, address, package, vehicle size, customer name, and email.
alter table public.lead_conversion_drafts
  add column if not exists converted_booking_id uuid null references public.bookings(id) on delete set null,
  add column if not exists converted_at timestamptz null;

-- ---------------------------------------------------------------------------
-- Build 177 note — conversion review queue, final price reconciliation, and local proof reporting
-- ---------------------------------------------------------------------------
-- See sql/2026-05-25_build177_conversion_review_price_local_proof.sql.
-- Adds optional final-price review fields to public.lead_conversion_drafts so
-- staff can keep a catalog-backed price reconciliation attached to the reviewed
-- draft before creating a real booking. Build 177 also adds /admin-conversions,
-- /api/admin/lead_conversion_price_reconcile, and /api/admin/local_seo_proof_report.
alter table public.lead_conversion_drafts
  add column if not exists final_price_review jsonb not null default '{}'::jsonb,
  add column if not exists final_price_status text not null default 'needs_review',
  add column if not exists final_price_total_cents integer null,
  add column if not exists final_deposit_cents integer null,
  add column if not exists final_price_reviewed_at timestamptz null;

-- ---------------------------------------------------------------------------
-- Build 180 note — accepted quote deposit/payment requests and final booking confirmation
-- ---------------------------------------------------------------------------
-- See sql/2026-05-26_build180_quote_deposit_booking_confirmation.sql.
-- Adds public.quote_deposit_payment_requests so accepted quote/proposal drafts
-- can generate a tracked deposit/payment request. Staff can mark a request paid,
-- link/confirm the final booking, and keep the accepted quote → deposit → booking
-- chain visible in Admin Leads. Public customer access uses /quote-payment.html
-- and /api/quote_deposit_request with a secure token.


-- Build 181 note — verified provider webhooks for quote deposits.
-- See sql/2026-05-26_build181_payment_webhooks_quote_deposits.sql.
-- quote_deposit_payment_requests now supports provider in ('manual','stripe','paypal') plus:
-- webhook_verified_at, webhook_processed_at, provider_event_id, provider_event_type,
-- provider_payment_intent_id, provider_order_id, provider_capture_id, provider_payload.
-- Stripe checkout.session.completed and PayPal PAYMENT.CAPTURE.COMPLETED / PAYMENT.SALE.COMPLETED
-- can settle quote_deposit_payment_requests automatically after signature verification.

-- ---------------------------------------------------------------------------
-- Build 182 note — webhook history, replay, receipt email queueing, refund tracking
-- ---------------------------------------------------------------------------
-- See sql/2026-05-26_build182_webhook_history_receipts_refunds.sql.
-- Adds public.quote_payment_webhook_events for verified/ignored/failed/replayed
-- Stripe/PayPal quote-deposit event history, plus public.quote_deposit_refund_records
-- for full and partial refund tracking. Extends public.quote_deposit_payment_requests
-- with refund and receipt email fields so provider webhooks and staff controls can
-- leave an auditable trail.

create table if not exists public.quote_payment_webhook_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  provider_event_id text not null,
  provider_event_type text not null,
  quote_deposit_payment_request_id uuid null references public.quote_deposit_payment_requests(id) on delete set null,
  booking_id uuid null,
  payment_reference text null,
  status text not null default 'received',
  replay_status text not null default 'not_replayed',
  replay_count integer not null default 0,
  last_replayed_at timestamptz null,
  last_error text null,
  raw_payload jsonb null,
  processed_payload jsonb null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint quote_payment_webhook_events_unique_provider_event unique (provider, provider_event_id)
);

create table if not exists public.quote_deposit_refund_records (
  id uuid primary key default gen_random_uuid(),
  quote_deposit_payment_request_id uuid not null references public.quote_deposit_payment_requests(id) on delete cascade,
  quote_proposal_draft_id uuid null references public.quote_proposal_drafts(id) on delete set null,
  lead_id uuid null references public.public_inquiry_leads(id) on delete set null,
  booking_id uuid null,
  provider text not null default 'manual',
  provider_refund_id text null,
  provider_event_id text null,
  provider_event_type text null,
  refund_status text not null default 'succeeded',
  refund_amount_cents integer not null default 0,
  currency text not null default 'CAD',
  reason text null,
  provider_payload jsonb null,
  refunded_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint quote_deposit_refund_records_unique_provider_refund unique (provider, provider_refund_id)
);

alter table public.quote_deposit_payment_requests
  add column if not exists refunded_amount_cents integer not null default 0,
  add column if not exists refund_status text null,
  add column if not exists latest_refund_id uuid null references public.quote_deposit_refund_records(id) on delete set null,
  add column if not exists latest_refund_at timestamptz null,
  add column if not exists receipt_email_status text null,
  add column if not exists receipt_email_queued_at timestamptz null,
  add column if not exists receipt_notification_event_id uuid null;

alter table public.quote_proposal_drafts
  add column if not exists deposit_receipt_status text null,
  add column if not exists latest_refund_status text null,
  add column if not exists refunded_amount_cents integer not null default 0;


-- Build 183 note (2026-05-30): no DDL required. Direct Stripe/PayPal refund initiation,
-- payment reconciliation export, webhook warning summaries, and image-requirements tracking
-- use existing Build 180–182 payment tables and documentation/data files.
-- See sql/2026-05-30_build183_direct_refunds_reconciliation_images_no_ddl_note.sql.

-- Build 184 note (2026-06-01): no DDL required. Payment refund polling, receipt requeueing,
-- accountant payment export, and media health scanning use existing Build 180-182 payment tables
-- plus data/image_requirements_build184.json. See sql/2026-06-01_build184_twenty_step_ops_media_payment_no_ddl_note.sql.


-- ---------------------------------------------------------------------------
-- Build 185 note — next 20 operational foundations
-- ---------------------------------------------------------------------------
-- See sql/2026-06-02_build185_next_twenty_ops_foundations.sql.
-- Adds DB-backed media_asset_tasks, processor-fee capture fields, final_balance_payment_requests,
-- payment_applications, month_end_close_checklists, and local_seo_task_cards.
-- Build 185 also upgrades Media Health to validate PNG/JPEG/WebP dimensions, adds an admin R2 upload endpoint,
-- adds HST/GST review and month-end close screens, and expands accountant/payment exports.


-- Build 186 verified water restrictions (2026-06-02)
-- No DDL required. The bundled service-area fallback and water-rule source files were updated:
-- - data/service_area_rules.json
-- - data/water_restriction_rules_build186.json
-- If public.service_area_rules is the active DB source, import/resave the updated rows so DB and bundled fallback match.


-- Build 187 local-page water-rule visibility note: no new DDL. Re-import service_area_rules/app_management landing page settings after deployment so DB content matches the verified Oxford/Norfolk water rules displayed on static town landing pages.

-- ============================================================================
-- Build 188 — editable water-restriction authority and hard-coding audit
-- Source migration: sql/2026-06-04_build188_editable_water_rules_hardcoding_audit.sql
-- Mutable municipal water-rule wording should be edited in this table or the
-- app_management_settings.water_restriction_rules payload. The stable bundled
-- fallback is data/water_restriction_rules.json.
-- ============================================================================

create table if not exists public.water_restriction_rules (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  label text not null,
  county text,
  effective_dates text,
  effective_start text,
  effective_end text,
  rule_summary text,
  address_rule text,
  residential_hours jsonb not null default '[]'::jsonb,
  commercial_industrial_hours jsonb not null default '[]'::jsonb,
  applies_to text,
  verified_sources jsonb not null default '[]'::jsonb,
  local_pages jsonb not null default '[]'::jsonb,
  towns jsonb not null default '[]'::jsonb,
  local_page_rules jsonb not null default '{}'::jsonb,
  source_summary text,
  verified_at date,
  next_review_at date,
  version text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.service_area_rules
  add column if not exists water_rule_key text;

create index if not exists idx_water_restriction_rules_active_county
  on public.water_restriction_rules (is_active, county, sort_order);

create index if not exists idx_water_restriction_rules_next_review
  on public.water_restriction_rules (next_review_at);

create index if not exists idx_service_area_rules_water_rule_key
  on public.service_area_rules (water_rule_key);

-- Build 189 editable site settings sync — 2026-06-04
-- Migration: sql/2026-06-04_build189_editable_site_settings_foundation.sql
-- Mutable content/configuration moved toward DB-first app_management_settings rows with stable JSON fallbacks:
--   business_profile, site_policies, document_templates, business_hours_holidays,
--   navigation_footer, option_libraries, analytics_event_registry, media_requirements,
--   landing_pages_content.
-- Runtime/admin endpoints:
--   /api/site_settings_public
--   /api/admin/editable_site_settings
-- Admin screen:
--   /admin-site-settings.html
-- Large landing-page fallback objects were extracted from functions/api/landing_pages_public.js
-- into data/landing_pages_content.json and functions/api/data/landing_pages_content.json.


-- Build 190: app_management_setting_history supports editable-site-setting version history.
CREATE TABLE IF NOT EXISTS public.app_management_setting_history (
  history_id bigserial PRIMARY KEY,
  key text NOT NULL,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);


-- Build 191 editable settings hardening: no new DDL. Uses Build 190 app_management_setting_history plus app_management_settings.

-- Build 192 editable operations completion note (2026-06-05)
-- No new Supabase DDL is required in this build.
-- Existing app_management_settings and app_management_setting_history tables now back
-- structured editable-domain editors, direct restore-from-history controls, media
-- requirement sync/restore controls, analytics registry warning checks, dynamic
-- policy/template rendering, and business-hours/holiday booking warnings.

-- Build 193 social templates and editable-setting validation note (2026-06-05)
-- No new DDL is required. Build 193 reuses app_management_settings and
-- app_management_setting_history for editable settings, and keeps optional
-- social_caption_templates/social_hashtag_presets as DB-first sources with
-- built-in fallback templates when those optional tables are not ready.

-- ---
-- Build 194 schema note — 2026-06-06
-- Build 194 adds no new DDL. It reuses app_management_settings,
-- app_management_setting_history, and site_activity_events for editable-setting
-- diff/preview tools and analytics registry quick-add. The no-DDL note is recorded at
-- sql/2026-06-06_build194_diff_preview_option_libraries_no_ddl_note.sql.

-- Build 195 schema/history/template/export preview pass — 2026-06-06
-- No DDL changes. Build 195 reuses app_management_settings, app_management_setting_history,
-- booking_events, and existing booking/document helpers for field-level validation markers,
-- selected-history diffs, template preview/test payloads, policy version stamping,
-- override reason logging, audit export, fallback reports, sitemap/robots previews,
-- structured-data previews, and media-requirement diffs.
-- See sql/2026-06-06_build195_schema_history_template_export_no_ddl_note.sql.

-- Build 196 admin live-error repair pass — 2026-06-06
-- No DDL changes. Reuses app_management_settings, bundled pricing JSON, and existing
-- local SEO proof/gallery settings. Fixes API method compatibility and Admin App
-- runtime fallback hydration without schema changes. See
-- sql/2026-06-06_build196_admin_live_error_repairs_no_ddl_note.sql.


-- Build 197 self-healing admin diagnostics pass
-- No DDL required. Pricing catalog diagnostics and repair continue using public.app_management_settings.
-- Repair writes only to key='pricing_catalog' and preserves existing DB values while filling missing bundled fallback groups/rows.
-- Route-copy parity and landing SEO readiness are UI/code checks only.


-- Build 198 friendly JSON editor conversion pass
-- No DDL required. Social feed, before/after gallery, and water-rule friendly editors
-- continue using existing app_management_settings and water-rule fallback payloads.
-- Raw JSON remains available only as an Advanced/emergency repair view.


-- Build 199 friendly Site Settings editor pass — 2026-06-07
-- No DDL required. Navigation/footer, analytics registry, media requirements,
-- holiday closures, landing-page content, and recovery-template rules continue
-- using existing JSON payload columns/settings rows. The UI now provides friendly
-- row/card editors and applies those rows back to the same DB/fallback payloads.
-- See sql/2026-06-07_build199_friendly_site_settings_editors_no_ddl_note.sql.

-- Build 200 friendly pricing editor completion pass — 2026-06-09
-- No DDL required. The selected-package detail editor and live chart helper
-- continue using the existing app_management_settings pricing_catalog payload.
-- Raw pricing JSON remains an emergency repair surface only; routine package
-- details and chart previews now use friendly editor state.
-- See sql/2026-06-09_build200_friendly_pricing_editors_no_ddl_note.sql.


-- Build 201 friendly validation/media/route sync pass — 2026-06-09
-- No DDL required. The release guard now syncs route copies and checks friendly
-- validation/media picker coverage.
-- See sql/2026-06-09_build201_friendly_validation_media_route_sync_no_ddl_note.sql.

-- Build 202 incident reports and marketing tracker pass — 2026-06-12
-- Adds DB-backed incident reports for private detailer/admin damage, faulty equipment,
-- pre-existing damage, customer dispute, safety, and other service incidents.
-- Customer-visible data is separated into approved_customer_summary,
-- approved_customer_discussion, public_evidence_items, public_visible, and
-- customer_visible_at so private staff/admin discussion does not leak to customers.
-- See sql/2026-06-12_build202_incident_reports_and_marketing.sql.

CREATE TABLE IF NOT EXISTS public.incident_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  incident_type text NOT NULL DEFAULT 'damage',
  severity text NOT NULL DEFAULT 'medium',
  status text NOT NULL DEFAULT 'open',
  decision_status text NOT NULL DEFAULT 'needs_review',
  vehicle_area text,
  equipment_name text,
  title text NOT NULL,
  private_report text NOT NULL,
  private_admin_discussion text,
  evidence_items jsonb NOT NULL DEFAULT '[]'::jsonb,
  decision_summary_private text,
  decision_made_by_staff_user_id uuid REFERENCES public.staff_users(id) ON DELETE SET NULL,
  decision_made_by_name text,
  decision_made_at timestamptz,
  approved_customer_summary text,
  approved_customer_discussion text,
  public_evidence_items jsonb NOT NULL DEFAULT '[]'::jsonb,
  public_visible boolean NOT NULL DEFAULT false,
  customer_visible_at timestamptz,
  reported_by_staff_user_id uuid REFERENCES public.staff_users(id) ON DELETE SET NULL,
  reported_by_staff_name text,
  reported_by_staff_email text,
  created_by_staff_user_id uuid REFERENCES public.staff_users(id) ON DELETE SET NULL,
  created_by_staff_name text,
  created_by_staff_email text,
  updated_by_staff_user_id uuid REFERENCES public.staff_users(id) ON DELETE SET NULL,
  updated_by_staff_name text,
  updated_by_staff_email text
);


-- Build 203 desktop/mobile visual polish note: no DDL required. Responsive visual targets are bundled in data/responsive_visual_registry.json and surfaced through /api/admin/responsive_visual_report until they are moved into app_management_settings with a friendly editor.

-- Build 206 value-added operations foundations: see sql/2026-06-14_build206_value_added_operations_foundations.sql for additive tables supporting gallery approvals, quote pipeline, Meta ROI, memberships, vehicle history, proof-of-work, fleet CRM, review requests, seasonal campaigns, and route clustering.


-- Build 207 Markdown consolidation and visual placeholder sanity pass
-- No DDL required. Admin documentation sanity and visual placeholder reporting use bundled JSON files and existing staff authentication.
-- See sql/2026-06-14_build207_markdown_visual_sanity_no_ddl_note.sql.

-- Build 208 connected workflow command center: no new DDL. Uses Build 206 value-added operation tables and bundled workflow_connection_build208.json to connect lead/quote -> booking -> proof -> payment -> review -> repeat maintenance. See sql/2026-06-14_build208_connected_workflow_command_center_no_ddl_note.sql.


-- Build 209 live detail interaction — 2026-06-17
-- Makes the original live-detailing promise explicit across job updates and media:
-- customer-visible now, admin-review-pending, or staff-only. Private media may be
-- stored by bucket/path and delivered with short-lived signed URLs. Public progress
-- responses filter internal booking events and expose only approved customer-safe rows.
-- See sql/2026-06-17_build209_live_detail_interaction.sql.
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS progress_last_viewed_at timestamptz null;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS progress_last_customer_message_at timestamptz null;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS progress_last_staff_update_at timestamptz null;
ALTER TABLE public.job_updates ADD COLUMN IF NOT EXISTS stage text NOT NULL DEFAULT 'general';
ALTER TABLE public.job_updates ADD COLUMN IF NOT EXISTS source_channel text NOT NULL DEFAULT 'admin';
ALTER TABLE public.job_updates ADD COLUMN IF NOT EXISTS review_status text NOT NULL DEFAULT 'not_required';
ALTER TABLE public.job_updates ADD COLUMN IF NOT EXISTS requires_admin_review boolean NOT NULL DEFAULT false;
ALTER TABLE public.job_updates ADD COLUMN IF NOT EXISTS customer_action_required boolean NOT NULL DEFAULT false;
ALTER TABLE public.job_updates ADD COLUMN IF NOT EXISTS customer_visible_at timestamptz null;
ALTER TABLE public.job_updates ADD COLUMN IF NOT EXISTS approved_by_staff_user_id uuid null;
ALTER TABLE public.job_updates ADD COLUMN IF NOT EXISTS approved_by_staff_name text null;
ALTER TABLE public.job_media ADD COLUMN IF NOT EXISTS storage_bucket text null;
ALTER TABLE public.job_media ADD COLUMN IF NOT EXISTS storage_path text null;
ALTER TABLE public.job_media ADD COLUMN IF NOT EXISTS content_type text null;
ALTER TABLE public.job_media ADD COLUMN IF NOT EXISTS file_size_bytes bigint null;
ALTER TABLE public.job_media ADD COLUMN IF NOT EXISTS stage text NOT NULL DEFAULT 'general';
ALTER TABLE public.job_media ADD COLUMN IF NOT EXISTS source_channel text NOT NULL DEFAULT 'admin';
ALTER TABLE public.job_media ADD COLUMN IF NOT EXISTS review_status text NOT NULL DEFAULT 'not_required';
ALTER TABLE public.job_media ADD COLUMN IF NOT EXISTS requires_admin_review boolean NOT NULL DEFAULT false;
ALTER TABLE public.job_media ADD COLUMN IF NOT EXISTS customer_action_required boolean NOT NULL DEFAULT false;
ALTER TABLE public.job_media ADD COLUMN IF NOT EXISTS customer_visible_at timestamptz null;
ALTER TABLE public.job_media ADD COLUMN IF NOT EXISTS approved_by_staff_user_id uuid null;
ALTER TABLE public.job_media ADD COLUMN IF NOT EXISTS approved_by_staff_name text null;
CREATE INDEX IF NOT EXISTS idx_job_updates_live_review ON public.job_updates (booking_id, review_status, visibility, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_job_media_live_review ON public.job_media (booking_id, review_status, visibility, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_job_media_storage_path ON public.job_media (storage_bucket, storage_path);

-- Build 210 connected live workflow schema synchronization (2026-06-17)
-- Canonical deployable migration: sql/2026-06-17_build210_connected_live_workflow.sql
alter table if exists public.bookings
  add column if not exists progress_last_staff_viewed_at timestamptz null,
  add column if not exists progress_last_customer_notified_at timestamptz null,
  add column if not exists progress_last_staff_notified_at timestamptz null,
  add column if not exists completed_summary_status text not null default 'not_generated',
  add column if not exists completed_summary_generated_at timestamptz null,
  add column if not exists review_request_blocked_reason text null;

alter table if exists public.job_updates
  add column if not exists recommendation_title text null,
  add column if not exists recommendation_amount_cents integer null,
  add column if not exists recommendation_status text null,
  add column if not exists customer_decision text null,
  add column if not exists customer_decision_at timestamptz null,
  add column if not exists customer_decision_note text null,
  add column if not exists linked_incident_report_id uuid null,
  add column if not exists linked_payment_request_id uuid null;

alter table if exists public.job_media
  add column if not exists duration_seconds numeric(10,2) null,
  add column if not exists upload_status text not null default 'complete',
  add column if not exists upload_session_id uuid null,
  add column if not exists retention_policy text not null default 'standard_365_days',
  add column if not exists retention_expires_at timestamptz null,
  add column if not exists gallery_reuse_status text not null default 'not_queued',
  add column if not exists vehicle_history_reuse_status text not null default 'not_queued';

create table if not exists public.live_upload_sessions (
  id uuid primary key default gen_random_uuid(), booking_id uuid not null, staff_user_id uuid null,
  filename text not null, content_type text null, file_size_bytes bigint null, duration_seconds numeric(10,2) null,
  storage_bucket text null, storage_path text null, status text not null default 'prepared', progress_percent integer not null default 0,
  retry_count integer not null default 0, last_error text null, retention_policy text not null default 'standard_365_days',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), completed_at timestamptz null, cancelled_at timestamptz null
);

create table if not exists public.completed_job_summaries (
  id uuid primary key default gen_random_uuid(), booking_id uuid not null unique, customer_profile_id uuid null, vehicle_id uuid null,
  status text not null default 'draft', summary_title text not null, service_summary text null, proof_items jsonb not null default '[]'::jsonb,
  products_used jsonb not null default '[]'::jsonb, care_advice jsonb not null default '[]'::jsonb,
  maintenance_recommendations jsonb not null default '[]'::jsonb, invoice_reference text null, payment_status text null,
  customer_visible boolean not null default false, generated_by_staff_user_id uuid null, generated_by_staff_name text null,
  generated_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table if not exists public.gallery_media_candidates (
  id uuid primary key default gen_random_uuid(), booking_id uuid not null, job_media_id uuid not null unique, media_url text null,
  storage_bucket text null, storage_path text null, caption text null, stage text null, consent_status text not null default 'needs_pairing_review',
  status text not null default 'queued', queued_by_staff_user_id uuid null, queued_by_staff_name text null,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

-- Build 211 production reliability schema sync (2026-06-18)
-- Canonical deployable migration: sql/2026-06-18_build211_production_reliability.sql
-- Adds final_balance_payment_requests provider/checkout metadata, job_media retention_status,
-- live_upload_sessions reliability fields, notification_provider_test_logs,
-- storage_retention_audit, and production_reliability_audits.

-- Build 212 guided production testing schema sync
-- Canonical deployable migration: sql/2026-06-20_build212_guided_production_testing.sql
-- Adds public.production_test_runs for protected acceptance outcomes (passed/failed/blocked/not_started).
-- Keep test notes/evidence free of secrets, card data, customer addresses, VINs, and private incident media.

-- Build 213 owner action and customer trust schema sync (2026-06-22)
-- Canonical deployable migration: sql/2026-06-22_build213_owner_action_customer_trust.sql
-- Build 213 — owner-action controls and customer-trust closeout.
-- Run after Builds 209–212. It adds task ownership/snoozing, customer acknowledgement
-- for priced in-job recommendations, completed-summary revision/audit support, and
-- optional walkaround/caption metadata. Do not store card data or private incident facts
-- in these fields.

create table if not exists public.owner_attention_tasks (
  id uuid primary key default gen_random_uuid(),
  source_type text not null default 'generated',
  source_key text not null,
  booking_id uuid null,
  title text not null,
  detail text null,
  urgency text not null default 'normal' check (urgency in ('urgent','high','normal','low')),
  status text not null default 'open' check (status in ('open','snoozed','resolved')),
  assigned_to_staff_user_id uuid null,
  assigned_to_staff_name text null,
  snoozed_until timestamptz null,
  suppress_source_until timestamptz null,
  resolution_note text null,
  resolved_at timestamptz null,
  resolved_by_staff_user_id uuid null,
  resolved_by_staff_name text null,
  created_by_staff_user_id uuid null,
  created_by_staff_name text null,
  last_action_by_staff_user_id uuid null,
  last_action_by_staff_name text null,
  last_action_at timestamptz null,
  target_url text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists owner_attention_tasks_source_idx on public.owner_attention_tasks (source_type, source_key, updated_at desc);
create index if not exists owner_attention_tasks_active_idx on public.owner_attention_tasks (status, snoozed_until, suppress_source_until, updated_at desc);

create table if not exists public.live_interaction_audit_events (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid null,
  event_type text not null,
  entity_type text null,
  entity_id uuid null,
  actor_name text null,
  detail text null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists live_interaction_audit_events_booking_idx on public.live_interaction_audit_events (booking_id, created_at asc);

alter table if exists public.job_updates
  add column if not exists customer_acknowledgement_name text null,
  add column if not exists customer_acknowledged_at timestamptz null,
  add column if not exists customer_acknowledgement_version text null,
  add column if not exists vehicle_area text null,
  add column if not exists condition_tag text null;

alter table if exists public.job_media
  add column if not exists vehicle_area text null,
  add column if not exists condition_tag text null,
  add column if not exists transcript_text text null,
  add column if not exists poster_storage_bucket text null,
  add column if not exists poster_storage_path text null;

create table if not exists public.recommendation_price_acknowledgements (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null,
  job_update_id uuid not null,
  payment_request_id uuid null,
  recommendation_title text null,
  amount_cents integer not null,
  acknowledgement_name text not null,
  acknowledgement_version text not null default 'in_job_add_on_terms_v1',
  acknowledged_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index if not exists recommendation_price_acknowledgements_booking_idx on public.recommendation_price_acknowledgements (booking_id, acknowledged_at desc);

alter table if exists public.completed_job_summaries
  add column if not exists revision_number integer not null default 1,
  add column if not exists customer_acknowledged_at timestamptz null,
  add column if not exists customer_acknowledged_name text null,
  add column if not exists customer_acknowledgement_version text null;

create table if not exists public.completed_job_summary_revisions (
  id uuid primary key default gen_random_uuid(),
  summary_id uuid not null,
  booking_id uuid not null,
  revision_number integer not null,
  snapshot jsonb not null,
  revised_by_staff_name text null,
  revised_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index if not exists completed_job_summary_revisions_booking_idx on public.completed_job_summary_revisions (booking_id, revised_at desc);

comment on table public.owner_attention_tasks is 'Build 213 owner task controls: assignment, snooze and temporary resolution of generated operational attention items.';
comment on table public.live_interaction_audit_events is 'Build 213 non-sensitive staff/audit event export stream for a booking. Never store secrets or private incident media.';
comment on table public.recommendation_price_acknowledgements is 'Customer typed-name acknowledgement of a priced in-job recommendation; not a substitute for legal advice or a signed contract where one is required.';



-- Build 214 Supabase RLS and owner task orchestration schema sync
-- Primary migration: sql/2026-06-23_build214_security_task_orchestration.sql
-- Adds owner_attention_tasks.due_at/escalation fields, locks public tables behind RLS,
-- revokes direct browser-role table grants, and exposes protected rosie_security_posture_report().

-- Build 215 — media asset format alignment and DAIP planning note (2026-06-30)
-- Apply sql/2026-06-30_build215_media_asset_format_alignment.sql to align legacy public.media_asset_tasks
-- Local Hero .webp records with the canonical public JPG keys used by the verified R2 uploads.
-- No DAIP production schema is added in Build 215. Future DAIP Phase 1 requires a separate reviewed migration.

-- Build 216 — public media reliability schema note (2026-07-01)
-- Apply sql/2026-07-01_build216_media_reliability_daip_governance.sql after Build 214.
-- Adds RLS-protected public.media_asset_health_observations and public.media_asset_alerts,
-- plus service-role-only public.rosie_record_media_asset_observations(jsonb,text,text).
-- First failed scan is monitoring; second consecutive failure becomes active;
-- a passing scan resolves. Do not add customer/job/incident/private URL data to these tables.
-- DAIP remains planning-only in Build 216; no daip_* production table is included.

-- Build 217 — secure final-balance payment-link schema note (2026-06-30)
-- Apply sql/2026-06-30_build217_secure_final_balance_links.sql after the existing final-balance/Build 214 migration.
-- Adds expiry, link-rotation/send, cancellation, paid-amount, Stripe payment-intent, and provider-event fields to public.final_balance_payment_requests.
-- token_hash holds only a SHA-256 hash of a 32-byte opaque public link token; never return it to a browser or grant direct browser table access.



-- Build 218 DAIP internal-test foundation is appended as the canonical latest schema delta.
-- Apply in development/staging only while DAIP remains metadata-only.
-- Build 218 — DAIP internal-test foundation.
--
-- This migration deliberately does NOT create a public media route, storage bucket,
-- signed URL issuer, upload endpoint, worker, proxy, AI service, export process, or
-- publication integration. It gives Rosie Dazzlers a private, auditable test registry
-- so owners can prove the DAIP safety process with harmless internal test media first.
--
-- Run only after Build 214 RLS containment is active. Browser clients continue to use
-- protected Cloudflare Functions; service_role is the only database-facing application role.

begin;

create table if not exists public.daip_test_control (
  singleton boolean primary key default true check (singleton is true),
  mode text not null default 'internal_test' check (mode = 'internal_test'),
  storage_provisioned boolean not null default false check (storage_provisioned is false),
  worker_enabled boolean not null default false check (worker_enabled is false),
  public_export_enabled boolean not null default false check (public_export_enabled is false),
  automatic_publishing_enabled boolean not null default false check (automatic_publishing_enabled is false),
  notes text not null default 'Build 218 internal test only. No customer media, public exports, worker execution, or automatic publishing.',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.daip_test_control (singleton)
values (true)
on conflict (singleton) do nothing;

create table if not exists public.daip_test_daily_sequences (
  job_date date primary key,
  next_number integer not null default 0 check (next_number >= 0),
  updated_at timestamptz not null default now()
);

create table if not exists public.daip_media_jobs (
  id uuid primary key default gen_random_uuid(),
  job_code text not null unique check (job_code ~ '^RD-TEST-[0-9]{8}-[0-9]{3,}$'),
  test_booking_reference text not null check (test_booking_reference ~ '^RD-TEST-BOOKING-[A-Z0-9-]{3,80}$'),
  safe_label text not null check (char_length(safe_label) between 3 and 160),
  job_date date not null default current_date,
  status text not null default 'created' check (status in ('created','intake_ready','privacy_review_required','internal_review_complete','archived')),
  test_mode boolean not null default true check (test_mode is true),
  internal_test_only boolean not null default true check (internal_test_only is true),
  contains_customer_data boolean not null default false check (contains_customer_data is false),
  contains_incident_material boolean not null default false check (contains_incident_material is false),
  public_export_blocked boolean not null default true check (public_export_blocked is true),
  processor_execution_blocked boolean not null default true check (processor_execution_blocked is true),
  storage_mode text not null default 'metadata_only' check (storage_mode = 'metadata_only'),
  consent_scope text not null default 'internal_test_only' check (consent_scope = 'internal_test_only'),
  created_by_staff_user_id uuid null references public.staff_users(id) on delete set null,
  archived_by_staff_user_id uuid null references public.staff_users(id) on delete set null,
  archived_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.daip_media_assets (
  id uuid primary key default gen_random_uuid(),
  media_job_id uuid not null references public.daip_media_jobs(id) on delete cascade,
  safe_filename text not null check (safe_filename !~ '[\\/]' and char_length(safe_filename) between 1 and 160),
  asset_kind text not null check (asset_kind in ('test_photo','test_video')),
  capture_stage text not null check (capture_stage in ('before','process','after','other')),
  mime_type text not null check (mime_type in ('image/jpeg','image/png','image/webp','video/mp4','video/quicktime')),
  file_size_bytes bigint not null default 0 check (file_size_bytes >= 0 and file_size_bytes <= 10737418240),
  source_reference_label text not null check (char_length(source_reference_label) between 3 and 240),
  source_mode text not null default 'metadata_only' check (source_mode = 'metadata_only'),
  storage_status text not null default 'not_uploaded' check (storage_status = 'not_uploaded'),
  checksum_sha256 text null check (checksum_sha256 is null or checksum_sha256 ~ '^[A-Fa-f0-9]{64}$'),
  privacy_status text not null default 'not_reviewed' check (privacy_status in ('not_reviewed','manual_review_required','internal_only_cleared','blocked_private')),
  public_export_blocked boolean not null default true check (public_export_blocked is true),
  registered_by_staff_user_id uuid null references public.staff_users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (media_job_id, safe_filename)
);

create table if not exists public.daip_processing_tasks (
  id uuid primary key default gen_random_uuid(),
  media_job_id uuid not null references public.daip_media_jobs(id) on delete cascade,
  task_type text not null check (task_type in ('intake_validation','private_storage_plan','manual_privacy_review','worker_preflight')),
  status text not null default 'not_scheduled' check (status in ('not_scheduled','blocked_pending_worker','ready_for_manual_review','cancelled')),
  execution_blocked boolean not null default true check (execution_blocked is true),
  attempts integer not null default 0 check (attempts = 0),
  safe_note text null check (safe_note is null or char_length(safe_note) <= 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (media_job_id, task_type)
);

create table if not exists public.daip_privacy_reviews (
  id uuid primary key default gen_random_uuid(),
  media_asset_id uuid not null unique references public.daip_media_assets(id) on delete cascade,
  review_status text not null default 'not_started' check (review_status in ('not_started','manual_review_required','internal_only_cleared','blocked_private')),
  reviewer_note text null check (reviewer_note is null or char_length(reviewer_note) <= 2000),
  reviewer_staff_user_id uuid null references public.staff_users(id) on delete set null,
  public_export_blocked boolean not null default true check (public_export_blocked is true),
  reviewed_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.daip_audit_events (
  id uuid primary key default gen_random_uuid(),
  media_job_id uuid null references public.daip_media_jobs(id) on delete cascade,
  media_asset_id uuid null references public.daip_media_assets(id) on delete cascade,
  actor_staff_user_id uuid null references public.staff_users(id) on delete set null,
  event_type text not null check (event_type in ('test_job_created','test_asset_registered','privacy_review_saved','test_job_archived','test_task_seeded')),
  reason text null check (reason is null or char_length(reason) <= 1000),
  safe_metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists daip_media_jobs_status_created_idx
  on public.daip_media_jobs (status, created_at desc);
create index if not exists daip_media_jobs_test_reference_idx
  on public.daip_media_jobs (test_booking_reference, created_at desc);
create index if not exists daip_media_assets_job_created_idx
  on public.daip_media_assets (media_job_id, created_at asc);
create index if not exists daip_processing_tasks_job_status_idx
  on public.daip_processing_tasks (media_job_id, status, created_at asc);
create index if not exists daip_privacy_reviews_status_idx
  on public.daip_privacy_reviews (review_status, reviewed_at asc nulls first);
create index if not exists daip_audit_events_job_created_idx
  on public.daip_audit_events (media_job_id, created_at asc);

create or replace function public.daip_next_test_job_code(p_job_date date default current_date)
returns text
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_date date := coalesce(p_job_date, current_date);
  v_number integer;
begin
  insert into public.daip_test_daily_sequences (job_date, next_number, updated_at)
  values (v_date, 1, now())
  on conflict (job_date) do update
    set next_number = public.daip_test_daily_sequences.next_number + 1,
        updated_at = now()
  returning next_number into v_number;

  return 'RD-TEST-' || to_char(v_date, 'YYYYMMDD') || '-' || lpad(v_number::text, 3, '0');
end;
$$;

-- The test-control row is intentionally not editable through the app. Moving to a
-- different mode requires a separately reviewed future migration and owner approval.
update public.daip_test_control
set mode = 'internal_test', storage_provisioned = false, worker_enabled = false,
    public_export_enabled = false, automatic_publishing_enabled = false,
    updated_at = now()
where singleton = true;

alter table public.daip_test_control enable row level security;
alter table public.daip_test_daily_sequences enable row level security;
alter table public.daip_media_jobs enable row level security;
alter table public.daip_media_assets enable row level security;
alter table public.daip_processing_tasks enable row level security;
alter table public.daip_privacy_reviews enable row level security;
alter table public.daip_audit_events enable row level security;

revoke all privileges on table public.daip_test_control from public, anon, authenticated;
revoke all privileges on table public.daip_test_daily_sequences from public, anon, authenticated;
revoke all privileges on table public.daip_media_jobs from public, anon, authenticated;
revoke all privileges on table public.daip_media_assets from public, anon, authenticated;
revoke all privileges on table public.daip_processing_tasks from public, anon, authenticated;
revoke all privileges on table public.daip_privacy_reviews from public, anon, authenticated;
revoke all privileges on table public.daip_audit_events from public, anon, authenticated;

grant all privileges on table public.daip_test_control to service_role;
grant all privileges on table public.daip_test_daily_sequences to service_role;
grant all privileges on table public.daip_media_jobs to service_role;
grant all privileges on table public.daip_media_assets to service_role;
grant all privileges on table public.daip_processing_tasks to service_role;
grant all privileges on table public.daip_privacy_reviews to service_role;
grant all privileges on table public.daip_audit_events to service_role;
revoke all on function public.daip_next_test_job_code(date) from public, anon, authenticated;
grant execute on function public.daip_next_test_job_code(date) to service_role;

comment on table public.daip_test_control is
  'Build 218 DAIP test-mode hard stop. All flags intentionally enforce internal-test/no-storage/no-worker/no-public-export/no-auto-publish.';
comment on table public.daip_media_jobs is
  'Build 218 internal DAIP test-job registry. No customer data, incident media, public export, storage path, or worker execution is allowed.';
comment on table public.daip_media_assets is
  'Build 218 DAIP metadata-only test asset registry. Deliberately has no public URL, signed URL, bucket, or storage key column.';
comment on table public.daip_processing_tasks is
  'Build 218 DAIP non-executing planning queue. All tasks remain execution_blocked until a future reviewed worker phase.';
comment on table public.daip_privacy_reviews is
  'Build 218 internal-only privacy review record. It cannot approve public export.';
comment on table public.daip_audit_events is
  'Build 218 DAIP audit trail. Store only safe metadata; never secrets, signed URLs, customer data, addresses, VINs, payment data, or incident evidence.';

commit;


-- Canonical mirror: 2026-07-02_build219_daip_governance_workspace.sql
-- Build 219 — DAIP owner-decision governance and promotion-readiness workspace.
--
-- This migration records the DAIP-0 owner decisions that must be complete before
-- any private storage, upload, worker, AI, public derivative, or publishing build
-- can even be reviewed. It intentionally does NOT provision media storage, accept
-- bytes, issue signed URLs, create a worker queue, or enable export/publishing.
--
-- Run only after Build 214 security containment and Build 218 internal-test mode.
-- Browser clients remain behind protected Cloudflare Functions; service_role is
-- the sole application database role for these records.

begin;

create table if not exists public.daip_governance_decisions (
  id uuid primary key default gen_random_uuid(),
  decision_key text not null unique check (decision_key in (
    'DAIP-0-01','DAIP-0-02','DAIP-0-03','DAIP-0-04','DAIP-0-05','DAIP-0-06',
    'DAIP-0-07','DAIP-0-08','DAIP-0-09','DAIP-0-10','DAIP-0-11','DAIP-0-12'
  )),
  decision_title text not null check (char_length(decision_title) between 3 and 160),
  resolution_status text not null default 'draft' check (resolution_status in ('draft','approved')),
  decision_owner_label text not null check (char_length(decision_owner_label) between 2 and 120),
  decision_summary text not null check (char_length(decision_summary) between 12 and 2400),
  business_cost_impact text not null check (char_length(business_cost_impact) between 6 and 1600),
  privacy_safety_impact text not null check (char_length(privacy_safety_impact) between 6 and 1600),
  review_due_on date not null,
  approved_by_staff_user_id uuid null references public.staff_users(id) on delete set null,
  approved_by_staff_email text null check (approved_by_staff_email is null or char_length(approved_by_staff_email) <= 320),
  approved_at timestamptz null,
  recorded_by_staff_user_id uuid null references public.staff_users(id) on delete set null,
  recorded_by_staff_email text null check (recorded_by_staff_email is null or char_length(recorded_by_staff_email) <= 320),
  revision_number integer not null default 1 check (revision_number >= 1),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (resolution_status = 'approved' and approved_at is not null)
    or (resolution_status = 'draft' and approved_at is null)
  )
);

create table if not exists public.daip_governance_audit_events (
  id uuid primary key default gen_random_uuid(),
  decision_key text not null check (decision_key in (
    'DAIP-0-01','DAIP-0-02','DAIP-0-03','DAIP-0-04','DAIP-0-05','DAIP-0-06',
    'DAIP-0-07','DAIP-0-08','DAIP-0-09','DAIP-0-10','DAIP-0-11','DAIP-0-12'
  )),
  event_type text not null check (event_type in ('decision_drafted','decision_approved','decision_reopened')),
  actor_staff_user_id uuid null references public.staff_users(id) on delete set null,
  actor_staff_email text null check (actor_staff_email is null or char_length(actor_staff_email) <= 320),
  revision_number integer not null check (revision_number >= 1),
  safe_note text null check (safe_note is null or char_length(safe_note) <= 500),
  created_at timestamptz not null default now()
);

create index if not exists daip_governance_decisions_status_idx
  on public.daip_governance_decisions (resolution_status, updated_at desc);
create index if not exists daip_governance_audit_events_decision_created_idx
  on public.daip_governance_audit_events (decision_key, created_at desc);

alter table public.daip_governance_decisions enable row level security;
alter table public.daip_governance_audit_events enable row level security;

revoke all privileges on table public.daip_governance_decisions from public, anon, authenticated;
revoke all privileges on table public.daip_governance_audit_events from public, anon, authenticated;
grant all privileges on table public.daip_governance_decisions to service_role;
grant all privileges on table public.daip_governance_audit_events to service_role;

comment on table public.daip_governance_decisions is
  'Build 219 owner-decision register for DAIP-0. This records governance only and cannot provision storage, uploads, workers, exports, or automatic publishing.';
comment on table public.daip_governance_audit_events is
  'Build 219 DAIP governance audit trail. Keep only safe decision metadata; never store secrets, keys, signed URLs, customer media, addresses, VINs, payment data, or incident evidence.';

commit;


-- ============================================================================
-- Build 220 schema mirror (apply source migration in sql/ first)
-- ============================================================================
-- Build 220 — controlled customer access management, recovery intake, and DAIP readiness evidence.
--
-- This migration turns the customer directory into a role-aware management surface
-- without allowing staff to see or set passwords. Customer deletion is archive-first
-- so booking, payment, tax, incident, and consent records keep their audit links.
-- DAIP remains governance/test-only: no bucket, storage key, upload URL, worker, processing task, customer asset route, export, or publishing capability is created.

begin;

alter table if exists public.customer_profiles
  add column if not exists archived_at timestamptz null;
alter table if exists public.customer_profiles
  add column if not exists archived_by_staff_user_id uuid null references public.staff_users(id) on delete set null;
alter table if exists public.customer_profiles
  add column if not exists archived_by_staff_email text null;
alter table if exists public.customer_profiles
  add column if not exists archive_reason text null;

create table if not exists public.customer_admin_audit_events (
  id uuid primary key default gen_random_uuid(),
  customer_profile_id uuid not null references public.customer_profiles(id) on delete restrict,
  event_type text not null check (event_type in (
    'profile_created','profile_updated','email_changed','password_reset_issued',
    'account_setup_issued','verification_issued','sessions_revoked','account_suspended',
    'account_reactivated','account_archived','account_restored'
  )),
  actor_staff_user_id uuid null references public.staff_users(id) on delete set null,
  actor_staff_email text null check (actor_staff_email is null or char_length(actor_staff_email) <= 320),
  safe_summary text not null check (char_length(safe_summary) between 3 and 500),
  created_at timestamptz not null default now()
);

create index if not exists customer_admin_audit_events_profile_created_idx
  on public.customer_admin_audit_events (customer_profile_id, created_at desc);

create table if not exists public.customer_account_recovery_requests (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  full_name_hint text null check (full_name_hint is null or char_length(full_name_hint) <= 160),
  phone_hint text null check (phone_hint is null or char_length(phone_hint) <= 60),
  email_hint text null check (email_hint is null or char_length(email_hint) <= 320),
  message text null check (message is null or char_length(message) <= 700),
  request_fingerprint text not null check (char_length(request_fingerprint) between 32 and 128),
  status text not null default 'queued' check (status in ('queued','reviewed','resolved','declined')),
  reviewed_at timestamptz null,
  reviewed_by_staff_user_id uuid null references public.staff_users(id) on delete set null,
  reviewed_by_staff_email text null check (reviewed_by_staff_email is null or char_length(reviewed_by_staff_email) <= 320),
  safe_resolution_note text null check (safe_resolution_note is null or char_length(safe_resolution_note) <= 500)
);

create index if not exists customer_account_recovery_requests_status_created_idx
  on public.customer_account_recovery_requests (status, created_at desc);
create index if not exists customer_account_recovery_requests_fingerprint_created_idx
  on public.customer_account_recovery_requests (request_fingerprint, created_at desc);

alter table public.customer_admin_audit_events enable row level security;
alter table public.customer_account_recovery_requests enable row level security;
alter table if exists public.customer_auth_sessions enable row level security;
alter table if exists public.customer_auth_tokens enable row level security;

revoke all privileges on table public.customer_admin_audit_events from public, anon, authenticated;
revoke all privileges on table public.customer_account_recovery_requests from public, anon, authenticated;
revoke all privileges on table public.customer_auth_sessions from public, anon, authenticated;
revoke all privileges on table public.customer_auth_tokens from public, anon, authenticated;

grant all privileges on table public.customer_admin_audit_events to service_role;
grant all privileges on table public.customer_account_recovery_requests to service_role;
grant all privileges on table public.customer_auth_sessions to service_role;
grant all privileges on table public.customer_auth_tokens to service_role;

comment on column public.customer_profiles.archived_at is
  'Build 220 archive-first account control. Archived customer profiles keep historical booking/payment/audit links and cannot sign in.';
comment on table public.customer_admin_audit_events is
  'Build 220 staff audit history for customer profile, access, and account lifecycle actions. Never store passwords, raw tokens, reset links, session tokens, payment data, or private media.';
comment on table public.customer_account_recovery_requests is
  'Build 220 customer sign-in-email assistance intake. This does not reveal whether an account exists and does not reset access automatically.';

commit;
