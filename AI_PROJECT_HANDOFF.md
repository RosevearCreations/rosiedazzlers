# Rosie Dazzlers — Current Project Handoff

This is the living restart authority. Historical release evidence belongs in Git history/workflows; exact accepted identities come from live refs and exact-SHA evidence.

## Current release boundary

Retained prior release: Build 416 — Controlled Soft Launch & Real-World Acceptance.

**Build 417 — Payment, Refund & Delivery Provider Evidence Closure** is the active bounded release.

**Build 418 — Backup, Restore & Accountant Export Operational Proof** is next only after the current release is independently GREEN on protected `main`.

Current contract: `BUILD417_PAYMENT_REFUND_DELIVERY_PROVIDER_EVIDENCE_CLOSURE.md`. Active roadmap: `FORWARD_BUILD_ROADMAP_416_425.md`. Retained prior release contract: `BUILD416_CONTROLLED_SOFT_LAUNCH_REAL_WORLD_ACCEPTANCE.md`. Retained capstone contract: `BUILD415_LAUNCH_READINESS_CONSOLIDATION_ROADMAP_RENEWAL.md`.

This release authorizes no schema migration, provider contact, payment charge/capture, refund initiation, notification send, webhook replay, accounting posting, customer mutation, destructive R2 mutation, restore/export generation, automatic outreach or permanent polling.

## Provider-evidence closure contract

- `/admin-launch-readiness.html` remains the read-only operator surface and retains the controlled soft-launch view.
- Stripe/PayPal success comes only from persisted verified reconciled provider outcomes.
- Refund evidence requires internal request identity, provider refund/event identity, successful state, positive amount, valid currency and refunded timestamp.
- Provider-accepted/sent notification evidence is never relabeled as definitive delivery.
- Definitive delivery requires explicit provider-verification evidence and a delivery timestamp.
- Customer identity, recipients, message contents and provider secrets are excluded from the closure payload.
- Missing provider evidence remains provider-dependent or unavailable; source/runtime GREEN does not convert it into success.
- The surface manually refreshes and performs no provider/payment/refund/message/business mutation.

## Retained operating contract

- Protected-main PR and exact Cloudflare Production acceptance remain mandatory.
- Production support diagnostics remain read-only and manual-refresh.
- Customer communication remains current-consent gated at dispatch time.
- Public SEO remains one meaningful H1 per indexable page with truthful local proof.
- Role/capability boundaries remain fail-closed.
- Database migrations remain separate explicit acceptance boundaries.
- Provider/business mutations remain separately authorized.

## Release mechanics

- `dev` is Development; protected `main` is Production source.
- Feature candidates require focused authority, Current Source Gate and exact feature-preview acceptance before `dev` moves.
- `dev` advances only by non-force fast-forward to the exact accepted candidate and must independently pass exact-SHA Development deployment/runtime acceptance.
- Production is proposed by PR from accepted Development to protected `main`; `rd main protection` is not bypassed.
- The resulting `main` SHA must independently pass exact Production deployment/runtime/business acceptance.
- Production deployment/runtime/business acceptance must independently prove that exact SHA.
- Missing deployment identity, required check, Functions metadata or runtime smoke is a blocker.
- Any post-acceptance source write invalidates exact-SHA acceptance and requires revalidation.

## Durable authorities

- `AUTONOMOUS_RELEASE_QUEUE.md`
- `FORWARD_BUILD_ROADMAP_416_425.md`
- `BUILD417_PAYMENT_REFUND_DELIVERY_PROVIDER_EVIDENCE_CLOSURE.md`
- `BUILD416_CONTROLLED_SOFT_LAUNCH_REAL_WORLD_ACCEPTANCE.md`
- `BUILD415_LAUNCH_READINESS_CONSOLIDATION_ROADMAP_RENEWAL.md`
- `BUILD407_PAYMENT_PROVIDER_LIVE_OUTCOME_RECONCILIATION_ACCEPTANCE.md`
- `BUILD406_GO_LIVE_EVIDENCE_PROVIDER_READINESS_CONVERGENCE.md`
- `BUILD401_JOB_HANDOFF_COMMERCIAL_EVIDENCE.md`
- `STARTUP_GO_LIVE_BLOCKERS.md`
- `.github/workflows/development-source-gate.yml`
- `.github/workflows/cloudflare-development-acceptance.yml`
- `.github/workflows/provider-evidence-closure-authority.yml`
- `.github/workflows/controlled-soft-launch-acceptance-authority.yml`
- `.github/workflows/production-business-acceptance-authority.yml`
- `scripts/provider_evidence_closure_check.py`
- `scripts/controlled_soft_launch_acceptance_check.py`
- `scripts/release_authority_documentation_convergence_check.py`
- `RELEASE_GOVERNANCE.md`

## Restart point

Resolve live `dev`/`main` refs and exact-SHA workflow evidence first, then read this file, the queue, current contract, active roadmap and go-live blockers. Preserve feature → Development → protected-main PR → exact Production acceptance discipline.
