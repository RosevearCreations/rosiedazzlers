# Build 503 — Staff & Mobile Remediation Outcome Interpretation & Follow-Up

## Purpose
Interpret only attributable Build 493 staff/mobile remediation outcome evidence and prepare bounded follow-up without converting descriptive before/after movement into an effectiveness, causation, staff-fault or device-fault claim.

Build 503 reuses the protected `/admin-staff-workflow-support-learning.html` workbench, the retained GET-only `/api/admin/staff_support_mobile_efficiency_learning` endpoint and Builds 452/462/472/482/493. It does not create a second staff, support, device-telemetry, remediation or outcome store.

## Interpretation prerequisites
Interpretation remains fail-closed unless Build 493 already marks the row `bounded_outcome_evidence_review_ready` and preserves:
- attributable separately authorized remediation execution;
- the same measure definition;
- the same owning workflow scope;
- the same role scope;
- the same representative device/browser context;
- the same comparable window or sample definition;
- correct before/execution/after temporal ordering;
- explicit material-confounder recording; and
- explicit Southern Ontario weather/site classification.

A Build 503 row never bypasses Build 493 comparability rules.

## Descriptive interpretation only
For an eligible row Build 503 may surface the observed before value, after value, numeric delta, arithmetic percent change when the before value is non-zero, and the already-recorded observed direction.

Those values remain descriptive. Build 503 does not infer whether the movement is favorable, unfavorable, caused by the remediation, attributable to staff, attributable to a device/browser, or material to the business.

Every interpreted row therefore retains:
- `remediation_effective: null`;
- `causation: null`;
- `staff_fault: null`;
- `device_fault: null`; and
- `business_impact: null`.

## Follow-up boundary
Every descriptive interpretation remains `descriptive_follow_up_required`.

The follow-up requirement is to repeat a bounded materially like-for-like observation while preserving the same measure, workflow, role, representative device/browser context and comparable window/sample definition. Material confounders must again be recorded explicitly.

Build 503 prepares that review requirement only. It does not schedule staff, change roles or permissions, execute a remediation, close an exception, send outreach, or create telemetry.

## Southern Ontario weather/site boundary
Weather/site restrictions remain a separate operational evidence class. The source classification is preserved in follow-up context and never becomes staff/mobile friction. Build 503 invents no service temperature threshold and makes no broad winter-capability claim.

## Review states
- `outcome_evidence_not_review_ready` — retained Build 493 outcome evidence is not review-ready.
- `comparable_outcome_rows_required` — the source summary is review-ready but no row satisfies the retained row-level comparability contract.
- `bounded_descriptive_interpretation_follow_up_ready` — one or more materially comparable attributable rows may be summarized descriptively and prepared for bounded manual follow-up.

No state is an effectiveness verdict or remediation-closure authority.

## Privacy and mutation boundary
Customer identity, staff identity, raw booking identifiers and raw support-exception identifiers remain excluded.

No automatic:
- effectiveness, causation, staff-fault, device-fault or business-impact claim;
- remediation execution or closure;
- follow-up scheduling or persistence;
- role/permission change;
- job/task/support-exception action;
- customer/provider outreach;
- provider/payment/accounting/inventory mutation;
- schema/storage/HOLD mutation;
- weather/site booking-rule mutation;
- background clickstream/device telemetry; or
- permanent polling.

`STARTUP_GO_LIVE_BLOCKERS.md` remains the canonical HOLD inventory. Source/runtime GREEN never manufactures remediation execution, comparable observations, effectiveness or causation.

## Acceptance
The exact candidate must pass:
1. `scripts/staff_mobile_remediation_outcome_interpretation_follow_up_check.py`;
2. `scripts/staff_mobile_remediation_outcome_interpretation_follow_up_test.mjs`;
3. retained Build 493/482/472/462/452 staff/mobile authorities;
4. Current Source Gate and exact feature-preview deployment/runtime acceptance;
5. non-force promotion of the exact accepted candidate to `dev`;
6. independent exact-SHA Development deployment/runtime acceptance;
7. protected-main pull-request checks; and
8. independent exact resulting-`main` Production deployment/runtime/business acceptance.

Source promotion alone is never Production GREEN.

## Next bounded release
**Build 504 — Service Economics, Seasonal Capacity & Reliability Trend Continuity** begins only after Build 503 is independently GREEN on protected `main`.
