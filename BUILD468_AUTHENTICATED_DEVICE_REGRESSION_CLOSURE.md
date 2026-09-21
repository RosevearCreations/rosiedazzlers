# Build 468 — Authenticated Device Regression Closure

## Purpose
Refresh current authenticated Customer, Detailer, Operations and Admin device/browser observations and explicitly separate current regression evidence from retained or stale historical acceptance.

Build 468 enriches the retained Build 438/448/458 authenticated-device authority and the existing Launch Readiness surface. It does not create a replacement endpoint, screenshot service, browser farm, device ledger or parallel dashboard.

## Retained surface
The existing authenticated read-only endpoint remains:

`/api/admin/authenticated_device_visual_acceptance`

Retained authorities remain:
- `BUILD438_AUTHENTICATED_DEVICE_VISUAL_ACCEPTANCE.md`;
- `BUILD448_AUTHENTICATED_CROSS_DEVICE_ACCEPTANCE_REFRESH.md`;
- `BUILD458_AUTHENTICATED_DEVICE_ACCEPTANCE_CLOSURE.md`;
- `BUILD419_CUSTOMER_STAFF_PRODUCTION_WORKFLOW_EVIDENCE.md`; and
- `STARTUP_GO_LIVE_BLOCKERS.md` as the single canonical HOLD inventory.

## Current regression rule
A current regression observation must still be a dated, authenticated, role-specific observation with:
- a recognized Customer, Detailer, Operations or Admin workflow;
- authenticated/signed-in session evidence;
- a device class;
- browser evidence;
- a safe internal route;
- viewport/width evidence; and
- an explicit unsuccessful outcome such as failed, broken, blocked, unusable or error.

The retained 30-day freshness window continues to apply.

A current negative observation is classified as regression evidence even when retained historical workflow acceptance exists. Historical acceptance never overrides a newer current regression.

## Historical acceptance rule
Retained workflow verification and stale successful device/browser observations remain historical context only. They cannot satisfy Build 468 current-regression closure.

Build 468 exposes, separately:
- current passing role observations;
- current regression role observations;
- historical-only / refresh-required roles;
- current observed device classes;
- current regression device classes;
- current observed browser classes; and
- current regression browser classes.

Responsive/accessibility source checks remain supporting evidence only and do not prove absence of a real-device regression.

## Regression closure states
The retained classifier adds an `authenticated_device_regression_closure` package with bounded states:
- `no_current_regression_observed` — all required roles and representative phone/tablet/desktop observations are current and no current regression observation is recorded;
- `current_regression_observed` — complete current coverage exists and one or more current regression observations are recorded;
- `current_regression_observed_refresh_incomplete` — a current regression is recorded but some required current role/device coverage is still missing or stale;
- `refresh_required` — no current regression is recorded, but current role/device coverage is incomplete;
- `unavailable` — an authorized evidence source is unavailable.

Every state requires operator review. None automatically edits or closes the canonical HOLD.

## Safe output boundary
Only safe classifications, bounded timestamps/ages, device/browser classes, sanitized internal routes, bounded viewport widths and role/device/browser identifiers may be returned.

Evidence-note contents, customer identity, booking identifiers, addresses, credentials, cookies, tokens, provider secrets and protected page contents remain excluded.

## Mutation boundary
Build 468 performs no screenshot capture or polling, customer/booking mutation, staff role/capability widening, provider/payment/refund/message transaction, accounting/inventory posting, schema/storage migration, destructive storage action, automatic outreach or permanent polling.

## Acceptance
The exact candidate must pass focused Authenticated Device Regression Closure authority, retained Build 458/448/438/419 authorities, responsive/accessibility supporting authorities, Current Source Gate, exact feature-preview acceptance, exact Development deployment/runtime acceptance, protected-main PR checks and independent exact resulting-`main` Production deployment/runtime/business acceptance.

A source/runtime GREEN result is not real-device proof. Missing, stale, historical-only or current regression evidence remains explicit for operator review.

## Next bounded release
**Build 469 — Maintenance & Fleet Controlled Pilot Activation Readiness** begins only after Build 468 is independently GREEN on protected `main`.
