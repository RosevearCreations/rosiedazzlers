# Rosie Dazzlers — Current Project Handoff

This file is the living operational authority for restarting work. Git history and workflow summaries remain the historical evidence. The active forward sequence is `FORWARD_BUILD_ROADMAP_396_405.md`; earlier roadmaps remain historical only.

## Current release boundary

- Repository: `RosevearCreations/rosiedazzlers`.
- The accepted synchronized Production checkpoint immediately precedes the current release. Resolve its exact identity from live `dev`/`main` refs and exact-SHA workflow evidence rather than copying historical release identities into this living file.
- **Build 400 — Detailer Mobile App QoL & Retention Evidence** is the active bounded release. It extends the canonical Detailer field runtime with additive touch shortcuts and a non-authoritative device-only timer, and adds bounded aggregate repeat-service evidence from exact canonical customer IDs only.
- **Build 401 — Job Handoff, Detailer/Admin Interaction & Commercial Evidence** is next only after the current release is fully accepted on protected `main` with exact Production evidence GREEN.
- The current release does not authorize a database migration, database restore, Production R2 write/delete, DNS mutation, secret rotation, accounting posting, period-close mutation, customer charge/refund, provider mutation, inventory mutation or Production business-data mutation as part of source promotion.
- GitHub-hosted branch/ruleset enforcement is separate from source authority. `main` remains governed by the active `rd main protection` ruleset; any protection state that becomes absent or unobservable is AMBER rather than assumed GREEN.

## Current Detailer mobile contract

- `/app/detailer/` remains the single canonical Detailer Mobile App. The existing server-authoritative assigned-job, transition, field-evidence, media and customer-handoff paths are retained.
- The additive quick-capture layer scrolls/focuses the existing before-photo, checklist, approved add-on, product/material, completion and after-photo controls; it does not create a parallel field record path.
- Quick controls are disabled while the live-job module is asleep. The convenience layer performs no API request and starts no network polling.
- The local timer uses device session state only. It is not payroll, billing, accounting, completion, inventory or canonical job-state evidence.
- Build 383 start/complete evidence gates and server job transitions remain authoritative.

## Current retention evidence contract

- Repeat-service/rebooking evidence uses exact non-empty canonical `customer_id` values from bounded booking history only.
- Missing canonical IDs are excluded instead of inferred from name, email, phone, postal code, anonymous analytics or session evidence.
- Output is aggregate-only; customer IDs and other unnecessary identifiers are not exposed.
- Row limits and bounded observation windows are disclosed. Partial or unavailable evidence remains partial/unavailable rather than being treated as zero.
- A repeat rate calculated inside the bounded window is not a lifetime retention claim.
- Persistent customer scoring, automatic outreach and automatic booking/payment actions remain prohibited.

## Responsive / interaction contract

- The retained shared phone, tablet/small-laptop and desktop authority remains mandatory for every new/materially changed current-release surface.
- Changed Detailer controls use large touch targets and one-thumb-friendly shortcuts without shrinking the canonical controls.
- Explicit loading/success/warning/error states must remain truthful; device-local state must not be described as server persistence.
- Dormant modules remain event-driven; permanent polling requires a demonstrated operational need.

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

## Durable release authorities

- `AUTONOMOUS_RELEASE_QUEUE.md` — accepted/current/next release state.
- `FORWARD_BUILD_ROADMAP_396_405.md` — active forward sequence and continuing release rules.
- `BUILD400_DETAILER_MOBILE_QOL_RETENTION.md` — current mobile/retention evidence and mutation contract.
- `.github/workflows/detailer-mobile-qol-retention-authority.yml` and `scripts/build400_detailer_mobile_qol_retention_check.py` — focused current source authority.
- `.github/workflows/responsive-ux-authority.yml` and `scripts/build397_responsive_ux_authority_check.py` — retained shared responsive baseline authority.
- `RELEASE_GOVERNANCE.md` — canonical Development exact-SHA, protected-main PR, Production exact-SHA, stale-check and recovery authority.
- `PRODUCTION_BUSINESS_ACCEPTANCE.md` and `docs/PRODUCTION_BUSINESS_GROWTH_READINESS.md` — retained whole-platform Production acceptance/evidence boundaries.
- `.github/workflows/development-source-gate.yml` — cumulative source authority; protected-main required context remains `source checks`.
- `.github/workflows/cloudflare-development-acceptance.yml` — exact-SHA Development deployment/runtime acceptance.
- `.github/workflows/production-business-acceptance-authority.yml` — durable Production business-path and exact-SHA authority.
- `scripts/release_authority_documentation_convergence_check.py` — living release/documentation convergence guard.

## Restart point

Start from the latest accepted checkpoint reported by GitHub, not a SHA copied into prose. Read this handoff, `AUTONOMOUS_RELEASE_QUEUE.md`, `FORWARD_BUILD_ROADMAP_396_405.md`, `BUILD400_DETAILER_MOBILE_QOL_RETENTION.md`, `RELEASE_GOVERNANCE.md` and `STARTUP_GO_LIVE_BLOCKERS.md`, then continue the active bounded release. Preserve exact-SHA feature → Development → protected-main PR → exact Production acceptance discipline and require observed Production runtime proof before calling a release fully GREEN.
