# Build 436 — Provider Outcome & Delivery Evidence Closure

## Purpose
Refresh current provider-owned payment/refund and message-delivery evidence so the canonical HOLD backlog reflects what is actually observed without creating provider activity merely to satisfy readiness.

## Implemented evidence refresh
Build 436 retains the existing payment/refund/delivery evidence authority and adds a dated read-only classification layer:

- Stripe and PayPal require an already-reconciled provider outcome plus an attributable provider-evidence timestamp.
- A definitive refund remains valid only when the retained refund authority has linked request/provider identity, successful state, positive amount, valid currency and refunded timestamp.
- A definitive message delivery remains valid only when the retained notification authority reports explicit provider-verified delivery plus a delivery timestamp.
- Provider-accepted/sent notification evidence remains distinct from definitive delivery.
- Each required evidence class reports its observed timestamp and age in days when available.
- Missing authorized sources remain `unavailable`; missing or undated provider evidence remains `provider_dependent`.
- All four required evidence classes must be dated before the runtime report can become a `closure_candidate`.

The new read-only endpoint is `/api/admin/provider_outcome_delivery_evidence`. The existing Launch Readiness panel renders the same bounded report so staff can refresh it manually.

## Canonical HOLD boundary
`STARTUP_GO_LIVE_BLOCKERS.md` remains the single canonical HOLD inventory.

A runtime `closure_candidate` does not edit or remove that HOLD automatically. It means all four required provider evidence classes are currently observed with attributable timestamps and the row may be narrowed only through an explicit operator-reviewed evidence update.

If any required evidence is missing, unavailable or undated, the provider outcomes & communications HOLD remains open.

## Mutation and privacy boundary
This release performs no new card charge, PayPal transaction, refund, message send, webhook replay, provider configuration mutation, secret change, customer mutation, accounting posting, HOLD-backlog mutation or permanent polling merely to obtain evidence.

The dated closure report exposes classifications, timestamps, age and counts only. It does not return customer names, recipients, message contents, payment-request identifiers, provider event identifiers or provider credentials.

## Acceptance
The exact candidate must pass focused Provider Outcome & Delivery Evidence Closure authority, retained payment/refund/delivery, live-outcome reconciliation and consent/delivery authorities, Current Source Gate, exact feature-preview acceptance, exact Development deployment/runtime acceptance, protected-main PR checks and independent exact resulting `main` Production deployment/runtime/business acceptance.

Missing provider/owner/observed evidence remains a truthful HOLD or unavailable state. Source/runtime GREEN never fabricates provider success.

## Next bounded release
**Build 437 — Backup & Recovery Evidence Closure** begins only after this release is independently GREEN on protected `main`.
