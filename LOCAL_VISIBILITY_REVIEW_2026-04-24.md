# Build 174 update — Admin Leads quote/proposal drafts

**Updated:** 2026-05-24  
**Current build:** Build 174  
**Primary source of truth:** `DEVELOPMENT_ROADMAP.md`

Build 174 completes the next open competitive-matrix item after the quote starter: staff can now save generated quote starter text as a persistent quote/proposal draft from `/admin-leads.html`. This moves the workflow from copy-only follow-up toward a real quote pipeline while staying fallback-safe if the new table has not been applied yet.

## Completed in Build 174

1. Added `/api/admin/quote_proposal_drafts_save` for staff-protected quote/proposal draft creation and updates.
2. Added `/api/admin/quote_proposal_drafts_list` for staff-protected draft lookup by lead, booking, status, search, or id.
3. Updated `/admin-leads.html` and `/admin-leads/index.html` with **Save quote draft** and **Load drafts** actions on each public lead.
4. Added persistent draft display directly under the lead card so staff can see saved follow-up text before contacting a customer.
5. Added migration-safe fallback messages when the new draft table has not been applied yet.
6. Added SQL migration `sql/2026-05-24_build174_quote_proposal_drafts.sql`.
7. Updated `SUPABASE_SCHEMA.sql` and `DATABASE_STRUCTURE_CURRENT.md` with the quote/proposal draft table plan.
8. Added release guard `scripts/quote_proposal_drafts_build174_check.py` and wired it into `scripts/release_check.py`.
9. Re-ran Cloudflare Functions checks, one-H1 validation, and release checks.

## Active next steps after Build 174

1. Apply `sql/2026-05-24_build174_quote_proposal_drafts.sql` after the Build 167/168 lead SQL.
2. Browser-test `/admin-leads.html` by building a quote starter, saving it as a draft, and loading it again.
3. Add draft status controls for `needs_review`, `ready_to_send`, `sent`, `accepted`, and `declined`.
4. Add one-click lead → draft booking/quote conversion.
5. Add package/add-on price suggestions from the live pricing catalog.
6. Extend Admin Content Center to specials, service blurbs, homepage cards, and help articles.
7. Add service/town-aware proof filtering and media privacy enforcement before public gallery/social use.

---
> Build 173 documentation sync (2026-05-24): Admin Content Center, FAQ editor APIs, expanded Help Articles access/content, public Help nav link, and schema no-DDL note were updated. See `DEVELOPMENT_ROADMAP.md`, `KNOWN_GAPS_AND_RISKS.md`, `COMPETETIVE_COMPLETION_MATRIX.md`, and `SANITY_CHECK.md` for the active plan.

> Build 172 documentation sync (2026-05-24): Public FAQ page/content access, `/api/public_faqs`, `public_faq_entries` SQL foundation, sitemap/nav/footer links, and competitive-matrix status were updated. See `DEVELOPMENT_ROADMAP.md`, `KNOWN_GAPS_AND_RISKS.md`, and `COMPETETIVE_COMPLETION_MATRIX.md` for the active plan.

# Build 171 documentation sync note

**Updated:** 2026-05-24

This Markdown file was reviewed during the Build 171 pass. Current source of truth remains `DEVELOPMENT_ROADMAP.md`. Build 171 adds the Admin Leads quote-starter workflow and no new DDL.

---
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

<!-- Build 132 sync 2026-05-08: admin add-on image hydration, current-image preview, fallback media merge, no-DDL schema note, SEO/H1/CSS/media discipline reviewed. -->
<!-- Build 133 sync 2026-05-08: fixed Admin App add-on image hydration to prefer real PNG/R2 photos over SVG outlines, restored landingLinksToText helper, kept dev-branch workflow, and recorded no-DDL schema note. -->
<!-- Build 134 sync 2026-05-08: admin add-on save button, populated editor suggestions, landing-page media fields, local SEO metadata/structured-data, sitemap refresh, and no-DDL schema handoff reviewed. -->


<!-- Build 135 sync 2026-05-08: admin landing dropdown refresh, service-area fallback, inventory fallback merge, customizable option suggestions, one-H1/local SEO/schema handoff review. -->

