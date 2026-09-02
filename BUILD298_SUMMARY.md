# Build 298 — Operations Booking / Quote Support Maintainability Extraction

## Scope

Build 298 continues the post-Build-297 Operations maintainability work by extracting the mature Quote Pipeline browser runtime from both `admin-quotes` route copies into the versioned external classic-script asset `assets/admin-quotes-v298.js`.

The accepted Build 297 Development SHA is `a034182bf8fd5dc8f8025032834ad7be6ec1d762`. Accepted Production remains Build 296 at `337ae533130f4bf1c566d47c2ba1bc712cbf780e` while Build 298 is validated in Development.

## Delivered boundary

- `admin-quotes.html` and `admin-quotes/index.html` remain exact route copies.
- Their former mature inline classic runtime is preserved byte-for-byte in `assets/admin-quotes-v298.js`.
- Quote list/load, quote save/edit, follow-up/probability/amount fields, customer/lead references, `booking_id`, and the booking-dashboard bridge remain unchanged.
- Existing `admin-auth.js`, `admin-shell.js`, page markup, API endpoints and write semantics remain authoritative.
- There is no quote or booking behavior change, no pricing or recurrence change, no API-contract change, and no database or schema migration.

## Acceptance

- `scripts/build298_release_check.py` proves the exact extraction against the accepted Build 297 Development baseline and preserves route/API authority.
- `scripts/build298_http_smoke.sh` is read-only and verifies the deployed quote routes and versioned runtime asset without calling quote/booking mutation APIs.
- `.github/workflows/build298-source-gate.yml` validates the feature candidate.
- `.github/workflows/build298-development-source-gate.yml` validates the exact Development source after transfer.
- `.github/workflows/build298-development-acceptance.yml` validates the read-only deployed Development runtime.

## Production boundary

Production remains closed for Build 298. No Production promotion is part of this build until Development is deliberately accepted and a separate promotion is requested.
