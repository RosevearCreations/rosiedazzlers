# Build 472 — Staff & Mobile Remediation Verification

## Purpose
Verify whether retained Build 462 staff/mobile/support remediation priorities have current attributable outcome evidence without converting priority, timing or a current pattern into proof of root cause, staff fault, device friction or business impact.

Build 472 reuses the existing protected Administration surface `/admin-staff-workflow-support-learning.html`, the retained GET-only `/api/admin/staff_support_mobile_efficiency_learning` endpoint, and the cumulative Build 452/462 evidence model. It does not create a parallel staff, mobile, support, telemetry or remediation system.

## Verification model
Each retained remediation-priority row receives a bounded verification record.

The record distinguishes:
- current attributable pattern evidence from the retained bounded source;
- recorded remediation-execution evidence;
- comparable like-for-like before/after evidence; and
- a verified remediation outcome.

Current pattern evidence alone may be present while remediation outcome remains unverified.

## Fail-closed outcome rule
Build 472 does not infer that a remediation happened or worked.

When the current retained sources are complete, a priority may be classified as `current_pattern_observed_no_outcome_attribution`. This means the current bounded pattern is still observable, but there is no recorded remediation execution and no comparable before/after evidence in this source.

When required current sources are partial, restricted or unavailable, verification remains `evidence_incomplete`.

A missing current priority pattern does not prove a remediation succeeded, and a present pattern does not prove a remediation failed.

## Attribution boundary
Build 472 does not claim:
- a shared root cause;
- staff fault or staff performance;
- device or browser friction;
- duration, latency or delay;
- missed notifications;
- business impact;
- causation; or
- remediation effectiveness.

Any future outcome claim requires attributable evidence of the separately authorized remediation plus comparable evidence collected under materially like-for-like conditions.

## Role, privacy and mutation boundary
Existing Admin, Senior Detailer and Detailer role ceilings remain authoritative. Customer identity, staff identity, raw booking identifiers and raw exception identifiers remain excluded from this aggregate response.

No automatic:
- remediation execution or closure;
- support-exception resolution;
- role or permission change;
- job, assignment or staff-task action;
- customer/provider outreach;
- provider/payment transaction;
- accounting or inventory posting;
- schema/storage mutation;
- background clickstream/device telemetry; or
- permanent polling.

## Canonical HOLD boundary
`STARTUP_GO_LIVE_BLOCKERS.md` remains the canonical HOLD inventory. Source/runtime GREEN does not manufacture remediation execution evidence, real-device evidence, provider evidence or business impact.

## Acceptance
The exact candidate must pass:
1. `scripts/staff_mobile_remediation_verification_check.py`;
2. `scripts/staff_mobile_remediation_verification_test.mjs`;
3. retained Build 462 Staff & Mobile Friction Remediation Priorities;
4. retained Build 452 Staff Workflow, Support & Mobile Efficiency Learning;
5. retained Staff Workflow & Support Exception Learning, Detailer Mobile & Staff Workflow Refinement, Support Automation & Exception Handling, Detailer Mobile QoL and Mobile Detailer Field Workflow authorities;
6. Current Source Gate and exact feature-preview deployment/runtime acceptance;
7. non-force promotion of the exact accepted candidate to `dev`;
8. independent exact-SHA Development deployment/runtime acceptance;
9. protected-main pull-request checks; and
10. independent exact resulting-`main` Production deployment/runtime/business acceptance.

Source promotion alone is never Production GREEN.

## Next bounded release
**Build 473 — Service Economics Allocation & Margin Review Readiness** begins only after Build 472 is independently GREEN on protected `main`.
