# Inventory Manager Table

Build 234 adds `/admin-inventory-manager.html` without replacing `/admin-catalog.html`.

## Capabilities
- Inline row updates for name, type, category, quantity, cost, vendor, unit, reorder point, visibility and notes.
- Suspicious-name detection for ASIN-like and placeholder names.
- Active, archived, missing-category and name-review filters.
- Soft archive by setting `is_active=false` and `is_public=false`.
- Restore without recreating the inventory record.
- Desktop table and mobile card presentation.

## Boundary
The existing inventory workflow, Amazon-link importer, stock movements, usage, purchase orders and full editor remain unchanged. Build 234 adds no hard-delete control and no database migration.
