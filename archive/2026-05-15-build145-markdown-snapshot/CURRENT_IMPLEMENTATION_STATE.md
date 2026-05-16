# Current Implementation State — Build 143

**Updated:** 2026-05-15

## Public website

- Booking, pricing, services, review proof, add-on imagery, service-area rules, and local landing pages are active.
- Booking service areas support typeable towns plus a full picker for Oxford and Norfolk communities.
- Public Consumables and Gear pages now merge DB rows with bundled fallback catalogs so partial DB imports do not hide unedited items.
- Consumables fallback source: `data/rosie_products_catalog.json`.
- Gear/tools fallback source: `data/systems_catalog.json`.

## Admin/backend

- Admin App and Admin Catalog continue moving toward DB-first editable data.
- Catalog DB rows may exist for edited items only; public pages now handle that partial migration safely.
- Full DB import/management for consumables and gear remains a next step.

## Release checks

- `scripts/release_check.py`
- `scripts/stress_static_checks.py`
- `scripts/local_seo_audit.py`
- `scripts/catalog_fallback_check.py`

## Schema state

Build 143 is a no-DDL pass. It adds fallback-merge behavior and a schema note only.
