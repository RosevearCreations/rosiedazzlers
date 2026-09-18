# Build 419 — Customer & Staff Production Workflow Evidence

Build 419 adds a read-only, fail-closed evidence layer for the real Production workflows used by Customer, Detailer, Operations and Admin. It classifies existing verified observations and retained aggregate handoff evidence; it does not create test customers, jobs, staff access or business outcomes merely to satisfy readiness.

## Evidence contract

- Customer workflow evidence reuses the existing `booking_e2e` launch-evidence item.
- Detailer workflow evidence reuses `mobile` and also requires at least one eligible real job in the bounded aggregate job-handoff window.
- Operations workflow evidence reuses `operations`.
- Admin workflow evidence reuses `accessibility`.
- A role is observed only when its row is verified, dated, has a role-specific note and explicitly records a real device or representative viewport/width.
- Evidence-note contents are never returned by the Build 419 payload.
- Customer names, booking identifiers, addresses, message contents, staff credentials and provider secrets are not returned.
- Source checks do not manufacture real-device proof, cross-role access, consent, participant authorization or successful business outcomes.
- Missing evidence remains `owner_action` or `unavailable`; Source/Production GREEN may coexist with a workflow-evidence HOLD.

## Operator surface

`/admin-launch-readiness.html` adds a Customer & staff Production workflow evidence panel. It reports the four role states, aggregate job counts, viewport/device-language presence and remaining observation HOLDs without exposing the underlying evidence notes.

The screen remains manual-refresh and read-only. Role ceilings and capability checks remain governed by the existing staff access authorities.

## Mutation boundary

Build 419 introduces no schema migration and performs no booking creation, customer mutation, staff-role/capability change, consent change, provider contact, notification send, accounting/inventory posting, R2 mutation, DNS/secret change or permanent polling.

Recording a real observation remains an explicit authenticated operator action through the existing launch-evidence workflow; source acceptance itself does not perform that action.

## Release acceptance

The candidate must pass:
1. executable Build 419 workflow-evidence tests;
2. retained workflow-efficiency/accessibility and staff-access authorities;
3. retained controlled soft-launch, provider-evidence and recovery/export authorities;
4. the focused Build 419 workflow;
5. Current Source Gate and exact feature-preview acceptance;
6. exact-SHA Development deployment/runtime acceptance after non-force `dev` fast-forward;
7. protected-main pull-request requirements;
8. exact resulting Production SHA deployment/runtime/business acceptance.

Build 420 — Search Console, GBP & Local Acquisition Evidence Closure is next only after Build 419 is independently GREEN on protected `main`.
