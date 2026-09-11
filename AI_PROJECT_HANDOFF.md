# Rosie Dazzlers — Current Project Handoff

This file is the living operational authority for restarting work. Git history and workflow summaries remain the historical evidence. The durable numbered forward sequences are `FORWARD_BUILD_ROADMAP_356_377.md` and `FORWARD_BUILD_ROADMAP_378_385.md`.

## Current release boundary

- Repository: `RosevearCreations/rosiedazzlers`.
- **Build 381 — Operations Daily Command Centre** is the accepted synchronized Production boundary before the current release. Resolve its exact identity from the synchronized `dev`/`main` refs and exact-SHA Production workflow evidence rather than copying a stale SHA into this living file.
- Production acceptance is fail-closed: the exact `main` SHA must match a successful Cloudflare `production` deployment with Functions metadata, then pass smoke against both the immutable deployment and `https://rosiedazzlers.ca`.
- **Build 382 — Customer Account & Retention UX Convergence** is the active bounded release. It converges authenticated My Account retention UX over the existing customer, booking, saved-vehicle/service-history, quote/proposal, maintenance-interest, communication-preference, review/request and rebooking authorities without creating a second customer or retention ledger.
- **Build 383 — Mobile Detailer Field Workflow Hardening** is the next approved release after Build 382 acceptance is complete.
- The current Build 382 work is schema-neutral. It does not authorize a database migration, duplicate customer/retention ledger, automatic maintenance enrollment, appointment creation, subscription or recurring billing, fabricated consent/review evidence, independent review eligibility decisions, or direct payment/provider mutation.

## Accepted operating contract

- `dev` is the accepted Development line; `main` is the accepted Production source line.
- A feature candidate must pass its focused authority, Current Source Gate and feature-preview acceptance before `dev` moves.
- `dev` must pass the retained exact-SHA Development source/runtime authorities before Production promotion.
- When Production promotion is authorized, `main` moves by non-force fast-forward to the same Development-GREEN SHA.
- Source promotion alone is never Production proof. The Production exact-SHA authority must independently observe the successful Cloudflare deployment and canonical runtime.
- Missing deployment identity, Functions metadata or runtime smoke is a blocker, not permission to infer GREEN.
- Database migrations remain separate explicit acceptance boundaries and are never incidental runtime side effects.
- Payment, provider, consent, review, accounting, tax and customer evidence must remain genuine and server-authoritative; source/runtime checks never manufacture them.
- Public SEO remains constrained to one meaningful H1 per indexable page, current catalog/pricing authority and truthful local/service content.
- Dormant modules remain event-driven; permanent polling requires a demonstrated operational need.

## Durable release authorities

- `AUTONOMOUS_RELEASE_QUEUE.md` — accepted/current/next release state.
- `FORWARD_BUILD_ROADMAP_378_385.md` — approved forward sequence and continuing release rules.
- `BRANCH_WORKFLOW_NOTE.md` — branch roles and promotion discipline.
- `.github/workflows/development-source-gate.yml` — cumulative source authority.
- `.github/workflows/cloudflare-development-acceptance.yml` — exact-SHA Development deployment/runtime acceptance.
- `.github/workflows/production-business-acceptance-authority.yml` — durable Production business-path and exact-SHA authority.
- `.github/workflows/booking-recovery-failure-handling-authority.yml` — retained booking-recovery source and Production exact-SHA authority.
- `.github/workflows/operations-daily-command-centre-authority.yml` — retained Operations source and Production exact-SHA authority.
- `.github/workflows/customer-account-retention-ux-authority.yml` — focused Build 382 customer-account/retention source and exact-SHA authority.
- `BOOKING_RECOVERY_FAILURE_HANDLING.md` — accepted customer-safe recovery and failure-state contract.
- `OPERATIONS_DAILY_COMMAND_CENTRE.md` — accepted Operations aggregation and fail-closed evidence contract.
- `scripts/cloudflare_pages_production_acceptance.sh` — read-only Cloudflare Production deployment identity and HTTP smoke helper.

## Restart point

Start from the latest exact synchronized `dev`/`main` checkpoint reported by GitHub, not a SHA copied into prose. Read this handoff and `AUTONOMOUS_RELEASE_QUEUE.md`, then continue the active bounded release. Preserve the exact-SHA feature → Development → non-force Production promotion discipline and require observed Production runtime proof before calling a release fully GREEN.
