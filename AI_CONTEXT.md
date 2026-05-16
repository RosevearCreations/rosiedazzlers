# AI Context — Build 143

The user works on Rosie Dazzlers on the `dev` branch. Every build pass should update Markdown/schema notes, keep public pages to one H1, check CSS/static links, and move toward DB-first app behavior while preserving JSON fallback.

## Latest fix

Consumables showed only two items because the public page stopped at the DB/API result. The DB currently had only two edited/imported rows. Build 143 changed Consumables and Gear to merge DB rows over bundled fallback JSON rows.

## Important files

- `consumables.html`
- `consumables/index.html`
- `gear.html`
- `gear/index.html`
- `data/rosie_products_catalog.json`
- `data/systems_catalog.json`
- `scripts/catalog_fallback_check.py`
