# Build 291 — Maintenance Retention Intake Authority

**Status: ACTIVE — Development-first**  
**Date:** 2026-09-01

## Purpose

Build 291 advances the retention track without inventing the commercial maintenance-plan rules that still require owner approval.

The customer-facing maintenance path is now an explicit **interest request** rather than a fixed recurring-service offer. It gathers useful demand/timing evidence while current booking, service review, availability, pricing, add-on, deposit, payment, site-access and vehicle-condition authority remain unchanged.

## What changed

- Static `/maintenance-plan` source now agrees with the retained public growth-settings authority before JavaScript hydrates.
- Fixed-cadence/priority-like fallback copy was removed from the static page.
- Timing choices are clearly labelled as **preferences only**.
- The interest form explicitly states that submission does not create an appointment, subscription or recurring billing authorization.
- The submit control is disabled while a request is in flight, preventing accidental repeat clicks.
- The public API allowlists timing preference tokens instead of accepting arbitrary cadence text.
- The server owns `source_url` as `/maintenance-plan`; the browser cannot supply it.
- The successful response is deliberately narrow and does not return the stored database row.
- Persistence/configuration failures return generic public errors instead of Supabase response details.
- Supabase service-role environment aliases remain supported without exposing them to the browser.

## Business-rule boundary

Build 291 introduces **no maintenance-plan economics**. It does not approve or promise:

- a fixed recurring cadence;
- a monthly/annual plan price;
- a discount or perk;
- priority booking;
- included/excluded recurring service scope;
- pause/cancel terms;
- recurring billing;
- an appointment simply because interest was submitted.

Those remain future business decisions.

## Data / migration boundary

There is **no schema migration**. Build 291 reuses the existing `membership_interest_requests` persistence shape and stores only an allowlisted human-readable timing preference plus the existing contact/vehicle-count/notes fields.

## Runtime acceptance

`scripts/build291_http_smoke.sh` is deliberately non-mutating. It verifies:

1. the canonical maintenance page is deployed with the Build 291 marker and source-safe copy;
2. stale fixed-cadence/priority wording is absent;
3. a missing-email POST returns 400 before persistence;
4. an invalid cadence token returns 400 before persistence;
5. GET remains 405;
6. validation responses do not disclose Supabase/storage details.

The smoke must not create a Development waitlist record.

## Retained authority

Build 290 authorization/direct-URL/API and forward-restore readiness remains intact and executable. Build 289 remains the Build 290 restore anchor. Build 288 remains the accepted Production release until a later deliberate Production promotion is explicitly authorized.

The owner-confirmed Stripe, PayPal and other provider state remains **Development configuration-present / owner sign-off** only; Build 291 does not alter payment authority or claim provider transaction acceptance.

## Release boundary

Feature branch: `build291-maintenance-retention-intake`.

Build 291 requires exact feature Source Gate + Cloudflare preview, then a non-force Development fast-forward, then exact Development source/runtime/Cloudflare acceptance.

**Production remains closed for Build 291.**
