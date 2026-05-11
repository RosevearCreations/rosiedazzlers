# Repo Guide

## Key locations

- `index.html`, `services.html`, `pricing.html`, `book.html` — public conversion pages.
- `admin-app.html` — app/pricing/landing/add-on settings.
- `admin-catalog.html` — gear, consumables, inventory, reorder workflow.
- `admin-accounting.html` — accounting/reporting workflow.
- `assets/` — browser JavaScript, CSS, shared public/admin helpers.
- `data/` — bundled fallback JSON catalogs and sample/static data.
- `functions/api/` — Cloudflare Pages Functions. This is the valid API location.
- `functions/api/admin/` — admin-only API functions.
- `functions/api/_lib/` — shared API helpers.
- `sql/` — migrations and schema notes.
- `archive/` — retired documentation and cleanup manifests.

## Root file rule

Root `.js` files should be public browser assets only. API endpoint JavaScript belongs under `functions/api/`.

## Documentation rule

Use the active root Markdown files for current status. Older Markdown lives in the archive and should not be treated as current source of truth.
