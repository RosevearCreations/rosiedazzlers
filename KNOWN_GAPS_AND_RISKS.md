# Known Gaps and Risks — Build 148

**Updated:** 2026-05-16

## Reduced in this pass

- Location landing pages now have regional photo fields, static `og:image`, and no-JS fallback photo markup.
- Dynamic landing pages now render a credited regional/service photo rather than only generic text.
- Add-on landing pages now have default photo/process/highlight/detail fields even when a custom page template has not been written yet.
- Admin App can edit landing hero image URL, gallery image URLs, photo caption, photo source, and source URL.
- Release checks now include `scripts/landing_photo_check.py`.
- Root-level duplicate API `.js` files were removed again, leaving `service-worker.js` as the only valid public root JS file.

## Still open

1. External regional photos are placeholders and should be replaced with Rosie-owned/R2-hosted photos over time.
2. Photo licensing/source tracking is currently stored as landing-page JSON fields, not a full DB media table.
3. The Admin App still needs a proper media picker/uploader so we are not pasting URLs by hand.
4. Location and add-on landing pages need a completeness score before publishing.
5. Reviews and before/after proof are still not fully tied to towns/service areas.
6. Search Console and Google Business Profile reporting are not yet connected.
7. Supabase migrations from recent builds still need to be applied in dev before DB-first workflows can fully replace JSON fallback flows.
8. Water-rule and service-area data has DB/API foundations, but the full admin CRUD workflow still needs final polish.
9. Some static landing pages still rely on the dynamic renderer for the richer content after the initial fallback block.
10. We should continue checking mobile layout because CSS drift has been a recurring issue.

## Safety note

Do not remove JSON fallback files until the DB import/admin workflow has proven stable in dev. The fallback files are still protecting public pages from partial DB data.
