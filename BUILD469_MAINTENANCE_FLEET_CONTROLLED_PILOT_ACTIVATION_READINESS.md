# Build 469 — Maintenance & Fleet Controlled Pilot Activation Readiness

## Purpose
Translate retained owner-approved maintenance/fleet commercial terms, eligibility, capacity safeguards and booking collision controls into one bounded controlled-pilot decision package without activating customer-facing automation.

Build 469 enriches the existing Build 439/449/459 owner-decision workbench and retains the Build 421 operational-pilot safety boundary. It does not create a second rulebook, approval system, booking flow, fleet account system or pilot engine.

## Canonical authorities
- `config/maintenance-plan-business-rulebook.json` remains the maintenance commercial authority.
- `config/fleet-business-rulebook.json` remains the fleet commercial authority.
- Build 459 commercial activation readiness remains the commercial-term prerequisite.
- Build 421 remains the retained operational-pilot safety authority.
- `/api/availability` remains current live availability authority.
- `/api/checkout` remains final booking collision/revalidation authority.
- `STARTUP_GO_LIVE_BLOCKERS.md` remains the canonical HOLD inventory.

The current maintenance and fleet rulebooks still report `awaiting_business_approval`. Build 469 does not invent or approve missing business terms.

## Controlled-pilot decision package
The retained admin-only GET endpoint `/api/admin/maintenance_fleet_owner_approval` and workbench `/admin-maintenance-fleet-owner-approval.html` now expose `controlled_pilot_readiness`.

The package requires:
- full retained commercial activation readiness;
- maintenance eligibility from canonical source;
- explicit owner pilot authorization;
- manual participant/account selection;
- explicit pilot participant and duration bounds supplied by the owner;
- current live availability revalidation for every real booking; and
- final checkout collision revalidation for every real booking.

Missing pilot participant limits or duration are reported as unresolved/null. Build 469 never invents pilot size or duration merely to produce a ready state.

## Readiness states
- `owner_action`: one or more canonical commercial decisions remain unresolved.
- `operator_review_ready`: retained commercial terms are source-approved and safeguards are explicit enough for a bounded owner pilot decision.

`operator_review_ready` is not pilot authorization and is not customer-facing activation.

## Pilot authorization boundary
Build 469 always keeps pilot activation separately authorized. It must not:
- select a customer, maintenance participant or fleet account automatically;
- activate a maintenance plan or fleet account;
- enroll, renew or create a recurring commitment;
- send customer outreach;
- create or alter a booking;
- reserve capacity or guarantee a slot;
- expand the service area;
- apply or override a price or discount;
- create or alter an invoice or credit term;
- enable recurring billing;
- mutate Stripe, PayPal or another provider;
- write either commercial rulebook at runtime;
- post accounting/inventory entries;
- mutate customer/profile data;
- close the canonical HOLD automatically; or
- add permanent polling.

## Capacity and collision boundary
Commercial capacity policy does not prove current slot capacity.

Every real controlled-pilot booking must independently:
1. revalidate current availability through `/api/availability`; and
2. pass final collision/revalidation through `/api/checkout`.

Aggregate demand, owner-approved capacity policy, source GREEN or `operator_review_ready` never reserves a slot.

## Current truthful state
Because both canonical commercial rulebooks remain `awaiting_business_approval`, the current controlled-pilot decision package remains `owner_action`. Source/runtime GREEN for Build 469 means the application classifies readiness truthfully; it does not mean a pilot has been approved.

## Acceptance
The exact candidate must pass:
1. Maintenance & Fleet Controlled Pilot Activation Readiness authority;
2. retained Build 459 commercial activation readiness;
3. retained Build 449 commercial decision closure and Build 439 owner-approval convergence;
4. retained Build 421 operational-pilot safety authority;
5. retained maintenance/fleet rulebook and commercial-acceptance authorities;
6. Current Source Gate;
7. exact feature-preview acceptance;
8. exact Development deployment/runtime acceptance;
9. protected-main PR checks; and
10. independent exact resulting-`main` Production deployment/runtime/business acceptance.

A GREEN Build 469 proves the controlled-pilot decision boundary is represented safely and truthfully. It does not approve a pilot, select participants or activate customer-facing automation.

## Next bounded release
**Build 470 — Local Search Provider Window & Attribution Closure** begins only after Build 469 is independently GREEN on protected `main`.
