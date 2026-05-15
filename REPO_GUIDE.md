# Repo Guide — Build 140

## Important folders

- `functions/api/` — Cloudflare Pages Functions.
- `functions/api/admin/` — admin/staff Pages Functions.
- `assets/` — public browser JavaScript and shared frontend helpers.
- `data/` — bundled public/admin fallback JSON.
- `sql/` — Supabase migrations and schema notes.
- `archive/` — old documentation snapshots.

## Important scripts

- `scripts/stress_static_checks.py`
- `scripts/local_seo_audit.py`
- `scripts/release_check.py`

## Do not re-add

- Root-level duplicate API endpoint `.js` files.
- Multiple H1 tags on exposed public pages.
- Hardcoded one-off image URLs when a catalog/media-library source exists.

<!-- Build 141 sync 2026-05-14: reviewed during Norfolk/Oxford service-area, water-rule fallback, typeable booking location, local SEO, and docs/schema pass. -->
