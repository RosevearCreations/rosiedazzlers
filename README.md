# Rosie Dazzlers Dev Build — Build 153

**Updated:** 2026-05-18

This ZIP is the current dev baseline for Rosie Dazzlers.

## Build 153 focus

- Cloudflare Pages Functions deploy hotfix for `media_library_list.js`.
- Landing page public API duplicate object-key cleanup.
- Release-check hardening for deploy-only JavaScript issues.
- Admin Catalog inventory media-library picker foundation.
- Staff-protected `/api/admin/media_library_list` endpoint.
- Selected-row image repair for fallback-matched inventory images.
- Duplicate image diagnostics.
- Browser image health scan for visible inventory rows.
- Schema and Markdown synchronization.
- Continued SEO/H1/CSS release checks.

## Important files

- `admin-catalog.html`
- `admin-catalog/index.html`
- `functions/api/admin/media_library_list.js`
- `scripts/media_library_picker_check.py`
- `scripts/cloudflare_pages_functions_check.py`
- `scripts/inventory_image_picker_check.py`
- `scripts/release_check.py`
- `sql/2026-05-18_build151_media_library_inventory_image_workflow.sql`
- `SUPABASE_SCHEMA.sql`
- `DEVELOPMENT_ROADMAP.md`
- `KNOWN_GAPS_AND_RISKS.md`
- `SANITY_CHECK.md`

## Release check

```bash
python scripts/release_check.py
```

## Deploy note

Apply SQL migrations in order. If `app_media_library` is not seeded yet, Admin Catalog should keep working from app settings and bundled product/tool image fallbacks. Build 153 should also avoid the prior Cloudflare deploy regex failure.

<!-- Build 153 sync 2026-05-18 -->

## Build 153 focus

Build 153 is a Cloudflare Pages Functions deploy hotfix. It repairs unresolved `_lib` imports in root API route files, preserves the media-library image workflow from Build 151/152, keeps the duplicate landing-page key cleanup, and adds import-resolution checking to the deploy-safety script. No database DDL is required.

## Build 154 Cloudflare stale root function shim hotfix - 2026-05-19

Cloudflare still saw older flat `/functions/api/*.js` route files after GitHub web uploads, because uploading ZIP contents does not reliably delete older files from the branch. Build 154 intentionally includes compatibility shim files for the stale flat routes listed in the Cloudflare deploy log. Each shim re-exports the active `/functions/api/admin/*.js` implementation and prevents Pages Functions bundling failures while preserving the newer admin route implementation.

Next step: after Build 154 deploys cleanly, optionally remove the compatibility shims in a clean-branch/orphan rebuild so only the intended folder-backed route files remain.

