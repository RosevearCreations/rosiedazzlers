# Rosie Dazzlers — Current Project Handoff

This file is the living operational authority for restarting work. Git history and workflow summaries remain the historical evidence. The active forward sequence is `FORWARD_BUILD_ROADMAP_396_405.md`; earlier roadmaps remain historical only.

## Current release boundary

- Repository: `RosevearCreations/rosiedazzlers`.
- The accepted synchronized Production checkpoint immediately precedes the current release. Resolve its exact identity from live `dev`/`main` refs and exact-SHA workflow evidence rather than copying historical release identities into this living file.
- **Build 396 — Growth Baseline & Forward Roadmap Renewal** is the active bounded release. It establishes the aggregate-first measurement/evidence boundary across acquisition, conversion, booking, retention and commercial outcomes and renews living release authority through the 396–405 sequence.
- **Build 397 — Growth Measurement Surface & Instrumentation Coverage** is next only after the current release is fully accepted on protected `main` with exact Production evidence GREEN.
- The current release does not authorize a database migration, database restore, Production R2 write/delete, DNS mutation, secret rotation, accounting posting, period-close mutation, customer charge/refund, provider mutation, inventory mutation or Production business-data mutation as part of source promotion.
- GitHub-hosted branch/ruleset enforcement is separate from source authority. `main` remains governed by the active `rd main protection` ruleset; any protection state that becomes absent or unobservable is AMBER rather than assumed GREEN.

## Current growth baseline contract

- Existing first-party `site_activity_events` is acquisition/session evidence, but growth output is aggregate-first and must disclose disabled telemetry, storage failure, row limits and truncation.
- Anonymous acquisition/session evidence remains separate from exact customer-profile booking history; no cross-layer, fuzzy/email identity join is authorized.
- Existing booking/rebooking funnel authority remains conversion/booking evidence and existing exact-profile retention authority remains retention evidence.
- Existing payment/booking-finance, operations/job-cost and Finance close/reconciliation/export authorities remain commercial evidence; missing fee/HST/job-cost/reconciliation evidence remains review/unavailable rather than estimated.
- Raw IP addresses, User-Agent strings, visitor/session IDs, raw postal codes, customer names/emails and other unnecessary identifiers are not growth-report output.
- Missing observations are never treated as zero by assumption and source documents do not pin stale live KPI values.

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
- `FORWARD_BUILD_ROADMAP_396_405.md` — active forward sequence and continuing release rules.
- `docs/GROWTH_BASELINE_FORWARD_ROADMAP.md` — current growth measurement/evidence baseline.
- `.github/workflows/growth-baseline-forward-roadmap-authority.yml` — focused current baseline/roadmap source and exact-Production authority.
- `scripts/build396_growth_baseline_forward_roadmap_check.py` — focused executable Build 396 source-contract proof.
- `RELEASE_GOVERNANCE.md` — canonical Development exact-SHA, protected-main PR, Production exact-SHA, stale-check and recovery authority.
- `PRODUCTION_BUSINESS_ACCEPTANCE.md` and `docs/PRODUCTION_BUSINESS_GROWTH_READINESS.md` — retained whole-platform Production acceptance/evidence boundaries.
- `.github/workflows/development-source-gate.yml` — cumulative source authority; protected-main required context remains `source checks`.
- `.github/workflows/cloudflare-development-acceptance.yml` — exact-SHA Development deployment/runtime acceptance.
- `.github/workflows/production-business-acceptance-authority.yml` — durable Production business-path and exact-SHA authority.
- `scripts/production_business_acceptance_check.py` — durable retained whole-platform authority inventory.
- `scripts/release_authority_documentation_convergence_check.py` — living release/documentation convergence guard.

## Retained specialist authorities

- `FORWARD_BUILD_ROADMAP_386_395.md` — completed prior sequence retained for historical Build 395/396 bridge checks.
- `.github/workflows/production-business-growth-readiness-authority.yml` and `scripts/build395_production_business_growth_readiness_check.py` — retained prior whole-platform authority, forward-compatible with newer living releases.
- `docs/BACKUP_RESTORE_RELEASE_RECOVERY.md` — retained recovery evidence matrix, drill sequence and authorization boundaries.
- `.github/workflows/release-governance-authority.yml` and `scripts/release_governance_audit.py` — retained release-governance authority.
- `.github/workflows/development-rollback-readiness.yml` — manual read-only prior-SHA Development rollback candidate proof.
- `.github/workflows/cloudflare-pages-recovery.yml` — narrowly guarded Development-only Cloudflare repair path.
- `scripts/cloudflare_development_rollback.sh` — read-only Development rollback candidate verifier.
- `scripts/cloudflare_pages_production_acceptance.sh` — read-only Cloudflare Production deployment identity and HTTP smoke helper.

## Restart point

Start from the latest accepted checkpoint reported by GitHub, not a SHA copied into prose. Read this handoff, `AUTONOMOUS_RELEASE_QUEUE.md`, `FORWARD_BUILD_ROADMAP_396_405.md`, `RELEASE_GOVERNANCE.md` and `STARTUP_GO_LIVE_BLOCKERS.md`, then continue the active bounded release. Preserve exact-SHA feature → Development → protected-main PR → exact Production acceptance discipline and require observed Production runtime proof before calling a release fully GREEN.
