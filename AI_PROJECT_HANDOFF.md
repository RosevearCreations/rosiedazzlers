# Rosie Dazzlers — Current Project Handoff

This is the living restart authority. Historical release evidence belongs in Git history/workflows; exact accepted identities come from live refs and exact-SHA evidence.

## Current release boundary

**Build 415 — Launch Readiness Consolidation & Next-Roadmap Renewal** is the active bounded release.

**Build 416 — Controlled Soft Launch & Real-World Acceptance** is next only after the current release is independently GREEN on protected `main`.

Current contract: `BUILD415_LAUNCH_READINESS_CONSOLIDATION_ROADMAP_RENEWAL.md`. Renewed roadmap: `FORWARD_BUILD_ROADMAP_416_425.md`.

This release authorizes no schema migration, Production business-data mutation, destructive R2 mutation, DNS/secret mutation, payment/provider transaction, restore, export generation, automatic provider call or permanent polling.

## Launch-readiness contract

- `/admin-launch-readiness.html` is the read-only launch capstone.
- Exact runtime/support evidence remains separate from owner-observed and provider-dependent evidence.
- Source/runtime, controlled-launch and unrestricted-launch decisions are reported independently.
- Existing export routes are source-ready capabilities only; their presence does not prove a retained backup/export artifact.
- Backup, rollback and other recovery evidence remains owner-observed until explicitly recorded.
- Provider outcomes, Search Console/GBP evidence and independent visual-browser proof are never inferred from source.
- The capstone manually refreshes and does not mutate business state.

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
- `dev` advances only by non-force fast-forward to the exact accepted candidate.
- Production is proposed by PR from accepted Development to protected `main`; `rd main protection` is not bypassed.
- The resulting `main` SHA must independently pass exact Production deployment/runtime/business acceptance.
- Missing deployment identity, required check, Functions metadata or runtime smoke is a blocker.
- Database migrations remain separate explicit acceptance boundaries.
- Any post-acceptance source write invalidates exact-SHA acceptance and requires revalidation.

## Durable authorities

- `AUTONOMOUS_RELEASE_QUEUE.md`
- `FORWARD_BUILD_ROADMAP_416_425.md`
- `FORWARD_BUILD_ROADMAP_405_415.md`
- `BUILD415_LAUNCH_READINESS_CONSOLIDATION_ROADMAP_RENEWAL.md`
- `BUILD406_GO_LIVE_EVIDENCE_PROVIDER_READINESS_CONVERGENCE.md`
- `BUILD401_JOB_HANDOFF_COMMERCIAL_EVIDENCE.md`
- `STARTUP_GO_LIVE_BLOCKERS.md`
- `.github/workflows/development-source-gate.yml`
- `.github/workflows/cloudflare-development-acceptance.yml`
- `.github/workflows/production-business-acceptance-authority.yml`
- `scripts/launch_readiness_consolidation_check.py`
- `scripts/release_authority_documentation_convergence_check.py`
- `RELEASE_GOVERNANCE.md`

## Restart point

Resolve live `dev`/`main` refs and exact-SHA workflow evidence first, then read this file, the queue, current contract, renewed roadmap and go-live blockers. Preserve feature → Development → protected-main PR → exact Production acceptance discipline.
