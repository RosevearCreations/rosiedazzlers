# Rosie Dazzlers — Current Project Handoff

This file is the living operational authority for restarting work. Git history and workflow summaries remain the historical evidence. The active forward sequence is `FORWARD_BUILD_ROADMAP_386_395.md`; earlier roadmaps remain historical only.

## Current release boundary

- Repository: `RosevearCreations/rosiedazzlers`.
- The accepted synchronized Production checkpoint immediately precedes the current release. Resolve its exact identity from live `dev`/`main` refs and exact-SHA workflow evidence rather than copying historical release identities into this living file.
- **Build 395 — Production Business Acceptance & Growth Readiness** is the active bounded release. It closes the current forward sequence by composing retained public, booking, customer, field, media, payment/finance, retention, maintenance/fleet, operations, I.T./observability, hardening and recovery authorities into one fail-closed Production acceptance path.
- **Build 396 — Growth Baseline & Forward Roadmap Renewal** is next only after the current release is fully accepted on protected `main` with exact Production evidence GREEN.
- The current release does not authorize a database migration, database restore, Production R2 write/delete, DNS mutation, secret rotation, accounting posting, period-close mutation, customer charge/refund, provider mutation or Production business-data mutation as part of source promotion.
- GitHub-hosted branch/ruleset enforcement is separate from source authority. `main` remains governed by the active `rd main protection` ruleset; any protection state that becomes absent or unobservable is AMBER rather than assumed GREEN.

## Current whole-platform acceptance contract

- Anonymous acquisition and service discovery retain one meaningful H1, unique metadata/canonical/structured data, truthful local/service content and current commercial authority.
- Booking remains server-authoritative for availability, pricing, package/add-on compatibility and condition-aware estimate escalation.
- Customer/account, staff/mobile execution and completion/proof retain authenticated/authorized boundaries; no customer or media evidence is synthesized.
- Provider/payment and Finance acceptance remain evidence-driven. Missing provider fee, HST, reconciliation, close or export evidence remains review/unavailable rather than being estimated.
- Retention, maintenance and fleet remain capacity-aware and rule-authorized; rebook revalidates current commercial rules.
- Existing inventory movement/item/purchase-order authorities remain canonical for operations/inventory/job-cost evidence; no second inventory ledger is created.
- I.T. readiness, Production observability/self-diagnostics, performance, accessibility, security, rollback/recovery and repository hygiene remain retained Production blockers when red or unobservable.
- The durable Production path is observation-only and requires exact resulting protected-main SHA deployment/runtime/business proof.

## Accepted operating contract

- `dev` is the accepted Development line; protected `main` is the accepted Production source line.
- A feature candidate must pass its focused authority, Current Source Gate and feature-preview acceptance before `dev` moves.
- `dev` advances only by non-force fast-forward to the exact accepted candidate SHA and must then pass exact-SHA Development deployment/runtime acceptance.
- Production promotion is proposed through a pull request from the accepted Development line to protected `main`; do not bypass `rd main protection`.
- The protected-main required checks, including `source checks`, must pass before merge. A merge commit is preferred so the accepted Development SHA remains explicit in Production ancestry.
- After merge, the resulting `main` head becomes the exact Production source SHA. Production deployment/runtime/business acceptance must independently prove that exact SHA.
- Missing deployment identity, required check, Functions metadata or runtime smoke is a blocker, not permission to infer GREEN.
- Database migrations remain separate explicit acceptance boundaries and are never incidental runtime side effects.
- Payment, provider, consent, review, accounting, tax, inventory, media and customer evidence must remain genuine and server-authoritative.
- Public SEO remains constrained to one meaningful H1 per indexable page, unique metadata/canonical/structured data and truthful local/service content.
- Dormant modules remain event-driven; permanent polling requires a demonstrated operational need.

## Durable release authorities

- `AUTONOMOUS_RELEASE_QUEUE.md` — accepted/current/next release state.
- `FORWARD_BUILD_ROADMAP_386_395.md` — active forward sequence and continuing release rules.
- `RELEASE_GOVERNANCE.md` — canonical Development exact-SHA, protected-main PR, Production exact-SHA, stale-check and recovery authority.
- `docs/PRODUCTION_BUSINESS_GROWTH_READINESS.md` — current whole-platform acceptance matrix and evidence boundary.
- `.github/workflows/production-business-growth-readiness-authority.yml` — focused current whole-platform source/exact-Production authority.
- `scripts/build395_production_business_growth_readiness_check.py` — focused executable source-contract proof.
- `.github/workflows/development-source-gate.yml` — cumulative source authority; protected-main required context remains `source checks`.
- `.github/workflows/cloudflare-development-acceptance.yml` — exact-SHA Development deployment/runtime acceptance.
- `.github/workflows/production-business-acceptance-authority.yml` — durable Production business-path and exact-SHA authority.
- `scripts/production_business_acceptance_check.py` — durable retained whole-platform authority inventory.
- `scripts/release_authority_documentation_convergence_check.py` — living release/documentation convergence guard.

## Retained specialist authorities

- `docs/BACKUP_RESTORE_RELEASE_RECOVERY.md` — retained recovery evidence matrix, drill sequence and authorization boundaries.
- `.github/workflows/release-governance-authority.yml` and `scripts/release_governance_audit.py` — retained release-governance authority.
- `.github/workflows/development-rollback-readiness.yml` — manual read-only prior-SHA Development rollback candidate proof.
- `.github/workflows/cloudflare-pages-recovery.yml` — narrowly guarded Development-only Cloudflare repair path.
- `scripts/cloudflare_development_rollback.sh` — read-only Development rollback candidate verifier.
- `scripts/cloudflare_pages_production_acceptance.sh` — read-only Cloudflare Production deployment identity and HTTP smoke helper.

## Restart point

Start from the latest accepted checkpoint reported by GitHub, not a SHA copied into prose. Read this handoff, `AUTONOMOUS_RELEASE_QUEUE.md`, the active forward roadmap, `RELEASE_GOVERNANCE.md` and `STARTUP_GO_LIVE_BLOCKERS.md`, then continue the active bounded release. Preserve exact-SHA feature → Development → protected-main PR → exact Production acceptance discipline and require observed Production runtime proof before calling a release fully GREEN.
