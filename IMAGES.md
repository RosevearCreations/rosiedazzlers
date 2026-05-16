# Images and Media Guide — Build 145

## Public catalog images

- Consumables fallback source: `data/rosie_products_catalog.json`
- Gear/tools fallback source: `data/systems_catalog.json`
- Preferred public image size: 1200×800 or larger, landscape or square.
- Public cards use `object-fit: contain` to avoid cropped/zoomed product photos.
- Run `python scripts/catalog_quality_report.py` to refresh `data/catalog_quality_report.json`.

## Admin Catalog media workflow

1. Open `/admin-catalog`.
2. Click an item name.
3. Review the Image URL.
4. Add receipt/bill URL if available.
5. Add service tags if the item supports a public service page.
6. Save the item.
7. Use quality score and missing-image report to find weak rows.

## Future R2 direction

Receipt files and product images should move to an authenticated upload workflow later. For now, URLs are stored as text fields and the bundled JSON remains the fallback source.
