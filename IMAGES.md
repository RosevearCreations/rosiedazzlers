# Images and Media Guide — Build 142

**Updated:** 2026-05-15

## Main image sizes

- Hero/service images: 1600×900 or larger, landscape preferred.
- Before/after gallery images: 1200×900 or larger, matching angles when possible.
- Add-on cards: 1200×800 or larger, avoid tight crops; use PNG/JPG as primary and SVG only as fallback.
- Product/consumable images: 1200×1200 square preferred.
- Review/proof images: 1200×900 or larger.

## Current source-of-truth locations

- Pricing/add-on image URLs: `data/rosie_services_pricing_and_packages.json`
- Media seed/fallback: `data/media_library_seed.json` if present
- Gallery/proof samples: gallery JSON plus review/sample files
- Service/town page imagery: landing page settings/API content first, then fallback images

## Replacement workflow

1. Upload the image/video to R2.
2. Copy the public URL.
3. Update the relevant Admin App field or JSON fallback.
4. Keep alt text plain and descriptive.
5. Prefer PNG/JPG primary URLs for real photos. Use SVG only for safe fallback or icon/outline purposes.
6. Re-run static/release checks before deployment.

<!-- Build 143 sync 2026-05-15: public Consumables/Gear now merge DB catalog rows with bundled fallback catalogs so partial DB imports do not hide unedited items. -->
