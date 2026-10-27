# Build 680 — Gift recovery audit recurrence alerts, independent evidence aging and owner HOLD reconciliation

## Customer-safe internal workflow

1. The signed-in owner refreshes Build 680 to see recurrence, case reopening, absent watch, missing renewal, independent review due, pending owner acknowledgment or evidence older than the two-hour proof window. The screen highlights age bands: **60 minutes warning**, **2 hours expired**, **24 hours overdue**, **48 hours escalation overdue**.
2. For a Build 679 owner-closed case with a distinct assigned auditor, the owner records an immutable `alert_opened` receipt. This is **on-screen only**; it does not send an email, SMS or provider notification.
3. The owner records `renewal_requested`, linked to the alert and exact Build 679 source event. Any new recurrence or superseding B678 recheck keeps the case on HOLD.
4. A different, active independent auditor first records a new Build 679 `independent_audit_recorded` event after the request. Only that separately signed-in auditor may then record `independent_renewal_attested` against the new audit, fresh **read-only** paid Stripe proof and current issuance, certificate and delivery evidence.
5. The owner separately records the corresponding Build 679 `owner_audit_acknowledged` event and finally the Build 680 `owner_hold_reconciled` receipt. This remains **HOLD**, not a release or authorization to deliver to the customer.

Each event is append-only, linked to the preceding event, scoped to the case and closeout, idempotent for identical event ID/evidence, and transactionally locked by Stripe Checkout session. RLS is enabled and explicit privileges restrict table and RPC access to the backend `service_role`; all browser access is checked using signed-in staff sessions and owner/assigned-auditor roles. No customer PII is returned by the new endpoint.

The PostgREST API and UI never issue or resend gift certificates, change balances, refund or charge Stripe, or contact a customer. Live Stripe verification uses GET only. Paid-session mismatch, certificate count or line-number change, held webhook, recipient/copy delivery failure, stale independent evidence and recurrence all fail closed.

## Validation and deployment

- `bash scripts/current_gift_issuance_regression.sh` runs Builds 673–680, including mocked role-scope and unpaid payment HOLD cases.
- `python scripts/release_hygiene_check.py` and `python scripts/production_readiness_check.py` must pass.
- `20261027140000_build680_gift_audit_alert_hold_reconciliation.sql` adds the ledger and RPC; `20261027140002_build680_audit_delivery_evidence_guard.sql` strengthens the delivery evidence cross-check for databases that received the initial migration early.
- `20261027140001_build680_gift_alert_rollback_canary.sql` creates synthetic data inside an exception-rolled-back subtransaction, tests owner/auditor sequence, idempotency, stale proof, self-review refusal, immutability, and verifies zero retained records.
- Protected feature → `dev` → `main` promotion must pass GitHub source/business authority and a successful exact-SHA Cloudflare Production verifier.

**Real reviewer HOLD:** Production currently has one owner and one independent reviewer already assigned to prior gift recovery. A separate real auditor is required. The screen must keep HOLD and must not create a fake staff identity or send a gift automatically.
