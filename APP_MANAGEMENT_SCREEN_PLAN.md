# Build 174 update — Admin Leads quote/proposal drafts

**Updated:** 2026-05-24  
**Current build:** Build 174  
**Primary source of truth:** `DEVELOPMENT_ROADMAP.md`

Build 174 completes the next open competitive-matrix item after the quote starter: staff can now save generated quote starter text as a persistent quote/proposal draft from `/admin-leads.html`. This moves the workflow from copy-only follow-up toward a real quote pipeline while staying fallback-safe if the new table has not been applied yet.

## Completed in Build 174

1. Added `/api/admin/quote_proposal_drafts_save` for staff-protected quote/proposal draft creation and updates.
2. Added `/api/admin/quote_proposal_drafts_list` for staff-protected draft lookup by lead, booking, status, search, or id.
3. Updated `/admin-leads.html` and `/admin-leads/index.html` with **Save quote draft** and **Load drafts** actions on each public lead.
4. Added persistent draft display directly under the lead card so staff can see saved follow-up text before contacting a customer.
5. Added migration-safe fallback messages when the new draft table has not been applied yet.
6. Added SQL migration `sql/2026-05-24_build174_quote_proposal_drafts.sql`.
7. Updated `SUPABASE_SCHEMA.sql` and `DATABASE_STRUCTURE_CURRENT.md` with the quote/proposal draft table plan.
8. Added release guard `scripts/quote_proposal_drafts_build174_check.py` and wired it into `scripts/release_check.py`.
9. Re-ran Cloudflare Functions checks, one-H1 validation, and release checks.

## Active next steps after Build 174

1. Apply `sql/2026-05-24_build174_quote_proposal_drafts.sql` after the Build 167/168 lead SQL.
2. Browser-test `/admin-leads.html` by building a quote starter, saving it as a draft, and loading it again.
3. Add draft status controls for `needs_review`, `ready_to_send`, `sent`, `accepted`, and `declined`.
4. Add one-click lead → draft booking/quote conversion.
5. Add package/add-on price suggestions from the live pricing catalog.
6. Extend Admin Content Center to specials, service blurbs, homepage cards, and help articles.
7. Add service/town-aware proof filtering and media privacy enforcement before public gallery/social use.

---
> Build 173 documentation sync (2026-05-24): Admin Content Center, FAQ editor APIs, expanded Help Articles access/content, public Help nav link, and schema no-DDL note were updated. See `DEVELOPMENT_ROADMAP.md`, `KNOWN_GAPS_AND_RISKS.md`, `COMPETETIVE_COMPLETION_MATRIX.md`, and `SANITY_CHECK.md` for the active plan.

> Build 172 documentation sync (2026-05-24): Public FAQ page/content access, `/api/public_faqs`, `public_faq_entries` SQL foundation, sitemap/nav/footer links, and competitive-matrix status were updated. See `DEVELOPMENT_ROADMAP.md`, `KNOWN_GAPS_AND_RISKS.md`, and `COMPETETIVE_COMPLETION_MATRIX.md` for the active plan.

# Build 171 documentation sync note

**Updated:** 2026-05-24

This Markdown file was reviewed during the Build 171 pass. Current source of truth remains `DEVELOPMENT_ROADMAP.md`. Build 171 adds the Admin Leads quote-starter workflow and no new DDL.

---
<!-- refreshed 2026-04-25: block-range town-page pass -->
> Documentation synchronized April 23, 2026: live vehicle-size SVG guide, App Management chart preview/download helper, no-DDL schema sync, and continued public SEO/static-check direction.

> Last synchronized: April 14, 2026. Reviewed during the App Management checkbox-alignment repair, package family/size-price clarification pass, pricing catalog UI polish, and docs/schema synchronization pass.

# Rosie Dazzlers — App Management Screen Plan

This document captures the current split between Customer, Detailer, Senior Detailer, and Admin screens.

## Current policy
- Blocking time is Admin-only.
- Staff management is Admin-only.
- Manual schedule changes should remain Admin-only for now.
- Customer garage is self-managed by the client, but Admin can review it.
- Customer private admin notes should not be visible to detailers.
- Detailer private admin notes should not be visible to other detailers.

## Screen direction

### Customer
- garage of vehicles
- per-vehicle preferences
- live updates / progress thread
- booking history
- gift certificates and redemption history

### Detailer
- assigned-job workspace
- observation thread posting
- customer-facing notes only where allowed
- personal profile, hours, payout/tip history

