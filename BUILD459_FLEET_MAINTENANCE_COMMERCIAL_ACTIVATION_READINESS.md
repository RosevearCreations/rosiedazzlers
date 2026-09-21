# Build 459 — Fleet & Maintenance Commercial Activation Readiness

## Purpose
Reconcile owner-approved maintenance/fleet cadence, price, discount, travel, invoicing, eligibility and capacity terms into one bounded activation-readiness decision without inventing terms or activating any customer, plan, fleet account, booking, discount, invoice or provider workflow.

Build 459 enriches the retained owner-decision workbench and Build 449 commercial decision closure. It does not create a second rulebook, dashboard, approval system or commercial activation engine.

## Canonical commercial sources
- `config/maintenance-plan-business-rulebook.json` remains the maintenance commercial authority.
- `config/fleet-business-rulebook.json` remains the fleet commercial authority.
- `/api/availability` remains live availability authority.
- `/api/checkout` remains final booking collision/revalidation authority.

The current canonical rulebooks still report `awaiting_business_approval`; Build 459 does not change those business terms.

## Activation-readiness reconciliation
The retained admin endpoint `/api/admin/maintenance_fleet_owner_approval` and workbench `/admin-maintenance-fleet-owner-approval.html` now expose a read-only activation-readiness layer over seven activation-critical domains:
- maintenance eligibility;
- maintenance cadence;
- maintenance price;
- maintenance capacity/priority policy;
- fleet travel limits;
- fleet volume pricing/discount; and
- fleet invoicing/credit terms.

The readiness layer also requires the retained full commercial decision closure to be source-approved. Partial approval therefore never produces activation readiness while other required maintenance/fleet commercial domains remain unresolved.

## Readiness states
- `owner_action`: one or more required commercial decisions remain unresolved.
- `operator_review_ready`: canonical source reports the retained full commercial decision closure approved and all seven activation-critical domains source-approved.

`operator_review_ready` is not activation approval. It means only that an operator may perform a separate bounded activation review.

## Activation boundary
Build 459 always reports activation as separately authorized. It must not:
- enable a maintenance plan or pilot;
- activate a fleet account;
- apply a discount or alter pricing;
- accept a quote;
- create a booking or reserve capacity;
- create an invoice or credit arrangement;
- enable recurring billing or renewal;
- send customer outreach;
- mutate Stripe, PayPal or another provider;
- write either canonical rulebook at runtime;
- post accounting/inventory entries;
- mutate customer/profile data;
- close the canonical HOLD automatically; or
- add permanent polling.

## Capacity boundary
Commercial capacity policy and live slot availability remain different authorities. Owner-approved capacity policy does not prove a date/slot is available. `/api/availability` and `/api/checkout` remain authoritative for every real booking.

## Canonical HOLD boundary
`STARTUP_GO_LIVE_BLOCKERS.md` remains the single HOLD inventory. Source/runtime GREEN or `operator_review_ready` does not close the Maintenance / fleet business approval HOLD automatically.

## Acceptance
The exact candidate must pass:
1. Fleet & Maintenance Commercial Activation Readiness authority;
2. retained Build 449 commercial decision closure and owner-approval convergence authorities;
3. retained maintenance/fleet rulebook, commercial-acceptance, operational-pilot and fleet-learning authorities;
4. Current Source Gate;
5. exact feature-preview acceptance;
6. exact Development deployment/runtime acceptance;
7. protected-main PR checks; and
8. independent exact resulting-`main` Production deployment/runtime/business acceptance.

A GREEN Build 459 means the application truthfully classifies commercial activation readiness. It does not approve terms or activate a commercial workflow.

## Next bounded release
**Build 460 — Local Search Provider & Attribution Evidence Quality** begins only after Build 459 is independently GREEN on protected `main`.
