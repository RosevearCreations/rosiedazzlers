# Repository Guide — Build 143

**Branch:** `dev`

## Important folders

- `functions/api/` — Cloudflare Pages Functions.
- `assets/` — shared browser JavaScript/CSS helpers.
- `data/` — deploy-safe JSON fallback data.
- `scripts/` — release checks and data validation helpers.
- `sql/` — Supabase migrations and no-DDL tracking notes.
- `archive/` — historical docs and retired files.

## Public catalog rule

During migration, public catalog pages must merge DB rows with bundled JSON fallback rows. Do not replace the whole public catalog with the DB response until full import and validation are complete.
