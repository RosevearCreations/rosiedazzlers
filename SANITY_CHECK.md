# Sanity Check — Build 147

**Updated:** 2026-05-16

## What to test after deploy

1. Open Admin App and confirm no `mergeServiceAreaRows is not defined` message appears.
2. Confirm the console no longer reports `saveCatalogDropdownOptionsBtn` missing.
3. Edit and save dropdown option lists in Admin App.
4. Reload Admin App and confirm dropdown option lists persist or fall back safely.
5. Open Services/Pricing/Book on a phone-sized screen and confirm the main menu is collapsed until **Menu** is tapped.
6. Tap outside the menu, press Escape on desktop, and tap a menu link to confirm it closes.
7. Confirm the account widget no longer stretches the mobile header into a tall stack.
8. Open Consumables and Gear and confirm bundled rows still appear even when DB has only a few saved rows.
9. Confirm public pages still have exactly one H1.
10. Run `python scripts/release_check.py` before deployment.

## Passed locally in this package

- Static checks are expected to pass after this build.
- Mobile navigation guard added through `scripts/mobile_nav_check.py`.
- Root duplicate API JS files were removed again, leaving `service-worker.js` as the only root JS file.

<!-- Build 147 sync 2026-05-16: Admin App mergeServiceAreaRows repair, dropdown option editor, compact mobile navigation, release-check guardrails, root API duplicate cleanup, local SEO/H1 discipline. -->
