# Build 626 — Booking State, Slot Holds & Checkout Failure Recovery Acceptance

Date: 2026-10-24. **Live booking and payment safety matters more than shortcutting a release.**

## Existing authority retained
- `functions/api/checkout.js` is the live checkout authority, including current catalog pricing, blocked dates, existing bookings, Stripe/PayPal/gift handling and deposit calculation.
- `functions/api/checkout_recovery.js` is a wrapper used to resume an existing recent pending checkout session; it must never mutate the booking itself or create a second payment session for an already-matching hold.
- `functions/api/_lib/quote-booking-terms.js` and `quote-booking-authority.js` independently revalidate accepted quote, payment amounts, accepted-term hash and availability before staff conversion.
- Browser tab session draft recovery remains non-authoritative; no durable localStorage of private customer details.

## Delivered
1. Added `functions/api/_lib/booking-recovery-contract-626.js`: pure review functions for confirmed, pending, expired, inactive and unverifiable booking holds; AM/PM/full-day overlap; fixed catalog price snapshots; exact pending session comparison.
2. Updated recovery to require the **same date, exact occupied slot(s), customer email, package and vehicle size, service area, street address, vehicle year/make/model, selected add-on codes, payment provider, and current total/deposit** before returning an existing payment session.
3. Lookup reads price/add-on/address/vehicle fields that canonical checkout already records. If the metadata is missing or inconsistent, recovery returns a generic `409 details_changed`, not an unrelated Stripe/PayPal URL.
4. Fresh catalog pricing is required for recovery; no session reopening on a missing catalog, stale/expired pending hold, changed amounts, unsupported quote-based add-ons, provider mismatch or existing slot blocker.
5. The original checkout remains responsible for price enforcement and creating the booking, including pending-session safeguards. Changed or unusual requests may require staff intervention; **the wrapper must never silently reuse a mismatched payment session**.
6. Added a consistent validation rule: a 2-slot full-day booking **must start AM**, in quote decision helper, server quote availability and canonical customer checkout.
7. Regression script `scripts/build626_booking_checkout_recovery_test.mjs` includes price edits (Basic Detail approved CAD 229/269/309), price drift, deposit drift, duplicate/changed add-ons, quote-required add-ons, address and identity mismatch, expired pending holds, cancelled/confirmed states, slot conflicts, provider mismatch and immutable accepted quote comparisons.

## What this does not prove
- The existing live checkout's read-then-insert availability check does **not by itself demonstrate transactional race prevention**. Atomic database capacity exclusion/concurrent checkout idempotency require a separate implementation and load test. **Do not claim duplicate booking impossibility**.
- The recovery wrapper matches existing customer terms but does not add an independently verified customer authentication token to the reused payment link. Secure payment-session recovery authentication and identity confirmation require a separate owner-reviewed task.
- An aborted/expired payment attempt does not automatically release an active pending DB row. The existing pending expiry rule applies; staff may need to clear a conflicting hold.
- No Stripe/PayPal live charges or real customer appointment were created for tests. Simulated behavior is not full provider acceptance.
- No booking pricing schedule, user-facing catalog, customer discounts, deposit, or public theme was changed. Basic Detail stays at approved size-dependent prices.

## Acceptance and commands
`node scripts/build626_booking_checkout_recovery_test.mjs`
`node scripts/build362_quote_booking_acceptance_test.mjs`
`python3 scripts/booking_recovery_failure_handling_check.py`
`node --check functions/api/checkout.js`
`node --check functions/api/checkout_recovery.js`

Verify separate source gate suites, protected dev→main merge, exact production commit deployment to Cloudflare, public /book, existing checkout service and no regression to theme pages. **Production GREEN only after exact-main Cloudflare evidence.**

## Next high-priority engineering work
- Atomic slot reservation/concurrency protection at the DB layer (including transaction-safe idempotency keys).
- Customer-authenticated payment recovery tokens with expiry and single use, instead of relying solely on familiar booking details.
- End-to-end Stripe/PayPal sandbox retry, cancel, completion, webhook and double-click acceptance, with no production charges.
