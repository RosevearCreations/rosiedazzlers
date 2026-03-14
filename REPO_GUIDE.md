<!-- REPO_GUIDE.md -->

# Rosie Dazzlers Repo Guide

## Purpose of this document

This document explains the structure of the Rosie Dazzlers repository
and where key components of the system live.

For development priorities and current project status see:

SANITY_CHECK.md

---

# 1) What this repo is

A Cloudflare Pages website with:

- Static HTML pages (marketing + booking + gifts + catalogs)
- Cloudflare Pages Functions (`/functions`) acting as the backend API
- JSON data in `/data`
- Images served from Cloudflare R2 (custom domain `assets.rosiedazzlers.ca`)
- Supabase Postgres database
- Stripe checkout for deposits and gift certificates

---

# 2) Folder map (high-level)

## Root HTML pages

index.html — home

services.html and services/index.html — **choose one canonical**

pricing.html and pricing/index.html — **choose one canonical**

book.html — booking form

gifts.html — gift certificate UI

gear.html — gear catalog

consumables.html — consumables catalog

contact.html  
about.html  
privacy.html  
terms.html  
waiver.html

---

## Admin UI pages

admin.html  
admin-booking.html  
admin-blocks.html  
admin-progress.html  
admin-upload.html  
admin-assign.html  
admin-promos.html  

Customer progress viewer:

progress.html

---

# 3) `/assets`

Shared site assets:

site.css — theme & global styling

chrome.js — shared navigation, footer, socials

site.js — services/pricing rendering helpers (also hover media)

config.js — constants (R2 base URL, pricing labels, charts)

---

# 4) `/data`

Static JSON used by pages:

rosie_services_pricing_and_packages.json — packages/pricing/add-ons

rosie_products_catalog.json — consumables catalog

systems_catalog.json — gear/systems catalog

*_manifest.json — file lists / inventory-like helpers

---

# 5) `/functions/api`

Backend endpoints (Cloudflare Pages Functions).

## Booking + availability

checkout.js  
availability.js  
stripe/webhook.js  

---

## Gifts

gifts/checkout.js  
gifts/webhook.js  
gifts/receipt.js  

---

## Admin

admin/bookings.js  
admin/block_date.js  
admin/block_slot.js  
admin/unblock_date.js  
admin/unblock_slot.js  
admin/progress_post.js  
admin/progress_list.js  
admin/assign_booking.js  
admin/promo_create.js  
admin/promo_list.js  
admin/promo_disable.js  

---

## Debug

debug/stripe_mode.js  
health.js  

---

# 6) Environments (dev vs prod)

Typical deployment setup:

Preview (branch builds)

dev.rosiedazzlers.pages.dev  
Stripe TEST keys

Production (main branch)

rosiedazzlers.ca  
Stripe LIVE keys

---

# 7) Cloudflare Pages environment variables

Required for BOTH preview and production:

SUPABASE_URL  
SUPABASE_SERVICE_ROLE_KEY  
ADMIN_PASSWORD  

Stripe keys:

STRIPE_SECRET_KEY  
STRIPE_WEBHOOK_SECRET  
STRIPE_WEBHOOK_SECRET_GIFTS  

---

# 8) R2 asset conventions

Images are served from the custom domain:

https://assets.rosiedazzlers.ca

Expected folder layout:

brand/  
packages/  
products/  
systems/

Example:

https://assets.rosiedazzlers.ca/packages/Exterior Detail.png

---

# 9) Theme customization

Theme variables are defined in:

assets/site.css

Inside the `:root` block.

Recommended pattern:

Only change variables for colors, spacing, shadows, etc.  
Avoid page-specific styling overrides.

---

# 10) Known route duplication (important)

The repo currently includes duplicate routes:

services.html and services/index.html

pricing.html and pricing/index.html

Choose ONE canonical routing style and remove the duplicate files.

---

# 11) Database

Database schema is defined in:

SUPABASE_SCHEMA.sql

Tables referenced by the application include:

bookings  
date_blocks  
slot_blocks  
promo_codes  
gift_products  
gift_certificates  
progress_updates  

Token-based progress system:

job_updates  
job_media  
job_signoffs  

---

# 12) Development rules

- Avoid duplicating business logic between frontend and backend
- Keep pricing and add-on definitions in one canonical source
- Prefer JSON configuration over hardcoded values
- Keep image paths consistent with R2 folder conventions

---

# 13) Related repo documents

README.md — project overview  
SANITY_CHECK.md — development priorities  
SUPABASE_SCHEMA.sql — database schema
