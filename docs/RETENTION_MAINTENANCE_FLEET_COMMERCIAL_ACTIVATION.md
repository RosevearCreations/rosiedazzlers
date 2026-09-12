# Build 392 — Retention, Maintenance & Fleet Commercial Activation

Build 392 turns the existing maintenance-interest, retention-follow-up and fleet-assessment authorities into one practical staff activation view without inventing business terms that have not been approved.

## What operators can use now

The staff-only `/api/admin/commercial_activation` overview reads the existing maintenance-interest queue and fleet inquiry pipeline and returns deterministic next-action guidance. Maintenance continues to use the existing interest/waitlist and vehicle-history follow-up authorities. Fleet continues to use the existing assessment pipeline, vehicle/account operations and draft quote handoff.

The overview is read-only. It does not create bookings, invoices, customers, vehicles, subscriptions, recurring schedules or payment-provider state.

## Business approval remains authoritative

The canonical maintenance-plan and fleet rulebooks are still awaiting business approval. Build 392 therefore does not invent eligibility, cadence, prices, discounts, service tiers, inclusions, exclusions, cancellation rules, travel economics, invoice terms or priority entitlements.

A future explicit business approval may make commercial terms ready, but that alone does not grant payment, subscription, provider or automatic-mutation authority.

## Safety boundaries

- **No automatic outreach.** Staff may review queues and record manual follow-up through the existing approved workflow; Build 392 does not send customer messages.
- **No automatic discount.** Fleet or maintenance discounts remain unavailable until explicitly approved and separately authorized for application.
- **No recurring billing.** No subscription, renewal or provider charge is created by this build.
- **No provider mutation.** Stripe, PayPal or other provider state is outside this build.
- **Existing booking authority stays authoritative.** Scheduling and conversion must continue through the established booking/quote path.
- **Existing quote authority stays authoritative.** Fleet draft quote handoff remains the supported bridge; Build 392 does not mark a lead converted simply because a draft quote exists.
- **Customer consent remains authoritative.** Unsubscribed maintenance interest is not reactivated by the activation overview.

## Customer paths

Customers continue to use the existing maintenance-interest waitlist and fleet-assessment inquiry. Build 392 does not expose internal commercial blockers or staff notes as public content and does not create a second customer model.

## Technical boundary

Build 392 is schema-neutral. It adds no database migration and creates no new pricing, customer, fleet or billing ledger. The activation overview reads existing Supabase rows, computes queue metrics and operator priorities, and fails closed on unresolved commercial terms.
