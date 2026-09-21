# Build 466 — Provider Outcome Review & HOLD Decision Readiness

## Purpose
Converge retained Stripe, PayPal, linked-refund, definitive-delivery, evidence-freshness and authorized-source availability into one explicit operator HOLD-decision package without creating provider activity merely to manufacture readiness.

## Retained surface
Build 466 enriches the existing Launch Readiness provider panel and retained read-only `/api/admin/provider_evidence_reconciliation_refresh` endpoint. It reuses Build 436 provider outcome/delivery evidence, Build 446 provider evidence reconciliation and Build 456 provider closure/availability review.

It does not create a replacement payment ledger, provider evidence store, webhook processor or readiness dashboard.

## HOLD decision package
The four required evidence classes remain independent: Stripe reconciled provider outcome, PayPal reconciled provider outcome, linked definitive refund outcome and definitive message-delivery outcome.

Decision readiness is explicit:
- `operator_hold_decision_ready` — all four required classes are source-available, dated and current and the retained closure candidate is satisfied;
- `aging_evidence_review_required` — complete dated evidence includes aging evidence;
- `revalidate_before_hold_decision` — at least one required evidence class is stale;
- `retain_hold_missing_evidence` — required evidence is missing, undated or not a retained closure candidate; and
- `retain_hold_unavailable_source` — at least one authorized provider evidence source is unavailable.

The default without explicit operator action is always `retain_hold`. Even `operator_hold_decision_ready` only makes evidence-backed narrowing review eligible; it never edits the canonical HOLD.

## Canonical HOLD boundary
`STARTUP_GO_LIVE_BLOCKERS.md` remains the single canonical HOLD inventory. No runtime endpoint edits, narrows or removes the `Provider outcomes & communications` row. Any narrowing requires an explicit operator-reviewed update backed by dated attributable provider evidence.

## Mutation and privacy boundary
No charge, refund, message send, webhook replay, provider configuration change, secret rotation, customer/business/accounting/inventory mutation, schema/storage mutation, canonical-HOLD mutation, automatic outreach or permanent polling is authorized.

The decision package exposes classification, source, timestamps, freshness, counts and blocker IDs only. It does not expose customer names, recipients, message contents, payment-request identifiers, provider event identifiers or credentials.

## Acceptance
The exact candidate must pass `scripts/provider_outcome_review_hold_decision_readiness_check.py`, retained Build 436/446/456 provider authorities, Current Source Gate, exact feature-preview acceptance, exact-SHA Development deployment/runtime acceptance, protected-main PR checks and independent exact resulting `main` Cloudflare Production deployment/runtime/business acceptance.

Missing provider evidence remains a truthful HOLD. Source/runtime GREEN proves only that the read-only decision package works; it never fabricates provider outcome success or an owner closure decision.

## Next bounded release
**Build 467 — Recovery Evidence Validation & Drill Decision Readiness** begins only after Build 466 is independently GREEN on protected `main`.
