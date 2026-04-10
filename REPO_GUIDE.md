> Last synchronized: April 9, 2026. Reviewed during the accounting actor normalization, receivables-aging, profitability, export expansion, auth/session convergence, and docs/schema synchronization pass.

> Last synchronized: April 8, 2026. Reviewed during the accounting backend, payable/expense, month-end reporting, and docs/schema synchronization pass.

> Last synchronized: March 29, 2026. Reviewed during the staff-session, time-flow identity, intake/media session hardening, booking/admin shell cleanup, and docs/schema synchronization pass.

<!-- REPO_GUIDE.md -->

> Last synchronized: March 26, 2026. Reviewed during the booking add-on imagery, catalog autofill, low-stock reorder UI, Amazon-link intake, local SEO, and docs/schema refresh pass.

> Last synchronized: March 25, 2026. This file was reviewed during the recovery/moderation/docs/schema refresh pass.

# Rosie Dazzlers Repo Guide

## Last synchronized
- March 25, 2026

## What this repo contains
A Cloudflare Pages project with:
- static HTML screens for public, customer, and admin use
- Pages Functions under `/functions/api`
- JSON data under `/data` (now primarily bundled fallback content for pricing/catalog where DB-backed settings/tables exist)
- SQL migrations under `/sql`
- Markdown operating docs at repo root

---

## Main folders
### Root HTML
Public/customer pages:
- `index.html`
- `services.html` and `services/index.html` (cleanup still pending)
- `pricing.html` and `pricing/index.html` (cleanup still pending)
- `book.html`
- `gifts.html`
- `gear.html`
- `consumables.html`
- `progress.html`
- `login.html`, `my-account.html`
- `about.html`, `contact.html`, `privacy.html`, `terms.html`, `waiver.html`

Internal/admin pages:
- `admin.html`
- `admin-booking.html`
- `admin-blocks.html`
- `admin-progress.html`
- `admin-jobsite.html`
- `admin-recovery.html`
- `admin-app.html`
- `admin-analytics.html`
- `admin-catalog.html`
- `admin-staff.html`
- `admin-customers.html`
- `admin-account.html`

### `/assets`
- `site.css` — shared styling
- `site.js` — shared rendering/helpers
- `chrome.js` — nav/footer/branding
- auth/admin helper scripts as added by prior passes

### `/data`
Canonical/fallback static content such as:
- `rosie_services_pricing_and_packages.json`
- gear/consumables/system catalog JSON
- site feature content

### `/functions/api`
Key groupings:
- booking / availability / gifts / payments
- admin booking/staff/customer tools
- progress / jobsite / moderation
- recovery / analytics / notifications
- public catalog feed

### `/sql`
Ordered migration history. New SQL should be additive and keep `SUPABASE_SCHEMA.sql` synchronized.

---

## Preferred direction rules
- Prefer token-based progress over legacy/simple progress paths.
- Prefer DB-backed public catalog data with safe JSON fallback.
- Prefer role-aware/staff-aware endpoints over older bridge-style ones.
- Prefer additive changes over destructive rewrites.
- Keep protected/admin/token pages out of search indexing.

## March 25, 2026 notable files
- `functions/api/_lib/pricing-catalog.js` — canonical pricing loader (DB setting first, JSON fallback)
- `functions/api/admin/progress_upload_url.js` — signed upload URL generator using staff sessions
- `functions/api/admin/catalog_purchase_orders_list.js` — purchase-order list/reminder view
- `functions/api/admin/catalog_purchase_order_update.js` — purchase-order status workflow updates


### March 25, 2026 pass note
This doc was refreshed during the vehicle catalog, progress-session, layout, and public catalog filter pass. The repo now includes NHTSA-backed vehicle make/model endpoints, a DB cache table for vehicle catalog rows, progress moderation/enable session upgrades, and public search/filter cleanup on Gear and Consumables.

## March 27, 2026 repository note
- `/book.html` is now a mobile-first wizard page.
- `/assets/chrome.js` owns the public account widget behavior.
- `functions/api/progress/view.js` is now responsible for suppressing internal-only updates from the customer-facing feed.


## March 29, 2026 guide note
Prefer the session-aware admin/detailer endpoints over any older shared-password-only admin path. If two endpoints appear to overlap, treat the role-aware version that imports `requireStaffAccess` as the current preferred direction.


## March 29, 2026 gift / upload / endpoint pass
- moved more admin endpoints off direct shared-password checks and onto session-aware `requireStaffAccess`, including customer-profile tooling, booking customer linking, and unblock date/slot actions.
- improved customer gift/account polish by adding dashboard gift summary totals and a signed-in gift balance checker on My Account.
- hardened the signed upload endpoint with media-type and file-size validation plus customer-visible/public-url handling guidance.
- continued DB-first cleanup and doc/schema synchronization for the current dev build.


## March 29, 2026 promo / blocks / purchase reminder pass
- promo list/create/disable and block date/slot actions now prefer signed-in staff session access through the shared role-aware auth helper instead of direct shared-password checks.
- booking_update and assign now log actor-attributed booking events while using the resolved current staff actor.
- purchase-order reminder lifecycle moved forward with reminder logging fields, a reminder action endpoint, and overdue reminder reporting in the purchase-order list endpoint.
- this reduced more of the old/new endpoint overlap and shared-password bridge risk, but did not fully eliminate every remaining legacy-only admin path yet.


## April 7, 2026 membership / mobile / deploy hardening pass
- Standardized the four missing Services add-on images onto local bundled asset paths and added real PNG copies so the service cards stop depending on fragile external image URLs.
- Added route-safe admin folder entry points and stronger Pages Functions helper shims so Cloudflare deploys are less sensitive to mixed helper import paths.
- Moved customer segmentation toward a scalable membership model by seeding Bronze, Silver, and Gold tiers and making new customer creation default to Bronze instead of a legacy placeholder tier.
- Continued mobile-fit and CSS hardening by tightening service-card/select sizing, overlap handling, and installable-app support through a shared install prompt + service worker path.


## April 8, 2026 admin route stabilization pass
- Repaired the current build by standardizing active admin navigation back to direct `.html` routes instead of mixed pretty-route/admin-folder assumptions.
- Restored the shared admin shell from the richer canonical copy so pages that call `window.AdminShell.boot(...)` load again.
- Kept compatibility folder `index.html` files for `/admin/`, `/admin-catalog/`, `/admin-accounting/`, `/services/`, and `/pricing/` while leaving direct `.html` links as the stable path for this build.

## April 8, 2026 accounting access and admin workflow pass
- Accounting access is now surfaced directly in the Admin dashboard, shared admin menu, and shared return toolbar so office-side accounting work is no longer hidden behind direct URL knowledge alone.
- This pass moves the roadmap and known gaps forward again by improving internal shell cohesion and operational discoverability without changing the underlying accounting schema.
- Suggested next mobile/operations features: quick expense entry from phone with receipt photo attachment, vendor quick-add during payable entry, and a month-end checklist panel for settlement, remittance, and report export.

<!-- Last synchronized: April 8, 2026. Reviewed during the accounting access/admin dashboard/menu pass. -->


## April 9, 2026 repository note
- `functions/api/_lib/accounting-gl.js` now also drives receivables-aging and estimated booking-profitability reporting/exports.
- `assets/admin-auth.js` is now stricter about normalizing internal page keys before capability checks.
- `sql/2026-04-09_accounting_actor_receivables_profitability.sql` adds accounting actor-id and receivables-support indexes.
