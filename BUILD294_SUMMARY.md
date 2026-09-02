# Build 294 — Customer Maintenance / Auto-Schedule Authority Closure

**Status: ACTIVE — Development-first**  
**Date:** 2026-09-02

## Purpose

Build 294 closes stale customer-controlled recurring-maintenance and auto-schedule authority that predates the Build 291 interest-only maintenance boundary.

The customer account may still express maintenance interest through `/maintenance-plan`, but it no longer owns operational scheduling fields.

## What changed

- `functions/api/client/vehicles_save.js` no longer accepts customer values for:
  - `next_cleaning_due_at`
  - `next_service_mileage_km`
  - `service_interval_days`
  - `auto_schedule_opt_in`
- `functions/api/client/_lib/customer-safe-shape.js` no longer projects those staff-owned scheduling fields back to the customer account.
- Existing database columns and historical/staff-side data are not deleted or migrated.
- `assets/customer-maintenance-authority-v294.js` hides and disables the matching legacy account controls while preserving their DOM IDs for compatibility with the older inline account renderer.
- The account maintenance panel is reasserted as an interest-only path and links to `/maintenance-plan`.
- The adapter uses account-status mutation events only; it does not poll, replay writes or create a maintenance request.

## Business-rule boundary

Build 294 does **not** define or approve a maintenance cadence, due date, service-mileage target, fixed price, discount, perk, priority, appointment, subscription, recurring billing, included/excluded recurring scope, pause/cancel policy or automatic schedule.

Customer maintenance intent remains a preference/follow-up signal under Build 291, not a scheduling command.

## Data boundary

There is **no schema migration**. Existing operational/historical scheduling columns remain available to staff-owned workflows. Build 294 removes only customer mutation and customer-safe projection authority for those fields.

## Runtime acceptance

`scripts/build294_http_smoke.sh` is read-only. It verifies the account loader/adapter and anonymous customer-dashboard isolation without creating or modifying a customer, vehicle, booking, review or maintenance-interest record.

## Release boundary

Feature branch: `build-294-customer-maintenance-authority-closure`.

Build 294 requires exact feature Source Gate + Cloudflare preview, then non-force Development promotion, exact Development source/runtime/Cloudflare acceptance, and only then deliberate Production promotion.
