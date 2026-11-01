# Build 739 — Winter workability, site utilities and service-area transparency

**Status:** Implementation and test contract; deployment is verified separately by exact-SHA Production acceptance and release health. 2026-11-01.

## Owner-source boundary

- **Retain Build 274 / 656 / 659 operating policy:** Rosie supplies standard detailing water and power. The customer must provide a safe, permitted driveway/private work area; unusual access, steep grade, shared/condo restrictions and property rules require review. Do not revert to the old “customer supplies water/power” model.
- **Oxford and Norfolk:** the managed pricing catalogue's `service_areas` is the zone/county/travel and official-link source. `data/water_restriction_rules.json` and its managed Supabase overrides remain the source for seasonal water-use policy. Do not invent municipal exemptions, fees, dates, local temperature thresholds or permissions.
- The 2026-11-01 read-only check of Rosie's `app_management_settings` found **no separately approved winter/seasonal/weather workability setting**. Retained Builds 486–487 treat cold capability evidence and public winter copy as **owner-review-only**, not authorization for automatic availability or quote changes. Consequently, no package is advertised as universally winter-capable or guaranteed for indoor work.
- November–March is a **conservative referral/review window**, not a scientific service-temperature threshold, a prediction of the weather on a selected day, or an owner-approved service exclusion. Even if the customer reports mild weather, a winter date cannot be automatically reserved until an owner-approved capability and authorization policy is implemented and verified. The UI directs the customer to `/contact` to request individualized review.

## Customer journey and safety

1. Step 1 shows the selected service area's catalog-owned parking, water-use, runoff and access reminders and links to official sources. A separate winter advisory appears immediately for a November–March date, irrespective of calendar slot availability.
2. Step 4 asks four specific, accessible worksite questions: permitted private work area, stable/clear surface, forecast or observed weather, and local water/runoff compliance. The copy explicitly says Rosie supplies the standard utilities; customer-supplied water/power is not a prerequisite. Street/shared/condo or unknown access, hazards or unclear bylaw permissions are referred to staff.
3. A single shared pure evaluator (`assets/winter-workability-v739.js`) drives the browser notice and the server checkout decision. Exact catalog zone and county are independently resolved server-side; supplied `service_area_meta` or a generic/fallback county is not treated as proof of coverage.
4. The checkout API rejects any unsafe/uncertain or cold-season request with HTTP 422, `review_state=staff_review_required`, and `payment_attempted=false` / `booking_created=false` **before customer-identity side effects, booking insert, gift redemption or payment provider operations**. No partial booking, Stripe/PayPal charge or consumed one-car capacity is introduced by this review gate.
5. For a verified Oxford/Norfolk zone outside the winter-review window with all four safe/known answers, the existing exact-price, source-safe add-on, deposit, one-car capacity/atomic conflict and payment checks run unchanged. Conditions are rechecked before dispatch; the questionnaire is not a weather forecast or waiver of local law.

## Official-source verification

- Oxford County water conservation: <https://www.oxfordcounty.ca/services-for-you/water-and-wastewater/drinking-water/water-conservation/> (seasonal municipality-specific rules, not a blanket year-round clearance).
- Norfolk County watering restrictions: <https://www.norfolkcounty.ca/home-property-and-neighbourhood/water-and-wastewater/water-conservation/watering-restrictions/> (check current date and local rules before discharge/use).
- Norfolk County By-law 2003-63: <https://www.norfolkcounty.ca/council-administration-and-government/by-laws-and-policies/by-law-directory/watering-restrictions-by-law/> (vehicle washing is within the by-law's external-water use definitions; check actual restrictions and lawful applicability).

Links supplement—not replace—the county catalog and the water restriction authority. No legal compliance determination is automated from the customer's checkboxes.

## Regression acceptance

- `node scripts/build739_winter_workability_service_area_test.mjs`: both counties, official links, normal-season safe path, November–March review, unlisted zone, shared/icy/freezing/restricted/unknown site, missing legacy questionnaire, safe owner utility copy, no inferred temperature threshold, UI/source and server pre-payment guard.
- `bash scripts/current_booking_wizard_regression.sh`: Builds 627–739 retained, including 735 pricing, 736 add-ons, 737 five-step recovery and 738 exact capacity.
- Required release verification: dev gate, main Production Business Acceptance exact main SHA, Cloudflare deployment of the same SHA, and release-health GREEN. Do not call production GREEN based on local tests alone.

## Pending owner approval (not represented as completed)

- Owner-approved, per-service/per-environment winter capability and appropriate safe-temperature/site limits, if any; a signed source and current-conditions verification path are prerequisites to automatically opening winter reservations.
- Specific condominiums/shared-property approvals, runoff restrictions and any municipal waiver must be reviewed for the actual location. A customer checkbox cannot grant those permissions.
