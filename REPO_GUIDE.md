> Last synchronized: March 30, 2026. Reviewed during the staff-session, time-flow identity, intake/media session hardening, booking/admin shell cleanup, and docs/schema synchronization pass.

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

## March 29, 2026 pricing/session/recovery/moderation pass
- public pricing pages now have a DB-first `/api/pricing_catalog_public` endpoint so services, pricing, gifts, and booking can reduce hard-coded JSON drift while keeping bundled fallback behavior.
- more legacy fallback use was removed from signoff, recovery, notification, moderation, and low-stock endpoints by preferring session-only role-aware access.
- admin recovery now has a recovery audit list endpoint, and jobsite/progress detail endpoints now support visibility filtering to make moderation review more practical.
- purchase-order reminder logging now also creates an internal notification-event trail, moving reminder lifecycle closer to a fuller operational audit path.
- this pass continues to reduce the gaps, but the remaining work is still the final elimination of the last legacy-only screens/endpoints, broader mobile upload reuse, and complete operational convergence.


## March 30, 2026 promo compatibility pass
- Admin promo creation now sends the minimal canonical promo payload (`code`, `is_active`, `discount_type`, `discount_value`, `starts_at`, `ends_at`, `description`) to reduce schema drift against the live `promo_codes` table.
- This pass specifically removes older create-path dependence on legacy promo fields like `active`, `applies_to`, `percent_off`, and `amount_off_cents` during promo creation.


## March 30, 2026 repo note
The current pass mainly touches `admin-promos.html`, `book.html`, and a further batch of `functions/api/admin/*` session-access routes. The docs/schema files were refreshed again to reflect promo-schema reconciliation and continued session-first cleanup.

## March 30, 2026 session-first cleanup pass
- Reduced bridge risk again by removing legacy admin fallback from another active set of endpoints, including progress posting/upload, customer-profile save/list, booking customer linking, unblock actions, and app-settings access.
- Tightened browser-side admin calls so active internal pages send `x-admin-password` only when a transitional password is actually present instead of always attaching the header shape.
- Continued doc/schema synchronization and public-page SEO/H1 review for the current build.

## March 30, 2026 repo update
Current work in this pass focused on `functions/api/admin/*` convergence: more booking, customer, staff, promo companion, and time endpoints now require the resolved staff session path instead of permitting the old bridge fallback.


## April 4, 2026 booking/query/vehicle/CSS fix pass
- Fixed the admin booking search query so it no longer requests a non-existent `bookings.updated_at` column on the live schema.
- Cleaned internal dashboard links away from `/admin.html` to `/admin` and added a safer admin redirect path.
- Tightened public/mobile UI again by shrinking the Services vehicle-size selector footprint, reducing the Pricing vehicle size chart preview, and forcing date/time inputs onto a light control surface for better picker visibility.
- Upgraded Book vehicle entry so year, make, and model now accept typed input with suggestion lists while still supporting default size/category/body inference and manual overrides.
- Continued docs/schema synchronization for the current build.


## April 4, 2026 booking/query/admin-route/mobile-fit follow-up
- Repaired the booking/admin search path again by removing another live reference to the non-existent `bookings.updated_at` column and continuing to normalize booking reads/writes against the live schema shape.
- Cleaned the admin dashboard pathing again so active internal links prefer `/admin` while static fallback routing still resolves to `admin.html` safely on Cloudflare Pages.
- Backed out automatic size/category forcing from Year/Make/Model guesses on Book so customers can type/select the vehicle and then confirm size/category manually when the guessed class is unreliable.
- Tightened Services/Pricing/date-input CSS again for smaller controls, visible date pickers on dark surfaces, smaller chart previews, and steadier mobile layout behavior.
- Continued Admin inventory workflow clarity by making add/reorder actions more explicit on the Admin Catalog screen.


## April 5, 2026 booking/admin-route/date-picker/inventory follow-up
- Continued fixing the booking/admin management pass by removing another stale `updated_at` assumption from active booking-path code and keeping internal dashboard navigation on `/admin` instead of broken `admin.html` links.
- Tuned Services/Pricing UI again by shrinking the vehicle-size selector vertically, increasing chart previews, and keeping date inputs dark while brightening the picker icon instead of forcing white boxes.
- Backed out automatic size/category assignment on Book so customers still get Year/Make/Model suggestions but confirm size and category manually when vehicle-class inference is unreliable.
- Surfaced Inventory more clearly for Admins through dashboard/menu wording and continued docs/schema synchronization for the current build.
<!-- Last synchronized: April 5, 2026. Reviewed during the bookings/admin-route/date-picker/inventory/menu/CSS/mobile-fit pass. -->


## April 5, 2026 Cloudflare Functions import-compatibility pass
- Added compatibility `_lib` shim files under `functions/_lib` and `functions/api/client/_lib` so Pages Functions builds do not fail when older or mixed relative import patterns are encountered during bundling.
- Surfaced Inventory and Accounting more clearly through Admin dashboard/menu routing and added pretty-route redirects for `/admin-catalog` and `/admin-accounting`.
- Continued docs/schema synchronization for the current build.


## April 5, 2026 functions build / install prompt / admin route / add-on image pass
- Added compatibility helper resolution paths for Pages Functions so mixed helper import patterns are less likely to fail during Cloudflare bundling.
- Restored the four missing Services add-on images by standardizing them to local PNG asset paths in both pricing catalog copies and both site script copies.
- Added a visible install-app prompt path and service-worker registration so the mobile field app can be offered for installation when the browser supports it.
- Added a real /admin/index.html route, kept /admin pathing stable, and made Inventory more obvious on the Admin dashboard and menu.
- Continued CSS/mobile tightening for service controls, date-picker visibility on dark UI, chart sizing, and anti-overlap behavior.
## April 5, 2026 chrome/widget/install/admin-image regression fix
- Repaired the shared public chrome script so the login/create-account widget and install-app prompt can render again.
- Fixed the Services-page fallback image map again for the four missing add-on cards and made the page respect add-on `image_url` values when present.
- Continued docs/schema synchronization for the current build.

