# Handoff Next Chat — Build 143

Start from `dev` and this package. The latest pass fixed the public catalog fallback merge issue where Consumables showed only two DB-edited items instead of the full catalog.

## What changed

- `consumables.html` and `consumables/index.html` merge DB rows over bundled fallback rows.
- `gear.html` and `gear/index.html` received the same safety pattern.
- Added `scripts/catalog_fallback_check.py`.
- Wired the catalog fallback check into `scripts/release_check.py`.
- Added a no-DDL schema tracking note.

## Highest-priority next work

1. Add Admin Catalog bulk import from bundled JSON to Supabase.
2. Add duplicate matching by item key/name/image URL before import.
3. Add import review screen for gear and consumables.
4. Add one-click “publish to public catalog” controls.
5. Add inventory image completeness scoring.
