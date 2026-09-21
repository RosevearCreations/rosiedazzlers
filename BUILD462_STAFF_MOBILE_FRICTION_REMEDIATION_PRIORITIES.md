# Build 462 — Staff & Mobile Friction Remediation Priorities

## Purpose
Turn repeated role-bounded staff, support and Detailer mobile evidence into a prioritized operator-review queue without converting a bounded snapshot into blame, root-cause, delay, performance or business-impact conclusions.

## Implemented evidence workflow
Build 462 enriches the existing protected Administration surface `/admin-staff-workflow-support-learning.html` and retained `/api/admin/staff_support_mobile_efficiency_learning` endpoint. It does not create a parallel staff, mobile, support, analytics or exception system.

The retained Build 452 evidence remains authoritative:
- Today Needs Attention supplies bounded staff task patterns.
- Support Exceptions supplies read-only diagnostic/reconciliation exception patterns.
- The bounded Detailer workspace supplies workflow-stage and response-state cohorts.

Build 462 adds `remediation_priorities` to the retained aggregate response. Candidates are ordered from the retained urgency/severity plus repeated bounded occurrence count. That order is a manual review sequence only.

## Priority and uncertainty rule
Every priority record carries:
- review priority and bounded occurrence count;
- evidence state and explicit priority basis;
- a remediation candidate phrased as a review opportunity;
- a manual verification plan using the existing owning workflow and allowed role;
- explicit uncertainty; and
- hard false boundaries for root-cause proof, staff-fault inference, business-impact proof, role change, automatic exception resolution and automatic remediation.

Priority does **not** prove impact, urgency outside the retained evidence, workflow friction, root cause, staff performance, staff fault, missed notification, delay, device slowness or that one correction will resolve every repeated item.

When retained evidence is partial, restricted, unavailable or row-bounded, the remediation record remains correspondingly uncertain rather than upgrading the evidence by inference.

## Role and authority boundary
Existing Admin, Senior Detailer and Detailer role ceilings remain authoritative. Canonical Detailer, Operations, Booking, Staff, I.T. and Support Exception APIs remain authoritative.

Build 462 never widens access, changes assignment authority, bypasses Detailer Start/Complete evidence gates, or changes the owning workflow for a consequential action.

## Mutation boundary
No automatic:
- role or permission change;
- job start, pause, resume, completion or assignment response;
- staff-task completion;
- support-exception resolution;
- remediation execution;
- customer/provider outreach;
- provider/payment transaction;
- accounting or inventory posting;
- schema/destructive-storage mutation;
- background clickstream/device telemetry; or
- permanent polling.

Any actual remediation remains a separately authorized source/product change after an operator verifies the candidate in the owning workflow.

## HOLD boundary
This release does not close any provider, recovery, real-device, owner-approval or unavailable-evidence HOLD in `STARTUP_GO_LIVE_BLOCKERS.md`. Source/runtime GREEN does not manufacture staff/device observation or provider evidence.

## Acceptance
The exact candidate must pass:
1. `scripts/staff_mobile_friction_remediation_priorities_check.py`;
2. `scripts/staff_mobile_friction_remediation_priorities_test.mjs`;
3. retained Build 452 Staff Workflow, Support & Mobile Efficiency Learning;
4. retained Build 442 Staff Workflow & Support Exception Learning;
5. retained Detailer Mobile & Staff Workflow Refinement, Support Automation & Exception Handling, Detailer Mobile QoL and Mobile Detailer Field Workflow authorities;
6. Current Source Gate and exact feature-preview deployment/runtime acceptance;
7. non-force promotion of the exact accepted candidate to `dev`;
8. independent exact-SHA Development deployment/runtime acceptance;
9. protected-main pull-request checks; and
10. independent exact resulting `main` Production deployment/runtime/business acceptance.

Source promotion alone is never Production GREEN.

## Next bounded release
**Build 463 — Service Economics Completeness & Add-On Cost Readiness** begins only after Build 462 is independently GREEN on protected `main`.
