# Rosie Dazzlers — Mobile Auto Detailing

Modern static site + serverless operations backend for Rosie Dazzlers (Norfolk & Oxford Counties).

Rosie Dazzlers is no longer only a marketing + booking site.  
On the `dev` branch it is evolving into a fuller operations platform covering:

- customer booking
- Stripe deposit checkout
- gift certificates
- admin booking operations
- date and slot blocking
- token-based customer progress sharing
- detailer jobsite intake
- job time tracking
- live admin monitoring
- staff roles and permissions
- customer profiles and loyalty tiers

---

## Stack

- Cloudflare Pages (static hosting + Functions backend)
- Cloudflare R2 (public image hosting)
- Supabase Postgres
- Stripe

---

## Main customer pages

- `/` — home
- `/services` — services
- `/pricing` — pricing
- `/book` — booking form
- `/gifts` — gift certificates
- `/gear` — gear catalog
- `/consumables` — consumables catalog
- `/progress?token=...` — token-based customer progress page

---

## Admin area

Clean admin routes are available through redirects:

- `/admin`
- `/admin-booking`
- `/admin-blocks`
- `/admin-progress`
- `/admin-jobsite`
- `/admin-live`
- `/admin-staff`
- `/admin-customers`
- `/admin-promos`

---

## Core business flow

Customer books service  
→ deposit checkout in Stripe  
→ booking stored in Supabase  
→ admin confirms / assigns staff  
→ progress link enabled  
→ detailer performs intake and work  
→ progress / media / time updates happen  
→ customer reviews progress and signs off

---

## Booking model

- Half-day slots: `AM`, `PM`
- Full day uses both slots
- Capacity controlled by `date_blocks` and `slot_blocks`
- Booking statuses include:
  - `pending`
  - `confirmed`
  - `cancelled`
  - `completed`

---

## Progress model

Preferred customer progress path is token-based.

Booking stores a `progress_token`, and the customer uses:

- `progress.html?token=...`

Progress data is built from:

- `job_updates`
- `job_media`
- `job_signoffs`

---

## Security model

### Current production-style bridge
- Admin pages still use shared `ADMIN_PASSWORD`

### Current design direction
Role-aware staff access is now being built into the API layer:

- Admin
- Senior Detailer
- Detailer
- Customer

Important:
- customer tiers are **business segmentation**
- customer tiers are **not security roles**

Security foundation now includes:

- `staff_users`
- `customer_tiers`
- `customer_profiles`
- `staff_override_log`

---

## Main API areas

### Booking + payments
- `GET /api/availability?date=YYYY-MM-DD`
- `POST /api/checkout`
- `POST /api/stripe/webhook`

### Gifts
- `POST /api/gifts/checkout`
- `POST /api/gifts/webhook`
- `POST /api/gifts/receipt`

### Customer progress
- `GET /api/progress/view?token=...`
- `POST /api/progress/signoff`

### Admin booking operations
- `POST /api/admin/bookings`
- `POST /api/admin/bookings_search`
- `POST /api/admin/booking_detail`
- `POST /api/admin/booking_save`
- `POST /api/admin/booking_confirm`
- `POST /api/admin/booking_complete`
- `POST /api/admin/booking_cancel`
- `POST /api/admin/bookings_delete`
- `POST /api/admin/assign_booking`
- `POST /api/admin/booking_availability`
- `POST /api/admin/booking_form_data`
- `POST /api/admin/day_schedule`

### Admin blocks
- `POST /api/admin/blocks_list`
- `POST /api/admin/blocks_save`

### Admin progress
- `POST /api/admin/progress_enable`
- `POST /api/admin/progress_post`
- `POST /api/admin/progress_list`
- `POST /api/admin/progress_detail`
- `POST /api/admin/progress_delete`

### Jobsite / live ops
- `POST /api/admin/jobsite_save`
- `POST /api/admin/jobsite_list`
- `POST /api/admin/jobsite_detail`
- `POST /api/admin/jobsite_delete`
- `POST /api/admin/time_save`
- `POST /api/admin/time_list`
- `POST /api/admin/time_delete`
- `POST /api/admin/media_save`
- `POST /api/admin/media_list`
- `POST /api/admin/media_delete`
- `POST /api/admin/signoff_save`
- `POST /api/admin/signoff_list`
- `POST /api/admin/signoff_delete`
- `POST /api/admin/live_list`
- `POST /api/admin/dashboard_summary`

### Staff admin
- `POST /api/admin/staff_me`
- `POST /api/admin/staff_list`
- `POST /api/admin/staff_save`
- `POST /api/admin/staff_detail`
- `POST /api/admin/staff_toggle_active`
- `POST /api/admin/staff_assignable_list`
- `POST /api/admin/override_log_list`

