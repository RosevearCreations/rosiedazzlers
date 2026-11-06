# Build 780 — CI Queue Measurement, Runtime Budget Enforcement & Independent Custody Witness Reconciliation

## GitHub CI budgets, safely measured

- Production baseline: exact Build 779 main `5d8750c0266058c6f633983734709ad769e0eb17`, 144 matching GitHub `push` workflow runs with job-start evidence; queue p95 **56 seconds**, run duration p95 **58 seconds**. Rechecks of the same SHA may add scheduled runs and are excluded from this push-only baseline.
- Budget: completed exact-main push runs must have a **queue-start p95 ≤120 seconds**, **job-runtime p95 ≤180 seconds**, and **maximum runtime ≤600 seconds**. Queue start is the difference between the immutable workflow run creation and its earliest linked job start, not an invented latency derived from GitHub's `run_started_at`.
- Existing `Release Health Dashboard & Drift Alerts` workflow reads GitHub Actions workflow-run/check-run metadata and produces an exact-main job summary. The optional observer's own runs are excluded. The command `node scripts/ci_queue_budget_v780.mjs --github --enforce` fails its **monitoring** job if a complete snapshot breaches budgets, has failed/missing/mismatched run evidence or cannot read GitHub; an in-progress snapshot reports `PENDING_MEASUREMENT`, not GREEN, and waits for a later observation.
- No additional workflow is triggered for every PR. Seven already-optional jobs receive explicit shorter **hard GitHub timeout caps** and six receive ref-only cancellation of stale superseded optional runs. All their original tests and source/event trigger policies remain. Required source A–D/aggregate, Cloudflare, business acceptance, exact-production and security gates are neither path-filtered, skipped nor canceled.
- A CI budget breach calls for an operator investigation, not automatic promotion, rollback, deletion, customer action, or hiding a failed required check.

## Independent custody decision witness follow-up

- Owner-only `POST /api/admin/economic_custody_decision_witness_v780` requires the same ten original signed JSON envelopes and same-origin authenticated owner session. It freshly rechecks Builds **776 → 777 → 778 → 779** at a common server time.
- Reconciles matching source digests, original custodian receipt/register, exception count and **three distinct issuer roles**. Missing/mismatched/stale source or open exceptions remain **HOLD**.
- A matched source chain is only readiness for **external** manual verification. The original owner's signed approval, custodian's renewal and independent exception issuer's disposition are all **NOT verified** in Build 780. The unsigned local download is not independent proof.
- No database, audit, retention, notification, source expiry, owner consent, dispute or customer/booking/payment writes.

## Rosevear Comms Hub connection verification

- Rosie Admin → **I.T. Connections** → **Rosevear Comms Hub** → **Run LOCAL connection-interface self-test** checks local UI safety only; `networkRequests: 0` and `remoteConnection: DISCONNECTED / HOLD` are expected.
- Actual Comms Hub connectivity is still **DISCONNECTED / HOLD** without authenticated original-source signer, independent trust pin, isolated nonproduction identity, a specifically approved bounded TEST window and original successful GET receipts. This build does **not** authorize a network test or activate calling/SMS/bookings/payments.
- Existing routes `/api/integration/v1/health` and `/api/integration/v1/capabilities` remain nonproduction HMAC-protected and fail-closed; See `docs/integration/ROSEVEAR_COMMS_QL264_CONNECTION_HANDOFF.md`.

## Local acceptance

`node scripts/build780_ci_queue_budget_test.mjs`, `node scripts/build780_custody_witness_test.mjs`, `bash scripts/current_booking_wizard_regression.sh`, `bash scripts/current_source_gate_contracts.sh` and `bash scripts/current_optional_authority_triggers.sh`.
