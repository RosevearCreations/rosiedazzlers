# Rosie Dazzlers — Dev Build Handoff

**Last reset:** 2026-05-10  
**Active branch:** `dev`  
**Build pass:** 139 corrected-package cleanup

Rosie Dazzlers is a mobile auto-detailing website and operations app for Norfolk and Oxford County. The repo contains public marketing pages, booking flows, admin tools, inventory/catalog workflows, accounting screens, media management, and Cloudflare Pages Functions backed by Supabase.

## What this reset did

- Applied the cleanup pass to the corrected `rosiedazzlers-dev(135).zip` package.
- Archived the older Markdown set under `archive/2026-05-10-markdown-reset/`.
- Rebuilt the active Markdown files as a smaller, clearer working set.
- Removed misplaced root-level API JavaScript duplicates; live API files belong under `functions/api/`.
- Preserved `service-worker.js` at root because it is a public browser asset.
- Moved `membership_reminders_process.js` into `functions/api/` so `/api/membership_reminders_process` remains deployable.
- Added a no-DDL schema note for this cleanup pass.

## Current source-of-truth files

Read these first in a new chat or development pass:

1. `SANITY_CHECK.md`
2. `DEVELOPMENT_ROADMAP.md`
3. `KNOWN_GAPS_AND_RISKS.md`
4. `CURRENT_IMPLEMENTATION_STATE.md`
5. `PROJECT_BRAIN.md`
6. `REPO_GUIDE.md`
7. `IMAGES.md`
8. `SUPABASE_SCHEMA.sql`

## Operating rules

- Keep `dev` as the working branch unless explicitly told otherwise.
- Every build pass must update Markdown and schema notes.
- Public pages should have no more than one H1.
- Keep local SEO wording clear: mobile auto detailing, interior detailing, ceramic coating, paint correction, pet hair removal, engine cleaning, Tillsonburg, Woodstock, Ingersoll, Simcoe, Delhi, Port Dover, Norfolk County, and Oxford County.
- Keep JSON as a bundled fallback, but prefer DB-backed/admin-managed sources where the workflow is stable.
