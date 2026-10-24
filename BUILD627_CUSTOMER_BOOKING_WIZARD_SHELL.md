# Rosie Dazzlers — Build 627: Customer Booking Wizard Shell, Progress & Accessible Help

## Outcome
A **progressive enhancement of the existing five-step live booking planner**, rather than a replacement checkout or an unapproved quote-first conversion. Existing Book page embeds `booking-planner.html`, so this change improves the actual customer wizard without altering customer pricing, booking records or payment processors.

## Implemented
- `booking-planner.html` now includes a native five-step `<progress>` element, readable progress text, a polite step-change announcement, and an expandable **circled-i** explanation of the journey, pricing, eligibility, booking holds and deposit boundaries.
- `assets/booking-wizard-v627.css` formats the step navigation as responsive cards (five across on desktop, three or two across as space narrows), with keyboard focus rings, high-contrast labels and reduced-motion support.
- `assets/booking-wizard-v627.js` is additive only: observes the existing `data-step` and `hidden` states, sets `aria-current="step"`, associates buttons with step panels by `aria-controls`, labels visible panels, announces changes and focuses step headings after a user-initiated step change. The planner's own `gotoStep`, `validateStep`, availability and checkout handlers are not overridden.
- Progress percentage describes **form steps, not confirmed booking or payment success**. A booking is confirmed only after payment and server confirmation.
- `scripts/build627_customer_wizard_usability_test.mjs` checks step labels and boundaries, route mirror parity, visual/accessibility hooks, and that checkout remains untouched.

## Customer flow retained
1. Choose date, service area, available slot and vehicle.
2. Select the price-specific base detailing package.
3. Choose compatible add-ons (inspection-led work gets an estimate).
4. Acknowledge location/site rules and review the vehicle.
5. Enter contact details and review before continuing to the existing payment provider.

The previous `/book` service selection and summary stays active; the iframe embeds the enhanced planner. The optional Build 625 vehicle fit check remains available. Approved Basic Detail prices stay at **CAD $229 small / $269 mid / $309 oversize** and the existing deposit remains unchanged.

## Acceptance / limitations
- Node: `node scripts/build627_customer_wizard_usability_test.mjs`.
- Verify on desktop, tablet, mobile, keyboard-only and screen-reader: step navigation, validation errors, focus after step change, iframe resize, date/area entries and payment redirection boundaries.
- Verify no customer-facing style regressions to `/book`, `/booking-planner.html`, and `/booking-eligibility-preview.html`.
- No user identity or payment details are persisted by this feature; no new requests to external endpoints are introduced.
- **No fabricated live appointments or payments**. Regression checks do not replace real browser accessibility acceptance or Stripe/PayPal sandbox tests.
- GitHub `source checks` and protected promotion plus exact-main Cloudflare Production GREEN required before closure.

Next logical Builds 628–631: step-level inline explanations, meaningful service-card comparisons, saved-progress handoff UX and final-review accessibility/validation acceptance.
