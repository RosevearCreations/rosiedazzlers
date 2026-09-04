# Rosie Dazzlers — Autonomous Development Queue

This queue records only current actionable Development work. Completed release history belongs in Git history and archived evidence.

## Accepted Development checkpoint

Build 319 is GREEN at exact SHA `498c7cb83910f09df67a51b444278733d825b0f2`. Production `main` remains frozen at its last user-authorized checkpoint until the user explicitly requests another Production promotion.

## Active — Build 320

Scope: Payment Recovery & Customer Handoff.

Acceptance checklist:

- Add one authenticated recovery cockpit and one read-only recovery-readiness authority.
- Group tracked requests into recovery-required, existing-checkout-guarded, checkout-needed/manual, and paid/closed states.
- Preserve explicit operator control: no automatic charge, customer notification or recurring billing.
- Require explicit recovery confirmation, reason and new future expiry before reopening an expired/cancelled request.
- Verify an existing Stripe Checkout Session before any replacement is considered.
- Reuse an existing provider-open Stripe session instead of creating a duplicate session.
- Permit a replacement Stripe session only when Stripe itself reports the persisted prior session as expired.
- Fail closed when Stripe reports paid, complete-but-unreconciled or an unknown state.
- Block live Stripe credentials for Development recovery.
- Customer return from checkout must not be treated as payment proof until the local payment record reports paid.
- While returned-payment confirmation is pending, suppress pay-again checkout actions.
- A cancelled checkout return may resume only the same persisted checkout URL; it must not call an admin mutation or create another provider session.
- Enforce mobile, tablet and desktop behavior with touch-friendly controls and stacked narrow-screen recovery cards.
- `scripts/payment_recovery_customer_handoff_check.py` must pass as part of the Current Source Gate.
- No database migration is introduced.
- Exact feature SHA must pass source validation and Cloudflare feature preview.
- The identical SHA must then be fast-forwarded to `dev` and pass Current Source Gate plus Cloudflare Development Acceptance.
- Stop after Development acceptance. `main` remains unchanged unless the user explicitly requests Production promotion.

## Next sequential Development scope

After exact Development acceptance, select the next bounded roadmap item from the remaining 20-item improvement sequence, grounded in current source rather than stale planning notes.

## Continuing rule

After the active build is GREEN on exact `dev`, implement the next sequential Development build from that SHA. Keep Production frozen unless the user changes the instruction.
