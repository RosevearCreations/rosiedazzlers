> Build 173 documentation sync (2026-05-24): Admin Content Center, FAQ editor APIs, expanded Help Articles access/content, public Help nav link, and schema no-DDL note were updated. See `DEVELOPMENT_ROADMAP.md`, `KNOWN_GAPS_AND_RISKS.md`, `COMPETETIVE_COMPLETION_MATRIX.md`, and `SANITY_CHECK.md` for the active plan.

> Build 172 documentation sync (2026-05-24): Public FAQ page/content access, `/api/public_faqs`, `public_faq_entries` SQL foundation, sitemap/nav/footer links, and competitive-matrix status were updated. See `DEVELOPMENT_ROADMAP.md`, `KNOWN_GAPS_AND_RISKS.md`, and `COMPETETIVE_COMPLETION_MATRIX.md` for the active plan.

# Build 171 documentation sync note

**Updated:** 2026-05-24

This Markdown file was reviewed during the Build 171 pass. Current source of truth remains `DEVELOPMENT_ROADMAP.md`. Build 171 adds the Admin Leads quote-starter workflow and no new DDL.

---
<!-- refreshed 2026-04-25: block-range town-page pass -->
> Documentation synchronized April 23, 2026: live vehicle-size SVG guide, App Management chart preview/download helper, no-DDL schema sync, and continued public SEO/static-check direction.

> Last synchronized: April 14, 2026. Reviewed during the App Management checkbox-alignment repair, package family/size-price clarification pass, pricing catalog UI polish, and docs/schema synchronization pass.

# Rosie Dazzlers — Next Steps Internal


Use this when you want the fastest answer to:
**“What should we do next?”**

---

## Immediate next priorities

### 1) Add real staff login / session handling
Current admin/detailer access still relies on a bridge model.

Need:
- real staff authentication
- session-aware admin/detailer pages
- backend trust in resolved staff identity
- less dependence on manual headers or typed names

Why first:
- role-aware backend patterns now exist
- the missing piece is real identity/session flow

---

### 2) Make all jobsite actions consistently use real staff identity
A lot of jobsite/admin flows now support staff-aware logic, but consistency still matters.

Need:
- consistent use of `staff_user_id`
- cleaner linkage for:
  - intake
  - progress
  - time
  - media
  - signoff
- less fallback reliance on typed names

Why next:
- better audit trail
- cleaner overrides
- fewer ambiguous records

---

### 3) Complete gift certificate redemption during booking
Gift purchase works, but booking-time gift redemption still needs the full loop.

Need:
- gift code validation
- remaining value lookup
- total reduction during booking
- remaining balance update
- mark fully redeemed when exhausted

Why next:
- closes a major customer-facing workflow gap

---

### 4) Unify add-on pricing/config
Add-ons still need a single canonical source.

Need:
- one structured source for add-ons
- frontend and backend reading the same values
- no pricing drift between display and checkout

Why next:
- prevents silent pricing mismatches

---

### 5) Add direct phone-friendly upload flow
Media records exist, but direct field upload still needs a proper path.

Need:
- signed upload URLs or direct storage integration
- mobile-friendly upload UX
- clean save into `job_media`

Why next:
- makes field use much more realistic
- removes friction for before/after uploads

---

### 6) Build a cleaner internal admin/detailer shell
There are now enough admin/detailer pages that navigation needs to mature.

Need:
- shared internal shell
- role-aware menu visibility
- better mobile workflow
- smoother movement between booking, progress, jobsite, live, staff, and customers

Why next:
- current pieces are strong enough to benefit from better structure

---

## Cleanup phase after that

### 7) Review older endpoints and duplicate patterns
Need:
- identify legacy shared-password-only paths
- reduce duplicate old/new patterns
- remove clearly obsolete routes once replacements are stable

### 8) Expand override logging consistency
Need:
- confirm all sensitive overwrite/delete actions write to `staff_override_log`
- make reason capture consistent

### 9) Grow customer + vehicle history
Need:
- deeper customer booking history
- future vehicle profile/history direction
- stronger repeat-customer context

### 10) Finish route cleanup
Need:
- settle canonical structure for services/pricing
- remove long-term route ambiguity

---

## What not to do next

Avoid spending the next phase on:
- adding lots of new isolated endpoints
- renaming live asset files casually
- mixing customer tiers with staff permissions
- building fancy admin UI before auth/session basics are ready
- keeping old/new admin flows in parallel longer than necessary

---

## If only one task is chosen

Pick:

**real staff login/session handling**

That is the most important next step because the backend is now strong enough to benefit from real identity and role-aware internal use.

---

## One-sentence summary

The next Rosie Dazzlers phase should focus on **real staff auth, consistent staff identity, gift redemption, upload flow, and internal workflow polish** rather than simply adding more disconnected backend pieces.

## March 31, 2026 sync
- progress screen now reuses signed file upload directly
- public catalog loaders moved further toward DB-first behavior
- no new SQL migration required in this pass

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
<!-- Last synchronized: April 5, 2026. Reviewed during the bookings/admin-route/date-picker/inventory/menu/CSS/mobile-fit pass. -->

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
