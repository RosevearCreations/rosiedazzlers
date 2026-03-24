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
- emergency contact fields
- department, admin_level, detailer_level
- hourly_rate_cents, pay_schedule, preferred_work_hours
- supervisor_staff_user_id
- permissions_profile
- vehicle info / vehicle notes
- notes, admin_private_notes, personal_admin_notes, tips_notes

## app_management_settings
Used to persist feature flags and admin policy:
- key
- value_json
- notes

## notification_events
Queue/dispatch table now expected to include:
- event_type
- channel
- recipient_email / recipient_phone
- subject / body_text / body_html
- payload
- status
- attempt_count
- max_attempts
- next_attempt_at
- processed_at
- last_error
- provider_response

## observation_annotations
Picture-first observation metadata now includes:
- booking_id
- media_id
- x / y
- title / note
- category
- severity
- pin_color
- visibility

## catalog_items
Admin-maintained operational catalog for systems and consumables:
- catalog_type (`systems` or `consumables`)
- title
- category
- image_url
- supplier_url
- sort_order
- quantity_on_hand
- reorder_level
- unit_cost_cents
- notes
- is_active


## Catalog ratings and recovery settings
- `catalog_items` now includes: `brand`, `model`, `location_label`, `acquired_on`, `condition_rating`, `usefulness_rating`, and computed `overall_rating`.
- `app_management_settings` also stores `recovery_templates` and `recovery_rules` for abandoned-order messaging.

## Thread moderation and recovery-provider additions
- `progress_comments` now also includes: `thread_status`, `moderated_at`, `moderated_by_staff_user_id`, `moderated_by_name`, and `moderation_reason`.
- `observation_annotations` now also includes: `thread_status`, `moderated_at`, `moderated_by_staff_user_id`, `moderated_by_name`, and `moderation_reason`.
- `catalog_items` now also includes: `last_reorder_requested_at` and `last_reorder_note`.
- `catalog_low_stock_alerts` stores low-stock/reorder workflow records per catalog item.
- `app_management_settings` also stores `recovery_provider_rules` and `moderation_rules`.
