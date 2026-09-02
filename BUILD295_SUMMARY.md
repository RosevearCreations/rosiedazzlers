# Build 295 — Customer Account Static Source Authority Cleanup

## Purpose

Build 295 makes the static `/my-account` source itself agree with the customer/privacy and maintenance boundaries already enforced by Builds 288, 291 and 294.

## Delivered

- removes customer-visible staff-private Admin-only note controls from both My Account route copies;
- removes customer controls for staff-owned next-cleaning due date, next-service mileage, service cadence and auto-scheduling;
- removes those dead/staff-owned keys from browser-side customer profile/vehicle payloads;
- removes staff-owned due/cadence/service-mileage presentation from customer garage cards;
- replaces legacy completed-Complete-Detail maintenance conversion/pricing copy with maintenance-interest-only language;
- keeps `/maintenance-plan` as the dedicated interest path;
- keeps Build 288 privacy and Build 294 maintenance adapters as defense in depth, even though static account safety no longer depends on them;
- makes `my-account.html` and `my-account/index.html` exact route copies;
- strengthens the retained Build 294 guard so it accepts the original hidden-control shape or the stronger Build 295 source-level removal, never a partially removed boundary.

## Authority boundary

Build 295 does **not** approve or create:

- a fixed maintenance cadence;
- maintenance price or discount;
- priority booking;
- a maintenance appointment;
- a subscription;
- recurring billing;
- customer ownership of staff scheduling/planning fields;
- customer write access to staff-private notes.

Current booking, availability, vehicle condition, service scope, deposit and payment rules remain authoritative.

## Data / schema

There is **no schema migration**. Existing historical/staff scheduling data remains intact. Build 295 removes stale customer source authority only.

## Validation

- `scripts/build295_release_check.py`
- `scripts/build295_http_smoke.sh`
- `.github/workflows/build295-source-gate.yml`
- `.github/workflows/build295-development-acceptance.yml`
- cumulative Development source gate through Build 295
- retained Builds 271–294 guards, including forward-compatible Build 294 authority validation
- one-H1 and route-copy parity guards

Production remains closed until the exact Build 295 candidate passes feature source/Cloudflare preview, exact `dev` passes Development source/runtime/Cloudflare acceptance, a normal promotion merge reaches `main`, and Cloudflare Production succeeds on the exact resulting `main` SHA.
