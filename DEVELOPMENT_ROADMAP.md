# Development Roadmap — Build 142

**Updated:** 2026-05-15  
**Target branch:** `dev`

## Build 142 completed pass

1. Made the booking service-area control safer by adding a full clickable town picker beside the typeable datalist.
2. Kept the service-area input empty by default so native datalist filtering does not hide all towns behind Tillsonburg.
3. Added city/town datalist suggestions from the same service-area rows used by booking.
4. Added basic Canadian postal-code validation before checkout.
5. Added a city/service-area mismatch warning so staff can confirm county and travel tier before dispatch.
6. Added explicit service-area county, municipality, travel tier, water-rule, and metadata fields to the checkout payload.
7. Added a quote flag for cases where Rosie Dazzlers may need to bring water/power or confirm special setup.
8. Updated booking review and final summary to show county/local rule resolution and water/power setup status.
9. Verified and refreshed Oxford County water-rule text from the current official county water-conservation page.
10. Verified and refreshed Norfolk County watering-restriction text from the current official county page.
11. Added `/api/service_area_rules_public` so public pages can read DB/app-setting service-area rows before falling back to bundled JSON.
12. Added `/api/admin/service_area_rules` so service-area rules can be saved through an authenticated admin path later.
13. Added optional DB-first `service_area_rules` table migration for county/town/water-rule/parking/access/travel-tier rows.
14. Added a service-area JSON-to-SQL seed helper script for moving the bundled rules into Supabase.
15. Updated the shared pricing-catalog client to merge public service-area API rows with bundled pricing JSON.
16. Improved shared service-area matching so typed towns match aliases, town names without `, ON`, county names, or fallback county rows.
17. Added four new town-focused landing-page shells and API content entries for Norwich/Otterville, Zorra/Thamesford/Embro, Waterford/Vittoria, and Port Rowan/Turkey Point.
18. Updated local SEO target data and sitemap entries for the new town landing pages.
19. Removed root-level duplicate API JavaScript files again, leaving the valid public `service-worker.js` at root and real API handlers under `functions/api/`.
20. Archived the old root Markdown set and rebuilt active Markdown as a fresh concise Build 142 handoff set.

## Next logical 20 steps

1. Connect Admin App service-area editor directly to `/api/admin/service_area_rules` with load/save/import/export buttons.
2. Run the new `service_area_rules` migration in Supabase dev and seed it from `data/service_area_rules.json`.
3. Add a postal-code to county/town resolver for Norfolk/Oxford so typed addresses resolve before checkout.
4. Add per-service-area travel fee, minimum package, and quote-required thresholds to booking totals.
5. Add active water-restriction dispatch banners when appointment dates fall inside May–September rule windows.
6. Add a staff dispatch checklist that highlights water/power, driveway slope, parking, bylaw, and customer access risks.
7. Move sample reviews into a DB/app-setting approval workflow with source, date, town, service, and publish status.
8. Add per-town proof blocks that can prefer approved reviews/photos for the town page being viewed.
9. Finish DB-backed media library management for R2 images/videos, alt text, crop notes, page usage, and first-image scoring.
10. Add Admin Catalog saved/bundled filters and quick edit drawers for consumables, gear, systems, and service supplies.
11. Connect inventory usage-per-service to completed jobs so product costs roll into job profitability.
12. Add vendor purchase history import/reconciliation for inventory items and consumables.
13. Complete accounting payment application and invoice/receipt matching.
14. Complete accounting reconciliation matching with manual review queues.
15. Complete tax/remittance review screens with lock/reopen month controls.
16. Build accountant export packaging with CSVs, receipt links, GL detail, tax summary, and close checklist status.
17. Add Search Console and Google Business Profile metric placeholders into Admin Analytics.
18. Add mobile admin shortcuts for receive inventory, upload photos, edit service areas, and complete jobsite checklist items.
19. Add release automation that blocks deployments on broken links, multiple H1s, missing canonical tags, blank titles, or invalid sitemap entries.
20. Create the next batch of local service/town pages based on real booking/search demand after the new pages are indexed.

## SEO operating rule

No pass can guarantee top search placement. Continue improving the parts under our control: descriptive titles, one clear H1, local service/town wording, useful proof/reviews, crawlable internal links, accurate sitemap, fast mobile pages, and consistent Google Business Profile presence.
