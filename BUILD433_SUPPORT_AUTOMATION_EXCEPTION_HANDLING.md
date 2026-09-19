# Build 433 — Support Automation & Exception Handling

## Purpose

Build 433 turns retained diagnostic and reconciliation evidence into a prioritized staff-only support exception queue so recurring failures are easier to identify and route without silently mutating provider or business state.

## Implemented workflow

The protected I.T. surface `/admin-support-exceptions.html` is manual-refresh only. It calls the bounded GET-only `/api/admin/support_exceptions` aggregator and presents each current exception with:

- source authority;
- severity;
- evidence family and state;
- evidence freshness;
- dependency classification;
- bounded safe next action; and
- a link to the existing owning admin surface.

The aggregator reuses retained Build 412 Production support diagnostics and the retained read-only payment reconciliation authority. It does not create a third runtime, payment or business-state ledger.

## Exception classes

The unified queue preserves these fail-closed meanings:

- `critical` — current evidence shows a serious runtime/reconciliation discrepancy that requires review;
- `warning` — degraded, unavailable or incomplete evidence needs investigation;
- `hold` — definitive evidence depends on an external provider;
- `action` — an explicit owner/operator review is required;
- `info` — bounded context only.

Dependency is separately identified as `provider_dependent`, `owner_action` or `internal_support`.

The canonical Production HOLD backlog remains `STARTUP_GO_LIVE_BLOCKERS.md`. Build 433 does not copy that backlog into a competing runtime list.

## Evidence and privacy boundary

The queue may read current retained support diagnostics and up to five current payment-reconciliation records per manual refresh. Provider lookup performed by the retained reconciliation authority is GET/read-only and remains subject to its existing environment controls.

The Build 433 aggregator deliberately excludes customer names, customer email addresses, message contents, provider credentials and raw payment-record identifiers from its response. Operators follow the linked owning surface when deeper authorized evidence is needed.

Media, inventory, booking and incident surfaces are exposed only as evidence destinations. Build 433 does not claim a live exception from those domains without an authorized source.

## Automation boundary

Automation may:

- classify;
- summarize;
- prioritize;
- link to the correct admin surface;
- recommend a bounded operator action;
- verify retained read-only evidence;
- fail closed.

Automation must not:

- issue refunds or payments;
- create or change bookings;
- alter customer/profile/consent state;
- post accounting or inventory entries;
- modify provider configuration;
- rotate secrets;
- restore Production;
- delete R2 objects;
- bypass release protection;
- send automatic customer/provider outreach; or
- start a permanent polling/background monitor.

Refresh is explicit and manual.

## Role boundary

The new page belongs to the existing I.T. module ceiling. The server endpoint independently requires the existing `it.runtime.view` action authority. Existing Admin, I.T., Operations, Detailer, Finance, DAIP and Socials ceilings are not widened.

A payment source that is not authorized for the current actor remains restricted rather than leaking payment evidence or becoming an inferred system failure.

## Acceptance

The exact candidate must pass:

1. `scripts/support_automation_exception_handling_check.py`;
2. retained Production support diagnostics, observability, payment reconciliation and I.T. readiness authorities;
3. Current Source Gate;
4. exact feature-preview acceptance;
5. exact Development deployment/runtime acceptance after non-force promotion to `dev`;
6. protected-main pull-request checks; and
7. independent exact resulting `main` Production deployment/runtime/business acceptance.

Source or runtime GREEN never closes a provider/owner HOLD without the required dated evidence.

## Next bounded release

**Build 434 — Reliability, Security & Cost Reassessment** begins only after Build 433 is independently GREEN on protected `main` and exact Production acceptance is complete.
