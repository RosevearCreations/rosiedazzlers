# AI Context — Rosie Dazzlers Build 151

**Updated:** 2026-05-18

Current branch baseline is Build 151.

Key context for future AI/code work:

- Admin Catalog inventory uses DB-first rows from `catalog_inventory_items` with bundled JSON fallback.
- Build 150 fixed blank DB images masking bundled fallback images.
- Build 151 added `/api/admin/media_library_list`, media-library picker support, selected-row image repair, duplicate-image diagnostics, and browser image health scan.
- Keep `admin-catalog.html` and `admin-catalog/index.html` synchronized.
- Keep `SUPABASE_SCHEMA.sql` and `sql/*.sql` synchronized with every schema-related update.
- Keep `DEVELOPMENT_ROADMAP.md`, `KNOWN_GAPS_AND_RISKS.md`, `SANITY_CHECK.md`, and handoff docs updated every pass.
- Continue one-H1-per-exposed-page checks, local SEO wording, CSS layout checks, and redirect-loop avoidance.

Important release command:

```bash
python scripts/release_check.py
```

<!-- Build 151 sync 2026-05-18 -->
