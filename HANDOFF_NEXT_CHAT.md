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


- 2026-04-29 pass: restored add-on image merge safety, kept add-on editor in single-dropdown mode, and expanded town/add-on landing pages with stronger local facts, official links, and service process content.

## 2026-04-30 handoff
- The strongest next pass is landing-page media depth: add real before/after image blocks per add-on page and per-town gallery support in the admin landing builder.
- The next backend step after that is a dedicated landing-service-products join model so consumables can be mapped in admin without storing the relationship only inside landing page content.


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
