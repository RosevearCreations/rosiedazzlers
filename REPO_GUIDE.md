# Rosie Dazzlers Repo Guide

## 1) What this repo is
A Cloudflare Pages site with:
- Static HTML pages (marketing + booking + gifts + catalogs)
- Cloudflare Pages Functions in `/functions`
- Data JSON in `/data`
- Images served from Cloudflare R2 (`assets.rosiedazzlers.ca`)
- Growing admin operations area for bookings, progress, jobsite, staff, customers, and live monitoring

## 2) Folder map (high level)

### Root HTML pages
- `index.html`
- `services.html` and/or `services/index.html` (choose one canonical path later)
- `pricing.html` and/or `pricing/index.html` (choose one canonical path later)
- `book.html`
- `gifts.html`
- `gear.html`
- `consumables.html`
- `contact.html`, `about.html`, `privacy.html`, `terms.html`, `waiver.html`
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

### `/assets`
- `site.css` — theme and shared layout
- `chrome.js` — shared nav/footer/banner/reviews behavior
- `site.js` — page helpers for services, pricing, booking, gear, consumables
- `config.js` — legacy/shared constants if still present

### `/data`
- `rosie_services_pricing_and_packages.json`
- `rosie_products_catalog.json`
- `systems_catalog.json`
- manifests and helper JSON files

### `/functions/api`
#### Booking + payments
- `checkout.js`
- `availability.js`
- `stripe/webhook.js`
- gifts endpoints

#### Admin booking ops
- `admin/bookings.js`
- `admin/assign_booking.js`
- `admin/booking_customer_link.js`

#### Admin block ops
- `admin/blocks.js`
- `admin/block_date.js`
- `admin/unblock_date.js`
- `admin/block_slot.js`
- `admin/unblock_slot.js`

#### Progress system
- `progress/view.js`
- `progress/signoff.js`
- `admin/progress_enable.js`
- `admin/progress_post.js`
- `admin/progress_media_post.js`
- `admin/progress_list.js`

#### Jobsite / live ops
- `admin/jobsite_intake_get.js`
- `admin/jobsite_intake_save.js`
- `admin/job_time_entry_post.js`
- `admin/job_time_entries_get.js`
- `admin/job_time_summary_get.js`

#### Staff / customer admin
- `admin/staff_list.js`
- `admin/staff_save.js`
- `admin/customer_profiles_list.js`
- `admin/customer_profiles_save.js`

## 3) Environments
Typically:
- Preview → Stripe test keys
- Production → Stripe live keys

## 4) Cloudflare Pages environment variables
Required:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ADMIN_PASSWORD`

Stripe:
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_WEBHOOK_SECRET_GIFTS`

## 5) R2 asset conventions
- `brand/`
- `packages/`
- `products/`
- `systems/`

## 6) Theme changes
Prefer changing variables in `assets/site.css` under `:root`.

## 7) Route notes
`_redirects` currently provides clean routes for public and admin pages.

## 8) Architecture notes
- Token-based progress is now the main customer progress direction.
- Admin still uses shared password gates today.
- Project is moving toward role-based access: Admin, Senior Detailer, Detailer, Customer.
- Customer loyalty segmentation is now documented via customer tiers: random, regular, silver, gold, vip.