### Admin
- everything detailers see where appropriate
- plus private notes
- plus role/pay/supervisor fields
- plus app management and time blocking


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

## 2026-04-22 doc sync

- reviewed during the merchandising / SEO / geofence refinement pass
- no file-specific workflow changes were required beyond the centralized roadmap, schema, repo-guide, and handoff updates

## Pass 27 sync — 2026-04-24
- Fixed the `/api/admin/block_date` and `/api/admin/block_slot` save paths so they work with the current legacy `date_blocks(blocked_date)` and `slot_blocks(blocked_date, slot)` schema instead of writing non-existent `updated_at` columns.
- Added shared admin shell CSS for `.app-shell`, `.surface-grid-2`, `.toolbar-wrap`, and `.pill-grid`, which repairs the stretched internal menu layout on `admin-live.html` and moves `admin-blocks.html` into the same left-menu shell pattern.
- Tightened form-control CSS so admin date inputs, text boxes, and wrapped button rows stop overlapping; `admin-accounting.html` now uses more resilient auto-fit grids for filter, entry, and remittance controls.
- Expanded analytics reporting so `admin-analytics.html` now shows daily, weekly, monthly, and yearly traffic rollups with CSV export buttons, all generated from `site_activity_events` without adding a new reporting table in this pass.
- No new database migration was required in this pass. `SUPABASE_SCHEMA.sql` was refreshed to document that schedule blocks still use the legacy `blocked_date` / `slot` shape and that analytics reports are computed from `site_activity_events` at request time.

<!-- Build 132 sync 2026-05-08: admin add-on image hydration, current-image preview, fallback media merge, no-DDL schema note, SEO/H1/CSS/media discipline reviewed. -->
<!-- Build 133 sync 2026-05-08: fixed Admin App add-on image hydration to prefer real PNG/R2 photos over SVG outlines, restored landingLinksToText helper, kept dev-branch workflow, and recorded no-DDL schema note. -->
<!-- Build 134 sync 2026-05-08: admin add-on save button, populated editor suggestions, landing-page media fields, local SEO metadata/structured-data, sitemap refresh, and no-DDL schema handoff reviewed. -->


<!-- Build 135 sync 2026-05-08: admin landing dropdown refresh, service-area fallback, inventory fallback merge, customizable option suggestions, one-H1/local SEO/schema handoff review. -->

<!-- Build 136 sync 2026-05-09: admin catalog click-to-edit, accounting pricing-window helper, sample reviews, pricing embed continuation, CSS/H1/link checks. -->

<!-- Build 141 sync 2026-05-14: reviewed during Norfolk/Oxford service-area, water-rule fallback, typeable booking location, local SEO, and docs/schema pass. -->

<!-- Build 143 sync 2026-05-15: public Consumables/Gear now merge DB catalog rows with bundled fallback catalogs so partial DB imports do not hide unedited items. -->

<!-- Build 146 sync 2026-05-15: Amazon CSV catalog matching/enrichment pass; docs/schema reviewed; keep one-H1, local SEO, CSS overflow, privacy-safe generated data, and DB-first inventory migration discipline. -->

<!-- Build 147 sync 2026-05-16: Admin App mergeServiceAreaRows repair, dropdown option editor, compact mobile navigation, release-check guardrails, root API duplicate cleanup, local SEO/H1 discipline. -->

<!-- Build 148 sync 2026-05-16: reviewed during landing photo/add-on page process/local SEO pass. Active details are in DEVELOPMENT_ROADMAP.md, KNOWN_GAPS_AND_RISKS.md, CURRENT_IMPLEMENTATION_STATE.md, SANITY_CHECK.md, and IMAGES.md. -->

<!-- Build 149 sync 2026-05-17: reviewed during Admin App service-area dropdown editor, save-feedback, Tillsonburg image fallback, local SEO/H1/CSS/release-check pass. -->

---

## Build 151 synchronization note

Updated 2026-05-18: active implementation moved to Admin Catalog media-library image picker support, selected-row image repair, duplicate-image diagnostics, browser image-health scan, `app_media_library` schema tracking, and continued local SEO/H1/CSS release discipline. See `DEVELOPMENT_ROADMAP.md`, `KNOWN_GAPS_AND_RISKS.md`, and `SANITY_CHECK.md` for the current working plan.

## Build 152 synchronization note

