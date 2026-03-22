# Development Roadmap

## Recently completed
- screen-by-screen Customer / Detailer / Admin pass
- booking add-on layout repair
- picture-first observation foundation
- admin app-management persistence
- admin notifications queue screen

## Current phase
Operational polish and policy enforcement:
- apply saved admin policy across interfaces
- deepen image-led observation workflow
- improve customer/detailer threaded communication

## Upcoming
1. Observation annotation and compare tools
2. Notification dispatch worker path
3. Admin moderation controls for threads
4. More reporting around loyalty tiers, gift redemptions, and staff operations


## Roadmap update

Completed this pass:
- image annotation foundation
- better two-sided client/detailer thread targeting
- admin notification retry/process controls
- app settings enforcement in key APIs

Upcoming:
- full annotation editor
- image zoom / carousel improvements around annotated photos
- screen-by-screen enforcement of saved management rules
- provider-backed notification dispatch

## Latest March 2026 Annotation/Retry Pass

- Added richer observation annotation metadata: category, severity, and pin color.
- Added optional annotation-linked reply message creation from the jobsite screen.
- Expanded progress/thread payloads so customer view can show reply target labels and richer annotation cards.
- Added image lightbox behavior to both jobsite and customer progress screens when enabled by app settings.
- Expanded app feature flags with `annotation_lightbox_enabled`, `annotation_thread_replies_enabled`, and `notifications_retry_enabled`.
- Expanded notification queue events to track `next_attempt_at` and `max_attempts` and process retries with backoff.
- Notification list/process APIs now surface and manage retry scheduling state.
