> Documentation synchronized April 24, 2026: analytics rollup foundation, admin rollup refresh path, live route-loop repair for /services and /pricing, sanity-check refresh, and local visibility review added.

## April 24, 2026 analytics rollup + visibility review pass
- Added pre-aggregated analytics rollup tables plus a new `/api/admin/analytics_rollups_refresh` path.
- `/api/admin/analytics_overview` now prefers rollups for daily / weekly / monthly / yearly reporting and falls back to raw-event reporting when rollups are empty.
- `admin-analytics.html` now includes a rollup refresh button and reports which source mode was used.
- `_redirects` was rewritten to explicit html-backed clean-route rewrites after a live sanity check found redirect loops on `/services` and `/pricing`.
- Added `LOCAL_VISIBILITY_REVIEW_2026-04-24.md` with competitor review notes and the next local-search visibility moves.

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
