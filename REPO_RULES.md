# Repo Rules — Build 145

1. Work from `dev` unless explicitly told otherwise.
2. Keep Cloudflare Functions under `functions/api/`.
3. Keep one H1 per exposed public page.
4. Update Markdown and `SUPABASE_SCHEMA.sql` every build pass.
5. Do not retire JSON catalogs until DB import and public fallback checks are proven.
6. Run `python scripts/release_check.py` before packaging.
