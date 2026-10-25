# Build 649 — Customer Service & Add-On Discovery

Build 649 adds functional, source-driven discovery to the current canonical `/book` experience.

- Customers may search currently offered packages and narrow by typical inside/outside/complete/upkeep intent. Intent matching is plainly guidance based on the live catalog's own names/descriptions, not an eligibility decision or pricing override.
- Add-on search narrows long options without removing choices or affecting selected extras.
- Visible option counters and reset controls are accessible on keyboard and mobile.
- Package comparison's "Choose" action clears any discovery filter first, so selecting an otherwise hidden package still works.
- Filtered choices never modify selected package, add-ons, estimate, URL, current planner form, payment or hold state.
- New scoped CSS maintains existing Standard branding and 720px responsive handling.

## Verification / boundaries

`scripts/build649_booking_discovery_test.mjs` is included in the current booking source-gate wrapper. All route copies are identical. Passing source tests does not substitute for device and authenticated payment tests.

Checkout, Stripe, Supabase, scheduling, pricing, winter eligibility, deposit and write operations remain untouched. Publish only after protected dev/main suites A–D, aggregate source checks, exact SHA Cloudflare Production acceptance and live route checks.
