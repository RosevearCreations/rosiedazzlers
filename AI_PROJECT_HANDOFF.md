# Rosie Dazzlers — Current Project Handoff

This is the living restart authority. Historical release evidence belongs in Git history/workflows; exact accepted identities come from live refs and exact-SHA evidence.

## Current release boundary

**Build 416 — Controlled Soft Launch & Real-World Acceptance** is the active bounded release.

**Build 417 — Payment, Refund & Delivery Provider Evidence Closure** is next only after Build 416 is independently GREEN on protected `main`.

Current contract: `BUILD416_CONTROLLED_SOFT_LAUNCH_REAL_WORLD_ACCEPTANCE.md`. Active roadmap: `FORWARD_BUILD_ROADMAP_416_425.md`. Retained capstone contract: `BUILD415_LAUNCH_READINESS_CONSOLIDATION_ROADMAP_RENEWAL.md`.

This release authorizes no schema migration, automatic Production booking/customer mutation, destructive R2 mutation, DNS/secret mutation, payment/provider transaction, restore, export generation, automatic outreach or permanent polling.

## Controlled soft-launch contract

- `/admin-launch-readiness.html` remains the read-only operator surface.
- Build 416 adds a separate `controlled_soft_launch` decision to the retained launch-readiness payload.
- Invite-only/internal/known-customer scope must be established by explicit audited evidence; participant authorization is never inferred.
- Booking, communication, mobile/field, completion/handoff, monitoring and incident-closeout evidence remain separate stages.
- Real job-handoff evidence is summarized only as counts; customer identity, booking identifiers and message contents are not returned by the Build 416 surface.
- Missing or weak real-world evidence remains `owner_action` or `unavailable`; source/runtime success does not convert it into a pass.
- The capstone manually refreshes and performs no automatic booking, message, payment, provider call or business-data mutation.

## Retained operating contract

- Protected-main PR and exact Cloudflare Production acceptance remain mandatory.
- Production support diagnostics remain read-only and manual-refresh.
- Customer communication remains current-consent gated at dispatch time.
- Public SEO remains one meaningful H1 per indexable page with truthful local proof.
- Role/capability boundaries remain fail-closed.
- Database migrations and provider/business mutations remain separately authorized.

## Release mechanics

- `dev` is Development; protected `main` is Production source.
- Feature candidates require focused authority, Current Source Gate and exact feature-preview acceptance before `dev` moves.
- `dev` advances only by non-force fast-forward to the exact accepted candidate and must independently pass exact-SHA Development deployment/runtime acceptance.
- Production is proposed by PR from accepted Development to protected `main`; protection is not bypassed.
- The resulting `main` SHA must independently pass exact Production deployment/runtime/business acceptance.
- Missing deployment identity, required check, Functions metadata or runtime smoke is a blocker.
- Any post-acceptance source write invalidates exact-SHA acceptance and requires revalidation.

## Durable authorities

- `AUTONOMOUS_RELEASE_QUEUE.md`
- `FORWARD_BUILD_ROADMAP_416_425.md`
- `BUILD416_CONTROLLED_SOFT_LAUNCH_REAL_WORLD_ACCEPTANCE.md`
- `BUILD415_LAUNCH_READINESS_CONSOLIDATION_ROADMAP_RENEWAL.md`
- `BUILD407_PAYMENT_PROVIDER_LIVE_OUTCOME_RECONCILIATION_ACCEPTANCE.md`
- `BUILD401_JOB_HANDOFF_COMMERCIAL_EVIDENCE.md`
- `STARTUP_GO_LIVE_BLOCKERS.md`
- `.github/workflows/development-source-gate.yml`
- `.github/workflows/cloudflare-development-acceptance.yml`
- `.github/workflows/controlled-soft-launch-acceptance-authority.yml`
- `.github/workflows/production-business-acceptance-authority.yml`
- `scripts/controlled_soft_launch_acceptance_check.py`
- `scripts/release_authority_documentation_convergence_check.py`
- `RELEASE_GOVERNANCE.md`

## Restart point

Resolve live `dev`/`main` refs and exact-SHA workflow evidence first, then read this file, the queue, current contract, active roadmap and go-live blockers. Preserve feature → Development → protected-main PR → exact Production acceptance discipline.
