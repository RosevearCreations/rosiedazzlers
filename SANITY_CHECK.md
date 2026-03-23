
# Sanity Check

## Core pages to test
- `/`
- `/book`
- `/login`
- `/my-account`
- `/progress`
- `/admin-login`
- `/admin`
- `/admin-jobsite`
- `/admin-staff`
- `/admin-customers`
- `/admin-app`
- `/admin-notifications`

## New checks in this pass
- Booking add-ons render with left/top aligned checkboxes
- Admin app-management screen loads and saves settings
- Notifications queue loads for Admin/manager roles
- Dashboard/menu link to notifications appears correctly

## SQL to run
- `sql/2026-03-22_admin_notifications_and_settings_persistence.sql`


## Sanity check additions

After this pass test:
- `/admin-jobsite` image upload + annotation creation
- `/progress?token=...` annotation visibility and reply flow
- `/admin-notifications` retry visible queued items
- feature flag changes in `/admin-app` affecting customer chat / annotation availability

## Latest March 2026 Annotation/Retry Pass

- Added richer observation annotation metadata: category, severity, and pin color.
- Added optional annotation-linked reply message creation from the jobsite screen.
- Expanded progress/thread payloads so customer view can show reply target labels and richer annotation cards.
- Added image lightbox behavior to both jobsite and customer progress screens when enabled by app settings.
- Expanded app feature flags with `annotation_lightbox_enabled`, `annotation_thread_replies_enabled`, and `notifications_retry_enabled`.
- Expanded notification queue events to track `next_attempt_at` and `max_attempts` and process retries with backoff.
- Notification list/process APIs now surface and manage retry scheduling state.

## Latest sanity-check items

- Run `sql/2026-03-23_security_analytics_and_seo_foundation.sql`.
- Confirm `/admin-analytics` loads for Admin.
- Confirm page views are writing to `site_activity_events`.
- Confirm booking page records `checkout_started` and complete page records completion.
