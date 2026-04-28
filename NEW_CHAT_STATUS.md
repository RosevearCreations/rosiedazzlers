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
