# Rosie Dazzlers — Current Project Handoff

This file is the living operational authority for restarting work. Git history and workflow summaries remain the historical evidence. The durable numbered forward sequences are `FORWARD_BUILD_ROADMAP_356_377.md` and `FORWARD_BUILD_ROADMAP_378_385.md`.

## Current release boundary

- Repository: `RosevearCreations/rosiedazzlers`.
- **Build 383 — Mobile Detailer Field Workflow Hardening** is the accepted synchronized Production boundary before the current release. Resolve its exact identity from the synchronized `dev`/`main` refs and exact-SHA Production workflow evidence rather than copying a stale SHA into this living file.
- Production acceptance is fail-closed: the exact `main` SHA must match a successful Cloudflare `production` deployment with Functions metadata, then pass smoke against both the immutable deployment and `https://rosiedazzlers.ca`.
- **Build 384 — Finance Cockpit & Month-End UX** is the active bounded release. It converges the retained invoice/payment/reconciliation Finance authorities into a practical operator workflow from quote/deposit evidence through approved changes, final balance, refunds/tips, settlement reconciliation, HST support, month-end readiness and accountant handoff without creating a second ledger or payment authority.
- **Build 385 — Backup, Restore & Release Recovery Drill** is the next approved release after current-release acceptance is complete.
- The current release is schema-neutral. It does not authorize a database migration, automatic accounting posting, automatic month close, booking mutation, customer charge/refund, provider mutation, fabricated provider/accounting evidence or a paid-state override.
- Finance cockpit runtime is lazy and operator-driven. Opening `/app/finance/` loads authentication/module state only; the retained read-only month-end closure snapshot loads only after an explicit month/year request.
- A computed `close_ready_candidate` is evidence/readiness only. It does not close an accounting period and does not remove the existing manual operator approval requirement.

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
- `.github/workflows/payment-reconciliation-month-end-closure-authority.yml` — retained payment reconciliation/month-end close authority.
- `.github/workflows/finance-cockpit-month-end-ux-authority.yml` — focused current Finance cockpit source and exact-SHA Production authority.
- `.github/workflows/mobile-detailer-field-workflow-authority.yml` — retained mobile Detailer field-workflow authority.
- `functions/api/admin/accounting_month_end_closure.js` and `functions/api/_lib/accounting-month-end-closure.js` — retained read-only closure evidence authority used by the current cockpit.
- `scripts/cloudflare_pages_production_acceptance.sh` — read-only Cloudflare Production deployment identity and HTTP smoke helper.

## Restart point

Start from the latest exact synchronized `dev`/`main` checkpoint reported by GitHub, not a SHA copied into prose. Read this handoff and `AUTONOMOUS_RELEASE_QUEUE.md`, then continue the active bounded release. Preserve the exact-SHA feature → Development → non-force Production promotion discipline and require observed Production runtime proof before calling a release fully GREEN.
