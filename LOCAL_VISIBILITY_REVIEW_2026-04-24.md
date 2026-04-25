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
