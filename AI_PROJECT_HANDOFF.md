# Rosie Dazzlers — Current Project Handoff

This file is the living operational authority for restarting work. Git history and workflow summaries remain the historical evidence. The active forward sequence is `FORWARD_BUILD_ROADMAP_386_395.md`; earlier roadmaps remain historical only.

## Current release boundary

- Repository: `RosevearCreations/rosiedazzlers`.
- The accepted synchronized Production checkpoint immediately precedes the current release. Resolve its exact identity from live `dev`/`main` refs and exact-SHA workflow evidence rather than copying historical release identities into this living file.
- **Build 388 — Service, Add-On & Commercial Accuracy Convergence** is the active bounded release. It makes package pricing and condition-sensitive add-on language commercially consistent while preserving inspection-led estimates where condition materially changes labour, process or product requirements.
- **Build 389 — Local SEO, Service Landing & Proof Convergence** is next only after current-release acceptance is complete.
- The current commercial-accuracy release is schema-neutral. It does not authorize a database migration, database restore, R2 write/delete, DNS mutation, secret rotation, customer charge/refund, provider mutation or Production business-data mutation.
- GitHub-hosted branch/ruleset enforcement is separate from source authority. `main` remains governed by the active `rd main protection` ruleset; any protection state that later becomes absent or unobservable must be classified AMBER rather than assumed GREEN.

## Accepted operating contract

- `dev` is the accepted Development line; protected `main` is the accepted Production source line.
- A feature candidate must pass its focused authority, Current Source Gate and feature-preview acceptance before `dev` moves.
- `dev` advances only by non-force fast-forward to the exact accepted candidate SHA and must then pass exact-SHA Development deployment/runtime acceptance.
- Production promotion is proposed through a pull request from the accepted Development line to protected `main`; do not bypass `rd main protection`.
- The protected-main required checks, including `source checks`, must pass before merge. A merge commit is preferred so the accepted Development SHA remains explicit in Production ancestry.
- After merge, the resulting `main` head becomes the exact Production source SHA. Production deployment/runtime/business acceptance must independently prove that exact SHA.
- Missing deployment identity, required check, Functions metadata or runtime smoke is a blocker, not permission to infer GREEN.
- A stale historical check is not current release authority merely because it still exists. Confirm applicable exact SHA or PR head, active trigger and current contract before treating a check as blocking evidence.
- Database migrations remain separate explicit acceptance boundaries and are never incidental runtime side effects.
- Customer-facing package prices must follow the accepted commercial matrix. Condition-sensitive add-ons may use starting prices or inspection-led estimates, but expanded work requires a revised estimate/authorization rather than silently widening scope.
- Payment, provider, consent, review, accounting, tax and customer evidence must remain genuine and server-authoritative.
- Public SEO remains constrained to one meaningful H1 per indexable page, current catalog/pricing authority and truthful local/service content.
- Dormant modules remain event-driven; permanent polling requires a demonstrated operational need.

## Durable release authorities

- `AUTONOMOUS_RELEASE_QUEUE.md` — accepted/current/next release state.
- `FORWARD_BUILD_ROADMAP_386_395.md` — active forward sequence and continuing release rules.
- `RELEASE_GOVERNANCE.md` — canonical Development exact-SHA, protected-main PR, Production exact-SHA, stale-check and recovery authority.
- `.github/workflows/service-commercial-accuracy-authority.yml` — focused current commercial-accuracy authority.
- `scripts/service_commercial_accuracy_check.py` and `scripts/service_commercial_accuracy_test.mjs` — package-matrix, condition-scope and mutation-boundary guards.
- `.github/workflows/development-source-gate.yml` — cumulative source authority; protected-main required context remains `source checks`.
- `.github/workflows/cloudflare-development-acceptance.yml` — exact-SHA Development deployment/runtime acceptance.
- `.github/workflows/production-business-acceptance-authority.yml` — durable Production business-path and exact-SHA authority.
- `scripts/release_authority_documentation_convergence_check.py` — living release/documentation convergence guard.

## Retained specialist authorities

- The prior forward-roadmap file remains completed historical phase evidence.
- `docs/BACKUP_RESTORE_RELEASE_RECOVERY.md` — retained recovery evidence matrix, drill sequence and authorization boundaries.
- `.github/workflows/release-governance-authority.yml` and `scripts/release_governance_audit.py` — retained release-governance authority.
- `.github/workflows/development-rollback-readiness.yml` — manual read-only prior-SHA Development rollback candidate proof.
- `.github/workflows/cloudflare-pages-recovery.yml` — narrowly guarded Development-only Cloudflare repair path.
- `scripts/cloudflare_development_rollback.sh` — read-only Development rollback candidate verifier.
- `scripts/cloudflare_pages_production_acceptance.sh` — read-only Cloudflare Production deployment identity and HTTP smoke helper.

## Restart point

Start from the latest accepted checkpoint reported by GitHub, not a SHA copied into prose. Read this handoff, `AUTONOMOUS_RELEASE_QUEUE.md`, the active forward roadmap, `RELEASE_GOVERNANCE.md` and `STARTUP_GO_LIVE_BLOCKERS.md`, then continue the active bounded release. Preserve exact-SHA feature → Development → protected-main PR → exact Production acceptance discipline and require observed Production runtime proof before calling a release fully GREEN.