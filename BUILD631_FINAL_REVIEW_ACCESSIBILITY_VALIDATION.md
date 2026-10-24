# Rosie Dazzlers Build 631 — Final Review, Accessibility & Validation Acceptance

## Release scope
Improve the canonical five-step customer booking planner’s final review and validation. Repair the two **stale regression assertions** identified after the verified Build 630 release. Preserve existing catalog pricing, available dates, held slots, checkout and provider payment authority, customer records, policies and themes. This is a release of UI and test code only.

## Changes
1. `assets/booking-final-review-v631.js` — pure, read-only final contact validation and explicit non-binding review disclosure. Validates full name, email syntax, service address and optional Canadian postal code, with field-specific error messages. No API, storage, booking or payment calls.
2. `booking-planner.html` — Step 5 now has an accessible labeled summary, edit controls for steps 1–4, clearer warning that the displayed amount is an estimate and the server checks price/availability again, a live checkout error area, focus management, and `aria-invalid` for corrected contact fields. Reuses the same `/api/checkout` endpoint with unchanged payload, pricing/deposits and server authority.
3. `assets/booking-final-review-v631.css` — mobile-responsive final review, visible focus and validation states, reduced-motion handling.
4. `scripts/build339-vehicle-form-ux-gate.mjs` — accepts the approved versioned deferred `site-policies.js` script, without requiring an obsolete unversioned literal.
5. `scripts/build404_error_recovery_weak_connection_reliability_check.py` — enforces active `rd_booking_draft_v630` with old `rd_booking_draft_v380` purged and no PII-bearing legacy draft restoration. It no longer falsely requires the insecure old key as active.
6. `scripts/current_booking_wizard_regression.sh`, `scripts/build631_final_review_validation_test.mjs` and `.github/workflows/development-source-gate.yml` — source gate requires Builds 627–631 booking regressions plus the repaired 339 and 404 legacy assertions, preventing a release where these known failures are ignored.

## Privacy, cost and booking boundaries
- No new local/session storage, no new personal-information persistence and no automatic confirmation/slot reservation.
- No change to approved Basic Detail prices of **CAD $229 / $269 / $309** or the current $50 deposit. The live catalog remains authoritative for future owner edits.
- The customer reviews current date, slot, vehicle class, base package, optional treatments and the deposit estimate; final payment and confirmation continue through the existing server validation and payment provider.
- An invalid email or missing service address fails validation before checkout; errors are readable by screen readers and focusable.
- No user booking, sandbox payment or real charge was created just to generate test evidence. No claim of browser/provider acceptance is made until those tests are actually executed.

## Acceptance commands
`bash scripts/current_booking_wizard_regression.sh`
`node scripts/build339-vehicle-form-ux-gate.mjs`
`python3 scripts/build404_error_recovery_weak_connection_reliability_check.py`
`node --check assets/booking-final-review-v631.js`
`node scripts/build631_final_review_validation_test.mjs`

Manual checklist: keyboard/tab order from prior steps, Edit controls return focus to the step heading, invalid email/postcode/name/address errors and screen-reader announcements, mobile 320/375/768 px layout, no pay-on-click duplicate behavior, screen text not implying confirmed booking, network/409/503 payment failure returns to an editable review. Browser/sandbox checks remain required operational acceptance and are not replaced by Node source tests.

## Promotion gate
Protected feature → dev, then an isolated main-from-main production candidate if histories remain divergent. Require exact candidate GitHub source checks A–D and aggregate, protected promotion without bypass, then exact-main SHA Cloudflare Pages successful Production (Functions-enabled), immutable URL smoke and canonical `https://rosiedazzlers.ca` runtime smoke. **Only call Production GREEN with this exact-commit evidence.**
