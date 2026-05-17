# Development Roadmap — Build 149

**Updated:** 2026-05-17  
**Target branch:** `dev`  
**Pass focus:** Compact Admin App service-area editing, save feedback, Tillsonburg landing image fallback, CSS/SEO hygiene, and release checks.

## Build 149 completed 20-step pass

1. Converted **Service areas and travel tiers** in Admin App from a long expanding row list into a one-at-a-time dropdown editor.
2. Added `serviceAreaEditorSelect` so staff can choose one town/travel-tier row without scrolling through every Oxford/Norfolk entry.
3. Added a selected service-area editor with county, town/label, booking value, municipality, zone, travel tier, area type, by-law note, water rule, parking/access reminder, noise reminder, and setup/access reminder.
4. Added **Save selected service area** so one row can be saved clearly without needing to scroll through the full pricing catalog section.
5. Added **Duplicate** for service-area rows to speed up adding similar towns or local variants.
6. Added **Delete selected** for the chosen service-area row.
7. Added visible service-area summary stats for total rows, Oxford rows, Norfolk rows, and selected travel tier.
8. Preserved the full pricing catalog JSON sync so the dropdown editor still writes to `pricing_catalog.service_areas`.
9. Added button-level save feedback in Admin App: save buttons turn green and display `Saved ✓` after successful saves.
10. Kept the admin shell status message as a second confirmation for saves.
11. Fixed the Tillsonburg landing image seed by replacing the fragile Commons `Special:FilePath` URL with a direct Wikimedia upload URL.
12. Added `onerror` image fallback handling for landing regional photos so a broken external photo does not leave a missing-image box.
13. Added the image fallback to dynamic landing-page hero/gallery/product visuals.
14. Added a release check for the compact Admin App service-area editor and save feedback.
15. Wired `scripts/admin_app_editor_check.py` into the release checklist.
16. Removed the old service-area expanded-row CSS so the page no longer grows vertically with every service area.
17. Updated `IMAGES.md` with the Tillsonburg image fallback and replacement guidance.
18. Updated `KNOWN_GAPS_AND_RISKS.md` with remaining media-picker and DB-first service-area work.
19. Updated `SUPABASE_SCHEMA.sql` and added a no-DDL tracking note for this pass.
20. Re-ran release, SEO, H1, catalog, service-area, landing-photo, and mobile checks.

## Next logical 20 steps

1. Apply the pending Supabase migrations in dev and confirm the new catalog/service-area tables exist.
2. Build a real Admin App media picker/uploader backed by the media-library foundation instead of pasting image URLs.
3. Move location landing regional photos from external placeholders to Rosie-owned R2-hosted photos.
4. Add a landing-page completeness score before publishing town and add-on pages.
5. Add a publish/unpublish toggle with draft preview for landing pages.
6. Create an Admin App service-area import/export tool for towns, counties, water rules, and travel tiers.
7. Add a DB-first service-area editor once the `service_area_rules` API migration is live.
8. Add water-rule last-reviewed dates and source URLs to the Admin App service-area editor.
9. Add postal-code-to-service-area assistance for Oxford/Norfolk addresses.
10. Add a visible customer warning when a typed booking location falls outside normal service zones.
11. Add inventory Amazon-match review approvals that can write confirmed purchase URLs and cost history.
12. Add vendor directory editing from Admin Catalog and Accounting screens.
13. Connect inventory usage to job closeout so consumables reduce stock automatically.
14. Add receipt/bill attachment workflow for inventory and accounting entries.
15. Add Search Console/GBP reporting panels once stable API credentials are ready.
16. Add town/service-specific review tagging so proof can display on the matching landing page.
17. Add before/after gallery tagging by town, service area, package, and add-on.
18. Add mobile-first admin quick actions for detailers: arrival, water/power check, photos, products used, and customer sign-off.
19. Add a monthly release checklist screen inside Admin App using the existing scripts as reference.
20. Continue reducing duplicated JSON/DB sources once each DB-backed editor is stable and has safe fallbacks.

<!-- Build 149 sync 2026-05-17: reviewed during Admin App service-area dropdown editor, save-feedback, Tillsonburg image fallback, local SEO/H1/CSS/release-check pass. -->
