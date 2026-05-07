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

# NEW CHAT STATUS

This pass continued the public pricing/SEO work by moving the vehicle size guide into the same live SVG system and adding an App Management preview/download helper for staff.

## What changed

- /pricing now renders the price chart, package-details chart, and vehicle size guide as live SVG tables from the shared pricing helper
- /services now opens live SVG chart renders for price, package details, and vehicle size guide in the preview modal
- App Management now includes a Live chart helper inside Advanced raw catalog JSON so staff can preview/download the current editor JSON as SVG charts
- assets/pricing-catalog-client.js now owns reusable helpers for live price, details, and vehicle-size SVG generation plus pricing/services JSON-LD payloads
- packaged PNG chart assets remain useful as emergency references/fallbacks, but the public pricing/size-chart direction is now live-generated first
- docs and schema notes were refreshed as a no-DDL pass

## What did not change

- no new tables or columns were added
- book.html was left untouched
- vehicle-media scoring/crop-editor work was not reopened in this pass

## Current strongest next steps

- manually test the App Management SVG preview/download helper after deploy
- continue route-by-route structured-data validation after deploy using live rendered pages
- continue the vehicle-media crop/editor hardening path separately from pricing/public SEO work
- keep polishing mobile admin layout where dense pricing rows still stack tightly on small screens

> Last synchronized: April 23, 2026. Reviewed during the live vehicle-size guide, App Management chart helper, SEO/static-check carry-forward, and docs/schema synchronization pass.

## Pass 27 sync — 2026-04-24
- Latest pass finished: admin schedule block save error repaired, admin form/menu CSS drift reduced, and analytics expanded into a real reporting page with daily/weekly/monthly/yearly traffic exports.
- No DB migration to run in this pass.
- Best next chat focus: deployed visual QA for accounting/blocks/live screens, then optional report scheduling / rollup storage if raw analytics volume grows.

## Pass 28 sync — 2026-04-24
- Latest pass finished: analytics rollup foundation added, rollup refresh endpoint added, live-route loop fix prepared for `/services` and `/pricing`, and a competitor/local visibility review was added to the docs.
- DB migration to run in this pass: `sql/2026-04-24_site_activity_rollups.sql`.
- Best next chat focus: deploy/verify clean routes, refresh rollups, then build the first service-specific and town-specific local landing sections.

## 2026-04-25 pass summary
- Fixed: block page can now block a whole time frame at once.
- Fixed: block page includes a calendar-style availability display.
- Fixed: pricing page embedded planner no longer grows without limit in the codebase.
- Added: Tillsonburg, Woodstock/Ingersoll, Simcoe/Delhi, and Port Dover location pages.
- No schema migration required in this pass.



This build adds a stable /pricing embedded planner height, bundled review-proof fallback art, and a year-end accounting package/export path for Ontario-friendly bookkeeping handoff.


No schema migration is required in this pass.

## 2026-04-27 handoff status
Completed in this pass:
- fixed the missing Rosie Dazzlers reviews image on pricing/local proof sections by hard-wiring the bundled fallback asset
- added accounting workflow foundation tables + admin UI for:
  - bank reconciliation
  - vendor / invoice / bill document links
  - recurring expenses
  - payroll payout reconciliation
  - accountant lock / close workflow
- added period-lock enforcement to journal posting

Important next move:
- run `sql/2026-04-27_accounting_workflow_foundation.sql` before using the new accounting workflow sections live

- Added admin-managed landing page builder with dropdown editors for add-ons and location pages.
- Added generic clean-route landing page support under /landing/<slug> via a single non-looping rewrite.
- Existing special-service and town pages now render from landing-page content settings so their copy can be maintained from App Management.


- 2026-04-29 pass: restored add-on image merge safety, kept add-on editor in single-dropdown mode, and expanded town/add-on landing pages with stronger local facts, official links, and service process content.

