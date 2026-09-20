# Rosie Dazzlers — Current Project Handoff

This is the living restart authority. Historical release evidence belongs in Git history/workflows; exact accepted identities come from live refs and exact-SHA evidence.

## Current release boundary
The synchronized Production predecessor is retained through `BUILD445_PRODUCTION_LEARNING_ROADMAP_RENEWAL.md`.

**Build 446 — Provider Evidence Reconciliation Refresh** is the active bounded release.

**Build 447 — Recovery Artifact & Drill Evidence Review** is next only after the current release is independently GREEN on protected `main`.

Current contract: `BUILD446_PROVIDER_EVIDENCE_RECONCILIATION_REFRESH.md`. Active roadmap: `FORWARD_BUILD_ROADMAP_446_455.md`. Canonical HOLD backlog: `STARTUP_GO_LIVE_BLOCKERS.md`.

## Current provider-evidence reconciliation contract
- The current release enriches the retained provider evidence authorities rather than replacing them.
- Evidence age, source availability, freshness and reconciliation gaps are explicit for Stripe, PayPal, refunds and message delivery.
- Missing, undated, stale or unavailable provider evidence remains provider-owned and does not become success.
- Backup/recovery, authenticated device observation and maintenance/fleet business terms remain explicit owner evidence.
- Unreachable authorized evidence remains unavailable rather than guessed.
- `FORWARD_BUILD_ROADMAP_446_455.md` remains the active bounded roadmap.
- Provider refresh is manual/read-only; no provider contact is performed merely to obtain evidence.
- No schema/customer/provider/accounting/inventory/secret/DNS/restore/destructive-storage/outreach/polling mutation is authorized.

## Durable current-release authorities
- `BUILD446_PROVIDER_EVIDENCE_RECONCILIATION_REFRESH.md`
- `.github/workflows/provider-evidence-reconciliation-refresh-authority.yml`
- `scripts/provider_evidence_reconciliation_refresh_check.py`
- `scripts/provider_evidence_reconciliation_refresh_test.mjs`
- `BUILD445_PRODUCTION_LEARNING_ROADMAP_RENEWAL.md`
- `PRODUCTION_LEARNING_436_444.md`
- `FORWARD_BUILD_ROADMAP_446_455.md`
- `STARTUP_GO_LIVE_BLOCKERS.md`

## Retained owning authorities
Historical numbered contracts are retained in Git and the document index. The living handoff keeps only the authority families needed to restart the current release safely:
- `.github/workflows/provider-outcome-delivery-evidence-closure-authority.yml`
- `.github/workflows/backup-recovery-evidence-closure-authority.yml`
- `.github/workflows/authenticated-device-visual-acceptance-authority.yml`
- `.github/workflows/local-search-provider-evidence-refresh-authority.yml`
- `.github/workflows/maintenance-fleet-owner-approval-convergence-authority.yml`
- `.github/workflows/reliability-security-cost-reassessment-authority.yml`
- `.github/workflows/development-source-gate.yml`
- `.github/workflows/production-business-acceptance-authority.yml`
- `scripts/provider_outcome_delivery_evidence_closure_check.py`
- `scripts/backup_recovery_evidence_closure_check.py`
- `scripts/authenticated_device_visual_acceptance_check.py`
- `scripts/local_search_provider_evidence_refresh_check.py`
- `scripts/maintenance_fleet_owner_approval_convergence_check.py`
- `scripts/reliability_security_cost_reassessment_check.py`
- `scripts/release_authority_documentation_convergence_check.py`
- `RELEASE_GOVERNANCE.md`

## Retained operating contract
- `dev` is Development; protected `main` is Production source.
- Feature candidates require focused authority, Current Source Gate and exact feature-preview acceptance before `dev` moves.
- `dev` advances only by non-force fast-forward to the exact accepted candidate and must independently pass exact-SHA Development deployment/runtime acceptance.
- Production is proposed by PR from accepted Development to protected `main`; `rd main protection` is not bypassed.
- The resulting `main` SHA must independently pass exact Production deployment/runtime/business acceptance.
- Production deployment/runtime/business acceptance must independently prove that exact SHA.
- Missing deployment identity, required check, Functions metadata or runtime smoke is a blocker.
- Database migrations remain separate explicit acceptance boundaries.
- Provider/business mutations remain separately authorized.

## Restart point
Resolve live `dev`/`main` refs and exact-SHA workflow evidence first, then read this file, the queue, current contract, active roadmap and go-live blockers. Preserve feature → exact Development → protected-main PR → exact Production acceptance discipline.
