# Rosie Dazzlers — Current Project Handoff

This file is the living operational authority for restarting work. Git history and workflow summaries remain the historical evidence. The active forward sequence is `FORWARD_BUILD_ROADMAP_386_395.md`; earlier roadmaps remain historical only.

## Current release boundary

- Repository: `RosevearCreations/rosiedazzlers`.
- The accepted synchronized Production checkpoint immediately precedes the current release. Resolve its exact identity from live `dev`/`main` refs and exact-SHA workflow evidence rather than copying historical release identities into this living file.
- **Build 391 — Photo Studio & R2 Media Reliability** is the active bounded release. It keeps public media on the existing managed-library authority, adds public-only assignment enforcement and explicit Before/After placement metadata, preserves multi-placement/reset behavior, and retains bounded opt-in R2 synchronization plus guarded delete-unassigned behavior.
- **Build 392 — Retention, Maintenance & Fleet Commercial Activation** is next only after current-release acceptance is complete.
- The current media release is schema-neutral. It does not authorize a database migration, database restore, Production R2 write/delete, DNS mutation, secret rotation, customer charge/refund, provider mutation or Production business-data mutation as part of source promotion.
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
- Public Photo Studio assignment accepts only active managed images whose R2 keys are in the approved public prefix allow-list. Private DAIP/customer/job/evidence paths remain isolated even if records exist elsewhere in the media database.
- Ordinary Photo Studio and public manifest reads stay database-backed and do not enumerate or mutate R2. R2 discovery is explicit, one approved prefix per request, cursor-bounded, and non-destructive.
- Removing/resetting a placement must not delete the asset. Destructive delete remains an explicit operation and must fail closed while an active Photo Studio or Gallery Before/After reference exists.
- One managed public photo may be assigned to multiple independent targets. Before/After pairs retain two distinct images and expose pair group/side metadata without creating a second media ledger.
- Payment, provider, consent, review, accounting, tax and customer evidence must remain genuine and server-authoritative.
- Public SEO remains constrained to one meaningful H1 per indexable page, unique metadata/canonical/structured data and truthful local/service content.
- Dormant modules remain event-driven; permanent polling requires a demonstrated operational need.

## Durable release authorities

- `AUTONOMOUS_RELEASE_QUEUE.md` — accepted/current/next release state.
- `FORWARD_BUILD_ROADMAP_386_395.md` — active forward sequence and continuing release rules.
- `RELEASE_GOVERNANCE.md` — canonical Development exact-SHA, protected-main PR, Production exact-SHA, stale-check and recovery authority.
- `.github/workflows/photo-studio-r2-reliability-authority.yml` — focused current Photo Studio/R2 safety authority.
- `functions/api/_lib/photo-studio-safety.js` and `scripts/build391_photo_studio_r2_reliability_test.mjs` — public/private media isolation, pair metadata and regression proof.
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
