# Rosie Dazzlers — Current Project Handoff

This is the living restart authority. Historical release evidence belongs in Git history/workflows; exact accepted identities come from live refs and exact-SHA evidence.

## Current release boundary

The synchronized Production predecessor is retained through `BUILD431_LOCAL_ACQUISITION_CONTENT_PROOF.md`.

**Build 432 — Detailer Mobile & Staff Workflow Refinement** is the active bounded release.

**Build 433 — Support Automation & Exception Handling** is next only after the current release is independently GREEN on protected `main`.

Current contract: `BUILD432_DETAILER_STAFF_WORKFLOW_REFINEMENT.md`. Active roadmap: `FORWARD_BUILD_ROADMAP_426_435.md`. Canonical HOLD backlog: `STARTUP_GO_LIVE_BLOCKERS.md`.

This release authorizes no schema migration, secret rotation, Production restore, customer/booking mutation outside existing explicit controls, staff role/capability change, consent mutation, provider contact, accounting/inventory posting, destructive R2 mutation, DNS mutation, automatic outreach or permanent polling.

## Current staff workflow contract

- Detailer next-step convenience delegates only to an already enabled canonical job action.
- Resume convenience is session-only, manual and limited to an assigned job still present in the current authorized workspace.
- Operations remembers only the last workstream key in the current tab and requires a manual resume click.
- Admin Today remembers only urgency/ownership/timing filter values in the current tab.
- Browser connection state is advisory; no failed mutation is automatically queued or replayed.
- Existing role ceilings, field-evidence gates, completion rules, explicit confirmations and server authority remain unchanged.
- No new API or duplicate business-state ledger is introduced.

## Retained operating contract

- `dev` is Development; protected `main` is Production source.
- Feature candidates require focused authority, Current Source Gate and exact feature-preview acceptance before `dev` moves.
- `dev` advances only by non-force fast-forward to the exact accepted candidate and must independently pass exact-SHA Development deployment/runtime acceptance.
- Production is proposed by PR from accepted Development to protected `main`; `rd main protection` is not bypassed.
- The resulting `main` SHA must independently pass exact Production deployment/runtime/business acceptance.
- Missing deployment identity, required check, Functions metadata or runtime smoke is a blocker.
- Database migrations remain separate explicit acceptance boundaries.
- Provider/business mutations remain separately authorized.

## Durable authorities

- `AUTONOMOUS_RELEASE_QUEUE.md`
- `FORWARD_BUILD_ROADMAP_426_435.md`
- `BUILD432_DETAILER_STAFF_WORKFLOW_REFINEMENT.md`
- `BUILD433_SUPPORT_AUTOMATION_EXCEPTION_HANDLING.md`
- `.github/workflows/detailer-staff-workflow-refinement-authority.yml`
- `.github/workflows/development-source-gate.yml`
- `.github/workflows/production-business-acceptance-authority.yml`
- `scripts/detailer_staff_workflow_refinement_check.py`
- `scripts/release_authority_documentation_convergence_check.py`
- `RELEASE_GOVERNANCE.md`

## Restart point

Resolve live `dev`/`main` refs and exact-SHA workflow evidence first, then read this file, the queue, current contract, active roadmap and go-live blockers. Preserve feature → exact Development → protected-main PR → exact Production acceptance discipline.
