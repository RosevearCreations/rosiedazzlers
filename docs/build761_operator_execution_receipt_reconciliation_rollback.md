# Rosie Dazzlers Build 761 — Nonproduction Migration Operator Execution Receipt, Trial Evidence Reconciliation & Rollback Exception Review

**Scope: private, read-only external trial receipt authentication. Production migration and economic closure remain HOLD.**

Build 760 granted only an independently authenticated **operator handoff proposal**, never execution permission. Build 761 requires the original source/witness/owner/history/DBA/security/trial JSON and re-runs the full signed Build 760 review for every request. A previous browser-exported packet is not trusted as evidence.

## Operator receipt (tenth independent signer)

- Server-owned, fixed HTTPS `ROSIE_ECONOMIC_TRIAL_OPERATOR_BASE_URL` GET `/v1/economic-nonprod-trial-operator-receipt` with the booking, source, trial, isolated project/environment and signed handoff receipt hash as query parameters.
- Separately pinned Ed25519 `ROSIE_ECONOMIC_TRIAL_OPERATOR_PUBLIC_KEY_B64` and `ROSIE_ECONOMIC_TRIAL_OPERATOR_KEY_ID` must be distinct from all nine earlier roles.
- Exact signed schema `rosie-nonprod-operator-execution-v761` binds the Build 760 handoff and preflight packet hashes, specific migration/rollback/backup SHA-256s, trial and execution IDs, isolated project, operator, execution result, synthetic-only record scope, zero production writes, zero customer messages, and execution/observation times. The actual execution must fall within the original owner's handoff validity window. Fresh signed observation is required.

## Independent outcome and rollback exception review (eleventh signer)

- Fixed server-owned HTTPS `ROSIE_ECONOMIC_TRIAL_RECONCILE_BASE_URL` GET `/v1/economic-nonprod-trial-outcome-receipt` and separately pinned `ROSIE_ECONOMIC_TRIAL_RECONCILER_PUBLIC_KEY_B64` / `ROSIE_ECONOMIC_TRIAL_RECONCILER_KEY_ID`.
- Exact signed schema `rosie-nonprod-trial-outcome-v761` binds the authenticated operator receipt digest, same trial/target/execution/artifacts, independent post-migration check, synthetic-record scope, production-write and customer-notification checks, rollback disposition and optional rollback execution receipt digest, with timestamp and expiration.
- `NOT_REQUIRED_CLEAN` rollback uses the explicit `NONE` marker. `EXECUTED_NONPRODUCTION` and `OPEN_EXCEPTION` require a SHA-256 rollback reference and **always remain HOLD for manual disposition** even if authentic. Failed execution, post-trial mismatch, observed production writes or customer notifications also stay HOLD. Conflicting, stale, unsigned or nonindependent evidence fails closed.

## Results and unmodified boundaries

When an authentic Build 760 chain, operator success, and separately signed clean post-trial witness all agree, the status is `NONPROD_TRIAL_EVIDENCE_RECONCILED_NO_EXCEPTION`. This is **not a production release approval** and does not prove physical execution beyond external claims. Otherwise `HOLD_NONPROD_TRIAL_EVIDENCE` lists exact evidence or rollback follow-ups.

All outcomes explicitly retain `trial_executed_by_app: false`, `migration_executed_by_app: false`, `rollback_executed_by_app: false`, `production_credentials_read: false`, `customer_notifications_sent_by_app: false`, `owner_closure_audit_persisted: false`, `closure_allowed: false`, `automatic_business_write: false`.

The web screen displays the private review and permits an **unsigned** JSON packet download. Neither uploaded JSON nor operator/witness report bodies are persisted by this feature. No SQL bytes, migration endpoint, new Supabase migration, production credential read, storage write, notification, payment, or economic case close is implemented. With no authentic real-world trial receipts supplied, the live operational trial remains unverified/HOLD.

## Acceptance and owner help

1. Confirm isolated project and original Build 760 independently signed chain with DB/security/owner teams.
2. Separately authorize an actual nonproduction trial outside this application, inspect exact SQL bytes/backup/grants, and capture signed operator execution evidence. A handoff alone is insufficient permission.
3. Have an independent witness reconcile the post-trial observations and any rollback incident, without sharing credentials or customer data with the website.
4. In Admin, open **Build 761 · Nonproduction operator receipt review**, import the eight original JSON documents and verify. On HOLD, follow the named exceptions. No automatic retry/rollback.

Local checks: `node scripts/build761_operator_trial_receipt_test.mjs`, `node scripts/build760_nonprod_trial_test.mjs`, `bash scripts/current_booking_wizard_regression.sh`, `python3 scripts/release_check.py`.

References: [Supabase migrations](https://supabase.com/docs/guides/deployment/database-migrations); [Supabase branching](https://supabase.com/docs/guides/deployment/branching/working-with-branches); [GitHub Actions checks](https://docs.github.com/en/actions/how-tos/monitor-workflows/view-workflow-run-history).
