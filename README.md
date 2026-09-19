# Rosie Dazzlers

Current source direction: **Build 432 — Detailer Mobile & Staff Workflow Refinement**.

Rosie Dazzlers is one platform with a static-first public website and independently authorized Customer, Detailer, Operations, Administration, I.T., Finance, DAIP and Socials & Promotion modules.

## Start here

1. `AI_PROJECT_HANDOFF.md` — current implementation/deployment/release truth.
2. `AUTONOMOUS_RELEASE_QUEUE.md` — current/next bounded work.
3. `FORWARD_BUILD_ROADMAP_426_435.md` — active evidence-driven sequence.
4. `BUILD432_DETAILER_STAFF_WORKFLOW_REFINEMENT.md` — current bounded contract.
5. `STARTUP_GO_LIVE_BLOCKERS.md` — canonical Production HOLD/evidence backlog.
6. `BUILD431_LOCAL_ACQUISITION_CONTENT_PROOF.md` — retained predecessor contract.

Git history and exact-SHA workflows are the release archive. `DOC_INDEX.md` contains specialist references.

## Current staff workflow framework

Build 432 adds a DOM-only staff convenience layer without creating a new business-state authority.

- Detailer Mobile exposes a manual next-available-action shortcut that delegates to currently enabled canonical job controls.
- Detailer resume memory is session-only and only targets jobs still present in the current authorized assigned-job workspace.
- Operations can manually resume the last workstream key remembered in the current tab.
- Admin Today can restore or clear session-only queue filters.
- Browser connection state is advisory only; no mutation is queued or replayed automatically.
- Existing role ceilings, field-evidence gates, explicit confirmations and server authority remain unchanged.

The implementation introduces no new API, schema migration, background polling, customer outreach, provider transaction, inventory/accounting posting or destructive storage action.

## Retained operating boundaries

Production support diagnostics remain read-only and manual-refresh. Customer communication remains explicit-consent gated. Provider acceptance is not definitive delivery without provider delivery evidence.

Backup/restore and rollback mechanics remain observation-only unless separately authorized. Media/Photo Studio destructive operations remain explicit and auditable. Maintenance/fleet terms remain owner-approved and capacity-aware.

## Durable validation

Focused and retained authorities include:

```bash
python scripts/detailer_staff_workflow_refinement_check.py
python scripts/mobile_detailer_field_workflow_check.py
python scripts/build400_detailer_mobile_qol_retention_check.py
python scripts/build401_job_handoff_commercial_evidence_check.py
python scripts/workflow_efficiency_accessibility_check.py
python scripts/release_authority_documentation_convergence_check.py
python scripts/release_check.py
```

Production business acceptance remains governed by `.github/workflows/production-business-acceptance-authority.yml`.

## Release authority

Feature candidates must pass focused authority, Current Source Gate and exact feature-preview acceptance before `dev` moves. `dev` advances only by non-force fast-forward to the exact accepted candidate and then independently proves that exact SHA in Development.

Production promotion is governed by `rd main protection`. Accepted Development is proposed by pull request to protected `main`; required source checks must pass and protection must not be bypassed.

After merge, the resulting `main` head is the exact Production source SHA. Production deployment/runtime/business acceptance must independently prove that exact SHA. Production is not considered GREEN from source promotion alone.

## Next bounded release

**Build 433 — Support Automation & Exception Handling** is next only after the current release is independently GREEN on protected `main`.
