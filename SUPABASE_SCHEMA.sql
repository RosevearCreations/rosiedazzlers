-- Build 241 Startup Command Center initialization/cache hotfix.
-- No schema change is required. Build 240 remains the latest functional DDL.
-- See sql/2026-08-05_build241_startup_command_center_initialization_hotfix_no_ddl.sql.

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
  vehicle_size_review_status text not null default 'verified',
  vehicle_size_original text null,
  vehicle_size_catalog_expected text null,
  vehicle_size_review_reason text null,
  vehicle_size_reviewed_size text null,
  vehicle_size_reviewed_price_cents integer null,
  vehicle_size_reviewed_at timestamptz null,
  vehicle_size_reviewed_by uuid null,
  vehicle_size_review_token_hash text null,
  vehicle_size_review_expires_at timestamptz null,
  vehicle_size_customer_response text null,
  vehicle_size_customer_responded_at timestamptz null,
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
create table if not exists public.catalog_inventory_items (id uuid primary key default gen_random_uuid(), created_at timestamptz not null default now(), updated_at timestamptz not null default now(), item_key text not null unique, item_type text not null check (item_type in ('tool','consumable')), name text not null, category text null, subcategory text null, description text null, image_url text null, gallery_image_urls jsonb not null default '[]'::jsonb, amazon_url text null, is_public boolean not null default true, is_active boolean not null default true, qty_on_hand numeric(12,2) not null default 0, reorder_point numeric(12,2) not null default 0, reorder_qty numeric(12,2) not null default 0, unit_label text null, cost_cents integer null, preferred_vendor text null, vendor_sku text null, rating_value numeric(3,2) null, rating_count integer not null default 0, sort_key integer not null default 0, reuse_policy text not null default 'reorder' check (reuse_policy in ('reorder','single_use','never_reuse')), purchase_date date null, estimated_jobs_per_unit numeric(12,2) null, receipt_url text null, assigned_station text null, service_tags text[] null, last_counted_at timestamptz null, public_badge text null, amazon_asin text null, amazon_title text null, amazon_match_status text null, amazon_match_score numeric(6,3) null, amazon_seller_name text null, amazon_brand text null, amazon_category text null, amazon_quantity_total numeric(12,2) null, amazon_net_total_cents integer null, notes text null);
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


-- BEGIN MIGRATION: 2026-07-04_build222_daip_phase1_readiness_design_review.sql
-- Build 222 — DAIP Phase 1 readiness record for written private-MVP design review.
--
-- This migration stores governance evidence only. A ready_for_design_review record authorizes
-- a written design review, not a storage bucket, file upload, signed link, worker, processing task,
-- customer-media route, export, Gallery/Social handoff, or public publishing capability.
--
-- Run after Build 218 internal test mode and Build 219 governance workspace in development/staging.
-- Browser roles are deliberately denied direct table access; Cloudflare Functions and the service role
-- remain the only application boundary.

begin;

create table if not exists public.daip_phase1_readiness_reviews (
  id uuid primary key default gen_random_uuid(),
  review_status text not null default 'draft' check (review_status in ('draft','ready_for_design_review','paused')),
  review_owner_label text not null check (char_length(review_owner_label) between 2 and 120),
  review_summary text not null check (char_length(review_summary) between 12 and 2400),
  budget_stop_rule_summary text not null check (char_length(budget_stop_rule_summary) between 12 and 1200),
  review_due_on date not null,
  consent_separation_confirmed boolean not null default false,
  retention_legal_hold_confirmed boolean not null default false,
  non_production_acknowledged boolean not null default false,
  gate_a_ready boolean not null default false,
  gate_b_ready boolean not null default false,
  decision_count integer not null default 0 check (decision_count between 0 and 12),
  test_passed_count integer not null default 0 check (test_passed_count between 0 and 3),
  test_control_safe boolean not null default false,
  approved_by_staff_user_id uuid null references public.staff_users(id) on delete set null,
  approved_by_staff_email text null check (approved_by_staff_email is null or char_length(approved_by_staff_email) <= 320),
  approved_at timestamptz null,
  recorded_by_staff_user_id uuid null references public.staff_users(id) on delete set null,
  recorded_by_staff_email text null check (recorded_by_staff_email is null or char_length(recorded_by_staff_email) <= 320),
  created_at timestamptz not null default now(),
  check (
    (review_status = 'ready_for_design_review' and gate_a_ready is true and gate_b_ready is true and consent_separation_confirmed is true and retention_legal_hold_confirmed is true and non_production_acknowledged is true and approved_at is not null)
    or (review_status in ('draft','paused') and approved_at is null)
  )
);

create table if not exists public.daip_phase1_readiness_audit_events (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references public.daip_phase1_readiness_reviews(id) on delete restrict,
  event_type text not null check (event_type in ('readiness_drafted','readiness_paused','written_design_review_authorized')),
  actor_staff_user_id uuid null references public.staff_users(id) on delete set null,
  actor_staff_email text null check (actor_staff_email is null or char_length(actor_staff_email) <= 320),
  safe_note text not null check (char_length(safe_note) between 3 and 500),
  created_at timestamptz not null default now()
);

create index if not exists daip_phase1_readiness_reviews_created_idx
  on public.daip_phase1_readiness_reviews (created_at desc);
create index if not exists daip_phase1_readiness_reviews_status_created_idx
  on public.daip_phase1_readiness_reviews (review_status, created_at desc);
create index if not exists daip_phase1_readiness_audit_events_review_created_idx
  on public.daip_phase1_readiness_audit_events (review_id, created_at desc);

alter table public.daip_phase1_readiness_reviews enable row level security;
alter table public.daip_phase1_readiness_audit_events enable row level security;

revoke all privileges on table public.daip_phase1_readiness_reviews from public, anon, authenticated;
revoke all privileges on table public.daip_phase1_readiness_audit_events from public, anon, authenticated;
grant all privileges on table public.daip_phase1_readiness_reviews to service_role;
grant all privileges on table public.daip_phase1_readiness_audit_events to service_role;

comment on table public.daip_phase1_readiness_reviews is
  'Build 222 DAIP Phase 1 readiness snapshots. A ready_for_design_review snapshot authorizes only a written private-MVP design review and cannot enable storage, uploads, signed links, workers, processing, customer media, exports, or publishing.';
comment on table public.daip_phase1_readiness_audit_events is
  'Build 222 DAIP readiness audit trail. Store governance-safe text only; never secrets, credentials, URLs, signed links, customer data, addresses, VINs, payment data, private media, or incident evidence.';

commit;

-- END MIGRATION: 2026-07-04_build222_daip_phase1_readiness_design_review.sql


-- BEGIN MIGRATION: 2026-07-05_build223_daip_private_mvp_design_blueprint.sql
-- Build 223 — DAIP private-MVP written design blueprint and independent-review queue.
--
-- This migration stores safe, design-level governance evidence only. It does not create a bucket,
-- storage policy, upload/download endpoint, signed URL, object key, queue, Worker, processor,
-- customer media route, public export, Gallery/Social/GBP handoff, or publishing control.
--
-- Run after Build 218, Build 219, and Build 222 in development/staging only. Browser roles are
-- deliberately denied direct access. Cloudflare Functions using the service role remain the only boundary.

begin;

create table if not exists public.daip_private_mvp_design_reviews (
  id uuid primary key default gen_random_uuid(),
  review_status text not null default 'draft' check (review_status in ('draft','submitted_for_independent_review','paused')),
  design_owner_label text not null check (char_length(design_owner_label) between 2 and 120),
  independent_reviewer_label text not null check (char_length(independent_reviewer_label) between 2 and 120),
  design_summary text not null check (char_length(design_summary) between 12 and 2400),
  threat_model_summary text not null check (char_length(threat_model_summary) between 12 and 2400),
  upload_control_summary text not null check (char_length(upload_control_summary) between 12 and 2400),
  storage_separation_summary text not null check (char_length(storage_separation_summary) between 12 and 2400),
  cost_telemetry_summary text not null check (char_length(cost_telemetry_summary) between 12 and 1600),
  rollback_acceptance_summary text not null check (char_length(rollback_acceptance_summary) between 12 and 1600),
  review_due_on date not null,
  readiness_review_id uuid null references public.daip_phase1_readiness_reviews(id) on delete restrict,
  readiness_authorization_valid boolean not null default false,
  zero_public_destination_confirmed boolean not null default false,
  no_customer_media_confirmed boolean not null default false,
  non_production_acknowledged boolean not null default false,
  gate_c_held boolean not null default true check (gate_c_held is true),
  submitted_by_staff_user_id uuid null references public.staff_users(id) on delete set null,
  submitted_by_staff_email text null check (submitted_by_staff_email is null or char_length(submitted_by_staff_email) <= 320),
  submitted_at timestamptz null,
  recorded_by_staff_user_id uuid null references public.staff_users(id) on delete set null,
  recorded_by_staff_email text null check (recorded_by_staff_email is null or char_length(recorded_by_staff_email) <= 320),
  created_at timestamptz not null default now(),
  check (
    (review_status = 'submitted_for_independent_review'
      and readiness_review_id is not null
      and readiness_authorization_valid is true
      and zero_public_destination_confirmed is true
      and no_customer_media_confirmed is true
      and non_production_acknowledged is true
      and submitted_at is not null)
    or (review_status in ('draft','paused') and submitted_at is null)
  )
);

create table if not exists public.daip_private_mvp_design_audit_events (
  id uuid primary key default gen_random_uuid(),
  design_review_id uuid not null references public.daip_private_mvp_design_reviews(id) on delete restrict,
  event_type text not null check (event_type in ('blueprint_drafted','blueprint_paused','blueprint_submitted_for_independent_review')),
  actor_staff_user_id uuid null references public.staff_users(id) on delete set null,
  actor_staff_email text null check (actor_staff_email is null or char_length(actor_staff_email) <= 320),
  safe_note text not null check (char_length(safe_note) between 3 and 600),
  created_at timestamptz not null default now()
);

create index if not exists daip_private_mvp_design_reviews_created_idx
  on public.daip_private_mvp_design_reviews (created_at desc);
create index if not exists daip_private_mvp_design_reviews_status_created_idx
  on public.daip_private_mvp_design_reviews (review_status, created_at desc);
create index if not exists daip_private_mvp_design_audit_events_review_created_idx
  on public.daip_private_mvp_design_audit_events (design_review_id, created_at desc);

alter table public.daip_private_mvp_design_reviews enable row level security;
alter table public.daip_private_mvp_design_audit_events enable row level security;

revoke all privileges on table public.daip_private_mvp_design_reviews from public, anon, authenticated;
revoke all privileges on table public.daip_private_mvp_design_audit_events from public, anon, authenticated;
grant all privileges on table public.daip_private_mvp_design_reviews to service_role;
grant all privileges on table public.daip_private_mvp_design_audit_events to service_role;

comment on table public.daip_private_mvp_design_reviews is
  'Build 223 DAIP private-MVP design blueprints. This is an independent-review queue only; Gate C stays held and the record cannot provision storage, upload/download, signed links, queues, workers, processing, customer media, exports, or publishing.';
comment on table public.daip_private_mvp_design_audit_events is
  'Build 223 DAIP design-blueprint audit trail. Store governance-safe text only; never credentials, URLs, bucket/object paths, customer data, addresses, VINs, payment data, private media, or incident evidence.';

commit;

-- END MIGRATION: 2026-07-05_build223_daip_private_mvp_design_blueprint.sql


-- Canonical schema mirror: 2026-07-06_build224_customer_preference_history_duplicate_review.sql
-- Build 224 — customer contact-preference history and duplicate-profile review safeguards.
-- Review only: this migration never merges profiles, changes consent, changes customer access, or exposes data publicly.
begin;
create table if not exists public.customer_contact_preference_events (
  id uuid primary key default gen_random_uuid(),
  customer_profile_id uuid not null references public.customer_profiles(id) on delete restrict,
  event_type text not null check (event_type in ('contact_preferences_changed')),
  old_snapshot jsonb not null default '{}'::jsonb,
  new_snapshot jsonb not null default '{}'::jsonb,
  actor_staff_user_id uuid null references public.staff_users(id) on delete set null,
  actor_staff_email text null check (actor_staff_email is null or char_length(actor_staff_email) <= 320),
  safe_summary text not null check (char_length(safe_summary) between 3 and 500),
  created_at timestamptz not null default now()
);
create index if not exists customer_contact_preference_events_profile_idx on public.customer_contact_preference_events(customer_profile_id,created_at desc);
alter table public.customer_contact_preference_events enable row level security;
revoke all privileges on table public.customer_contact_preference_events from public, anon, authenticated;
grant all privileges on table public.customer_contact_preference_events to service_role;
comment on table public.customer_contact_preference_events is 'Build 224 safe staff audit history of operational notification and live-update preference changes. It is not a consent source and never changes customer records itself.';
commit;


-- Canonical schema mirror: 2026-07-06_build224_daip_gate_c_technical_review_rollback.sql
-- Build 224 — DAIP Gate C technical-review and rollback acceptance evidence.
-- Test-only review records; this migration creates no media storage, upload/download authorization,
-- object path, worker, queue, processing, customer-media route, public destination, or publishing control.
begin;
create table if not exists public.daip_gate_c_technical_reviews (
  id uuid primary key default gen_random_uuid(),
  review_status text not null default 'draft' check (review_status in ('draft','blocked','accepted_for_test_only_implementation_review')),
  technical_owner_label text not null check (char_length(technical_owner_label) between 2 and 120),
  independent_reviewer_label text not null check (char_length(independent_reviewer_label) between 2 and 120),
  acceptance_scope_summary text not null check (char_length(acceptance_scope_summary) between 12 and 2400),
  rollback_plan_summary text not null check (char_length(rollback_plan_summary) between 12 and 2400),
  failure_test_summary text not null check (char_length(failure_test_summary) between 12 and 2000),
  cost_stop_validation_summary text not null check (char_length(cost_stop_validation_summary) between 12 and 1600),
  review_due_on date not null,
  design_review_id uuid null references public.daip_private_mvp_design_reviews(id) on delete restrict,
  design_submission_valid boolean not null default false,
  zero_public_destination_confirmed boolean not null default false,
  no_customer_media_confirmed boolean not null default false,
  technical_capabilities_still_disabled boolean not null default false,
  gate_c_held boolean not null default true check (gate_c_held is true),
  accepted_by_staff_user_id uuid null references public.staff_users(id) on delete set null,
  accepted_by_staff_email text null check (accepted_by_staff_email is null or char_length(accepted_by_staff_email) <= 320),
  accepted_at timestamptz null,
  recorded_by_staff_user_id uuid null references public.staff_users(id) on delete set null,
  recorded_by_staff_email text null check (recorded_by_staff_email is null or char_length(recorded_by_staff_email) <= 320),
  created_at timestamptz not null default now(),
  check ((review_status='accepted_for_test_only_implementation_review' and design_review_id is not null and design_submission_valid is true and zero_public_destination_confirmed is true and no_customer_media_confirmed is true and technical_capabilities_still_disabled is true and accepted_at is not null) or (review_status in ('draft','blocked') and accepted_at is null))
);
create table if not exists public.daip_gate_c_technical_review_audit_events (
  id uuid primary key default gen_random_uuid(), technical_review_id uuid not null references public.daip_gate_c_technical_reviews(id) on delete restrict,
  event_type text not null check (event_type in ('technical_review_drafted','technical_review_blocked','technical_review_accepted_for_test_only')),
  actor_staff_user_id uuid null references public.staff_users(id) on delete set null,
  actor_staff_email text null check (actor_staff_email is null or char_length(actor_staff_email) <= 320),
  safe_note text not null check (char_length(safe_note) between 3 and 600), created_at timestamptz not null default now()
);
create index if not exists daip_gate_c_technical_reviews_created_idx on public.daip_gate_c_technical_reviews(created_at desc);
create index if not exists daip_gate_c_technical_review_audit_idx on public.daip_gate_c_technical_review_audit_events(technical_review_id,created_at desc);
alter table public.daip_gate_c_technical_reviews enable row level security;
alter table public.daip_gate_c_technical_review_audit_events enable row level security;
revoke all privileges on table public.daip_gate_c_technical_reviews from public, anon, authenticated;
revoke all privileges on table public.daip_gate_c_technical_review_audit_events from public, anon, authenticated;
grant all privileges on table public.daip_gate_c_technical_reviews to service_role;
grant all privileges on table public.daip_gate_c_technical_review_audit_events to service_role;
comment on table public.daip_gate_c_technical_reviews is 'Build 224 DAIP Gate C technical-review and rollback acceptance record. It records test-only design evidence and cannot enable storage, uploads, processing, customer media, public destinations, or publishing.';
comment on table public.daip_gate_c_technical_review_audit_events is 'Build 224 Gate C audit trail. Store plain-language review evidence only; never credentials, URLs, external service configuration, customer data, private media, payment data, or incident evidence.';
commit;


-- 2026-07-07_build225_social_analytics_connection_centre_no_ddl_note.sql
-- Build 225 — Social & Analytics Connections Centre and DAIP external-service boundary.
-- No database migration is required.
-- Runtime connection values are intentionally Cloudflare Variables and Secrets, never Supabase app settings.
-- This file exists as schema/release history evidence only.


-- BEGIN BUILD 226 DAIP INTAKE DRY RUN
-- Build 226 — DAIP metadata-only intake dry run.
-- This migration stores fictional validation manifests only. It creates no storage, upload/download
-- authorization, object path, worker, queue, customer-media route, public destination, or publishing control.
begin;
create table if not exists public.daip_intake_dry_runs (
  id uuid primary key default gen_random_uuid(),
  run_code text not null unique check (run_code ~ '^RD-DRYRUN-[0-9]{8}-[0-9]{3}$'),
  run_status text not null default 'draft' check (run_status in ('draft','validated','rejected','archived')),
  owner_label text not null check (char_length(owner_label) between 2 and 120),
  scenario_summary text not null check (char_length(scenario_summary) between 12 and 1200),
  item_count integer not null default 0 check (item_count between 0 and 100),
  total_declared_bytes bigint not null default 0 check (total_declared_bytes between 0 and 107374182400),
  accepted_item_count integer not null default 0 check (accepted_item_count between 0 and 100),
  rejected_item_count integer not null default 0 check (rejected_item_count between 0 and 100),
  estimated_monthly_storage_cad numeric(12,4) not null default 0 check (estimated_monthly_storage_cad >= 0),
  gate_c_held boolean not null default true check (gate_c_held is true),
  media_bytes_received boolean not null default false check (media_bytes_received is false),
  storage_authorization_created boolean not null default false check (storage_authorization_created is false),
  worker_execution_requested boolean not null default false check (worker_execution_requested is false),
  public_destination_enabled boolean not null default false check (public_destination_enabled is false),
  recorded_by_staff_user_id uuid null references public.staff_users(id) on delete set null,
  recorded_by_staff_email text null check (recorded_by_staff_email is null or char_length(recorded_by_staff_email) <= 320),
  created_at timestamptz not null default now(),
  archived_at timestamptz null
);
create table if not exists public.daip_intake_dry_run_items (
  id uuid primary key default gen_random_uuid(),
  dry_run_id uuid not null references public.daip_intake_dry_runs(id) on delete restrict,
  fictional_filename text not null check (char_length(fictional_filename) between 5 and 180),
  declared_mime_type text not null check (declared_mime_type in ('image/jpeg','image/png','image/webp','video/mp4','video/quicktime')),
  declared_size_bytes bigint not null check (declared_size_bytes between 1 and 2147483648),
  fictional_sha256 text not null check (fictional_sha256 ~ '^[a-f0-9]{64}$'),
  validation_status text not null check (validation_status in ('accepted','rejected')),
  validation_reasons text[] not null default '{}',
  created_at timestamptz not null default now()
);
create table if not exists public.daip_intake_dry_run_audit_events (
  id uuid primary key default gen_random_uuid(),
  dry_run_id uuid not null references public.daip_intake_dry_runs(id) on delete restrict,
  event_type text not null check (event_type in ('dry_run_created','dry_run_validated','dry_run_rejected','dry_run_archived')),
  actor_staff_user_id uuid null references public.staff_users(id) on delete set null,
  actor_staff_email text null check (actor_staff_email is null or char_length(actor_staff_email) <= 320),
  safe_note text not null check (char_length(safe_note) between 3 and 600),
  created_at timestamptz not null default now()
);
create index if not exists daip_intake_dry_runs_created_idx on public.daip_intake_dry_runs(created_at desc);
create index if not exists daip_intake_dry_run_items_run_idx on public.daip_intake_dry_run_items(dry_run_id,created_at);
create index if not exists daip_intake_dry_run_audit_idx on public.daip_intake_dry_run_audit_events(dry_run_id,created_at desc);
alter table public.daip_intake_dry_runs enable row level security;
alter table public.daip_intake_dry_run_items enable row level security;
alter table public.daip_intake_dry_run_audit_events enable row level security;
revoke all privileges on table public.daip_intake_dry_runs from public, anon, authenticated;
revoke all privileges on table public.daip_intake_dry_run_items from public, anon, authenticated;
revoke all privileges on table public.daip_intake_dry_run_audit_events from public, anon, authenticated;
grant all privileges on table public.daip_intake_dry_runs to service_role;
grant all privileges on table public.daip_intake_dry_run_items to service_role;
grant all privileges on table public.daip_intake_dry_run_audit_events to service_role;
comment on table public.daip_intake_dry_runs is 'Build 226 fictional metadata-only intake validation dry runs. No media bytes, storage authorization, worker execution, customer data, public destination, or publishing.';
commit;
-- END BUILD 226 DAIP INTAKE DRY RUN


