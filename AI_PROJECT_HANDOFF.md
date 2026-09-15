# Rosie Dazzlers — Current Project Handoff

This file is the living operational authority for restarting work. Git history and workflow summaries remain the historical evidence. The active forward sequence is `FORWARD_BUILD_ROADMAP_396_405.md`; earlier roadmaps remain historical only.

## Current release boundary

- Repository: `RosevearCreations/rosiedazzlers`.
- The accepted synchronized Production checkpoint immediately precedes the current release. Resolve its exact identity from live `dev`/`main` refs and exact-SHA workflow evidence rather than copying historical release identities into this living file.
- **Build 399 — Customer Communication, Self-Service & Booking Funnel** is the active bounded release. It adds permission-aware customer guidance and self-service navigation plus separate bounded anonymous-interaction and canonical-booking evidence layers while retaining the prior responsive and privacy/evidence boundaries.
- **Build 400 — Detailer Mobile App QoL & Retention Evidence** is next only after the current release is fully accepted on protected `main` with exact Production evidence GREEN.
- The current release does not authorize a database migration, database restore, Production R2 write/delete, DNS mutation, secret rotation, accounting posting, period-close mutation, customer charge/refund, provider mutation, inventory mutation or Production business-data mutation as part of source promotion.
- GitHub-hosted branch/ruleset enforcement is separate from source authority. `main` remains governed by the active `rd main protection` ruleset; any protection state that becomes absent or unobservable is AMBER rather than assumed GREEN.

## Current customer communication / funnel evidence contract

- `/book` and provider-backed booking confirmation retain the proven live-pricing, canonical booking-planner and signed settlement paths. Build 399 does not create a parallel booking or communication engine.
- My Account links to preparation, status, booking-change review, aftercare, review and rebooking paths. A link/request does not silently change or cancel a booking, promise a refund, dispatch a message or claim acceptance.
- Anonymous interaction events and canonical booking-status totals remain separate bounded evidence layers and are not joined into a customer/person-level cohort.
- Existing first-party `site_activity_events` remains acquisition/session evidence. Acquisition Quality output is aggregate-first and reports observed source, campaign, normalized referrer-host and device evidence only.
- Missing attribution remains unavailable/insufficient/unattributed. Row-limit/truncation is disclosed. No source/campaign value is inferred from another layer.
- Anonymous acquisition/session evidence remains separate from exact customer-profile booking history; no cross-layer, fuzzy/email identity join is authorized.
- Raw IP addresses, User-Agent strings, visitor/session IDs, raw postal codes, customer names/emails and other unnecessary identifiers are not acquisition-quality output.
- Existing payment/booking-finance, operations/job-cost and Finance close/reconciliation/export authorities remain commercial evidence; missing fee/HST/job-cost/reconciliation evidence remains review/unavailable rather than estimated.
- Missing observations are never treated as zero by assumption and source documents do not pin stale live KPI values.

## Responsive / interaction contract

- The retained shared phone, tablet/small-laptop and desktop authority remains mandatory for every new/materially changed current-release surface.
- The booking convenience layer uses 44–48px touch targets and stacks selection/actions on narrow viewports instead of shrinking desktop controls.
- The Acquisition Quality surface reflows cards/controls for narrow screens and does not require material horizontal scrolling for primary content.
- Explicit loading/success/warning/error states must remain truthful; browser-local state must not be described as server persistence.

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
- `BUILD399_CUSTOMER_COMMUNICATION_SELF_SERVICE.md` — current source/privacy/mutation contract.
- `.github/workflows/customer-communication-self-service-authority.yml` — focused current source and exact-Production authority.
- `scripts/build399_customer_communication_self_service_check.py` — focused executable current source-contract proof.
- `.github/workflows/customer-journey-acquisition-quality-authority.yml` and `scripts/build398_customer_journey_acquisition_quality_check.py` — retained prior customer-journey/privacy authority.
- `docs/GROWTH_BASELINE_FORWARD_ROADMAP.md` — retained growth measurement/evidence baseline.
- `.github/workflows/responsive-ux-authority.yml` and `scripts/build397_responsive_ux_authority_check.py` — retained shared responsive baseline authority.
- `RELEASE_GOVERNANCE.md` — canonical Development exact-SHA, protected-main PR, Production exact-SHA, stale-check and recovery authority.
- `PRODUCTION_BUSINESS_ACCEPTANCE.md` and `docs/PRODUCTION_BUSINESS_GROWTH_READINESS.md` — retained whole-platform Production acceptance/evidence boundaries.
- `.github/workflows/development-source-gate.yml` — cumulative source authority; protected-main required context remains `source checks`.
- `.github/workflows/cloudflare-development-acceptance.yml` — exact-SHA Development deployment/runtime acceptance.
- `.github/workflows/production-business-acceptance-authority.yml` — durable Production business-path and exact-SHA authority.
- `scripts/production_business_acceptance_check.py` — durable retained whole-platform authority inventory.
- `scripts/release_authority_documentation_convergence_check.py` — living release/documentation convergence guard.

## Retained specialist authorities

- Prior forward-roadmap files remain completed historical context only.
- The retained growth-baseline workflow/checker remain historical source authorities and must stay forward-compatible with the living sequence.
- The retained prior whole-platform growth-readiness authority remains forward-compatible with newer living releases.
- `docs/BACKUP_RESTORE_RELEASE_RECOVERY.md` — retained recovery evidence matrix, drill sequence and authorization boundaries.
- `.github/workflows/release-governance-authority.yml` and `scripts/release_governance_audit.py` — retained release-governance authority.
- `.github/workflows/development-rollback-readiness.yml` — manual read-only prior-SHA Development rollback candidate proof.
- `.github/workflows/cloudflare-pages-recovery.yml` — narrowly guarded Development-only Cloudflare repair path.
- `scripts/cloudflare_development_rollback.sh` — read-only Development rollback candidate verifier.
- `scripts/cloudflare_pages_production_acceptance.sh` — read-only Cloudflare Production deployment identity and HTTP smoke helper.

## Restart point

Start from the latest accepted checkpoint reported by GitHub, not a SHA copied into prose. Read this handoff, `AUTONOMOUS_RELEASE_QUEUE.md`, `FORWARD_BUILD_ROADMAP_396_405.md`, `BUILD398_CUSTOMER_JOURNEY_ACQUISITION.md`, `RELEASE_GOVERNANCE.md` and `STARTUP_GO_LIVE_BLOCKERS.md`, then continue the active bounded release. Preserve exact-SHA feature → Development → protected-main PR → exact Production acceptance discipline and require observed Production runtime proof before calling a release fully GREEN.