<!-- Build 136 sync 2026-05-09: admin catalog click-to-edit, accounting pricing-window helper, sample reviews, pricing embed continuation, CSS/H1/link checks. -->

<!-- Build 141 sync 2026-05-14: reviewed during Norfolk/Oxford service-area, water-rule fallback, typeable booking location, local SEO, and docs/schema pass. -->

<!-- Build 143 sync 2026-05-15: public Consumables/Gear now merge DB catalog rows with bundled fallback catalogs so partial DB imports do not hide unedited items. -->

<!-- Build 146 sync 2026-05-15: Amazon CSV catalog matching/enrichment pass; docs/schema reviewed; keep one-H1, local SEO, CSS overflow, privacy-safe generated data, and DB-first inventory migration discipline. -->

<!-- Build 147 sync 2026-05-16: Admin App mergeServiceAreaRows repair, dropdown option editor, compact mobile navigation, release-check guardrails, root API duplicate cleanup, local SEO/H1 discipline. -->

<!-- Build 148 sync 2026-05-16: reviewed during landing photo/add-on page process/local SEO pass. Active details are in DEVELOPMENT_ROADMAP.md, KNOWN_GAPS_AND_RISKS.md, CURRENT_IMPLEMENTATION_STATE.md, SANITY_CHECK.md, and IMAGES.md. -->

<!-- Build 149 sync 2026-05-17: reviewed during Admin App service-area dropdown editor, save-feedback, Tillsonburg image fallback, local SEO/H1/CSS/release-check pass. -->

---

## Build 151 synchronization note

Updated 2026-05-18: active implementation moved to Admin Catalog media-library image picker support, selected-row image repair, duplicate-image diagnostics, browser image-health scan, `app_media_library` schema tracking, and continued local SEO/H1/CSS release discipline. See `DEVELOPMENT_ROADMAP.md`, `KNOWN_GAPS_AND_RISKS.md`, and `SANITY_CHECK.md` for the current working plan.

## Build 152 synchronization note

Reviewed during the 2026-05-18 Cloudflare Pages Functions deploy hotfix. No content-specific workflow change was required here; active handoff/schema docs carry the detailed Build 152 notes.

## Build 153 synchronization note

Reviewed during the 2026-05-19 Cloudflare Pages Functions import-path hotfix. No document-specific workflow change was required here; active handoff, roadmap, sanity, and schema docs carry the detailed Build 153 notes.

## Build 156 sync note - social progress publishing

Build 156 adds a reviewable social publishing foundation. Admin Progress can now create internal social drafts from job updates/media, Admin Social Queue can review and mark those drafts, and the schema now includes `social_channels`, `social_post_queue`, and `social_dispatch_attempts`. Direct posting to X, Facebook, Instagram, TikTok, Google Business Profile, and other platforms is possible later after the required platform credentials, app approvals, and consent/compliance checks are in place.

---

## Build 161 sync note

Build 161 keeps `DEVELOPMENT_ROADMAP.md` as the source of truth and advances the competitor-aligned conversion path with Booking service chooser guidance, package aliases, and photo-estimate CTAs.

---
> Build 174 documentation sync (2026-05-24): persistent quote/proposal drafts were added to Admin Leads with save/load APIs, SQL table foundation, schema notes, and release guard coverage. Quote starters remain copy-ready before the SQL is applied, but saved drafts require sql/2026-05-24_build174_quote_proposal_drafts.sql.


## Build 175 update — lead conversion, pricing suggestions, content expansion, gallery privacy, and analytics

- Added safe lead → draft booking/quote conversion using `public.lead_conversion_drafts` instead of creating live scheduled bookings too early.
- Added catalog-backed package/add-on price suggestions for Admin Leads from the current pricing catalog.
- Added quote draft status workflow controls: draft, needs review, ready to send, sent, accepted, declined, archived.
- Expanded Admin Content Center beyond FAQ with reusable content blocks for specials, service blurbs, homepage cards, help articles, trust proof, fleet, and maintenance copy.
- Added service/town filtering for the public before/after gallery and enforced public reuse only for approved-public/sample media.
- Added FAQ/help/lead/quote conversion analytics summary endpoint for admin reporting.
- Added SQL/schema sync in `sql/2026-05-25_build175_lead_conversion_content_gallery_analytics.sql`.
