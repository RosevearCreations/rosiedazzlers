# Development Roadmap — Build 141

**Updated:** 2026-05-14  
**Target branch:** `dev`  
**Purpose:** Track the latest completed value pass and the next 20 logical steps for the Rosie Dazzlers website/app backend.

## Build 141 completed pass

This pass focused on restoring the fuller Norfolk/Oxford service-area behavior from earlier builds and making the booking/admin service-area workflow safer for real mobile detailing operations.

1. Restored a broad Oxford County and Norfolk County service-area seed with county defaults plus individual towns/communities.
2. Added `/data/service_area_rules.json` as a shared JSON source for county/municipality rules, water-use reminders, official source links, and fallback behavior.
3. Updated `/data/rosie_services_pricing_and_packages.json` so the booking catalog has the expanded service-area rows instead of only a few grouped areas.
4. Added Oxford County water-conservation reminders to service-area rows: May 1–September 30 program, even/odd watering days, residential/commercial watering windows, and current-status verification.
5. Added Norfolk County watering-restriction reminders to service-area rows: May 15–September 15, allowed time windows, odd/even address schedule, and current-status verification.
6. Added county-level fallback rows: `Other Oxford County location` and `Other Norfolk County location`.
7. Made the customer booking service-area control typeable with a datalist instead of a rigid select-only dropdown.
8. Added typed-town fallback handling in the shared pricing-catalog client so exact towns, aliases, and county fallback rows can resolve cleanly.
9. Updated Admin App service-area editing so county, town/label, municipality, zone, tier, by-law notes, water reminders, parking, and noise/access notes are editable in one place.
10. Expanded service-area dropdown option libraries with the Oxford and Norfolk towns/communities now used by the booking catalog.
11. Updated local SEO target data to track service-area coverage and future town-page expansion opportunities.
12. Synced clean-route copies for `/book/` and `/admin-app/` so the folder-backed routes match the patched root pages.
13. Added schema tracking for the new JSON-first service-area/water-rule foundation.
14. Kept the DB-first direction clear: JSON remains the public fallback now, while Supabase app settings or a future `service_area_rules` table can become canonical later.
15. Kept SEO discipline in scope: one H1 per exposed page, local town/county wording, crawlable pages, and structured service-area language.
16. Preserved fallback-first error handling so missing app settings should not blank the booking area list.
17. Added staff-facing notes that typed unknown towns require county confirmation before dispatch.
18. Reduced missed-location risk by allowing staff/customers to type towns not yet listed while still preserving fallback handling.
19. Updated the Markdown handoff files and schema notes for the pass.
20. Re-ran static/link/H1/JSON/JS checks before packaging.

## Next logical 20 steps

1. Create a DB-backed `service_area_rules` table and admin endpoint so JSON is only the deploy-safe fallback.
2. Add a full Admin App service-area manager with search, duplicate detection, and bulk import/export.
3. Add a county/town resolver that can map typed towns to counties without staff guessing.
4. Add address/postal-code validation before checkout so service area, travel tier, and county water rules are resolved earlier.
5. Add a dispatch checklist warning when a booking is inside an active water restriction window.
6. Add a “bring our own water/power” quote flag that automatically adjusts booking requirements.
7. Add per-location travel fee overrides and quote-required thresholds.
8. Build new town landing pages for Norwich/Otterville, Zorra/Thamesford/Embro, Waterford/Vittoria, and Port Rowan/Turkey Point.
9. Add structured data per town/service landing page, including service area and local business coverage.
10. Create a reusable proof/review block per town page using approved review/sample data until API reviews are live.
11. Move review proof from sample JSON into DB/app settings with approval status and source tracking.
12. Finish the media-library editor for R2 images/videos with alt text, crop notes, first-image scoring, and page usage.
13. Build the full option-library editor so categories, types, colours, vendors, units, towns, and tiers are maintained from Admin App.
14. Add Admin Catalog filters for saved vs bundled fallback items, low stock, vendor, category, colour, and consumable/gear type.
15. Add inventory “usage per service” tracking tied to completed jobs.
16. Finish accounting close workflow: payment application, reconciliation matching, journal validation, tax/remittance review, and accountant export bundle.
17. Add stronger checkout diagnostics that save safe failure context for admin review without exposing customer secrets.
18. Add Search Console / Google Business Profile reporting placeholders so public search performance can be tracked beside internal analytics.
19. Add release automation that fails the build if a public page has multiple H1s, blank meta, missing canonical, or broken internal links.
20. Add mobile admin shortcuts for service-area edits, inventory receive, photo upload, and jobsite checklist completion.

## SEO operating rule

No pass can guarantee top search placement. Continue improving the parts under our control: descriptive titles, one clear H1, local service/town wording, useful proof/reviews, crawlable internal links, accurate sitemap, fast mobile pages, and current Google Business Profile presence.

<!-- Build 141 sync 2026-05-14: reviewed during Norfolk/Oxford service-area, water-rule fallback, typeable booking location, local SEO, and docs/schema pass. -->


## Build 141 cleanup note

Root-level duplicate API JavaScript files were removed again; valid API handlers remain under `functions/api/` and `functions/api/admin/`, while `service-worker.js` remains at the public root.
