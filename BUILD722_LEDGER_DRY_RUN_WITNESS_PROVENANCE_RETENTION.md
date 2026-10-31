# Rosie Dazzlers Build 722 — Private Ledger Dry-Run, Witness Provenance & Owner Retention Reconciliation

## Release boundary

Build 722 installs three **functional, signed, admin-session-only review workflows** on the existing Staff Follow-Up Workload dashboard. A green software deployment **does not** mean independent witness identity was accepted, the owner approved persistent data storage, or a private database was migrated. Until authentic human/process approvals and verified source bindings are supplied, all such permissions are **HELD**.

## 1. Proposed private ledger SQL: reviewed, not executed

Artifact: [`docs/schema/build722_private_ledger_rollback_dry_run.sql`](docs/schema/build722_private_ledger_rollback_dry_run.sql).

The SQL is a clearly labeled nonproduction-only **rollback transaction** (`BEGIN` ... `ROLLBACK`) defining two `rosie_private` tables, `owner_evidence_ledger` and `provider_source_drift_history`, with hash-only records, bounded 90-day expiry, RLS/FORCE RLS, and explicit revocation of public, `anon` and `authenticated` grants. It includes a read-only inspection of row security and role privileges. It is **not placed in `supabase/migrations`**, not shipped as executable database initialization, and has **not been run against any database**. Build 722's API **does not execute SQL**; its accurate status is `PRIVATE_LEDGER_SCHEMA_DRY_RUN_PREPARED_HELD`.

The protected API requires an **original current-key signed Build 720 ledger gate** and its exact **Build 721 security-review descendant**, current live Ed25519 signer audit, and the *distinct* explicitly pinned Build 721 security reviewer logged in using a staff session. Their original owner-request hash, gate hash and retention values must match. It downloads another signed local review receipt listing what is *not* verified: target database identity, RLS policies, live role grants, advisors, transaction execution, retention purge and backups. It does not infer Supabase Data API exposure from SQL grants alone.

Before a genuine nonproduction SQL test, a responsible administrator must (1) independently confirm the exact disposable database project, (2) obtain security and owner authorization for the test, (3) review exposed schemas and role configuration, (4) run the script in that isolated nonproduction database with `ON_ERROR_STOP`, (5) independently capture the actual `SELECT` output and confirm rollback left no tables, and (6) run Supabase security advisors. A rollback is intended but never substitutes for carefully selecting a disposable database. **Do not execute against Production**. Do not deploy a real migration until a separate owner-approved change and migration review.

## 2. Independently signed rotation witness provenance

Use the **unchanged old-key Build 719 custody receipt**, its authentic independently signed receipt-specific rotation witness, and the **unchanged current-key Build 721 rotation-exception receipt**. The Build 722 backend verifies the current signer pin and exact signed Build 721 exception, then recomputes the old signer signature, separately pinned public key, retired-key date, independent witness signature and current signer binding. It compares the original subject hash, witness hash, witness ID and both signer fingerprints against the signed Build 721 receipt. This fails closed for missing files, wrong actors, signature or key mismatch, stale witnesses, retired-key window mismatch and scope drift.

Only `ROSIE_EXPORT_CUSTODY_ROTATION_REVIEWER_STAFF_ID`, a valid authenticated administrator session and a privacy-safe 20–300 character reason may receive `ROTATION_WITNESS_PROVENANCE_VERIFIED_EXTERNAL_REVIEW_HELD`. Human identity, external custodian approval, signing-key reauthorization, persistent custody and Proof-B all remain **false**. Do not publish old private signing keys or witness secrets.

## 3. Owner retention decision reconciliation

The owner must sign in as the actual `owner_admin_staff_user_id` in the original **signed Build 720 gate**. Upload that unchanged gate and its exact signed Build 721 separate security review. The backend verifies both current-key signatures, exact receipt lineage and separate reviewer, then reconciles one owner decision:

