# Build 432 — Detailer Mobile & Staff Workflow Refinement

## Purpose

Use observed staff workflow evidence to remove high-frequency friction across Detailer, Operations and Administration while preserving role ceilings, recovery behaviour and mobile reliability.

## Evidence model

Build 432 may review existing aggregate or bounded evidence for:

- repeated navigation paths and common operator tasks;
- field-job handoff and completion evidence;
- error/recovery states;
- mobile/responsive acceptance;
- role-specific access failures or unavailable actions;
- duplicated entry or avoidable task switching.

## Refinement rules

Changes should favour:

- fewer steps for frequent legitimate tasks;
- clearer status and recovery guidance;
- mobile-first field usability;
- preserved role boundaries;
- explicit confirmation for consequential actions;
- no background polling when manual/event-driven refresh is sufficient.

## Security and role boundary

Admin, Senior Detailer and Detailer ceilings remain authoritative. Convenience must never widen permissions or expose protected customer/business data.

## Mutation boundary

No role escalation, no automatic job completion, no silent inventory/accounting posting, no customer communication dispatch, no provider transaction, no schema migration unless separately approved, no destructive storage action and no permanent polling.

## Acceptance

The exact candidate must pass focused staff-workflow authority, retained accessibility/responsive/field-workflow/access-matrix authorities, Current Source Gate, exact Development acceptance, protected-main PR checks and exact Production deployment/runtime/business acceptance.
