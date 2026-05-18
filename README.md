# Rosie Dazzlers Dev Build — Build 151

**Updated:** 2026-05-18

This ZIP is the current dev baseline for Rosie Dazzlers.

## Build 151 focus

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

Apply SQL migrations in order. If `app_media_library` is not seeded yet, Admin Catalog should keep working from app settings and bundled product/tool image fallbacks.

<!-- Build 151 sync 2026-05-18 -->
