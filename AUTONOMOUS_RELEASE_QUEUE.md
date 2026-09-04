# Rosie Dazzlers — Autonomous Development Queue

This queue records only current actionable Development work. Completed release history belongs in Git history and archived evidence.

## Accepted Development checkpoint

Build 322 is GREEN at exact SHA `bee75b7201ca5510b48a3bc2c0f07d487dcfb4ba`. Production `main` remains frozen at its last user-authorized checkpoint until the user explicitly requests another Production promotion.

## Active — Build 323

Scope: Production Readiness Dashboard.

Acceptance checklist:

- Add one authenticated I.T. Production-readiness dashboard and one read-only readiness authority.
- Require the canonical `it.runtime.view` action permission rather than borrowing booking/finance permissions.
- Keep the endpoint evidence-only: no Git, Cloudflare, database, provider or Production mutation.
- Keep Production closed and explicitly state that readiness is not promotion authorization.
- Separate source policy from runtime evidence; source workflow presence must not masquerade as current live-run success.
- Use Cloudflare runtime branch/SHA/URL metadata only when actually available. Missing or partial metadata must be incomplete evidence, never guessed state.
- Treat a Production-like runtime as a blocker for Development readiness review.
- Treat a live Stripe credential on a Development-like runtime as a blocker and unknown Stripe mode as fail-closed.
- Report unconfigured Stripe or unavailable runtime metadata as incomplete evidence rather than falsely ready.
- Preserve safe source-policy evidence for the frozen Production branch and previously accepted Development checkpoint without exposing secrets.
- Surface durable Current Source Gate, Development Acceptance and rollback/recovery authorities with `live_run_verified: false` because runtime code does not independently query GitHub Actions.
- Support explicit `ready_for_human_review`, `evidence_incomplete` and `blocked` states.
- Enforce desktop, tablet and mobile behavior with device-width viewport, 44px touch controls, loading/error states and narrow-screen evidence cards.
- `scripts/production_readiness_check.py` must pass in the Current Source Gate.
- No database migration is introduced.
- Exact feature SHA must pass Current Source Gate and Cloudflare feature preview.
- The identical SHA must then be fast-forwarded to `dev` and pass Current Source Gate plus Cloudflare Development Acceptance.
- Stop after Development acceptance. `main` remains unchanged unless the user explicitly requests Production promotion.

## Next sequential Development scope

After exact Development acceptance, choose the next bounded improvement from the current RosieDazzlers roadmap/source gaps. Continue the same mobile/desktop, permission, failure-state and exact-SHA release standards rather than opening Production.

## Continuing rule

After the active build is GREEN on exact `dev`, implement the next sequential Development build from that SHA. Keep Production frozen unless the user changes the instruction.
