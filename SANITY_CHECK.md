# Sanity Check — Build 145

**Package base:** `rosiedazzlers-dev(140).zip`  
**Updated:** 2026-05-15

## Checks to run

```bash
python scripts/release_check.py
python scripts/stress_static_checks.py
python scripts/local_seo_audit.py
python scripts/catalog_fallback_check.py
python scripts/catalog_quality_report.py
python scripts/catalog_import_preview.py
python scripts/service_product_links_check.py
python scripts/service_area_rules_check.py
```

## Browser checks

1. `/admin-catalog` opens without console errors.
2. Inventory table shows full bundled consumables/gear plus DB rows.
3. Clicking an item name opens the editor.
4. **Preview import** shows create/review/skip decisions.
5. **Import selected** saves selected bundled rows to DB.
6. Bulk public/private buttons only affect selected saved rows.
7. Mobile quick stock adjustment updates stock and movement history for saved rows.
8. `/consumables` shows more than two items.
9. `/gear` shows the bundled gear/tool list plus DB overrides.
10. Public pages still have only one H1 each.

## Supabase action

Run this in Supabase dev before relying on all new optional fields and tables:

`sql/2026-05-15_build145_catalog_db_import_admin_workflows.sql`
