# Build 394 — Finance Close, Reconciliation & Accountant Export Acceptance

Build 394 adds a **read-only acceptance layer** over the Finance cockpit. It does not replace booking finance events, accounting journals, reconciliation records, month-end checklist rows, tax reports, accountant-package builders, or CSV exports.

## Canonical evidence

- Deposits, final balances and refunds remain authoritative from existing `booking_finance_*` booking events.
- Provider payment evidence remains authoritative from existing final-balance payment-request records.
- Provider fees are accepted only when explicit posted accounting accounts whose code/label identifies fees, processing, merchant, Stripe or PayPal costs exist for the selected period. Paid provider activity without explicit posted fee evidence is **review**, never an estimated fee.
- HST remains authoritative from posted `sales_tax_payable` ledger activity and the existing month-end remittance-review checklist.
- Bank reconciliation remains authoritative from the existing saved cash reconciliation and must be closed with a zero difference.
- Month-end readiness remains authoritative from `accounting_month_end_closure` and its existing checklist/evidence dependencies.
- Accountant exports remain the existing `/api/admin/accounting_export` CSV family and `/api/admin/accounting_accountant_package` package. Build 394 reports whether they are an evidence-backed candidate; it does not auto-approve or auto-post them.

## Acceptance states

The new `/api/admin/accounting_finance_close_acceptance?month=M&year=Y` endpoint returns deterministic `ready`, `review`, or `unavailable` status.

- `ready`: required source evidence is available; bank reconciliation and month-end evidence are ready; HST remittance review is complete; and any paid provider activity has explicit posted fee evidence.
- `review`: evidence exists but a review boundary remains open, including incomplete HST review, unreconciled cash, month-end blockers, or missing explicit fee evidence when provider payments exist.
- `unavailable`: a canonical source needed to prove the period cannot be loaded. Missing evidence is never treated as zero or success.

## Mutation boundary

Build 394 is schema-neutral and read-only. It does **not**:

- post journal entries;
- close or reopen an accounting period;
- charge or refund a customer;
- mutate Stripe, PayPal or another provider;
- create reconciliation records;
- save month-end checklist decisions;
- write accountant approval;
- mutate Production business data or R2.

Existing mutation endpoints retain their current explicit staff/action authorization requirements.

## Release acceptance

The candidate must pass:

1. the executable Build 394 finance acceptance contract;
2. the focused `Build 394 — Finance Close, Reconciliation & Accountant Export Acceptance Authority` workflow;
3. Current Source Gate and feature-preview acceptance;
4. exact-SHA Development deployment/runtime acceptance after non-force `dev` fast-forward;
5. protected-main PR requirements including `source checks`;
6. exact resulting Production SHA deployment/runtime/business acceptance.

Only the resulting exact `main` Production SHA may be called GREEN.
