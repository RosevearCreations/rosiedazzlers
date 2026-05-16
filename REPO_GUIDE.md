# Repository Guide — Build 142

**Branch:** `dev`

## Important folders

- `functions/api/` — Cloudflare Pages Functions.
- `assets/` — shared browser JavaScript/CSS helpers.
- `data/` — deploy-safe JSON fallback data.
- `sql/` — Supabase migrations and no-DDL tracking notes.
- `archive/` — historical Markdown snapshots.

## Current rule

Do not place API handler `.js` files at the repository root. Root JavaScript should only contain valid public browser assets such as `service-worker.js`.
