# Rosie Dazzlers — Build 759

**Independent Storage Enforcement Audit, DBA Approval Chain & Nonproduction Migration Trial Readiness**

Status: **private read-only preflight**. This release performs no database migration, storage write/delete, schema creation, owner audit append, customer communication, payment, price update, or economic-case closure. The live source record, source witness, owner receipt, history custodian, and provider lock claim must first pass Build 758.

## Evidence and trust boundaries

1. The service fetches the independent storage auditor's signed JSON envelope only from server-configured `ROSIE_ECONOMIC_STORAGE_AUDIT_BASE_URL` (strict HTTPS origin, fixed path `/v1/economic-storage-enforcement-audit`). Request body cannot redirect the fetch.
2. The fifth key, `ROSIE_ECONOMIC_STORAGE_AUDITOR_PUBLIC_KEY_B64` and `ROSIE_ECONOMIC_STORAGE_AUDITOR_KEY_ID`, must be independent from owner, source witness, history custodian and provider lock signer. It signs exact canonical fields under `rosie-storage-enforcement-v759:`.
3. The storage-auditor claim binds the exact booking/source IDs, accepted history head SHA-256, independent provider retention receipt digest, provider and object version, policy reference, compliance mode, *isolated nonproduction* environment, overwrite/delete/retention-bypass `DENIED` results, a prior-version recovered SHA-256 equal to the source head, and fresh audit timestamps. Any mismatch or unavailable evidence is a HOLD.
4. `ROSIE_ECONOMIC_DBA_REVIEW_PUBLIC_KEY_B64`/`_KEY_ID` independently signs `rosie-dba-trial-review-v759:`, binding the same record, audit-plan hash, retention and enforcement receipts and `ROSIE_ECONOMIC_NONPROD_ENVIRONMENT_ID`.
5. `ROSIE_ECONOMIC_SECURITY_REVIEW_PUBLIC_KEY_B64`/`_KEY_ID` independently signs `rosie-security-trial-review-v759:` **after** the DBA review, including the verified DBA receipt hash. All seven keys/key IDs must be distinct and server-pinned. All signed approvals use `approve_nonproduction_trial_review_only`; this is intentionally **not** migration authority.
6. The distinct HTTPS `ROSIE_ECONOMIC_NONPROD_SUPABASE_URL` and fixed environment ID are compared with `SUPABASE_URL` without logging credentials, connecting to either database or testing permissions. The target's actual isolation, role grants and backups must be verified by a qualified operator before any trial authorization.

An authenticated third-party report is **evidence of an independently signed claim**. This app does not independently reproduce the provider's denied-operation tests or demonstrate that a production storage administrator could not defeat controls. Consequently `storage_enforcement_directly_reproduced` remains `false` even after an authenticated receipt.

## Trial release gate

When all independent receipts match, the preflight may report `READY_FOR_SEPARATE_NONPROD_TRIAL_AUTHORIZATION`. That means an owner/operator may separately review a specific migration script, grant chain, backup and rollback procedure, nonproduction isolation, targeted RLS and security-advisor findings, and isolated test protocol. **It does not authorize or execute SQL.**

Any missing source custody, storage claim, distinct signing key, timestamp, DBA/security signature or isolated target results in `HOLD_NONPROD_TRIAL_READINESS`. Every result, even ready-for-review, retains:

- `migration_authorized: false`
- `migration_executed: false`
- `owner_closure_audit_persisted: false`
- `closure_allowed: false`
- `automatic_business_write: false`
- `closure_reconciliation_status: HOLD_CLOSURE_AUTHORIZATION`

No genuine independent receipts, DBA/security approvals, nonproduction operator authorization or physical retention tests are supplied by this build. The authoritative business exception remains open for source-matched owner review.

## Owner workflow

Open private Admin → **Build 759 storage enforcement & DBA review**. Import local source record, source witness, owner receipt, history manifest, owner migration-review request, DBA review, and later security review JSON. Choose period and exact booking UUID. The server rechecks upstream custody, makes an independently configured read-only auditor request, verifies the review signatures and returns blockers. Download an **unsigned** readiness packet if desired. No evidence text is persisted.

Tests: `node scripts/build759_independent_enforcement_test.mjs`, `bash scripts/current_booking_wizard_regression.sh`, `python3 scripts/release_check.py`.

References: [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security), [Supabase managing database migrations](https://supabase.com/docs/guides/deployment/database-migrations), [Postgres role attributes](https://www.postgresql.org/docs/current/role-attributes.html).
