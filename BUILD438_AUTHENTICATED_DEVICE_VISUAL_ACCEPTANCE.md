# Build 438 — Authenticated Device & Visual Acceptance

## Purpose
Capture bounded, representative authenticated phone, tablet and desktop observations for Customer and staff workflows without copying protected content into source artifacts.

## Owning evidence
Build 419 Customer & Staff Production Workflow Evidence remains the role/workflow authority.

Build 438 adds a stricter read-only visual-acceptance classifier over the same retained launch observations:

- Customer uses `booking_e2e`.
- Detailer uses `mobile` and retains the Build 419 real-job requirement.
- Operations uses `operations`.
- Admin uses `accessibility`.

Each accepted role observation must already be verified and dated and must record:

- authenticated/signed-in session evidence;
- an explicit phone/tablet/desktop device class;
- browser evidence;
- a safe internal route reference;
- viewport/width evidence; and
- a successful/usable visual outcome.

The combined accepted role observations must include representative **phone, tablet and desktop** coverage before the runtime report can become a `closure_candidate`.

## Safe output boundary
The endpoint `/api/admin/authenticated_device_visual_acceptance` returns only safe classifications, timestamps, age, device/browser classes, sanitized internal route paths, bounded viewport widths and boolean evidence flags.

It does not return launch-evidence note contents, customer names, booking identifiers, addresses, message contents, staff credentials, cookies, tokens or provider secrets.

Only internal route paths beginning with `/app`, `/admin`, `/book`, `/account` or `/detailer` may be surfaced, with query strings/fragments excluded.

## Canonical HOLD boundary
`STARTUP_GO_LIVE_BLOCKERS.md` remains the single canonical HOLD inventory.

A runtime `closure_candidate` never closes the Independent device / visual evidence row automatically. It means all four retained role observations are complete under the stricter Build 438 evidence rules and representative phone/tablet/desktop coverage is present. An explicit operator-reviewed HOLD update is still required.

Missing evidence remains `owner_action`; unavailable authorized sources remain `unavailable`.

## Source-check boundary
Responsive, accessibility and source-layout checks remain important supporting authorities, but they are not real authenticated-device observation. Source/Production GREEN may coexist with a device/visual HOLD.

## Mutation boundary
Build 438 performs no:

- customer or booking mutation;
- staff role/capability change;
- consent change;
- provider/payment/refund/message transaction;
- accounting/inventory posting;
- destructive storage action;
- screenshot capture;
- automated screenshot polling;
- schema migration;
- automatic outreach; or
- permanent polling.

## Operator surface
The existing Launch Readiness Customer & staff Production workflow panel adds:

- authenticated visual acceptance state;
- dated role count;
- representative device-class count;
- per-role safe authentication/browser/route/viewport/outcome flags;
- safe device/browser/internal-route summaries;
- phone/tablet/desktop coverage; and
- the canonical HOLD decision.

Manual refresh remains the only refresh action.

## Acceptance
The exact candidate must pass focused Authenticated Device & Visual Acceptance authority, retained Build 419 workflow evidence, workflow/accessibility and responsive authorities, Current Source Gate, exact feature-preview acceptance, exact Development deployment/runtime acceptance, protected-main PR checks and independent exact resulting `main` Production deployment/runtime/business acceptance.

Missing provider/owner/observed evidence remains a truthful HOLD or unavailable state.

## Next bounded release
**Build 439 — Maintenance & Fleet Owner Approval Convergence** begins only after this release is independently GREEN on protected `main`.
