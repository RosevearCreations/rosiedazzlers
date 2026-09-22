# Build 477 — Recovery Drill Evidence Refresh & Closure Review

## Purpose
Turn stale or missing retained recovery evidence into an explicit owner-reviewed evidence-refresh plan or bounded non-Production drill plan, with recorded prerequisites and post-observation evidence requirements, without performing a Production restore merely to manufacture readiness.

## Retained surface
Build 477 enriches the existing Launch Readiness recovery panel and retained read-only `/api/admin/recovery_artifact_drill_evidence_review` endpoint. It reuses:
- Build 437 backup/recovery evidence closure;
- Build 447 recovery artifact & drill evidence review;
- Build 457 recovery evidence closure & drill readiness; and
- Build 467 recovery evidence validation & drill decision readiness.

It does not create a second backup service, restore engine, recovery ledger, drill executor or readiness dashboard.

## Evidence refresh and drill planning
The three retained evidence classes remain independent: current backup artifact observation, retention/location observation and bounded recovery/rollback drill observation.

Build 477 produces a deterministic `evidence_trace_key` over the exact retained evidence snapshot. Missing or stale retained evidence becomes an explicit refresh requirement. Missing or stale recovery-drill evidence may become a bounded non-Production drill-plan review candidate.

A plan is not considered owner-reviewed unless an explicit review record contains:
- `reviewed_at`;
- `reviewer_role`;
- `decision`; and
- the exact matching `evidence_trace_key`.

The read-only endpoint does not create or persist that review record.

## Plan prerequisites
A bounded non-Production drill plan records, at minimum:
- a non-Production target/environment;
- current backup artifact and retention-location references;
- the bounded recovery/rollback runbook;
- the responsible operator;
- abort criteria; and
- the explicit no-Production-restore boundary.

An evidence-refresh plan records the authorized retained evidence source, non-destructive observation method, responsible operator and the observation timestamp/source/reference fields that must be captured.

## Post-observation evidence
A bounded non-Production drill is not evidence until the resulting observation records the observer, timestamp, environment/target, backup and retention references, recovery/rollback outcome, deviations/abort notes and the refreshed evidence trace key.

An evidence refresh is not evidence until the resulting observation records the observer, timestamp, evidence source, artifact/location reference, observation outcome and refreshed evidence trace key.

## Closure-review states
- `blocked_source_unavailable` — an authorized retained recovery source is unavailable;
- `retain_hold_evidence_refresh_review_required` — stale/missing retained evidence needs an owner-reviewed refresh plan;
- `retain_hold_bounded_drill_plan_review_required` — stale/missing drill evidence needs an owner-reviewed bounded non-Production drill plan;
- `retain_hold_aging_evidence_review_required` — complete evidence is aging and requires explicit review;
- `retain_hold_closure_review_required` — current recovery evidence is closure-eligible but no matching owner review is recorded;
- `evidence_refresh_plan_ready_for_separate_execution` — an owner-reviewed refresh plan is ready for separately authorized execution;
- `bounded_nonproduction_drill_plan_ready_for_separate_execution` — an owner-reviewed bounded drill plan is ready for separately authorized execution;
- `review_complete_retain_hold` / `closure_review_complete_retain_hold` — explicit review elects to retain the HOLD; and
- `closure_review_ready_for_manual_hold_update` — current evidence and explicit matching owner review support a separate manual canonical-HOLD update.

No state performs a refresh, executes a drill or edits `STARTUP_GO_LIVE_BLOCKERS.md` automatically.

## Mutation boundary
No Production restore, rollback, drill execution, evidence-refresh execution, secret rotation, DNS mutation, destructive R2 action, provider recovery, schema/storage mutation, customer/business/accounting/inventory mutation, owner-review persistence, canonical-HOLD mutation, export generation, automatic outreach or permanent polling is authorized.

## Acceptance
The exact candidate must pass `scripts/recovery_drill_evidence_refresh_closure_review_check.py`, retained Build 437/447/457/467 recovery authorities, Current Source Gate, exact feature-preview acceptance, exact-SHA Development deployment/runtime acceptance, protected-main PR checks and independent exact resulting `main` Cloudflare Production deployment/runtime/business acceptance.

## Next bounded release
**Build 478 — Authenticated Device Observation Refresh & Regression Triage** begins only after this release is independently GREEN on protected `main`.
