# New Chat Status

**Current package:** corrected dev cleanup build 139  
**Date:** 2026-05-10

## What changed last

The wrong package was replaced with the corrected dev package. The cleanup pass was reapplied to that package:

- old Markdown archived,
- active docs refreshed,
- root API duplicates removed,
- membership reminder endpoint moved into `functions/api/`,
- schema/no-DDL notes updated.

## Next best work

Start with the first items in `DEVELOPMENT_ROADMAP.md`, especially admin dropdown option libraries, Admin Catalog polish, shared media library, and admin-managed landing/gallery content.
## Extra route sanity applied

- Synced `admin/index.html` from `admin.html`.
- Synced `book/index.html` from `book.html`.
- This removed non-identical clean-route wrapper collisions found during static stress checks.

