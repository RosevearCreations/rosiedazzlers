# Current Implementation State

## Completed in this pass
- Booking page add-on row layout corrected and preserved.
- Admin app-management screen now persists settings instead of staying planning-only.
- Admin notifications queue screen added.
- Internal navigation and dashboard updated for notification review.
- Progress/jobsite flow continues to center around picture-first observations and threaded updates.

## Customer screen now centers on
- profile, preferred contact, email, phone, SMS
- home + alternate address
- notification preferences
- live updates / billing profile toggle
- customer-only notes, detailer-visible notes, admin-only notes
- garage vehicles with per-vehicle contact details and billing label
- booking history, tier visibility, gift certificates, redemption history

## Detailer/Admin screen now centers on
- address/contact profile
- emergency contact
- work hours / payroll metadata
- vehicle info
- detailer level and admin level
- supervisor, permissions profile
- admin-only note zones
- recent assignments + tip payout history placeholders

## Admin management screen now centers on
- role/visibility matrix
- blocking time as Admin-only
- manual scheduling authority settings
- feature flags for live updates, chat, picture-first observations, and tier badges

## Notifications now cover
- queued comment / progress / media hooks
- recipient email/phone visibility
- queue status, attempts, last error, processed timestamp

## Still next
- richer image annotation tools inside the observation workflow
- stronger two-sided thread UI polish for customers and detailers
- real dispatch workers for queued notification events
- more persistence across admin policy controls and role-specific enforcement


## March 2026 annotation + retry state

Implemented in this pass:
- Admin jobsite screen supports image-first observations with annotation posting
- Customer progress screen shows photo annotations and better reply threading
- Feature flags from `app_management_settings` are now consulted by comment and progress APIs
- Admin notifications screen can retry/process queued items

New/updated files of note:
- `functions/api/_lib/app-settings.js`
- `functions/api/admin/observation_annotation_post.js`
- `functions/api/admin/notifications_process.js`
- `functions/api/progress/view.js`
- `functions/api/admin/jobsite_detail.js`
- `admin-jobsite.html`
- `progress.html`
- `admin-notifications.html`
- `sql/2026-03-22_annotations_and_notification_retry.sql`

## Latest March 2026 Annotation/Retry Pass

- Added richer observation annotation metadata: category, severity, and pin color.
- Added optional annotation-linked reply message creation from the jobsite screen.
- Expanded progress/thread payloads so customer view can show reply target labels and richer annotation cards.
- Added image lightbox behavior to both jobsite and customer progress screens when enabled by app settings.
- Expanded app feature flags with `annotation_lightbox_enabled`, `annotation_thread_replies_enabled`, and `notifications_retry_enabled`.
- Expanded notification queue events to track `next_attempt_at` and `max_attempts` and process retries with backoff.
- Notification list/process APIs now surface and manage retry scheduling state.

## Current implementation additions from latest pass

- Admin now has an Analytics & Security screen backed by `/api/admin/analytics_overview`.
- Public site activity logging is persisted in `site_activity_events`.
- Checkout abandonment is estimated by comparing `checkout_started` vs completion events by session.
- Front-end SEO support now injects canonical tags, keyword metadata, and LocalBusiness JSON-LD automatically.
- Notification queue retry handling now respects `next_attempt_at` and `max_attempts`.
