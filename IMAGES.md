# Images and Media Guide — Build 140

**Updated:** 2026-05-14

## Current image source order

1. Supabase media library (`app_media_library`) once the Build 140 SQL is applied and editors are built.
2. App settings / Admin App fields.
3. Bundled catalog JSON in `data/`.
4. R2 public URLs.
5. Local SVG/PNG fallback assets.

## Recommended sizes

- Home hero: 1600×900.
- Before/after pair: 1200×900 or 1600×1200, matched angle.
- Add-on card: 1200×800 landscape.
- Gallery thumbnail: 800×800 square or 1200×900 landscape.
- Inventory item: 1000×1000 square.
- Social preview: 1200×630.

## Replacement workflow

For each admin image field, aim for:

- Current image preview.
- Primary image URL.
- Fallback image URL.
- Alt text.
- Caption/usage note.
- Recommended size note.
- Keep/replace choice.

## New Build 140 files

- `data/media_library_seed.json` documents media groups and recommended sizes.
- `sql/2026-05-10_build140_value_add_roadmap_foundations.sql` adds the optional `app_media_library` table.
