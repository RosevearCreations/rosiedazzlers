# Build 467 — Recovery Evidence Validation & Drill Decision Readiness

## Purpose
Revalidate retained backup-artifact, retention/location and bounded recovery-drill evidence with explicit freshness-aware operator decision states without performing a real Production restore merely to manufacture proof.

## Retained surface
Build 467 enriches the existing Launch Readiness recovery panel and retained read-only `/api/admin/recovery_artifact_drill_evidence_review` endpoint. It reuses:
- Build 437 `backup_recovery_evidence_closure`;
- Build 447 `recovery_artifact_drill_evidence_review`; and
- Build 457 `recovery_evidence_closure_drill_readiness`.

It does not create a second backup service, restore engine, recovery ledger or readiness dashboard.

## Validation and decision states
The three required evidence classes remain independent: current backup artifact observation, retention/location observation and bounded recovery/rollback drill observation.

Decision readiness is explicit:
- `operator_recovery_decision_ready` — all required evidence is source-available, dated and current, the retained closure candidate is satisfied and Build 457 is operator-review ready;
- `aging_evidence_review_required` — complete evidence includes aging evidence and requires explicit review;
- `revalidate_before_drill_decision` — stale evidence requires revalidation before HOLD narrowing and may make a bounded non-Production drill a review candidate;
- `retain_hold_missing_evidence` — required evidence is missing or undated; and
- `retain_hold_unavailable_source` — an authorized retained evidence source is unavailable.

The default without explicit operator action is always `retain_hold`.

## Drill decision boundary
Build 467 may classify a bounded non-Production drill as an operator review candidate when retained drill evidence is stale or missing. It does not execute that drill. A current retained drill can be classified `no_new_drill_required_for_validation`.

A real Production restore is never authorized by this package and must not be performed merely to manufacture readiness evidence.

## Canonical HOLD boundary
`STARTUP_GO_LIVE_BLOCKERS.md` remains the single canonical HOLD inventory. No runtime endpoint edits, narrows or removes the `Recovery / backup evidence` row. Any narrowing requires an explicit operator-reviewed update backed by dated attributable recovery evidence.

## Mutation boundary
No Production restore, rollback, drill execution, secret rotation, DNS mutation, destructive R2 operation, provider recovery, schema/storage mutation, customer/business/accounting/inventory mutation, export generation, canonical-HOLD mutation, automatic outreach or permanent polling is authorized.

## Acceptance
The exact candidate must pass `scripts/recovery_evidence_validation_drill_decision_readiness_check.py`, retained Build 437/447/457 recovery authorities, Current Source Gate, exact feature-preview acceptance, exact-SHA Development deployment/runtime acceptance, protected-main PR checks and independent exact resulting `main` Cloudflare Production deployment/runtime/business acceptance.

## Next bounded release
**Build 468 — Authenticated Device Regression Closure** begins only after this release is independently GREEN on protected `main`.
