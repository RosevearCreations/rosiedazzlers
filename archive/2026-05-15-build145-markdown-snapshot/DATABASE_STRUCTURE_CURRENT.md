# Database Structure Current — Build 143

Build 143 does not add DDL.

## Catalog migration state

The catalog inventory table may contain only edited/imported rows. Public pages must not treat partial DB rows as the full catalog until a complete import is done.

## Current safe pattern

- Public pages load bundled fallback JSON.
- Public pages load Supabase catalog rows.
- Matching DB rows override fallback rows.
- Non-imported fallback rows remain visible.

## Related SQL note

- `sql/2026-05-15_build143_public_catalog_fallback_merge_no_ddl_note.sql`
