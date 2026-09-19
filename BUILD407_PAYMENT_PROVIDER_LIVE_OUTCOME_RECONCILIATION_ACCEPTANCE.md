# Build 407 — Payment Provider Live-Outcome & Reconciliation Acceptance

Build 407 bridges the retained Stripe/PayPal integration to current release authority without creating a payment merely to satisfy readiness. The source release is schema-neutral and observation-only. Provider/live-payment readiness becomes GREEN only from already-persisted, definitive provider evidence that reconciles to Rosie Dazzlers payment state.

## Acceptance contract

- `/api/admin/go_live_readiness` remains authenticated, bounded and read-only.
- Stripe and PayPal configuration presence is `source_ready` only; configuration never proves a provider outcome.
- Provider acceptance is derived only from persisted verified webhook history and linked internal payment requests.
- Accepted provider webhook states are `settled`, `replayed`, or `refund_recorded`; pending, received, ignored, failed or unverified evidence never becomes provider GREEN.
- Provider evidence must carry a stable provider event identity and link to the internal quote-deposit payment-request identity.
- The linked internal payment must have a paid-like non-pending state, a paid timestamp, exact paid amount equal to the expected amount, and a valid three-letter currency.
- Readiness reports whether replay evidence has been observed, but does not fabricate replay or re-run a provider webhook.
- Stripe/PayPal provider contact is not performed by the readiness endpoint. The endpoint reads Rosie Dazzlers' durable verified evidence only.
- Missing or incomplete provider evidence remains `provider_dependent` or `unavailable`; it is never converted into success.
- No automatic charge, capture, refund, checkout creation, provider mutation, business-data correction, schema migration, destructive R2 mutation, outreach, accounting posting or background replay is authorized.
- A separately authorized controlled provider acceptance may create evidence when the business deliberately chooses to run one, but source acceptance itself never does so.

## Release / live-payment distinction

Build 407 **source and Production release acceptance** may be GREEN when the exact feature → Development → protected-main PR → exact Production deployment/runtime/business acceptance chain passes.

That does **not** mean live-payment readiness is GREEN. `payment_provider_readiness` remains `hold` unless both Stripe and PayPal each have at least one persisted, reconciled verified provider outcome that satisfies this contract. This preserves the distinction between a safe deployed implementation and separately observed provider/business evidence.

## Current operator surface

`/admin/it.html` remains the single operator-facing readiness surface. Build 407 adds payment-provider live-outcome/reconciliation evidence to the retained Build 406 readiness framework while preserving the classifications:

- `source_ready`
- `runtime_proven`
- `provider_dependent`
- `owner_action`
- `unavailable`

Unavailable is not failure. Required unavailable runtime evidence still blocks runtime acceptance; provider/owner evidence remains an explicit HOLD until directly observed.

## Release mechanics

- Feature candidate: focused Build 407 authority + Current Source Gate + exact feature-preview acceptance.
- Development: non-force fast-forward of the exact accepted feature SHA, followed by exact-SHA Development deployment/runtime acceptance.
- Production: pull request from accepted Development to protected `main`; `rd main protection` is not bypassed.
- The resulting `main` SHA must independently pass exact Production deployment/runtime/business acceptance.
- Final release confirmation requires zero failed, zero queued and zero in-progress/running relevant checks.
- Any post-acceptance source write invalidates prior exact-SHA acceptance and requires revalidation.

## Retained authority

- Build 406 readiness framework remains retained through `BUILD406_GO_LIVE_EVIDENCE_PROVIDER_READINESS_CONVERGENCE.md`.
- The retained Build 406 readiness guard validates the canonical current Production HOLD inventory in `STARTUP_GO_LIVE_BLOCKERS.md` rather than requiring stale launch-era blocker wording.
- Build 405 capstone remains retained through `BUILD405_FULL_RESPONSIVE_PRODUCTION_ACCEPTANCE_ROADMAP_RENEWAL.md`.
- `FORWARD_BUILD_ROADMAP_405_415.md` remains the active sequence.
- Build 408 — Media / R2 Operational Acceptance & Recovery Evidence is next only after Build 407 is independently GREEN on protected `main`.

## Safety boundary

This build performs no schema migration, Production business-data mutation, provider charge/refund/capture, destructive R2 mutation, DNS/secret mutation, accounting/inventory posting, customer mutation, automatic outreach or automatic booking.
