<!-- refreshed 2026-04-25: block-range town-page pass -->
> Documentation synchronized April 23, 2026: live vehicle-size SVG guide, App Management chart preview/download helper, no-DDL schema sync, and continued public SEO/static-check direction.

> Last synchronized: April 14, 2026. Reviewed during the App Management checkbox-alignment repair, package family/size-price clarification pass, pricing catalog UI polish, and docs/schema synchronization pass.

# Rosie Dazzlers — Admin/Detailer Refresh Changelog

## Scope of this refresh

This changelog summarizes the major admin/detailer backend expansion documented on the `dev` branch.

It is meant as a quick reference for:
- what has been added
- what architectural direction changed
- what still remains

---

## Major direction change

The project moved from:

- a mostly shared-password admin toolset

toward:

- a role-aware admin/detailer backend foundation

This does **not** mean full staff authentication is complete yet.

It means the backend now has a much stronger structure for:
- scoped staff access
- role-aware operations
- override logging direction
- customer/staff/admin separation

---

## Main areas expanded

### 1) Booking operations
Added broader admin booking support for:
- search
- detail
- save
- confirm
- complete
- cancel
- delete
- availability check
- form bootstrap
- day schedule view

### 2) Jobsite operations
Added fuller jobsite workflow support for:
- intake save/list/detail/delete
- time save/list/delete
- media save/list/delete
- signoff save/list/delete

### 3) Progress operations
Expanded progress handling with:
- enable/disable progress sharing
- post/list/detail
- delete support
- token-oriented progress direction

### 4) Operations visibility
Added operational summary endpoints for:
- live work list
- dashboard summary
- day-level schedule visibility

### 5) Staff admin
Expanded staff-side admin structure with:
- current actor endpoint
- staff detail
- active toggle
- assignable list
- override log visibility

### 6) Customer admin
Expanded customer admin structure with:
- customers list/detail/save/delete
- customer tiers list/save/delete

### 7) Promo admin
Expanded promo admin structure with:
- promo list/detail/save
- active toggle
- delete

---

## Important architecture notes

### Token-based progress is preferred
Customer progress should continue to center on:
- `progress_token`
- `job_updates`
- `job_media`
- `job_signoffs`

### Customer tiers are not security roles
Customer tiers remain:
- business segmentation
- loyalty / profile grouping

They must not be mixed with:
- Admin
- Senior Detailer
- Detailer

### Shared password is still a bridge
`ADMIN_PASSWORD` still exists as a bridge layer.

The long-term direction is:
- real staff login/session
- real resolved staff identity
- cleaner role-aware internal access

---

## Tables central to this phase

### Booking / scheduling
- `bookings`
- `date_blocks`
- `slot_blocks`

### Progress / delivery
- `job_updates`
- `job_media`
- `job_signoffs`

### Jobsite / time
- `jobsite_intake`
- `job_time_entries`

### Staff / customer structure
- `staff_users`
- `staff_override_log`
- `customer_profiles`
- `customer_tiers`

### Business tools
- `promo_codes`
- `gift_certificates`

---

## What this phase did not finish

This refresh did **not** fully finish:

- real staff login/session auth
- booking-time gift redemption
- unified add-on pricing/config
- direct file upload from phone
- full cleanup of older/duplicate admin endpoint patterns
- final internal admin/detailer shell UX

---

## Recommended next phase

Most logical next development order:

1. real staff auth/session
2. consistent real staff identity across jobsite actions
3. gift redemption during booking
4. unified add-on source
5. direct upload flow
6. cleaner role-aware internal shell
7. cleanup of older endpoint patterns

---

## Bottom line

This phase substantially improved the backend foundation.

Rosie Dazzlers is now much closer to being:
- an internal operations platform
- not just a static site with a few admin tools

## Additional auth/profile expansion

After the admin/detailer refresh, the dev branch also gained:
- client login/sign-up foundation
- client account page foundation
- nav-level session status for public pages
- richer profile fields for future admin/client workflows


## Latest auth/progress/gift pass
- Added actual gift redemption writes through booking confirmation webhook using `gift_certificate_redemptions`.
- Added staff/detailer observation-thread posting through `progress_comments`.
- Added notification queue hooks through `notification_events` for customer email/SMS preference flows.
- Added richer customer/staff profile field direction and a current schema snapshot in `DATABASE_STRUCTURE_CURRENT.md`.


## Current snapshot — March 21, 2026

Latest pass completed:
- fixed booking add-on checkbox/text layout pressure
- improved service/package image fallback with extra photo cards
- expanded staff management toward richer Admin/Detailer profile editing
- added customer tier discount support in the UI/data model direction
- added/confirmed garage, gift, and redemption visibility in client/admin screens
- added current SQL for tier discounts and richer staff/customer fields

Current next priorities:
- picture-first observation interface
- richer client/detailer threaded comments UI
- manual scheduling / app-management rules UI completion
- final layout polish across booking and internal screens

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

## Pass 27 sync — 2026-04-24
- Fixed the `/api/admin/block_date` and `/api/admin/block_slot` save paths so they work with the current legacy `date_blocks(blocked_date)` and `slot_blocks(blocked_date, slot)` schema instead of writing non-existent `updated_at` columns.
- Added shared admin shell CSS for `.app-shell`, `.surface-grid-2`, `.toolbar-wrap`, and `.pill-grid`, which repairs the stretched internal menu layout on `admin-live.html` and moves `admin-blocks.html` into the same left-menu shell pattern.
- Tightened form-control CSS so admin date inputs, text boxes, and wrapped button rows stop overlapping; `admin-accounting.html` now uses more resilient auto-fit grids for filter, entry, and remittance controls.
- Expanded analytics reporting so `admin-analytics.html` now shows daily, weekly, monthly, and yearly traffic rollups with CSV export buttons, all generated from `site_activity_events` without adding a new reporting table in this pass.
- No new database migration was required in this pass. `SUPABASE_SCHEMA.sql` was refreshed to document that schedule blocks still use the legacy `blocked_date` / `slot` shape and that analytics reports are computed from `site_activity_events` at request time.

