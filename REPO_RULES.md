> Last synchronized: April 1, 2026. Reviewed during the session-first recovery tooling, jobsite upload reuse, DB-first catalog fallback reduction, and docs/schema synchronization pass.

> Last synchronized: March 31, 2026. Reviewed during the known-gaps/risk reduction, DB-first catalog convergence, progress-page upload reuse, and docs/schema synchronization pass.

> Last synchronized: March 30, 2026. Reviewed during the staff-session, time-flow identity, intake/media session hardening, booking/admin shell cleanup, and docs/schema synchronization pass.

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

## March 31, 2026 reminder
- keep public exposed pages to one H1
- keep docs/schema in sync on every pass
- prefer DB-first shared sources over duplicated JSON when a stable endpoint already exists
- treat legacy admin fallback as transitional only

> Last reviewed in the April 2, 2026 blocks/risk convergence pass.

## April 3, 2026 UI / session / video pass
- Continued route-by-route UI cleanup by moving more admin pages toward signed-in staff session usage instead of password-only page flows.
- Tightened global CSS for dark-mode form usability, including calendar-icon visibility and better wrapping for row-based inputs/buttons on smaller screens.
- Refreshed the public video/social experience so YouTube remains the main playback surface while Instagram supports reels, work photos, and single-image proof-of-work posting.
- Continued docs/schema synchronization for the current build; no new schema migration was required in this pass.



## April 4, 2026 mobile shell / security / cleanup pass
- Tightened shared CSS again for mobile form wrapping, input/button crowding, and dark-mode date-picker visibility so calendar icons remain visible on dark surfaces.
- Added a real installable app shell foundation with `manifest.webmanifest`, `service-worker.js`, and an install banner so the field/detailer workflow feels more complete on phones.
- Continued mobile-first field direction by linking admins and detailers into the same live job workflow path; admins can still act as detailers and work through arrival, evidence capture, sign-off, and billing from the phone side.
- Reduced duplicate-route/file clutter slightly by renaming clearly unlinked legacy block endpoints and one accidental duplicate notes file with an `RM_` prefix for safe removal review.
- Still not honestly complete: full role-aware auth/session convergence on every remaining internal route, final actor normalization everywhere, and total retirement of all transitional bridge assumptions.

<!-- Last synchronized: April 4, 2026. Reviewed during the mobile fit / session cleanup / closeout pass. -->
