# Database Structure Current — Build 150

**Updated:** 2026-05-17

## Catalog migration state

The catalog inventory table may contain only edited/imported rows. Public pages and Admin Catalog must not treat partial DB rows as the full catalog until a complete import is done.

## Current safe pattern

- Public pages load bundled fallback JSON.
- Public pages load Supabase catalog rows.
- Matching DB rows override fallback rows for saved fields.
- Blank saved image fields must not mask bundled fallback images.
- Non-imported fallback rows remain visible.

## Build 150 inventory/image fields

`catalog_inventory_items` now tracks the current editor fields in the canonical schema:

- `image_url`
- `receipt_url`
- `assigned_station`
- `service_tags`
- `last_counted_at`
- `public_badge`
- `amazon_asin`
- `amazon_title`
- `amazon_match_status`
- `amazon_match_score`
- `amazon_seller_name`
- `amazon_brand`
- `amazon_category`
- `amazon_quantity_total`
- `amazon_net_total_cents`

## Related SQL notes

- `sql/2026-05-17_build150_inventory_image_picker_and_fallback.sql`
- `sql/2026-05-15_build145_catalog_db_import_admin_workflows.sql`
- `sql/2026-05-15_build146_amazon_csv_catalog_matching.sql`

<!-- Build 150 sync 2026-05-17: reviewed during Admin Catalog image picker/fallback repair, schema synchronization, release checks, and local SEO/H1 discipline pass. -->
