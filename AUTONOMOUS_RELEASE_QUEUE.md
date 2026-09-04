# Rosie Dazzlers — Autonomous Development Queue

This queue records only current actionable Development work. Completed release history belongs in Git history and archived evidence.

## Accepted Development checkpoint

Build 320 is GREEN at exact SHA `5a414276e1a2abcbe2d31ac1f24583599647df07`. Production `main` remains frozen at its last user-authorized checkpoint until the user explicitly requests another Production promotion.

## Active — Build 321

Scope: Payment Reconciliation Evidence.

Acceptance checklist:

- Add one authenticated reconciliation cockpit and one read-only reconciliation authority.
- Compare the exact persisted Stripe Checkout Session with the tracked final-balance request and booking final-payment ledger.
- Query Stripe by GET only; never create or modify a provider object during reconciliation.
- Block live Stripe credentials on Development and fail closed for unknown credential mode.
- Require provider amount, currency and Rosie Dazzlers request identity to match before provider-paid evidence is treated as actionable.
- Surface provider-paid/local-unpaid and provider-paid/finance-missing states as reconciliation-required.
- Surface matched provider-paid + local-paid + finance-covered state as no-action-required.
- Block identity mismatch, local/provider disagreement, complete-but-unpaid and inconclusive provider states for manual review.
- Route unpaid expired sessions back to Payment Recovery and leave unpaid open sessions alone.
- Do not expose Stripe session, payment-intent or provider-event reference values to the browser.
- Do not assert webhook verification.
- Keep finance mutation disabled because the current booking-finance writer lacks a database-enforced provider idempotency key.
- Enforce mobile, tablet and desktop reconciliation layouts with touch-friendly controls and stacked narrow-screen cards.
- `scripts/payment_reconciliation_check.py` must pass as part of the Current Source Gate.
- No database migration is introduced.
- Exact feature SHA must pass source validation and Cloudflare feature preview.
- The identical SHA must then be fast-forwarded to `dev` and pass Current Source Gate plus Cloudflare Development Acceptance.
- Stop after Development acceptance. `main` remains unchanged unless the user explicitly requests Production promotion.

## Next sequential Development scope

After exact Development acceptance, select and implement the next bounded roadmap item from the remaining improvement sequence, grounded in current source.

## Continuing rule

After the active build is GREEN on exact `dev`, implement the next sequential Development build from that SHA. Keep Production frozen unless the user changes the instruction.
