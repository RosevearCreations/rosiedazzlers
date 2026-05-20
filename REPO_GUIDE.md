# Repo Guide — Build 152

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

## Build 152 rule

When changing Admin Catalog, keep the root and folder-backed page copies synchronized:

- `admin-catalog.html`
- `admin-catalog/index.html`

When changing schema or database-facing behavior, update:

- `SUPABASE_SCHEMA.sql`
- a dated migration or no-DDL note under `sql/`
- `DATABASE_STRUCTURE_CURRENT.md`
- roadmap/gaps/sanity handoff docs

<!-- Build 152 sync 2026-05-18 -->

## Build 153 synchronization note

Reviewed during the 2026-05-19 Cloudflare Pages Functions import-path hotfix. No document-specific workflow change was required here; active handoff, roadmap, sanity, and schema docs carry the detailed Build 153 notes.

## Build 156 sync note - social progress publishing

Build 156 adds a reviewable social publishing foundation. Admin Progress can now create internal social drafts from job updates/media, Admin Social Queue can review and mark those drafts, and the schema now includes `social_channels`, `social_post_queue`, and `social_dispatch_attempts`. Direct posting to X, Facebook, Instagram, TikTok, Google Business Profile, and other platforms is possible later after the required platform credentials, app approvals, and consent/compliance checks are in place.