Reviewed during the 2026-05-18 Cloudflare Pages Functions deploy hotfix. No content-specific workflow change was required here; active handoff/schema docs carry the detailed Build 152 notes.

## Build 153 synchronization note

Reviewed during the 2026-05-19 Cloudflare Pages Functions import-path hotfix. No document-specific workflow change was required here; active handoff, roadmap, sanity, and schema docs carry the detailed Build 153 notes.

## Build 156 sync note - social progress publishing

Build 156 adds a reviewable social publishing foundation. Admin Progress can now create internal social drafts from job updates/media, Admin Social Queue can review and mark those drafts, and the schema now includes `social_channels`, `social_post_queue`, and `social_dispatch_attempts`. Direct posting to X, Facebook, Instagram, TikTok, Google Business Profile, and other platforms is possible later after the required platform credentials, app approvals, and consent/compliance checks are in place.

---

## Build 161 sync note

Build 161 keeps `DEVELOPMENT_ROADMAP.md` as the source of truth and advances the competitor-aligned conversion path with Booking service chooser guidance, package aliases, and photo-estimate CTAs.

---
> Build 174 documentation sync (2026-05-24): persistent quote/proposal drafts were added to Admin Leads with save/load APIs, SQL table foundation, schema notes, and release guard coverage. Quote starters remain copy-ready before the SQL is applied, but saved drafts require sql/2026-05-24_build174_quote_proposal_drafts.sql.


## Build 175 update — lead conversion, pricing suggestions, content expansion, gallery privacy, and analytics

- Added safe lead → draft booking/quote conversion using `public.lead_conversion_drafts` instead of creating live scheduled bookings too early.
- Added catalog-backed package/add-on price suggestions for Admin Leads from the current pricing catalog.
- Added quote draft status workflow controls: draft, needs review, ready to send, sent, accepted, declined, archived.
- Expanded Admin Content Center beyond FAQ with reusable content blocks for specials, service blurbs, homepage cards, help articles, trust proof, fleet, and maintenance copy.
- Added service/town filtering for the public before/after gallery and enforced public reuse only for approved-public/sample media.
- Added FAQ/help/lead/quote conversion analytics summary endpoint for admin reporting.
- Added SQL/schema sync in `sql/2026-05-25_build175_lead_conversion_content_gallery_analytics.sql`.

## Build 176 Update — conversion-to-booking, dashboard cards, and privacy warnings

- Added a reviewed conversion draft → real booking workflow so Admin Leads can create a live booking only after staff confirms service date, AM/PM slot, address, package, vehicle size, customer name, and customer email.
- Added Admin Analytics cards for FAQ/help/lead/quote conversion summary using `/api/admin/conversion_funnel_summary`.
- Added App Management media privacy readiness warnings using `/api/admin/media_privacy_review_summary` so gallery/social reuse is checked before publishing.
- Preserved the one-H1 exposed-page rule and kept local SEO wording/access paths focused on Oxford/Norfolk service discovery.
- Added Build 176 SQL/schema notes for `lead_conversion_drafts.converted_booking_id` and `lead_conversion_drafts.converted_at`.
> Build 177 documentation sync (2026-05-25): added protected conversion-draft review queue, catalog-backed final price reconciliation, local SEO proof coverage reporting, public gallery privacy badges, SQL/schema notes, and release guard coverage.


> Build 178 documentation sync (2026-05-25): conversion status saves, saved final price reviews, public content rendering, privacy badges, and proof recommendation work were reflected in the active docs/schema notes.

---

## Build 179 documentation sync — publish blocking, proof tasks, quote acceptance

Build 179 adds hard social publish blocking before webhook/API/manual posted actions, assignable local SEO proof tasks from proof recommendations, and customer-facing quote/proposal delivery plus accept/decline tracking. Schema tracking now points to `sql/2026-05-26_build179_publish_block_tasks_quote_acceptance.sql`. The one-H1 SEO rule, local service/town wording, and fallback-safe API pattern remain required on every pass.

---

### Build 180 update — accepted quote deposit/payment request and final booking confirmation

Build 180 connects the accepted quote workflow to a safer payment-request foundation. Staff can create a tracked deposit/payment request from an accepted quote/proposal draft, share the private `/quote-payment.html` customer page, mark deposits paid from Admin Leads, and link or confirm the final booking when a booking row is available. Schema tracking was updated for `public.quote_deposit_payment_requests` and the quote/conversion deposit status fields.

