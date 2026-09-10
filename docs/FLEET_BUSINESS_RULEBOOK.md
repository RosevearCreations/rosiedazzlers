# Build 372 — Fleet Business Rulebook

Build 372 creates the business-decision authority required before RosieDazzlers can operationalize fleet accounts. It deliberately does **not** invent fleet economics and does not activate fleet accounts.

## Required business decisions

The following six domains must be explicitly approved before the rulebook can be treated as ready:

1. **Fleet minimums** — the approved minimum vehicle/account requirements and any service-frequency or account-spend minimum policy.
2. **Service tiers** — the approved fleet service tiers and what each tier means.
3. **Travel limits** — included and maximum service-area distance plus any approved travel-fee policy.
4. **Volume pricing** — the approved pricing model, bands, or discount policy.
5. **Invoicing** — the approved billing model, payment terms, deposit policy, and statement cadence.
6. **Cancellation** — the approved notice, late-cancellation, missed-visit, and rescheduling policy.

All live Build 372 values remain unresolved until business approval is recorded. A missing or unapproved domain keeps the rulebook fail-closed.

## Existing authority remains in force

The current fleet lead pipeline and draft-quote handoff remain authoritative for lead review and quoting. The existing booking flow remains authoritative for actual bookings. Current service-area, work-site/access, and payment/deposit rules continue to apply unless a later explicitly approved rule changes them.

Build 372 does not create a second fleet customer, vehicle, quote, booking, payment, or invoice model.

## Operational boundary

Build 372 grants **no** authority to:

- activate a fleet account;
- apply fleet discounts automatically;
- create invoices;
- create bookings;
- start recurring billing;
- mutate Stripe, PayPal, or another payment provider;
- persist fleet-account operational state.

Those mechanics belong to **Build 373 — Fleet Account Operations**, and must consume the approved Build 372 rulebook rather than bypassing it.

## Schema and release boundary

Build 372 is schema-free. It adds a fail-closed configuration/decision layer and source authority checks only. No database migration is introduced.