### Customer admin
- `POST /api/admin/customers_list`
- `POST /api/admin/customers_detail`
- `POST /api/admin/customers_save`
- `POST /api/admin/customers_delete`
- `POST /api/admin/customer_tiers_list`
- `POST /api/admin/customer_tiers_save`
- `POST /api/admin/customer_tiers_delete`

### Promo admin
- `POST /api/admin/promos_list`
- `POST /api/admin/promos_detail`
- `POST /api/admin/promos_save`
- `POST /api/admin/promos_toggle_active`
- `POST /api/admin/promos_delete`

---

## Environment variables

Required:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ADMIN_PASSWORD`

Stripe:

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_WEBHOOK_SECRET_GIFTS`

Preview environments should use Stripe test keys.  
Production should use Stripe live keys.

---

## Assets

R2 custom domain:

- `https://assets.rosiedazzlers.ca`

Folders:

- `brand/`
- `packages/`
- `products/`
- `systems/`

---

## Database

See `SUPABASE_SCHEMA.sql`.

Recent schema direction includes:

- token-based progress fields on `bookings`
- `job_updates`
- `job_media`
- `job_signoffs`
- `jobsite_intake`
- `job_time_entries`
- `staff_users`
- `customer_tiers`
- `customer_profiles`
- `staff_override_log`

---

## Current branch direction

The `dev` branch is focused on:

1. enforcing role-aware API access
2. linking jobsite actions to real staff users
3. completing gift redemption during booking
4. unifying add-on pricing/config
5. adding direct file upload from phone
6. preparing for a real staff login/session layer

---

## Notes

- Booking capacity is AM/PM slot based.
- Customers must acknowledge driveway, power, water, bylaw, and cancellation rules.
- Token-based progress is now the preferred customer progress path.
- Shared admin-password gates still exist as a bridge, but the project is moving toward role-aware staff access.
- Customer tiers must remain separate from security roles.


## Compatibility note

A legacy compatibility alias now exists for older bootstrap callers:

- `POST /api/auth/bootstrap-admin`

It forwards to the newer bootstrap path:

- `POST /api/admin/auth_bootstrap_admin_password`

This was added to tolerate stale browser code, cached scripts, or older tooling during the auth transition.

## March 2026 auth/profile additions

The current dev branch now includes a client auth foundation in addition to staff auth:

- `/login` — client login + sign-up
- `/my-account` — client account/profile page
- `/api/client/auth_signup`
- `/api/client/auth_login`
- `/api/client/auth_me`
- `/api/client/auth_logout`
- `/api/client/profile_update`

The public nav now shows current sign-in status at the top for staff and clients, including the signed-in username and a logout link.

A new SQL migration adds richer profile fields for customer and staff records plus `customer_auth_sessions`. Run `sql/2026-03-21_customer_auth_and_profile_fields.sql` before using the client login/account flow in production.


### Customer interaction and account additions
- `/my-account` now includes booking history, active gift certificates, and redemption history.
- `/progress?token=...` now includes client/detailer chat replies when enabled.
- Customer profiles now include notification preferences and detailer chat opt-in.


## Latest auth/progress/gift pass
- Added actual gift redemption writes through booking confirmation webhook using `gift_certificate_redemptions`.
- Added staff/detailer observation-thread posting through `progress_comments`.
- Added notification queue hooks through `notification_events` for customer email/SMS preference flows.
- Added richer customer/staff profile field direction and a current schema snapshot in `DATABASE_STRUCTURE_CURRENT.md`.


## March 2026 additions

- Client garage foundation added through `customer_vehicles` plus new client vehicle APIs.
- Observation-thread UI foundation added on the jobsite screen using `progress_comments`.
- Gift redemption history is now surfaced in the client dashboard and customer detail direction.
- Richer customer/staff fields now include alternate service address, preferred contact/SMS, admin level, supervisor, pay schedule, hourly rate, and tips history support.
- Layout cleanup pass added shared form-grid / check-grid helpers to reduce overlapping boxes and misaligned checkboxes.


## Latest snapshot additions

- Staff session auth now tolerates fallback secret handling more consistently across admin screens.
- Added **App Management** planning screen at `/admin-app` for role visibility, scheduling authority, and future feature gating.
- Customer admin now surfaces **garage vehicles**, **gift certificates**, and **gift redemption history**.
- Blocking time remains an **Admin-only** feature.
- Current schema planning now includes richer customer-vehicle contact data, detailer/admin private notes, detailer level, supervisor/pay schedule data, and app management settings.
