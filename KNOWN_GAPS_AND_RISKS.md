# Known Gaps and Risks — Build 145

**Updated:** 2026-05-15

## Reduced in this pass

- Admin Catalog now has a DB import preview and selected-row import workflow for bundled consumables and gear.
- Public catalog pages still stay safe because bundled JSON and DB rows are merged until the DB import is complete.
- Optional newer inventory fields are compatibility-safe; the save endpoint strips unsupported optional columns if the live DB has not been migrated yet.
- Bulk public/private and active/inactive controls are available for saved rows.
- Catalog quality reporting now highlights missing cost, generic categories, and missing media.

## Still open

1. Run `sql/2026-05-15_build145_catalog_db_import_admin_workflows.sql` in Supabase dev.
2. Import catalog rows in small batches and verify DB/API/public-page behaviour before importing everything.
3. Build import-history screens from the new import batch tables.
4. Replace receipt URL fields with real R2 upload/attachment support.
5. Add a vendor directory editor and link vendors to payables/accounting.
6. Add service-product links to public service pages for trust and local SEO.
7. Replace sample reviews with real review API data when the provider is connected.
8. Keep county water rules reviewed before dry-weather dispatch.
9. Continue checking CSS/table overflow because admin pages are dense and drift easily.
10. Search ranking is not guaranteed; the app can only improve relevance, crawlability, review proof, and prominence signals.
