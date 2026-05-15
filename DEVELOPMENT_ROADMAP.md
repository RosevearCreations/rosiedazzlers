# Development Roadmap — Build 140

**Updated:** 2026-05-14  
**Target branch:** `dev`  
**Purpose:** Track what was completed from the prior 20-step roadmap and define the next 20 practical steps.

## Build 140 completed roadmap pass

This pass completed the practical foundation work for the previous 20-step roadmap. Some items are now fully implemented, while larger “real app” items now have DB/API/script foundations so they can be completed safely in smaller follow-up passes.

1. Admin option-library foundation added through `data/admin_option_libraries.json` and `catalog_dropdown_options` app-setting loading.
2. DB-first option storage path enabled by adding `catalog_dropdown_options`, `landing_pages`, `review_proof`, and `media_library` to app settings fetch endpoints.
3. Admin Catalog inventory workflow kept merged with bundled gear/consumables fallback instead of hiding unsaved items after DB edits.
4. Admin Catalog dropdowns now fall back to bundled option libraries when Supabase settings are unavailable.
5. Shared media-library seed added in `data/media_library_seed.json`.
6. Optional `app_media_library` SQL foundation added for DB-backed reusable image/video records.
7. Optional `app_option_libraries` SQL foundation added for reusable admin dropdown libraries.
8. Optional `app_content_entries` SQL foundation added for reviews, gallery entries, and reusable content blocks.
9. Review-proof fallback data moved into `data/sample_reviews.json`.
10. Public review API foundation added at `/api/reviews_public` with DB/app-setting fallback.
11. Homepage review block now has a dynamic `data-review-proof-mount` rendered by `/assets/reviews.js`.
12. Local SEO target contract added in `data/local_seo_targets.json`.
13. Local SEO audit script added in `scripts/local_seo_audit.py`.
14. Release checklist script added in `scripts/release_check.py`.
15. Static stress checks now validate the new data contracts and review scripts.
16. Sitemap `lastmod` values refreshed for this pass.
17. Clean-route wrapper files synced from their matching root HTML files.
18. Root-level duplicate API JavaScript files removed; valid Pages Functions remain under `functions/api/`.
19. Markdown set cleaned by archiving older/duplicate root docs and refreshing active docs.
20. Schema documentation updated with the Build 140 DB-foundation migration and next implementation direction.

## Next logical 20 steps

1. Run the Build 140 SQL migration in Supabase dev, then confirm all three new foundation tables exist.
2. Add an Admin App media-library panel that lists, filters, edits, and saves `app_media_library` records.
3. Add an Admin App option-library panel that writes dropdown sets to `app_option_libraries` or `catalog_dropdown_options`.
4. Migrate add-on image fields from pricing JSON into the shared media library while keeping JSON fallback.
5. Migrate before/after gallery entries into `app_content_entries` with approval/consent status.
6. Add review-proof admin editor with source labels: sample, manual, imported, verified API.
7. Connect homepage reviews to the review editor and hide sample wording once live/verified reviews exist.
8. Add landing-page publish status, draft/preview mode, and last-updated metadata in Admin App.
9. Add town-page completeness scores for title, H1, description, FAQ, images, internal links, and booking CTA.
10. Add service-page completeness scores for package linkage, add-on images, quote rules, FAQs, and schema.
11. Add Admin Catalog filters for source, category, subcategory/colour, vendor, low stock, and missing cost.
12. Add bulk inventory save/import flow for gear and consumables so multiple fallback items can be promoted to DB rows at once.
13. Add inventory media selector so gear/consumable images pull from the media library.
14. Add checkout diagnostics viewer in Admin App or Admin Analytics so schema fallback errors are visible without console digging.
15. Finish accounting payment application against receivables, deposits, tips, refunds, and gift balances.
16. Finish journal-line validation before posting any month-end or tax/remittance entry.
17. Finish bank/payment-processor reconciliation matching with manual review buckets.
18. Add month-end lock/reopen controls with audit history and role-based permission checks.
19. Add accountant export package builder with CSV, JSON, reconciliation reports, and migration checklist.
20. Add CI or GitHub Action to run `scripts/release_check.py` before merges into `dev`.

## SEO discipline for every pass

- Keep exactly one clear H1 on every exposed public page.
- Keep customer-search language in the title, H1, first paragraph, internal links, alt text, and page descriptions.
- Keep town/service wording visible for Tillsonburg, Woodstock, Ingersoll, Simcoe, Delhi, Port Dover, Oxford County, and Norfolk County.
- Keep `sitemap.xml` synced after every route/content change.
- Keep private/admin pages out of the public crawl path.
- Use review proof, before/after images, real work examples, and service-area clarity to improve trust signals.

## Backend direction

Move business-critical data out of scattered JSON in this order: dropdown libraries, media library, reviews, before/after gallery, landing pages, inventory, then accounting exports. Keep bundled JSON as a fallback until each DB-backed editor is stable.
