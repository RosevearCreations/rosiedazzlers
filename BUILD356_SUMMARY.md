# Build 356 — Safe Rebook From Service History

## Scope

Build 356 reconnects the accepted customer completed-service presentation to the retained authenticated rebook authority and makes that authority compatible with the current unified `/book` shell.

## Customer behavior

- Canonical completed-service cards can expose **Book this service again** when the historical row has a usable package code and service date.
- The handoff URL carries only `rebook_package` and `rebook_date` verification evidence.
- `/book` re-reads the authenticated customer dashboard and requires that package/date pair to match repeatable customer history.
- The retained verifier now recognizes the current unified booking shell's `data-choose-package` service control.
- Retired or unavailable services fail closed and are never silently substituted.
- Current vehicle selection/size, availability, add-ons, pricing, deposit and payment rules remain authoritative.

## Safety boundary

Build 356 does not carry historical price, appointment/slot, add-ons, deposit, payment state, customer identity/contact snapshots, booking state or private notes into a new booking. It adds no checkout, availability, provider or scheduling authority.

## Architecture

- `functions/api/client/dashboard.js` remains the authenticated history authority.
- `assets/my-account-v355.js` remains the canonical completed-service presentation adapter.
- `assets/customer-rebook-v285.js` remains the retained authenticated verifier and is made successor-compatible.
- `assets/booking-hours.js` bridges safe rebook evidence into the current unified `/book` shell.
- `scripts/my_account_safe_rebook_test.mjs` proves the bounded query and successor bridge.
- `scripts/booking_completion_retention_check.py` keeps the new behavior inside the cumulative fail-closed release gate.
- `FORWARD_BUILD_ROADMAP_356_377.md` records the durable requested forward build sequence.

## Data / migration boundary

No database migration, historical backfill or Production business-data mutation is introduced.

## Release boundary

The release is not GREEN from source changes alone. The exact Build 356 `dev` SHA must pass cumulative source authority and Cloudflare Development acceptance before the same exact SHA may fast-forward `main`; Production Cloudflare/check evidence must then complete successfully.
