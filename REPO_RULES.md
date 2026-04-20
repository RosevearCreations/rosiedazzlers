> Last synchronized: April 14, 2026. Reviewed during the App Management checkbox-alignment repair, package family/size-price clarification pass, pricing catalog UI polish, and docs/schema synchronization pass.

# Rosie Dazzlers — Repository Rules

This document defines the **non-negotiable rules** for modifying the Rosie Dazzlers codebase.

These rules exist to prevent architectural drift and ensure that future development (human or AI) maintains the intended design of the system.

Any AI assistant helping with this repository **must follow these rules**.

---

# 1) Preserve the Architecture

The Rosie Dazzlers platform is intentionally built as:

Static Website  
+  
Serverless API  
+  
Supabase Database  
+  
Stripe Payments  
+  
Cloudflare R2 Image Hosting

Architecture flow:

Browser  
↓  
Cloudflare Pages (static site)  
↓  
Pages Functions (`/functions/api`)  
↓  
Supabase (Postgres)  
↓  
Stripe  
↓  
R2 storage

Do **not** introduce frameworks or changes that break this architecture.

---

# 2) Do Not Introduce Frontend Frameworks

This project is intentionally a **static HTML site**.

Do not introduce:

React  
Next.js  
Vue  
Angular  
Svelte  
Astro  

Static HTML + JavaScript is the intended design.

---

# 3) Backend Must Remain Serverless

Backend logic must remain inside:


/functions/api


Do not introduce:

Express servers  
Node hosting services  
Docker containers  
Persistent backend services  

All backend logic must run through **Cloudflare Pages Functions**.

---

# 4) Do Not Duplicate Business Logic

Business rules must exist in **one place only**.

Examples:

Pricing logic  
Add-on definitions  
Promo code rules  
Package definitions  

Preferred location for business configuration:


/data/*.json


Both frontend and backend should read from the same source.

---

# 5) Do Not Hardcode Asset Paths

Images must follow the R2 asset structure.

Base domain:

https://assets.rosiedazzlers.ca

Folders:

brand/  
packages/  
products/  
systems/

Do not hardcode new asset locations that break this structure.

---

# 6) Database Schema Changes

Database schema is defined in:


SUPABASE_SCHEMA.sql


Rules:

• do not create tables outside this file  
• keep schema changes backward compatible  
• use `create table if not exists` patterns  
• use `add column if not exists` when modifying tables  

All schema updates must be reflected in this file.

---

# 7) Protect the Booking System

The booking system is the **core business logic**.

Key files:


/functions/api/checkout.js
/functions/api/availability.js
/functions/api/stripe/webhook.js


Changes to booking logic must preserve:

AM / PM slot system  
date_blocks  
slot_blocks  
deposit checkout flow  
Stripe webhook confirmation

Do not alter booking flow without careful validation.

---

# 8) Protect the Gift Certificate System

Gift certificates are intentionally **separate from bookings**.

Key endpoints:


/api/gifts/checkout
/api/gifts/webhook
/api/gifts/receipt


Do not merge gift logic into the booking system.

---

# 9) Admin Endpoints Must Remain Protected

Admin API endpoints must require:


ADMIN_PASSWORD


Never expose admin endpoints publicly without authentication.

---

# 10) Avoid Introducing State on the Frontend

The frontend should remain simple and stateless.

Avoid:

complex client-side frameworks  
persistent client state systems  
local database storage  

State belongs in the database.

---

# 11) Respect the Documentation System

This repository includes structured documentation.

README.md — project overview  
PROJECT_BRAIN.md — system overview  
AI_CONTEXT.md — AI guidance  
REPO_GUIDE.md — repo structure  
SANITY_CHECK.md — development priorities  
DEVELOPMENT_ROADMAP.md — next upgrades  
SUPABASE_SCHEMA.sql — database schema  

Any major change should update the relevant documentation.

---

# 12) Prefer Simple Solutions

When adding features:

Prefer

simple JavaScript  
JSON configuration  
serverless functions  

Avoid unnecessary complexity.

The goal is a **maintainable small-business platform**, not an enterprise framework.

---

# Final Rule

If a proposed change makes the system:

• harder to understand  
• more complex to deploy  
• dependent on new infrastructure  

then it is likely **the wrong change**.

Always favor the simplest architecture that preserves functionality.

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

## 2026-04-13 Pass 14 Sync
- Booking screen remains stable and should not be altered in future passes unless a critical bug appears.
- `_redirects` is working and treated as complete for the current route layout.
- Pricing/packages/add-ons/service areas/travel charges continue to flow through the App Management pricing control center as the preferred single entry point.
- This pass added office-facing finance adjustments for discounts/refunds plus customer-facing document work for order confirmation, invoice / summary, gift certificate printing, and social feed management.

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

Pass sync: April 16, 2026 — top admin navigation standardized, app-management growth settings added, booking-led self-serve direction restored, and gift checkout now collects recipient name plus preferred send date.

---

## Pass 24 Sync — 2026-04-17

This pass focused on three areas:
- normalized the shared top admin navigation and repaired the off-pattern `admin-assign` header so the top menu matches the other admin screens more closely
- shifted the public self-serve direction back to a booking-led planner on the pricing page by embedding the live booking experience so customers keep the exact service-area restrictions, 21-day availability windows, slot logic, and booking aesthetics instead of using a separate quote-builder path
- continued the scheduled e-gift direction by exposing public growth settings, improving the gift message/send-date experience, and adding live recipient/delivery preview boxes on the gifts page

Schema impact for this pass: no new tables or columns. Existing `app_management_settings` is reused for public quote, e-gift, and membership display settings.

Pass sync: April 17, 2026 — pricing now restores the booking page as the first self-serve step by embedding the live booking planner on /pricing so service-area restrictions, 21-day availability windows, add-on logic, and booking aesthetics stay in one source of truth.
- 2026-04-17 pass26: extended booking-led self-serve with live embedded planner summaries on pricing and service-gift redemption preview, plus richer gift delivery metadata (sender name, preferred send date, message) through checkout, webhook, receipt, and printable certificate.
