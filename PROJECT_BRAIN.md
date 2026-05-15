# Project Brain — Rosie Dazzlers

**Updated:** 2026-05-14  
**Build:** 140

Rosie Dazzlers is both a public local-service website and an operations app. The current direction is to keep the public site reliable while moving admin-managed data from scattered JSON into Supabase/app settings.

## Permanent rules

- Work from `dev`.
- Keep public pages to one H1.
- Keep town/service search wording prominent.
- Keep JSON fallback until DB editors are proven.
- Keep root public assets separate from Cloudflare Functions under `functions/api/`.
- Keep Markdown and schema notes synchronized every pass.

## Build 140 direction

The project now has formal fallback data contracts for dropdowns, media, reviews, and local SEO. The next step is adding real admin editors and migrating content into DB-backed workflows.

<!-- Build 141 sync 2026-05-14: reviewed during Norfolk/Oxford service-area, water-rule fallback, typeable booking location, local SEO, and docs/schema pass. -->
