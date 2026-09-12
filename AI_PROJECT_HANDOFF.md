# Rosie Dazzlers — Current Project Handoff

This file is the living operational authority for restarting work. Git history and workflow summaries remain the historical evidence. The active numbered forward sequence is `FORWARD_BUILD_ROADMAP_386_395.md`; earlier roadmaps remain historical only.

## Current release boundary

- Repository: `RosevearCreations/rosiedazzlers`.
- **Build 386 — Post-Recovery Baseline & Forward Roadmap Renewal** is the accepted synchronized Production boundary before the current release. Its exact identity is resolved from synchronized `dev`/`main` refs and exact-SHA workflow evidence rather than copied into this living file.
- **Build 387 — Release Governance & Branch Protection Readiness** is the active bounded release. It makes release governance release-number independent, adds observable branch/ruleset posture, distinguishes stale/advisory checks from current authority, and documents fail-closed operator recovery without weakening the exact-SHA release path.
- **Build 388 — Service, Add-On & Commercial Accuracy Convergence** is next only after Build 387 acceptance is complete.
- Build 387 is schema-neutral. It does not authorize a database migration, database restore, R2 write/delete, DNS mutation, secret rotation, customer charge/refund, provider mutation or Production business-data mutation.
- GitHub-hosted branch/ruleset enforcement is separate from source authority. If GitHub reports `dev` or `main` unprotected, or ruleset/protection state cannot be observed, classify platform protection as AMBER rather than claiming GREEN.

## Accepted operating contract

- `dev` is the accepted Development line; `main` is the accepted Production source line.
- A feature candidate must pass its focused authority, Current Source Gate and feature-preview acceptance before `dev` moves.
- `dev` must pass the retained exact-SHA Development source/runtime authorities before Production promotion.
- When Production promotion is authorized, `main` moves by non-force fast-forward to the same Development-GREEN SHA.
- Source promotion alone is never Production proof. The Production exact-SHA authority must independently observe the successful Cloudflare deployment and canonical runtime.
- Missing deployment identity, Functions metadata or runtime smoke is a blocker, not permission to infer GREEN.
- A stale historical check is not current release authority merely because it still exists. Confirm exact SHA, active trigger and current contract before treating a check as blocking evidence.
- Repository protection must preserve the canonical direct non-force fast-forward path; never weaken or bypass protection merely to make a release pass.
- Database migrations remain separate explicit acceptance boundaries and are never incidental runtime side effects.
- Recovery evidence remains observation-only unless an explicitly authorized recovery action is being executed outside the release drill.
- Payment, provider, consent, review, accounting, tax and customer evidence must remain genuine and server-authoritative.
- Public SEO remains constrained to one meaningful H1 per indexable page, current catalog/pricing authority and truthful local/service content.
- Dormant modules remain event-driven; permanent polling requires a demonstrated operational need.

## Durable release authorities

- `AUTONOMOUS_RELEASE_QUEUE.md` — accepted/current/next release state.
- `FORWARD_BUILD_ROADMAP_386_395.md` — active forward sequence and continuing release rules.
- `RELEASE_GOVERNANCE.md` — canonical exact-SHA/non-force governance, intended branch posture, stale-check discrimination and recovery paths.
- `.github/workflows/release-governance-authority.yml` — observable source and GitHub-hosted branch/ruleset posture authority.
- `scripts/release_governance_audit.py` — release-number-independent governance convergence guard.
- `.github/workflows/development-source-gate.yml` — cumulative source authority.
- `.github/workflows/cloudflare-development-acceptance.yml` — exact-SHA Development deployment/runtime acceptance.
- `.github/workflows/production-business-acceptance-authority.yml` — durable Production business-path and exact-SHA authority.
- `.github/workflows/post-recovery-baseline-roadmap-authority.yml` — retained Build 386 baseline/roadmap authority.
- `scripts/release_authority_documentation_convergence_check.py` — living release/documentation convergence guard.
- `scripts/post_recovery_baseline_roadmap_check.py` — retained Build 386 baseline/roadmap guard.

## Retained specialist authorities

- `FORWARD_BUILD_ROADMAP_378_385.md` — completed historical phase.
- `docs/BACKUP_RESTORE_RELEASE_RECOVERY.md` — retained recovery evidence matrix, drill sequence and authorization boundaries.
- `.github/workflows/development-rollback-readiness.yml` — manual read-only prior-SHA Development rollback candidate proof.
- `.github/workflows/cloudflare-pages-recovery.yml` — narrowly guarded Development-only Cloudflare repair path.
- `scripts/cloudflare_development_rollback.sh` — read-only Development rollback candidate verifier.
- `scripts/cloudflare_pages_production_acceptance.sh` — read-only Cloudflare Production deployment identity and HTTP smoke helper.

## Restart point

Start from the latest exact synchronized accepted checkpoint reported by GitHub, not a SHA copied into prose. Read this handoff, `AUTONOMOUS_RELEASE_QUEUE.md`, `FORWARD_BUILD_ROADMAP_386_395.md`, `RELEASE_GOVERNANCE.md` and `STARTUP_GO_LIVE_BLOCKERS.md`, then continue the active bounded release. Preserve exact-SHA feature → Development → non-force Production promotion discipline and require observed Production runtime proof before calling a release fully GREEN. Treat GitHub-hosted protection as a separate observable platform state; do not infer it from source documentation.
