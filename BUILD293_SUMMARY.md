# Build 293 — Customer Retention Next-Action Hub

**Status: ACTIVE — Development-first**  
**Date:** 2026-09-01

## Purpose

Build 293 coordinates the customer account authorities already established in Builds 285–291 so a signed-in customer sees one useful next action instead of several disconnected retention surfaces.

## What changed

- `/my-account` loads a bounded Build 293 adapter through the existing customer-auth loader.
- The adapter reads the authenticated `/api/client/dashboard` projection only; it does not add a database query or schema.
- A single “What’s next?” panel chooses among existing authorities:
  - review a genuinely completed booking that has no matching saved review,
  - book a prior service again through the Build 285 package/date handoff,
  - open an existing progress link when available,
  - otherwise open the current booking flow.
- Rebooking still recalculates current vehicle size, availability, add-ons, price, deposit and payment authority.
- The legacy My Account maintenance-conversion copy is overlaid with the accepted Build 291 interest-only boundary. Maintenance interest does not create a fixed cadence, price, discount, priority, appointment, subscription or recurring billing.
- Build 289 remains the owner of signed-out/manual weak-network recovery. Build 293 does not poll or automatically retry account reads.

## Authority boundary

The next-action panel is navigation/orchestration only. It does **not** create a review, quote, appointment, subscription, recurring billing, referral reward, discount, maintenance price or publication authority.

Build 293 does not alter review eligibility, customer privacy, booking availability, pricing, deposits, payments, maintenance economics or fleet economics.

## Data boundary

There is **no schema migration**. Build 293 consumes the existing customer-safe dashboard projection and existing client-side handoffs.

## Runtime acceptance

`scripts/build293_http_smoke.sh` is deliberately non-mutating. It verifies `/my-account`, the Build 293 asset/loader, the customer-safe dashboard fail-closed response, and the interest-only maintenance boundary without creating customer, review, booking or maintenance records.

## Release boundary

Feature branch: `build-293-customer-retention-next-actions`.

Build 293 requires exact feature Source Gate + Cloudflare preview, then non-force Development promotion, exact Development source/runtime/Cloudflare acceptance, and only then deliberate Production promotion.
