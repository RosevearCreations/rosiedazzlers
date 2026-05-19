# Database Structure Current — Build 153

**Updated:** 2026-05-18

## Inventory/media tables in active use

### `catalog_inventory_items`

Current inventory source of truth for saved tools and consumables. Important fields include:

- `item_key`, `item_type`, `name`, `category`, `subcategory`
- `image_url`, `amazon_url`, Amazon match enrichment fields
- `qty_on_hand`, `reorder_point`, `reorder_qty`, `unit_label`, `cost_cents`
- `preferred_vendor`, `vendor_sku`, `receipt_url`, `assigned_station`
- `service_tags`, `reuse_policy`, `is_public`, `is_active`

### `catalog_inventory_movements`

Tracks stock usage, manual adjustments, waste/write-off actions, and booking-linked inventory movement.

### `catalog_purchase_orders`

Tracks reorder requests, ordered/received status, reminder dates, purchase URL, vendor, quantity, and receive lifecycle.

### `app_media_library`

Build 151 DB-backed shared media-library target. Used by `/api/admin/media_library_list` and Admin Catalog image picker when available.

Important fields:

- `media_key`, `label`, `media_type`, `media_url`, `fallback_url`
- `alt_text`, `caption`, `group_key`, `usage_contexts`
- `recommended_size`, `source_status`, `sort_order`, `updated_at`, `updated_by`

## Fallback order

1. Saved DB rows in `catalog_inventory_items`.
2. `app_media_library` rows for picker/search if available.
3. `app_management_settings.media_library` rows if the table is not populated yet.
4. Bundled JSON product/tool rows from `data/rosie_products_catalog.json` and `data/systems_catalog.json`.
5. Browser-local helper image URLs.

## Build 151 migration

Apply:

```sql
sql/2026-05-18_build151_media_library_inventory_image_workflow.sql
```

This migration is non-destructive and safe to apply before the media library is populated.

## Build 153 schema note

Build 153 is a deploy hotfix and release-check hardening pass. It does not add or change database tables. The current schema remains Build 151 plus the Build 150 inventory image indexes.

<!-- Build 153 sync 2026-05-18 -->

## Build 153 schema note

Build 153 has no database DDL. The schema remains the Build 151 media-library baseline plus Build 150 inventory image indexes. This pass only repairs Cloudflare Pages Functions import resolution and deploy checks.
