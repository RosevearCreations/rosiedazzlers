-- Build 189: editable site settings foundation.
-- Purpose:
-- - Keep mutable business/site content out of JavaScript bundles.
-- - Use app_management_settings as the DB authority.
-- - Keep bundled JSON fallbacks in /data for deploy-safe operation before DB sync.
--
-- Apply after Build 188 SQL. This migration is intentionally conservative:
-- it does not drop or rewrite existing setting values. It only ensures the
-- app_management_settings table can hold the editable domains introduced in
-- Build 189.

create table if not exists public.app_management_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

insert into public.app_management_settings (key, value, updated_at) values
  ('business_profile', '{"source_status":"pending_admin_sync","note":"Build 189 editable business identity/contact/social/structured-data payload. Sync from data/business_profile.json or edit in /admin-site-settings.html."}'::jsonb, now()),
  ('site_policies', '{"source_status":"pending_admin_sync","note":"Build 189 editable deposit/cancellation/refund/driveway/water/power/media-policy payload. Sync from data/site_policies.json or edit in /admin-site-settings.html."}'::jsonb, now()),
  ('document_templates', '{"source_status":"pending_admin_sync","note":"Build 189 editable notification/receipt/refund/quote/proposal/invoice template payload. Sync from data/document_templates.json or edit in /admin-site-settings.html."}'::jsonb, now()),
  ('business_hours_holidays', '{"source_status":"pending_admin_sync","note":"Build 189 editable business hours, holiday closures, and availability notes. Sync from data/business_hours_holidays.json or edit in /admin-site-settings.html."}'::jsonb, now()),
  ('navigation_footer', '{"source_status":"pending_admin_sync","note":"Build 189 editable navigation and footer-link payload. Sync from data/navigation_footer.json or edit in /admin-site-settings.html."}'::jsonb, now()),
  ('option_libraries', '{"source_status":"pending_admin_sync","note":"Build 189 editable dropdown/option-library payload. Sync from data/admin_option_libraries.json or edit in /admin-site-settings.html."}'::jsonb, now()),
  ('analytics_event_registry', '{"source_status":"pending_admin_sync","note":"Build 189 editable analytics event label registry. Sync from data/analytics_event_registry.json or edit in /admin-site-settings.html."}'::jsonb, now()),
  ('media_requirements', '{"source_status":"pending_admin_sync","note":"Build 189 stable media requirements fallback plus DB-managed task direction. Sync from data/media_requirements.json or edit in /admin-site-settings.html."}'::jsonb, now()),
  ('landing_pages_content', '{"source_status":"pending_admin_sync","note":"Build 189 extracted bundled landing-page fallback content. Sync from data/landing_pages_content.json or use app_management_settings.landing_pages for live page overrides."}'::jsonb, now())
on conflict (key) do nothing;

comment on table public.app_management_settings is 'Generic DB-backed editable JSON settings. Build 189 adds business_profile, site_policies, document_templates, business_hours_holidays, navigation_footer, option_libraries, analytics_event_registry, media_requirements, and landing_pages_content fallbacks.';
