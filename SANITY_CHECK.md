# Sanity Check — Build 150

**Updated:** 2026-05-17

## Completed this pass

- Repaired Admin Catalog inventory image fallback merging.
- Added selected product-image preview in the inventory editor.
- Added existing bundled image picker and image search.
- Added one-click matching bundled image restore.
- Added inventory image picker release check.
- Added Build 150 SQL migration and synchronized `SUPABASE_SCHEMA.sql`.
- Updated active Markdown handoff files.

## Checks to run before deployment

```bash
python scripts/release_check.py
```

Manual checks:

1. Open Admin Catalog / Inventory Workflow.
2. Edit a saved DB inventory row that previously said **Missing image**.
3. Confirm a matching bundled consumables/tools image appears in the preview or can be loaded by **Use matching bundled image**.
4. Click **Pick existing image**, search by product name, and select a thumbnail.
5. Save the inventory item and reload the page.
6. Confirm the saved row shows **Image set** and no longer appears as a missing-image problem.
7. Confirm mobile width shows a usable two-column image picker.
8. Confirm `/consumables` and `/gear` still show the full fallback catalog.
9. Confirm public pages still have no more than one H1 each.
10. Confirm `/admin-catalog/` and `/admin-catalog.html` both use the same updated editor.

<!-- Build 150 sync 2026-05-17: reviewed during Admin Catalog image picker/fallback repair, schema synchronization, release checks, and local SEO/H1 discipline pass. -->
