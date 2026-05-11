# Sanity Check — Build 139

**Package corrected:** `rosiedazzlers-dev(135).zip`  
**Date:** 2026-05-10

## Completed in this cleanup pass

- Archived old root Markdown into `archive/2026-05-10-markdown-reset/`.
- Rebuilt the important active Markdown files as fresh clear documents.
- Removed root-level duplicate API JavaScript files that were already represented under `functions/api/` or `functions/api/admin/`.
- Moved `membership_reminders_process.js` into `functions/api/`.
- Kept `service-worker.js` at root because it is valid public browser code.
- Added cleanup manifests.
- Updated `SUPABASE_SCHEMA.sql` with a Build 139 no-DDL cleanup note.
- Added `sql/2026-05-10_build139_corrected_dev_cleanup_no_ddl_note.sql`.

## Active docs after reset

- `README.md`
- `DEVELOPMENT_ROADMAP.md`
- `KNOWN_GAPS_AND_RISKS.md`
- `SANITY_CHECK.md`
- `HANDOFF_NEXT_CHAT.md`
- `NEW_CHAT_STATUS.md`
- `CURRENT_IMPLEMENTATION_STATE.md`
- `PROJECT_BRAIN.md`
- `REPO_GUIDE.md`
- `IMAGES.md`
- `DOC_INDEX.md`

## Deployment reminder

Use `dev` as the working branch. Do not merge changes to `main` unless explicitly requested.
## Extra route sanity applied

- Synced `admin/index.html` from `admin.html`.
- Synced `book/index.html` from `book.html`.
- This removed non-identical clean-route wrapper collisions found during static stress checks.

