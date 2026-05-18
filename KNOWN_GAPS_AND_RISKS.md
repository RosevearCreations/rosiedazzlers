# Known Gaps and Risks — Build 150

**Updated:** 2026-05-17

## Reduced in this pass

- Inventory Workflow no longer treats saved DB rows with blank `image_url` as missing when the bundled consumables/tools catalog has the matching image.
- Admin Catalog now has a real existing-image picker and selected-image preview instead of only a plain pasted URL field.
- Product/tool image suggestions now include bundled consumables and systems image URLs.
- Inventory save can auto-fill a matching bundled image if the editor image field is left blank.
- Release checks now include an inventory image picker/fallback coverage guard.
- Canonical schema tracking now includes the latest inventory receipt, station, service tag, image, and Amazon match fields.

## Still open

1. The picker currently reads bundled fallback rows and saved helper URLs; it is not yet a full R2 upload manager.
2. Existing DB rows with blank images will display fallback-matched images in the UI, but the URL is only persisted after the item is saved or a future bulk repair tool writes it.
3. Supabase dev still needs the Build 150 SQL migration applied and smoke-tested.
4. External location photos are still placeholders and should be replaced with Rosie-owned/R2-hosted images.
5. Service-area rows are still edited through the pricing catalog JSON source until the DB-first service-area editor is completed.
6. Water-rule data still needs review dates and clearer source tracking in the editor.
7. Search Console and Google Business Profile reporting are not yet connected.
8. Reviews and before/after proof are not yet automatically filtered by town/service page.
9. Inventory/accounting still needs stock-count sessions, variance review, and lockable month-end inventory valuation.
10. Some historical Markdown snapshots remain for traceability, but active docs are the Build 150 working handoff source.

<!-- Build 150 sync 2026-05-17: reviewed during Admin Catalog image picker/fallback repair, schema synchronization, release checks, and local SEO/H1 discipline pass. -->
