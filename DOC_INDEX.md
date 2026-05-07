<!-- refreshed 2026-04-25: block-range town-page pass -->
> Documentation synchronized April 25, 2026: folder-backed clean-route repair, special-service landing pages, recent-work public proof blocks, sitemap refresh, and roadmap/handoff updates added.

## April 25, 2026 route hardening + landing-page visibility pass
- Replaced the fragile clean-route dependency on `_redirects` with real folder-backed `index.html` route pages for the main public and admin screens to prevent recurring Cloudflare Pages redirect loops.
- Added dedicated landing pages for ceramic coating, pet hair removal, odor removal, headlight restoration, and paint correction.
- Added reusable recent-work proof mounts from the public before/after gallery and surfaced review proof / service-area wording more prominently on home, services, pricing, and the new landing pages.
- Updated `sitemap.xml`, smoke/static checks, and the Markdown handoff set so the next chat starts from the live route-fix + visibility-expansion state.
- No database DDL was added in this pass; `SUPABASE_SCHEMA.sql` was synchronized as a no-DDL documentation refresh.

## Marked next best steps
- Keep the folder-backed clean-route approach as the live deployment baseline unless a future router replaces it completely.
- Build town-focused landing pages next for the strongest search towns first: Tillsonburg, Woodstock / Ingersoll, Simcoe / Delhi, and Port Dover.
- Keep recent work, review proof, and social freshness visible on the public entry pages so new visitors see current activity before they contact or book.
- Connect Google Search Console and Google Business Profile performance metrics later as a separate reporting layer once the internal rollups are stable.
- Treat analytics rollup totals as operational counts when summed across buckets until a true cross-window de-duplication strategy is added.

> Last synchronized: April 22, 2026. Reviewed during the live SVG pricing-chart, structured-data local SEO, static-check hardening, and docs/schema synchronization pass.

## April 22, 2026 doc index note
- Use this pass when handing off pricing/public SEO work: live chart rendering now starts in `assets/pricing-catalog-client.js`, with page use in `pricing.html` and `services.html`.
- Schema files were refreshed as a no-DDL pass.

> Last synchronized: April 14, 2026. Reviewed during the App Management checkbox-alignment repair, package family/size-price clarification pass, pricing catalog UI polish, and docs/schema synchronization pass.

# Rosie Dazzlers — Documentation Index

> Last synchronized: March 26, 2026. Reviewed during the booking add-on imagery, catalog autofill, low-stock reorder UI, Amazon-link intake, local SEO, and docs/schema refresh pass.

Use this file as the quick map to the main Markdown documents for the `dev` branch.
Last synchronized: March 24, 2026.

## Read first
- `README.md` — project overview and current direction
- `PROJECT_BRAIN.md` — mental model
- `CURRENT_IMPLEMENTATION_STATE.md` — what changed recently
- `KNOWN_GAPS_AND_RISKS.md` — current risks and remaining gaps
- `DEVELOPMENT_ROADMAP.md` — next implementation order
- `REPO_GUIDE.md` — repo structure and path map
- `SUPABASE_SCHEMA.sql` + `DATABASE_STRUCTURE_CURRENT.md` — schema truth

## Workflow docs
- `HANDOFF_NEXT_CHAT.md` — quick continuation note for a new chat
- `NEXT_STEPS_INTERNAL.md` — short operational next-move list
- `SANITY_CHECK.md` — high-level project health snapshot
- `BRANCH_WORKFLOW_NOTE.md` — `dev` branch rule reminder

## Important rule
When architecture changes, refresh the docs above together so the handoff stays reliable.

### March 25, 2026 pass note
This doc was refreshed during the vehicle catalog, progress-session, layout, and public catalog filter pass. The repo now includes NHTSA-backed vehicle make/model endpoints, a DB cache table for vehicle catalog rows, progress moderation/enable session upgrades, and public search/filter cleanup on Gear and Consumables.

<!-- Last synchronized: April 8, 2026. Reviewed during the accounting access/admin dashboard/menu pass. -->

## April 9, 2026 focus refresh
- The most current pass centers on Admin Accounting, inventory cost completeness, export expansion, and local-search housekeeping.


## April 9, 2026 focus refresh — second pass
- The most current pass centers on auth/session convergence for protected internal routes plus receivables-aging and profitability reporting in Accounting.


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
- `functions/api/client/vehicle_media_save.js` now persists `media_analysis` and passes existing rows into `functions/api/_lib/vehicle-media-scoring.js` so duplicate-angle penalties can be applied at save time too
- `functions/api/_lib/booking-location.js` now prefers explicit service-area coordinates when they exist in the pricing/service-area metadata, then falls back to local service-area lookup keys and county fallback centroids
- public SEO copy was tightened again on `services.html`, `pricing.html`, `contact.html`, and `gallery.html` with clearer local-search wording while preserving a single H1 per exposed page

## Pass 27 sync — 2026-04-24
- Fixed the `/api/admin/block_date` and `/api/admin/block_slot` save paths so they work with the current legacy `date_blocks(blocked_date)` and `slot_blocks(blocked_date, slot)` schema instead of writing non-existent `updated_at` columns.
- Added shared admin shell CSS for `.app-shell`, `.surface-grid-2`, `.toolbar-wrap`, and `.pill-grid`, which repairs the stretched internal menu layout on `admin-live.html` and moves `admin-blocks.html` into the same left-menu shell pattern.
- Tightened form-control CSS so admin date inputs, text boxes, and wrapped button rows stop overlapping; `admin-accounting.html` now uses more resilient auto-fit grids for filter, entry, and remittance controls.
- Expanded analytics reporting so `admin-analytics.html` now shows daily, weekly, monthly, and yearly traffic rollups with CSV export buttons, all generated from `site_activity_events` without adding a new reporting table in this pass.
- No new database migration was required in this pass. `SUPABASE_SCHEMA.sql` was refreshed to document that schedule blocks still use the legacy `blocked_date` / `slot` shape and that analytics reports are computed from `site_activity_events` at request time.


