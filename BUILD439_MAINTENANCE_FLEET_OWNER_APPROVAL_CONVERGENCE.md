# Build 439 — Maintenance & Fleet Owner Approval Convergence

## Purpose

Present unresolved maintenance and fleet commercial terms as explicit owner decisions with current operational evidence beside them, without inventing or silently approving business terms.

## Implemented workflow

Build 439 adds the admin-only workbench `/admin-maintenance-fleet-owner-approval.html` and the GET-only endpoint `/api/admin/maintenance_fleet_owner_approval`.

The endpoint requires the existing `admin.settings.manage` action boundary. It composes retained aggregate evidence from:

- `/api/admin/commercial_activation`;
- `/api/admin/fleet_commercial_operations_learning`;
- the canonical maintenance rulebook at `config/maintenance-plan-business-rulebook.json`; and
- the canonical fleet rulebook at `config/fleet-business-rulebook.json`.

The page presents the decision questions; it does not contain an approval mutation.

## Owner decisions

Maintenance remains `owner_action` for:

- eligibility;
- cadence;
- pricing;
- inclusions;
- exclusions;
- cancellation; and
- priority/capacity policy.

Fleet remains `owner_action` for:

- fleet minimums;
- service tiers;
- travel limits;
- volume pricing/discount;
- invoicing and credit/payment terms; and
- cancellation/rescheduling.

Current demand, interest, requested vehicle counts, observed service areas, account/work evidence and completed-work evidence are context only. They never approve a commercial term.

## Capacity boundary

Aggregate demand does not prove live capacity. `/api/availability` remains the current availability authority and `/api/checkout` remains the collision/revalidation authority.

No guaranteed slot, capacity reservation, service-area expansion or commercial capacity promise is created by Build 439.

## Approval boundary

Both canonical rulebooks still report `awaiting_business_approval`; Build 439 deliberately preserves that state.

A real owner approval requires the owner to choose the business terms and a separately reviewed source change to the canonical rulebook. This release does not invent values or write those files at runtime.

Source/runtime GREEN therefore may truthfully coexist with unresolved `owner_action` business terms.

## Mutation boundary

Build 439 performs no automatic or hidden:

- discount application;
- quote acceptance;
- booking creation;
- invoice creation;
- recurring billing;
- outreach;
- provider mutation;
- accounting posting;
- customer/profile mutation;
- capacity reservation;
- rulebook write;
- schema migration; or
- permanent polling.

## Acceptance

The exact candidate must pass focused owner-approval convergence authority, retained maintenance/fleet rulebook, commercial-acceptance, operational-pilot and fleet-learning authorities, Current Source Gate, exact feature-preview acceptance, exact Development deployment/runtime acceptance, protected-main PR checks and independent exact resulting `main` Production deployment/runtime/business acceptance.

Missing owner evidence remains `owner_action`; unavailable operational evidence remains unavailable rather than guessed.

## Next bounded release

**Build 440 — Local Search Provider Evidence Refresh** begins only after this release is independently GREEN on protected `main`.
