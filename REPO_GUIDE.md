> Last synchronized: April 16, 2026. Reviewed during the App Management checkbox-alignment repair, package family/size-price clarification pass, pricing catalog UI polish, and docs/schema synchronization pass.

## April 15, 2026 repo guide note
- Legacy pricing chart assets now live at `/assets/brand/CarPrice2025.PNG` and `/assets/brand/CarPriceDetails2025.PNG`.
- Rebuild helper: `/scripts/generate_pricing_chart_images.py`.
- Bundled chart metadata lives in both `data/rosie_services_pricing_and_packages.json` and `functions/api/data/rosie_services_pricing_and_packages.json`.


# Rosie Dazzlers Repo Guide

## April 14, 2026 repo note
- `admin-app.html` remains the single current entry point for package/add-on/service-area/travel pricing edits.
- The package editor currently stores family rows with size-based columns rather than one row per size variant.


## Last synchronized
- March 26, 2026

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
- Removed duplicate clean-route wrapper folders for `/admin`, `/admin-catalog`, `/admin-accounting`, `/services`, and `/pricing`; `_redirects` remains the working compatibility layer.

## April 8, 2026 accounting access and admin workflow pass
- Accounting access is now surfaced directly in the Admin dashboard, shared admin menu, and shared return toolbar so office-side accounting work is no longer hidden behind direct URL knowledge alone.
- This pass moves the roadmap and known gaps forward again by improving internal shell cohesion and operational discoverability without changing the underlying accounting schema.
- Suggested next mobile/operations features: quick expense entry from phone with receipt photo attachment, vendor quick-add during payable entry, and a month-end checklist panel for settlement, remittance, and report export.

<!-- Last synchronized: April 8, 2026. Reviewed during the accounting access/admin dashboard/menu pass. -->


## April 9, 2026 repository note
- `functions/api/_lib/accounting-gl.js` now also drives receivables-aging and estimated booking-profitability reporting/exports.
- `assets/admin-auth.js` is now stricter about normalizing internal page keys before capability checks.
- `sql/2026-04-09_accounting_actor_receivables_profitability.sql` adds accounting actor-id and receivables-support indexes.


## April 9, 2026 pass notes
- Run `sql/2026-04-09_accounting_month_end_checklist.sql` after pulling this pass.
- Test `admin-accounting.html` month-end checklist save/load for at least one month.
- Re-test `admin-booking.html`, `admin-assign.html`, `services.html`, and `book.html` to confirm the restored add-on imagery and resolved-staff assignment flow.

## April 10, 2026 repo note
- `functions/api/admin/booking_assignment_map.js` is the new helper endpoint for loading crew assignments by booking id.
- `sql/2026-04-10_booking_crew_assignments_and_app_shell_hardening.sql` must be run before multi-detailer crews are fully live.
- `data/rosie_services_pricing_and_packages.json` now carries add-on image fields and should be treated as the bundled canonical fallback for add-on media metadata.


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

## April 12, 2026 repo-guide note
- `book.html` is a stable public screen in this phase.
- `_redirects` is the accepted route compatibility layer.
- `admin-app.html` now carries the preferred pricing control center.
- `admin-accounting.html` contains the accounting-side pricing summary window.
- `_lib/pricing-catalog.js` and `functions/api/_lib/pricing-catalog.js` must stay synchronized because pricing/admin work depends on the same catalog contract everywhere.

## 2026-04-13 Pass 14 Sync
- Booking screen remains stable and should not be altered in future passes unless a critical bug appears.
- `_redirects` is working and treated as complete for the current route layout.
- Pricing/packages/add-ons/service areas/travel charges continue to flow through the App Management pricing control center as the preferred single entry point.
- This pass added office-facing finance adjustments for discounts/refunds plus customer-facing document work for order confirmation, invoice / summary, gift certificate printing, and social feed management.

## Pass 14 repo guide addendum
- `functions/api/_lib/booking-documents.js`: shared builder for tokenized customer document payloads and queued confirmations.
- `functions/api/document_booking_public.js`: public token-based booking document endpoint.
- `functions/api/social_feed_public.js` + `assets/social-feed.js`: central social-feed API + renderer.
- `order-confirmation.html`, `invoice.html`, `gift-certificate-print.html`: new printable customer documents.
- `sql/2026-04-13_booking_documents_discounts_and_social_feed.sql`: pass 14 schema addition and settings note.

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