- **Keep under external review** — continue `OWNER_RETENTION_DECISION_RECONCILED_EXTERNAL_APPROVAL_HELD` at the proposed 7/30/90-day bound or a lower bound.
- **Request shorter retention** — choose strictly less than the original proposed maximum. This records intent, not approval.
- **Reject storage** — `OWNER_STORAGE_REJECTED_NO_ACTIVATION`. If the independent security reviewer rejected the ledger, the owner's only valid continuation is rejection.

Every signed local receipt records both parent receipt hashes, the original owner request, owner and independent security reviewer, desired maximum retention, and explicit `false` flags for data writes, schema deployment, backups, authorization and Proof-B. A signature authenticates the application receipt, but does not replace a separate human decision or a durable approval record. No raw owner files or roster payloads belong in the ledger.

## Operator workflow

1. Open Rosie Dazzlers **Admin → Staff Follow-Up Workload** and expand the advanced Build 722 panels.
2. For the ledger dry-run, select the Build 720 original signed gate under the earlier ledger security form and the Build 721 signed security review under the new panel. Use the exact separately configured security reviewer account, enter notes, acknowledge rollback-only/no-execution, and download the newly signed **HELD** review receipt.
3. For rotation provenance, select the original old-key receipt and independent rotation witness in the earlier panel, plus the original signed Build 721 exception in the new panel. A separately configured rotation reviewer validates and downloads the newly signed **HELD** receipt.
4. For retention, switch to the original owner admin session, supply the matching signed gate and security review, select a bounded retention disposition, acknowledge **no storage**, enter a note and download the signed result.
5. Keep receipts in owner-controlled private custody. Uploading a file to an API for verification is **not** server-side persistence. Server responses use existing `no-store` policy.

### Current protected environment bindings

No new private secret is required. Existing settings are reused: `ROSIE_FOLLOWUP_EXPORT_ED25519_PRIVATE_JWK`, `ROSIE_FOLLOWUP_EXPORT_SIGNER_ID`, `ROSIE_FOLLOWUP_EXPORT_SIGNER_STAFF_ID`, `ROSIE_FOLLOWUP_EXPORT_PREVIOUS_ED25519_PUBLIC_JWK`, `ROSIE_FOLLOWUP_EXPORT_PREVIOUS_SIGNER_ID`, `ROSIE_FOLLOWUP_EXPORT_PREVIOUS_KEY_RETIRED_AT`, `ROSIE_EXPORT_CUSTODY_WITNESS_PUBLIC_JWK`, `ROSIE_EXPORT_CUSTODY_WITNESS_ID`, `ROSIE_EXPORT_CUSTODY_ROTATION_REVIEWER_STAFF_ID`, and `ROSIE_OWNER_EVIDENCE_LEDGER_SECURITY_REVIEWER_STAFF_ID`. Pin real independently verified keys and staff IDs only; never upload a private key into the UI.

### Verification commands

```sh
node scripts/build722_ledger_dry_run_provenance_retention_test.mjs
bash scripts/current_booking_wizard_regression.sh
bash scripts/current_source_gate_contracts.sh
python3 scripts/admin_ui_audit.py
python3 scripts/sync_route_copies.py --check
python3 scripts/release_hygiene_check.py
git diff --check
```

Automated fixtures are disposable cryptographic tests **not actual external evidence**. Completion requires full source tests, exact `main` commit equality with a successful Cloudflare Production deployment, business acceptance PASS and independent Release Health GREEN.

**Next planned Build 723:** Private Ledger Nonproduction Execution Authorization Checklist, External Witness Identity Disposition & Owner Retention Expiry Verification (HELD until independently approved).

### References

- Supabase [Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- Supabase [Secure the Data API](https://supabase.com/docs/guides/api/securing-your-api)
- Supabase [Database migrations](https://supabase.com/docs/guides/deployment/database-migrations)
- Existing implementation: [`BUILD721_SOURCE_HISTORY_ROTATION_LEDGER_SECURITY_REVIEW.md`](BUILD721_SOURCE_HISTORY_ROTATION_LEDGER_SECURITY_REVIEW.md)
