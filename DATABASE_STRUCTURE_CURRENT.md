# Rosie Dazzlers — Current Database Structure Snapshot

This snapshot reflects the project state after the latest auth, chat, gift redemption, and notification-hook pass.

## Core user/profile entities

### `staff_users`
Current direction includes:
- identity: `full_name`, `email`, `password_hash`, `is_active`
- role/capability: `role_code`, capability flags
- richer staff details: `phone`, address fields, `employee_code`, `position_title`, `hire_date`, emergency contact fields
- new operations/admin details: `admin_level`, `department`, `permissions_profile`, `sms_phone`, `preferred_contact_name`

### `customer_profiles`
Current direction includes:
- identity: `email`, `full_name`, `phone`, `password_hash`, `is_active`
- profile: address fields, `vehicle_notes`, `tier_code`, notes
- communication prefs: `notification_opt_in`, `notification_channel`, `detailer_chat_opt_in`
- new notification detail fields: `preferred_contact_name`, `sms_phone`, `notify_on_progress_post`, `notify_on_media_upload`, `notify_on_comment_reply`

## Session entities
- `staff_auth_sessions`
- `customer_auth_sessions`

## Booking / operations entities
- `bookings`
- `date_blocks`
- `slot_blocks`
- `jobsite_intake`
- `job_time_entries`
- `job_updates`
- `job_media`
- `job_signoffs`
- `progress_comments`
- `staff_override_log`

## Gift entities
- `gift_products`
- `gift_certificates`
- `gift_certificate_redemptions`

## Notification / audit entities
- `notification_events`
- `booking_events`

## Important current business rules
- `service_area` currently accepts: `Norfolk`, `Oxford`
- `vehicle_size` currently accepts: `small`, `mid`, `oversize`
- `gift_certificates.type` currently aligns to: `service`, `open_value`
- customer tiers are business segmentation, not access-control roles

## Latest capability additions
- actual gift redemption write path from booking checkout confirmation
- staff/detailer observation-thread comments
- notification queue hooks for email/SMS preference flows


## March 2026 additions

- Client garage foundation added through `customer_vehicles` plus new client vehicle APIs.
- Observation-thread UI foundation added on the jobsite screen using `progress_comments`.
- Gift redemption history is now surfaced in the client dashboard and customer detail direction.
- Richer customer/staff fields now include alternate service address, preferred contact/SMS, admin level, supervisor, pay schedule, hourly rate, and tips history support.
- Layout cleanup pass added shared form-grid / check-grid helpers to reduce overlapping boxes and misaligned checkboxes.


## Latest planned/added fields

### customer_vehicles
- `contact_email`
- `contact_phone`
- `contact_sms_phone`
- `billing_profile_label`
- `last_wash_score`
- `notification_opt_in`

### staff_users
- `detailer_level`
- `department`
- `permissions_profile`
- `personal_admin_notes`
- `vehicle_info`
- `tips_payout_notes`

### app_management_settings
- `key`
- `value`
- `updated_at`
- `updated_by_staff_user_id`


## Current snapshot — March 21, 2026

Latest pass completed:
- fixed booking add-on checkbox/text layout pressure
- improved service/package image fallback with extra photo cards
- expanded staff management toward richer Admin/Detailer profile editing
- added customer tier discount support in the UI/data model direction
- added/confirmed garage, gift, and redemption visibility in client/admin screens
- added current SQL for tier discounts and richer staff/customer fields

Current next priorities:
- picture-first observation interface
- richer client/detailer threaded comments UI
- manual scheduling / app-management rules UI completion
- final layout polish across booking and internal screens