## New internal workflow files
- `admin-payroll.html` — crew availability, hours, payroll, and service-time insights
- `functions/api/_lib/payroll.js` — payroll/time summary and payroll-run helper logic
- `functions/api/admin/payroll_summary.js` — internal summary endpoint
- `functions/api/admin/payroll_run_save.js` — save/post payroll runs
- `functions/api/admin/staff_availability_*` — availability block CRUD endpoints
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
- 2026-04-17 pass26: extended booking-led self-serve with live embedded planner summaries on pricing and service-gift redemption preview, plus richer gift delivery metadata (sender name, preferred send date, message) through checkout, webhook, receipt, and printable certificate.

### April 17, 2026 pass27 note
- moved the next public growth step forward with a new `/maintenance-plan` page, recurring-plan waitlist capture, admin visibility for recurring reminder candidates, and stronger booking-link carry-forward from the live embedded planner.

---
Pass 28 sync — 2026-04-20
- Continued the booking-led self-serve direction instead of replacing it with a separate quote-only tool.
- Added scheduled e-gift delivery automation groundwork and live processor routes, plus printable gift lookup by code.
- Moved recurring maintenance reminders from interest-list based to customer-history based, so reminder timing now keys off completed bookings and real last-service dates while the interest list stays available for demand tracking.
- Strengthened visible live-booking / availability prompts and refreshed the documentation/schema trail for this pass.


<!-- pass29-sync: customer-history recurring maintenance reminders -->


> Pass sync April 20, 2026: customer screen raw JSON blocks were replaced with readable summaries and a visual garage layout, App Management social feeds gained a structured editor with the raw JSON moved into an advanced block, booking-led maintenance interest now requires Complete Detail selection before schedule interest capture, and customer-facing print/email correspondence styling was refined.


<!-- pass31-sync: booking overflow polish, maintenance conversion from complete detail, fleet handoff path -->
> Pass sync April 20, 2026: booking vehicle inputs and service cards were tightened to prevent text overflow, My Account now uses a real garage-bay view plus a fleet handoff path after 6 vehicles, and maintenance conversion now begins only after a completed Complete Detail with repeat-booking guidance tied to actual service history.

> Pass sync April 21, 2026: added mileage and next-service mileage capture, customer vehicle image/video library groundwork, garage-bay photo support, a public before/after slider gallery, admin vehicle-media override/delete tools, and detailer arrival geolocation capture groundwork.

## 2026-04-22 merchandising pass — local image scoring / SEO / geofence refinement

- upgraded customer vehicle media from the older rule-only score into a stronger local merchandising score that now blends file presence, dimensions, orientation, alt text, crop history, brightness, contrast, sharpness, background consistency, subject fill, duplicate-angle penalty, and a later-image lifestyle bonus
- `my-account.html` now analyzes images in-browser before upload using EXIF-aware decode, local canvas sampling, and preview guidance so customers get stronger front-end feedback before save
- the upload preview now shows a local preflight summary with background, subject fill, sharpness, brightness, contrast, and duplicate-angle hints while still allowing videos to remain a manual-review media type
- `functions/api/client/vehicle_media_save.js` now persists `media_analysis` and passes existing rows into `functions/api/_lib/vehicle-media-scoring.js` so duplicate-angle penalties can be applied at save time too
- `functions/api/_lib/booking-location.js` now prefers explicit service-area coordinates when they exist in the pricing/service-area metadata, then falls back to local service-area lookup keys and county fallback centroids
- public SEO copy was tightened again on `services.html`, `pricing.html`, `contact.html`, and `gallery.html` with clearer local-search wording while preserving a single H1 per exposed page
- schema/migration sync for this pass lives in `sql/2026-04-22_vehicle_media_merchandising_score.sql`, `sql/2026-04-21_vehicle_media_gallery_geofence.sql`, and `SUPABASE_SCHEMA.sql`
- next-step direction is still the same operational split: local scoring + EXIF-aware orientation + guide-led framing now, optional cloud smart-assist later only if you want object recognition or damage-style analysis
