# Sanity Check — Build 149

**Updated:** 2026-05-17

## Completed this pass

- Replaced the long Service areas/travel tiers editor with a compact dropdown editor.
- Added Save/Duplicate/Delete controls for the selected service-area row.
- Added button-level save confirmation in Admin App.
- Repaired Tillsonburg landing image handling and added missing-image fallbacks.
- Added `scripts/admin_app_editor_check.py`.
- Updated active Markdown and schema notes.

## Checks to run before deployment

```bash
python scripts/release_check.py
```

Manual checks:

1. Open Admin App → Pricing source of truth → Service areas and travel tiers.
2. Confirm the section is a dropdown editor, not a long list of all towns.
3. Pick several service areas and confirm the fields change.
4. Edit one water-rule note and click **Save selected service area**; confirm the button changes to `Saved ✓`.
5. Open `/tillsonburg-auto-detailing/` and confirm the image appears or falls back gracefully.
6. Save Landing pages and Pricing catalog; confirm the buttons give visible save feedback.
7. Check mobile menu at phone width.
8. Confirm `/consumables` still shows the full fallback catalog.

<!-- Build 149 sync 2026-05-17: reviewed during Admin App service-area dropdown editor, save-feedback, Tillsonburg image fallback, local SEO/H1/CSS/release-check pass. -->
