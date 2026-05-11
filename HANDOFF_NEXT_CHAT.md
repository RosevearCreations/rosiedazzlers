# Handoff for Next Chat

We are working from the corrected dev package after the Markdown/archive cleanup pass.

## Start here

1. Confirm the branch/package is based on `dev`.
2. Read `SANITY_CHECK.md`.
3. Use `DEVELOPMENT_ROADMAP.md` for the next 20 steps.
4. Use `KNOWN_GAPS_AND_RISKS.md` to avoid reopening known problems.
5. Keep `SUPABASE_SCHEMA.sql` and `sql/` notes synchronized with every pass.

## Current priority

Continue making the admin system feel like a real app:

- Admin App editable dropdown option libraries.
- Admin Catalog gear/consumables inventory workflow.
- Media/image replacement workflow.
- Admin-managed landing pages and gallery entries.
- Accounting close and export workflow.
- Booking/checkout fallbacks and error handling.

## Standing rules

- One H1 per exposed public page.
- Update Markdown every pass.
- Update schema notes every pass.
- Keep local SEO language visible and natural.
- Preserve DB fallback behavior until migrations are confirmed.
## Extra route sanity applied

- Synced `admin/index.html` from `admin.html`.
- Synced `book/index.html` from `book.html`.
- This removed non-identical clean-route wrapper collisions found during static stress checks.

