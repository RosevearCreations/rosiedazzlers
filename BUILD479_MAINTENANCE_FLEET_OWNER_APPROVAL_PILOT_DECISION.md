# Build 479 — Maintenance & Fleet Owner Approval & Pilot Decision

## Purpose
Converge canonical maintenance/fleet business approval state, explicit owner pilot bounds, manual participant-selection rules and retained availability/checkout safeguards into one read-only pilot decision record.

Build 479 extends the retained Build 439/449/459/469 owner-decision workbench. It does not create a second rulebook, booking flow, fleet account system, participant registry or pilot execution engine.

## Canonical authorities
- `config/maintenance-plan-business-rulebook.json` remains the maintenance commercial authority.
- `config/fleet-business-rulebook.json` remains the fleet commercial authority.
- Build 469 remains controlled-pilot readiness authority.
- `/api/availability` remains current live availability authority.
- `/api/checkout` remains final booking collision/revalidation authority.
- `STARTUP_GO_LIVE_BLOCKERS.md` remains the canonical HOLD inventory.

The current maintenance and fleet rulebooks still report `awaiting_business_approval`. Build 479 does not invent owner approval, pilot participant limits or pilot duration.

## Pilot decision record
The retained admin-only GET endpoint `/api/admin/maintenance_fleet_owner_approval` and workbench `/admin-maintenance-fleet-owner-approval.html` expose `pilot_decision_record`.

The record keeps these facts explicit:
- canonical maintenance and fleet rulebook status;
- whether an owner pilot decision is actually recorded;
- whether explicit positive participant and duration bounds are present;
- manual-only participant/account selection;
- eligibility remaining subordinate to canonical source;
- current availability revalidation through `/api/availability`; and
- final collision/revalidation through `/api/checkout`.

Missing owner decision or bounds remain `owner_action`. Source/runtime GREEN is never treated as owner approval.

## Decision states
- `owner_action`: required canonical approval, owner decision or pilot bounds remain unresolved.
- `pilot_decision_recorded`: canonical commercial terms are source-approved, the owner decision is explicitly approve, and explicit positive participant and duration bounds are supplied for bounded operator review.

`pilot_decision_recorded` does not activate a pilot. Pilot execution remains separately authorized.

An explicit owner `hold` decision is recorded as a decision but never becomes pilot authorization.

## Participant-selection boundary
Participant selection remains manual. Build 479 never:
- auto-selects a customer, maintenance participant or fleet account;
- exposes candidate identity in the decision record;
- auto-enrolls a customer;
- activates a fleet account;
- creates or renews a recurring commitment;
- enables recurring billing;
- sends outreach;
- creates or changes a booking;
- reserves capacity or guarantees a slot;
- expands the service area;
- overrides price, discount or invoice terms;
- mutates either canonical rulebook at runtime;
- mutates Stripe, PayPal or another provider;
- posts accounting/inventory entries; or
- closes the canonical HOLD automatically.

## Capacity and checkout boundary
Commercial approval and pilot bounds do not prove live capacity. Every real pilot booking must independently:
1. revalidate current availability through `/api/availability`; and
2. pass final collision/revalidation through `/api/checkout`.

No decision state reserves capacity.

## Current truthful state
Because both canonical commercial rulebooks remain `awaiting_business_approval` and no owner pilot bounds are recorded by this release, the current `pilot_decision_record.status` remains `owner_action`.

GREEN Build 479 therefore means the decision boundary is represented safely and truthfully; it does not mean a pilot has been approved or activated.

## Acceptance
The exact candidate must pass:
1. Maintenance & Fleet Owner Approval & Pilot Decision authority;
2. retained Build 469 controlled-pilot readiness;
3. retained Build 459/449/439 commercial owner-decision authorities;
4. retained Build 421 operational-pilot safety authority;
5. Current Source Gate;
6. exact feature-preview acceptance;
7. exact Development deployment/runtime acceptance;
8. protected-main PR checks; and
9. independent exact resulting-`main` Production deployment/runtime/business acceptance.

## Next bounded release
**Build 480 — Local Search Provider Snapshot Continuity & Descriptive Review** begins only after Build 479 is independently GREEN on protected `main`.
