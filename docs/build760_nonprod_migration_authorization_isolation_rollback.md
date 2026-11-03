# Rosie Dazzlers Build 760 — Nonproduction Migration Trial Authorization, Environment Isolation Verification & Rollback Readiness

**Operational status: private read-only trial handoff preflight; migration execution and economic closure remain HOLD.**

The Build 759 chain must first independently authenticate the original source, independent witness, owner receipt, history head, provider retention, nonproduction storage enforcement, DBA and security reviews. Build 760 adds a scoped trial handoff **review**; it does not run SQL or manipulate a database.

## Trust and isolation

1. Server configuration must identify **two different canonical** HTTPS `<project>.supabase.co` URLs: production `SUPABASE_URL` and `ROSIE_ECONOMIC_NONPROD_SUPABASE_URL`. Their distinct project refs and a separately configured `ROSIE_ECONOMIC_NONPROD_ENVIRONMENT_ID` are compared without reading or printing credentials.
2. The fixed server-only `ROSIE_ECONOMIC_ISOLATION_AUDIT_BASE_URL` GET endpoint `/v1/economic-nonprod-isolation-review` must provide a fresh Ed25519 signed, exact-schema report of the environment, both project refs, denied production write probe, distinct credentials, disabled customer notifications, restricted trial grants and synthetic test records. It must use a separately pinned **eighth** signer (`ROSIE_ECONOMIC_ISOLATION_AUDITOR_PUBLIC_KEY_B64`, `ROSIE_ECONOMIC_ISOLATION_AUDITOR_KEY_ID`).
3. The fixed server-only `ROSIE_ECONOMIC_ROLLBACK_VERIFY_BASE_URL` GET endpoint `/v1/economic-nonprod-rollback-review` must return a fresh independently signed nonproduction backup/restore and rollback drill receipt. It binds the exact migration SQL artifact SHA-256, rollback script SHA-256, backup snapshot SHA-256, successful restored backup digest and measured restore seconds. It must use a distinct **ninth** signer (`ROSIE_ECONOMIC_ROLLBACK_WITNESS_PUBLIC_KEY_B64`, `ROSIE_ECONOMIC_ROLLBACK_WITNESS_KEY_ID`).
4. A domain-separated Ed25519 owner handoff using the already pinned owner receipt key must bind source IDs and history, all prior retention/storage/DBA/security signatures, isolation and recovery witness receipt hashes, the same artifact hashes, target project, trial ID, and fresh expiry. Decision is fixed to `authorize_nonproduction_operator_handoff_only`.
5. All nine pinned keys and key IDs are checked for distinctness. Unauthenticated, expired, reused-key, cross-project, mismatched hashes, failed restored digest, grant exception, actual customer notification, bad chronology, or conflicting owner decisions are rejected.

These represent **independently signed external claims**. This release does not itself exercise production SQL grants, destructive storage tests or backup restores. It cannot attest that the real deployment is isolated until authentic external evidence arrives. A signature does not prove the report's physical observations are correct.

## Review result

With matched evidence, the screen reports `SCOPED_NONPROD_OPERATOR_HANDOFF_READY` — a proposal ready for a **separately authorized** operator to inspect real migration SQL bytes, current backups, explicit rollback command, RLS policies, security/performance advisors, nonproduction seed and temporary grants before a trial. It is intentionally not a migration execution switch.

Otherwise `HOLD_NONPROD_TRIAL_HANDOFF` lists source-specific follow-ups. Every result always includes:

- `trial_execution_authorized: false`
- `trial_executed: false`
- `migration_authorized: false`, `migration_executed: false`
- `rollback_executed_by_app: false`
- `production_credentials_read: false`
- `owner_closure_audit_persisted: false`
- `closure_allowed: false`
- `automatic_business_write: false`

There is no database migration file, SQL migration, schema change, private SQL execution endpoint, storage deletion, bulk audit append, payment or business case closure in Build 760. **No authentic nine-party evidence chain or nonproduction test run has been supplied.** The economic exception remains open until independent acceptance and explicit owner action.

## Owner flow and verification

In Admin, open **Build 760 · Nonproduction trial isolation & rollback**. Import seven existing evidence JSON files plus the separately signed owner trial handoff. The website does not store their contents. The server rechecks Build 759, reads the independent isolation and rollback receipts from trusted origins, and returns an unsigned readiness packet with concrete blockers. Real SQL must remain outside the browser.

Run `node scripts/build760_nonprod_trial_test.mjs`, `bash scripts/current_booking_wizard_regression.sh`, and `python3 scripts/release_check.py`.

References: [Supabase database branching](https://supabase.com/docs/guides/deployment/branching/working-with-branches), [database migrations](https://supabase.com/docs/guides/deployment/database-migrations), [RLS and least privileges](https://supabase.com/docs/guides/database/postgres/row-level-security).
