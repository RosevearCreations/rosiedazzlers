> Documentation synchronized April 24, 2026: analytics rollup foundation, admin rollup refresh path, live route-loop repair for /services and /pricing, sanity-check refresh, and local visibility review added.

## April 24, 2026 analytics rollup + visibility review pass
- Added pre-aggregated analytics rollup tables plus a new `/api/admin/analytics_rollups_refresh` path.
- `/api/admin/analytics_overview` now prefers rollups for daily / weekly / monthly / yearly reporting and falls back to raw-event reporting when rollups are empty.
- `admin-analytics.html` now includes a rollup refresh button and reports which source mode was used.
- `_redirects` was rewritten to explicit html-backed clean-route rewrites after a live sanity check found redirect loops on `/services` and `/pricing`.
- Added `LOCAL_VISIBILITY_REVIEW_2026-04-24.md` with competitor review notes and the next local-search visibility moves.

# Rosie Dazzlers — Handoff for Next Chat

## Branch rule
Use dev as source of truth unless explicitly told otherwise.

## Resume prompt
Continue Rosie Dazzlers from the dev branch docs. Use README.md, PROJECT_BRAIN.md, CURRENT_IMPLEMENTATION_STATE.md, KNOWN_GAPS_AND_RISKS.md, DEVELOPMENT_ROADMAP.md, and NEXT_STEPS_INTERNAL.md as source of truth.

## Current state in one paragraph
Rosie Dazzlers is a role-aware detailing operations platform with booking, deposits, gifts, token-based customer progress, jobsite intake/time tracking, customer/staff/admin screens, recovery messaging foundations, and DB-backed catalog/inventory foundations. The newest pass finished the live chart direction by rendering the price chart, package-details chart, and vehicle size guide as live SVG outputs from the canonical pricing helpers, while App Management now has a staff helper to preview/download those SVG charts from the current editor JSON.

## Most likely next priorities
1. Deploy and manually verify the App Management live chart preview/download helper
2. post-deploy validation of structured-data/rich-result rendering
3. customer vehicle crop/editor hardening
4. mobile admin visual regression pass for dense pricing/catalog rows
5. real staff auth/session completion on the remaining bridge paths

## Delivery style preference
- one file at a time
- brief description first
- then one complete code block for the entire file

## Newest pass summary
- added a live SVG vehicle size guide generator to assets/pricing-catalog-client.js
- switched /pricing and /services to use the live size guide before the packaged fallback image
- added an App Management live chart helper for preview/download of price, package-details, and size SVG charts
- refreshed docs and schema notes with no DDL change in this pass

## Pass 27 sync — 2026-04-24
- Start by deployed-testing `admin-accounting.html`, `admin-live.html`, `admin-blocks.html`, and `admin-analytics.html` because this pass changed both layout behavior and the analytics payload/UI.
- If the analytics page feels slow on a 365-day window in production, build rollup tables or nightly summaries from `site_activity_events`; the new UI already has the right export/report surfaces and only needs a faster backend source.
- Keep the current schedule schema as `blocked_date` / `slot` unless you are ready to migrate every schedule endpoint and page together in one pass.

## Newest operational notes
- Run `sql/2026-04-24_site_activity_rollups.sql` before using the rollup refresh endpoint.
- Deploy and verify `/services` and `/pricing` after the `_redirects` rewrite because the live site showed redirect loops during sanity review.
- Read `LOCAL_VISIBILITY_REVIEW_2026-04-24.md` before starting the next content/SEO pass.
