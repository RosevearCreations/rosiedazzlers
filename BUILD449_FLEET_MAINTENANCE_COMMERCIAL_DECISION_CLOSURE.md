# Build 449 — Fleet & Maintenance Commercial Decision Closure

## Purpose
Converge the unresolved maintenance/fleet cadence, price, discount, travel, invoice, eligibility and capacity terms into one explicit owner-decision closure packet without inventing or silently approving any commercial term.

Build 449 enriches the retained owner-decision convergence authority from `BUILD439_MAINTENANCE_FLEET_OWNER_APPROVAL_CONVERGENCE.md`; it does not create a second rulebook or approval system.

## Canonical commercial sources
Maintenance decisions remain authoritative only in:
`config/maintenance-plan-business-rulebook.json`

Fleet decisions remain authoritative only in:
`config/fleet-business-rulebook.json`

The current canonical source still reports `awaiting_business_approval`. Build 449 does not change those terms because the owner has not supplied the missing business decisions.

## Closure packet
The existing admin-only read-only endpoint remains:
`/api/admin/maintenance_fleet_owner_approval`

The existing workbench remains:
`/admin-maintenance-fleet-owner-approval.html`

Build 449 adds:
- exact canonical owner-decision paths for each commercial domain;
- the source fields required to close each domain;
- explicit per-domain `owner_action` versus `source_approved` closure state;
- a combined closure summary over all thirteen maintenance/fleet decision domains;
- a truthful `owner_review_candidate` state only when every canonical source domain reports approved; and
- an explicit separation between commercial capacity policy and live slot availability.

A closure candidate is not automatic activation. It means only that canonical commercial source may be ready for owner review.

## Maintenance decision domains
The retained seven maintenance domains remain:
- eligibility;
- cadence;
- price;
- inclusions;
- exclusions;
- cancellation; and
- priority/capacity policy.

Eligibility, cadence and pricing must be explicit rather than inferred from customer interest.

Priority/capacity policy may define commercial promises, but live date/slot capacity remains subordinate to `/api/availability` and final collision/revalidation remains `/api/checkout`.

## Fleet decision domains
The retained six fleet domains remain:
- fleet minimums;
- service tiers;
- travel limits;
- volume pricing/discount;
- invoicing/credit terms; and
- cancellation/rescheduling.

Observed inquiry volume, requested vehicle counts, requested service areas, accounts, quotes or completed work are context only. They never approve a discount, travel boundary or invoice term.

## Owner-review boundary
Current unresolved terms remain `owner_action`.

If canonical source later reports every required domain approved, the Build 449 closure layer may report `owner_review_candidate`. It must not:
- enable maintenance-plan activation;
- activate a fleet account;
- apply a discount;
- accept a quote;
- create a booking;
- create an invoice;
- enable recurring billing or renewal;
- promise live capacity;
- send customer outreach;
- mutate a payment/provider;
- post accounting/inventory entries; or
- close the canonical HOLD automatically.

Any operational activation remains separately authorized.

## Capacity boundary
Commercial capacity policy and live capacity are different authorities.

The maintenance priority/capacity source may contain owner-approved policy, but:
- aggregate demand never proves capacity;
- a closure candidate never reserves a slot;
- a closure candidate never guarantees a date;
- `/api/availability` remains the availability authority; and
- `/api/checkout` remains the final booking collision/revalidation authority.

## Canonical HOLD boundary
`STARTUP_GO_LIVE_BLOCKERS.md` remains the single HOLD inventory.

Build 449 may expose a closure candidate, but the **Maintenance / fleet business approval** row remains until explicit owner-approved commercial source exists and an operator intentionally reviews the HOLD. Source/runtime GREEN alone does not close it.

## Mutation boundary
Build 449 is read-only and introduces no:
- rulebook runtime write;
- automatic business approval;
- inferred approval timestamp;
- schema migration;
- customer/profile mutation;
- booking mutation;
- discount application;
- invoice creation;
- accounting/inventory posting;
- payment/refund/provider transaction;
- recurring billing/renewal;
- capacity reservation;
- destructive storage action;
- automatic outreach; or
- permanent polling.

## Acceptance
The exact candidate must pass:
1. Fleet & Maintenance Commercial Decision Closure authority;
2. retained owner-approval convergence authority;
3. retained maintenance/fleet business-rulebook authorities;
4. retained commercial-acceptance, operational-pilot and fleet-learning authorities;
5. Current Source Gate;
6. exact feature-preview acceptance;
7. exact Development deployment/runtime acceptance;
8. protected-main PR checks; and
9. independent exact resulting-`main` Production deployment/runtime/business acceptance.

A GREEN Build 449 means the application accurately exposes the current owner-decision closure state. It does **not** mean unresolved business terms have been approved.

## Next bounded release
**Build 450 — Local Search Measurement & Conversion Attribution** begins only after Build 449 is independently GREEN on protected `main`.
