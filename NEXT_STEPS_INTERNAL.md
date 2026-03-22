# Next Steps Internal

## Highest-value next build targets
1. **Picture-first observation refinement**
   - annotate observations
   - lightbox / before-after compare
   - stronger upload progress + validation

2. **Threaded comment UX**
   - richer message grouping
   - role badges / visibility chips
   - unread/new markers
   - admin moderation controls

3. **Policy enforcement**
   - apply `app_management_settings` to more screens and APIs
   - lock blocking time to admins everywhere
   - lock manual scheduling controls according to saved settings

4. **Notifications**
   - worker/cron dispatch path
   - resend / mark failed / mark sent actions
   - email vs SMS templates

5. **Screen refinement**
   - Customer screen: garage polish, billing storage choices, loyalty pricing display
   - Detailer screen: payout, schedule, and assignment workflow
   - Admin screen: management/reporting utilities and moderation


## Immediate next priorities after annotation/retry pass

1. Persist true drawing/shape annotations beyond point pins
2. Add client-side media zoom/lightbox with annotation focus
3. Apply saved `app_management_settings` to more admin/customer/detailer screens
4. Add real transport dispatchers for `notification_events` (email/SMS providers)
5. Extend Admin / Detailer / Customer screen-specific controls field by field

## Latest March 2026 Annotation/Retry Pass

- Added richer observation annotation metadata: category, severity, and pin color.
- Added optional annotation-linked reply message creation from the jobsite screen.
- Expanded progress/thread payloads so customer view can show reply target labels and richer annotation cards.
- Added image lightbox behavior to both jobsite and customer progress screens when enabled by app settings.
- Expanded app feature flags with `annotation_lightbox_enabled`, `annotation_thread_replies_enabled`, and `notifications_retry_enabled`.
- Expanded notification queue events to track `next_attempt_at` and `max_attempts` and process retries with backoff.
- Notification list/process APIs now surface and manage retry scheduling state.