-- Build 227 canonical migration mirror
-- Build 227 — DB-backed roadmap execution and DAIP dry-run policy controls.
begin;
create table if not exists public.app_roadmap_execution_items (
 id uuid primary key default gen_random_uuid(),
 item_key text not null unique check (item_key ~ '^[a-z0-9_:-]{4,120}$'),
 title text not null check (char_length(title) between 5 and 220),
 workstream text not null check (workstream in ('customer','booking','payments','seo','media','daip','operations','reliability','documentation','content','security')),
 priority text not null default 'high' check (priority in ('critical','high','medium','low')),
 status text not null default 'planned' check (status in ('planned','in_progress','blocked','done','deferred')),
 owner_label text null check (owner_label is null or char_length(owner_label)<=120),
 evidence_note text null check (evidence_note is null or char_length(evidence_note)<=1200),
 target_build integer null check (target_build is null or target_build between 227 and 999),
 sort_order integer not null default 100 check (sort_order between 1 and 10000),
 source_document text not null default 'MASTER_VALUE_ROADMAP.md',
 updated_by_staff_email text null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.app_roadmap_execution_audit (
 id uuid primary key default gen_random_uuid(), roadmap_item_id uuid not null references public.app_roadmap_execution_items(id) on delete restrict,
 event_type text not null check (event_type in ('created','updated','status_changed','evidence_added')),
 actor_staff_email text null, safe_note text not null check (char_length(safe_note) between 3 and 800), created_at timestamptz not null default now()
);
create table if not exists public.daip_intake_validation_policy (
 id uuid primary key default gen_random_uuid(), policy_key text not null unique default 'active',
 max_manifest_items integer not null default 25 check (max_manifest_items between 1 and 100),
 max_image_bytes bigint not null default 52428800 check (max_image_bytes between 1048576 and 524288000),
 max_video_bytes bigint not null default 2147483648 check (max_video_bytes between 10485760 and 10737418240),
 storage_rate_cad_per_gb_month numeric(12,6) not null default 0.025 check (storage_rate_cad_per_gb_month between 0 and 100),
 monthly_warning_cad numeric(12,2) not null default 25 check (monthly_warning_cad between 0 and 100000),
 monthly_hard_stop_cad numeric(12,2) not null default 50 check (monthly_hard_stop_cad >= monthly_warning_cad and monthly_hard_stop_cad <= 100000),
 gate_c_held boolean not null default true check (gate_c_held is true),
 technical_capability_enabled boolean not null default false check (technical_capability_enabled is false),
 updated_by_staff_email text null, updated_at timestamptz not null default now()
);
insert into public.daip_intake_validation_policy(policy_key) values('active') on conflict(policy_key) do nothing;
insert into public.app_roadmap_execution_items(item_key,title,workstream,priority,status,target_build,sort_order,source_document) values
('b227_01','Deploy and validate Build 226 metadata-only DAIP dry runs','daip','critical','planned',227,10,'MASTER_VALUE_ROADMAP.md'),
('b227_02','Move DAIP validation limits and cost assumptions from code into protected DB policy','daip','critical','done',227,20,'DEVELOPMENT_ROADMAP.md'),
('b227_03','Add protected roadmap execution queue and evidence tracking','operations','high','done',227,30,'DEVELOPMENT_ROADMAP.md'),
('b227_04','Complete DAIP owner decisions and Gate A evidence','daip','critical','planned',228,40,'MASTER_VALUE_ROADMAP.md'),
('b227_05','Complete DAIP internal safety tests and Gate B evidence','daip','critical','planned',228,50,'MASTER_VALUE_ROADMAP.md'),
('b227_06','Perform independent Gate C rollback review','daip','critical','planned',229,60,'MASTER_VALUE_ROADMAP.md'),
('b227_07','Run customer account recovery and archive/restore staging tests','customer','high','planned',228,70,'KNOWN_GAPS_AND_RISKS.md'),
('b227_08','Add manual duplicate-customer merge dry-run workflow','customer','high','planned',229,80,'MASTER_VALUE_ROADMAP.md'),
('b227_09','Verify final-balance Stripe test-mode settlement and replay','payments','critical','planned',228,90,'KNOWN_GAPS_AND_RISKS.md'),
('b227_10','Verify notification provider delivery in controlled inbox','reliability','high','planned',228,100,'KNOWN_GAPS_AND_RISKS.md'),
('b227_11','Run mobile weak-network upload retry tests','media','high','planned',229,110,'KNOWN_GAPS_AND_RISKS.md'),
('b227_12','Pair approved final proof into gallery candidates with consent review','media','high','planned',230,120,'MASTER_VALUE_ROADMAP.md'),
('b227_13','Create vehicle-history cards from approved final proof only','customer','high','planned',230,130,'MASTER_VALUE_ROADMAP.md'),
('b227_14','Gate review requests on payment, acknowledgement, and incident status','customer','high','planned',230,140,'MASTER_VALUE_ROADMAP.md'),
('b227_15','Add local SEO evidence review from Search Console and Business Profile','seo','high','planned',229,150,'MASTER_VALUE_ROADMAP.md'),
('b227_16','Replace public placeholders only with approved Rosie-owned proof','seo','medium','planned',230,160,'IMAGES.md'),
('b227_17','Add live screenshot/mobile smoke evidence for core routes','reliability','high','planned',228,170,'DEVELOPMENT_ROADMAP.md'),
('b227_18','Archive redundant Markdown safely after guard dependency scan','documentation','medium','planned',229,180,'DEVELOPMENT_ROADMAP.md'),
('b227_19','Continue one-H1, title/meta, local wording, and CSS drift checks','seo','high','in_progress',227,190,'DEVELOPMENT_ROADMAP.md'),
('b227_20','Keep DAIP storage, workers, AI, and publishing disabled until Gate C approval','daip','critical','in_progress',227,200,'KNOWN_GAPS_AND_RISKS.md')
on conflict(item_key) do nothing;
create index if not exists app_roadmap_execution_status_idx on public.app_roadmap_execution_items(status,priority,sort_order);
create index if not exists app_roadmap_execution_audit_idx on public.app_roadmap_execution_audit(roadmap_item_id,created_at desc);
alter table public.app_roadmap_execution_items enable row level security;
alter table public.app_roadmap_execution_audit enable row level security;
alter table public.daip_intake_validation_policy enable row level security;
revoke all privileges on table public.app_roadmap_execution_items, public.app_roadmap_execution_audit, public.daip_intake_validation_policy from public,anon,authenticated;
grant all privileges on table public.app_roadmap_execution_items, public.app_roadmap_execution_audit, public.daip_intake_validation_policy to service_role;
comment on table public.daip_intake_validation_policy is 'Build 227 planning-only DAIP metadata validation policy. Gate C is held and technical capability is forced false.';
commit;
-- Build 228 — Creative Project Intelligence foundation.
begin;
create table if not exists public.creative_projects (
 id uuid primary key default gen_random_uuid(),
 project_code text not null unique check (project_code ~ '^CP-[A-Z0-9-]{6,40}$'),
 title text not null check (char_length(title) between 3 and 180),
 project_type text not null default 'detailing' check (project_type in ('detailing','jewelry','restoration','maker','education','other')),
 lifecycle_status text not null default 'idea' check (lifecycle_status in ('idea','planning','active','paused','complete','content_review','published','archived')),
 purpose text null check (purpose is null or char_length(purpose)<=2000),
 audience text null check (audience is null or char_length(audience)<=800),
 outcome_summary text null check (outcome_summary is null or char_length(outcome_summary)<=4000),
 lessons_learned text null check (lessons_learned is null or char_length(lessons_learned)<=6000),
 future_recommendations text null check (future_recommendations is null or char_length(future_recommendations)<=4000),
 estimated_cost_cad numeric(12,2) not null default 0 check (estimated_cost_cad>=0),
 actual_cost_cad numeric(12,2) not null default 0 check (actual_cost_cad>=0),
 labour_minutes integer not null default 0 check (labour_minutes>=0),
 public_publish_allowed boolean not null default false,
 consent_reviewed boolean not null default false,
 created_by_staff_email text null,
 updated_by_staff_email text null,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create table if not exists public.creative_project_sessions (
 id uuid primary key default gen_random_uuid(),
 project_id uuid not null references public.creative_projects(id) on delete cascade,
 session_type text not null default 'work' check (session_type in ('planning','work','media','review','publishing')),
 started_at timestamptz not null default now(),
 ended_at timestamptz null,
 minutes_spent integer not null default 0 check (minutes_spent>=0),
 summary text not null check (char_length(summary) between 3 and 3000),
 materials_used text null check (materials_used is null or char_length(materials_used)<=3000),
 mistakes_and_fixes text null check (mistakes_and_fixes is null or char_length(mistakes_and_fixes)<=3000),
 next_action text null check (next_action is null or char_length(next_action)<=1200),
 created_by_staff_email text null,
 created_at timestamptz not null default now()
);
create table if not exists public.creative_project_outputs (
 id uuid primary key default gen_random_uuid(),
 project_id uuid not null references public.creative_projects(id) on delete cascade,
 output_type text not null check (output_type in ('youtube_video','youtube_shorts','instagram_reels','tiktok','facebook_video','pinterest_pins','etsy_draft','website_product_page','blog_article','photo_gallery','before_after','educational_article','project_archive','material_usage_report','cost_analysis','lessons_learned','future_recommendations')),
 status text not null default 'planned' check (status in ('planned','drafting','review','approved','scheduled','published','not_applicable')),
 draft_title text null check (draft_title is null or char_length(draft_title)<=220),
 safe_notes text null check (safe_notes is null or char_length(safe_notes)<=3000),
 destination_url text null check (destination_url is null or char_length(destination_url)<=1000),
 generated_automatically boolean not null default false,
 approved_by_staff_email text null,
 updated_at timestamptz not null default now(),
 unique(project_id,output_type)
);
create table if not exists public.creative_project_audit (
 id uuid primary key default gen_random_uuid(),
 project_id uuid not null references public.creative_projects(id) on delete restrict,
 event_type text not null check (event_type in ('created','updated','session_added','output_updated','archived')),
 actor_staff_email text null,
 safe_note text not null check (char_length(safe_note) between 3 and 1000),
 created_at timestamptz not null default now()
);
create index if not exists creative_projects_status_idx on public.creative_projects(lifecycle_status,updated_at desc);
create index if not exists creative_project_sessions_idx on public.creative_project_sessions(project_id,started_at desc);
create index if not exists creative_project_outputs_idx on public.creative_project_outputs(project_id,status,output_type);
create index if not exists creative_project_audit_idx on public.creative_project_audit(project_id,created_at desc);
alter table public.creative_projects enable row level security;
alter table public.creative_project_sessions enable row level security;
alter table public.creative_project_outputs enable row level security;
alter table public.creative_project_audit enable row level security;
revoke all privileges on table public.creative_projects, public.creative_project_sessions, public.creative_project_outputs, public.creative_project_audit from public,anon,authenticated;
grant all privileges on table public.creative_projects, public.creative_project_sessions, public.creative_project_outputs, public.creative_project_audit to service_role;
comment on table public.creative_projects is 'Build 228 project-centric source record. Projects document process first; products and content are optional governed outputs.';
commit;


-- BEGIN 2026-07-12_build229_standard_job_project_choice.sql
-- Build 229 — Preserve the standard booking workflow while allowing an explicit opt-in creative project link.
begin;

alter table public.creative_projects
  add column if not exists source_mode text not null default 'standalone_project'
    check (source_mode in ('standalone_project','booking_opt_in')),
  add column if not exists source_booking_id uuid null references public.bookings(id) on delete set null,
  add column if not exists source_customer_initiated boolean not null default false;

create unique index if not exists creative_projects_source_booking_unique
  on public.creative_projects(source_booking_id)
  where source_booking_id is not null;

create table if not exists public.creative_project_booking_audit (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete restrict,
  project_id uuid not null references public.creative_projects(id) on delete restrict,
  event_type text not null check (event_type in ('project_opted_in','project_opened','link_removed')),
  actor_staff_email text null,
  safe_note text not null check (char_length(safe_note) between 3 and 1000),
  created_at timestamptz not null default now()
);

create index if not exists creative_project_booking_audit_booking_idx
  on public.creative_project_booking_audit(booking_id,created_at desc);

alter table public.creative_project_booking_audit enable row level security;
revoke all privileges on table public.creative_project_booking_audit from public,anon,authenticated;
grant all privileges on table public.creative_project_booking_audit to service_role;

comment on column public.creative_projects.source_mode is
  'Build 229: standalone projects are created directly; booking_opt_in projects are explicitly promoted from a normal booking. A booking without a linked project remains a standard job.';
comment on column public.creative_projects.source_booking_id is
  'Optional booking link. Null means the project is independent. No booking is automatically converted into a project.';

commit;

-- END 2026-07-12_build229_standard_job_project_choice.sql
-- Build 230 — structured creative-project costing, templates, output drafts, reversible links, and gated DAIP association.
begin;

alter table public.creative_projects
  add column if not exists template_key text null check (template_key is null or char_length(template_key) <= 80),
  add column if not exists before_after_applicability text not null default 'not_reviewed'
    check (before_after_applicability in ('not_reviewed','applicable','not_applicable')),
  add column if not exists consent_summary text null check (consent_summary is null or char_length(consent_summary) <= 3000),
  add column if not exists consent_status text not null default 'not_reviewed'
    check (consent_status in ('not_reviewed','internal_only','approved_public','declined','expired')),
  add column if not exists archived_reason text null check (archived_reason is null or char_length(archived_reason) <= 1200),
  add column if not exists archived_at timestamptz null;

create table if not exists public.creative_project_templates (
  id uuid primary key default gen_random_uuid(),
  template_key text not null unique check (template_key ~ '^[a-z0-9_]{3,80}$'),
  name text not null check (char_length(name) between 3 and 120),
  project_type text not null check (project_type in ('detailing','jewelry','restoration','maker','education','other')),
  purpose_prompt text null check (purpose_prompt is null or char_length(purpose_prompt) <= 2000),
  audience_prompt text null check (audience_prompt is null or char_length(audience_prompt) <= 800),
  default_before_after_applicability text not null default 'not_reviewed'
    check (default_before_after_applicability in ('not_reviewed','applicable','not_applicable')),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.creative_project_templates(template_key,name,project_type,purpose_prompt,audience_prompt,default_before_after_applicability)
values
 ('detailing_story','Detailing transformation story','detailing','Document the condition, process, decisions, results, and lessons from a selected detailing job.','Local vehicle owners and detailing learners','applicable'),
 ('maker_process','Maker process documentary','maker','Document the complete creative process from idea and setup through mistakes, corrections, final result, and recommendations.','Makers, customers, and learners','not_reviewed'),
 ('education_walkthrough','Educational walkthrough','education','Teach a repeatable process with safety notes, tools, materials, troubleshooting, and verified results.','Beginners and practical learners','not_applicable'),
 ('restoration_story','Restoration before-and-after','restoration','Document assessment, preservation choices, restoration work, final condition, and care guidance.','Collectors, owners, and restoration learners','applicable')
on conflict (template_key) do update set name=excluded.name,project_type=excluded.project_type,purpose_prompt=excluded.purpose_prompt,audience_prompt=excluded.audience_prompt,default_before_after_applicability=excluded.default_before_after_applicability,updated_at=now();

create table if not exists public.creative_project_material_lines (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.creative_projects(id) on delete cascade,
  material_name text not null check (char_length(material_name) between 2 and 180),
  inventory_item_id uuid null,
  quantity numeric(12,3) not null default 1 check (quantity > 0),
  unit text not null default 'item' check (char_length(unit) between 1 and 40),
  unit_cost_cad numeric(12,4) not null default 0 check (unit_cost_cad >= 0),
  waste_quantity numeric(12,3) not null default 0 check (waste_quantity >= 0),
  source_mode text not null default 'project_only' check (source_mode in ('project_only','inventory_reference')),
  safe_note text null check (safe_note is null or char_length(safe_note) <= 1200),
  created_by_staff_email text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.creative_project_labour_lines (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.creative_projects(id) on delete cascade,
  labour_type text not null default 'creative_work' check (labour_type in ('planning','creative_work','detailing','media','editing','review','administration','other')),
  minutes integer not null check (minutes > 0),
  hourly_rate_cad numeric(12,2) not null default 0 check (hourly_rate_cad >= 0),
  safe_note text null check (safe_note is null or char_length(safe_note) <= 1200),
  created_by_staff_email text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.creative_project_cost_lines (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.creative_projects(id) on delete cascade,
  cost_type text not null check (cost_type in ('overhead','equipment','travel','platform_fee','shipping','packaging','other')),
  description text not null check (char_length(description) between 2 and 240),
  amount_cad numeric(12,2) not null check (amount_cad >= 0),
  safe_note text null check (safe_note is null or char_length(safe_note) <= 1200),
  created_by_staff_email text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.creative_project_output_drafts (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.creative_projects(id) on delete cascade,
  output_type text not null check (output_type in ('youtube_video','youtube_shorts','instagram_reels','tiktok','facebook_video','pinterest_pins','etsy_draft','website_product_page','blog_article','photo_gallery','before_after','educational_article','project_archive','material_usage_report','cost_analysis','lessons_learned','future_recommendations')),
  draft_kind text not null default 'platform_copy' check (draft_kind in ('story_outline','platform_copy','commerce_copy','report_outline')),
  hook text null check (hook is null or char_length(hook) <= 500),
  outline text null check (outline is null or char_length(outline) <= 12000),
  caption text null check (caption is null or char_length(caption) <= 5000),
  call_to_action text null check (call_to_action is null or char_length(call_to_action) <= 800),
  seo_title text null check (seo_title is null or char_length(seo_title) <= 180),
  seo_description text null check (seo_description is null or char_length(seo_description) <= 500),
  aspect_ratio text null check (aspect_ratio is null or aspect_ratio in ('16:9','9:16','1:1','2:3','mixed','not_applicable')),
  review_status text not null default 'draft' check (review_status in ('draft','review','approved','rejected')),
  approved_by_staff_email text null,
  updated_by_staff_email text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(project_id,output_type,draft_kind)
);

create table if not exists public.creative_project_daip_associations (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.creative_projects(id) on delete cascade,
  daip_reference text not null check (daip_reference ~ '^DAIP-[A-Z0-9-]{6,80}$'),
  association_status text not null default 'requested' check (association_status in ('requested','approved','revoked')),
  gate_c_verified boolean not null default false check (gate_c_verified = true),
  technical_capability_verified boolean not null default false check (technical_capability_verified = true),
  contains_media_bytes boolean not null default false check (contains_media_bytes = false),
  public_destination_enabled boolean not null default false check (public_destination_enabled = false),
  safe_note text not null check (char_length(safe_note) between 3 and 1200),
  created_by_staff_email text null,
  created_at timestamptz not null default now(),
  revoked_at timestamptz null,
  unique(project_id,daip_reference)
);

alter table public.creative_project_audit drop constraint if exists creative_project_audit_event_type_check;
alter table public.creative_project_audit add constraint creative_project_audit_event_type_check check (event_type in ('created','updated','session_added','output_updated','archived','restored','booking_unlinked','cost_line_added','material_line_added','labour_line_added','draft_updated','batch_approval','daip_associated'));

create index if not exists creative_project_material_lines_idx on public.creative_project_material_lines(project_id,created_at desc);
create index if not exists creative_project_labour_lines_idx on public.creative_project_labour_lines(project_id,created_at desc);
create index if not exists creative_project_cost_lines_idx on public.creative_project_cost_lines(project_id,created_at desc);
create index if not exists creative_project_output_drafts_idx on public.creative_project_output_drafts(project_id,output_type,review_status);
create index if not exists creative_project_daip_associations_idx on public.creative_project_daip_associations(project_id,created_at desc);

alter table public.creative_project_templates enable row level security;
alter table public.creative_project_material_lines enable row level security;
alter table public.creative_project_labour_lines enable row level security;
alter table public.creative_project_cost_lines enable row level security;
alter table public.creative_project_output_drafts enable row level security;
alter table public.creative_project_daip_associations enable row level security;
revoke all privileges on table public.creative_project_templates,public.creative_project_material_lines,public.creative_project_labour_lines,public.creative_project_cost_lines,public.creative_project_output_drafts,public.creative_project_daip_associations from public,anon,authenticated;
grant all privileges on table public.creative_project_templates,public.creative_project_material_lines,public.creative_project_labour_lines,public.creative_project_cost_lines,public.creative_project_output_drafts,public.creative_project_daip_associations to service_role;

comment on table public.creative_project_material_lines is 'Build 230 project-only material accounting. It does not mutate ordinary booking inventory or job costing.';
comment on table public.creative_project_daip_associations is 'Build 230 gated project-to-DAIP metadata association. Database constraints prohibit media bytes and public destinations.';
commit;
-- Build 231 — project profitability, reviewed consumption, content planning, learning, and reversible line controls.
begin;

alter table public.creative_projects
  add column if not exists project_classification text not null default 'commercial'
    check (project_classification in ('commercial','therapeutic','educational','internal','non_commercial')),
  add column if not exists expected_revenue_cad numeric(12,2) not null default 0 check (expected_revenue_cad >= 0),
  add column if not exists actual_revenue_cad numeric(12,2) not null default 0 check (actual_revenue_cad >= 0),
  add column if not exists consent_expires_at timestamptz null,
  add column if not exists consent_reminder_days integer not null default 30 check (consent_reminder_days between 1 and 365),
  add column if not exists profitability_note text null check (profitability_note is null or char_length(profitability_note) <= 2000);

alter table public.creative_project_material_lines
  add column if not exists is_deleted boolean not null default false,
  add column if not exists deleted_at timestamptz null,
  add column if not exists deleted_by_staff_email text null;
alter table public.creative_project_labour_lines
  add column if not exists is_deleted boolean not null default false,
  add column if not exists deleted_at timestamptz null,
  add column if not exists deleted_by_staff_email text null;
alter table public.creative_project_cost_lines
  add column if not exists is_deleted boolean not null default false,
  add column if not exists deleted_at timestamptz null,
  add column if not exists deleted_by_staff_email text null;
alter table public.creative_project_sessions
  add column if not exists approved_for_story boolean not null default false,
  add column if not exists story_approved_at timestamptz null,
  add column if not exists story_approved_by_staff_email text null;
alter table public.creative_project_output_drafts
  add column if not exists planning_data jsonb not null default '{}'::jsonb,
  add column if not exists safety_review_status text not null default 'not_reviewed'
    check (safety_review_status in ('not_reviewed','required','review','approved','rejected'));
alter table public.creative_project_templates
  add column if not exists safe_instructions text null check (safe_instructions is null or char_length(safe_instructions) <= 4000),
  add column if not exists updated_by_staff_email text null;

create table if not exists public.creative_project_inventory_reservations (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.creative_projects(id) on delete cascade,
  material_line_id uuid null references public.creative_project_material_lines(id) on delete set null,
  inventory_item_id uuid not null,
  quantity numeric(12,3) not null check (quantity > 0),
  unit text not null default 'item' check (char_length(unit) between 1 and 40),
  status text not null default 'draft' check (status in ('draft','reserved','reviewed','posted','cancelled')),
  review_note text null check (review_note is null or char_length(review_note) <= 1200),
  reviewed_by_staff_email text null,
  reviewed_at timestamptz null,
  posted_by_staff_email text null,
  posted_at timestamptz null,
  inventory_mutated boolean not null default false check (inventory_mutated = false),
  created_by_staff_email text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.creative_project_shot_plan_items (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.creative_projects(id) on delete cascade,
  shot_type text not null check (shot_type in ('before','during','after','detail','tool','material','safety','thumbnail','other')),
  description text not null check (char_length(description) between 3 and 500),
  required boolean not null default true,
  status text not null default 'planned' check (status in ('planned','captured','approved','not_applicable')),
  consent_required boolean not null default false,
  safe_note text null check (safe_note is null or char_length(safe_note) <= 1200),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.creative_project_learning_items (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.creative_projects(id) on delete cascade,
  item_type text not null check (item_type in ('lesson','future_recommendation')),
  title text not null check (char_length(title) between 3 and 180),
  detail text not null check (char_length(detail) between 3 and 4000),
  status text not null default 'draft' check (status in ('draft','review','approved','rejected','archived')),
  score integer null check (score is null or score between 0 and 100),
  rationale text null check (rationale is null or char_length(rationale) <= 2000),
  approved_by_staff_email text null,
  approved_at timestamptz null,
  created_by_staff_email text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.creative_project_archive_exports (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.creative_projects(id) on delete cascade,
  export_status text not null default 'prepared' check (export_status in ('prepared','downloaded','superseded')),
  manifest jsonb not null default '{}'::jsonb,
  contains_media_bytes boolean not null default false check (contains_media_bytes = false),
  public_destination_enabled boolean not null default false check (public_destination_enabled = false),
  created_by_staff_email text null,
  created_at timestamptz not null default now()
);

create index if not exists creative_project_inventory_reservations_idx on public.creative_project_inventory_reservations(project_id,status,created_at desc);
create index if not exists creative_project_shot_plan_items_idx on public.creative_project_shot_plan_items(project_id,status,created_at);
create index if not exists creative_project_learning_items_idx on public.creative_project_learning_items(project_id,item_type,status,score desc nulls last);
create index if not exists creative_project_archive_exports_idx on public.creative_project_archive_exports(project_id,created_at desc);

alter table public.creative_project_inventory_reservations enable row level security;
alter table public.creative_project_shot_plan_items enable row level security;
alter table public.creative_project_learning_items enable row level security;
alter table public.creative_project_archive_exports enable row level security;
revoke all privileges on table public.creative_project_inventory_reservations,public.creative_project_shot_plan_items,public.creative_project_learning_items,public.creative_project_archive_exports from public,anon,authenticated;
grant all privileges on table public.creative_project_inventory_reservations,public.creative_project_shot_plan_items,public.creative_project_learning_items,public.creative_project_archive_exports to service_role;

alter table public.creative_project_audit drop constraint if exists creative_project_audit_event_type_check;
alter table public.creative_project_audit add constraint creative_project_audit_event_type_check check (event_type in ('created','updated','session_added','output_updated','archived','restored','booking_unlinked','cost_line_added','material_line_added','labour_line_added','draft_updated','batch_approval','daip_associated','line_updated','line_soft_deleted','inventory_reservation_updated','session_story_approval','shot_plan_updated','learning_updated','archive_export_prepared','template_updated','content_plan_generated'));

comment on table public.creative_project_inventory_reservations is 'Build 231 reviewed project-consumption ledger. inventory_mutated is forcibly false; ordinary booking inventory remains unchanged.';
comment on table public.creative_project_archive_exports is 'Build 231 metadata-only archive manifests. No media bytes and no public destination.';
commit;


-- BEGIN BUILD 232
-- Build 232: accessible project controls, budgets, reminders, evidence and draft history
alter table if exists public.creative_projects add column if not exists project_budget_cad numeric(12,2) not null default 0 check (project_budget_cad >= 0);
alter table if exists public.creative_projects add column if not exists target_margin_percent numeric(5,2) not null default 30 check (target_margin_percent between 0 and 95);
alter table if exists public.creative_project_shot_plan_items add column if not exists owner_label text;
alter table if exists public.creative_project_shot_plan_items add column if not exists sort_order integer not null default 1 check (sort_order between 1 and 9999);
alter table if exists public.creative_project_shot_plan_items add column if not exists capture_evidence_note text;
create table if not exists public.creative_project_consent_reminders (id uuid primary key default gen_random_uuid(),project_id uuid not null references public.creative_projects(id) on delete cascade,due_at timestamptz not null,status text not null default 'queued_for_review' check(status in ('queued_for_review','approved','sent','cancelled','failed')),recipient_scope text not null default 'project_owner_review',safe_message text not null,created_by_staff_email text,created_at timestamptz not null default now(),updated_at timestamptz not null default now());
create table if not exists public.creative_project_output_draft_versions (id uuid primary key default gen_random_uuid(),project_id uuid not null references public.creative_projects(id) on delete cascade,output_type text not null,draft_kind text not null,version_payload jsonb not null default '{}'::jsonb,created_by_staff_email text,created_at timestamptz not null default now());
alter table public.creative_project_consent_reminders enable row level security;alter table public.creative_project_output_draft_versions enable row level security;
revoke all on public.creative_project_consent_reminders from public,anon,authenticated;revoke all on public.creative_project_output_draft_versions from public,anon,authenticated;
grant all on public.creative_project_consent_reminders to service_role;grant all on public.creative_project_output_draft_versions to service_role;
create index if not exists creative_project_consent_reminders_due_idx on public.creative_project_consent_reminders(status,due_at);
create index if not exists creative_project_draft_versions_project_idx on public.creative_project_output_draft_versions(project_id,output_type,draft_kind,created_at desc);
-- END BUILD 232


-- Build 233: provider-neutral supplier-link inventory intake, Amazon first.
create table if not exists public.catalog_supplier_import_audit (
  id uuid primary key default gen_random_uuid(), created_at timestamptz not null default now(),
  provider text not null, source_url text not null, external_product_id text null,
  parse_status text not null check (parse_status in ('parsed','partial','failed')), warning_text text null,
  duplicate_item_key text null, actor_name text null
);
create index if not exists catalog_supplier_import_audit_created_idx on public.catalog_supplier_import_audit(created_at desc);
alter table public.catalog_supplier_import_audit enable row level security;
revoke all on table public.catalog_supplier_import_audit from anon, authenticated;
grant all on table public.catalog_supplier_import_audit to service_role;


-- Build 235: ordered product/inventory gallery support (featured image remains image_url).
alter table if exists public.catalog_inventory_items add column if not exists gallery_image_urls jsonb not null default '[]'::jsonb;
alter table if exists public.catalog_items add column if not exists gallery_image_urls jsonb not null default '[]'::jsonb;

-- Build 236: no-DDL schedule compatibility and UI stabilization note.
-- The existing schedule source remains:
--   public.date_blocks(blocked_date, reason, created_at)
--   public.slot_blocks(blocked_date, slot, reason, created_at)
-- Build 236 API readers/writers use those columns and expose legacy aliases only at response boundaries.


-- Build 237 canonical schema synchronization (2026-07-28).
-- Apply sql/2026-07-28_build237_css_startup_evidence_roadmap.sql after Build 227.
create table if not exists public.app_launch_readiness_evidence (
  id uuid primary key default gen_random_uuid(), evidence_key text not null unique, title text not null, detail text not null,
  severity text not null check (severity in ('block','warn')), status text not null default 'pending' check (status in ('pending','verified','failed','waived')),
  sort_order integer not null default 100, evidence_note text null, verified_at timestamptz null, verified_by_staff_email text null,
  updated_by_staff_email text null, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.app_launch_readiness_evidence_audit (
  id uuid primary key default gen_random_uuid(), evidence_key text not null, event_type text not null, status text not null,
  actor_staff_email text null, safe_note text not null, created_at timestamptz not null default now()
);
alter table public.app_roadmap_execution_items add column if not exists cycle_key text not null default 'build227';
alter table public.app_roadmap_execution_items add column if not exists is_current_cycle boolean not null default false;
alter table public.app_roadmap_execution_items add column if not exists action_path text null;

-- BEGIN 2026-07-30_build238_inventory_transactions_merge_seo_preflight.sql
-- Build 238 — transactional inventory bulk updates, reviewed duplicate merge,
-- audit evidence, and launch-readiness roadmap cycle.
-- Apply in Supabase SQL Editor before using the new bulk/merge execute actions.

create table if not exists public.catalog_inventory_change_batches (
  id uuid primary key default gen_random_uuid(),
  operation_type text not null check (operation_type in ('bulk_update','archive','restore')),
  reason text not null check (char_length(reason) between 8 and 1200),
  row_count integer not null default 0 check (row_count >= 0),
  actor_staff_email text null,
  created_at timestamptz not null default now()
);

create table if not exists public.catalog_inventory_change_batch_rows (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null references public.catalog_inventory_change_batches(id) on delete restrict,
  item_id uuid not null references public.catalog_inventory_items(id) on delete restrict,
  item_key text not null,
  before_row jsonb not null,
  after_row jsonb not null,
  changed_fields text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists public.catalog_inventory_merge_audit (
  id uuid primary key default gen_random_uuid(),
  survivor_item_id uuid not null references public.catalog_inventory_items(id) on delete restrict,
  survivor_item_key text not null,
  duplicate_item_id uuid not null references public.catalog_inventory_items(id) on delete restrict,
  duplicate_item_key text not null,
  reason text not null check (char_length(reason) between 8 and 1200),
  reference_counts jsonb not null default '{}'::jsonb,
  survivor_before jsonb not null,
  duplicate_before jsonb not null,
  survivor_after jsonb not null,
  duplicate_after jsonb not null,
  actor_staff_email text null,
  created_at timestamptz not null default now()
);

create index if not exists catalog_inventory_change_batches_created_idx
  on public.catalog_inventory_change_batches(created_at desc);
create index if not exists catalog_inventory_change_batch_rows_batch_idx
  on public.catalog_inventory_change_batch_rows(batch_id, created_at);
create index if not exists catalog_inventory_change_batch_rows_item_idx
  on public.catalog_inventory_change_batch_rows(item_id, created_at desc);
create index if not exists catalog_inventory_merge_survivor_idx
  on public.catalog_inventory_merge_audit(survivor_item_id, created_at desc);
create index if not exists catalog_inventory_merge_duplicate_idx
  on public.catalog_inventory_merge_audit(duplicate_item_id, created_at desc);

alter table public.catalog_inventory_change_batches enable row level security;
alter table public.catalog_inventory_change_batch_rows enable row level security;
alter table public.catalog_inventory_merge_audit enable row level security;
revoke all privileges on table public.catalog_inventory_change_batches from public, anon, authenticated;
revoke all privileges on table public.catalog_inventory_change_batch_rows from public, anon, authenticated;
revoke all privileges on table public.catalog_inventory_merge_audit from public, anon, authenticated;
grant all privileges on table public.catalog_inventory_change_batches to service_role;
grant all privileges on table public.catalog_inventory_change_batch_rows to service_role;
grant all privileges on table public.catalog_inventory_merge_audit to service_role;

create or replace function public.admin_catalog_inventory_bulk_update(
  p_changes jsonb,
  p_actor_email text,
  p_reason text,
  p_operation_type text default 'bulk_update',
  p_dry_run boolean default true
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_change jsonb;
  v_patch jsonb;
  v_item_key text;
  v_before jsonb;
  v_after jsonb;
  v_item_id uuid;
  v_batch_id uuid;
  v_processed integer := 0;
  v_unknown text[];
  v_changed_fields text[];
  v_allowed constant text[] := array[
    'name','item_type','category','subcategory','description','qty_on_hand',
    'reorder_point','reorder_qty','unit_label','cost_cents','preferred_vendor',
    'reuse_policy','image_url','gallery_image_urls','is_public','is_active','notes'
  ];
begin
  if jsonb_typeof(p_changes) <> 'array' or jsonb_array_length(p_changes) < 1 then
    raise exception 'At least one inventory change is required.' using errcode = '22023';
  end if;
  if jsonb_array_length(p_changes) > 500 then
    raise exception 'A maximum of 500 rows can be updated in one batch.' using errcode = '22023';
  end if;
  if char_length(trim(coalesce(p_reason,''))) < 8 then
    raise exception 'Enter a reason with at least 8 characters.' using errcode = '22023';
  end if;
  if coalesce(p_operation_type,'') not in ('bulk_update','archive','restore') then
    raise exception 'Invalid inventory batch operation.' using errcode = '22023';
  end if;

  -- Validate the complete batch before any write. Any later exception rolls back the transaction.
  for v_change in select value from jsonb_array_elements(p_changes)
  loop
    v_item_key := trim(coalesce(v_change->>'item_key',''));
    v_patch := coalesce(v_change->'changes','{}'::jsonb);
    if v_item_key = '' then raise exception 'Every batch row requires item_key.' using errcode='22023'; end if;
    if jsonb_typeof(v_patch) <> 'object' or v_patch = '{}'::jsonb then
      raise exception 'Inventory row % has no changes.', v_item_key using errcode='22023';
    end if;
    select array_agg(k) into v_unknown
      from jsonb_object_keys(v_patch) as k
      where not (k = any(v_allowed));
    if coalesce(array_length(v_unknown,1),0) > 0 then
      raise exception 'Inventory row % contains unsupported fields: %.', v_item_key, array_to_string(v_unknown, ', ') using errcode='22023';
    end if;
    select to_jsonb(i), i.id into v_before, v_item_id
      from public.catalog_inventory_items i where i.item_key = v_item_key for update;
    if v_item_id is null then raise exception 'Inventory row % was not found.', v_item_key using errcode='P0002'; end if;
    if v_patch ? 'name' and char_length(trim(coalesce(v_patch->>'name',''))) < 2 then
      raise exception 'Inventory row % requires a useful name.', v_item_key using errcode='22023';
    end if;
    if v_patch ? 'item_type' and coalesce(v_patch->>'item_type','') not in ('tool','consumable') then
      raise exception 'Inventory row % has an invalid item type.', v_item_key using errcode='22023';
    end if;
    if v_patch ? 'reuse_policy' and coalesce(v_patch->>'reuse_policy','') not in ('reorder','single_use','never_reuse') then
      raise exception 'Inventory row % has an invalid reuse policy.', v_item_key using errcode='22023';
    end if;
    if v_patch ? 'gallery_image_urls' and (
      jsonb_typeof(v_patch->'gallery_image_urls') <> 'array' or jsonb_array_length(v_patch->'gallery_image_urls') > 7
    ) then raise exception 'Inventory row % can have no more than seven gallery images.', v_item_key using errcode='22023'; end if;
    if v_patch ? 'qty_on_hand' and coalesce((v_patch->>'qty_on_hand')::numeric,0) < 0 then
      raise exception 'Inventory row % cannot have negative quantity.', v_item_key using errcode='22023';
    end if;
    if v_patch ? 'reorder_point' and coalesce((v_patch->>'reorder_point')::numeric,0) < 0 then
      raise exception 'Inventory row % cannot have a negative reorder point.', v_item_key using errcode='22023';
    end if;
    if v_patch ? 'cost_cents' and (v_patch->>'cost_cents') is not null and (v_patch->>'cost_cents')::integer < 0 then
      raise exception 'Inventory row % cannot have a negative cost.', v_item_key using errcode='22023';
    end if;
  end loop;

  if not p_dry_run then
    insert into public.catalog_inventory_change_batches(operation_type,reason,row_count,actor_staff_email)
    values(p_operation_type,trim(p_reason),jsonb_array_length(p_changes),nullif(trim(coalesce(p_actor_email,'')),''))
    returning id into v_batch_id;
  end if;

  for v_change in select value from jsonb_array_elements(p_changes)
  loop
    v_item_key := trim(v_change->>'item_key');
    v_patch := v_change->'changes';
    select to_jsonb(i), i.id into v_before, v_item_id
      from public.catalog_inventory_items i where i.item_key = v_item_key for update;
    select array_agg(k order by k) into v_changed_fields from jsonb_object_keys(v_patch) as k;

    if p_dry_run then
      v_after := v_before || v_patch || jsonb_build_object('updated_at', now());
    else
      update public.catalog_inventory_items i set
        name = case when v_patch ? 'name' then trim(v_patch->>'name') else i.name end,
        item_type = case when v_patch ? 'item_type' then v_patch->>'item_type' else i.item_type end,
        category = case when v_patch ? 'category' then nullif(trim(v_patch->>'category'),'') else i.category end,
        subcategory = case when v_patch ? 'subcategory' then nullif(trim(v_patch->>'subcategory'),'') else i.subcategory end,
        description = case when v_patch ? 'description' then nullif(trim(v_patch->>'description'),'') else i.description end,
        qty_on_hand = case when v_patch ? 'qty_on_hand' then (v_patch->>'qty_on_hand')::numeric else i.qty_on_hand end,
        reorder_point = case when v_patch ? 'reorder_point' then (v_patch->>'reorder_point')::numeric else i.reorder_point end,
        reorder_qty = case when v_patch ? 'reorder_qty' then (v_patch->>'reorder_qty')::numeric else i.reorder_qty end,
        unit_label = case when v_patch ? 'unit_label' then nullif(trim(v_patch->>'unit_label'),'') else i.unit_label end,
        cost_cents = case when v_patch ? 'cost_cents' then nullif(v_patch->>'cost_cents','')::integer else i.cost_cents end,
        preferred_vendor = case when v_patch ? 'preferred_vendor' then nullif(trim(v_patch->>'preferred_vendor'),'') else i.preferred_vendor end,
        reuse_policy = case when v_patch ? 'reuse_policy' then v_patch->>'reuse_policy' else i.reuse_policy end,
        image_url = case when v_patch ? 'image_url' then nullif(trim(v_patch->>'image_url'),'') else i.image_url end,
        gallery_image_urls = case when v_patch ? 'gallery_image_urls' then v_patch->'gallery_image_urls' else i.gallery_image_urls end,
        is_public = case when v_patch ? 'is_public' then (v_patch->>'is_public')::boolean else i.is_public end,
        is_active = case when v_patch ? 'is_active' then (v_patch->>'is_active')::boolean else i.is_active end,
        notes = case when v_patch ? 'notes' then nullif(trim(v_patch->>'notes'),'') else i.notes end,
        updated_at = now()
      where i.id = v_item_id
      returning to_jsonb(i) into v_after;

      insert into public.catalog_inventory_change_batch_rows(
        batch_id,item_id,item_key,before_row,after_row,changed_fields
      ) values(v_batch_id,v_item_id,v_item_key,v_before,v_after,coalesce(v_changed_fields,'{}'));
    end if;
    v_processed := v_processed + 1;
  end loop;

  return jsonb_build_object(
    'ok',true,'dry_run',p_dry_run,'processed',v_processed,'batch_id',v_batch_id,
    'operation_type',p_operation_type
  );
end;
$$;

create or replace function public.admin_catalog_inventory_merge(
  p_survivor_item_key text,
  p_duplicate_item_key text,
  p_actor_email text,
  p_reason text,
  p_dry_run boolean default true
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  s public.catalog_inventory_items%rowtype;
  d public.catalog_inventory_items%rowtype;
  v_survivor_before jsonb;
  v_duplicate_before jsonb;
  v_survivor_after jsonb;
  v_duplicate_after jsonb;
  v_counts jsonb := '{}'::jsonb;
  v_count bigint;
  v_gallery jsonb;
  v_tags text[];
  v_note text;
begin
  if trim(coalesce(p_survivor_item_key,'')) = '' or trim(coalesce(p_duplicate_item_key,'')) = '' then
    raise exception 'Choose both a survivor and a duplicate inventory row.' using errcode='22023';
  end if;
  if p_survivor_item_key = p_duplicate_item_key then
    raise exception 'The survivor and duplicate must be different rows.' using errcode='22023';
  end if;
  if char_length(trim(coalesce(p_reason,''))) < 8 then
    raise exception 'Enter a merge reason with at least 8 characters.' using errcode='22023';
  end if;

  select * into s from public.catalog_inventory_items where item_key=p_survivor_item_key for update;
  if not found then raise exception 'Survivor inventory row was not found.' using errcode='P0002'; end if;
  select * into d from public.catalog_inventory_items where item_key=p_duplicate_item_key for update;
  if not found then raise exception 'Duplicate inventory row was not found.' using errcode='P0002'; end if;
  if s.item_type <> d.item_type then
    raise exception 'Only inventory rows of the same type can be merged.' using errcode='22023';
  end if;
  if nullif(trim(coalesce(s.unit_label,'')),'') is not null and nullif(trim(coalesce(d.unit_label,'')),'') is not null
     and lower(trim(s.unit_label)) <> lower(trim(d.unit_label)) then
    raise exception 'The selected rows use different units. Correct the units before merging.' using errcode='22023';
  end if;
  if d.is_active = false and coalesce(d.qty_on_hand,0)=0 and position('Merged into ' in coalesce(d.notes,''))>0 then
    raise exception 'The selected duplicate already appears to have been merged.' using errcode='22023';
  end if;

  v_survivor_before := to_jsonb(s);
  v_duplicate_before := to_jsonb(d);

  select count(*) into v_count from public.catalog_inventory_movements where item_id=d.id or item_key=d.item_key;
  v_counts := v_counts || jsonb_build_object('inventory_movements',v_count);
  select count(*) into v_count from public.catalog_low_stock_alerts where item_id=d.id or item_key=d.item_key;
  v_counts := v_counts || jsonb_build_object('low_stock_alerts',v_count);
  select count(*) into v_count from public.catalog_purchase_orders where item_id=d.id or item_key=d.item_key;
  v_counts := v_counts || jsonb_build_object('purchase_orders',v_count);
  select count(*) into v_count from public.catalog_item_receipts where item_key=d.item_key;
  v_counts := v_counts || jsonb_build_object('receipts',v_count);
  select count(*) into v_count from public.catalog_item_assignments where item_key=d.item_key;
  v_counts := v_counts || jsonb_build_object('assignments',v_count);
  select count(*) into v_count from public.service_product_links where item_key=d.item_key;
  v_counts := v_counts || jsonb_build_object('service_links',v_count);
  select count(*) into v_count from public.creative_project_material_lines where inventory_item_id=d.id;
  v_counts := v_counts || jsonb_build_object('project_material_lines',v_count);
  select count(*) into v_count from public.creative_project_inventory_reservations where inventory_item_id=d.id;
  v_counts := v_counts || jsonb_build_object('project_reservations',v_count);

  select coalesce(jsonb_agg(value order by first_seen),'[]'::jsonb) into v_gallery
  from (
    select value, first_seen
    from (
      select trim(value) as value, first_seen,
             row_number() over (partition by lower(trim(value)) order by first_seen) as duplicate_rank
      from (
        select value, ordinality first_seen from jsonb_array_elements_text(coalesce(s.gallery_image_urls,'[]'::jsonb)) with ordinality
        union all
        select value, 100 + ordinality first_seen from jsonb_array_elements_text(coalesce(d.gallery_image_urls,'[]'::jsonb)) with ordinality
      ) source_images
      where trim(value)<>''
    ) ranked_images
    where duplicate_rank=1
    order by first_seen
    limit 7
  ) dedup;
  select array_agg(tag order by tag) into v_tags from (
    select distinct trim(tag) tag from unnest(coalesce(s.service_tags,'{}') || coalesce(d.service_tags,'{}')) tag where trim(tag)<>''
  ) t;

  if p_dry_run then
    return jsonb_build_object(
      'ok',true,'dry_run',true,'reference_counts',v_counts,
      'survivor',v_survivor_before,'duplicate',v_duplicate_before,
      'proposed',jsonb_build_object(
        'qty_on_hand',coalesce(s.qty_on_hand,0)+coalesce(d.qty_on_hand,0),
        'cost_cents',coalesce(s.cost_cents,d.cost_cents),
        'image_url',coalesce(nullif(s.image_url,''),d.image_url),
        'gallery_image_urls',coalesce(v_gallery,'[]'::jsonb),
        'category',coalesce(nullif(s.category,''),d.category),
        'preferred_vendor',coalesce(nullif(s.preferred_vendor,''),d.preferred_vendor),
        'duplicate_action','archive with zero quantity; no hard delete'
      )
    );
  end if;

  -- Record a compensating transfer before moving historical references.
  if coalesce(d.qty_on_hand,0) <> 0 then
    insert into public.catalog_inventory_movements(item_id,item_key,movement_type,qty_delta,previous_qty,new_qty,unit_label,note,actor_name)
    values(s.id,s.item_key,'adjustment',coalesce(d.qty_on_hand,0),coalesce(s.qty_on_hand,0),coalesce(s.qty_on_hand,0)+coalesce(d.qty_on_hand,0),coalesce(s.unit_label,d.unit_label),'Build 238 duplicate merge transfer from '||d.item_key,nullif(trim(coalesce(p_actor_email,'')),''));
    insert into public.catalog_inventory_movements(item_id,item_key,movement_type,qty_delta,previous_qty,new_qty,unit_label,note,actor_name)
    values(d.id,d.item_key,'adjustment',-coalesce(d.qty_on_hand,0),coalesce(d.qty_on_hand,0),0,coalesce(d.unit_label,s.unit_label),'Build 238 duplicate merge transfer to '||s.item_key,nullif(trim(coalesce(p_actor_email,'')),''));
  end if;

  update public.catalog_inventory_movements set item_id=s.id,item_key=s.item_key,updated_at=now() where (item_id=d.id or item_key=d.item_key) and note not like 'Build 238 duplicate merge transfer to %';
  update public.catalog_low_stock_alerts set item_id=s.id,item_key=s.item_key where item_id=d.id or item_key=d.item_key;
  update public.catalog_purchase_orders set item_id=s.id,item_key=s.item_key,item_name=s.name,updated_at=now() where item_id=d.id or item_key=d.item_key;
  update public.catalog_item_receipts set item_key=s.item_key where item_key=d.item_key;
  update public.catalog_item_assignments set item_key=s.item_key where item_key=d.item_key;
  update public.service_product_links set item_key=s.item_key,updated_at=now() where item_key=d.item_key;
  update public.creative_project_material_lines set inventory_item_id=s.id,updated_at=now() where inventory_item_id=d.id;
  update public.creative_project_inventory_reservations set inventory_item_id=s.id,updated_at=now() where inventory_item_id=d.id;

  update public.catalog_inventory_items as ci set
    qty_on_hand=coalesce(s.qty_on_hand,0)+coalesce(d.qty_on_hand,0),
    reorder_point=greatest(coalesce(s.reorder_point,0),coalesce(d.reorder_point,0)),
    reorder_qty=greatest(coalesce(s.reorder_qty,0),coalesce(d.reorder_qty,0)),
    category=coalesce(nullif(s.category,''),d.category),
    subcategory=coalesce(nullif(s.subcategory,''),d.subcategory),
    description=coalesce(nullif(s.description,''),d.description),
    image_url=coalesce(nullif(s.image_url,''),d.image_url),
    gallery_image_urls=coalesce(v_gallery,'[]'::jsonb),
    cost_cents=coalesce(s.cost_cents,d.cost_cents),
    preferred_vendor=coalesce(nullif(s.preferred_vendor,''),d.preferred_vendor),
    vendor_sku=coalesce(nullif(s.vendor_sku,''),d.vendor_sku),
    unit_label=coalesce(nullif(s.unit_label,''),d.unit_label),
    receipt_url=coalesce(nullif(s.receipt_url,''),d.receipt_url),
    assigned_station=coalesce(nullif(s.assigned_station,''),d.assigned_station),
    amazon_url=coalesce(nullif(s.amazon_url,''),d.amazon_url),
    amazon_asin=coalesce(nullif(s.amazon_asin,''),d.amazon_asin),
    amazon_title=coalesce(nullif(s.amazon_title,''),d.amazon_title),
    amazon_brand=coalesce(nullif(s.amazon_brand,''),d.amazon_brand),
    amazon_category=coalesce(nullif(s.amazon_category,''),d.amazon_category),
    service_tags=coalesce(v_tags,'{}'),
    notes=concat_ws(E'\n',nullif(s.notes,''),'Merged duplicate '||d.item_key||' on '||to_char(now(),'YYYY-MM-DD')||'. Reason: '||trim(p_reason)),
    is_active=true,
    updated_at=now()
  where ci.id=s.id returning to_jsonb(ci) into v_survivor_after;

  v_note := concat_ws(E'\n',nullif(d.notes,''),'Merged into '||s.item_key||' on '||to_char(now(),'YYYY-MM-DD')||'. Reason: '||trim(p_reason));
  update public.catalog_inventory_items as ci set
    qty_on_hand=0,is_active=false,is_public=false,notes=v_note,updated_at=now()
  where ci.id=d.id returning to_jsonb(ci) into v_duplicate_after;

  insert into public.catalog_inventory_merge_audit(
    survivor_item_id,survivor_item_key,duplicate_item_id,duplicate_item_key,reason,
    reference_counts,survivor_before,duplicate_before,survivor_after,duplicate_after,actor_staff_email
  ) values(
    s.id,s.item_key,d.id,d.item_key,trim(p_reason),v_counts,
    v_survivor_before,v_duplicate_before,v_survivor_after,v_duplicate_after,nullif(trim(coalesce(p_actor_email,'')),'')
  );

  return jsonb_build_object('ok',true,'dry_run',false,'reference_counts',v_counts,'survivor',v_survivor_after,'duplicate',v_duplicate_after);
end;
$$;

revoke all on function public.admin_catalog_inventory_bulk_update(jsonb,text,text,text,boolean) from public, anon, authenticated;
revoke all on function public.admin_catalog_inventory_merge(text,text,text,text,boolean) from public, anon, authenticated;
grant execute on function public.admin_catalog_inventory_bulk_update(jsonb,text,text,text,boolean) to service_role;
grant execute on function public.admin_catalog_inventory_merge(text,text,text,text,boolean) to service_role;

comment on table public.catalog_inventory_change_batches is 'Build 238 audit header for transactional inventory bulk changes. Browser sequential partial-save batches should not be used.';
comment on table public.catalog_inventory_merge_audit is 'Build 238 append-only evidence for reviewed duplicate inventory merges. Duplicates are archived, never hard deleted.';
comment on function public.admin_catalog_inventory_bulk_update(jsonb,text,text,text,boolean) is 'Build 238 validates the entire batch before an all-or-nothing inventory update and records before/after evidence.';
comment on function public.admin_catalog_inventory_merge(text,text,text,text,boolean) is 'Build 238 previews or executes a reviewed duplicate merge, transfers known references, records compensating quantity movements, and archives the duplicate.';

-- Current-cycle roadmap items. Existing historical rows remain audit evidence.
update public.app_roadmap_execution_items set is_current_cycle=false where coalesce(is_current_cycle,false)=true;
insert into public.app_roadmap_execution_items(
  item_key,title,workstream,priority,status,target_build,sort_order,source_document,cycle_key,is_current_cycle,action_path
) values
('b238_01','Apply Build 238 inventory transaction migration in staging','operations','critical','planned',238,10,'MASTER_VALUE_ROADMAP.md','build238_launch_polish',true,'Supabase SQL Editor → sql/2026-07-30_build238_inventory_transactions_merge_seo_preflight.sql'),
('b238_02','Preview and execute one harmless two-row inventory merge','operations','high','planned',238,20,'STARTUP_GO_LIVE_BLOCKERS.md','build238_launch_polish',true,'/admin-inventory-manager.html'),
('b238_03','Preview and execute one transactional bulk inventory update','operations','high','planned',238,30,'STARTUP_GO_LIVE_BLOCKERS.md','build238_launch_polish',true,'/admin-inventory-manager.html'),
('b238_04','Verify Build 238 SEO title and description changes in preview','seo','high','planned',238,40,'MASTER_VALUE_ROADMAP.md','build238_launch_polish',true,'Public homepage, services, pricing, booking, gallery and local pages'),
('b238_05','Complete Block Calendar full-day AM PM production-like test','booking','critical','planned',238,50,'STARTUP_GO_LIVE_BLOCKERS.md','build238_launch_polish',true,'/admin-blocks.html'),
('b238_06','Complete end-to-end booking and admin record verification','booking','critical','planned',238,60,'STARTUP_GO_LIVE_BLOCKERS.md','build238_launch_polish',true,'/book.html → /admin-booking.html'),
('b238_07','Complete and refund a small live Stripe transaction','payments','critical','planned',238,70,'STARTUP_GO_LIVE_BLOCKERS.md','build238_launch_polish',true,'/admin-payments.html and Stripe Dashboard'),
('b238_08','Verify all required notification types in external inboxes','reliability','critical','planned',238,80,'STARTUP_GO_LIVE_BLOCKERS.md','build238_launch_polish',true,'/admin-test-centre.html'),
('b238_09','Audit Cloudflare production variables bindings and branches','reliability','critical','planned',238,90,'STARTUP_GO_LIVE_BLOCKERS.md','build238_launch_polish',true,'Cloudflare Dashboard → Workers & Pages → Rosie Dazzlers'),
('b238_10','Perform Supabase staging backup and restore rehearsal','reliability','critical','planned',238,100,'STARTUP_GO_LIVE_BLOCKERS.md','build238_launch_polish',true,'Supabase Dashboard → Database → Backups'),
('b238_11','Review and publish customer policy and consent wording','customer','critical','planned',238,110,'STARTUP_GO_LIVE_BLOCKERS.md','build238_launch_polish',true,'/admin-site-settings.html and public footer policy pages'),
('b238_12','Complete iPhone-size and Android-size real-device checks','reliability','high','planned',238,120,'STARTUP_GO_LIVE_BLOCKERS.md','build238_launch_polish',true,'Public and admin critical routes on real devices'),
('b238_13','Complete accessibility keyboard focus contrast and errors','reliability','high','planned',238,130,'STARTUP_GO_LIVE_BLOCKERS.md','build238_launch_polish',true,'/admin-test-centre.html'),
('b238_14','Submit sitemap and validate canonical and structured data','seo','critical','planned',238,140,'STARTUP_GO_LIVE_BLOCKERS.md','build238_launch_polish',true,'Google Search Console and Rich Results Test'),
('b238_15','Verify Google Business Profile categories service area and proof','seo','critical','planned',238,150,'STARTUP_GO_LIVE_BLOCKERS.md','build238_launch_polish',true,'Google Business Profile → Edit profile'),
('b238_16','Finish suspicious inventory name category and cost cleanup','operations','high','planned',238,160,'STARTUP_GO_LIVE_BLOCKERS.md','build238_launch_polish',true,'/admin-inventory-manager.html'),
('b238_17','Complete featured and seven-image product media metadata','media','high','planned',238,170,'STARTUP_GO_LIVE_BLOCKERS.md','build238_launch_polish',true,'/admin-inventory-manager.html and /admin-catalog.html'),
('b238_18','Replace high-value public visual placeholders with local proof','media','high','planned',238,180,'STARTUP_GO_LIVE_BLOCKERS.md','build238_launch_polish',true,'/admin-media-health.html and IMAGES.md'),
('b238_19','Run invite-only soft launch with daily incident review','operations','critical','planned',238,190,'STARTUP_GO_LIVE_BLOCKERS.md','build238_launch_polish',true,'/admin-launch-readiness.html and /admin-today.html'),
('b238_20','Modernize release guards before archiving redundant Markdown','documentation','medium','planned',238,200,'MASTER_VALUE_ROADMAP.md','build238_launch_polish',true,'scripts/release_check.py and DOC_INDEX.md')
on conflict(item_key) do update set
 title=excluded.title,workstream=excluded.workstream,priority=excluded.priority,status=excluded.status,
 target_build=excluded.target_build,sort_order=excluded.sort_order,source_document=excluded.source_document,
 cycle_key=excluded.cycle_key,is_current_cycle=excluded.is_current_cycle,action_path=excluded.action_path,updated_at=now();
-- END 2026-07-30_build238_inventory_transactions_merge_seo_preflight.sql

-- BEGIN BUILD 239 UNIFIED STARTUP COMMAND CENTER
-- Build 239 — unified Startup Command Center, database-backed process catalog, shared evidence expansion, and current execution cycle.
begin;
create table if not exists public.app_startup_process_items (
 id uuid primary key default gen_random_uuid(),
 process_key text not null unique check (process_key ~ '^[a-z0-9_-]{4,120}$'),
 sort_order integer not null check (sort_order between 1 and 10000),
 category text not null check (char_length(category) between 3 and 120),
 severity text not null check (severity in ('blocker','high','planned')),
 title text not null check (char_length(title) between 5 and 240),
 why_text text not null check (char_length(why_text) between 8 and 3000),
 locations jsonb not null default '[]'::jsonb check (jsonb_typeof(locations)='array'),
 instructions jsonb not null default '[]'::jsonb check (jsonb_typeof(instructions)='array'),
 done_when text not null check (char_length(done_when) between 8 and 3000),
 action_route text null check (action_route is null or char_length(action_route)<=500),
 evidence_key text null check (evidence_key is null or evidence_key ~ '^[a-z0-9_:-]{4,80}$'),
 source_build integer not null default 239 check (source_build between 237 and 999),
 is_active boolean not null default true,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create table if not exists public.app_startup_process_audit (
 id uuid primary key default gen_random_uuid(),
 process_key text not null,
 event_type text not null check (event_type in ('seeded','updated','activated','retired')),
 actor_staff_email text null,
 safe_note text not null check (char_length(safe_note) between 3 and 1000),
 created_at timestamptz not null default now()
);
insert into public.app_startup_process_items(process_key,sort_order,category,severity,title,why_text,locations,instructions,done_when,action_route,evidence_key,source_build,is_active) values
('deploy-239',1,'Deployment and CSS','blocker','Deploy Build 239 and verify the unified Startup Command Center','Build 239 consolidates Startup, Launch Readiness, Production Readiness, guided testing, and roadmap execution into one protected interface. A partial or cached deployment could leave old standalone pages or mismatched assets active.','["Cloudflare Pages → Deployments → preview branch", "/admin-startup-guide", "/admin-launch-readiness", "/admin-production", "/admin-test-centre", "Browser DevTools → Network and Console"]'::jsonb,'["Deploy Build 239 to the preview/development branch.", "Open /admin-startup-guide in a private browser window and press Ctrl+Shift+R.", "Confirm the Overview, Blockers, Evidence, Production, Guided Tests, and Roadmap sections all load.", "Open /admin-launch-readiness, /admin-production, and /admin-test-centre and confirm each forwards to the matching Startup Command Center section.", "In DevTools Network, confirm /assets/site.css, AdminShell, AdminMenu, the startup catalog API, and readiness APIs return HTTP 200 or show a clearly labelled fallback.", "Repeat the check at phone width and confirm the section navigation, cards, tables, dialogs, and action buttons remain usable."]'::jsonb,'The unified Startup Command Center is the only normal prelaunch workspace, legacy readiness routes forward safely, all sections work on desktop and mobile, and no required CSS/script/API request fails.','/admin-startup-guide.html','deploy_239',239,true),
('migration-237',2,'Database migrations','blocker','Apply the Build 237 database migration','Shared launch evidence and the current roadmap cycle cannot persist until the new tables/columns exist. The UI has a safe local/static fallback, but shared evidence is the intended source of truth.','["Supabase Dashboard → SQL Editor", "sql/2026-07-28_build237_css_startup_evidence_roadmap.sql", "Supabase Dashboard → Table Editor"]'::jsonb,'["Open the SQL file from the build package.", "Copy the complete file into Supabase SQL Editor.", "Run it in staging/preview first.", "Confirm app_launch_readiness_evidence and app_launch_readiness_evidence_audit exist.", "Confirm app_roadmap_execution_items includes cycle_key, is_current_cycle and action_path.", "Open /admin-launch-readiness and /admin-roadmap-execution and confirm database-backed results load."]'::jsonb,'The two pages report shared/database evidence rather than browser-only fallback and the current Build 237 roadmap cycle appears.','/admin-launch-readiness.html','migration_237',239,true),
('migration-238',3,'Database migrations','blocker','Apply the Build 238 inventory transaction and merge migration','The new Inventory Workbench deliberately refuses to execute bulk changes or duplicate merges without database functions that validate the whole operation and record audit evidence. This prevents a browser/network failure from leaving half a batch changed.','["Supabase Dashboard → SQL Editor", "sql/2026-07-30_build238_inventory_transactions_merge_seo_preflight.sql", "Supabase Dashboard → Database → Functions", "/admin-inventory-manager.html"]'::jsonb,'["Confirm the Build 237 migration has already been applied.", "Open sql/2026-07-30_build238_inventory_transactions_merge_seo_preflight.sql from the build package.", "Copy the complete migration into Supabase SQL Editor and run it in staging/preview first.", "Confirm catalog_inventory_change_batches, catalog_inventory_change_batch_rows and catalog_inventory_merge_audit exist.", "Confirm admin_catalog_inventory_bulk_update and admin_catalog_inventory_merge appear under database functions.", "Reload /admin-inventory-manager.html and preview a harmless batch without executing it.", "Open Transaction & merge history and confirm it loads an empty or current shared audit view without a migration-required error.", "Record the migration date and staging result in Launch Readiness evidence."]'::jsonb,'Both new RPC functions can complete dry-run previews, the three audit tables exist, Transaction & merge history loads, and no browser sequential partial-save fallback is used.','/admin-inventory-manager.html','migration_238',239,true),
('migration-239',4,'Database migrations','blocker','Apply the Build 239 unified Startup Command Center migration','The detailed startup catalog should have one database source of truth instead of being duplicated across JSON, Markdown, launch-readiness cards, production checks, and roadmap notes. The static catalog remains only as a safe read-only fallback.','["Supabase Dashboard → SQL Editor", "sql/2026-08-01_build239_unified_startup_command_center.sql", "Supabase Dashboard → Table Editor → app_startup_process_items", "/admin-startup-guide.html"]'::jsonb,'["Confirm the Build 237 and Build 238 migrations have been applied.", "Open sql/2026-08-01_build239_unified_startup_command_center.sql from the build package.", "Run the complete migration in staging/preview first.", "Confirm app_startup_process_items and app_startup_process_audit exist.", "Confirm the table contains every current blocker and no Build 238 blocker was removed.", "Reload /admin-startup-guide.html and confirm the source badge says Shared database catalog instead of Packaged fallback.", "Change one evidence status, one guided test result, and one roadmap row; refresh on another browser/device and confirm the shared state remains."]'::jsonb,'The Startup Command Center loads every detailed process from the database, all existing items remain present, shared evidence/tests/roadmap persist across devices, and the static JSON is used only during migration or outage.','/admin-startup-guide.html#overview','migration_239',239,true),
('block-calendar',5,'Booking and scheduling','blocker','Retest the repaired Block Calendar against public booking','Availability mistakes can cause double-booking or hide valid dates. A visual repair alone is not enough; save/remove behaviour must be proven against the public booking wizard.','["/admin-blocks.html", "/book", "Supabase schedule block tables"]'::jsonb,'["Choose a future date with no customer booking.", "Create a full-day block and refresh the calendar.", "Open /book in another tab and confirm that date is unavailable.", "Remove the full-day block and confirm the date returns.", "Create an AM-only block and confirm PM remains available.", "Remove AM, create PM-only, and confirm AM remains available.", "Remove the test block and record the tested date in Launch Readiness evidence."]'::jsonb,'Full-date, AM and PM changes persist after refresh and the public booking wizard matches every admin change.','/admin-blocks.html','block_calendar',239,true),
('booking-e2e',6,'Booking and scheduling','blocker','Complete one end-to-end booking test','The complete path must work as one system: availability, vehicle, package, add-ons, customer details, deposit, confirmation and admin record.','["/book", "/admin-booking.html", "Customer confirmation email/inbox"]'::jsonb,'["Use a clearly labelled test customer and a future test date.", "Complete every booking step on a phone-sized screen.", "Confirm pricing, HST/deposit and selected options before payment.", "Finish the booking and save the confirmation number.", "Open Admin Booking and verify date, slot, vehicle, package, add-ons, customer and payment state.", "Cancel or mark the test record according to your test-data policy."]'::jsonb,'The customer and admin views agree and no manual database correction is needed.','/book','booking_e2e',239,true),
('stripe-live',7,'Payments','blocker','Complete and refund a small live Stripe payment','Test-mode success does not prove live keys, webhook secrets, receipts, refunds or accounting evidence are configured correctly.','["/admin-payments.html", "Stripe Dashboard → Payments", "Stripe Dashboard → Developers → Webhooks", "/admin-accounting.html"]'::jsonb,'["Confirm the deployment intentionally reports Stripe live mode.", "Create a small real payment tied to a labelled test booking/quote.", "Confirm the browser returns to the correct success page.", "Verify the Stripe event reached the deployed webhook with HTTP 2xx.", "Verify the payment appears in admin payment/accounting views.", "Issue a full refund and confirm the refund event and final status.", "Record only safe payment identifiers; never put card details in evidence notes."]'::jsonb,'Payment, webhook, receipt, refund and accounting views agree on the final state.','/admin-payments.html','stripe_live',239,true),
('email-delivery',8,'Notifications','blocker','Verify every required email reaches an external inbox','A successful API response does not prove customers or staff receive messages, and spam/mobile formatting failures can block operations.','["/admin-notifications.html", "Notification provider dashboard", "External Gmail/Outlook inboxes"]'::jsonb,'["Send a booking confirmation to an external test inbox.", "Send payment/deposit, staff assignment and consent/review messages where applicable.", "Check Inbox, Promotions and Spam/Junk folders.", "Open each message on desktop and mobile.", "Verify links go to the correct deployed domain and are not expired.", "Record provider message IDs or timestamps without including private content."]'::jsonb,'All required messages arrive, render clearly and contain working links.','/admin-notifications.html','email_delivery',239,true),
('environment',9,'Deployment and security','blocker','Audit Cloudflare production variables and bindings','Missing or preview-only variables are a common cause of login, payment, notification, storage and API failures after launch.','["Cloudflare Dashboard → Workers & Pages → rosiedazzlers → Settings", "docs/CLOUDFLARE_ENVIRONMENT_CHECKLIST.md", "/api/health"]'::jsonb,'["Open Variables and Secrets for both Preview and Production.", "Verify Supabase URL/service key, Stripe keys/webhook secret, notification credentials, R2 bindings and public asset settings.", "Confirm secrets are stored as encrypted secrets, not committed files.", "Confirm custom domains point to the production deployment.", "Open /api/health and record the non-secret environment/mode result.", "Update the environment checklist with the exact Cloudflare screen where each setting lives."]'::jsonb,'Every required integration has an intentional production value/binding and no secret is stored in the repository.','/admin-production.html','environment',239,true),
('backup-restore',10,'Recovery','blocker','Test backup and restore, not just backup availability','A backup is useful only when you know how to restore it and confirm permissions/data integrity afterward.','["Supabase Dashboard → Database → Backups", "/admin-recovery.html", "docs/PRODUCTION_TEST_GUIDE.md"]'::jsonb,'["Confirm the Supabase plan and backup retention available to the project.", "Choose a safe staging restore method or export a small representative data set.", "Restore to a staging project/schema or re-import selected test records.", "Compare row counts and key relationships.", "Test staff access and RLS through Cloudflare Functions after restore.", "Write the exact recovery sequence, owner and expected maximum data-loss window."]'::jsonb,'A documented rehearsal proves data can be recovered and accessed through the application boundary.','/admin-recovery.html','backups',239,true),
('legal',11,'Policies and customer trust','blocker','Review all policies before accepting unrestricted orders','Booking, deposits, cancellations, driveway requirements, runoff/bylaw responsibility, media use and privacy must be clear before a customer commits.','["/privacy.html", "/terms.html", "/refund-policy.html", "/book", "Footer policy links"]'::jsonb,'["Read each policy as a customer, not as a developer.", "Confirm business name, contact method, province and effective date.", "Align cancellation/deposit/refund wording with the actual payment workflow.", "Confirm photo/media consent is optional and visibility choices are clear.", "Confirm power/water, driveway and local bylaw/service-condition wording matches operations.", "Have a qualified Ontario professional review any wording that carries legal or tax risk.", "Verify all policy links are visible from booking, checkout and footer."]'::jsonb,'Published policy wording matches real operations and every checkout/booking link is easy to find.','/privacy.html','legal',239,true),
('security',12,'Deployment and security','blocker','Verify staff permissions, sessions and protected APIs','Admin pages and APIs contain customer, payment and operational data. Visual hiding is not authorization.','["/admin-security.html", "/admin-app.html", "Browser DevTools", "Supabase Security Advisor"]'::jsonb,'["Test Admin, Senior Detailer and Detailer accounts separately.", "Confirm each role can access only intended pages/actions.", "Call protected APIs while signed out and confirm 401/403 responses.", "Sign out and confirm old pages cannot continue saving data.", "Review Supabase Security Advisor and RLS posture.", "Verify security headers on public and admin responses.", "Record failures as blockers, not accepted warnings."]'::jsonb,'Server-side authorization, session expiry/logout and database containment are proven for each role.','/admin-security.html','security',239,true),
('mobile',13,'Mobile and accessibility','high','Complete real-device mobile testing','Responsive browser resizing does not fully test touch, on-screen keyboards, camera uploads, slow connections or mobile payment handoff.','["Real phone browsers", "/book", "/admin-blocks.html", "/admin-inventory-manager.html", "/detailer-jobs.html"]'::jsonb,'["Test portrait and landscape on a real phone.", "Open/close the mobile dropdown menu on every core page.", "Complete booking fields with the on-screen keyboard.", "Test calendar tapping, inventory row/card editing and image upload/capture.", "Confirm no horizontal page drift except intentional table/calendar scroll regions.", "Test a slower network profile and retry behaviour.", "Capture screenshots of any overlap or unreadable control."]'::jsonb,'All primary customer and staff tasks can be completed without zooming, clipped controls or lost input.','/admin-test-centre.html','mobile',239,true),
('accessibility',14,'Mobile and accessibility','high','Complete keyboard, focus, labels and contrast review','Accessible forms reduce customer abandonment and also expose hidden UI/JavaScript problems before launch.','["Public home/services/booking/payment pages", "Critical admin pages", "Browser accessibility tree"]'::jsonb,'["Navigate every interactive control using Tab/Shift+Tab only.", "Confirm visible focus never disappears behind sticky elements.", "Verify each input has a useful label and each error is announced/readable.", "Check heading order and confirm one H1 per exposed page.", "Check colour contrast for text, buttons, notices and disabled states.", "Test at 200% browser zoom.", "Document exceptions with route, control and screenshot."]'::jsonb,'Critical flows are usable by keyboard and at high zoom with clear labels, focus and errors.','/admin-test-centre.html','accessibility',239,true),
('search-preflight',15,'SEO and local visibility','high','Complete Search Console, sitemap, canonical and schema preflight','The site already has strong local/service architecture, but indexing and structured-data evidence must be checked on the deployed canonical domain.','["Google Search Console", "/sitemap.xml", "Google Rich Results Test", "Public page source"]'::jsonb,'["Verify the rosiedazzlers.ca Search Console property.", "Submit https://rosiedazzlers.ca/sitemap.xml.", "Inspect the homepage, booking, primary service and town URLs.", "Confirm canonical URLs use the production domain and preferred trailing-slash pattern.", "Test LocalBusiness/Service/WebSite structured data and correct errors.", "Review indexed pages for accidental admin/dev URLs.", "Record real search queries monthly before rewriting titles."]'::jsonb,'The sitemap is accepted, important pages are inspectable/indexable, admin pages are noindex and schema has no critical errors.','/admin-seo-tasks.html','search',239,true),
('business-profile',16,'SEO and local visibility','high','Complete and align Google Business Profile','Local visibility depends heavily on accurate relevance, distance/service-area and prominence signals; the profile must match the website and real business.','["Google Business Profile Manager", "/contact.html", "/services.html", "Town/service landing pages"]'::jsonb,'["Confirm the real-world business name without keyword stuffing.", "Choose the most specific accurate primary category and relevant secondary categories.", "Confirm service areas, phone, website and hours.", "Add accurate services and descriptions that match the site.", "Upload approved real photos regularly.", "Create a review-request link and respond to reviews.", "Compare profile information with footer/contact/schema data for consistency."]'::jsonb,'The profile is verified, complete, accurate and consistent with the production website.','/admin-marketing.html','business_profile',239,true),
('inventory-cleanup',17,'Inventory and products','high','Clean inventory records before relying on product sales and job costing','Suspicious imported names, missing costs/categories and duplicates reduce customer trust and make pricing/profitability unreliable.','["/admin-inventory-manager.html", "/admin-catalog.html", "Inventory Workbench filters"]'::jsonb,'["Filter Suspicious names and replace ASIN/alphanumeric titles with clear product names.", "Complete category, vendor, unit, cost and reorder point.", "Confirm tool versus consumable classification.", "Archive rows that are true duplicates only after checking history/references.", "Leave unfinished rows inactive/private.", "Export a CSV snapshot before large bulk changes.", "Spot-check calculations after updates."]'::jsonb,'Every active/sellable row has a clear name, classification, category, cost and intentional active/public state.','/admin-inventory-manager.html','inventory_cleanup',239,true),
('product-images',18,'Inventory and products','high','Complete product image sets and metadata','Products need strong visual proof, but multiple images must remain ordered, descriptive, consent-safe and performant.','["/admin-inventory-manager.html", "/admin-catalog.html", "Product public page/gallery"]'::jsonb,'["Set one featured image that clearly shows the complete item.", "Add up to seven gallery images covering detail, scale, packaging, use and variations.", "Order images from strongest overview to supporting detail.", "Write concise descriptive alt text rather than keyword lists.", "Record image role, caption, source/provenance and consent where applicable.", "Verify images load on mobile and do not cause layout shift.", "Keep products private until the image set and customer-facing copy are ready."]'::jsonb,'Every sellable product has a reliable featured image, useful gallery and accurate accessible metadata.','/admin-inventory-manager.html','product_images',239,true),
('pricing-tax',19,'Payments','blocker','Verify pricing, deposits, HST and final totals','Customer-visible totals must match booking, checkout, receipts and accounting. Price drift is a launch blocker.','["/pricing.html", "/book", "/admin-site-settings.html", "/admin-tax-review.html", "Stripe checkout"]'::jsonb,'["Compare every package and add-on price in public pricing, booking and admin catalog.", "Verify vehicle-size price differences.", "Confirm deposit rules and cancellation/refund handling.", "Verify HST calculation and rounding on representative totals.", "Confirm Stripe checkout amount matches the final booking/quote.", "Verify receipt and accounting entries use the same amounts.", "Document who can change prices and how changes are reviewed."]'::jsonb,'The same selected service produces the same subtotal, tax, deposit and total everywhere.','/admin-tax-review.html','pricing_tax',239,true),
('analytics',20,'SEO and local visibility','high','Verify analytics and conversion events in production','You need trustworthy evidence before changing SEO, ads or booking UX, and consent settings must be respected.','["/admin-analytics.html", "Browser DevTools", "Analytics provider real-time/debug view"]'::jsonb,'["Accept and reject analytics consent and confirm expected script behaviour.", "Trigger page view, package view, booking start, quote start, booking complete and payment events.", "Confirm events use the production domain and useful non-private parameters.", "Verify UTM/source values flow into lead/booking reporting.", "Exclude internal/admin traffic where practical.", "Record a baseline before launch marketing changes."]'::jsonb,'Core conversion events arrive once, contain no sensitive customer data and can be tied to real acquisition sources.','/admin-analytics.html','analytics',239,true),
('monitoring',21,'Recovery','high','Prepare production monitoring and incident response','During the first live bookings, failures must be noticed quickly and have a clear owner and rollback path.','["/admin-production.html", "Cloudflare logs", "Supabase logs", "Stripe webhook logs", "KNOWN_GAPS_AND_RISKS.md"]'::jsonb,'["Confirm where Cloudflare Function errors are viewed.", "Confirm Supabase database/auth logs and Stripe webhook logs.", "Define who checks failures during the first week and how often.", "Write a stop-taking-bookings procedure.", "Document rollback to the previous deployment.", "Create an incident record for any payment, booking, privacy or data-loss failure.", "Review logs daily during soft launch."]'::jsonb,'A named owner can detect, classify, communicate and roll back a critical failure without searching for instructions.','/admin-production.html','monitoring',239,true),
('soft-launch',22,'Go-live decision','blocker','Use an invite-only soft launch before unrestricted public promotion','A controlled first group gives real evidence without exposing the business to a large volume of simultaneous failures.','["/admin-launch-readiness.html", "/admin-today.html", "/admin-production.html", "Business operations calendar"]'::jsonb,'["Resolve all critical blockers or explicitly document why a controlled exception is safe.", "Invite only a small number of known customers.", "Limit daily capacity to what can be manually supported.", "Review each booking, payment, email, job update, inventory movement and review request.", "Hold public advertising until the first transactions are stable.", "Record incidents and fixes immediately.", "Expand gradually after a defined stable period."]'::jsonb,'Several real transactions complete without critical manual correction and monitoring evidence supports broader launch.','/admin-launch-readiness.html','operations',239,true),
('duplicate-merge',23,'Inventory and products','high','Test the reviewed duplicate inventory merge workflow','Build 238 now provides a preview-first merge that transfers known operational references, records compensating quantity movements and archives the duplicate. It still requires migration and staging proof before use on important rows.','["/admin-inventory-manager.html", "Supabase → catalog_inventory_merge_audit", "Supabase → catalog_inventory_movements", "STARTUP_GO_LIVE_BLOCKERS.md"]'::jsonb,'["Apply the Build 238 migration in staging.", "Choose two harmless test rows that truly represent the same item and have no irreplaceable history.", "Select exactly those two rows in Inventory Workbench and choose Review two-row merge.", "Choose the survivor row and enter a clear reason.", "Select Preview merge and inspect quantity, gallery count and every reference-count card.", "Confirm the survivor should keep its current values when present and inherit only missing values.", "Execute the merge, reload the page and verify the duplicate is inactive, private and zero quantity.", "Verify purchase orders, movements, assignments, service links and project references point to the survivor where applicable.", "Verify catalog_inventory_merge_audit contains before/after rows and the reason.", "Open Transaction & merge history, confirm the merge appears with the correct survivor, archived duplicate, reason, actor, timestamp and transferred-reference counts, then export the audit CSV."]'::jsonb,'A staging merge preserves history, transfers known references, records compensating quantity movements, archives rather than deletes the duplicate, and appears correctly in the read-only audit history/CSV.','/admin-inventory-manager.html','inventory_merge_238',239,true),
('bulk-rpc',24,'Inventory and products','high','Test transactional bulk inventory updates and rollback behaviour','Build 238 replaces sequential browser saves with an all-or-nothing database function. The complete batch is validated before any write and records a batch header plus row-level before/after evidence.','["/admin-inventory-manager.html", "Supabase → catalog_inventory_change_batches", "Supabase → catalog_inventory_change_batch_rows", "Cloudflare Function logs"]'::jsonb,'["Apply the Build 238 migration in staging.", "Select two harmless inventory test rows.", "Choose a bulk field and value and enter a specific audit reason.", "Select Preview batch and verify the message says no rows were changed.", "Choose Apply transaction and confirm both rows change together.", "Verify one batch header and two row evidence records exist.", "Repeat with one deliberately invalid test value and confirm the entire transaction fails with neither row changed.", "Open Transaction & merge history and confirm the successful batch shows the correct operation, row count, reason, actor and timestamp; export the audit CSV.", "Restore the test values through another audited transaction."]'::jsonb,'Valid batches update every selected row together, invalid batches change none, before/after evidence exists for every row, and the committed batch appears correctly in audit history/CSV.','/admin-inventory-manager.html','inventory_bulk_rpc_238',239,true),
('media-derivatives',25,'Media and performance','planned','Generate responsive product/gallery image derivatives','Seven original images can create slow mobile pages and layout instability without standardized dimensions and modern formats.','["R2 derivative worker", "Media Health", "Product/gallery rendering"]'::jsonb,'["Define canonical source-image rules and maximum upload size.", "Generate thumbnail, card, medium and large dimensions.", "Create WebP/AVIF with JPEG/PNG fallback where supported.", "Store width, height, format and byte size metadata.", "Render srcset/sizes and fixed aspect-ratio boxes.", "Keep the original source private or archival according to policy.", "Monitor failed derivative jobs and provide retry."]'::jsonb,'Public product/gallery pages load appropriately sized images with stable layout and fallback formats.','/admin-media-health.html',null,239,true),
('markdown-retirement',26,'Documentation','planned','Retire redundant Markdown only after release guards are modernized','The project has many historical documents. Deleting them now can break release checks or erase evidence, but treating all of them as current creates confusion.','["AI_PROJECT_HANDOFF.md", "MASTER_VALUE_ROADMAP.md", "DOC_INDEX.md", "scripts/release_check.py", "docs/archive"]'::jsonb,'["Treat AI_PROJECT_HANDOFF.md and MASTER_VALUE_ROADMAP.md as the only living direction documents.", "Mark operational/reference documents clearly.", "Map which release checks read historical text markers.", "Replace brittle text-marker guards with current file/route/API tests.", "Move superseded documents into docs/archive rather than deleting them.", "Update DOC_INDEX.md with canonical, operational and archive sections.", "Run the complete release suite after each archive batch."]'::jsonb,'A new developer can find current direction in two files and historical evidence remains available without controlling the roadmap.','/admin-docs.html',null,239,true),
('notification-health',27,'Production communications','blocker','Verify notification provider and delivery-queue health','A configured email webhook is not enough. Queued or failed customer and staff messages can cause missed bookings, payment confusion, and consent failures.','["/admin-startup-guide.html#production", "Cloudflare → Workers & Pages → Settings → Variables", "Notification provider dashboard"]'::jsonb,'["Open the Startup Command Center Production section and refresh the report.", "Confirm the email provider is configured before using Send test.", "Use Check config only first, then send exactly one message to a Rosie-controlled external inbox.", "Confirm the message arrives on desktop and mobile and inspect spam/junk.", "Review failed and queued notification counts; repair the provider or retry path before launch.", "Record the receive time and safe provider result in evidence without storing addresses, secrets, or message content."]'::jsonb,'The provider test succeeds, the controlled inbox receives the message, and failed/queued notification counts are zero or have a documented accepted reason.','/admin-startup-guide.html#production','notification_health',239,true),
('payment-link-operations',28,'Payments','blocker','Verify hosted final-balance links, webhook evidence, and reconciliation','Customers need a dependable way to pay the remaining balance. A checkout URL alone is not proof that payment status, webhook processing, receipt, refund, and accounting records agree.','["/admin-startup-guide.html#production", "Stripe Dashboard → Developers → Webhooks", "/admin-accounting.html"]'::jsonb,'["Create a small internal final-balance request.", "From the Production section, create a hosted checkout link and confirm the amount, currency, branding, and customer reference.", "Complete the test in Stripe test mode first, then perform the separately approved small live-payment test.", "Confirm webhook receipt, payment-request status, receipt, ledger/journal evidence, and customer/admin history agree.", "Issue the planned test refund and confirm the refund appears in Stripe and the application records.", "Record only safe IDs, timestamps, and outcomes in Startup evidence."]'::jsonb,'A hosted link works, payment and refund webhooks are recorded, receipt and accounting evidence agree, and the manual fallback remains available.','/admin-startup-guide.html#production','payment_links',239,true),
('upload-recovery',29,'Field reliability','high','Prove mobile photo/video upload interruption and recovery','Detailing proof and customer updates are captured in the field, where connections can be weak. Silent loss or duplicate media would damage trust and job records.','["/admin-startup-guide.html#tests", "/detailer-jobs.html", "/admin-startup-guide.html#production"]'::jsonb,'["Use a test booking and non-sensitive photo/video on a real phone.", "Upload a small photo and confirm visible progress and completion.", "Begin a short video upload, switch networks or briefly interrupt connectivity, and confirm a useful retry/cancel state appears.", "Restore connectivity and retry once.", "Confirm the final media exists once, has the correct visibility, and any failed session appears in Production readiness for review.", "Record device, browser, connection type, approximate file size, and outcome."]'::jsonb,'Photo and video uploads show progress, interruption produces a recoverable state, retry does not duplicate media, and failed sessions are visible to staff.','/admin-startup-guide.html#tests','upload_recovery',239,true),
('retention-review',30,'Privacy and storage','high','Complete media retention, legal-hold, and cleanup review','Unlimited storage increases cost and privacy exposure, while aggressive deletion could remove proof needed for disputes, taxes, or consent records.','["/admin-startup-guide.html#production", "/admin-media.html", "Supabase/R2 storage dashboards"]'::jsonb,'["Open the Production section and run retention in dry-run mode only.", "Review every candidate by booking, media type, stage, consent, incident/legal-hold status, and retention policy.", "Confirm permanent proof and legal-hold items are excluded.", "Correct any missing policy or expiry date before marking records for review.", "Approve deletion only through the documented storage-cleanup process; do not manually delete referenced objects.", "Record candidate counts, exclusions, reviewer, and date."]'::jsonb,'Dry-run candidates are explainable, protected evidence is excluded, referenced objects are not orphaned, and an approved cleanup/restore procedure is documented.','/admin-startup-guide.html#production','retention_review',239,true),
('incident-closeout',31,'Customer protection','blocker','Verify incident closeout, privacy, and review-request safety','An unresolved issue or private incident note must never be exposed to a customer or followed immediately by an automated review request.','["/admin-startup-guide.html#tests", "/admin-incident-reports.html", "/admin-workflow.html", "Customer progress link in a private browser"]'::jsonb,'["Create a harmless internal test incident on a test booking.", "Confirm staff-only notes and evidence remain hidden from the signed-out customer progress view.", "Publish only specifically approved customer-safe wording.", "Confirm booking closeout or review-request automation is blocked while the incident is unresolved.", "Resolve the test incident with an auditable decision and verify the review workflow follows the documented policy.", "Remove or archive test data according to the test-data policy."]'::jsonb,'Private material never appears to the customer, unresolved incidents block unsafe closeout/review automation, and resolution creates complete audit evidence.','/admin-startup-guide.html#tests','incident_closeout',239,true),
('rollback-drill',32,'Deployment and recovery','blocker','Complete a deployment rollback and incident-response drill','Backups protect data, but a bad frontend/function deployment also needs a fast, rehearsed rollback path with owners and verification steps.','["Cloudflare Pages → Deployments", "/admin-startup-guide.html#production", "STARTUP_GO_LIVE_BLOCKERS.md", "docs/PRODUCTION_TEST_GUIDE.md"]'::jsonb,'["Choose a safe preview deployment and identify the previous known-good deployment.", "Document who can trigger rollback and where the control is located.", "Roll preview back or promote a known-good preview in a controlled rehearsal.", "Verify home, booking, login, Block Calendar, Startup Command Center, payment endpoint health, and database connectivity after rollback.", "Restore the latest build and repeat the smoke check.", "Record timestamps, owner, deployment IDs, observed downtime, and any missing permissions."]'::jsonb,'A named owner can restore a known-good deployment, critical smoke tests pass after rollback, and the written incident path is usable without guessing.','/admin-startup-guide.html#production','rollback_drill',239,true),
('local-proof-cadence',33,'Local SEO and trust','high','Establish an approved local-photo, review, and Business Profile cadence','Local visibility depends on accurate relevance signals and real prominence. Fresh approved work, complete profile information, and legitimate reviews are more valuable than duplicated keyword pages.','["/admin-startup-guide.html#blockers", "Google Business Profile → Photos, Services, Reviews, Performance", "/gallery.html", "/admin-gallery.html", "Search Console"]'::jsonb,'["Confirm the Business Profile name, primary category, service areas, phone, hours, website, and services match the live site and real-world operation.", "Replace the highest-value public placeholders with Rosie-owned, consent-approved before/after work.", "Add descriptive alt text and connect proof to the relevant service/town page without duplicating thin pages.", "Create a repeatable post-job review request that follows Google policy and pauses for unresolved incidents.", "Schedule a weekly profile/photo/review-response check and a monthly Search Console/local landing-page review.", "Record the first completed cycle and the next review date."]'::jsonb,'The profile and website agree, priority pages show authentic approved proof, review requests are policy-safe, and a repeatable local visibility cadence has an owner.','/admin-startup-guide.html#blockers','local_proof_cadence',239,true),
('startup-single-interface',34,'Documentation and operations','high','Retire duplicate preflight navigation and train staff on one Startup Command Center','Even correct checks become unreliable when staff must guess between Startup Guide, Launch Readiness, Production, Guided Tests, and Roadmap pages.','["/admin-startup-guide.html", "Admin Menu", "AI_PROJECT_HANDOFF.md", "STARTUP_GO_LIVE_BLOCKERS.md"]'::jsonb,'["Confirm the Admin Menu has one Startup Command Center entry.", "Confirm old readiness URLs forward to the appropriate Startup section and remain available only for compatibility.", "Update internal instructions, bookmarks, and screenshots to use /admin-startup-guide.html.", "Train each staff role on Overview, Blockers, Evidence, Production, Tests, and Roadmap tabs.", "Confirm permissions allow required staff to view or update only the sections they are authorized to use.", "After one complete test cycle, remove duplicate wording from living documentation while retaining historical release evidence."]'::jsonb,'Staff use one interface for launch work, legacy links forward safely, permissions are correct, and no current document instructs staff to maintain a separate preflight checklist.','/admin-startup-guide.html','startup_single_interface',239,true)
on conflict(process_key) do update set sort_order=excluded.sort_order,category=excluded.category,severity=excluded.severity,title=excluded.title,why_text=excluded.why_text,locations=excluded.locations,instructions=excluded.instructions,done_when=excluded.done_when,action_route=excluded.action_route,evidence_key=excluded.evidence_key,source_build=excluded.source_build,is_active=true,updated_at=now();
insert into public.app_launch_readiness_evidence(evidence_key,title,detail,severity,status,sort_order) values
('deploy_239','Build 239 unified Startup deployment','Deploy Build 239 and verify the single Startup Command Center plus compatibility redirects.','block','pending',1),
('migration_238','Build 238 inventory migration','Apply and verify transactional bulk update, duplicate merge, and inventory audit schema.','block','pending',8),
('migration_239','Build 239 Startup migration','Apply the shared startup process catalog and Build 239 current roadmap cycle.','block','pending',9),
('notification_health','Notification provider and queue health','Verify a controlled external delivery and resolve failed or stuck notification events.','block','pending',32),
('payment_links','Hosted final-balance payment links','Verify checkout, webhook, receipt, refund, and reconciliation evidence agree.','block','pending',33),
('upload_recovery','Mobile upload recovery','Prove interrupted photo/video uploads can recover without silent loss or duplication.','warn','pending',34),
('retention_review','Media retention review','Complete a dry-run retention review with legal-hold and permanent-proof exclusions.','warn','pending',35),
('incident_closeout','Incident closeout and review safety','Verify unresolved incidents protect privacy and block unsafe review requests.','block','pending',36),
('rollback_drill','Deployment rollback drill','Rehearse a known-good Cloudflare rollback and critical-route smoke check.','block','pending',37),
('local_proof_cadence','Local proof and review cadence','Establish a recurring approved-photo, Business Profile, review-response, and Search Console routine.','warn','pending',38),
('startup_single_interface','Single Startup Command Center','Confirm staff use one interface and legacy readiness routes only forward to it.','warn','pending',39)
on conflict(evidence_key) do update set title=excluded.title,detail=excluded.detail,severity=excluded.severity,sort_order=excluded.sort_order,updated_at=now();
update public.app_roadmap_execution_items set is_current_cycle=false where cycle_key<>'build239';
insert into public.app_roadmap_execution_items(item_key,title,workstream,priority,status,target_build,sort_order,source_document,cycle_key,is_current_cycle,action_path) values
('b239_01','Deploy Build 239 and verify the unified Startup Command Center','reliability','critical','in_progress',239,1,'STARTUP_GO_LIVE_BLOCKERS.md','build239',true,'Deploy preview, hard-refresh /admin-startup-guide, verify every section, then confirm legacy readiness URLs forward to the correct anchor.'),
('b239_02','Apply the Build 239 startup catalog and roadmap migration in staging','reliability','critical','planned',239,2,'STARTUP_GO_LIVE_BLOCKERS.md','build239',true,'Run sql/2026-08-01_build239_unified_startup_command_center.sql, refresh schema cache, and confirm the shared database catalog source badge.'),
('b239_03','Complete Build 237 and Build 238 migration verification if outstanding','reliability','critical','planned',239,3,'STARTUP_GO_LIVE_BLOCKERS.md','build239',true,'Verify evidence, roadmap, inventory transaction, merge, and audit tables/RPCs exist before production.'),
('b239_04','Retest Block Calendar full-day, AM, and PM behaviour','booking','critical','planned',239,4,'STARTUP_GO_LIVE_BLOCKERS.md','build239',true,'Create/remove each block type and confirm public booking availability matches after refresh.'),
('b239_05','Complete end-to-end booking and admin reconciliation','booking','critical','planned',239,5,'STARTUP_GO_LIVE_BLOCKERS.md','build239',true,'Run a phone-sized test booking and reconcile customer, booking, calendar, deposit, and staff records.'),
('b239_06','Verify Stripe checkout, webhook, refund, and accounting evidence','payments','critical','planned',239,6,'STARTUP_GO_LIVE_BLOCKERS.md','build239',true,'Complete test-mode and approved small live transactions, then reconcile webhook, receipt, refund, and journal evidence.'),
('b239_07','Verify notification provider and clear failed/queued events','reliability','critical','planned',239,7,'STARTUP_GO_LIVE_BLOCKERS.md','build239',true,'Run config-only then one controlled external delivery; resolve failed or stuck events before launch.'),
('b239_08','Audit Cloudflare variables, bindings, domains, and rollback access','reliability','critical','planned',239,8,'STARTUP_GO_LIVE_BLOCKERS.md','build239',true,'Compare preview/production variables, verify R2/Supabase/Stripe bindings, and identify the rollback owner and known-good deployment.'),
('b239_09','Perform Supabase restore and Cloudflare rollback rehearsals','reliability','critical','planned',239,9,'STARTUP_GO_LIVE_BLOCKERS.md','build239',true,'Restore safe staging data, rehearse deployment rollback, and run critical smoke checks after each recovery action.'),
('b239_10','Publish and link legal, refund, cancellation, cookie, and media policies','customer','critical','planned',239,10,'STARTUP_GO_LIVE_BLOCKERS.md','build239',true,'Review final wording and confirm booking, checkout, customer portal, and footer links are visible and consistent.'),
('b239_11','Complete real-device mobile and accessibility acceptance testing','reliability','high','planned',239,11,'STARTUP_GO_LIVE_BLOCKERS.md','build239',true,'Test customer/admin critical paths on real devices plus keyboard, focus, labels, contrast, errors, and touch targets.'),
('b239_12','Prove weak-network media upload retry and deduplication','media','high','planned',239,12,'STARTUP_GO_LIVE_BLOCKERS.md','build239',true,'Interrupt a test photo/video upload, retry once, and confirm visible recovery with no duplicate or public exposure.'),
('b239_13','Complete incident privacy and review-request safety test','customer','critical','planned',239,13,'STARTUP_GO_LIVE_BLOCKERS.md','build239',true,'Verify staff-only incident content stays private and unresolved incidents block unsafe closeout/review requests.'),
('b239_14','Complete retention dry-run and legal-hold exclusion review','media','high','planned',239,14,'STARTUP_GO_LIVE_BLOCKERS.md','build239',true,'Review candidates, confirm protected evidence exclusions, and document cleanup/restore ownership.'),
('b239_15','Clean inventory names, categories, costs, duplicates, and audit history','operations','high','planned',239,15,'STARTUP_GO_LIVE_BLOCKERS.md','build239',true,'Use suspicious-name, merge-preview, transactional bulk-update, and history tools; preserve referenced records.'),
('b239_16','Complete sellable product gallery, pricing, HST, and publish readiness','operations','high','planned',239,16,'STARTUP_GO_LIVE_BLOCKERS.md','build239',true,'Finish featured plus gallery images, metadata, costs, price/tax totals, stock, policies, and public display checks.'),
('b239_17','Submit sitemap and validate canonicals, structured data, and index coverage','seo','high','planned',239,17,'STARTUP_GO_LIVE_BLOCKERS.md','build239',true,'Use Search Console and Rich Results testing; correct inconsistent canonicals, noindex, schema, or sitemap entries.'),
('b239_18','Align Google Business Profile and establish local proof cadence','seo','high','planned',239,18,'STARTUP_GO_LIVE_BLOCKERS.md','build239',true,'Verify profile facts, add approved local proof, respond to reviews, and schedule weekly/monthly checks.'),
('b239_19','Run invite-only soft launch with daily command-centre review','operations','critical','planned',239,19,'STARTUP_GO_LIVE_BLOCKERS.md','build239',true,'Accept a small known-customer cohort and inspect every booking, payment, notification, upload, incident, inventory, and log event.'),
('b239_20','Modernize release guards and retire duplicate readiness/Markdown navigation','documentation','medium','planned',239,20,'STARTUP_GO_LIVE_BLOCKERS.md','build239',true,'Replace stale text-marker dependencies, archive superseded docs safely, and keep the Startup Command Center plus three authority documents current.')
on conflict(item_key) do update set title=excluded.title,workstream=excluded.workstream,priority=excluded.priority,status=case when public.app_roadmap_execution_items.status='done' then 'done' else excluded.status end,target_build=excluded.target_build,sort_order=excluded.sort_order,source_document=excluded.source_document,cycle_key=excluded.cycle_key,is_current_cycle=true,action_path=excluded.action_path,updated_at=now();
create index if not exists app_startup_process_active_order_idx on public.app_startup_process_items(is_active,sort_order);
create index if not exists app_startup_process_category_idx on public.app_startup_process_items(category,severity,sort_order);
create index if not exists app_startup_process_audit_idx on public.app_startup_process_audit(process_key,created_at desc);
alter table public.app_startup_process_items enable row level security;
alter table public.app_startup_process_audit enable row level security;
revoke all privileges on table public.app_startup_process_items,public.app_startup_process_audit from public,anon,authenticated;
grant all privileges on table public.app_startup_process_items,public.app_startup_process_audit to service_role;
comment on table public.app_startup_process_items is 'Build 239 canonical detailed Startup Command Center process catalog. Database is primary; packaged JSON is read-only outage/migration fallback.';
comment on table public.app_startup_process_audit is 'Build 239 audit history for controlled startup-process catalog changes. Do not store secrets or private customer content.';
commit;

-- END BUILD 239 UNIFIED STARTUP COMMAND CENTER

-- BEGIN BUILD 240 TRANSACTIONAL INVENTORY POSTING AND REVERSAL
-- Rosie Dazzlers Build 240
-- Transactional booking/project inventory posting, reviewed reversal, and reservation availability.
-- Apply after Build 239. Test in staging before production.
begin;

-- Inventory reservations support thousandths; widen live quantity and movement evidence to the same safe precision.
alter table public.catalog_inventory_items
  alter column qty_on_hand type numeric(14,3) using round(qty_on_hand::numeric,3),
  alter column reorder_point type numeric(14,3) using round(reorder_point::numeric,3),
  alter column reorder_qty type numeric(14,3) using round(reorder_qty::numeric,3);
alter table public.catalog_inventory_movements
  alter column qty_delta type numeric(14,3) using round(qty_delta::numeric,3),
  alter column previous_qty type numeric(14,3) using round(previous_qty::numeric,3),
  alter column new_qty type numeric(14,3) using round(new_qty::numeric,3);

alter table public.catalog_inventory_movements
  drop constraint if exists catalog_inventory_movements_movement_type_check;
alter table public.catalog_inventory_movements
  add constraint catalog_inventory_movements_movement_type_check
  check (movement_type in ('adjustment','job_use','project_use','receive','recount','waste','return'));

alter table public.catalog_inventory_movements
  add column if not exists source_kind text null
    check (source_kind is null or source_kind in ('booking','creative_project','manual','merge','bulk')),
  add column if not exists source_reference_id uuid null,
  add column if not exists posting_batch_id uuid null,
  add column if not exists reversal_of_movement_id uuid null references public.catalog_inventory_movements(id) on delete set null,
  add column if not exists is_reversed boolean not null default false,
  add column if not exists reversed_at timestamptz null,
  add column if not exists reversed_by_staff_email text null,
  add column if not exists reversal_reason text null;

create table if not exists public.catalog_inventory_posting_batches (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  source_kind text not null check (source_kind in ('booking','creative_project')),
  source_reference_id uuid not null,
  booking_id uuid null references public.bookings(id) on delete set null,
  project_id uuid null references public.creative_projects(id) on delete set null,
  status text not null default 'posted' check (status in ('posted','reversed','failed')),
  idempotency_key text not null unique check (char_length(idempotency_key) between 8 and 180),
  reason text not null check (char_length(reason) between 8 and 1200),
  actor_staff_email text null,
  row_count integer not null default 0 check (row_count >= 0),
  total_quantity numeric(14,3) not null default 0 check (total_quantity >= 0),
  accounting_status text not null default 'pending'
    check (accounting_status in ('pending','posted','partial','failed','not_required','reversal_review')),
  accounting_note text null,
  reversed_at timestamptz null,
  reversed_by_staff_email text null,
  reversal_reason text null
);

create table if not exists public.catalog_inventory_posting_rows (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  batch_id uuid not null references public.catalog_inventory_posting_batches(id) on delete cascade,
  inventory_item_id uuid null references public.catalog_inventory_items(id) on delete set null,
  item_key text not null,
  item_name text not null,
  reservation_id uuid null references public.creative_project_inventory_reservations(id) on delete set null,
  quantity numeric(14,3) not null check (quantity > 0),
  unit_label text null,
  unit_cost_cents integer null,
  previous_qty numeric(14,3) not null,
  new_qty numeric(14,3) not null,
  movement_id uuid null references public.catalog_inventory_movements(id) on delete set null,
  reversal_movement_id uuid null references public.catalog_inventory_movements(id) on delete set null,
  status text not null default 'posted' check (status in ('posted','reversed')),
  unique(batch_id,item_key)
);

alter table public.catalog_inventory_movements
  drop constraint if exists catalog_inventory_movements_posting_batch_id_fkey;
alter table public.catalog_inventory_movements
  add constraint catalog_inventory_movements_posting_batch_id_fkey
  foreign key (posting_batch_id) references public.catalog_inventory_posting_batches(id) on delete set null;

alter table public.creative_project_inventory_reservations
  drop constraint if exists creative_project_inventory_reservations_inventory_mutated_check;
alter table public.creative_project_inventory_reservations
  add column if not exists posting_batch_id uuid null references public.catalog_inventory_posting_batches(id) on delete set null,
  add column if not exists reversed_at timestamptz null,
  add column if not exists reversed_by_staff_email text null,
  add column if not exists reversal_reason text null;

create index if not exists catalog_inventory_posting_batches_source_idx
  on public.catalog_inventory_posting_batches(source_kind,source_reference_id,created_at desc);
create index if not exists catalog_inventory_posting_batches_status_idx
  on public.catalog_inventory_posting_batches(status,created_at desc);
create index if not exists catalog_inventory_posting_rows_batch_idx
  on public.catalog_inventory_posting_rows(batch_id,created_at);
create index if not exists catalog_inventory_posting_rows_item_idx
  on public.catalog_inventory_posting_rows(item_key,created_at desc);
create index if not exists catalog_inventory_movements_posting_batch_idx
  on public.catalog_inventory_movements(posting_batch_id,created_at desc);
create index if not exists catalog_inventory_movements_reversal_idx
  on public.catalog_inventory_movements(reversal_of_movement_id);

alter table public.catalog_inventory_posting_batches enable row level security;
alter table public.catalog_inventory_posting_rows enable row level security;
revoke all privileges on table public.catalog_inventory_posting_batches,public.catalog_inventory_posting_rows from public,anon,authenticated;
grant all privileges on table public.catalog_inventory_posting_batches,public.catalog_inventory_posting_rows to service_role;

create or replace function public.admin_catalog_inventory_post(
  p_source_kind text,
  p_source_reference_id uuid,
  p_lines jsonb,
  p_actor_email text,
  p_reason text,
  p_idempotency_key text,
  p_dry_run boolean default true
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_line jsonb;
  v_item public.catalog_inventory_items%rowtype;
  v_item_key text;
  v_qty numeric(14,3);
  v_reservation_id uuid;
  v_reservation public.creative_project_inventory_reservations%rowtype;
  v_batch public.catalog_inventory_posting_batches%rowtype;
  v_batch_id uuid;
  v_movement_id uuid;
  v_previous numeric(14,3);
  v_new numeric(14,3);
  v_total numeric(14,3) := 0;
  v_count integer := 0;
  v_preview jsonb := '[]'::jsonb;
  v_existing jsonb;
  v_duplicate_count integer;
begin
  if p_source_kind not in ('booking','creative_project') then
    raise exception 'source_kind must be booking or creative_project.' using errcode='22023';
  end if;
  if p_source_reference_id is null then
    raise exception 'A booking or project reference is required.' using errcode='22023';
  end if;
  if char_length(trim(coalesce(p_reason,''))) < 8 then
    raise exception 'Enter a posting reason with at least 8 characters.' using errcode='22023';
  end if;
  if char_length(trim(coalesce(p_idempotency_key,''))) < 8 then
    raise exception 'A stable idempotency key is required.' using errcode='22023';
  end if;
  if jsonb_typeof(p_lines) <> 'array' or jsonb_array_length(p_lines) < 1 then
    raise exception 'At least one inventory line is required.' using errcode='22023';
  end if;
  if jsonb_array_length(p_lines) > 100 then
    raise exception 'A maximum of 100 inventory lines can be posted at once.' using errcode='22023';
  end if;

  if p_source_kind='booking' then
    perform 1 from public.bookings where id=p_source_reference_id;
    if not found then raise exception 'Booking was not found.' using errcode='P0002'; end if;
  else
    perform 1 from public.creative_projects where id=p_source_reference_id;
    if not found then raise exception 'Creative project was not found.' using errcode='P0002'; end if;
  end if;

  if not p_dry_run then
    select to_jsonb(b) into v_existing
    from public.catalog_inventory_posting_batches b
    where b.idempotency_key=trim(p_idempotency_key);
    if v_existing is not null then
      return jsonb_build_object('ok',true,'dry_run',false,'idempotent_replay',true,'batch',v_existing);
    end if;
  end if;

  select count(*) into v_duplicate_count
  from (
    select trim(value->>'item_key') item_key
    from jsonb_array_elements(p_lines)
    group by trim(value->>'item_key')
    having count(*) > 1
  ) duplicates;
  if v_duplicate_count > 0 then
    raise exception 'Combine duplicate item keys into one line before posting.' using errcode='22023';
  end if;

  for v_line in select value from jsonb_array_elements(p_lines)
  loop
    v_item_key := trim(coalesce(v_line->>'item_key',''));
    v_qty := round(coalesce(nullif(v_line->>'quantity','')::numeric,0),3);
    v_reservation_id := nullif(trim(coalesce(v_line->>'reservation_id','')),'')::uuid;
    if v_item_key='' or v_qty<=0 then
      raise exception 'Every posting line requires an item key and quantity greater than zero.' using errcode='22023';
    end if;

    select * into v_item from public.catalog_inventory_items where item_key=v_item_key for update;
    if not found then raise exception 'Inventory item % was not found.',v_item_key using errcode='P0002'; end if;
    if not v_item.is_active then raise exception 'Inventory item % is archived.',v_item_key using errcode='22023'; end if;
    if coalesce(v_item.qty_on_hand,0) < v_qty then
      raise exception 'Insufficient stock for %: requested %, available %.',v_item_key,v_qty,coalesce(v_item.qty_on_hand,0) using errcode='22023';
    end if;

    if p_source_kind='creative_project' then
      if v_reservation_id is null then
        raise exception 'Creative project lines require a reviewed reservation ID.' using errcode='22023';
      end if;
      select * into v_reservation
      from public.creative_project_inventory_reservations
      where id=v_reservation_id and project_id=p_source_reference_id and inventory_item_id=v_item.id
      for update;
      if not found then raise exception 'Reservation does not match the selected project and inventory item.' using errcode='22023'; end if;
      if v_reservation.status not in ('reserved','reviewed') or v_reservation.inventory_mutated then
        raise exception 'Reservation % is not ready for posting.',v_reservation_id using errcode='22023';
      end if;
      if v_qty <> round(v_reservation.quantity,3) then
        raise exception 'Posted quantity must equal the reviewed reservation quantity; edit and review the reservation first.' using errcode='22023';
      end if;
    end if;

    v_previous := round(coalesce(v_item.qty_on_hand,0),3);
    v_new := round(v_previous-v_qty,3);
    v_total := v_total+v_qty;
    v_count := v_count+1;
    v_preview := v_preview || jsonb_build_array(jsonb_build_object(
      'item_key',v_item.item_key,'item_name',v_item.name,'quantity',v_qty,
      'previous_qty',v_previous,'new_qty',v_new,'unit_label',v_item.unit_label,
      'unit_cost_cents',v_item.cost_cents,'reservation_id',v_reservation_id,
      'available',true
    ));
  end loop;

  if p_dry_run then
    return jsonb_build_object(
      'ok',true,'dry_run',true,'source_kind',p_source_kind,
      'source_reference_id',p_source_reference_id,'row_count',v_count,
      'total_quantity',round(v_total,3),'lines',v_preview
    );
  end if;

  insert into public.catalog_inventory_posting_batches(
    source_kind,source_reference_id,booking_id,project_id,status,idempotency_key,
    reason,actor_staff_email,row_count,total_quantity,accounting_status
  ) values(
    p_source_kind,p_source_reference_id,
    case when p_source_kind='booking' then p_source_reference_id else null end,
    case when p_source_kind='creative_project' then p_source_reference_id else null end,
    'posted',trim(p_idempotency_key),trim(p_reason),nullif(trim(coalesce(p_actor_email,'')),''),
    v_count,round(v_total,3),case when p_source_kind='booking' then 'pending' else 'not_required' end
  ) returning * into v_batch;
  v_batch_id := v_batch.id;

  for v_line in select value from jsonb_array_elements(p_lines)
  loop
    v_item_key := trim(v_line->>'item_key');
    v_qty := round((v_line->>'quantity')::numeric,3);
    v_reservation_id := nullif(trim(coalesce(v_line->>'reservation_id','')),'')::uuid;
    select * into v_item from public.catalog_inventory_items where item_key=v_item_key for update;
    v_previous := round(coalesce(v_item.qty_on_hand,0),3);
    v_new := round(v_previous-v_qty,3);

    update public.catalog_inventory_items
      set qty_on_hand=v_new,updated_at=now()
      where id=v_item.id;

    insert into public.catalog_inventory_movements(
      item_id,item_key,booking_id,movement_type,qty_delta,previous_qty,new_qty,
      unit_label,note,actor_name,source_kind,source_reference_id,posting_batch_id
    ) values(
      v_item.id,v_item.item_key,
      case when p_source_kind='booking' then p_source_reference_id else null end,
      case when p_source_kind='booking' then 'job_use' else 'project_use' end,
      -v_qty,v_previous,v_new,v_item.unit_label,trim(p_reason),
      nullif(trim(coalesce(p_actor_email,'')),''),p_source_kind,p_source_reference_id,v_batch_id
    ) returning id into v_movement_id;

    insert into public.catalog_inventory_posting_rows(
      batch_id,inventory_item_id,item_key,item_name,reservation_id,quantity,unit_label,
      unit_cost_cents,previous_qty,new_qty,movement_id,status
    ) values(
      v_batch_id,v_item.id,v_item.item_key,v_item.name,v_reservation_id,v_qty,v_item.unit_label,
      v_item.cost_cents,v_previous,v_new,v_movement_id,'posted'
    );

    if p_source_kind='creative_project' and v_reservation_id is not null then
      update public.creative_project_inventory_reservations
        set status='posted',inventory_mutated=true,posted_by_staff_email=nullif(trim(coalesce(p_actor_email,'')),''),
            posted_at=now(),posting_batch_id=v_batch_id,updated_at=now(),
            reversed_at=null,reversed_by_staff_email=null,reversal_reason=null
        where id=v_reservation_id;
    end if;
  end loop;

  return jsonb_build_object(
    'ok',true,'dry_run',false,'idempotent_replay',false,
    'batch',to_jsonb(v_batch),'lines',v_preview
  );
end;
$$;

create or replace function public.admin_catalog_inventory_post_reverse(
  p_batch_id uuid,
  p_actor_email text,
  p_reason text,
  p_dry_run boolean default true
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_batch public.catalog_inventory_posting_batches%rowtype;
  v_row public.catalog_inventory_posting_rows%rowtype;
  v_item public.catalog_inventory_items%rowtype;
  v_previous numeric(14,3);
  v_new numeric(14,3);
  v_reversal_id uuid;
  v_preview jsonb := '[]'::jsonb;
begin
  if p_batch_id is null then raise exception 'A posting batch is required.' using errcode='22023'; end if;
  if char_length(trim(coalesce(p_reason,''))) < 8 then
    raise exception 'Enter a reversal reason with at least 8 characters.' using errcode='22023';
  end if;
  select * into v_batch from public.catalog_inventory_posting_batches where id=p_batch_id for update;
  if not found then raise exception 'Posting batch was not found.' using errcode='P0002'; end if;
  if v_batch.status='reversed' then
    return jsonb_build_object('ok',true,'dry_run',p_dry_run,'already_reversed',true,'batch',to_jsonb(v_batch));
  end if;
  if v_batch.status<>'posted' then raise exception 'Only posted batches can be reversed.' using errcode='22023'; end if;

  for v_row in select * from public.catalog_inventory_posting_rows where batch_id=p_batch_id order by created_at,id for update
  loop
    select * into v_item from public.catalog_inventory_items where id=v_row.inventory_item_id for update;
    if not found then raise exception 'Inventory item % is unavailable for reversal.',v_row.item_key using errcode='P0002'; end if;
    v_previous := round(coalesce(v_item.qty_on_hand,0),3);
    v_new := round(v_previous+v_row.quantity,3);
    v_preview := v_preview || jsonb_build_array(jsonb_build_object(
      'item_key',v_row.item_key,'item_name',v_row.item_name,'quantity',v_row.quantity,
      'previous_qty',v_previous,'new_qty',v_new,'unit_label',v_row.unit_label
    ));
  end loop;

  if p_dry_run then
    return jsonb_build_object('ok',true,'dry_run',true,'batch',to_jsonb(v_batch),'lines',v_preview);
  end if;

  for v_row in select * from public.catalog_inventory_posting_rows where batch_id=p_batch_id order by created_at,id for update
  loop
    select * into v_item from public.catalog_inventory_items where id=v_row.inventory_item_id for update;
    v_previous := round(coalesce(v_item.qty_on_hand,0),3);
    v_new := round(v_previous+v_row.quantity,3);
    update public.catalog_inventory_items set qty_on_hand=v_new,updated_at=now() where id=v_item.id;

    insert into public.catalog_inventory_movements(
      item_id,item_key,booking_id,movement_type,qty_delta,previous_qty,new_qty,unit_label,
      note,actor_name,source_kind,source_reference_id,posting_batch_id,reversal_of_movement_id
    ) values(
      v_item.id,v_item.item_key,v_batch.booking_id,'return',v_row.quantity,v_previous,v_new,
      v_row.unit_label,'Reversal: '||trim(p_reason),nullif(trim(coalesce(p_actor_email,'')),''),
      v_batch.source_kind,v_batch.source_reference_id,v_batch.id,v_row.movement_id
    ) returning id into v_reversal_id;

    update public.catalog_inventory_movements
      set is_reversed=true,reversed_at=now(),reversed_by_staff_email=nullif(trim(coalesce(p_actor_email,'')),''),
          reversal_reason=trim(p_reason),updated_at=now()
      where id=v_row.movement_id;
    update public.catalog_inventory_posting_rows
      set status='reversed',reversal_movement_id=v_reversal_id,updated_at=now()
      where id=v_row.id;

    if v_row.reservation_id is not null then
      update public.creative_project_inventory_reservations
        set status='reviewed',inventory_mutated=false,posting_batch_id=null,
            reversed_at=now(),reversed_by_staff_email=nullif(trim(coalesce(p_actor_email,'')),''),
            reversal_reason=trim(p_reason),updated_at=now()
        where id=v_row.reservation_id;
    end if;
  end loop;

  update public.catalog_inventory_posting_batches
    set status='reversed',reversed_at=now(),reversed_by_staff_email=nullif(trim(coalesce(p_actor_email,'')),''),
        reversal_reason=trim(p_reason),accounting_status=case when source_kind='booking' then 'reversal_review' else accounting_status end,
        updated_at=now()
    where id=p_batch_id returning * into v_batch;

  return jsonb_build_object('ok',true,'dry_run',false,'batch',to_jsonb(v_batch),'lines',v_preview);
end;
$$;

revoke all on function public.admin_catalog_inventory_post(text,uuid,jsonb,text,text,text,boolean) from public,anon,authenticated;
grant execute on function public.admin_catalog_inventory_post(text,uuid,jsonb,text,text,text,boolean) to service_role;
revoke all on function public.admin_catalog_inventory_post_reverse(uuid,text,text,boolean) from public,anon,authenticated;
grant execute on function public.admin_catalog_inventory_post_reverse(uuid,text,text,boolean) to service_role;

comment on table public.catalog_inventory_posting_batches is 'Build 240 atomic booking/project stock postings. One batch posts or reverses as one database transaction.';
comment on table public.catalog_inventory_posting_rows is 'Build 240 row evidence for inventory posting and authorized reversal.';
comment on function public.admin_catalog_inventory_post is 'Build 240 preview/commit inventory posting with stock locking, shortage checks, project reservation validation, and idempotency.';
comment on function public.admin_catalog_inventory_post_reverse is 'Build 240 preview/commit compensating inventory reversal. It never deletes movement history.';

-- Build 240 Startup Command Center additions. Existing items are preserved.
insert into public.app_startup_process_items(process_key,sort_order,category,severity,title,why_text,locations,instructions,done_when,action_route,evidence_key,source_build,is_active) values
('migration-240',35,'Inventory and operations','blocker','Apply and verify the Build 240 transactional inventory posting migration','Booking and Creative Project material usage must no longer depend on separate browser writes. Build 240 moves preview, shortage validation, stock mutation, movement evidence, reservation status, idempotency and reversal links into one database transaction.','["Supabase Dashboard → SQL Editor", "sql/2026-08-05_build240_transactional_inventory_posting_reversal.sql", "Supabase Dashboard → Database → Functions", "/admin-inventory-posting.html"]'::jsonb,'["Confirm Builds 235, 237, 238 and 239 migrations have been applied in order.", "Open the complete Build 240 SQL migration from the ZIP.", "Run it in staging/preview first and do not edit individual statements.", "Confirm catalog_inventory_posting_batches and catalog_inventory_posting_rows exist.", "Confirm admin_catalog_inventory_post and admin_catalog_inventory_post_reverse appear under Database Functions.", "Refresh the Supabase schema cache if the admin page reports that the RPC is missing.", "Open /admin-inventory-posting.html and preview one harmless booking posting without committing.", "Load one reviewed Creative Project reservation and confirm shortages or conflicts are explained before posting.", "Record the migration date and staging result in the Startup evidence editor."]'::jsonb,'The two tables and two RPC functions exist, previews load from the shared database, a reviewed project reservation can be validated without changing stock, and the interface no longer reports migration required.','/admin-inventory-posting.html','migration_240',240,true),
('inventory-post-reversal-acceptance',36,'Inventory and accounting','blocker','Complete transactional inventory posting and authorized reversal acceptance testing','The feature is not production-ready until one committed booking posting, one reviewed project posting, one shortage rejection, one idempotent replay and one compensating reversal have been observed with correct quantities and audit evidence. Booking reversals also require accounting review because stock restoration does not automatically erase journal history.','["/admin-inventory-posting.html", "/admin-progress.html", "/admin-creative-projects.html", "/admin-accounting.html", "Supabase Dashboard → Table Editor → catalog_inventory_posting_batches"]'::jsonb,'["Choose a low-risk staging inventory item and record its starting quantity.", "Preview a booking posting and confirm the before/after quantity and total lines are correct.", "Commit once, refresh history, and confirm the quantity decreased exactly once.", "Repeat the same request with the same idempotency key and confirm stock does not decrease again.", "Preview a quantity greater than stock and confirm the whole transaction is rejected with no row changed.", "Create or use a reviewed Creative Project reservation, preview it, commit it, and confirm the reservation becomes posted/inventory_mutated.", "Open Transaction History, choose the test batch, enter a specific reversal reason, and preview the compensating return.", "Commit the reversal and confirm quantity returns, the original movement is marked reversed, a return movement exists, and the project reservation returns to reviewed where applicable.", "For a booking reversal, open Accounting and review or reverse the related COGS journal evidence rather than deleting it.", "Save screenshots or record IDs without customer secrets in Startup evidence."]'::jsonb,'All acceptance cases pass, duplicate submission cannot double-deduct stock, shortages leave every row unchanged, reversals preserve original and compensating history, and booking accounting evidence is reviewed.','/admin-inventory-posting.html','inventory_posting_reversal_acceptance',240,true)
on conflict(process_key) do update set sort_order=excluded.sort_order,category=excluded.category,severity=excluded.severity,title=excluded.title,why_text=excluded.why_text,locations=excluded.locations,instructions=excluded.instructions,done_when=excluded.done_when,action_route=excluded.action_route,evidence_key=excluded.evidence_key,source_build=excluded.source_build,is_active=true,updated_at=now();
insert into public.app_startup_process_audit(process_key,event_type,actor_staff_email,safe_note) values
('migration-240','seeded',null,'Build 240 added transactional inventory migration instructions.'),
('inventory-post-reversal-acceptance','seeded',null,'Build 240 added posting and reversal acceptance instructions.');

-- Build 240 current execution cycle. Older rows remain for history.
update public.app_roadmap_execution_items set is_current_cycle=false where cycle_key<>'build240';
insert into public.app_roadmap_execution_items(item_key,title,workstream,priority,status,target_build,sort_order,source_document,cycle_key,is_current_cycle,action_path) values
('b240_01','Deploy Build 240 and verify the Inventory Posting page','reliability','critical','in_progress',240,10,'MASTER_VALUE_ROADMAP.md','build240',true,'Deploy preview, hard-refresh /admin-inventory-posting, verify CSS/scripts/menu/route copy and confirm no console error.'),
('b240_02','Apply the Build 240 transaction migration in staging','reliability','critical','planned',240,20,'MASTER_VALUE_ROADMAP.md','build240',true,'Run the complete Build 240 migration after prior migrations, refresh schema cache, and confirm tables/RPCs.'),
('b240_03','Complete booking inventory posting acceptance','operations','critical','planned',240,30,'MASTER_VALUE_ROADMAP.md','build240',true,'Preview and commit a small booking usage batch; verify stock, movement, batch, row and job history evidence.'),
('b240_04','Complete Creative Project reservation posting acceptance','operations','critical','planned',240,40,'MASTER_VALUE_ROADMAP.md','build240',true,'Post reviewed project reservations and verify project ownership, shortage checks, status and inventory_mutated evidence.'),
('b240_05','Complete idempotency, shortage and rollback tests','reliability','critical','planned',240,50,'MASTER_VALUE_ROADMAP.md','build240',true,'Replay the same key, submit an over-stock request, and confirm no duplicate or partial mutations.'),
('b240_06','Complete authorized reversal and accounting review','payments','critical','planned',240,60,'MASTER_VALUE_ROADMAP.md','build240',true,'Preview/commit a compensating reversal and reconcile booking COGS journal evidence without deleting history.'),
('b240_07','Retest Block Calendar full-day, AM and PM behaviour','booking','critical','planned',240,70,'MASTER_VALUE_ROADMAP.md','build240',true,'Create/remove each block type and confirm public booking availability matches after refresh.'),
('b240_08','Complete end-to-end booking, payment and notification test','booking','critical','planned',240,80,'MASTER_VALUE_ROADMAP.md','build240',true,'Run phone-sized booking, deposit, webhook, email and admin reconciliation with safe evidence.'),
('b240_09','Complete Cloudflare and Supabase recovery rehearsal','reliability','critical','planned',240,90,'MASTER_VALUE_ROADMAP.md','build240',true,'Audit variables/bindings then perform staging restore and deployment rollback with smoke tests.'),
('b240_10','Complete legal, consent and staff permission review','customer','critical','planned',240,100,'MASTER_VALUE_ROADMAP.md','build240',true,'Publish policies, verify links, roles, session expiry and private media/incident boundaries.'),
('b240_11','Complete real-device mobile and accessibility acceptance','reliability','high','planned',240,110,'MASTER_VALUE_ROADMAP.md','build240',true,'Test customer/admin paths, keyboard, focus, labels, contrast, wrapping, tables and touch targets.'),
('b240_12','Finish resumable media upload and derivative worker','media','high','planned',240,120,'MASTER_VALUE_ROADMAP.md','build240',true,'Implement resumable weak-network upload recovery, deduplication and WebP/AVIF responsive derivatives.'),
('b240_13','Add automatic product publish-readiness gates','operations','high','planned',240,130,'MASTER_VALUE_ROADMAP.md','build240',true,'Block public publishing when required image roles, price, tax, category, stock, SEO or consent are incomplete.'),
('b240_14','Complete inventory name/category/cost/duplicate cleanup','operations','high','planned',240,140,'MASTER_VALUE_ROADMAP.md','build240',true,'Use suspicious-name, transactional bulk update, merge preview and audit history tools.'),
('b240_15','Complete sellable product galleries and pricing review','operations','high','planned',240,150,'MASTER_VALUE_ROADMAP.md','build240',true,'Finish featured plus seven images, alt/captions/roles, costs, HST, margins and public display.'),
('b240_16','Complete payment application and tax workflow','payments','high','planned',240,160,'MASTER_VALUE_ROADMAP.md','build240',true,'Post approved receipts against AR, add HST review, exceptions and traceable journal links.'),
('b240_17','Add month-end close, lock/reopen and accountant export','payments','high','planned',240,170,'MASTER_VALUE_ROADMAP.md','build240',true,'Implement controlled period close, authorized reopen and evidence-complete export packaging.'),
('b240_18','Complete Search Console, schema and GBP alignment','seo','high','planned',240,180,'MASTER_VALUE_ROADMAP.md','build240',true,'Submit sitemap, validate canonicals/schema/indexing and align GBP services, areas, hours, photos and reviews.'),
('b240_19','Replace high-value placeholders with approved local proof','seo','high','planned',240,190,'MASTER_VALUE_ROADMAP.md','build240',true,'Prioritize homepage, town/service pages, booking, galleries and trust blocks using customer-approved Rosie-owned images.'),
('b240_20','Run invite-only soft launch and prioritize observed failures','operations','critical','planned',240,200,'MASTER_VALUE_ROADMAP.md','build240',true,'Accept a small known-customer cohort and review every booking, payment, notification, upload, inventory and incident event daily.')
on conflict(item_key) do update set title=excluded.title,workstream=excluded.workstream,priority=excluded.priority,status=case when public.app_roadmap_execution_items.status='done' then 'done' else excluded.status end,target_build=excluded.target_build,sort_order=excluded.sort_order,source_document=excluded.source_document,cycle_key=excluded.cycle_key,is_current_cycle=true,action_path=excluded.action_path,updated_at=now();

commit;
-- END BUILD 240 TRANSACTIONAL INVENTORY POSTING AND REVERSAL
-- Build 245 (2026-08-06): no DDL. UI/SEO/cache acceptance scanner, service-worker hardening, static landing-page H1/metadata fallbacks, admin noindex corrections, and synchronized documentation only. Build 240 remains the latest functional schema migration.

-- Build 246 — catalog publish-readiness review, audit evidence, and current execution cycle.
-- Apply after Build 238 and Build 239 migrations.

create table if not exists public.catalog_publish_readiness_audit (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  actor_email text null,
  action text not null check (action in ('preview','publish','blocked')),
  reason text not null,
  item_keys jsonb not null default '[]'::jsonb,
  result jsonb not null default '{}'::jsonb,
  blocked_count integer not null default 0,
  published_count integer not null default 0
);
create index if not exists catalog_publish_readiness_audit_created_idx on public.catalog_publish_readiness_audit(created_at desc);

alter table public.catalog_publish_readiness_audit enable row level security;
revoke all on public.catalog_publish_readiness_audit from public, anon, authenticated;
grant all on public.catalog_publish_readiness_audit to service_role;

create or replace function public.admin_catalog_inventory_publish_review(
  p_item_keys text[],
  p_actor_email text,
  p_reason text,
  p_dry_run boolean default true
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_reason text := btrim(coalesce(p_reason,''));
  v_requested integer := coalesce(array_length(p_item_keys,1),0);
  v_found integer := 0;
  v_blocked integer := 0;
  v_published integer := 0;
  v_results jsonb := '[]'::jsonb;
  v_missing jsonb := '[]'::jsonb;
begin
  if v_requested < 1 then raise exception 'Select at least one inventory item.' using errcode='22023'; end if;
  if v_requested > 500 then raise exception 'A maximum of 500 inventory items can be reviewed at once.' using errcode='22023'; end if;
  if length(v_reason) < 8 then raise exception 'Enter a reason with at least 8 characters.' using errcode='22023'; end if;

  select count(*) into v_found from public.catalog_inventory_items where item_key = any(p_item_keys);
  select coalesce(jsonb_agg(x.item_key),'[]'::jsonb) into v_missing
  from (select unnest(p_item_keys) item_key except select item_key from public.catalog_inventory_items where item_key = any(p_item_keys)) x;
  if v_found <> v_requested then
    return jsonb_build_object('ok',false,'dry_run',p_dry_run,'error','One or more inventory rows were not found.','missing_item_keys',v_missing);
  end if;

  perform 1 from public.catalog_inventory_items where item_key = any(p_item_keys) for update;

  with reviewed as (
    select
      i.item_key,
      array_remove(array[
        case when nullif(btrim(i.name),'') is null then 'Name is missing.' end,
        case when btrim(coalesce(i.name,'')) ~* '^(unknown product|untitled|item[[:space:]]*[0-9]*|product[[:space:]]*[0-9]*|amazon item)$' then 'Name is a placeholder.' end,
        case when btrim(coalesce(i.name,'')) ~* '^(B0[A-Z0-9]{8}|[A-Z0-9_-]{8,})$' then 'Name looks like an identifier.' end,
        case when i.item_type not in ('tool','consumable') then 'Item type must be tool or consumable.' end,
        case when nullif(btrim(i.category),'') is null then 'Category is missing.' end,
        case when nullif(btrim(i.unit_label),'') is null then 'Unit label is missing.' end,
        case when nullif(btrim(i.image_url),'') is null then 'Featured image is missing.' end,
        case when btrim(coalesce(i.image_url,'')) ~* '\.svg([?#].*)?$' then 'Featured image is still an SVG placeholder.' end,
        case when i.is_active is false then 'Item is inactive.' end,
        case when i.item_type='consumable' and coalesce(i.qty_on_hand,0) <= 0 then 'Consumable stock must be above zero.' end
      ],null) blockers,
      array_remove(array[
        case when coalesce(i.cost_cents,0) <= 0 then 'Unit cost is missing or zero.' end,
        case when nullif(btrim(i.description),'') is null then 'Description is missing.' end,
        case when nullif(btrim(i.preferred_vendor),'') is null then 'Preferred vendor is missing.' end,
        case when jsonb_array_length(coalesce(i.gallery_image_urls,'[]'::jsonb)) = 0 then 'Gallery has no additional images.' end,
        case when nullif(btrim(i.subcategory),'') is null then 'Subcategory is missing.' end,
        case when coalesce(cardinality(i.service_tags),0)=0 then 'Service tags are missing.' end
      ],null) warnings
    from public.catalog_inventory_items i
    where i.item_key = any(p_item_keys)
  ), shaped as (
    select item_key, blockers, warnings,
      cardinality(blockers)=0 as ready,
      greatest(0,least(100,100-cardinality(blockers)*20-cardinality(warnings)*6)) as score
    from reviewed
  )
  select coalesce(jsonb_agg(jsonb_build_object(
    'item_key',item_key,'ready',ready,'score',score,'blockers',to_jsonb(blockers),'warnings',to_jsonb(warnings)
  ) order by item_key),'[]'::jsonb), count(*) filter(where not ready)
  into v_results,v_blocked
  from shaped;

  if not p_dry_run and v_blocked=0 then
    update public.catalog_inventory_items
      set is_public=true, updated_at=now()
    where item_key=any(p_item_keys);
    get diagnostics v_published = row_count;
  end if;

  insert into public.catalog_publish_readiness_audit(actor_email,action,reason,item_keys,result,blocked_count,published_count)
  values(
    nullif(btrim(coalesce(p_actor_email,'')),''),
    case when p_dry_run then 'preview' when v_blocked>0 then 'blocked' else 'publish' end,
    v_reason,
    to_jsonb(p_item_keys),
    jsonb_build_object('items',v_results,'dry_run',p_dry_run),
    v_blocked,
    v_published
  );

  return jsonb_build_object(
    'ok', v_blocked=0,
    'dry_run', p_dry_run,
    'reviewed_count', v_requested,
    'blocked_count', v_blocked,
    'published_count', v_published,
    'items', v_results,
    'message', case when v_blocked>0 then 'Publishing blocked until every required field is corrected.' when p_dry_run then 'All selected rows passed readiness preview.' else 'Selected rows were published.' end
  );
end;
$$;

revoke all on function public.admin_catalog_inventory_publish_review(text[],text,text,boolean) from public, anon, authenticated;
grant execute on function public.admin_catalog_inventory_publish_review(text[],text,text,boolean) to service_role;
comment on function public.admin_catalog_inventory_publish_review(text[],text,text,boolean) is 'Build 246 previews and performs all-or-nothing inventory public publishing with readiness evidence.';


insert into public.app_startup_process_items(
  process_key,sort_order,category,severity,title,why_text,locations,instructions,done_when,action_route,evidence_key,source_build,is_active
) values(
  'catalog-publish-readiness',37,'Catalog and inventory','blocker',
  'Complete catalog publishing-readiness acceptance',
  'Public inventory rows should never expose placeholder names, missing categories, empty images, inactive records, or zero-stock consumables. Build 246 adds one reviewed publish gate and audit trail.',
  '["/admin-catalog.html", "/admin-inventory-manager.html", "/api/admin/catalog_readiness_report", "Supabase Dashboard → catalog_publish_readiness_audit"]'::jsonb,
  '["Apply the Build 246 migration in staging.", "Open Admin Inventory and filter to Blocked publishing rows.", "Correct one harmless test item until its readiness score has no blockers.", "Select the item and choose Preview public readiness.", "Confirm the preview lists warnings but no blockers.", "Publish the selection and confirm it appears in the public catalog.", "Select an intentionally incomplete test row and confirm publishing is blocked without changing any selected row.", "Review catalog_publish_readiness_audit and record safe IDs in Startup evidence."]'::jsonb,
  'Ready rows publish together, blocked rows remain private, incomplete batch publishing changes nothing, and every preview/publish attempt has audit evidence.',
  '/admin-catalog.html','catalog_publish_readiness',246,true
)
on conflict (process_key) do update set
  sort_order=excluded.sort_order,category=excluded.category,severity=excluded.severity,title=excluded.title,
  why_text=excluded.why_text,locations=excluded.locations,instructions=excluded.instructions,
  done_when=excluded.done_when,action_route=excluded.action_route,evidence_key=excluded.evidence_key,
  source_build=excluded.source_build,is_active=true,updated_at=now();

insert into public.app_launch_readiness_evidence(evidence_key,title,detail,severity,status,sort_order)
values('catalog_publish_readiness','Catalog publishing readiness','Verify preview, publish, blocked-batch, public filtering, and audit evidence.','block','pending',42)
on conflict (evidence_key) do update set title=excluded.title,detail=excluded.detail,severity=excluded.severity,sort_order=excluded.sort_order,updated_at=now();

update public.app_roadmap_execution_items set is_current_cycle=false where coalesce(is_current_cycle,false)=true;
insert into public.app_roadmap_execution_items(
  item_key,title,workstream,priority,status,target_build,sort_order,source_document,cycle_key,is_current_cycle,action_path
) values
('b246_01','Deploy Build 246 and verify catalog readiness assets','reliability','critical','in_progress',246,10,'STARTUP_GO_LIVE_BLOCKERS.md','build246',true,'/admin-startup-guide.html'),
('b246_02','Apply Build 246 catalog readiness migration in staging','reliability','critical','planned',246,20,'STARTUP_GO_LIVE_BLOCKERS.md','build246',true,'/admin-catalog.html'),
('b246_03','Preview and publish one ready catalog row','operations','critical','planned',246,30,'STARTUP_GO_LIVE_BLOCKERS.md','build246',true,'/admin-catalog.html'),
('b246_04','Prove incomplete multi-row publish is all-or-nothing','operations','critical','planned',246,40,'STARTUP_GO_LIVE_BLOCKERS.md','build246',true,'/admin-catalog.html'),
('b246_05','Review public catalog exclusions and readiness audit','operations','high','planned',246,50,'STARTUP_GO_LIVE_BLOCKERS.md','build246',true,'/admin-catalog.html'),
('b246_06','Complete real-device CSS and mobile acceptance','reliability','critical','planned',246,60,'STARTUP_GO_LIVE_BLOCKERS.md','build246',true,'/admin-ui-health.html'),
('b246_07','Retest full-day AM and PM booking blocks','booking','critical','planned',246,70,'STARTUP_GO_LIVE_BLOCKERS.md','build246',true,'/admin-blocks.html'),
('b246_08','Complete booking payment refund and webhook acceptance','payments','critical','planned',246,80,'STARTUP_GO_LIVE_BLOCKERS.md','build246',true,'/admin-startup-guide.html'),
('b246_09','Verify external notification delivery','reliability','critical','planned',246,90,'STARTUP_GO_LIVE_BLOCKERS.md','build246',true,'/admin-startup-guide.html'),
('b246_10','Audit production variables bindings domains and rollback','reliability','critical','planned',246,100,'STARTUP_GO_LIVE_BLOCKERS.md','build246',true,'/admin-startup-guide.html'),
('b246_11','Perform Supabase restore and Cloudflare rollback rehearsals','reliability','critical','planned',246,110,'STARTUP_GO_LIVE_BLOCKERS.md','build246',true,'/admin-startup-guide.html'),
('b246_12','Complete legal consent permission and accessibility review','customer','critical','planned',246,120,'STARTUP_GO_LIVE_BLOCKERS.md','build246',true,'/admin-startup-guide.html'),
('b246_13','Finish suspicious inventory cleanup and duplicate review','operations','high','planned',246,130,'STARTUP_GO_LIVE_BLOCKERS.md','build246',true,'/admin-inventory-manager.html'),
('b246_14','Complete first sellable gallery pricing stock and tax records','operations','high','planned',246,140,'STARTUP_GO_LIVE_BLOCKERS.md','build246',true,'/admin-catalog.html'),
('b246_15','Complete Search Console canonical and structured-data review','seo','high','planned',246,150,'STARTUP_GO_LIVE_BLOCKERS.md','build246',true,'/admin-seo-tasks.html'),
('b246_16','Align Google Business Profile information and photo cadence','seo','high','planned',246,160,'STARTUP_GO_LIVE_BLOCKERS.md','build246',true,'/admin-marketing.html'),
('b246_17','Complete upload interruption and recovery acceptance','media','high','planned',246,170,'STARTUP_GO_LIVE_BLOCKERS.md','build246',true,'/admin-startup-guide.html'),
('b246_18','Complete payment application HST close and accountant review','payments','high','planned',246,180,'STARTUP_GO_LIVE_BLOCKERS.md','build246',true,'/admin-accounting.html'),
('b246_19','Run invite-only soft launch with daily evidence review','operations','critical','planned',246,190,'STARTUP_GO_LIVE_BLOCKERS.md','build246',true,'/admin-startup-guide.html'),
('b246_20','Modernize release guards and retire duplicate Markdown safely','documentation','medium','planned',246,200,'STARTUP_GO_LIVE_BLOCKERS.md','build246',true,'/admin-docs.html')
on conflict (item_key) do update set
  title=excluded.title,workstream=excluded.workstream,priority=excluded.priority,
  status=case when public.app_roadmap_execution_items.status='done' then 'done' else excluded.status end,
  target_build=excluded.target_build,sort_order=excluded.sort_order,source_document=excluded.source_document,
  cycle_key=excluded.cycle_key,is_current_cycle=true,action_path=excluded.action_path,updated_at=now();

-- BEGIN 2026-08-07_build247_daip_private_media_ingestion.sql
-- Canonical Build 247 DAIP private large-media ingestion schema.
-- Build 247 — DAIP private large-media ingestion, multipart upload state, and processing queue metadata.
-- Apply after Build 246. Raw bytes live only in private R2; Supabase stores metadata and audit state.

begin;

create table if not exists public.daip_project_media_assets (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.creative_projects(id) on delete cascade,
  original_filename text not null check (char_length(original_filename) between 1 and 220),
  content_type text not null check (char_length(content_type) between 3 and 120),
  file_size_bytes bigint not null check (file_size_bytes > 0),
  media_kind text not null check (media_kind in ('photo','video','file')),
  capture_stage text not null default 'other' check (capture_stage in ('before','process','after','damage','interior','exterior','engine','other')),
  privacy_status text not null default 'private_internal' check (privacy_status in ('private_internal')),
  consent_status text not null default 'not_reviewed' check (consent_status in ('not_reviewed','internal_only','approved_public','declined','expired')),
  storage_binding text not null default 'DAIP_MEDIA_BUCKET',
  object_key text not null unique check (object_key like 'projects/%/raw/%'),
  upload_status text not null default 'created' check (upload_status in ('created','uploading','uploaded','aborted','failed')),
  r2_etag text null,
  sha256_hex text null check (sha256_hex is null or sha256_hex ~ '^[a-fA-F0-9]{64}$'),
  is_raw_original boolean not null default true check (is_raw_original = true),
  public_destination_enabled boolean not null default false check (public_destination_enabled = false),
  story_review_status text not null default 'not_reviewed' check (story_review_status in ('not_reviewed','selected','excluded')),
  story_sort_order integer null check (story_sort_order is null or story_sort_order between 1 and 9999),
  story_note text null check (story_note is null or char_length(story_note) <= 1200),
  story_reviewed_by_staff_email text null,
  story_reviewed_at timestamptz null,
  created_by_staff_email text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  uploaded_at timestamptz null
);

create table if not exists public.daip_media_upload_sessions (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid not null references public.daip_project_media_assets(id) on delete cascade,
  project_id uuid not null references public.creative_projects(id) on delete cascade,
  client_fingerprint text not null check (char_length(client_fingerprint) between 3 and 300),
  multipart_upload_id text not null check (char_length(multipart_upload_id) between 3 and 500),
  object_key text not null,
  part_size_bytes integer not null default 33554432 check (part_size_bytes between 5242880 and 104857600),
  total_parts integer not null check (total_parts between 1 and 10000),
  file_size_bytes bigint not null check (file_size_bytes > 0),
  status text not null default 'created' check (status in ('created','uploading','paused','uploaded','aborted','failed')),
  last_part_number integer null check (last_part_number is null or last_part_number between 1 and 10000),
  last_modified_ms bigint null,
  last_error text null check (last_error is null or char_length(last_error)<=1000),
  created_by_staff_email text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz null,
  aborted_at timestamptz null
);

create table if not exists public.daip_media_upload_parts (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.daip_media_upload_sessions(id) on delete cascade,
  part_number integer not null check (part_number between 1 and 10000),
  etag text not null check (char_length(etag) between 3 and 300),
  size_bytes integer not null default 0 check (size_bytes >= 0),
  uploaded_at timestamptz not null default now(),
  unique(session_id,part_number)
);

create table if not exists public.daip_media_processing_jobs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.creative_projects(id) on delete cascade,
  asset_id uuid not null references public.daip_project_media_assets(id) on delete cascade,
  job_type text not null check (job_type in ('metadata_extract','privacy_review','content_candidate_index','proxy_video','frame_extract','audio_extract','transcript','scene_analysis','image_derivative','visual_analysis')),
  status text not null default 'queued' check (status in ('queued','dispatched','processing','review','completed','blocked','failed','cancelled')),
  priority integer not null default 100 check (priority between 1 and 999),
  attempt_count integer not null default 0 check (attempt_count >= 0),
  max_attempts integer not null default 3 check (max_attempts between 1 and 20),
  next_retry_at timestamptz null,
  dead_lettered_at timestamptz null,
  review_note text null check (review_note is null or char_length(review_note) <= 1200),
  output_manifest jsonb not null default '{}'::jsonb,
  last_error text null check (last_error is null or char_length(last_error)<=1000),
  created_by_staff_email text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  started_at timestamptz null,
  completed_at timestamptz null,
  unique(asset_id,job_type)
);

create index if not exists daip_project_media_assets_project_idx on public.daip_project_media_assets(project_id,created_at desc);
create index if not exists daip_project_media_assets_status_idx on public.daip_project_media_assets(upload_status,media_kind,created_at desc);
create index if not exists daip_media_upload_sessions_project_idx on public.daip_media_upload_sessions(project_id,status,updated_at desc);
create unique index if not exists daip_media_upload_sessions_active_fingerprint_uidx
  on public.daip_media_upload_sessions(project_id,client_fingerprint)
  where status in ('created','uploading','paused');
create index if not exists daip_media_parts_session_idx on public.daip_media_upload_parts(session_id,part_number);
create index if not exists daip_media_processing_jobs_queue_idx on public.daip_media_processing_jobs(status,priority,created_at);

alter table public.daip_project_media_assets enable row level security;
alter table public.daip_media_upload_sessions enable row level security;
alter table public.daip_media_upload_parts enable row level security;
alter table public.daip_media_processing_jobs enable row level security;
revoke all privileges on table public.daip_project_media_assets,public.daip_media_upload_sessions,public.daip_media_upload_parts,public.daip_media_processing_jobs from public,anon,authenticated;
grant all privileges on table public.daip_project_media_assets,public.daip_media_upload_sessions,public.daip_media_upload_parts,public.daip_media_processing_jobs to service_role;

comment on table public.daip_project_media_assets is 'Build 247 private DAIP raw-media metadata. Raw bytes live in private R2 only; public destination is structurally false.';
comment on table public.daip_media_upload_sessions is 'Build 247 resumable multipart-upload state for private DAIP project media.';
comment on table public.daip_media_upload_parts is 'Build 247 uploaded multipart ETags needed to safely resume and complete R2 uploads.';
comment on table public.daip_media_processing_jobs is 'Build 247 private downstream processing queue metadata for proxies, frames, transcript, scene analysis, and content candidates.';

alter table public.creative_project_audit drop constraint if exists creative_project_audit_event_type_check;
alter table public.creative_project_audit add constraint creative_project_audit_event_type_check check (event_type in (
  'created','updated','session_added','output_updated','archived','restored','booking_unlinked','cost_line_added','material_line_added','labour_line_added','draft_updated','batch_approval','daip_associated','line_updated','line_soft_deleted','inventory_reservation_updated','session_story_approval','shot_plan_updated','learning_updated','archive_export_prepared','template_updated','content_plan_generated','media_upload_started','media_upload_completed','media_upload_aborted','media_processing_updated'
));

insert into public.app_startup_process_items(process_key,sort_order,category,severity,title,why_text,locations,instructions,done_when,action_route,evidence_key,source_build,is_active)
values
('daip-private-r2-setup',38,'DAIP and media','blocker','Create and bind the private DAIP R2 bucket','Raw MOV, MP4 and photo masters must not be stored in the public rosie-assets bucket. Build 247 expects one private R2 bucket bound to Pages Functions as DAIP_MEDIA_BUCKET.','["Cloudflare Dashboard → R2 Object Storage", "Cloudflare Dashboard → Workers & Pages → Rosie Dazzlers project → Settings → Bindings", "/admin-daip-media.html#setup"]'::jsonb,'["Create an R2 bucket named rosie-daip-media (or another private name).", "Leave r2.dev and custom-domain public access disabled.", "Open Workers & Pages and select the Rosie Dazzlers Pages project.", "Open Settings → Bindings → Add → R2 bucket.", "Set Variable name to DAIP_MEDIA_BUCKET.", "Select the private DAIP bucket and save.", "Repeat the binding for Preview and Production environments if Cloudflare separates them.", "Redeploy the Pages project.", "Open /admin-daip-media.html and confirm Private R2 binding says Ready."]'::jsonb,'The private bucket exists, has no public domain, DAIP_MEDIA_BUCKET is bound to the Pages project, the project was redeployed, and the DAIP Media Intake screen reports the binding as ready.','/admin-daip-media.html#setup','daip_private_r2_setup',247,true),
('daip-large-media-acceptance',39,'DAIP and media','blocker','Complete DAIP large-media upload and recovery acceptance','Before the three historical detailing projects are ingested, one harmless test photo and one large test video should prove multipart upload, resume, immutable raw storage, DB metadata, and processing queue creation.','["/admin-daip-media.html", "Supabase Dashboard → daip_project_media_assets", "Supabase Dashboard → daip_media_upload_sessions", "Supabase Dashboard → daip_media_processing_jobs"]'::jsonb,'["Apply the Build 247 migration in staging.", "Create or select a Creative Project.", "Upload one photo and confirm it completes and queues image processing jobs.", "Begin one video larger than 300 MB, interrupt the connection after several parts, then reselect the same file and choose Resume.", "Confirm previously uploaded parts are skipped and the upload continues.", "Complete the video and confirm raw object_key begins projects/{project_uuid}/raw/video/.", "Confirm the raw bucket remains private and public_destination_enabled is false.", "Confirm proxy/frame/audio/transcript/scene-analysis jobs were queued.", "Record safe evidence in Startup Command Center; do not paste customer media URLs or credentials."]'::jsonb,'A >300 MB test video survives interruption/resume without restarting from zero, the immutable raw object is private, metadata is shared in Supabase, and the correct processing jobs exist.','/admin-daip-media.html','daip_large_media_acceptance',247,true)
on conflict (process_key) do update set sort_order=excluded.sort_order,category=excluded.category,severity=excluded.severity,title=excluded.title,why_text=excluded.why_text,locations=excluded.locations,instructions=excluded.instructions,done_when=excluded.done_when,action_route=excluded.action_route,evidence_key=excluded.evidence_key,source_build=excluded.source_build,is_active=true,updated_at=now();

insert into public.app_launch_readiness_evidence(evidence_key,title,detail,severity,status,sort_order) values
('daip_private_r2_setup','Private DAIP R2 setup','Private bucket exists, is not publicly exposed, and is bound as DAIP_MEDIA_BUCKET.','block','pending',43),
('daip_large_media_acceptance','DAIP large-media acceptance','Verify >300 MB multipart upload, interruption/resume, immutable raw storage, and processing job creation.','block','pending',44)
on conflict (evidence_key) do update set title=excluded.title,detail=excluded.detail,severity=excluded.severity,sort_order=excluded.sort_order,updated_at=now();

update public.app_roadmap_execution_items set is_current_cycle=false where coalesce(is_current_cycle,false)=true;
insert into public.app_roadmap_execution_items(item_key,title,workstream,priority,status,target_build,sort_order,source_document,cycle_key,is_current_cycle,action_path) values
('b247_01','Create and bind private DAIP R2 bucket','media','critical','planned',247,10,'STARTUP_GO_LIVE_BLOCKERS.md','build247',true,'/admin-daip-media.html#setup'),
('b247_02','Apply Build 247 DAIP media migration in staging','reliability','critical','planned',247,20,'STARTUP_GO_LIVE_BLOCKERS.md','build247',true,'/admin-daip-media.html'),
('b247_03','Upload and verify one private DAIP photo','media','critical','planned',247,30,'STARTUP_GO_LIVE_BLOCKERS.md','build247',true,'/admin-daip-media.html'),
('b247_04','Prove >300 MB video multipart upload','media','critical','planned',247,40,'STARTUP_GO_LIVE_BLOCKERS.md','build247',true,'/admin-daip-media.html'),
('b247_05','Prove interrupted video resume','media','critical','planned',247,50,'STARTUP_GO_LIVE_BLOCKERS.md','build247',true,'/admin-daip-media.html'),
('b247_06','Import the first historical detailing project','media','high','planned',247,60,'MASTER_VALUE_ROADMAP.md','build247',true,'/admin-daip-media.html'),
('b247_07','Import the second historical detailing project','media','high','planned',247,70,'MASTER_VALUE_ROADMAP.md','build247',true,'/admin-daip-media.html'),
('b247_08','Import the third historical detailing project','media','high','planned',247,80,'MASTER_VALUE_ROADMAP.md','build247',true,'/admin-daip-media.html'),
('b247_09','Configure optional DAIP processing queue','media','high','planned',247,90,'MASTER_VALUE_ROADMAP.md','build247',true,'/admin-daip-media.html'),
('b247_10','Implement processing consumer for proxies frames audio and transcript','media','critical','planned',248,100,'MASTER_VALUE_ROADMAP.md','build247',true,'/admin-daip-media.html'),
('b247_11','Implement scene analysis and before-after candidate scoring','media','high','planned',248,110,'MASTER_VALUE_ROADMAP.md','build247',true,'/admin-daip-media.html'),
('b247_12','Implement reviewed content-story assembly','content','high','planned',248,120,'MASTER_VALUE_ROADMAP.md','build247',true,'/admin-creative-projects.html'),
('b247_13','Implement render adapter for long and short video outputs','content','critical','planned',249,130,'MASTER_VALUE_ROADMAP.md','build247',true,'/admin-creative-projects.html'),
('b247_14','Keep generated media private until review','security','critical','planned',248,140,'STARTUP_GO_LIVE_BLOCKERS.md','build247',true,'/admin-startup-guide.html'),
('b247_15','Add reviewed copy-to-public workflow for approved derivatives','media','high','planned',249,150,'MASTER_VALUE_ROADMAP.md','build247',true,'/admin-gallery.html'),
('b247_16','Complete real-device DAIP uploader acceptance','reliability','high','planned',247,160,'STARTUP_GO_LIVE_BLOCKERS.md','build247',true,'/admin-daip-media.html'),
('b247_17','Continue catalog publish-readiness cleanup','operations','high','planned',247,170,'STARTUP_GO_LIVE_BLOCKERS.md','build247',true,'/admin-catalog.html'),
('b247_18','Complete booking payment notification acceptance','reliability','critical','planned',247,180,'STARTUP_GO_LIVE_BLOCKERS.md','build247',true,'/admin-startup-guide.html'),
('b247_19','Complete Search Console and Google Business Profile alignment','seo','high','planned',247,190,'MASTER_VALUE_ROADMAP.md','build247',true,'/admin-seo-tasks.html'),
('b247_20','Run invite-only soft launch and evidence review','operations','critical','planned',247,200,'STARTUP_GO_LIVE_BLOCKERS.md','build247',true,'/admin-startup-guide.html')
on conflict (item_key) do update set title=excluded.title,workstream=excluded.workstream,priority=excluded.priority,status=excluded.status,target_build=excluded.target_build,sort_order=excluded.sort_order,source_document=excluded.source_document,cycle_key=excluded.cycle_key,is_current_cycle=true,action_path=excluded.action_path,updated_at=now();

commit;
-- END 2026-08-07_build247_daip_private_media_ingestion.sql

-- BEGIN 2026-08-09_build248_supplier_daip_story_review.sql
-- Build 248 — supplier-link resilience, reviewed DAIP story evidence, and processing retry controls.
-- Apply after Build 247. This migration never makes raw media public and does not render/publish content.

begin;

alter table public.daip_project_media_assets
  add column if not exists story_review_status text not null default 'not_reviewed',
  add column if not exists story_sort_order integer null,
  add column if not exists story_note text null,
  add column if not exists story_reviewed_by_staff_email text null,
  add column if not exists story_reviewed_at timestamptz null;

alter table public.daip_project_media_assets
  drop constraint if exists daip_project_media_assets_story_review_status_check;
alter table public.daip_project_media_assets
  add constraint daip_project_media_assets_story_review_status_check
  check (story_review_status in ('not_reviewed','selected','excluded'));

alter table public.daip_project_media_assets
  drop constraint if exists daip_project_media_assets_story_sort_order_check;
alter table public.daip_project_media_assets
  add constraint daip_project_media_assets_story_sort_order_check
  check (story_sort_order is null or story_sort_order between 1 and 9999);

alter table public.daip_project_media_assets
  drop constraint if exists daip_project_media_assets_story_note_check;
alter table public.daip_project_media_assets
  add constraint daip_project_media_assets_story_note_check
  check (story_note is null or char_length(story_note) <= 1200);

create index if not exists daip_project_media_assets_story_idx
  on public.daip_project_media_assets(project_id, story_review_status, story_sort_order nulls last, created_at);

alter table public.daip_media_processing_jobs
  add column if not exists max_attempts integer not null default 3,
  add column if not exists next_retry_at timestamptz null,
  add column if not exists dead_lettered_at timestamptz null,
  add column if not exists review_note text null;

alter table public.daip_media_processing_jobs
  drop constraint if exists daip_media_processing_jobs_max_attempts_check;
alter table public.daip_media_processing_jobs
  add constraint daip_media_processing_jobs_max_attempts_check
  check (max_attempts between 1 and 20);

alter table public.daip_media_processing_jobs
  drop constraint if exists daip_media_processing_jobs_review_note_check;
alter table public.daip_media_processing_jobs
  add constraint daip_media_processing_jobs_review_note_check
  check (review_note is null or char_length(review_note) <= 1200);

create index if not exists daip_media_processing_jobs_retry_idx
  on public.daip_media_processing_jobs(status, next_retry_at, priority, created_at);

alter table public.creative_projects
  add column if not exists content_package_status text not null default 'not_ready',
  add column if not exists content_package_review_note text null,
  add column if not exists content_package_reviewed_by_staff_email text null,
  add column if not exists content_package_reviewed_at timestamptz null;

alter table public.creative_projects
  drop constraint if exists creative_projects_content_package_status_check;
alter table public.creative_projects
  add constraint creative_projects_content_package_status_check
  check (content_package_status in ('not_ready','ready_for_review','in_review','approved','changes_requested'));

alter table public.creative_projects
  drop constraint if exists creative_projects_content_package_review_note_check;
alter table public.creative_projects
  add constraint creative_projects_content_package_review_note_check
  check (content_package_review_note is null or char_length(content_package_review_note) <= 1600);

create index if not exists creative_projects_content_package_idx
  on public.creative_projects(content_package_status, updated_at desc);

alter table public.creative_project_audit drop constraint if exists creative_project_audit_event_type_check;
alter table public.creative_project_audit add constraint creative_project_audit_event_type_check check (event_type in (
  'created','updated','session_added','output_updated','archived','restored','booking_unlinked','cost_line_added','material_line_added','labour_line_added','draft_updated','batch_approval','daip_associated','line_updated','line_soft_deleted','inventory_reservation_updated','session_story_approval','shot_plan_updated','learning_updated','archive_export_prepared','template_updated','content_plan_generated','media_upload_started','media_upload_completed','media_upload_aborted','media_processing_updated','media_story_reviewed','media_job_retried','content_package_reviewed'
));

comment on column public.daip_project_media_assets.story_review_status is 'Build 248 human review state controlling whether private media metadata may be referenced by story/content planning. It never grants public access.';
comment on column public.daip_media_processing_jobs.dead_lettered_at is 'Build 248 operator-visible terminal retry state. It does not delete raw media.';
comment on column public.creative_projects.content_package_status is 'Build 248 human content-package review gate. Approval does not publish content.';

commit;

-- END 2026-08-09_build248_supplier_daip_story_review.sql

-- Build 253 — application-wide Photo Management Studio (2026-08-12)
-- Extends Build 151 app_media_library with R2 identity, SEO/accessibility metadata,
-- file-management metadata, and explicit reusable component/page assignments.
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
create unique index if not exists app_media_library_r2_key_uq on public.app_media_library(r2_key) where r2_key is not null and btrim(r2_key) <> '';
create index if not exists app_media_library_r2_prefix_idx on public.app_media_library(r2_prefix, source_status, updated_at desc);
create index if not exists app_media_library_tags_idx on public.app_media_library using gin(tags);
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
create index if not exists app_media_assignments_media_idx on public.app_media_assignments(media_id, is_active);
create index if not exists app_media_assignments_page_idx on public.app_media_assignments(page_path, target_type, is_active);
alter table public.app_media_assignments enable row level security;


-- BEGIN 2026-08-13_build259_vehicle_size_review.sql
-- Build 259 — staff/customer vehicle-size verification workflow.
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS vehicle_size_review_status text NOT NULL DEFAULT 'verified';
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS vehicle_size_original text;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS vehicle_size_catalog_expected text;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS vehicle_size_review_reason text;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS vehicle_size_reviewed_size text;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS vehicle_size_reviewed_price_cents integer;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS vehicle_size_reviewed_at timestamptz;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS vehicle_size_reviewed_by uuid;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS vehicle_size_review_token_hash text;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS vehicle_size_review_expires_at timestamptz;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS vehicle_size_customer_response text;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS vehicle_size_customer_responded_at timestamptz;

CREATE INDEX IF NOT EXISTS bookings_vehicle_size_review_status_idx ON public.bookings(vehicle_size_review_status, service_date);

COMMENT ON COLUMN public.bookings.vehicle_size_review_status IS 'verified, needs_review, awaiting_customer, customer_confirmed, customer_cancelled';
COMMENT ON COLUMN public.bookings.vehicle_size_review_token_hash IS 'SHA-256 only; raw customer review token is never stored.';
-- END 2026-08-13_build259_vehicle_size_review.sql
