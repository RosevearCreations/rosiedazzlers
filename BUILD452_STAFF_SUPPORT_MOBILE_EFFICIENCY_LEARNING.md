# Build 452 — Staff Workflow, Support & Mobile Efficiency Learning

## Purpose
Review current Detailer/Admin task friction, repeated support exceptions and mobile field-workflow evidence to identify bounded operator-efficiency review opportunities without widening role ceilings or auto-resolving exceptions.

## Implemented evidence workflow
The protected Administration surface `/admin-staff-workflow-support-learning.html` remains the single staff/support learning surface. Build 452 enriches the retained Build 442 view instead of creating a replacement.

Manual refresh composes three retained authorities:
- **Today Needs Attention** for the current bounded staff task queue;
- **Support Exceptions** for current read-only diagnostic/reconciliation exceptions; and
- the canonical **bounded Detailer workspace** (`scope=workspace`, row limit 80) for current field-workflow stage and detailer-response cohorts.

The new endpoint reduces all three sources to aggregate patterns before returning evidence. Customer names, customer email addresses, staff identity, booking identifiers and raw exception identifiers are not returned.

## Mobile efficiency learning rule
A current field-workflow stage becomes a review cohort only when at least two bounded workspace rows share the same canonical workflow stage. Two or more pending detailer-response rows may also become a bounded review cohort.

These cohorts identify places worth reviewing for repeated navigation, handoff or evidence-entry friction. A repeated stage **does not prove mobile friction**, delay, staff fault, missed notification or a shared root cause. A current snapshot does not establish frequency over time.

The source does not record clickstream telemetry, task duration or device-performance telemetry, so Build 452 cannot claim that an observed cohort is slow or inefficient. No new background telemetry is introduced merely to obtain that evidence.

## Evidence status
The result is:
- `observed` when all retained sources are available and the Detailer workspace row bound is not reached;
- `partial` when at least one source is unavailable or the bounded Detailer row limit may truncate the snapshot;
- `restricted` when no source is available and at least one required source is restricted; or
- `unavailable` when no authorized source can be established.

Missing or restricted provider/owner/observed evidence remains truthful. Source/runtime GREEN never fabricates operational evidence.

## Role and authority boundary
The page remains in the existing Business Administration module. The endpoint requires the existing `manage_bookings` capability and existing `it.runtime.view` action authority.

Canonical Detailer, Operations, Booking, Staff, I.T. and Support Exception APIs remain authoritative. Existing Detailer Start/Complete field-evidence gates remain authoritative. Build 452 creates no replacement job, booking, staff, support or workflow-state ledger.

## Mutation boundary
No automatic:
- role escalation or permission change;
- job start, pause, resume, completion or assignment response;
- staff task completion;
- support-exception resolution;
- customer/provider outreach;
- provider/payment transaction;
- accounting or inventory posting;
- schema or destructive storage mutation;
- background clickstream/device telemetry; or
- permanent polling.

Any consequential correction remains inside the existing owning workflow with its existing permission, evidence and confirmation rules.

## Acceptance
The exact candidate must pass:
1. `scripts/staff_support_mobile_efficiency_learning_check.py`;
2. `scripts/staff_support_mobile_efficiency_learning_test.mjs`;
3. retained Staff Workflow & Support Exception Learning, Detailer Mobile & Staff Workflow Refinement, Support Automation & Exception Handling, Detailer Mobile QoL and Mobile Detailer Field Workflow authorities;
4. Current Source Gate;
5. exact feature-preview deployment/runtime acceptance;
6. non-force exact promotion to `dev`;
7. independent exact Development deployment/runtime acceptance;
8. protected-main pull-request checks; and
9. independent exact resulting `main` Production deployment/runtime/business acceptance.

## Next bounded release
**Build 453 — Service Economics, Capacity & Pricing Review** begins only after this release is independently GREEN on protected `main`.
