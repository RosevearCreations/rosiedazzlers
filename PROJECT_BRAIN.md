# Project Brain

Rosie Dazzlers is now structured around three primary user surfaces:
- **Customer**: account, garage, booking history, gifts, progress access
- **Detailer**: profile, work metadata, operational threads, observation workflow
- **Admin**: customer/staff oversight, app policy management, notifications queue, scheduling/blocking authority

## Current operational direction
- booking and progress experiences are the main customer-facing workflows
- jobsite is becoming the true picture-first operations workspace
- policy is moving from static planning docs into saved app settings
- notifications are moving from best-effort hooks into a visible queue that can later be processed/retried

## Immediate focus
- continue turning picture-first observations into the core field workflow
- make threaded communication clearer for both client and detailer
- enforce role/policy settings more consistently across the UI and APIs


## Current product direction snapshot

The platform is now moving from simple progress notes into a picture-first workflow:
- team uploads a photo
- team annotates the exact point on the image
- team/client discuss that observation in-thread
- admin can monitor queue notifications and retry failures
- app-management feature flags increasingly control what the UI and APIs allow

## Latest March 2026 Annotation/Retry Pass

- Added richer observation annotation metadata: category, severity, and pin color.
- Added optional annotation-linked reply message creation from the jobsite screen.
- Expanded progress/thread payloads so customer view can show reply target labels and richer annotation cards.
- Added image lightbox behavior to both jobsite and customer progress screens when enabled by app settings.
- Expanded app feature flags with `annotation_lightbox_enabled`, `annotation_thread_replies_enabled`, and `notifications_retry_enabled`.
- Expanded notification queue events to track `next_attempt_at` and `max_attempts` and process retries with backoff.
- Notification list/process APIs now surface and manage retry scheduling state.
