# Build 451 — Booking Funnel, Quote & Pricing Learning

## Purpose
Use current first-party booking-funnel and quote-pipeline evidence to identify supported conversion and pricing-friction review signals without creating a second booking, quote or pricing authority. Build 451 enriches retained Build 427 Booking Conversion & Quote Clarity and Build 441 Booking, Quote & Retention Production Learning.

## Evidence model
The protected Operations surface `/admin-booking-quote-retention-learning.html` remains the learning workbench. Build 451 reads existing anonymous booking-funnel aggregates and quote-pipeline rows already authorized to `manage_bookings`, then returns aggregate-only learning. Customer names/emails, lead/customer/booking/quote IDs and raw session identifiers are not returned.

## Booking-funnel learning
The report identifies the largest observed stage drop and the largest drop at a **price-adjacent** step: Package, Add-ons, Deposit / payment or Checkout started. A price-adjacent stage is a review location only; it does not prove price caused abandonment.

## Quote and accepted-value learning
Build 451 reports sent, accepted, declined and unresolved quote counts; broad quoted-value cohorts (Under $250, $250–$399, $400–$599, $600+); and aggregate accepted rows where quoted and accepted values are both positive. A quote-value cohort needs **at least three sent rows** before it is marked sufficient for bounded review.

An accepted-value difference does not establish discounting, scope change, correction, added work or another cause. An accepted quote is not treated as proof that work was completed or that margin was realized.

## Learning signals
Bounded owner-review prompts may identify a price-adjacent booking-stage drop, quote resolution mix, the highest observed declined-of-sent quote-value cohort with sufficient sample, and accepted-vs-quoted aggregate differences. Every prompt states that causal price sensitivity is not established, a pricing change is not authorized and automatic action is not authorized.

## Mutation boundary
No automatic:
- price change or discount;
- outreach or follow-up;
- quote acceptance;
- booking creation;
- payment/refund/provider action; or
- pricing/catalogue write

is authorized. There is no schema migration, customer/profile mutation, accounting/inventory posting, destructive storage action or permanent polling.

## Truth boundary
Observed booking and quote correlations **does not establish customer motive**. A booking-stage drop does not prove price friction; a quote decline does not prove price sensitivity; an accepted-value delta does not prove discounting; an unresolved quote does not prove rejection; and an accepted quote does not prove completed work.

## Role and HOLD boundary
The endpoint requires the existing `manage_bookings` capability and reuses retained source authorities. `STARTUP_GO_LIVE_BLOCKERS.md` remains authoritative; Build 451 surfaces review evidence but does not close provider, recovery, device, maintenance/fleet or unavailable-source HOLDs.

## Acceptance
Require focused Build 451 authority, retained Build 427 / Build 441 / Booking & Rebooking Funnel authorities, Current Source Gate, exact feature-preview acceptance, exact Development deployment/runtime acceptance, protected-main checks and independent exact Production deployment/runtime/business acceptance.

## Next bounded release
Build 452 — Staff Workflow, Support & Mobile Efficiency Learning begins only after this release is independently GREEN on protected `main`.
