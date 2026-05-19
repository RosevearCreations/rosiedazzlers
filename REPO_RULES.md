# Repo Rules — Build 153

**Updated:** 2026-05-18

1. Keep public pages to one clear H1.
2. Keep local SEO wording in titles, meta descriptions, headings, and visible copy.
3. Do not remove JSON fallbacks until the matching DB editor/import/rollback flow is stable.
4. Keep root and folder-backed route copies synchronized.
5. Update Markdown and schema files on every build pass.
6. Prefer robust fallbacks and visible staff-facing errors over silent failures.
7. Run `python scripts/release_check.py` before packaging a ZIP; this now includes Cloudflare Pages Functions deploy-safety checks.
8. For inventory media, prefer `app_media_library` plus R2 URLs, but keep bundled image fallback working.

<!-- Build 153 sync 2026-05-18 -->

## Build 153 repo rule update

Cloudflare Pages Functions route files must use relative helper imports that resolve from their actual folder. Root `/functions/api/*.js` files must use `./_lib/...`; nested route files may use the correct relative path for their folder. The deploy-safety script now checks this before packaging.
