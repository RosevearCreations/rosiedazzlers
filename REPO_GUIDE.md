# Rosie Dazzlers Repo Guide

## 1) What this repo is

A Cloudflare Pages site with:

- Static HTML pages (marketing + booking + gifts + catalogs)
- Cloudflare Pages Functions in `/functions`
- Data JSON in `/data`
- Images served from Cloudflare R2 (`assets.rosiedazzlers.ca`)
- A growing admin/detailer operations area for bookings, progress, jobsite work, staff, customers, promos, and live monitoring

---

## 2) Folder map (high level)

### Root HTML pages
- `index.html`
- `services.html` and/or `services/index.html` (choose one canonical path later)
- `pricing.html` and/or `pricing/index.html` (choose one canonical path later)
- `book.html`
- `gifts.html`
- `gear.html`
- `consumables.html`
- `contact.html`
- `about.html`
- `privacy.html`
- `terms.html`
- `waiver.html`
- `progress.html`

### Admin UI pages
- `admin.html`
- `admin-booking.html`
- `admin-blocks.html`
- `admin-progress.html`
- `admin-jobsite.html`
- `admin-live.html`
- `admin-staff.html`
- `admin-customers.html`
- `admin-promos.html`

These pages are increasingly acting less like separate isolated tools and more like pieces of an internal operations app.

---

## 3) `/assets`

Shared site assets:

- `site.css` — theme and shared layout
- `chrome.js` — shared nav/footer/banner/reviews behavior
- `site.js` — page helpers for services, pricing, booking, gear, consumables
- `config.js` — legacy/shared constants if still present

Recommended direction:
- keep shared layout/theme logic centralized here
- avoid spreading duplicate visual logic into page files

---

## 4) `/data`

Static JSON used by the site:

- `rosie_services_pricing_and_packages.json`
- `rosie_products_catalog.json`
- `systems_catalog.json`
- manifests and helper JSON files

Important rule:
- pricing and add-on definitions should move toward one canonical source rather than split frontend/backend duplicates

---

## 5) `/functions/api`

Backend endpoints live here.

The repo is moving from a simple booking backend toward a broader operations backend.

### Public booking + payment
- `checkout.js`
- `availability.js`
- `stripe/webhook.js`

### Gift flow
- `gifts/checkout.js`
- `gifts/webhook.js`
- `gifts/receipt.js`

### Public customer progress
- `progress/view.js`
- `progress/signoff.js`

### Admin booking operations
Examples now include:
- `admin/bookings.js`
- `admin/bookings_search.js`
- `admin/booking_detail.js`
- `admin/booking_save.js`
- `admin/booking_confirm.js`
- `admin/booking_complete.js`
- `admin/booking_cancel.js`
- `admin/bookings_delete.js`
- `admin/assign_booking.js`
- `admin/booking_availability.js`
- `admin/booking_form_data.js`
- `admin/day_schedule.js`

### Admin block operations
Examples now include:
- `admin/blocks.js`
- `admin/blocks_list.js`
- `admin/blocks_save.js`
- `admin/block_date.js`
- `admin/unblock_date.js`
- `admin/block_slot.js`
- `admin/unblock_slot.js`

Long-term direction should reduce duplicate legacy/newer patterns.

### Progress system
Examples now include:
- `progress/view.js`
- `progress/signoff.js`
- `admin/progress_enable.js`
- `admin/progress_post.js`
- `admin/progress_list.js`
- `admin/progress_detail.js`
- `admin/progress_delete.js`

### Jobsite / live ops
Examples now include:
- `admin/jobsite_save.js`
- `admin/jobsite_list.js`
- `admin/jobsite_detail.js`
- `admin/jobsite_delete.js`
- `admin/time_save.js`
- `admin/time_list.js`
- `admin/time_delete.js`
- `admin/media_save.js`
- `admin/media_list.js`
- `admin/media_delete.js`
- `admin/signoff_save.js`
- `admin/signoff_list.js`
- `admin/signoff_delete.js`
- `admin/live_list.js`
- `admin/dashboard_summary.js`

### Staff admin
Examples now include:
- `admin/staff_me.js`
- `admin/staff_list.js`
- `admin/staff_save.js`
- `admin/staff_detail.js`
- `admin/staff_toggle_active.js`
- `admin/staff_assignable_list.js`
- `admin/override_log_list.js`

### Customer admin
Examples now include:
- `admin/customers_list.js`
- `admin/customers_detail.js`
- `admin/customers_save.js`
- `admin/customers_delete.js`
- `admin/customer_tiers_list.js`
- `admin/customer_tiers_save.js`
- `admin/customer_tiers_delete.js`

### Promo admin
Examples now include:
- `admin/promos_list.js`
- `admin/promos_detail.js`
- `admin/promos_save.js`
- `admin/promos_toggle_active.js`
- `admin/promos_delete.js`

