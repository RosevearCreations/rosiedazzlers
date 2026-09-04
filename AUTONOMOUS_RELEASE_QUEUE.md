# Rosie Dazzlers — Autonomous Development Queue

This queue records only current actionable Development work. Completed release history belongs in Git history and archived evidence.

## Accepted Development checkpoint

Build 317 is GREEN at exact SHA `512ae93a7867b897a26c532cf25282997858e82f`. That SHA is also the frozen `main` checkpoint until the user explicitly requests another Production promotion.

## Active — Build 318

Scope: Payment Provider Readiness & Test Acceptance.

Acceptance checklist:

- Add one authenticated, read-only payment-provider readiness cockpit.
- Report only derived provider state; never expose secret values.
- Recognize the existing Stripe hosted-checkout integration without creating a checkout during readiness loading.
- Classify Stripe credentials as test, live, unknown or not configured based only on server-side prefix inspection.
- Block Development provider acceptance when a live Stripe secret is detected.
- Report PayPal as not integrated until a real source integration exists; do not invent PayPal variables or sandbox success.
- Keep the existing manual payment path available as the fail-closed fallback.
- No automatic charge, checkout creation, customer notification or recurring billing.
- Operating Help must explain test-ready, live-key blocking, PayPal status and manual fallback.
- Responsive presentation must work on mobile, normal desktop and wide layouts.
- `scripts/payment_provider_readiness_check.py` must pass as part of the Current Source Gate.
- No database migration is introduced.
- Exact feature SHA must pass source validation and Cloudflare feature preview.
- The identical SHA must then be fast-forwarded to `dev` and pass Current Source Gate plus Cloudflare Development Acceptance.
- Stop after Development acceptance. `main` remains unchanged unless the user explicitly requests Production promotion.

## Continuing rule

After the active build is GREEN on exact `dev`, select and implement the next sequential Development build from that SHA. Keep Production frozen unless the user changes the instruction.
