# Repo Guide — Build 145

## Important folders

- `functions/api/` — valid Cloudflare Pages Functions.
- `data/` — bundled fallback catalog, service-area, SEO, media, review, and import seed data.
- `scripts/` — release, SEO, catalog, and schema sanity checks.
- `sql/` — Supabase migrations/notes.
- `archive/` — historical Markdown snapshots.

## Current cleanup rule

Root-level API `.js` files are invalid and should not return. The only root-level JavaScript file should be `service-worker.js`.