---

## 6) Key backend pattern change

The important `dev` branch shift is not only “more endpoints.”

It is:
- moving from shared-password-only admin logic
- toward role-aware API enforcement
- across bookings, progress, jobsite, time, media, signoff, staff, customers, and promos

Bridge reality:
- `ADMIN_PASSWORD` still exists

Current direction:
- resolve acting staff user
- apply capability checks
- scope detailer/senior-detailer work to allowed bookings
- keep customer tiers separate from security roles

---

## 7) Environments

Typical deployment setup:

### Preview
- branch builds
- Stripe test keys

### Production
- live domain
- Stripe live keys

The `dev` branch should be treated as the active development source for current admin/detailer work.

---

## 8) Cloudflare Pages environment variables

Required:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ADMIN_PASSWORD`

Stripe:
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_WEBHOOK_SECRET_GIFTS`

Future likely addition:
- real staff auth/session variables or supporting config when the login/session layer is added

---

## 9) R2 asset conventions

Images are served from:

- `https://assets.rosiedazzlers.ca`

Expected folder layout:
- `brand/`
- `packages/`
- `products/`
- `systems/`

Do not rename live asset files casually.  
Keep code paths aligned with actual uploaded filenames.

---

## 10) Route notes

`_redirects` provides clean routes for public and admin pages.

Still important:
- fully settle canonical structure for `services` and `pricing`
- avoid long-term duplicate route patterns

---

## 11) Database shape

Database schema is defined in:

- `SUPABASE_SCHEMA.sql`

Core data groups now include:

### Booking + scheduling
- `bookings`
- `date_blocks`
- `slot_blocks`

### Gifts + promos
- `gift_products`
- `gift_certificates`
- `promo_codes`

### Progress + delivery
- `job_updates`
- `job_media`
- `job_signoffs`

### Jobsite + time
- `jobsite_intake`
- `job_time_entries`

### Staff + customers
- `staff_users`
- `staff_override_log`
- `customer_profiles`
- `customer_tiers`

---

## 12) Current architecture notes

- Token-based progress is now the main customer progress direction.
- Shared admin password is still the bridge gate today.
- The project is moving toward role-based staff access:
  - Admin
  - Senior Detailer
  - Detailer
  - Customer
- Customer tiers remain business segmentation only.
- The codebase is shifting from a “site with admin pages” toward a more complete internal operations platform.

---

## 13) Development rules

- Avoid duplicating business logic between frontend and backend
- Prefer one canonical pricing/add-on source
- Keep JSON-driven content stable where possible
- Use additive changes instead of destructive rewrites unless cleanup is intentional
- Keep role/security logic clearly separate from loyalty/customer segmentation
- Avoid parallel old/new endpoint systems longer than necessary

---

## 14) Related repo docs

- `README.md` — project overview
- `PROJECT_BRAIN.md` — mental model of the system
- `DEVELOPMENT_ROADMAP.md` — next build order
- `SANITY_CHECK.md` — current status and priorities
- `SUPABASE_SCHEMA.sql` — schema foundation

## Additional new files

Recent auth/profile additions include:
- `assets/client-auth.js`
- `login.html`
- `my-account.html`
- `functions/api/client/auth_signup.js`
- `functions/api/client/auth_login.js`
- `functions/api/client/auth_me.js`
- `functions/api/client/auth_logout.js`
- `functions/api/client/profile_update.js`
- `functions/api/_lib/customer-session.js`
- `sql/2026-03-21_customer_auth_and_profile_fields.sql`


## Latest auth/progress/gift pass
- Added actual gift redemption writes through booking confirmation webhook using `gift_certificate_redemptions`.
- Added staff/detailer observation-thread posting through `progress_comments`.
- Added notification queue hooks through `notification_events` for customer email/SMS preference flows.
- Added richer customer/staff profile field direction and a current schema snapshot in `DATABASE_STRUCTURE_CURRENT.md`.


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

## New files/endpoints added in this pass
- `sql/2026-03-24_recovery_threads_catalog_alerts.sql`
- `functions/api/admin/recovery_message_preview.js`
- `functions/api/admin/progress_comment_moderate.js`
- `functions/api/admin/catalog_low_stock_list.js`
- `functions/api/admin/catalog_reorder_request.js`


## March 24 2026 pass update
- Added PayPal deposit checkout flow alongside Stripe.
- Completed booking-time gift redemption through checkout, including zero-due gift confirmation when the deposit is fully covered.
- Switched booking checkout pricing/add-on validation to the canonical public pricing JSON.
- Added annotation moderation endpoint and moderation controls in the jobsite workspace, plus thread visibility summaries in progress management.
- Added per-item quick quantity adjustments and stronger low-stock/reorder handling in Admin Catalog.
- Continued route metadata cleanup across remaining public pages.
