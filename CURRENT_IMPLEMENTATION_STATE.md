# Current Implementation State — Build 146

**Updated:** 2026-05-15

## Current build focus

Build 146 adds an Amazon Business CSV enrichment workflow for Rosie Dazzlers inventory. The app can now compare the Amazon order export against bundled gear/consumables, generate sanitized match data, review confidence levels in Admin Catalog, and save selected Amazon purchase fields into DB-backed inventory rows.

## Important current files

- `scripts/amazon_catalog_match.py` — regenerates Amazon match outputs from a private CSV.
- `data/amazon_catalog_matches.json` — sanitized match review data.
- `data/amazon_inventory_enrichment_preview.json` — import/edit payload preview for matched rows.
- `data/amazon_inventory_match_review.csv` — flat review file for manual checking.
- `admin-catalog.html` — includes the Amazon CSV match review panel.
- `functions/api/admin/catalog_inventory_save.js` — accepts optional Amazon enrichment fields.
- `functions/api/admin/catalog_bulk_import.js` — accepts optional Amazon enrichment fields.
- `sql/2026-05-15_build146_amazon_csv_catalog_matching.sql` — optional DB columns/indexes for Amazon match metadata.

## Deployment posture

The original Amazon CSV should not be deployed. The generated JSON/CSV outputs are sanitized to avoid payment identifiers, account emails, receiver emails, and full seller addresses. For stronger privacy, the next step is a private admin upload/API workflow.