## 2026-04-30 pass status
- Finished: linked consumables into add-on landing pages, expanded the current add-on pages into fuller money pages, created additional folder-backed add-on pages, and upgraded the landing-page renderer plus admin builder to support products / official links / things-to-know fields.
- Finished: expanded town pages with stronger local-value notes and official-source sections.
- Remaining: landing-page gallery management, richer Search Console / GBP reporting integration, and a reusable DB-backed add-on-to-product relationship system.

## 2026-04-30 image and landing pass
- Restored real add-on images in the pricing catalog fallback and live page buttons.
- Combined add-ons and special detailing pages into one image-backed button section on Services and Pricing.
- Removed the stray add-on section below the town pages on Pricing.
- Increased embedded booking panel heights and message-handled resize limits on Services and Pricing to reduce internal scrollbars.
- Added IMAGES.md documenting where images are needed and which Admin App editor controls them.

- Latest repair pass fixed the `/pricing` landingData crash, reduced embedded booking height on Services/Pricing by splitting Step 1 into two columns, improved the mobile nav to a wrapped two-column dropdown, added seeded consumables/gear fallback to Admin Catalog, and patched payroll time queries to stop requesting the missing `job_time_entries.staff_name` column.


## 2026-04-30 Services / pricing planner and payroll compatibility patch
- Reduced the embedded booking planner's fixed iframe height on Services and Pricing, added dynamic resize handling, and set the iframe to eager/no-scroll so the booking calendar does not leave a long empty scrollbar.
- Changed the booking availability window to render the date range immediately, show "Checking availability…" date pills, fetch the 21-day window in parallel with a timeout, and fall back to disabled/unavailable pills instead of staying on "Loading availability window…".
- Restored the missing pricing-page lower-section card CSS for add-on/service buttons, town cards, and local-proof blocks.
- Hardened payroll summary loading when the live database is missing `job_time_entries.minutes`; event-based work timers continue to summarize, manual minute rows default to `0` until the SQL patch is applied.
- Added `sql/2026-04-30_job_time_entries_minutes_compatibility.sql` to bring older databases up to the current job time entry schema.

## 2026-05-01 Build 124 pass — booking embed, media sizing, and CSS/link hardening

- Repaired the Services and Pricing embedded booking planner cutoff by compacting the embedded Step 1 calendar layout, raising the dynamic iframe resize ceiling, and adding a timed resize fallback if the postMessage height event is delayed.
- Availability now has a stronger startup path because vehicle make/model API failures fall back to manual-entry datalists instead of stopping the date-window render.
- Reset add-on and consumable image presentation to `object-fit: contain` with centered positioning so uploaded product/add-on art is not cropped or zoomed inside cards.
- Added global CSS guards for tables, cards, panels, and media so long labels/links wrap instead of pushing outside their boxes.
- Corrected the Services page title/canonical/schema wording so `/services` is treated as a services page, not a duplicate pricing page.
- Added shared media-base support through `window.RD_ASSET_BASES` and continued migration away from page-specific hard-coded image URL constants.
- Internal HTML link scan completed with no missing root-relative page links found in this build.
- H1 check completed for exposed HTML pages; pages remain within the one-H1 rule.
- Schema note added: no new DDL in this pass; keep the 2026-04-30 job time entries minutes compatibility SQL applied for payroll/manual-minute completeness.

### Additional 2026-05-01 admin fallback note

- Added extra job-time compatibility fallbacks for dashboard and jobsite detail endpoints. If a live database has not applied the `job_time_entries.minutes` compatibility patch yet, those screens now avoid hard-failing and can still summarize event-pair work_start/work_stop durations where available.

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

## Build 127 update — embed cap, admin add-ons, gallery image guidance

- Capped the Services/Pricing booking iframe shell and frame to 1950px so Step 1 no longer expands to the previous 2450px height.
- Added bundled service-area fallback rows for Oxford County and Norfolk County so the booking location dropdown is not empty if the DB setting is missing service areas.
- Fixed Admin App select/dropdown readability on dark screens.
- Improved the Admin App add-on editor so selecting an existing add-on shows image URLs, fallback image, default prices, standalone/package relationship, and the one-to-one / one-to-many / general rule summary.
- Fixed the Landing Page Builder dropdown refresh so changing the selected add-on/location keeps the selected item and updates the text boxes instead of snapping back to the first option.
- Reworked the home page “Recent work and visible proof” block into a before/after slider using the existing before_after_gallery content, defaulted to a 50% split.
- Services and Pricing add-on cards now show default price text and include both Add to booking and Open page actions.
- Expanded IMAGES.md with image sizes, upload/switch-out workflow, add-on image fields, and multi-entry before/after gallery JSON examples.
- Added SQL no-DDL note: sql/2026-05-01_build127_ui_gallery_embed_admin_no_ddl_note.sql.


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

