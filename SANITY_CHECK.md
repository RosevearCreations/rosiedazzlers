# Sanity Check — Build 140

**Package:** `rosiedazzlers-dev(136).zip`  
**Updated:** 2026-05-14

## Completed in this pass

- Admin option-library foundation added through `data/admin_option_libraries.json` and `catalog_dropdown_options` app-setting loading.
- DB-first option storage path enabled by adding `catalog_dropdown_options`, `landing_pages`, `review_proof`, and `media_library` to app settings fetch endpoints.
- Admin Catalog inventory workflow kept merged with bundled gear/consumables fallback instead of hiding unsaved items after DB edits.
- Admin Catalog dropdowns now fall back to bundled option libraries when Supabase settings are unavailable.
- Shared media-library seed added in `data/media_library_seed.json`.
- Optional `app_media_library` SQL foundation added for DB-backed reusable image/video records.
- Optional `app_option_libraries` SQL foundation added for reusable admin dropdown libraries.
- Optional `app_content_entries` SQL foundation added for reviews, gallery entries, and reusable content blocks.
- Review-proof fallback data moved into `data/sample_reviews.json`.
- Public review API foundation added at `/api/reviews_public` with DB/app-setting fallback.
- Homepage review block now has a dynamic `data-review-proof-mount` rendered by `/assets/reviews.js`.
- Local SEO target contract added in `data/local_seo_targets.json`.
- Local SEO audit script added in `scripts/local_seo_audit.py`.
- Release checklist script added in `scripts/release_check.py`.
- Static stress checks now validate the new data contracts and review scripts.
- Sitemap `lastmod` values refreshed for this pass.
- Clean-route wrapper files synced from their matching root HTML files.
- Root-level duplicate API JavaScript files removed; valid Pages Functions remain under `functions/api/`.
- Markdown set cleaned by archiving older/duplicate root docs and refreshing active docs.
- Schema documentation updated with the Build 140 DB-foundation migration and next implementation direction.

## Files added

- `data/admin_option_libraries.json`
- `data/local_seo_targets.json`
- `data/media_library_seed.json`
- `data/sample_reviews.json`
- `assets/reviews.js`
- `functions/api/reviews_public.js`
- `scripts/local_seo_audit.py`
- `scripts/release_check.py`
- `sql/2026-05-10_build140_value_add_roadmap_foundations.sql`

## Cleanup

- Older/duplicate Markdown was archived to `archive/2026-05-14-build140-markdown-snapshot/`.
- Root-level duplicate API JavaScript files were removed.
- `service-worker.js` remains at root because it is a valid public browser file.
- Clean-route wrappers were synced from root HTML pages.

## Deployment reminder

Use `dev` as the working branch. Do not merge to `main` unless explicitly requested.
