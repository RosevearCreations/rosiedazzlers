# Rosie Dazzlers — Current Project Handoff

This is the living restart authority. Historical release evidence belongs in Git history/workflows; exact accepted identities come from live refs and exact-SHA evidence.

## Current release boundary
The synchronized Production predecessor is retained through `BUILD434_RELIABILITY_SECURITY_COST_REASSESSMENT.md`.

**Build 435 — Production Learning & Roadmap Renewal** is the active bounded release.

**Build 436 — Provider Outcome & Delivery Evidence Closure** is next only after the current release is independently GREEN on protected `main`.

Current contract: `BUILD435_PRODUCTION_LEARNING_ROADMAP_RENEWAL.md`. Active roadmap: `FORWARD_BUILD_ROADMAP_436_445.md`. Canonical HOLD backlog: `STARTUP_GO_LIVE_BLOCKERS.md`.

This release authorizes no schema migration, secret rotation, Production restore, customer/booking mutation, staff role/capability change, consent mutation, provider mutation, accounting/inventory posting, destructive R2 mutation, DNS mutation, automatic outreach or permanent polling.

## Current learning contract
- `PRODUCTION_LEARNING_426_434.md` is the cycle reconciliation.
- Source/runtime acceptance can close only a source implementation concern, not external evidence.
- Provider payment/refund/delivery and local-search outcomes remain provider-owned where evidence is absent.
- Backup/recovery, authenticated device observation and maintenance/fleet business terms remain explicit owner evidence.
- Unreachable authorized evidence remains unavailable rather than guessed.
- `FORWARD_BUILD_ROADMAP_436_445.md` is derived from those unresolved evidence gaps and retained Production learning.

## Retained operating contract
- `dev` is Development; protected `main` is Production source.
- Feature candidates require focused authority, Current Source Gate and exact feature-preview acceptance before `dev` moves.
- `dev` advances only by non-force fast-forward to the exact accepted candidate and must independently pass exact-SHA Development deployment/runtime acceptance.
- Production is proposed by PR from accepted Development to protected `main`; `rd main protection` is not bypassed.
- The resulting `main` SHA must independently pass exact Production deployment/runtime/business acceptance.
- Missing deployment identity, required check, Functions metadata or runtime smoke is a blocker.
- Database migrations remain separate explicit acceptance boundaries.
- Provider/business mutations remain separately authorized.

## Durable authorities
- `AUTONOMOUS_RELEASE_QUEUE.md`
- `FORWARD_BUILD_ROADMAP_436_445.md`
- `BUILD435_PRODUCTION_LEARNING_ROADMAP_RENEWAL.md`
- `BUILD436_PROVIDER_OUTCOME_DELIVERY_EVIDENCE_CLOSURE.md`
- `PRODUCTION_LEARNING_426_434.md`
- `STARTUP_GO_LIVE_BLOCKERS.md`
- `.github/workflows/production-learning-roadmap-renewal-authority.yml`
- `.github/workflows/development-source-gate.yml`
- `.github/workflows/production-business-acceptance-authority.yml`
- `scripts/production_learning_roadmap_renewal_check.py`
- `scripts/release_authority_documentation_convergence_check.py`
- `RELEASE_GOVERNANCE.md`

## Restart point
Resolve live `dev`/`main` refs and exact-SHA workflow evidence first, then read this file, the queue, current contract, active roadmap and go-live blockers. Preserve feature → exact Development → protected-main PR → exact Production acceptance discipline.
