# Repo Guide — Build 145

## Important folders

- `functions/api/` — valid Cloudflare Pages Functions.
- `data/` — bundled fallback catalog, service-area, SEO, media, review, and import seed data.
- `scripts/` — release, SEO, catalog, and schema sanity checks.
- `sql/` — Supabase migrations/notes.
- `archive/` — historical Markdown snapshots.

## Current cleanup rule

Root-level API `.js` files are invalid and should not return. The only root-level JavaScript file should be `service-worker.js`.

<!-- Build 146 sync 2026-05-15: Amazon CSV catalog matching/enrichment pass; docs/schema reviewed; keep one-H1, local SEO, CSS overflow, privacy-safe generated data, and DB-first inventory migration discipline. -->

<!-- Build 147 sync 2026-05-16: Admin App mergeServiceAreaRows repair, dropdown option editor, compact mobile navigation, release-check guardrails, root API duplicate cleanup, local SEO/H1 discipline. -->
