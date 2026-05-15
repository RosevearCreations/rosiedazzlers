# Sanity Check — Build 141

**Package:** `rosiedazzlers-dev(137).zip`  
**Updated:** 2026-05-14

## Completed

- Restored Norfolk County and Oxford County service-area coverage.
- Added many individual towns/communities and county fallback rows.
- Added `/data/service_area_rules.json`.
- Made booking service-area entry typeable with a datalist.
- Added county fallback rule resolution in `assets/pricing-catalog-client.js`.
- Added editable Admin App service-area fields for water reminders and local by-law notes.
- Updated pricing catalog fallback JSON and admin dropdown option libraries.
- Updated local SEO target data for broader service-area coverage.
- Synced `/book/` and `/admin-app/` clean-route copies.
- Updated Markdown and schema notes.

## Checks to keep running

- One H1 per exposed public page.
- Static internal links are valid.
- JSON files parse.
- Main JS modules parse.
- Booking still loads service areas when Supabase settings are unavailable.
- Admin App can save pricing catalog/service-area rows after editing.
- Official county water pages should be rechecked before dispatch when conditions are dry or restrictions change.

<!-- Build 141 sync 2026-05-14: reviewed during Norfolk/Oxford service-area, water-rule fallback, typeable booking location, local SEO, and docs/schema pass. -->


## Build 141 cleanup note

Root-level duplicate API JavaScript files were removed again; valid API handlers remain under `functions/api/` and `functions/api/admin/`, while `service-worker.js` remains at the public root.
