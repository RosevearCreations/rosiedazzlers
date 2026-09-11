# Rosie Dazzlers — Autonomous Development Queue

This queue records current actionable work. Completed implementation history belongs in Git history and workflow evidence. The durable numbered sequences are `FORWARD_BUILD_ROADMAP_356_377.md` and the approved continuation `FORWARD_BUILD_ROADMAP_378_385.md`.

## Accepted checkpoint

**Build 379 — Production Observability & Self-Diagnostics** is the accepted synchronized source and Production deployment boundary before the current release begins. Its authenticated, bounded diagnostics authority remains read-only and the durable exact-SHA Production deployment/runtime authority remains the release proof.

## Current release

**Build 380 — Booking Recovery & Failure Handling** is the active bounded release.

Current scope:

- restore interrupted in-progress booking details across refresh/back/payment-cancel returns within the same browser tab;
- preserve explicit booking-link query choices over saved draft state and provide a customer-controlled discard/start-clean path;
- route checkout through a narrow recovery wrapper while keeping canonical `/api/checkout` pricing, availability, acknowledgements, booking creation and payment rules authoritative;
- recognize the same recent pending booking by service date, overlapping slot, customer email, package and vehicle size, and resume its already attached Stripe/PayPal payment session instead of creating a duplicate;
- fail closed when another active booking owns the slot, refresh the existing availability path after 409 collisions, and preserve the rest of the customer draft;
- retry one network interruption safely through the recovery endpoint so a lost response does not encourage duplicate submission;
- preserve tab-scoped privacy, avoid durable local storage, background polling, direct booking-table mutation and incidental schema change.

The exact candidate SHA must pass the focused booking-recovery authority and retained source/feature gates before Development promotion. Development must pass retained runtime gates on the same SHA before `main` may move. Production promotion remains a non-force fast-forward of that exact Development-GREEN SHA and is complete only after exact-SHA Production deployment/runtime acceptance passes.

## Next release

**Build 381 — Operations Daily Command Centre** is next after the current release. Its durable scope and the subsequent approved sequence are preserved in `FORWARD_BUILD_ROADMAP_378_385.md`.

## Continuing rule

Never call a Rosie Dazzlers release GREEN from source changes alone. Preserve the exact tested SHA through Development and authorized Production promotion; keep database migrations as separate acceptance boundaries. Promote `main` by non-force fast-forward to the same Development-GREEN SHA. Missing exact Production runtime/deployment identity is a blocker rather than permission to infer success.