# Build 623 — Unified Pricing, Availability & Eligibility Contract

## Purpose

Provide a **read-only, fail-closed decision contract** for the future hybrid Rosie Dazzlers booking wizard. Do not replace the live `/book`, checkout, pricing catalog, quotes, holds or Stripe integration in this build.

The canonical endpoint is `GET /api/booking_contract_623` with query parameters `package_code`, `vehicle_size`, optional comma-separated `addon_codes`, `service_area`, and optional `service_date`/`start_slot`/`duration_slots`. It returns `rosie-booking-contract.v1` with independent pricing, eligibility, availability, and human-review states. This is **not a booking confirmation**.

## Existing sources retained

- `functions/api/_lib/pricing-catalog.js` normalizes/merges the Supabase App Management `pricing_catalog` row with the bundled catalog, matching checkout's source model.
- `functions/api/_lib/commercial-accuracy.js` applies the existing public commercial price and add-on classification overrides (used by `/api/pricing_catalog_public`). Build 623 compares this projection with the raw checkout projection.
- `functions/api/_lib/quote-booking-authority.js` checks blocked dates, blocked slots and pending/confirmed bookings against Supabase. A previewed free slot is still not a transactional capacity hold.
- `catalog.service_areas` is only an area selection candidate; separate service-area/water and controlled-site authority, cold-weather conditions, parking/runoff and staff verification remain mandatory.

## Decision boundaries

- Reject malformed vehicle/package codes, duplicate/invalid add-ons, nonexistent services, unsupported areas and invalid date/slot combinations.
- Compute **CAD cents** with precision checks from both public-projected and checkout raw prices; show amount differences, not automatic reconciliation.
- If totals, deposits, or quote-required classification differ, return `OWNER_PRICING_PARITY_HOLD` and `decision:hold`.
- In particular, the Build 614 owner HOLD for Basic Detail ($115/$135/$170 raw versus $229/$269/$309 public) remains unresolved. **No price, checkout amount, deposit policy, tax, or payment behavior is modified here.**
- Quote-required services are marked for staff estimate, never priced as final fixed services.
- Do not infer winter eligibility or safe access from availability; independent site/weather/customer confirmation remains required.
- Missing DB authority or failed availability lookup fails closed; no fallback record is labeled `ready to book`.
- The contract always returns `can_commit_booking:false`, `payment_taken:false`, `booking_created:false`, `reservation_created:false`. Even `review_ready` requires downstream transactional checkout and independent eligibility review.
- GET provides selection diagnostics only, includes no customer record information or server credentials, and never writes to Supabase.
- POST/PUT/PATCH/DELETE return 405. All responses are no-store. No new automatic reminders or publishing.

## Example

`GET /api/booking_contract_623?package_code=basic_detail&vehicle_size=small&service_area=Tillsonburg%2C%20ON&service_date=2026-11-08&start_slot=AM&duration_slots=1`

Expected with unreconciled price sources: `pricing.parity_status=owner_hold`, an issue with `OWNER_PRICING_PARITY_HOLD`, and **never** `can_commit_booking:true`. The source and its values must be checked in a live authenticated review; this example alone proves nothing about Production.

## Acceptance matrix

1. Matching package and fixed add-on prices yield matching preview cents with no booking mutation.
2. Basic Detail public/checkout disagreement is visible and holds booking readiness.
3. Quote-required and incompatible add-ons cannot silently become fixed-price bookable.
4. Unsupported service area, unavailable slot or missing authoritative DB source remains blocked.
5. Invalid calendar dates, duplicate add-ons and PM full-day combinations are rejected.
6. Current Standard theme and live booking/checkout remain unchanged by this source addition.
7. Source route aliases (e.g., `admin-app/index.html`, `admin-catalog/index.html`) remain synced.
8. Verify `node scripts/build623_unified_booking_contract_test.mjs`, Source Checks, Cloudflare exact-main deployment and live endpoint manually. **Do not claim payment or real appointment booking acceptance from contract tests.**

## Release decisions still outstanding

- Owner approves the price and quote-required policy exposed by Build 614; Build 624 should reconcile accepted pricing policy **only after explicit sign-off**.
- Staff verifies true capacity, water/bylaw rules, site limitations and real-weather service eligibility.
- Future wizard UX uses this contract for preview but must not treat `review_ready` as a server reservation or checkout permission.

Created: 2026-10-23. No production state mutated by this contract itself.
