> Last synchronized: April 14, 2026. Reviewed during the App Management checkbox-alignment repair, package family/size-price clarification pass, pricing catalog UI polish, and docs/schema synchronization pass.

# Rosie Dazzlers — AI Context Document

This document is designed to give any AI assistant immediate context about the Rosie Dazzlers system so it can help effectively without needing the entire repository.

This file should be pasted into new AI chats when requesting help with the project.

---

# Project Identity

Project Name  
Rosie Dazzlers — Mobile Auto Detailing

Business Area  
Norfolk County and Oxford County, Ontario, Canada

Primary Purpose  
Provide an online system where customers can:

• view detailing services  
• see pricing  
• book appointments  
• pay booking deposits  
• purchase gift certificates  
• receive progress updates about their vehicle  

Admins use the system to:

• manage bookings  
• block dates or AM/PM slots  
• assign staff  
• manage promo codes  
• upload progress photos and updates  

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
Cloudflare Pages

Serverless Backend  
Cloudflare Pages Functions

Database  
Supabase (Postgres)

Payments  
Stripe

Image Hosting  
Cloudflare R2

Public Asset Domain  
https://assets.rosiedazzlers.ca

---

# Repository Structure

Root HTML pages  
/*.html

Shared assets  
/assets

JSON data files  
/data

Backend API endpoints  
/functions/api

Database schema definition  
SUPABASE_SCHEMA.sql

Documentation  
README.md  
REPO_GUIDE.md  
SANITY_CHECK.md  
PROJECT_BRAIN.md  

---

# Important Pages

Home  
/

Services  
/services

Pricing  
/pricing

Booking  
/book

Gift Certificates  
/gifts

Gear Catalog  
/gear

Consumables Catalog  
/consumables

Admin Dashboard  
/admin

Customer Progress Viewer  
/progress

---

# Booking System Model

Bookings are based on half-day slots.

Available slots

AM  
PM  

A full-day booking uses both AM and PM.

Booking capacity is controlled by two tables:

date_blocks — blocks entire day  
slot_blocks — blocks AM or PM

Bookings are stored in the table:

bookings

Booking lifecycle states:

pending  
confirmed  
cancelled  
completed

Deposits are processed through Stripe checkout.

Stripe webhook endpoint:

/api/stripe/webhook

This webhook confirms deposits and updates booking status.

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

Gift certificates can represent:

• a specific service package  
• an open dollar value  

Certificates expire after **1 year**.

---

# Admin System

Admin pages allow operational control of the system.

Admin capabilities include:

• view bookings  
• change booking status  
• block calendar dates  
• block AM or PM slots  
• assign staff to bookings  
• upload progress photos  
• add progress notes  
• manage promo codes  

Admin API endpoints require the environment variable:

ADMIN_PASSWORD

---

# Progress Update System

Two progress systems currently exist.

Simple progress system

Table  
progress_updates

Endpoint  
/api/progress_list_public

This system is already functional.

---

Token-based secure progress system

Tables

job_updates  
job_media  
job_signoffs  

Endpoints

/api/progress/view  
/api/progress/signoff

This system uses a unique progress token attached to the booking.

Recommended long-term system: token-based progress system.

---

# Database Overview

Main operational tables

bookings  
date_blocks  
slot_blocks  
promo_codes  
gift_products  
gift_certificates  
booking_events  

Progress system tables

progress_updates

or

job_updates  
job_media  
job_signoffs  

The database schema is defined in:

SUPABASE_SCHEMA.sql

---

# Image Storage (Cloudflare R2)

Images are stored in R2 and served through the custom domain:

https://assets.rosiedazzlers.ca

Folder structure used by the site

brand/  
packages/  
products/  
systems/

Example

https://assets.rosiedazzlers.ca/packages/Exterior Detail.png

---

# Environment Variables

Cloudflare Pages environment variables

SUPABASE_URL  
SUPABASE_SERVICE_ROLE_KEY  
ADMIN_PASSWORD  

Stripe configuration

STRIPE_SECRET_KEY  
STRIPE_WEBHOOK_SECRET  
STRIPE_WEBHOOK_SECRET_GIFTS  

Preview environments use Stripe TEST keys.

Production uses Stripe LIVE keys.

---

# Development Rules for AI Assistants

When modifying this project:

Do not duplicate pricing logic between frontend and backend.

Use JSON configuration files when possible instead of hardcoding data.

Keep image paths consistent with the R2 folder structure.

Follow the API patterns already used in `/functions/api`.

Avoid introducing frameworks that conflict with the static site architecture.

Preserve the serverless design.

---

# Known Development Priorities

See SANITY_CHECK.md for the authoritative list.

Important current tasks include:

• resolving duplicate routes for services and pricing  
• aligning add-on pricing definitions between frontend and backend  
• cleaning up duplicate admin block endpoints  
• finishing the token-based progress update system  
• improving admin dashboard usability  

---

# Quick Mental Model

Rosie Dazzlers is essentially:

A static website  
+  
A serverless booking API  
+  
A Supabase database  
+  
Stripe payment processing  
+  
Cloudflare R2 image hosting  

All hosted through Cloudflare.

---

# How to Use This Document with AI

When starting a new AI session, paste this file first.

Then ask the AI for help with:

• debugging endpoints  
• improving booking flow  
• writing new admin tools  
• database queries  
• deployment issues  

This gives the AI enough context to operate effectively without needing the entire repository.


## March 24, 2026 update

This repo now includes:
- persisted recovery template management and preview endpoints
- database-backed public catalog support with JSON fallback
- rated inventory fields for tools and consumables
- admin catalog and recovery pages
- two-sided progress threads with moderation states
- a refreshed schema snapshot in `SUPABASE_SCHEMA.sql`
- migration file: `sql/2026-03-24_recovery_inventory_moderation_and_checkout.sql`

### March 25, 2026 pass note
This doc was refreshed during the vehicle catalog, progress-session, layout, and public catalog filter pass. The repo now includes NHTSA-backed vehicle make/model endpoints, a DB cache table for vehicle catalog rows, progress moderation/enable session upgrades, and public search/filter cleanup on Gear and Consumables.

<!-- Last synchronized: April 8, 2026. Reviewed during the accounting access/admin dashboard/menu pass. -->


Route hotfix sync reviewed on 2026-04-11.

## 2026-04-11 pass 9 sync
- Booking flow now uses a clearer service-area selector with town-level choices across Oxford and Norfolk communities.
- Booking availability shows open, partial, and unavailable dates in the next 21-day snapshot, and the date picker contrast was tightened for dark mode.
- Year / Make / Model on booking is now typeable with datalist-assisted lookup and validation against the existing vehicle catalog.
- Public analytics was deepened with richer action tracking, viewport/session details, and location/device enrichment stored inside event payloads.
- Route-collision folders and temporary check artifacts were removed again to keep Pages routing stable.

## 2026-04-11 pass 11 sync note
- Tightened the booking preferred-date control so it no longer stretches wider than needed and added a visible white picker button.
- Public booking, services, and pricing pages now read the canonical pricing catalog API first and only fall back to bundled JSON if the API is unavailable.
- App Management now includes a pricing catalog editor so package prices, included services, add-ons, service-area rules, and chart links can be maintained from one source of truth.
- No schema shape change landed in this pass; `SUPABASE_SCHEMA.sql` was refreshed to note the pricing-catalog consolidation and booking UI tightening work.

> Pass update 2026-04-12: Re-synced the current uploaded build to the latest safe route structure. Removed duplicate clean-route folders that were reintroducing Cloudflare Pages redirect loops, preserved the newer booking experience already present in `book.html`, refreshed the deployed booking smoke check to recognize the shared `chrome.js` analytics bootstrap, and cleaned the login form autocomplete attributes. Immediate next step after deploy: verify `/`, `/services`, `/pricing`, `/book`, and `/admin` on the active branch before resuming larger feature work.

## April 12, 2026 operational note
- The booking screen is locked as stable for the current phase.
- Redirect handling is considered complete through `_redirects`.
- Pricing/package/add-on/service-area/travel-charge maintenance should be centered in `admin-app.html`.
- Accounting should review pricing through the pricing window in `admin-accounting.html` instead of creating a second competing pricing editor.

## 2026-04-13 Pass 14 Sync
- Booking screen remains stable and should not be altered in future passes unless a critical bug appears.
- `_redirects` is working and treated as complete for the current route layout.
- Pricing/packages/add-ons/service areas/travel charges continue to flow through the App Management pricing control center as the preferred single entry point.
- This pass added office-facing finance adjustments for discounts/refunds plus customer-facing document work for order confirmation, invoice / summary, gift certificate printing, and social feed management.

## Pass 14 AI context delta
- Booking page is stable; avoid further feature churn there.
- `_redirects` is treated as complete.
- Central pricing changes belong in App Management.
- Office-issued discounts/refunds and customer-doc actions belong in Admin Bookings.
- Current printable document set: order confirmation, invoice / summary, and gift certificate.
- Social surfaces now expect the latest five links per platform from central settings.

---

## Pass sync — 2026-04-14 (pass 16)

- Booking screen remains locked and stable.
- `_redirects` remains the working route layer and includes the admin-app trailing-slash compatibility line.
- App Management was repaired in this pass: the page now restores its missing helper functions, shows a proper internal menu mount, includes clearer feature descriptions, and exposes document/social defaults without crashing.
- Admin navigation now includes a visible path to App Management from the dashboard, shared admin menu, and return bar.
- No new database table or column changes were introduced in this pass; schema files were refreshed to reflect a no-DDL stability/documentation pass.
- Strongest next steps remain the single-entry pricing/accounting workflow, refund-credit memo document polish, and provider-tested email sending.

> Pass sync April 15, 2026: generated local price-chart PNG assets from the canonical bundled pricing catalog, rewired chart fallbacks to `/assets/brand`, added a regeneration script, and refreshed docs/schema notes for the legacy price-image carry-forward pass.

Update note — 2026-04-16 pass20: Added explicit admin route wrappers for social feed and vehicle catalog endpoints to stop Pages Function import-resolution failures on /api/admin routes. Booking remains stable; no schema DDL change in this pass.
- Pass sync 2026-04-16 (pass 21): added crew time/payroll workflow, staff availability blocks, payroll runs + accounting-post option, staff pay/work-cap settings, and service-time insight reporting; booking screen remains stable.

- Pass 22 sync: fixed admin-accounting date/input layout, moved admin-staff to a left-side internal menu layout, normalized admin login redirects to .html, and added clean admin route rewrites for payroll/staff/accounting/app/login.

## April 16, 2026 admin-nav and growth-direction pass

- standardized the top admin navigation so pages that boot through the shared admin shell now overwrite incomplete page-level nav link lists with one consistent internal menu bar plus account/logout controls.
- added new App Management sections for:
  - stronger self-serve quote + booking emphasis
  - scheduled e-gift delivery settings
  - maintenance / membership plan settings
- extended app settings loading so those three new settings keys are part of the shared office configuration pull.
- moved the public direction forward with:
  - stronger quote-first CTA messaging on the home and pricing pages
  - richer gift checkout inputs for recipient name and preferred send date
  - gift checkout metadata capture for recipient name, preferred send date, and gift message
- no schema DDL change was required for this pass; this was a workflow/settings/UI pass.

Pass sync: April 16, 2026 — top admin navigation standardized, app-management growth settings added, booking-led self-serve direction restored, and gift checkout now collects recipient name plus preferred send date.

---

## Pass 24 Sync — 2026-04-17

This pass focused on three areas:
- normalized the shared top admin navigation and repaired the off-pattern `admin-assign` header so the top menu matches the other admin screens more closely
- shifted the public self-serve direction back to a booking-led planner on the pricing page by embedding the live booking experience so customers keep the exact service-area restrictions, 21-day availability windows, slot logic, and booking aesthetics instead of using a separate quote-builder path
- continued the scheduled e-gift direction by exposing public growth settings, improving the gift message/send-date experience, and adding live recipient/delivery preview boxes on the gifts page

Schema impact for this pass: no new tables or columns. Existing `app_management_settings` is reused for public quote, e-gift, and membership display settings.

Pass sync: April 17, 2026 — pricing now restores the booking page as the first self-serve step by embedding the live booking planner on /pricing so service-area restrictions, 21-day availability windows, add-on logic, and booking aesthetics stay in one source of truth.
