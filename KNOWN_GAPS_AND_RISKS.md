# Known Gaps and Risks — Build 149

**Updated:** 2026-05-17

## Reduced in this pass

- Service areas and travel tiers no longer render as one long editor list in Admin App.
- Saving in Admin App now gives visible feedback through the shell status and green `Saved ✓` button state.
- Tillsonburg landing page image handling is more robust, with a direct image URL and fallback if the remote image fails.
- Landing-page images now have `onerror` fallback handling so visitors do not see a broken image box.
- Release checks now validate the compact Admin App service-area editor.

## Still open

1. External location photos are still placeholders and should be replaced with Rosie-owned/R2-hosted images.
2. The Admin App still needs a true media picker/uploader.
3. Service-area rows are still edited through the pricing catalog JSON source until the DB-first service-area editor is completed.
4. Water-rule data still needs review dates and clearer source tracking in the editor.
5. Search Console and Google Business Profile reporting are not yet connected.
6. Catalog DB import and Amazon match workflows still need live Supabase migration testing.
7. Reviews and before/after proof are not yet automatically filtered by town/service page.
8. Some legacy Markdown still exists in older archived snapshots for history, but active docs are the working handoff source.

<!-- Build 149 sync 2026-05-17: reviewed during Admin App service-area dropdown editor, save-feedback, Tillsonburg image fallback, local SEO/H1/CSS/release-check pass. -->
