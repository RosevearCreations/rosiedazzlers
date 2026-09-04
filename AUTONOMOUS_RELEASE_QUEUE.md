# Rosie Dazzlers — Autonomous Development Queue

This queue records only current actionable Development work. Completed release history belongs in Git history and archived evidence.

## Accepted Development checkpoint

Build 318 is GREEN at exact SHA `9d206c7c0a78894e337894dd3b796c64b52559c6`. Production `main` remains frozen at its last user-authorized checkpoint until the user explicitly requests another Production promotion.

## Active — Build 319

Scope: Payment Acceptance Evidence & Sandbox Verification.

Acceptance checklist:

- Add one authenticated, read-only payment acceptance evidence cockpit and ledger.
- Read only existing final-balance payment records; do not contact Stripe or PayPal from the evidence endpoint.
- Classify Stripe credentials server-side as test, live, unknown or not configured without returning secret values.
- Block Development provider acceptance for live or unclassifiable Stripe credentials.
- Treat persisted Stripe checkout reference plus checkout-created time only as checkout-creation evidence.
- Treat paid timestamp/state only as persisted application evidence; never claim webhook verification without an authoritative source.
- Recognize provider event/payment-intent reference presence without exposing their values.
- Report PayPal as not integrated and manual handling as an operational fallback, not provider acceptance.
- No automatic charge, provider mutation, checkout creation, customer notification or recurring billing.
- Include explicit loading, error and empty states.
- Enforce mobile, tablet and desktop behavior: touch-friendly controls, no clipped actions, and stacked payment-evidence cards on narrow screens.
- Operating Help must explain configuration-ready, checkout evidence, persisted paid evidence, live-key blocking, PayPal status and manual fallback.
- `scripts/payment_acceptance_evidence_check.py` must pass as part of the Current Source Gate.
- No database migration is introduced.
- Exact feature SHA must pass source validation and Cloudflare feature preview.
- The identical SHA must then be fast-forwarded to `dev` and pass Current Source Gate plus Cloudflare Development Acceptance.
- Stop after Development acceptance. `main` remains unchanged unless the user explicitly requests Production promotion.

## Next sequential Development scope

After exact Development acceptance, start the next roadmap build for failed/expired payment recovery plus customer-facing payment status, with duplicate-charge safeguards and mobile/computer interface enforcement.

## Continuing rule

After the active build is GREEN on exact `dev`, implement the next sequential Development build from that SHA. Keep Production frozen unless the user changes the instruction.
