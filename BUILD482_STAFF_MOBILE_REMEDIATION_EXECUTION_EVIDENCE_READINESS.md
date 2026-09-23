# Build 482 — Staff & Mobile Remediation Execution Evidence Readiness

## Purpose
Define the minimum attributable evidence required after a separately authorized staff/mobile remediation execution and before any materially comparable before/after outcome claim.

Build 482 reuses the existing protected /admin-staff-workflow-support-learning.html workbench, the retained GET-only /api/admin/staff_support_mobile_efficiency_learning endpoint and Builds 452/462/472. It does not create a parallel staff, support, telemetry or remediation system.

## Current-pattern boundary
Current repeated task, support-exception, workflow-stage or response-state patterns remain bounded review evidence only.

A current pattern does not prove:
- root cause;
- staff fault or staff performance;
- device or browser friction;
- missed notification, duration or delay;
- business impact;
- that a remediation occurred; or
- that a remediation worked.

## Minimum attributable remediation-execution record
A later remediation outcome may be reviewed only after a separately authorized execution is evidenced with, at minimum:
- authorization reference;
- remediation/change reference;
- execution timestamp;
- attributable evidence-source reference;
- owning workflow scope;
- role scope;
- representative device/browser context; and
- observation protocol/reference.

Build 482 exposes these requirements as readiness fields only. It does not manufacture, persist or backfill an execution record.

## Materially comparable before/after evidence
An effectiveness claim additionally requires before and after observations that are materially like-for-like.

The comparison must record:
- the same measure definition;
- the same owning workflow scope;
- the same role scope;
- representative device/browser context;
- a comparable time-window or sample definition; and
- material confounders that could break comparability.

The current Build 472 pattern snapshot is not automatically treated as a valid before measurement.

## Southern Ontario weather/site classification
Weather and site constraints are a separate operational classification and must not be converted into staff or mobile friction.

The readiness model permits only an unrecorded classification until explicit evidence exists. Future classifications may distinguish:
- not applicable;
- cold-snap capable;
- temperature-limited outdoor; or
- controlled-environment required.

Any such classification requires explicit service, product, equipment or site evidence. Build 482 invents no minimum or maximum service temperature and makes no broad winter-capability claim.

## Role, privacy and mutation boundary
Existing Admin, Senior Detailer and Detailer role ceilings remain authoritative. Aggregate/privacy boundaries remain unchanged; customer identity, staff identity, raw booking IDs and raw support-exception IDs remain excluded from this response.

No automatic:
- remediation execution or closure;
- execution-record creation or persistence;
- before/after outcome conclusion;
- role or permission change;
- job/task/support-exception action;
- customer/provider outreach;
- provider/payment/accounting/inventory mutation;
- schema/storage mutation;
- weather/site business-rule mutation;
- background clickstream/device telemetry; or
- permanent polling.

STARTUP_GO_LIVE_BLOCKERS.md remains the canonical HOLD inventory. Source/runtime GREEN never manufactures execution evidence, real-device evidence, weather-operability evidence or business impact.

## Acceptance
The exact candidate must pass:
1. scripts/staff_mobile_remediation_execution_evidence_readiness_check.py;
2. scripts/staff_mobile_remediation_execution_evidence_readiness_test.mjs;
3. retained Build 472 Staff & Mobile Remediation Verification authority;
4. retained Build 462 and Build 452 staff/mobile authorities;
5. Current Source Gate and exact feature-preview deployment/runtime acceptance;
6. non-force promotion of the exact accepted candidate to dev;
7. independent exact-SHA Development deployment/runtime acceptance;
8. protected-main pull-request checks; and
9. independent exact resulting-main Production deployment/runtime/business acceptance.

Source promotion alone is never Production GREEN.

## Next bounded release
**Build 483 — Service & Add-On Allocation Evidence Closure** begins only after Build 482 is independently GREEN on protected main.
