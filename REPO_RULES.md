# Repo Rules — Build 145

1. Work from `dev` unless explicitly told otherwise.
2. Keep Cloudflare Functions under `functions/api/`.
3. Keep one H1 per exposed public page.
4. Update Markdown and `SUPABASE_SCHEMA.sql` every build pass.
5. Do not retire JSON catalogs until DB import and public fallback checks are proven.
6. Run `python scripts/release_check.py` before packaging.

<!-- Build 146 sync 2026-05-15: Amazon CSV catalog matching/enrichment pass; docs/schema reviewed; keep one-H1, local SEO, CSS overflow, privacy-safe generated data, and DB-first inventory migration discipline. -->

<!-- Build 147 sync 2026-05-16: Admin App mergeServiceAreaRows repair, dropdown option editor, compact mobile navigation, release-check guardrails, root API duplicate cleanup, local SEO/H1 discipline. -->

<!-- Build 148 sync 2026-05-16: reviewed during landing photo/add-on page process/local SEO pass. Active details are in DEVELOPMENT_ROADMAP.md, KNOWN_GAPS_AND_RISKS.md, CURRENT_IMPLEMENTATION_STATE.md, SANITY_CHECK.md, and IMAGES.md. -->
