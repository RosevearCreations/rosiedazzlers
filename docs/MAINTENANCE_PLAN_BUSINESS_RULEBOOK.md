# Maintenance Plan Business Rulebook — Build 370

## Purpose

Build 370 establishes one canonical, configurable decision record for a future Rosie Dazzlers maintenance plan. It does **not** launch a membership, subscription, recurring charge, automatic renewal, automatic enrolment, guaranteed appointment priority, fixed cadence, discount, or price.

The machine-readable authority is `config/maintenance-plan-business-rulebook.json`. This document explains how that authority must be used.

## Required business decisions

A maintenance plan cannot advance to pilot enrolment until all seven decision domains are explicitly approved:

1. **Eligibility** — which customers, vehicles, prior-service states, and vehicle-condition boundaries qualify.
2. **Cadence** — approved visit intervals, seasonal flexibility, and rescheduling rules.
3. **Price** — approved pricing model, amount or calculation basis, discount policy, and any price-lock policy.
4. **Inclusions** — the services, add-ons, and condition limits included in a plan visit.
5. **Exclusions** — services, add-ons, and vehicle-condition work that remain outside the plan.
6. **Cancellation** — notice, late-cancellation, missed-visit, pause, and termination rules.
7. **Priority** — whether priority booking is offered and, if so, exactly what capacity commitment is approved.

An empty value is not approval. A domain with `approved: false` is unresolved even if draft values are later entered.

## Fail-closed activation rule

Until every required domain is approved and a later release deliberately enables enrolment:

- `plan_enabled` stays false;
- pilot and automatic enrolment stay false;
- recurring billing and automatic renewal stay false;
- no fixed price, discount, cadence, perk, priority, or guaranteed slot may be presented as approved;
- the public Maintenance Plan page remains an interest/waitlist surface only.

Build 371 or a later explicitly authorized release may consume the approved rulebook for enrolment. Build 370 itself has no customer, booking, payment, refund, inventory, or recurring-billing mutation authority.

## Existing authorities remain in force

A future maintenance visit remains subordinate to the same operational authorities as an ordinary Rosie Dazzlers booking unless a later approved build changes them explicitly. The live booking flow remains authoritative for availability and appointment creation. Existing service-area, safe-work-area/site-access, weather/safety, vehicle-condition review, and payment/deposit rules continue to apply.

Maintenance status must not bypass capacity controls, travel rules, condition-based scope changes, add-on pricing, deposits, cancellation rules, or staff safety decisions.

## Change control

Business-rule changes must be made in the canonical JSON record, reviewed as source changes, and pass the Build 370 authority gate. Economic or customer-entitlement changes must never be inferred from marketing copy or from waitlist demand.

A later activation build must verify the rulebook is complete and explicitly approved before enabling enrolment. Provider-side recurring billing remains a separate acceptance boundary and must not be enabled merely because the business rulebook becomes approved.
