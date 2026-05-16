# Next Steps Internal — Build 142

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
