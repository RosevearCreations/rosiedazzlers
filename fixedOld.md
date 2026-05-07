<!-- refreshed 2026-04-25: block-range town-page pass -->
> Documentation synchronized April 23, 2026: live vehicle-size SVG guide, App Management chart preview/download helper, no-DDL schema sync, and continued public SEO/static-check direction.

> Last synchronized: April 14, 2026. Reviewed during the App Management checkbox-alignment repair, package family/size-price clarification pass, pricing catalog UI polish, and docs/schema synchronization pass.

## 2026-04-13 Pass 14 Sync
- Booking screen remains stable and should not be altered in future passes unless a critical bug appears.
- `_redirects` is working and treated as complete for the current route layout.
- Pricing/packages/add-ons/service areas/travel charges continue to flow through the App Management pricing control center as the preferred single entry point.
- This pass added office-facing finance adjustments for discounts/refunds plus customer-facing document work for order confirmation, invoice / summary, gift certificate printing, and social feed management.

> Pass sync April 15, 2026: generated local price-chart PNG assets from the canonical bundled pricing catalog, rewired chart fallbacks to `/assets/brand`, added a regeneration script, and refreshed docs/schema notes for the legacy price-image carry-forward pass.

Pass sync (2026-04-15): price references now use the generated local pricing charts, a local vehicle size chart was added, booking/job usage logs no longer reduce stock on hand automatically, and inventory now supports finished / defective / write-off stock actions for reorder and accounting follow-up.
- Pass sync 2026-04-16 (pass 21): added crew time/payroll workflow, staff availability blocks, payroll runs + accounting-post option, staff pay/work-cap settings, and service-time insight reporting; booking screen remains stable.

- Pass 22 sync: fixed admin-accounting date/input layout, moved admin-staff to a left-side internal menu layout, normalized admin login redirects to .html, and added clean admin route rewrites for payroll/staff/accounting/app/login.

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

> Refreshed during the 2026-04-30 product-linked landing-page pass.

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
