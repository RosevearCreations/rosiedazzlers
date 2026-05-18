# Development Roadmap — Build 150

**Updated:** 2026-05-17  
**Target branch:** `dev`  
**Pass focus:** Admin Catalog inventory image picker, fallback image merge repair, schema/docs synchronization, CSS/SEO/H1 release checks, and next value-add planning.

## Build 150 completed 20-step pass

1. Repaired the Admin Catalog inventory merge so saved DB rows with blank `image_url` no longer hide matching bundled consumable/tool images.
2. Added fallback-image hydration from `data/rosie_products_catalog.json` and `data/systems_catalog.json` when the DB row has no saved image.
3. Added a selected-image preview to **Admin Catalog → Edit inventory item**.
4. Added **Use matching bundled image** so staff can restore the correct image from the bundled consumables/tools catalog with one click.
5. Added **Pick existing image** to open a reusable image picker from current catalog/fallback image records.
6. Added image picker search across product name, key, filename, category, source, and URL.
7. Added thumbnail image cards for existing product/tool images with safe fallback artwork if a thumbnail fails.
8. Added **Clear image** for cases where a product truly should not have a public image.
9. Updated the inventory image datalist so it includes saved image helper URLs plus bundled consumables/tools image URLs.
10. Updated save behavior so a blank editor image can still auto-fill from the matching bundled image before posting the row.
11. Updated inventory quality status to show `Image set · fallback matched` when a saved row is being protected by the bundled image match.
12. Kept the image picker mobile-friendly with a two-column thumbnail grid at smaller widths.
13. Added `scripts/inventory_image_picker_check.py` to guard the picker, fallback merge markers, and bundled fallback image coverage.
14. Wired the new inventory image picker check into `scripts/release_check.py`.
15. Added `sql/2026-05-17_build150_inventory_image_picker_and_fallback.sql` for current catalog inventory image/service/Amazon fields and indexes.
16. Updated `SUPABASE_SCHEMA.sql` so the canonical `catalog_inventory_items` table now includes the current receipt, station, service tags, image, and Amazon match fields.
17. Updated `IMAGES.md` with the inventory product-image picker workflow and R2/bundled fallback guidance.
18. Updated active Markdown handoff documents to Build 150.
19. Re-ran the release checklist, including SEO/H1/static/catalog/fallback/mobile/admin checks.
20. Preserved the local SEO discipline: one H1 per exposed public page, clear titles/meta, local wording, crawlable pages, and no broken inventory image UX.

## Next logical 20 steps

1. Deploy/apply the Build 150 SQL migration in Supabase dev and confirm the new/optional `catalog_inventory_items` fields exist.
2. Test Admin Catalog on the deployed dev URL by editing a saved DB row with blank image and confirming the matching bundled image appears.
3. Add a DB-backed media library picker using `app_media_library` so uploaded files are searchable beyond bundled JSON.
4. Add an upload-to-R2 workflow for product/tool images from Admin Catalog.
5. Add per-image alt text, title, caption, consent/source, and preferred-public-image flags.
6. Add a bulk **repair missing images** action that writes matched bundled image URLs onto saved DB rows.
7. Add duplicate-image detection and warnings when two different inventory rows point to the same product image.
8. Add image health checks that can flag 404/failed product image URLs without blocking the page.
9. Connect Amazon match review approvals to inventory cost history and image confirmation.
10. Add vendor directory editing directly from Admin Catalog and Accounting.
11. Link inventory usage to job closeout so selected consumables reduce stock automatically at completion.
12. Add receipt/bill upload attachment workflow for inventory purchases and accounting entries.
13. Add inventory valuation reports by station/vehicle, item type, vendor, and service tag.
14. Add manual stock-count sessions with variance review, approval, and accounting adjustment posting.
15. Add month-end inventory close controls that lock stock values after accountant review.
16. Add town/service-specific proof tagging for reviews, before/after photos, and product/tool stories.
17. Replace external location landing photos with Rosie-owned R2-hosted local photos.
18. Add landing-page completeness scoring for image, service wording, proof, FAQ, metadata, and local relevance before publishing.
19. Add Search Console/Google Business Profile reporting panels once credentials/API access are ready.
20. Continue reducing duplicated JSON/DB sources only after each DB-backed editor has safe import, fallback, and rollback controls.

<!-- Build 150 sync 2026-05-17: reviewed during Admin Catalog image picker/fallback repair, schema synchronization, release checks, and local SEO/H1 discipline pass. -->
