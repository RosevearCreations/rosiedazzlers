
## Build 136 admin catalog, accounting, reviews, and pricing planner polish — 2026-05-09
- Admin Catalog inventory names are now clickable edit controls, so staff do not need to scroll horizontally to reach the edit button.
- Admin Catalog edit form was compacted and aligned to the top of the inventory workflow so long tables do not stretch the right-side editor thousands of pixels down the page.
- Fixed the pricing-control window failure caused by `LOCAL_CHART_URLS` being referenced without a server-side helper constant in the pricing catalog API normalizer.
- Home page now carries five temporary sample review cards until the live review API is connected.
- Pricing page embedded booking planner now has a taller left-side iframe and Step 1 includes a bottom “Go to Step 2” action so users can continue without scrolling back to the top.
- Continued SEO hygiene: one clear H1 per exposed page, stronger local proof/review content, crawlable service/town links, and cleaner mobile booking progression.


## Build 134 — Admin add-on save, local SEO, and populated-editor pass (2026-05-08)
- Added a dedicated **Update / save add-on** action beside **Delete add-on** in Admin App so one add-on can be edited and saved without scrolling to the global catalog save button.
- Extended the add-on editor with populated suggestions for category, type, and existing image URLs while preserving PNG/JPG/R2 images ahead of SVG fallbacks.
- Extended the landing-page editor with hero image URL, gallery image URLs, and related product/media fields so service and town pages can be improved without editing raw JSON.
- Kept location landing pages populated in Admin App by merging saved landing-page settings with the public fallback pages from `/api/landing_pages_public`.
- Preserved new landing media fields through the public landing-page API normalization path.
- Strengthened search visibility groundwork by replacing placeholder static landing-page titles/descriptions, adding richer Service structured data, adding dynamic FAQ/Breadcrumb/Service JSON-LD, and expanding `sitemap.xml` with lastmod/changefreq/priority plus missing service routes.
- Improved Admin Catalog editing by adding populated datalist suggestions for inventory keys, names, categories, subcategories, vendors, SKUs, units, purchase URLs, and image URLs; colour/finish words are now included in subcategory suggestions for supplies and visual items.
- CSS/search hygiene remains in scope: no public page should have more than one H1, local town/service wording should stay prominent, and links should remain crawlable anchors.

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

## Build 132 — Admin add-on image hydration repair (May 8, 2026)
- Admin App add-on selection now hydrates blank saved `image_url` and `image_fallback_url` fields from the bundled default pricing catalog by matching add-on `code`.
- The selected add-on editor now shows a Current image loaded preview so the existing picture can be kept or replaced deliberately.
- Public pricing catalog merge logic now prevents blank saved media fields from masking fallback/default add-on images.
- No database DDL is required; schema tracking note added at `sql/2026-05-08_build132_admin_addon_media_hydration_note.sql`.
- Continue the local SEO discipline: one clear H1 per exposed public page, locally relevant wording, visible proof/review media, and no broken asset paths.
<!-- Build 133 sync 2026-05-08: fixed Admin App add-on image hydration to prefer real PNG/R2 photos over SVG outlines, restored landingLinksToText helper, kept dev-branch workflow, and recorded no-DDL schema note. -->
<!-- Build 134 sync 2026-05-08: admin add-on save button, populated editor suggestions, landing-page media fields, local SEO metadata/structured-data, sitemap refresh, and no-DDL schema handoff reviewed. -->


## Build 135 — Admin App landing dropdowns, service-area fallback, and inventory merge repair
- Fixed Admin App landing page dropdowns so selecting an add-on or location preserves the selected value and refreshes the editor fields for that specific record.
- Service areas and travel tiers now merge from the bundled pricing catalog fallback when the saved pricing catalog is empty or incomplete; the remote tier is included and travel charge editing now binds the remote field.
- Added a customizable dropdown option library in Admin App for add-on categories/types, inventory categories, inventory subcategories/colours, vendors, units, service tiers, and service zones.
- Reworked Admin Catalog so saved DB rows merge with bundled consumables and gear from `/data/rosie_products_catalog.json` and `/data/systems_catalog.json`; editing two items no longer hides the rest of the fallback catalog.
- Admin Catalog now labels each row as Saved DB item or Bundled fallback and provides browser-saved inventory dropdown suggestions for category, type/colour, vendor, unit, and image URL helpers.
- SEO/local-search discipline continues: one H1 per exposed page, stronger local service/town wording, crawlable landing-page content, and clean structured handoff docs remain part of every pass.


<!-- Build 135 sync 2026-05-08: admin landing dropdown refresh, service-area fallback, inventory fallback merge, customizable option suggestions, one-H1/local SEO/schema handoff review. -->
