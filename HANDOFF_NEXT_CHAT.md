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

## Current best next steps (carry forward)
1. Verify the new block calendar and range-save flow live after deploy.
2. Continue enriching the town-focused landing pages with real recent jobs, photos, and stronger review/social proof.
3. Keep the folder-backed clean-route approach as the live baseline.
4. Connect Google-side reporting later through Search Console and Business Profile once internal analytics rollups are stable.



Next chat should continue from the folder-backed clean-route baseline, the town-page/local-proof SEO direction, and the expanded accounting backbone that now includes year-end package reporting.


- Verify the live /pricing iframe no longer leaves a large dead gap between vehicle details and package selection.
- Verify the bundled reviews fallback appears on home/proof sections if the remote review image is missing.
- Next accounting pass: add invoice/bill document attachment support and bank-reconciliation workflow on top of the new year-end package.

## Carry-forward after 2026-04-27
Keep the folder-backed clean-route model as the live baseline. On Rosie Dazzlers, the strongest next admin/back-office steps are now: direct accounting document uploads, vendor defaults/directory, deeper bank matching, payroll deduction detail, and broader period-lock enforcement. On the public side, keep recent work, review proof, and local town/service freshness visible on the main entry pages.

## 2026-04-28 handoff note
Baseline now includes: vendor directory defaults, direct upload accounting docs, deeper bank reconciliation matching storage, payroll deduction/net-pay reconciliation fields, add-on dependency rules in booking + checkout, and stronger special-service/town landing pages. Run `sql/2026-04-28_accounting_vendor_uploads_and_dependency_rules.sql` before using the new accounting fields.

## April 28, 2026 add-on media / dependency UI / landing-page depth pass
- Restored add-on cards to the original Rosie packages R2 image files as the primary `image_url` values, while keeping bundled local fallback assets in place.
- Re-expanded add-on dependency handling so dependent add-ons continue to require qualifying main packages, while true standalone services such as engine cleaning remain allowed.
- App Management pricing now exposes add-on-to-package dependency mapping as package checkboxes instead of only a raw comma list, which supports one-to-one, one-to-many, and many-to-one relationships more clearly for office use.
- Special-service landing pages and town-focused landing pages were rebuilt into fuller pages with process, equipment/workflow, reasons the page exists, proof blocks, and FAQ content instead of thin placeholders.
- Engine cleaning pricing remains explicit in the bundled pricing catalog (`small 59 / mid 69 / oversize 79`) and should now be inherited more safely when older app settings are missing fields because package/add-on fallback merging now happens by code.
