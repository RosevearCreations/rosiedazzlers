# Repo Guide — Build 151

**Updated:** 2026-05-18

## Main areas

- Public pages: root HTML files plus folder-backed `index.html` routes.
- Admin pages: `admin-*.html` plus matching folder-backed routes.
- Cloudflare Functions: `functions/api/**`.
- Shared admin/runtime scripts: `assets/**` and `_lib/**`.
- Data fallbacks: `data/**`.
- SQL migrations: `sql/**`.
- Release checks: `scripts/**`.
- Active docs: root Markdown files listed in `DOC_INDEX.md`.

## Build 151 rule

When changing Admin Catalog, keep the root and folder-backed page copies synchronized:

- `admin-catalog.html`
- `admin-catalog/index.html`

When changing schema or database-facing behavior, update:

- `SUPABASE_SCHEMA.sql`
- a dated migration or no-DDL note under `sql/`
- `DATABASE_STRUCTURE_CURRENT.md`
- roadmap/gaps/sanity handoff docs

<!-- Build 151 sync 2026-05-18 -->
