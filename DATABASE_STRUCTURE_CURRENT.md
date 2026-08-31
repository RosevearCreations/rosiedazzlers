# Rosie Dazzlers Database Structure — Current Reference

**Updated:** 2026-08-29  
**Application baseline:** Build 268 repository-hygiene/modular runtime

## Authority

- `SUPABASE_SCHEMA.sql` is the aggregate source-schema reference shipped with the repository.
- `sql/` is the only canonical migration-history directory.
- The actual Development Supabase schema is authoritative when historical drift is discovered.
- Never restore a deleted root migration copy; Git history already preserves old layouts.

## Known Development drift

`public.staff_users.permissions_profile` exists as `text` in the historical Development database even though later aggregate schema material described it as `jsonb`. Build 267 deliberately accommodates either TEXT or JSONB rather than silently changing the live column type.

The Build 267 role/module migration is:

`sql/2026-08-29_build267_role_module_hierarchy.sql`

Development acceptance confirmed the administrator module profile contains all seven internal modules before the expanded role constraint became authoritative.

## Current identity / access authorities

### `public.staff_users`

Existing staff identity remains the primary staff authority. Build 267 extends the existing `role_code` vocabulary to:

- `admin`
- `senior_detailer`
- `detailer`
- `operations_manager`
- `accountant`
- `it_specialist`
- `promoter`
- `daip_manager`

Per-user module grants remain inside the existing `permissions_profile`; no parallel staff-role table was introduced.

### `public.app_management_settings`

Existing application settings remain the authority for global module/runtime settings. Build 267 stores `staff_role_module_defaults` here. Global module flags are operational controls, not replacements for server authorization.

## Current module defaults

- Detailer → Detailer
- Senior Detailer → Detailer + Operations
- Operations Manager → Detailer + Operations
- Accountant → Finance
- I.T. Specialist → I.T.
- Promoter → Socials
- DAIP Manager → DAIP
- Administrator → all seven internal modules

Administrator access is fail-safe: an Administrator must retain all internal module grants.

## Database boundary

Browser clients must not receive service-role database credentials. Cloudflare Functions remain the browser-to-database authority for protected operations. Module visibility in the client is navigation/UX only; protected API routes must independently authorize the session, role/module ceiling and required action capability.

## Migration policy

1. Put every new migration under `sql/` only.
2. Do not create a second root copy.
3. Prefer extending existing tables/settings when they are already the correct authority.
4. Make data migrations idempotent where practical.
5. Fail closed before destructive constraint/authority changes.
6. Preserve audit/history records unless a deliberate retention policy says otherwise.
7. Verify actual Development column types before assuming the aggregate schema matches historical databases.
8. Update this document only for current structural facts; release chronology belongs in Git.

## Current high-value database acceptance still open

- transaction/idempotency/reversal acceptance for inventory posting;
- Stripe payment/refund/webhook settlement evidence;
- notification subscription/delivery authority for the event-driven notification program;
- DAIP private processing/derivative records only after its held gates are accepted;
- backup/restore rehearsal and schema-parity verification.

## Fresh-install discipline

A fresh database should be reproducible from the aggregate schema plus the applicable migrations without relying on undocumented Production-only tables. When runtime code references a table/column that the fresh-install source cannot recreate, fix schema authority first rather than copying Production data around the inconsistency.
