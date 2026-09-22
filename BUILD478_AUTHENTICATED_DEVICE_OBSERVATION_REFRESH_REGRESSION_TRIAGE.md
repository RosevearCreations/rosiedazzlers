# Build 478 — Authenticated Device Observation Refresh & Regression Triage

## Purpose
Refresh direct authenticated Customer, Detailer, Operations and Admin role/device/browser observations, keep newly observed negative evidence distinct from retained historical acceptance, and prepare bounded remediation triage only where current negative evidence exists.

Build 478 extends the retained Build 438/448/458/468 authenticated-device authority and the existing Launch Readiness surface. It does not create a replacement endpoint, screenshot service, browser farm, device ledger or parallel dashboard.

## Retained surface
The existing authenticated read-only endpoint remains:

`/api/admin/authenticated_device_visual_acceptance`

Retained authorities remain:
- `BUILD438_AUTHENTICATED_DEVICE_VISUAL_ACCEPTANCE.md`;
- `BUILD448_AUTHENTICATED_CROSS_DEVICE_ACCEPTANCE_REFRESH.md`;
- `BUILD458_AUTHENTICATED_DEVICE_ACCEPTANCE_CLOSURE.md`;
- `BUILD468_AUTHENTICATED_DEVICE_REGRESSION_CLOSURE.md`;
- `BUILD419_CUSTOMER_STAFF_PRODUCTION_WORKFLOW_EVIDENCE.md`; and
- `STARTUP_GO_LIVE_BLOCKERS.md` as the single canonical HOLD inventory.

## Observation refresh rule
The retained 30-day freshness window continues to apply. A current observation must remain dated, authenticated, role-specific and include device class, browser, safe internal route, viewport/width evidence and an explicit outcome.

Current role/device coverage is reported separately from stale, missing or unavailable observations. Source responsive/accessibility checks remain supporting evidence only and cannot prove the absence of a real-device regression.

## Newly observed regression rule
For this release, a newly observed regression means a **current dated authenticated negative observation evaluated in the current evidence window**. It does not claim first occurrence in Production.

Current negative observations remain distinct from:
- retained workflow verification;
- historical successful acceptance;
- stale negative observations; and
- missing or unavailable observation coverage.

Historical acceptance cannot override a current negative observation.

## Bounded regression triage
When current negative evidence exists, the retained classifier prepares a read-only triage item containing only:
- role identifier;
- observation timestamp and bounded age;
- safe device/browser classes;
- sanitized internal route;
- bounded viewport widths;
- a `triage_required` state;
- a false remediation-execution authorization flag; and
- an explicit re-observation requirement.

A triage item does not prove root cause, staff fault, business impact or remediation effectiveness. It authorizes no code change, customer action, role widening, provider action or Production mutation.

When no current negative observation exists, Build 478 does not manufacture remediation work. If required current role/device observations are incomplete, the state remains `observation_refresh_required`.

## Safe output boundary
Evidence-note contents, customer identity, booking identifiers, addresses, credentials, cookies, tokens, provider secrets and protected page contents remain excluded.

## Canonical HOLD boundary
`STARTUP_GO_LIVE_BLOCKERS.md` remains the single canonical HOLD inventory. Build 478 never closes or narrows the **Independent device / visual evidence** HOLD automatically.

## Mutation boundary
Build 478 performs no screenshot capture/polling, automated browser-farm execution, customer/booking mutation, staff role/capability widening, provider/payment/refund/message transaction, accounting/inventory posting, schema/storage migration, destructive storage action, automatic remediation, automatic outreach or permanent polling.

## Acceptance
The exact candidate must pass focused Authenticated Device Observation Refresh & Regression Triage authority, retained Build 468/458/448/438/419 authorities, responsive/accessibility supporting authorities, Current Source Gate, exact feature-preview acceptance, exact Development deployment/runtime acceptance, protected-main PR checks and independent exact resulting-`main` Production deployment/runtime/business acceptance.

A source/runtime GREEN result is not real-device proof. Missing, stale, historical-only, unavailable or current negative evidence remains explicit for operator review. The living release queue remains current-state focused; retained historical authority is referenced by durable contract filenames and roadmap evidence.

## Next bounded release
**Build 479 — Maintenance & Fleet Owner Approval & Pilot Decision** begins only after Build 478 is independently GREEN on protected `main`.