## Build 130 sanity-check pass — 2026-05-06

This pass fixed the Admin App add-on/special-detail landing editor so selecting an existing add-on now brings in the current catalog image as the default hero/gallery media when the landing page has no page-specific image saved. The editor also shows a visible current-image preview so the image URL can be copied, replaced, or left as the catalog fallback.

### Next 20 value-added steps
1. Finish DB-backed media management so add-on, service, gallery, proof, package, and landing-page images can be selected from approved media records instead of pasted URLs.
2. Add a media replacement workflow with upload, preview, crop score, alt text, consent status, and publish/unpublish controls.
3. Move remaining duplicated JSON seed data into either DB tables or a generated DB-backed JSON manifest so public pages and admin screens read the same source.
4. Add a landing-page performance checklist per town/service page: title, one H1, meta description, local wording, proof image, FAQ, CTA, and sitemap status.
5. Add sitemap automation for admin-created `/landing/` pages and known clean-route service pages.
6. Add Search Console / Business Profile review fields in Admin App so impressions, clicks, calls, and local proof updates can be logged per page.
7. Finish service-area/location controls with service coordinates, travel tier, parking/access notes, and customer-facing fallback text.
8. Add admin-managed before/after galleries per landing page, not only a single shared gallery JSON setting.
9. Add booking abandonment and quote follow-up triggers tied to selected package/add-ons and customer location.
10. Add a customer vehicle garage so repeat customers do not retype vehicle details every booking.
11. Add add-on dependency explanations on public add-on cards so quote-only, package-only, and standalone rules are clear before checkout.
12. Add mobile-first admin quick-edit screens for the most common actions: update image, update price, update landing copy, update inventory quantity.
13. Add stronger checkout diagnostics: save failed payload metadata to an admin-visible error log without storing sensitive payment data.
14. Add a booking review queue for jobs that are quote-required, outside service area, weather-sensitive, or missing access details.
15. Add inventory-to-service costing rules so consumables can automatically estimate material cost per package/add-on.
16. Add purchase receiving and stock adjustment audit trails for consumables and shop supplies.
17. Add vendor defaults and preferred supplier fields for each inventory/consumable record.
18. Add analytics rollups for service pages, add-on pages, gallery views, booking starts, booking completions, and checkout failures.
19. Add a month-end operations dashboard combining bookings, payroll, inventory usage, tax, payables, receivables, and profit by package.
20. Add deployment QA automation that checks one H1, broken internal links, CSS overflow risk, required image fallbacks, and admin route availability each build.

### Backend accounting sanity check
Covered foundations: chart/account list, journal entry storage, P&L and balance sheet reporting, tax/remittance reporting, payables settlement, owner/equity reporting, GL CSV export, payroll-run accounting posting, booking profitability views, month-end checklist records, and year-end handoff direction.

High-value accounting gaps to close next: direct receipt/invoice/statement uploads, bank-statement import and matching, Stripe/PayPal fee reconciliation, HST/GST remittance packet export, AR aging tied to unpaid bookings/invoices, AP aging tied to vendor bills, inventory/COGS posting from consumable usage, payroll deduction/liability breakdowns, period-lock enforcement across every accounting write path, accountant-ready export bundle with GIFI mapping notes, and a clear close checklist that blocks year-end completion until missing documents/reconciliations are resolved.

<!-- Build 130 sync 2026-05-06: reviewed during sanity-check/admin image/accounting roadmap pass; keep one-H1, local SEO clarity, CSS overflow, image fallback, and schema handoff discipline. -->
