# Rosie Dazzlers — Current Project Handoff

This file is the living operational authority for restarting work. Git history and workflow summaries remain the historical evidence. The active forward sequence is `FORWARD_BUILD_ROADMAP_386_395.md`; earlier roadmaps remain historical only.

## Current release boundary

- Repository: `RosevearCreations/rosiedazzlers`.
- The accepted synchronized Production checkpoint immediately precedes the current release. Resolve its exact identity from live `dev`/`main` refs and exact-SHA workflow evidence rather than copying historical release identities into this living file.
- **Build 394 — Finance Close, Reconciliation & Accountant Export Acceptance** is the active bounded release. It adds a staff-authorized, schema-neutral, read-only acceptance projection over the existing booking-finance, posted-accounting, bank-reconciliation, HST, month-end and accountant-export authorities. It does not create a second accounting ledger.
- **Build 395 — Production Business Acceptance & Growth Readiness** is next only after the current release is fully accepted on protected `main` with exact Production evidence GREEN.
- The current release does not authorize a database migration, database restore, Production R2 write/delete, DNS mutation, secret rotation, accounting posting, period-close mutation, customer charge/refund, provider mutation or Production business-data mutation as part of source promotion.
- GitHub-hosted branch/ruleset enforcement is separate from source authority. `main` remains governed by the active `rd main protection` ruleset; any protection state that becomes absent or unobservable is AMBER rather than assumed GREEN.

## Current finance close acceptance contract

- Existing `booking_finance_*` booking events remain the canonical deposit, final-balance and refund evidence authority.
- Posted accounting reports remain the canonical ledger and HST authority; the current release does not create or post journal entries.
- Saved cash reconciliation remains the bank-reconciliation authority and must show a closed/reconciled zero difference before close readiness can be `ready`.
- The existing month-end checklist and closure snapshot remain the month-end authority; incomplete checklist/evidence remains `review` or `unavailable`.
- Paid provider activity requires explicit posted fee/processing/merchant/Stripe/PayPal account evidence. Provider fees are never estimated from payment totals.
- Existing CSV accounting exports and the accountant package remain the export authorities. The current release reports evidence-backed export readiness but never auto-approves an accountant package.
- `GET /api/admin/accounting_finance_close_acceptance?month=M&year=Y` is staff-authorized with `finance.view` and observation-only.
- Missing canonical evidence is never coerced to zero or success. Acceptance is deterministically `ready`, `review`, or `unavailable`.

## Accepted operating contract

- `dev` is the accepted Development line; protected `main` is the accepted Production source line.
- A feature candidate must pass its focused authority, Current Source Gate and feature-preview acceptance before `dev` moves.
- `dev` advances only by non-force fast-forward to the exact accepted candidate SHA and must then pass exact-SHA Development deployment/runtime acceptance.
- Production promotion is proposed through a pull request from the accepted Development line to protected `main`; do not bypass `rd main protection`.
- The protected-main required checks, including `source checks`, must pass before merge. A merge commit is preferred so the accepted Development SHA remains explicit in Production ancestry.
- After merge, the resulting `main` head becomes the exact Production source SHA. Production deployment/runtime/business acceptance must independently prove that exact SHA.
- Missing deployment identity, required check, Functions metadata or runtime smoke is a blocker, not permission to infer GREEN.
- Database migrations remain separate explicit acceptance boundaries and are never incidental runtime side effects.
- Payment, provider, consent, review, accounting, tax and customer evidence must remain genuine and server-authoritative.
- Public SEO remains constrained to one meaningful H1 per indexable page, unique metadata/canonical/structured data and truthful local/service content.
- Dormant modules remain event-driven; permanent polling requires a demonstrated operational need.

## Durable release authorities

- `AUTONOMOUS_RELEASE_QUEUE.md` — accepted/current/next release state.
- `FORWARD_BUILD_ROADMAP_386_395.md` — active forward sequence and continuing release rules.
- `RELEASE_GOVERNANCE.md` — canonical Development exact-SHA, protected-main PR, Production exact-SHA, stale-check and recovery authority.
- `.github/workflows/finance-close-reconciliation-accountant-export-authority.yml` — focused current Finance close/reconciliation/export authority.
- `functions/api/_lib/accounting-finance-close-acceptance.js` and `functions/api/admin/accounting_finance_close_acceptance.js` — read-only acceptance projection and staff-authorized endpoint.
- `scripts/build394_finance_close_reconciliation_accountant_export_test.mjs` and `scripts/build394_finance_close_reconciliation_accountant_export_check.py` — executable contract and source boundary proof.
- `.github/workflows/development-source-gate.yml` — cumulative source authority; protected-main required context remains `source checks`.
- `.github/workflows/cloudflare-development-acceptance.yml` — exact-SHA Development deployment/runtime acceptance.
- `.github/workflows/production-business-acceptance-authority.yml` — durable Production business-path and exact-SHA authority.
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