## New April 24, 2026 review file
- `LOCAL_VISIBILITY_REVIEW_2026-04-24.md` — sanity-check findings, competitor/market review, and the next local visibility action list.

## 2026-04-25 note
Use DEVELOPMENT_ROADMAP.md, KNOWN_GAPS_AND_RISKS.md, CURRENT_IMPLEMENTATION_STATE.md, HANDOFF_NEXT_CHAT.md, and NEW_CHAT_STATUS.md first for the newest pass details.

## 2026-04-27 index note
Use `NEW_CHAT_STATUS.md`, `DEVELOPMENT_ROADMAP.md`, `KNOWN_GAPS_AND_RISKS.md`, and `SUPABASE_SCHEMA.sql` first when handing off the new accounting workflow foundation pass.

## 2026-04-30 doc note
- Roadmap / handoff docs were refreshed for the product-linked landing-page pass.
- `IMAGES.md` — image inventory, page image needs, and which Admin App editor controls each image slot.

---

## Build 124 Documentation Sync — 2026-05-01

This documentation file was reviewed during the Build 124 pass. The current patch focuses on Services/Pricing booking embed clipping, embedded calendar/date-box rendering, add-on and consumable image containment, table/card overflow guards, internal link checks, one-H1 verification, shared media-base migration, and compatibility fallbacks for older `job_time_entries` tables without `minutes`.


---

## Build 125 console repair sync — 2026-05-01

This file was reviewed during the Build 125 Services/Pricing booking embed repair pass. The active fix removes the `/book?embed=1` console error `groups.index is not a function` by replacing the invalid array call with guarded `indexOf(...)` logic in both `book.html` and `book/index.html`. The booking embed layout helper now fails safely and still triggers a height postback, so a layout helper issue should not prevent the Step 1 calendar/date boxes from rendering on Services or Pricing.

No new database DDL was required in this pass. Schema tracking was updated with `sql/2026-05-01_build125_booking_embed_indexof_no_ddl_note.sql`; the existing payroll compatibility migration `sql/2026-04-30_job_time_entries_minutes_compatibility.sql` remains the required DDL patch for older live databases.

## Build 126 compact vehicle embed repair — 2026-05-01

This file was reviewed during the Build 126 Services/Pricing booking embed repair pass. The active fix gives the embedded `/book?embed=1` planner full-width space on Services and Pricing, removes the embed-only override that stacked every vehicle field one-per-line, and restores compact two/three-column vehicle rows similar to the full Book page. The vehicle inputs/selects now use smaller embedded padding, the login/garage prompt is hidden inside the embed to save height, and the iframe default/fallback height was retuned so the full Step 1 vehicle section is visible without reintroducing the long empty scrollbar.

No database DDL was required. Schema tracking was updated with `sql/2026-05-01_build126_embed_vehicle_compact_no_ddl_note.sql`. Continue to keep Services/Pricing as booking-led local SEO pages with one clear H1, Oxford/Norfolk wording, compact card/table overflow guards, and shared media-base handling instead of page-level hardcoded image/video URLs.


## Build 128 admin/catalog/checkout/local SEO pass - 2026-05-01

- Fixed Admin App location landing-page dropdowns by seeding editable town/location drafts when the saved `landing_pages` setting is empty. This keeps local SEO pages visible in the builder and ready for Tillsonburg, Woodstock/Ingersoll, Simcoe/Delhi, and Port Dover edits.
- Compact Admin Catalog inventory tables and pinned the Edit inventory item form to the top of its panel so long inventory lists do not stretch the editor down the page.
- Updated booking checkout to retry safely when optional modern booking columns are missing in Supabase, reducing customer-facing 500 failures while preserving full data when the latest migrations are present.
- Adjusted Step 2 service-card title contrast so package names stay readable on dark cards.
- Normalized zero/missing add-on prices to show Quote required instead of $0.00.
- Stabilized Admin Accounting date inputs so P&L, Balance Sheet, and other date filters appear as consistent rectangular fields.
- SEO hygiene kept: local town wording remains prominent, public pages should keep one clear H1, and future content updates should continue building proof/review/gallery blocks around Norfolk and Oxford County searches.

## Build 129 update — Admin Catalog inventory reload after save

- Fixed the Admin Catalog inventory workflow so saving one edited item no longer hides the rest of the local seeded inventory list.
- The inventory page now merges saved database rows with remaining local catalog fallback rows until the full catalog is migrated into `catalog_inventory_items`.
- After saving an individual inventory item, the full inventory list reloads and the saved item remains in the editor so the next item can be selected immediately.
- `catalog_inventory_save.js` now attempts to preserve cost, SKU, purchase date, estimated jobs per unit, sort order, subcategory, and reuse policy, with a compatibility fallback for older schemas that are missing optional columns.
- SEO/CSS habit remains unchanged: public pages should keep one clear H1, local wording in titles/headings, and compact admin tables that do not stretch rows unnecessarily.

<!-- Build 130 sync 2026-05-06: reviewed during sanity-check/admin image/accounting roadmap pass; keep one-H1, local SEO clarity, CSS overflow, image fallback, and schema handoff discipline. -->
