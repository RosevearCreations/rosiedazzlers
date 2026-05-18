# Sanity Check — Build 151

**Updated:** 2026-05-18

## Release checks to run

```bash
python scripts/release_check.py
```

Build 151 release check coverage includes:

- JSON parsing under `data/`
- `sitemap.xml` parsing
- static page/link checks
- local SEO/H1 audit
- catalog fallback merge checks
- service-area rule checks
- catalog quality report
- catalog DB import preview
- service/product link checks
- Amazon catalog match checks
- mobile navigation checks
- landing-photo checks
- Admin App editor checks
- inventory image picker/fallback checks
- media-library picker / repair / duplicate / health-scan checks

## Manual smoke tests after deploy

1. Open Admin Catalog while signed in as staff/admin.
2. Confirm inventory loads even if `/api/admin/catalog_inventory_list` falls back or returns partial DB rows.
3. Edit a saved DB item that previously had a blank image and confirm the fallback-matched image appears.
4. Open **Pick existing image** and confirm bundled images plus media-library rows appear when available.
5. Select a fallback-matched row and click **Repair selected images**.
6. Reload and confirm the image remains saved on the row.
7. Click **Scan visible images** and confirm failed images are reported without breaking the page.
8. Confirm duplicate-image warnings are informational and do not block editing.
9. Check Home, Services, Pricing, Book, Gear, Consumables, Gallery, and Contact for one H1 and normal CSS layout.
10. Confirm clean routes do not create redirect loops.

## Known deploy caution

`app_media_library` may not be populated on dev yet. That is okay. Admin Catalog should still work through app settings and bundled JSON/R2 fallbacks.

<!-- Build 151 sync 2026-05-18 -->
