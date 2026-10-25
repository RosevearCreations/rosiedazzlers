# Build 650 — Contextual Booking Help & Selection Readiness

Build 650 provides understandable, keyboard-friendly customer guidance on the existing canonical booking page.

- Plain-language, expandable information helps customers distinguish catalog price, quote-required work, deposit and confirmation.
- Readiness indicators reflect the selected live-catalog vehicle size and package, optional quote-required add-ons and whether the embedded planner has been started.
- The next-step shortcut guides incomplete selections back to service choice and complete selections to live availability.
- Crucially, the display never claims that availability is reserved, that a price is final, or that a deposit has been paid. It remains informational alongside the server-authoritative planner.
- Adds accessible `ⓘ` signals, aria-live status, keyboard focus and responsive styling in the Standard theme.

## Verification and boundaries

`scripts/build650_booking_readiness_test.mjs` runs from the retained booking wizard regression wrapper. Both booking route files remain byte-identical. Existing booking recovery and touched-planner safeguards remain in place.

This is not a checkout, tax, pricing, booking status, winter eligibility, Stripe or Supabase modification. Real-device testing remains a separate operator acceptance step.

Promote only after protected dev/main suites A–D, aggregate source checks, Cloudflare exact-SHA Production proof, and live HTTP smoke pass.
