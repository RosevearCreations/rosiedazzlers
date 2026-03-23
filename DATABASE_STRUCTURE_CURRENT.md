# Database Structure Current

## customer_profiles
Core customer screen fields now expected include:
- full_name, email, phone, sms_phone, preferred_contact_name
- address_line1/address_line2/city/province/postal_code
- alternate_address_label + alternate address fields
- notes, client_private_notes, detailer_visible_notes, admin_private_notes
- notification_opt_in, notification_channel, detailer_chat_opt_in
- notify_on_progress_post, notify_on_media_upload, notify_on_comment_reply
- has_water_hookup, has_power_hookup, live_updates_enabled, billing_profile_enabled
- tier_code

## customer_vehicles
Vehicle garage fields now expected include:
- vehicle_name, model_year, make, model, color, mileage_km
- preferred_contact_name, contact_email, contact_phone
- parking_location, alternate_service_address
- notes_for_team, detailer_visible_notes, admin_private_notes
- text_updates_opt_in, live_updates_opt_in
- has_water_hookup, has_power_hookup
- save_billing_on_file, billing_label
- is_primary, display_order

## staff_users
Shared Detailer/Admin screen fields now expected include:
- full_name, email, preferred_contact_name, phone, sms_phone
- full address
- employee_code, position_title, hire_date
- emergency_contact_name, emergency_contact_phone
- department, admin_level, detailer_level
- permissions_profile, preferred_work_hours
- pay_schedule, hourly_rate_cents
- supervisor_staff_user_id
- vehicle_info, vehicle_notes
- notes, admin_private_notes, personal_admin_notes, tips_payout_notes

## progress_comments
Thread fields now support:
- booking_id
- parent_type / parent_id
- visibility
- created_by_customer_profile_id or created_by_staff_user_id
- message
- image linkage through related media timeline

## notification_events
Notification queue now expects:
- event_type
- channel
- booking_id
- customer_profile_id
- recipient_email / recipient_phone
- payload jsonb
- status
- attempt_count
- last_error
- processed_at

## app_management_settings
Saved admin policy/settings store now includes:
- `visibility_matrix`
- `manual_scheduling_rules`
- `feature_flags`


## New tables / fields in latest pass

### `observation_annotations`
Stores point-style annotations tied to a booking and optionally a media item.
Suggested fields:
- `id`
- `booking_id`
- `media_id`
- `x_percent`
- `y_percent`
- `title`
- `note`
- `visibility`
- `created_by_type`
- `created_by_name`
- `created_by_email`
- `created_at`

### `notification_events` queue handling
Expected fields now used by the app:
- `status`
- `attempt_count`
- `last_error`
- `processed_at`

### `app_management_settings`
Feature flags now actively used by APIs, including:
- `customer_chat_enabled`
- `picture_first_observations`
- `image_annotations_enabled`

## Latest March 2026 Annotation/Retry Pass

- Added richer observation annotation metadata: category, severity, and pin color.
- Added optional annotation-linked reply message creation from the jobsite screen.
- Expanded progress/thread payloads so customer view can show reply target labels and richer annotation cards.
- Added image lightbox behavior to both jobsite and customer progress screens when enabled by app settings.
- Expanded app feature flags with `annotation_lightbox_enabled`, `annotation_thread_replies_enabled`, and `notifications_retry_enabled`.
- Expanded notification queue events to track `next_attempt_at` and `max_attempts` and process retries with backoff.
- Notification list/process APIs now surface and manage retry scheduling state.

## Latest schema additions

### `site_activity_events`
Stores public visitor/session activity, page views, checkout starts/completions, referrers, location, and lightweight payload metadata for admin analytics.

### `app_management_settings.feature_flags` additions
- `analytics_tracking_enabled`
