# Build 417 — Payment, Refund & Delivery Provider Evidence Closure

Build 417 closes the next provider-evidence gap without creating provider activity merely to satisfy readiness. The release is schema-neutral and observation-only: it summarizes persisted verified Stripe/PayPal payment outcomes, linked refund records and notification delivery evidence already present in Rosie Dazzlers.

## Evidence contract

- Stripe and PayPal payment success is accepted only from the retained Build 407 persisted verified provider-outcome reconciliation authority.
- Provider configuration remains source evidence only and never becomes provider success.
- A definitive refund requires the internal payment-request link, provider refund identity, provider event identity, a successful refund state, a positive amount, valid three-letter currency and refunded timestamp.
- A refund row missing any of those fields remains incomplete evidence.
- Provider-accepted or sent notification evidence is not definitive delivery.
- Definitive message delivery requires an explicit delivered state, provider-delivery verification and a delivery timestamp.
- Failed, cancelled, suppressed, queued and provider-accepted states remain distinct.
- Customer names, addresses, recipients, message contents, booking identifiers and provider secrets are excluded from the closure payload.
- Missing tables or unavailable evidence are reported as unavailable/provider-dependent, never as success.

## Operator surface

`/admin-launch-readiness.html` adds a read-only provider-evidence closure panel alongside the retained Build 416 controlled soft-launch view. It reports:

- Stripe reconciled provider outcome;
- PayPal reconciled provider outcome;
- linked definitive refund count and provider split;
- definitive delivery, provider-accepted, failed/cancelled and pending notification counts;
- the exact remaining provider-evidence HOLDs.

The surface refreshes manually only.

## Truth boundary

A GREEN Build 417 source/Production release means the evidence-classification implementation and exact deployment/runtime acceptance passed. It does **not** mean Stripe, PayPal, a refund or a message delivery has occurred. Real provider-evidence closure remains HOLD until already-authorized real outcomes are actually persisted and meet this contract.

Build 417 performs no provider contact, payment charge/capture, refund initiation, notification send, webhook replay, accounting posting, customer mutation, schema migration, destructive R2 mutation, restore/export generation, automatic outreach or permanent polling.

## Release mechanics

- Feature candidate: focused Build 417 authority + Current Source Gate + exact feature-preview acceptance.
- Development: non-force fast-forward to the exact accepted candidate, then exact-SHA Development deployment/runtime acceptance.
- Production: pull request from accepted Development to protected `main`; protection is not bypassed.
- The resulting `main` SHA must independently pass the full Production matrix and exact Cloudflare Production deployment/runtime/business acceptance.
- Any source write after acceptance invalidates that exact-SHA evidence and requires revalidation.

Build 418 — Backup, Restore & Accountant Export Operational Proof is next only after Build 417 is independently GREEN on protected `main`.
