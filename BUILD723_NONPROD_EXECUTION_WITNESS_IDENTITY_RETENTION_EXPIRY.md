# Rosie Dazzlers Build 723 — Controlled Nonproduction Authorization, External Witness Identity & Retention Expiry

## Scope: working protected review, no fabricated approval

Build 723 expands the existing Staff Follow-Up Workload dashboard with three authenticated admin-only, server-signed **local review** actions. It does not create a Supabase migration, run SQL, contact outside custodians, persist owner files, send messages or approve Proof-B. Independent human review and all business-data custody gates remain **HELD**, even if the code and Cloudflare Production release are GREEN.

### 1. Private-ledger nonproduction execution authorization checklist

The operator uploads the unchanged **signed Build 722** `PRIVATE_LEDGER_SCHEMA_DRY_RUN_PREPARED_HELD` receipt. The API verifies the original current Ed25519 signer, receipt signature, scope, timestamp and SHA lineage. The review requires a separate actual authenticated admin whose staff UUID is exactly `ROSIE_LEDGER_NONPROD_EXECUTION_REVIEWER_STAFF_ID` — not the prior security reviewer or signer.

The proposed nonproduction project must exactly match the protected `ROSIE_LEDGER_NONPROD_PROJECT_REF` and **must not equal** the project in `SUPABASE_URL` (production). The operator must acknowledge the exact SHA-256 of `docs/schema/build722_private_ledger_rollback_dry_run.sql`:

`f61261377dc79742a95077199265f5d8096f6e34ac1d4089a55473dc4a35e207`

This digest is pinned in `assets/quote-followup-authorization-v723.mjs`, with a regression test verifying the committed SQL bytes match it. The underlying SQL is a review-only `BEGIN`/`ROLLBACK` transaction, **not** a migration and **not** executed by the app. The operator may request independent authorization or reject execution; neither choice authorizes execution. Statuses:

- `NONPRODUCTION_LEDGER_EXECUTION_AUTHORIZATION_CHECKLIST_HELD`
- `NONPRODUCTION_LEDGER_EXECUTION_PROPOSAL_REJECTED`

The receipt explicitly records **false** for actual database identity validation, permission to connect, SQL execution, rollback observation, RLS/grant verification, Data API exposure verification, security advisors, migration and row creation. Do not configure a production project as the nonproduction ref. Do not expose database credentials in the web page, review notes, GitHub or signed downloads.

Real execution requires a separate future owner authorization, a separately authenticated and independent security custodian, an identified disposable database project, a witnessed transaction, live SQL role/RLS/Data API checks, Supabase advisors, and verifiable rollback evidence. Merely checking the boxes in Build 723 **never** meets those requirements.

### 2. External witness identity disposition

The operator uploads the **original signed Build 722 rotation-witness provenance** and its **original signed Build 721 key-rotation exception**. The backend checks both signatures and verifies the exact link: exception receipt SHA, subject receipt SHA, witness payload SHA, witness ID and current/retired key fingerprints. A different authenticated admin must be exactly pinned as `ROSIE_EXPORT_WITNESS_IDENTITY_REVIEWER_STAFF_ID`, not the rotation/custody reviewer or original signer.

Possible actual review dispositions are:

- `WITNESS_IDENTITY_EXTERNAL_VERIFICATION_PENDING`
- `WITNESS_IDENTITY_REVIEW_DEFERRED`
- `WITNESS_IDENTITY_EVIDENCE_REJECTED`

There is deliberately **no** option to click “identity verified” based only on a downloaded file. Human identity, actual third-party appointment and authorization, independent custody acceptance, key reauthorization and Proof-B remain false until an authentic out-of-band verification artifact is separately assessed.

### 3. Owner retention expiry verification

The original owner administrator uses **three unchanged signed source receipts**: Build 720 ledger gate, Build 721 separate security review and Build 722 owner retention reconciliation. The API verifies exact lineage, original owner and security reviewer UUIDs, the requested 7/30/90-day ceiling, and rejection consistency. For an unrejected proposal, it calculates the **illustrative UTC expiry if a hypothetical record were written at the moment of review**. For rejected storage, expiry is not applicable.

- `RETENTION_EXPIRY_POLICY_PREVIEW_HELD` — expected UTC arithmetic only.
- `OWNER_STORAGE_REJECTION_CONFIRMED_NO_EXPIRY_REQUIRED` — no storage to expire.

Both signed statuses affirm: no records, no real expiration, no retention or backup purge job, no SQL, no activation, and no external approval. This feature is **not** a substitute for actual DB retention tests after a separately authorized migration.

## Operator walkthrough

1. Sign in to Rosie Dazzlers Admin → **Staff Follow-Up Workload**.
2. Under the advanced rotation review, upload the signed Build 721 exception and Build 722 provenance. Sign in separately as the appointed **witness identity reviewer**, choose request/defer/reject, write a privacy-safe 20–300-character note, acknowledge no human identity acceptance, and download the signed local disposition.
3. Under the owner evidence ledger advanced review, upload the signed Build 722 SQL dry-run receipt. Sign in as the separately appointed **nonproduction execution reviewer**, enter the exact configured nonproduction project reference, inspect the pinned SQL SHA, document the no-execution checklist and download the signed local receipt.
4. As the original **owner** account, upload the signed Build 720 gate and Build 721 security review in the prior fields and the signed Build 722 owner reconciliation in the new field. Verify the hypothetical UTC expiry and download the signed local receipt. No real record was looked up.
5. Preserve the genuine source receipts under private owner control. Do not paste secrets, human identity documents, device images or raw roster data into the notes or source repository.

### Protected environment references

Existing Build 716–722 signer, custodian and security reviewer bindings remain in place. Three additional **non-secret, separately confirmed** values are required for fully operational review:

| Binding | Value |
|---|---|
| `ROSIE_LEDGER_NONPROD_PROJECT_REF` | Exact real approved disposable nonproduction Supabase project ref; never the Production project. |
| `ROSIE_LEDGER_NONPROD_EXECUTION_REVIEWER_STAFF_ID` | UUID of the separately designated execution-checklist reviewer, not the security reviewer or signer. |
| `ROSIE_EXPORT_WITNESS_IDENTITY_REVIEWER_STAFF_ID` | UUID of the independently designated external witness-identity reviewer, not the rotation/custody reviewer or signer. |

No value is invented by the application. Missing/mismatched role or project bindings cause a protected 409/HOLD response. App-side receipts authenticate app review history only; they cannot replace external signatures, private custody or human authorization.

### Verification

```sh
node scripts/build723_nonprod_witness_identity_expiry_test.mjs
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

Test identities and signed records are **disposable synthetic fixtures**, not owner, database or custodian evidence. Promotion requires the exact immutable Production SHA, successful Cloudflare Pages deployment, canonical site HTTP smoke, business acceptance PASS, and independent release-health GREEN.

**Next planned Build 724:** Nonproduction Authorization Owner Handoff, Witness Identity Reference Conflict Review & Retention/Backup Purge Trial Preconditions (HELD pending real evidence).

References: [Supabase Data API security](https://supabase.com/docs/guides/api/securing-your-api), [Postgres RLS](https://supabase.com/docs/guides/database/postgres/row-level-security), [Supabase changelog](https://supabase.com/changelog), and [Build 722 handoff](BUILD722_LEDGER_DRY_RUN_WITNESS_PROVENANCE_RETENTION.md).
