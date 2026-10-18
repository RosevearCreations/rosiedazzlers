# Build 574 — Mobile Usability, Production Data Parity & End-to-End Booking Regression

## Bounded implementation
- Tightens the existing Build 570/573 **preview-only** quote-first mobile UI at 320–420px, with full-width calls to action, touch-sized controls, fluid cards, visible focus treatment and form overflow guards.
- Adds `node scripts/build574_mobile_booking_regression_test.mjs` as deterministic, non-customer-data regression evidence for the preview route, mobile CSS, production booking route continuity, consent, disabled intake, and non-booking contract.
- Re-run `node scripts/quote_first_wizard_570_test.mjs` and `node scripts/quote_first_intake_573_test.mjs` alongside Build 574 checks.

## Production parity and E2E acceptance (not inferred from source tests)
Record **only non-identifying** observations at the identical candidate SHA for:
1. 320px, 375px, 390px, 768px and desktop viewports; no horizontal overflow, visible focus, functional back/next, valid errors, readable text and touch controls.
2. Real-device Android Chrome and iOS Safari test results; keyboard and screen-reader coverage.
3. Production App Management packages, add-ons, active vehicle sizes, service areas, seasonal flags and actual availability versus customer-facing catalog. Report mismatches; never copy production data into Development.
4. Existing `/book` flow: size -> service -> add-ons -> contact -> slot -> deposit; verify unavailable/409 conflicts, retry/idempotency, fee/total parity, successful confirmation and failed-payment recovery using approved provider sandbox only. Never charge a real customer or create a real booking for a smoke test.
5. Quote-first flow: operational flag OFF remains no-write; authorized sandbox ON with Turnstile hostname, consent, duplicate submission and staff review -> staff-approved conversion through existing gated booking endpoint.
6. Cloudflare feature-preview, Development and Production deployments must each match their promoted SHA; record application runtime and externally observable evidence, not GitHub success alone.

## Safety and release boundaries
Existing public booking, pricing, admin catalog, Supabase schema, permissions, payment routes and providers are not modified. Quote intake remains independently disabled unless an owner deliberately activates it; no real production data is seeded or cloned. If data parity, device testing, E2E payment sandbox acceptance, exact-SHA Cloudflare deployment or required protected-main checks are missing, status is **HOLD / NOT GREEN**, even if CI succeeds.
