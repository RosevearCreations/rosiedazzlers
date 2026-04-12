> Last synchronized: April 11, 2026. Reviewed during the booking layout/date-picker repair, paged 21-day availability, structured service-area/bylaw logic, service-area filtering/reporting, analytics funnel/export expansion, deploy-smoke coverage pass, and docs/schema synchronization pass.

> Last synchronized: April 11, 2026. Reviewed during the live clean-route verification pass, remaining session-first internal-screen cleanup, operational profitability labor-estimate pass, route-collision cleanup, and docs/schema synchronization pass.

> Last synchronized: April 11, 2026. Reviewed during the route-safety hotfix carry-forward, crew-summary workflow pass, admin runtime timeout/text-fallback hardening pass, stress-check cleanup pass, and docs/schema synchronization pass.

> Last synchronized: April 10, 2026. Reviewed during the session-first admin recovery/live/progress app-shell pass, recovery audit visibility pass, static stress-check pass, and docs/schema synchronization pass.

> Last synchronized: April 10, 2026. Reviewed during the canonical add-on media recovery, crew assignment/senior detailer workflow, responsive app-shell tightening, stability checks, and docs/schema synchronization pass.

> Last synchronized: April 9, 2026. Reviewed during the add-on image restore, assignment identity normalization, month-end checklist, and docs/schema synchronization pass.

> Last synchronized: April 8, 2026. Reviewed during the accounting backend, payable/expense, month-end reporting, and docs/schema synchronization pass.

> Last synchronized: March 29, 2026. Reviewed during the staff-session, time-flow identity, intake/media session hardening, booking/admin shell cleanup, and docs/schema synchronization pass.

<!-- docs/REPO_RULES.md -->

> Last synchronized: March 26, 2026. Reviewed during the booking add-on imagery, catalog autofill, low-stock reorder UI, Amazon-link intake, local SEO, and docs/schema refresh pass.

> Last synchronized: March 24, 2026. This file was reviewed during the recovery/moderation/docs/schema refresh pass.

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
