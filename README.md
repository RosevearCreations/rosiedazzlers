# Rosie Dazzlers

Current dev snapshot includes:
- public booking flow with package/add-on loading fixed
- customer login/account/garage foundation
- staff/admin login and dashboard foundation
- screen-by-screen Customer, Detailer, and Admin passes
- picture-first observation workflow foundation
- threaded progress conversation foundation
- admin app-management settings persistence
- admin notifications queue screen

## Recommended next run order
1. Run any new SQL migrations in `sql/`
2. Deploy
3. Test:
   - `/book`
   - `/login`
   - `/my-account`
   - `/admin-login`
   - `/admin-jobsite`
   - `/progress`
   - `/admin-app`
   - `/admin-notifications`

## New in this pass
- Admin settings now load/save through `app_management_settings`
- Notification queue can be reviewed in `/admin-notifications`
- Menu/dashboard updated for notifications
- Docs snapshot refreshed again


## Latest pass: annotations, threading, settings enforcement, notification retries

This pass added:
- picture-first observation annotations through `observation_annotations`
- stronger jobsite workspace support for image click-to-annotate
- richer customer progress timeline with annotation pins and reply targets
- app-management settings loading inside progress/comment APIs
- notification queue retry/process controls in Admin

Run next SQL:
- `sql/2026-03-22_annotations_and_notification_retry.sql`

## Latest March 2026 Annotation/Retry Pass

- Added richer observation annotation metadata: category, severity, and pin color.
- Added optional annotation-linked reply message creation from the jobsite screen.
- Expanded progress/thread payloads so customer view can show reply target labels and richer annotation cards.
- Added image lightbox behavior to both jobsite and customer progress screens when enabled by app settings.
- Expanded app feature flags with `annotation_lightbox_enabled`, `annotation_thread_replies_enabled`, and `notifications_retry_enabled`.
- Expanded notification queue events to track `next_attempt_at` and `max_attempts` and process retries with backoff.
- Notification list/process APIs now surface and manage retry scheduling state.

## Latest pass: security analytics, admin insights, and SEO foundation

- Added public visitor/page analytics ingest through `site_activity_events` and `/api/analytics/ingest`.
- Added Admin analytics screen for top pages, countries, referrers, visitor counts, and estimated abandoned checkouts.
- Added checkout-start tracking from the booking page and complete-page conversion tracking.
- Expanded SEO support with canonical tags, keyword meta tags, and LocalBusiness JSON-LD injection in `assets/chrome.js`.
- Strengthened notification processing by respecting retry windows and attempt limits.
- Added SQL migration: `sql/2026-03-23_security_analytics_and_seo_foundation.sql`.
