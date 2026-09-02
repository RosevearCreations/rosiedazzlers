# Build 297 — Operations Customer Support Maintainability Extraction

## Purpose
Build 297 is a behavior-preserving maintainability release for the Operations customer-support surface. It extracts the mature runtime from `admin-customers.html` into a versioned external classic JavaScript asset while retaining the accepted Build 296 Production authority exactly.

## Accepted baseline
- Build 296 Production: `337ae533130f4bf1c566d47c2ba1bc712cbf780e`
- Production remains closed while Build 297 is validated in Development.

## Delivered source change
- Added `assets/admin-customers-v297.js`.
- Replaced the mature inline classic script in `admin-customers.html` with `/assets/admin-customers-v297.js`.
- Synchronized `admin-customers/index.html` to exact route-copy parity.
- The extracted JavaScript is byte-for-byte the accepted Build 296 inline runtime, plus the terminating newline required by the standalone source file.

## Authority retained
The extraction preserves the existing customer directory, customer detail/edit flow, protected role controls, secure account-assistance actions, session revocation, customer lifecycle/archive controls, safe audit/history display, duplicate review, and sign-in-help queue behavior. Existing admin authorization remains the authority; Build 297 does not widen access.

## Deliberately not changed
- no admin behavior change
- no API contract or endpoint change
- no database or schema migration
- no pricing, package, membership, recurrence, maintenance economics or booking-policy change
- no payment-provider or sales-provider decision
- no new customer or staff permissions

## Validation package
- `scripts/build297_release_check.py` proves exact extraction from the accepted Build 296 Production source.
- `scripts/build297_http_smoke.sh` performs read-only Development HTTP validation.
- `.github/workflows/build297-source-gate.yml` protects the feature branch.
- `.github/workflows/build297-development-source-gate.yml` protects `dev` through Build 297.
- `.github/workflows/build297-development-acceptance.yml` validates the deployed Development runtime.
- Retained focused guards through Build 296, Build 290 authorization/restore proof, cumulative release checks, one-H1 checks, and route-copy parity remain required.

## Promotion boundary
Build 297 is not Production-approved merely because its source exists. Production promotion remains closed until the exact Development SHA passes the Build 297 source/runtime gates, retained acceptance, and Cloudflare exact-SHA deployment/convergence checks.
