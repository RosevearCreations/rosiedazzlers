<!-- PROJECT_BRAIN.md -->

# Rosie Dazzlers — Project Brain

This document is the **one-page mental model of the entire Rosie Dazzlers system**.  
It is intended to give any developer or AI assistant instant context.

For detailed docs see:

README.md — project overview  
REPO_GUIDE.md — repo structure  
SANITY_CHECK.md — development priorities  
SUPABASE_SCHEMA.sql — database schema  

---

# System Purpose

Rosie Dazzlers is a **mobile auto detailing booking system** serving **Norfolk and Oxford Counties (Ontario)**.

The system allows customers to:

• View services and pricing  
• Book a detailing appointment  
• Pay a deposit through Stripe  
• Purchase gift certificates  
• View progress updates on their vehicle  

Admins can:

• Manage bookings  
• Block dates or time slots  
• Assign staff  
• Post progress updates and photos  
• Manage promo codes  

---

# System Architecture

Customer Browser  
↓  
Cloudflare Pages (static site)  
↓  
Cloudflare Pages Functions (`/functions/api`)  
↓  
Supabase Postgres Database  
↓  
Stripe (payments)  
↓  
Cloudflare R2 (image storage)

---

# Core Technologies

Hosting  
• Cloudflare Pages

Backend  
• Cloudflare Pages Functions (serverless)

Database  
• Supabase (Postgres)

Payments  
• Stripe

Image Hosting  
• Cloudflare R2  
• Custom domain: `https://assets.rosiedazzlers.ca`

---

# Key Site Pages

Home  
`/`

Services  
`/services`

Pricing  
`/pricing`

Booking  
`/book`

Gift Certificates  
`/gifts`

Gear Catalog  
`/gear`

Consumables Catalog  
`/consumables`

Admin Dashboard  
`/admin`

Customer Progress Viewer  
`/progress`

---

# Booking System Model

Bookings use **half-day slots**.

Slots:

AM  
PM  

A full-day job uses **both slots**.

Capacity is controlled through:

• `date_blocks` — entire day blocked  
• `slot_blocks` — AM or PM blocked  

Bookings are stored in the **bookings** table.

Booking lifecycle:

pending → confirmed → completed / cancelled

Stripe deposit confirmation occurs through:

`/api/stripe/webhook`

---

# Gift Certificate System

Gift certificates are purchased separately from bookings.

Flow:

Customer → `/gifts`  
↓  
Stripe checkout session  
↓  
Stripe webhook  
↓  
Gift certificate created in database  
↓  
Customer receives gift code

Gift certificates include:

• fixed service value  
• open dollar value  

Certificates expire after **1 year**.

---

# Admin System

Admin pages allow operational control of the business.

Admin capabilities include:

• View bookings  
• Change booking status  
• Block calendar dates  
• Block AM/PM slots  
• Assign staff  
• Post progress updates  
• Upload photos/videos  
• Manage promo codes  

Admin endpoints are protected by:

`ADMIN_PASSWORD`

---

# Progress Update System

Two systems currently exist:

### Simple system

Table:
`progress_updates`

Used by:

`/api/progress_list_public`

---

### Token-based secure system

Tables:

`job_updates`  
`job_media`  
`job_signoffs`

Used by:

`/api/progress/view`  
`/api/progress/signoff`

Recommended long-term system: **token-based progress system**.

---

# Database Overview

Core tables:

bookings  
date_blocks  
slot_blocks  
promo_codes  
gift_products  
gift_certificates  
booking_events  

Progress system tables:

progress_updates  

or

job_updates  
job_media  
job_signoffs  

---

# Image Storage (R2)

Images are stored in Cloudflare R2 and served via:

https://assets.rosiedazzlers.ca

Folders used by the site:

brand/  
packages/  
products/  
systems/

Example:

https://assets.rosiedazzlers.ca/packages/Exterior Detail.png

---

# Environment Variables

Cloudflare Pages environment variables:

SUPABASE_URL  
SUPABASE_SERVICE_ROLE_KEY  
ADMIN_PASSWORD  

Stripe:

STRIPE_SECRET_KEY  
STRIPE_WEBHOOK_SECRET  
STRIPE_WEBHOOK_SECRET_GIFTS  

Preview environments use Stripe **TEST keys**.  
Production uses Stripe **LIVE keys**.

---

# Key Repo Directories

Root HTML pages  
`/*.html`

Shared assets  
`/assets`

JSON content data  
`/data`

Backend API  
`/functions/api`

Database schema  
`SUPABASE_SCHEMA.sql`

---

# Known Design Decisions

• Static site for speed and simplicity  
• Serverless backend for booking logic  
• Stripe handles all payments  
• Supabase stores business data  
• R2 stores all images and media  
• JSON files power catalog pages

---

# Current Development Priorities

See:

SANITY_CHECK.md

Primary open tasks include:

• resolving duplicate routes  
• unifying add-on pricing definitions  
• improving admin tools  
• finishing token-based progress system  

---

# Quick Mental Model

Rosie Dazzlers is essentially:

A **static website**  
+  
A **serverless booking API**  
+  
A **Supabase database**  
+  
**Stripe for payments**  
+  
**R2 for images**

All hosted through **Cloudflare**.


---

# March 2026 architecture notes

Additional persisted layers now expected by the current build:

Recovery / messaging
- `recovery_message_templates`
- `app_management_settings` key: `recovery_provider_rules`

Inventory / purchasing
- `catalog_inventory_items`
- `catalog_low_stock_alerts`
- `catalog_purchase_orders`

Moderation / threads
- `job_updates.parent_update_id`
- `job_updates.thread_status`
- `job_media.thread_status`

Public catalog strategy now supports database inventory first, with JSON fallback.
Checkout now supports canonical pricing JSON plus gift-aware deposit reduction.
