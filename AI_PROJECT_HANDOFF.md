# Rosie Dazzlers — Current Project Handoff

This is the living restart authority. Historical release evidence belongs in Git history/workflows; exact accepted identities come from live refs and exact-SHA evidence.

## Current release boundary

Build 418 — Backup, Restore & Accountant Export Operational Proof is the retained completed predecessor.

**Build 419 — Customer & Staff Production Workflow Evidence** is the active bounded release.

**Build 420 — Search Console, GBP & Local Acquisition Evidence Closure** is next only after the current release is independently GREEN on protected `main`.

Current contract: `BUILD419_CUSTOMER_STAFF_PRODUCTION_WORKFLOW_EVIDENCE.md`. Active roadmap: `FORWARD_BUILD_ROADMAP_416_425.md`. Retained contracts: `BUILD418_BACKUP_RESTORE_ACCOUNTANT_EXPORT_OPERATIONAL_PROOF.md`, `BUILD417_PAYMENT_REFUND_DELIVERY_PROVIDER_EVIDENCE_CLOSURE.md`, `BUILD416_CONTROLLED_SOFT_LAUNCH_REAL_WORLD_ACCEPTANCE.md`, `BUILD415_LAUNCH_READINESS_CONSOLIDATION_ROADMAP_RENEWAL.md`.

This release authorizes no schema migration, customer/booking mutation, staff role/capability change, consent mutation, provider contact, accounting/inventory posting, destructive R2 mutation, DNS/secret mutation, automatic outreach or permanent polling.

## Production workflow evidence contract

- `/admin-launch-readiness.html` remains the read-only operator surface.
- Customer, Detailer, Operations and Admin states come from existing verified launch-evidence rows; source files do not manufacture observed workflow proof.
- Verified workflow evidence requires a dated role-specific note that records a real device or representative viewport/width.
- Detailer workflow proof additionally requires aggregate eligible real-job evidence from the retained job-handoff source.
- Evidence-note contents, customer identity, booking identifiers, addresses, credentials and secrets are excluded from the payload.
- Role ceilings, consent and cross-role access remain governed by their canonical authorities and are never inferred from workflow observations.
- Missing evidence remains owner-action or unavailable; source/runtime GREEN does not convert it into success.

## Retained operating contract

- Protected `main` PR and exact Cloudflare Production acceptance remain mandatory.
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
- Missing deployment identity, required check, Functions metadata or runtime smoke is a blocker.
- Any post-acceptance source write invalidates exact-SHA acceptance and requires revalidation.

## Durable authorities

- `AUTONOMOUS_RELEASE_QUEUE.md`
- `FORWARD_BUILD_ROADMAP_416_425.md`
- `FORWARD_BUILD_ROADMAP_405_415.md`
- `BUILD419_CUSTOMER_STAFF_PRODUCTION_WORKFLOW_EVIDENCE.md`
- `BUILD418_BACKUP_RESTORE_ACCOUNTANT_EXPORT_OPERATIONAL_PROOF.md`
- `BUILD417_PAYMENT_REFUND_DELIVERY_PROVIDER_EVIDENCE_CLOSURE.md`
- `BUILD416_CONTROLLED_SOFT_LAUNCH_REAL_WORLD_ACCEPTANCE.md`
- `BUILD415_LAUNCH_READINESS_CONSOLIDATION_ROADMAP_RENEWAL.md`
- `BUILD407_PAYMENT_PROVIDER_LIVE_OUTCOME_RECONCILIATION_ACCEPTANCE.md`
- `BUILD406_GO_LIVE_EVIDENCE_PROVIDER_READINESS_CONVERGENCE.md`
- `BUILD401_JOB_HANDOFF_COMMERCIAL_EVIDENCE.md`
- `STARTUP_GO_LIVE_BLOCKERS.md`
- `.github/workflows/development-source-gate.yml`
- `.github/workflows/cloudflare-development-acceptance.yml`
- `.github/workflows/recovery-export-operational-proof-authority.yml`
- `.github/workflows/provider-evidence-closure-authority.yml`
- `.github/workflows/controlled-soft-launch-acceptance-authority.yml`
- `.github/workflows/production-workflow-evidence-authority.yml`
- `.github/workflows/production-business-acceptance-authority.yml`
- `scripts/production_workflow_evidence_check.py`
- `scripts/recovery_export_operational_proof_check.py`
- `scripts/provider_evidence_closure_check.py`
- `scripts/controlled_soft_launch_acceptance_check.py`
- `scripts/release_authority_documentation_convergence_check.py`
- `RELEASE_GOVERNANCE.md`

## Restart point

Resolve live `dev`/`main` refs and exact-SHA workflow evidence first, then read this file, the queue, current contract, active roadmap and go-live blockers. Preserve feature → Development → protected-main PR → exact Production acceptance discipline.
