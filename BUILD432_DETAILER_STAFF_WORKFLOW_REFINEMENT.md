# Build 432 — Detailer Mobile & Staff Workflow Refinement

## Purpose

Use observed staff workflow evidence to remove high-frequency friction across Detailer, Operations and Administration while preserving role ceilings, recovery behaviour and mobile reliability.

## Implemented refinement

This release is schema-neutral and introduces no new API. The implementation is a DOM-only convenience layer in `assets/build432-staff-workflow-refinement.js`. All remembered convenience state is session-only and limited to the current browser tab.

### Detailer Mobile

- A manual shortcut surfaces the next currently enabled canonical existing action.
- The shortcut never invents eligibility; it delegates to the already-authorized `data-job-action` control.
- Decline is never auto-suggested.
- The last viewed assigned booking ID may be remembered in `sessionStorage` only for the current browser tab.
- Resume requires a manual click and only works when that booking is still present in the currently authorized assigned-job DOM.
- Browser online/offline state is presented as a connection hint only. Nothing is queued or replayed automatically.

### Operations

- The last opened workstream key may be remembered in `sessionStorage` only for the current browser tab.
- Resume requires a manual click and delegates to the existing `data-operations-module` control.
- No booking, customer, pricing or other business payload is persisted by this helper.

### Admin Today

- Urgency, ownership and timing filters may be remembered in `sessionStorage` only for the current browser tab.
- Reset clears only those tab-local filter values.
- Filtering remains an in-memory view of the already loaded report and does not change server preferences or task state.

## Evidence model

Build 432 retains existing aggregate or bounded evidence for repeated navigation paths, common staff tasks, field-job handoff/completion, error/recovery states, mobile/responsive acceptance, role-specific access failures and avoidable task switching.

## Security and role boundary

Admin, Senior Detailer and Detailer role ceilings remain authoritative. Convenience must never widen permissions or expose protected customer/business data. Existing Detailer field evidence gates remain authoritative for Start and Complete.

## Mutation boundary

The convenience layer performs no direct network request and contains no automatic business mutation. There is no role escalation, no automatic job completion, no silent inventory/accounting posting, no customer communication dispatch, no provider transaction, no schema migration, no destructive storage action and no permanent polling.

All consequential actions still require an explicit user gesture and flow through the canonical existing action or workstream control.

## Acceptance

The exact candidate must pass:

- `scripts/detailer_staff_workflow_refinement_check.py`;
- the retained mobile Detailer field workflow authority;
- retained Detailer Mobile QoL authority;
- retained field → office handoff authority;
- retained workflow efficiency/accessibility authority;
- Current Source Gate and exact feature-preview acceptance;
- exact Development deployment/runtime acceptance;
- protected-main pull-request checks;
- exact Production deployment/runtime/business acceptance on the resulting `main` SHA.

Source promotion alone is never Production GREEN.
