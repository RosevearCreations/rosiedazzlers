# Repo Rules — Build 143

1. Use `dev` as the source branch.
2. Keep Cloudflare Pages Functions in `functions/api/`.
3. Keep root-level JavaScript limited to real browser/public assets such as `service-worker.js`.
4. Keep JSON fallback while moving business data into DB/app settings.
5. Public pages must not go empty because of partial DB imports.
6. Run `python scripts/release_check.py` before packaging.
7. Keep one H1 per exposed public page.
8. Update Markdown and schema notes every pass.
