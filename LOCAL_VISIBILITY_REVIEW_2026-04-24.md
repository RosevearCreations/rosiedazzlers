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

# Rosie Dazzlers — Local Visibility Review (April 24, 2026)

## What this note is for
This file captures the sanity-check findings from the latest build, the current local-SEO direction, and a practical comparison against other mobile / local detailing sites that are active online.

## Build sanity-check findings from this pass
- `python3 scripts/stress_static_checks.py` passed on the packaged build before repackaging.
- Live check against `https://rosiedazzlers.ca/` showed the home page and booking page resolving, but `/services` and `/pricing` returned a redirect loop in the live environment during review.
- `_redirects` was changed away from trailing-slash 301 rules and into explicit html-backed 200 rewrites for the public clean routes so Pages has a single canonical route target.
- `scripts/stress_static_checks.py` now guards against the older loop-prone `/services/ -> /services 301` and `/pricing/ -> /pricing 301` pattern.
- Admin analytics now has a pre-aggregated rollup path available via `/api/admin/analytics_rollups_refresh`, with `/api/admin/analytics_overview` preferring rollups before falling back to raw-event reporting.

## What competing / comparable detailing sites are visibly doing online
### Dawson's Detailing (Cambridge, ON)
Visible strengths during review:
- simple top navigation focused on About, Services & Packages, Gallery, and Book
- dedicated Gallery section with before/after language
- clear contact block with phone, address, hours, and Google review CTA

### Thunder Auto Detailing (London, ON)
Visible strengths during review:
- broad service menu (interior, exterior, full packages, headlight restoration, deodorizing, pet hair, waxing, ceramic coating)
- direct service-area language
- online booking CTA in multiple places
- blog, promotions, and review links in the public navigation/footer
- strong social-link footprint

### Mobile Auto Shine (Ontario)
Visible strengths during review:
- repeated 24/7 online booking CTA
- explicit mobile vs shop-service choice
- high-visibility ceramic-coating and add-on merchandising
- very deep image-heavy proof-of-work section and before/after examples
- active social CTA section

### Precision Detailing (Norfolk County)
Visible strengths during review:
- Norfolk County wording directly on-page
- service sections for high-intent needs like engine cleaning, pet hair, glass cleaning, stain removal, and dash cleaning
- recent-details/work section to reinforce proof and freshness

### JC Car Detailing (Norfolk County)
Visible strengths from search result snippet and indexed copy:
- Norfolk County wording in the title/snippet
- direct mobile-booking language
- clear value proposition around coming to the customer

## What Rosie Dazzlers already does well
- strong clean-route titles and one-H1 discipline on the main public pages
- real online booking flow instead of a quote-only contact form
- clear service-area wording for Oxford County and Norfolk County
- gift certificates already exist
- before/after gallery and videos already exist in the public experience
- structured pricing and service-area data are already more organized than many small detailing sites

## Best next visibility steps
### Highest-value next 5
1. Add dedicated public service landing pages for high-intent searches:
   - ceramic coating
   - pet hair removal
   - odour removal / smoke odour removal
   - headlight restoration
   - interior shampoo / stain removal
2. Add a public review proof block that is never empty:
   - recent Google reviews
   - leave-a-review CTA
   - star/rating summary text if allowed by the source of truth on the page
3. Expand town-level pages or town-level sections for the strongest local service areas:
   - Tillsonburg
   - Woodstock
   - Ingersoll
   - Simcoe
   - Delhi
   - Port Dover
4. Add a lightweight blog / advice lane aimed at local search terms:
   - spring car detailing in Oxford County
   - winter salt cleanup in Norfolk County
   - pet hair and odour cleanup in family vehicles
   - preparing a lease return or vehicle sale
5. Keep the home page from showing an empty review section. Empty trust blocks weaken conversion.

### Best next conversion / visibility additions
- service-specific before/after galleries rather than one mixed gallery only
- FAQ blocks on service pages and booking page
- stronger “what we need on arrival” page with local driveway/power/water wording
- seasonal promotions page and Google Business Profile offer mirroring
- town/service-area proof sections using real completed jobs and photos
- more internal links from home/services/pricing into booking and gallery pages using clear anchor text

### Best next Google Business Profile actions
- keep categories/services/hours exact and complete
- keep adding fresh review volume
- publish regular photo updates and short posts/offers
- mirror the website’s service-area wording, booking link, and key service names consistently

## Metrics to watch after this pass
### Website-side
- daily / weekly / monthly visits from the new rollup-backed admin analytics
- top landing pages
- top towns / service areas
- booking starts vs booking completions
- top referrers and top actions

### Google-side
- Search Console impressions, clicks, CTR, and queries
- Business Profile views, website clicks, calls, and directions
- review count / review recency / photo view activity

## Practical next implementation order
1. Deploy the route rewrite fix and confirm `/services` and `/pricing` open correctly on production.
2. Run the new analytics rollup SQL and use the new rollup refresh endpoint.
3. Add one public review module that can safely stay populated.
4. Build the first two high-intent landing pages:
   - ceramic coating
   - pet hair removal
5. Add one town-focused page/section set beginning with Tillsonburg + Woodstock.
6. Add Search Console and GBP reporting notes into the office reporting workflow.

## Source list used for this review
Official Google guidance reviewed:
- Google Search Central: Influencing title links in search results
- Google Search Central: LocalBusiness structured data
- Google Business Profile Help: Tips to improve your local ranking on Google
- Google Search Console Help: Performance report (Search results)
- Google Business Profile Help: Understand your Business Profile performance & insights

Example detailing sites reviewed:
- https://dawsonsdetailing.ca/
- https://thunderautodetailing.ca/
- https://mobileautoshine.ca/
- https://www.precisiondetailingnorfolk.com/
- https://jccardetailing.com/

## April 25, 2026 practical implementation note
Implemented in code this pass:
- dedicated landing pages for ceramic coating, pet hair removal, odor removal, headlight restoration, and paint correction
- recent-work proof mounts on home, services, pricing, and those new landing pages
- stronger local town wording on the public entry pages
- folder-backed route pages replacing the fragile `_redirects` dependency for the main clean URLs

Still the next best visibility steps after deploy:
- add town-specific landing pages for Tillsonburg, Woodstock / Ingersoll, Simcoe / Delhi, and Port Dover
- connect Search Console performance and Business Profile metrics as separate Google-side reporting once internal rollups are stable
- keep loading new before/after pairs and recent social links from App Management so freshness stays visible without code edits

## Follow-through completed on 2026-04-25
- Added the first town-focused landing pages to support stronger local service-area visibility.
- Kept recent work and review proof visible on the main public entry pages and the new town pages.

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
