# Rosie Dazzlers Build 725 — Owner Handoff Receipt Reconciliation, Witness Aging & Nonproduction Trial Readiness

## Scope

Build 725 provides **three authenticated admin-only, signed, locally downloaded review records** on the existing Staff Follow-Up Workload screen. It rechecks original Build 720–724 current-signer Ed25519 receipts and exact SHA lineage. It **does not** store uploaded evidence or create owner, witness, custodian, signer, retention or Proof-B approvals. It does not execute SQL, inspect a real database, send a message, connect to a third party, restore backups or purge records. Software release GREEN is distinct from **genuine external approval HELD**.

### Owner handoff reconciliation

The original owner signs in and supplies:

1. Signed Build 724 private owner handoff.
2. Signed Build 723 nonproduction execution checklist.
3. Signed Build 722 rollback-only dry-run review.
4. Signed Build 720 owner evidence-ledger gate.

The backend verifies the original owner UUID; separate execution/security/signer roles; each original SHA-256 link; the pinned rollback SQL SHA; and the configured disposable nonproduction project ref being different from production. An upstream deferred or rejected handoff cannot become a normal reconciled packet.

Decisions: reconcile the packet chain (**HELD**), defer or reject. The receipt records `packet_delivered_to_external_custodian:false`, `authentic_external_receipt_received:false`, `database_access_authorized:false`, `sql_executed:false`.

**What remains to be supplied externally:** the actual independent custodian/recipient appointment, independently witnessed delivery/receipt, real signed authorization, and the explicitly identified disposable project. A downloaded Build 725 record is not proof that any of these exist.

### Witness-reference conflict aging

A **separate** signed-in admin pinned as `ROSIE_EXPORT_WITNESS_CONFLICT_AGING_REVIEWER_STAFF_ID` supplies signed Build 724 reference comparison, Build 723 identity disposition and Build 722 provenance. The backend checks all signatures and their exact hashes, then verifies that the Build 724 reference-mismatch flags correspond to the signed comparison values.

The reviewer chooses a local follow-up window of 24, 72 or 168 hours. Age is calculated **only from the signed Build 724 local review timestamp** (not an external incident date), and may be open, overdue, deferred, rejected, or reference-matching-but-identity-still-held. No outside person is contacted, no genuine identity is assumed and no custody approval is issued.

### Nonproduction retention/backup trial readiness gaps

A separately pinned `ROSIE_LEDGER_NONPROD_TRIAL_READINESS_REVIEWER_STAFF_ID` (distinct from owner, signer, previous execution and security reviewers) supplies:

- Signed Build 724 owner handoff and backup-purge trial prerequisites.
- Signed Build 723 owner expiry policy and Build 722 retention reconciliation.

The backend verifies the owner, original receipt links, nonproduction project boundary, pinned SQL SHA, bounded retention maximum and prior explicit non-execution flags. It returns an **outstanding gap checklist** for external authorization, disposable-project identity, RLS/grants/Data API/security advisors, controlled rollback/restore, and actual retention/backup purge observation. An upstream deferred/rejected request cannot be elevated into a normal independent-readiness request.

The result **never** marks live readiness, authorizes the test, opens database access or deletes a record.

## Simple operator steps

1. Sign in to Rosie Dazzlers Admin → **Staff Follow-Up Workload**.
2. Expand the advanced Build 724 review that applies; the Build 725 addition is a compact nested section.
3. **Owner handoff:** upload the signed Build 724 owner packet under the new section and reuse the unchanged signed Build 723 checklist, Build 722 dry-run and Build 720 owner gate in the parent form. Sign in as the original owner, choose reconcile/defer/reject, enter a privacy-safe 20–300-character note and download the receipt.
4. **Witness aging:** under the Build 724 witness reference panel, upload the signed Build 724 comparison. Reuse the signed Build 723 identity and Build 722 provenance in the parent form. Sign in as the independently appointed aging reviewer, select the local window and download the held disposition.
5. **Trial readiness:** under the Build 724 backup trial panel, upload the signed Build 724 owner handoff and signed Build 724 backup prerequisites. Reuse the signed Build 723 expiry and signed Build 722 owner reconciliation in the parent form. Sign in as the separate trial reviewer, document missing evidence and download the review.
6. Keep the source and downloaded receipts private; do **not** put credentials, identity documents, raw customer/device data or original evidence in public GitHub or review notes.

## Deployment configuration (non-secret UUID bindings)

| Binding | Required actual value |
|---|---|
| `ROSIE_EXPORT_WITNESS_CONFLICT_AGING_REVIEWER_STAFF_ID` | Active admin staff UUID of a *new, separate* aging reviewer; not the signer, custody, rotation, witness identity or Build 724 reference reviewer. |
| `ROSIE_LEDGER_NONPROD_TRIAL_READINESS_REVIEWER_STAFF_ID` | Active admin staff UUID of the separate nonproduction readiness reviewer, not the owner, signer, execution reviewer or owner-ledger security reviewer. |

The existing `ROSIE_LEDGER_NONPROD_PROJECT_REF`, signer key, reviewer IDs and `SUPABASE_URL` must also be correctly provisioned; missing or conflicting bindings cause protected 409 responses. This release does **not** provision humans or fill in their UUIDs. No secrets or human authorization records are committed to the repository.

## Automated verification

```sh
node scripts/build725_handoff_reconciliation_aging_readiness_test.mjs
bash scripts/current_booking_wizard_regression.sh
bash scripts/current_source_gate_contracts.sh
python3 scripts/release_check.py
python3 scripts/seo_metadata_check.py
python3 scripts/responsive_static_check.py
python3 scripts/admin_ui_audit.py
python3 scripts/sync_route_copies.py --check
python3 scripts/release_hygiene_check.py
git diff --check
```

The test identities, Ed25519 keys and evidence files are **synthetic, disposable fixtures**. No Supabase SQL, external key rotation, real retention purge or owner signature happened during these tests.

Current sources: [Supabase Data API security](https://supabase.com/docs/guides/api/securing-your-api), [Postgres Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security), [Supabase product security](https://supabase.com/docs/guides/security/product-security), [Supabase changelog](https://supabase.com/changelog) and [Build 724 review guide](BUILD724_OWNER_NONPROD_HANDOFF_WITNESS_CONFLICT_BACKUP_TRIAL.md).

**Next planned Build 726:** Owner Handoff Exception Follow-Up, Witness Conflict Priority Queue & Nonproduction Trial Evidence Intake Guardrails (HELD pending authentic independent source evidence).
