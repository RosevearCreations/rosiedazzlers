# Build 625 — Vehicle Classification, Service Compatibility & Guided Eligibility

## Scope and owner intent
After Builds 623–624 aligned public and checkout prices, add an **optional read-only fit check** for the booking wizard. No manual edit to any package price, tax, deposit, service area, inventory, slot hold, checkout/Stripe/PayPal code, bookings or Standard theme. Current Basic Detail size-specific rates remain **$229 / $269 / $309 CAD**.

## Components
- `functions/api/_lib/booking-vehicle-eligibility-625.js` — validates voluntary year, make, model, body type, explicit selected vehicle size and condition flags against current package prices and optional catalog-defined body type allowances. Vehicle body style never automatically determines size or price.
- `functions/api/booking_contract_623.js` — extends existing *read-only* GET results with `eligibility.vehicle_profile`. Existing callers not providing vehicle fields continue receiving a `not_provided` profile, without a new forced hold. Supplied conflicting or malformed data fails closed. A reviewable special vehicle/condition turns an otherwise review-ready preview into `quote_review_required`, never into a booking.
- `booking-eligibility-preview.html` and `assets/booking-eligibility-preview-625.js` — responsive customer fit-check form with circled information cues, reasoned issues, a source-fed package/area dropdown and a regular booking return link. The preview is intentionally non-transactional and does not store submissions. External JS avoids inline-script CSP requirements.
- `book.html` and `book/index.html` — identical lightweight link to this optional helper. Live booking flow stays intact.
- `scripts/build625_vehicle_service_eligibility_test.mjs` — regression coverage of profiles, quote conditions, invalid/mismatched size, catalog exclusions, helper page, and mirrored public route.

## Decisions
- Small, mid and oversize price classes are customer-selected and explicitly re-confirmed. A truck, SUV, van or RV is never automatically sized.
- A complete normal vehicle profile may be `review_ready`, but only for **review**, not confirmed eligible/bookable.
- Specialty RV/motorcycle/other, truck/van access and heavy contamination trigger staff review; serious contamination is not automatically accepted as a service.
- Unknown type/condition flags, unsupported catalog vehicle/body combinations, invalid year or size mismatches are `hold` issues. The live transaction still performs its own validation.
- All contract paths retain `can_commit_booking:false`, `booking_created:false`, `payment_taken:false`, `reservation_created:false`.
- A selected appointment date is only tentative after the existing server availability checker; weather, bylaw, site access and dispatch capacity stay independently gated.
- The new optional screen should not imply new booking slots, new checkout authority or service availability.

## Verification
1. Check individual vehicle-year and required identity validations.
2. Confirm size mismatch cannot produce a review-ready profile, and no inferred prices are returned.
3. Verify unusual vehicles and heavy condition flags indicate staff estimate/review.
4. Confirm allowed/excluded package type metadata, if present, is observed without inventing new restrictions.
5. Confirm public Basic Detail prices remain $229/$269/$309 with existing $50 deposit; future owner edits continue flowing from catalog.
6. Verify `book.html` and `book/index.html` are byte-for-byte identical, links visible, and helper loads without console errors in a browser.
7. Run `node scripts/build625_vehicle_service_eligibility_test.mjs`, plus Build 623/624 and required CI suites.
8. Protected `dev → main` merges require `source checks`; Cloudflare Production GREEN is an **independent exact-main SHA** confirmation, not inferred from GitHub merge.

Out of scope: active booking submission, hidden vehicle identification, automatic vehicle-size pricing, customer photo ingestion, live payment attempts, overriding winter/site eligibility or auto-approving hazardous contamination.

## Suggested Build 626
Extend booking-state, hold/slot conflict, price snapshot and checkout failure recovery regression coverage before the new guided wizard is allowed to submit a paid booking.
