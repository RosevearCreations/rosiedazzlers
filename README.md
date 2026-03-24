<!-- README.md -->

# Rosie Dazzlers — Mobile Auto Detailing
Cloudflare Pages + Supabase + Stripe booking system

Modern static website with a serverless backend used by
Rosie Dazzlers Mobile Auto Detailing (Norfolk & Oxford Counties).

---

# System Architecture

Browser  
↓  
Cloudflare Pages (static site)  
↓  
Pages Functions (`/functions/api`)  
↓  
Supabase Database  
↓  
Stripe Payments  
↓  
Cloudflare R2 (images/assets)

---

# Stack

- Cloudflare Pages — static hosting + serverless backend
- Cloudflare R2 — public image hosting
- Supabase (Postgres) — database
- Stripe — booking deposits and gift certificate checkout

---

# Local Repo Structure

- `/*.html` — site pages
- `/assets/*` — shared CSS/JS (theme + nav/footer + helpers)
- `/data/*` — JSON data powering services, pricing, gear, consumables
- `/functions/api/*` — backend endpoints (Cloudflare Pages Functions)

---

# Key Pages

- Home: `/`
- Services: `/services` (choose canonical: `services.html` OR `services/index.html`)
- Pricing: `/pricing` (choose canonical: `pricing.html` OR `pricing/index.html`)
- Booking: `/book`
- Gifts: `/gifts`
- Gear: `/gear`
- Consumables: `/consumables`
- Admin: `/admin`

---

# Canonical Route Note

Currently both exist:

services.html  
services/index.html  

pricing.html  
pricing/index.html  

Choose **one canonical routing pattern** and remove the duplicate
version to avoid redirect or routing ambiguity.

Recommended: folder routes (`/services/index.html`).

---

# API Endpoints

## Booking

GET `/api/availability?date=YYYY-MM-DD`  
POST `/api/checkout`

Creates a Stripe checkout session for booking deposits.

---

## Stripe Booking Webhook

POST `/api/stripe/webhook`

Confirms deposit payments and updates booking status.

---

## Gift Certificates

POST `/api/gifts/checkout`  
POST `/api/gifts/webhook`  
POST `/api/gifts/receipt`

Handles gift certificate purchases and code retrieval.

---

## Admin API

POST `/api/admin/bookings`  
POST `/api/admin/block_date`  
POST `/api/admin/unblock_date`  
POST `/api/admin/block_slot`  
POST `/api/admin/unblock_slot`  
POST `/api/admin/progress_post`  
POST `/api/admin/progress_list`  
POST `/api/admin/assign_booking`  
POST `/api/admin/promo_create`  
POST `/api/admin/promo_list`  
POST `/api/admin/promo_disable`

Admin endpoints require the `ADMIN_PASSWORD`.

---

# Environment Variables (Cloudflare Pages)

Required:

SUPABASE_URL  
SUPABASE_SERVICE_ROLE_KEY  
ADMIN_PASSWORD  

Stripe:

STRIPE_SECRET_KEY  
STRIPE_WEBHOOK_SECRET  
STRIPE_WEBHOOK_SECRET_GIFTS  

Preview environments use Stripe **TEST** keys.  
Production uses Stripe **LIVE** keys.

---

# R2 Assets

The site expects an R2 custom domain:

https://assets.rosiedazzlers.ca

Folder layout used in code:

brand/  
packages/  
products/  
systems/  

Example:

https://assets.rosiedazzlers.ca/packages/Exterior Detail.png

---

# Database

Database schema is defined in:

SUPABASE_SCHEMA.sql

This file contains **create/repair SQL statements** for all tables
used by the application.

---

# Repo Documentation

Additional documentation included in the repository:

SANITY_CHECK.md — project status and development priorities  
REPO_GUIDE.md — repository structure and file map  
SUPABASE_SCHEMA.sql — database schema and repair script  

---

# Notes

- Booking capacity uses **AM / PM half-day slots**.
- A full-day booking uses **both slots**.
- Customers must confirm driveway access, power, and water during booking.
- Gift certificates are valid for **1 year** and are non-refundable.


## March 24, 2026 update

This repo now includes:
- persisted recovery template management and preview endpoints
- database-backed public catalog support with JSON fallback
- rated inventory fields for tools and consumables
- admin catalog and recovery pages
- two-sided progress threads with moderation states
- a refreshed schema snapshot in `SUPABASE_SCHEMA.sql`
- migration file: `sql/2026-03-24_recovery_inventory_moderation_and_checkout.sql`
