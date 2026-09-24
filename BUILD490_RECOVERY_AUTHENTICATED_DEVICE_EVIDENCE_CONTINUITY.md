# Build 490 — Recovery & Authenticated Device Evidence Continuity

## Purpose
Refresh the current owner-observed recovery and authenticated-device evidence picture without manufacturing success, while keeping recovery and device evidence as separate evidence families.

Build 490 composes the retained Build 477 recovery refresh/closure review and Build 478 authenticated-device observation refresh/regression triage. It does not create a replacement recovery system, browser farm, screenshot service, evidence ledger or parallel readiness dashboard.

## Recovery continuity
The retained recovery classes remain backup artifact, retention/location and recovery/rollback drill observation. Current evidence must stay dated and attributable.

Missing or stale recovery evidence remains a refresh requirement. A stale or missing drill may produce only a bounded non-Production drill-review requirement. The plan still requires separate authorization and post-observation evidence before it can count as recovery evidence.

No Production restore, Production rollback or destructive recovery action is performed by Build 490.

## Authenticated-device continuity
Current authenticated observations remain role-specific and include representative device/browser context. Customer, Detailer, Operations and Admin coverage remains explicit, together with phone/tablet/desktop and observed browser classes.

A **current negative authenticated observation** takes precedence over retained historical acceptance. Historical passes cannot cancel or override current negative evidence.

If required current observations are incomplete, the state remains observation-refresh-required. Source responsive/accessibility checks remain supporting evidence only and cannot prove the absence of a real-device regression.

## Continuity states
The combined read-only authority may report:
- `bounded_continuity_review_ready` — current recovery evidence and complete current authenticated observations are both available, with no current negative device observation;
- `current_device_regression_triage_required` — current negative authenticated evidence exists and remains operator triage;
- `recovery_refresh_or_drill_review_required` — recovery evidence needs refresh or a bounded non-Production drill review;
- `device_observation_refresh_required` — required authenticated role/device observations are incomplete;
- `continuity_source_unavailable` — one or both authorized evidence sources are unavailable; or
- `continuity_review_incomplete` — evidence is available but does not satisfy a more specific state.

These states do not close either canonical HOLD automatically.

## Canonical HOLD boundary
`STARTUP_GO_LIVE_BLOCKERS.md` remains authoritative for:
- **Recovery / backup evidence**; and
- **Independent device / visual evidence**.

Build 490 never narrows or removes either row automatically.

## Mutation boundary
No Production restore, rollback, recovery drill execution, evidence-refresh execution, automated browser farm, screenshot capture, automated remediation, customer/booking mutation, role widening, provider/payment/refund/message action, accounting/inventory mutation, schema/storage migration, destructive storage action, customer outreach, canonical-HOLD mutation or permanent polling is authorized.

## Acceptance
The exact candidate must pass `scripts/recovery_authenticated_device_evidence_continuity_check.py`, its behavioral proof, retained Build 477/478 recovery/device authorities, Current Source Gate, exact feature-preview acceptance, exact-SHA Development deployment/runtime acceptance, protected-main PR checks and independent exact resulting-`main` Cloudflare Production deployment/runtime/business acceptance.

Source/runtime GREEN is not owner-observed recovery proof and is not real-device proof. Missing, stale, unavailable or current-negative evidence remains explicit.

## Next bounded release
**Build 491 — Maintenance & Fleet Pilot Outcome Evidence** begins only after Build 490 is independently GREEN on protected `main`.
