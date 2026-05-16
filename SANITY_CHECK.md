# Sanity Check — Build 146

**Updated:** 2026-05-15

## Checks completed in this package

- Amazon CSV match outputs generated from the supplied CSV.
- Amazon match output privacy guard added to release checks.
- Admin Catalog Amazon match review workflow added.
- Optional Amazon enrichment fields added to inventory save/import APIs.
- Schema migration added for optional `amazon_*` catalog inventory fields.
- Public catalog fallback merge preserved for consumables and gear.
- Release checks should include JSON/XML parse, static stress checks, local SEO audit, catalog fallback check, service-area rule check, catalog quality/import checks, service-product link check, and Amazon match check.

## Manual sanity steps after upload

1. Open `/admin-catalog.html`.
2. Use **Amazon CSV match review → Load Amazon matches**.
3. Keep filter on **Strong matches** and save a small selected batch.
4. Reload inventory and confirm saved rows show Amazon URL, cost, quantity, vendor SKU/ASIN, and notes.
5. Switch filter to **Needs review** and open individual matches in the editor before saving.
6. Open `/consumables` and `/gear` to confirm full fallback catalog still appears.
7. Run the Build 146 SQL in Supabase dev before depending on persistent `amazon_*` columns.
