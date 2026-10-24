# Build 624 — Owner-Approved Basic Detail Commercial Price Parity

Decision (23 October 2026, EDT): Owner explicitly approved using the already-public Basic Detail vehicle size rates of **CAD $229 small, $269 mid, $309 oversize**. The owner may change these later.

## Change boundaries

1. Updated `basic_detail.prices_cad` for each vehicle size in the two bundled catalogs:
   - `data/rosie_services_pricing_and_packages.json`
   - `functions/api/data/rosie_services_pricing_and_packages.json`
2. Updated the existing live Supabase `app_management_settings` row for `pricing_catalog`, only within the Basic Detail `prices_cad` object, using an old-value guarded SQL operation. Database reported 1 row updated 2026-10-24 01:28:49 UTC; post-update verification required.
3. `applyCommercialAccuracy` continues to enrich public Basic Detail copy, but **does not overwrite valid catalog Basic Detail prices**, allowing subsequent owner edits to flow to the public projection. Other packages retain their prior commercial rules.
4. Checkout and quote-to-booking already load the DB-first pricing catalog; the Build 623 read-only contract already compares the public and checkout projections. With both approved sources aligned they can agree without bypassing the parity gate.
5. Existing deposit values, tax calculation, Stripe/PayPal/gift code logic, appointment capacity, existing bookings/quotes, other service prices and theme activation rules are not changed. No retroactive repricing.

## Owner-approved Basic Detail

| Vehicle size | Approved rate | Existing deposit |
|:--|--:|--:|
| Small | CAD $229 | CAD $50 |
| Mid | CAD $269 | CAD $50 |
| Oversize | CAD $309 | CAD $50 |

These rates are for the **Basic Detail** package as currently catalogued. Other cleaning service/package codes and vehicle-size prices remain separate. If the owner later approves distinct additional tiers, add unique package identities; never repurpose Basic Detail for an unrelated tier.

## Verification

- Run `node scripts/build624_basic_detail_pricing_parity_test.mjs`, `node scripts/service_commercial_accuracy_test.mjs`, `node scripts/pricing_source_parity_614_test.mjs`, and `node scripts/build623_unified_booking_contract_test.mjs`.
- Confirm the live Supabase price row has the approved 3 values and the same **five** package entries.
- Compare `/api/pricing_catalog_public` Basic Detail prices and `/api/booking_contract_623` Basic Detail per-vehicle-size `pricing.parity_status`; use selected valid area and availability only after real booking checks.
- Confirm no new Basic Detail owner hold in Admin pricing parity report. Other independent add-on policy findings may persist.
- Protected `dev → main` source checks and exact-main Cloudflare Production GREEN remain required. An API 200 alone is insufficient for deployment verification.

Status: intended only after source and DB verification; do not mark live Production GREEN from a branch merge.
