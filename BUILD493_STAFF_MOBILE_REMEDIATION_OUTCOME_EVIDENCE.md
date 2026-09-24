# Build 493 — Staff & Mobile Remediation Outcome Evidence

## Purpose
Require attributable remediation execution evidence plus materially like-for-like before/after observations before staff/mobile remediation outcomes are review-ready.

Build 493 reuses the protected `/admin-staff-workflow-support-learning.html` workbench, the retained GET-only `/api/admin/staff_support_mobile_efficiency_learning` endpoint and Builds 452/462/472/482. It does not create a parallel staff, support, telemetry or remediation system.

## Execution attribution
A remediation outcome row is attributable only when it maps to a retained remediation-priority row and records:
- authorization reference;
- remediation/change reference;
- execution timestamp;
- approved evidence-source reference;
- owning workflow scope;
- role scope;
- representative device/browser context; and
- observation protocol reference.

A source-green release, current repeated pattern or readiness template is not remediation execution evidence.

## Materially like-for-like before/after evidence
Outcome review additionally requires before and after observations with:
- the same measure definition;
- the same owning workflow scope;
- the same role scope;
- the same representative device/browser context;
- the same comparable window or sample definition;
- a before observation at or before execution and an after observation at or after execution; and
- explicitly recorded material confounders.

A material confounder prevents the pair from being treated as materially like-for-like. The retained current-pattern snapshot is not automatically a before measurement.

## Southern Ontario weather/site boundary
Weather/site restrictions remain separate operational evidence. Each outcome row must explicitly classify the operating context as `not_applicable`, `cold_snap_capable`, `temperature_limited_outdoor` or `controlled_environment_required`. Any non-`not_applicable` classification requires an evidence reference.

Weather/site restrictions never count as staff/mobile friction, and Build 493 invents no service temperature threshold.

## Review states
- `evidence_incomplete` — retained current source evidence is incomplete.
- `outcome_evidence_source_required` — current source evidence is available but no approved remediation outcome-evidence source is recorded.
- `remediation_execution_evidence_required` — an approved source exists but contains no evidence rows.
- `outcome_evidence_unattributable` — rows exist but do not satisfy the attributable execution contract.
- `materially_comparable_before_after_required` — execution is attributable but comparison/weather-site requirements are incomplete.
- `bounded_outcome_evidence_review_ready` — attributable execution and materially like-for-like observations are present within the bounded contract.

Review-ready evidence remains descriptive. Build 493 does not automatically claim effectiveness, causation, root cause, staff fault, device friction or business impact.

## Privacy and mutation boundary
Customer identity, staff identity, raw booking identifiers and raw support-exception identifiers remain excluded.

No automatic:
- remediation execution or closure;
- outcome-evidence creation or persistence;
- effectiveness or causation claim;
- role/permission change;
- job/task/support-exception action;
- customer/provider outreach;
- provider/payment/accounting/inventory mutation;
- schema/storage/HOLD mutation;
- weather/site booking-rule mutation;
- background clickstream/device telemetry; or
- permanent polling.

`STARTUP_GO_LIVE_BLOCKERS.md` remains the canonical HOLD inventory. Source/runtime GREEN never manufactures remediation execution, before/after, device/browser or weather/site evidence.

## Acceptance
The exact candidate must pass:
1. `scripts/staff_mobile_remediation_outcome_evidence_check.py`;
2. `scripts/staff_mobile_remediation_outcome_evidence_test.mjs`;
3. retained Build 482/472/462/452 staff/mobile authorities;
4. Current Source Gate and exact feature-preview deployment/runtime acceptance;
5. non-force promotion of the exact accepted candidate to `dev`;
6. independent exact-SHA Development deployment/runtime acceptance;
7. protected-main pull-request checks; and
8. independent exact resulting-`main` Production deployment/runtime/business acceptance.

Source promotion alone is never Production GREEN.

## Next bounded release
**Build 494 — Service Economics, Seasonal Operations & Reliability Review** begins only after Build 493 is independently GREEN on protected `main`.
