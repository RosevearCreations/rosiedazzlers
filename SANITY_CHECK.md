# Sanity Check — Build 143

**Package base:** `rosiedazzlers-dev(139).zip`  
**Updated:** 2026-05-15

## Issue fixed

The Consumables page was showing only two items because the public page trusted the DB/API response as soon as it found any rows. Since only two items had been edited/imported, the bundled catalog was hidden.

## Fix

- Consumables now loads bundled JSON and DB rows.
- Gear now uses the same safer merge pattern.
- DB rows override matching bundled rows.
- Bundled rows remain visible when they have not yet been saved to the DB.

## Checks to run

- `python scripts/release_check.py`
- `python scripts/catalog_fallback_check.py`
- Browser check `/consumables`
- Browser check `/gear`

## Expected result

- Consumables should show the full bundled catalog plus DB-edited rows.
- Gear should show the full bundled catalog plus DB-edited rows.
- Root-level duplicate API JavaScript was removed again; valid handlers remain under `functions/api/`.
