# Known Gaps and Risks — Build 143

**Updated:** 2026-05-15

## Active gaps

1. Catalog inventory is only partially DB-backed. Public pages now merge fallback JSON with DB rows, but the full import/save workflow still needs completion.
2. Consumables and gear need admin-side bulk import, duplicate matching, and review tools before JSON can be retired.
3. Service-area rules are optional until the Supabase migration is run and seeded.
4. Water restrictions can change; staff should verify county pages before dispatch during dry weather or active restriction windows.
5. Search ranking is not guaranteed; the site can only improve crawlability, local relevance, page quality, reviews, and prominence signals.

## Build 143 risk reduction

- Fixed the public catalog partial-import risk where two edited DB rows could hide the full consumables fallback list.
- Added a release check to make sure public catalog pages keep fallback-merge helpers.
- Kept no-DDL compatibility for the current Supabase state.
- Root-level duplicate API JavaScript was removed again; valid handlers remain under `functions/api/`.
