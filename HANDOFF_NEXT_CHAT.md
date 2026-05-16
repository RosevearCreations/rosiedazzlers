# Handoff Next Chat — Build 142

Start from `dev` and this package. The latest pass completed service-area picker repair, county water-rule verification, DB/API foundation for service-area rules, four more town landing pages, and a fresh documentation/schema update.

## Highest-priority next work

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
