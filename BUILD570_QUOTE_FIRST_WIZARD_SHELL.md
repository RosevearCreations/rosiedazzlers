# Build 570 — Quote-First Guided Wizard Shell (Preview Only)

## Release scope
Implements the accessible, client-only prototype UI proposed by Build 569's design. **No public site navigation or existing booking/price/lead/payment endpoint is modified.** Route: `/preview/quote-first/` (self-labeled preview, `noindex,nofollow,noarchive`). This is not the future public launch. Any feature preview URL contains only test selections in memory, no personally identifying fields and no submission path.

- Five steps: vehicle size → main service goal → condition → optional add-ons → review.
- Keyboard-focus-visible controls, explicit selected states, readable mobile cards, a progress indication, form validation and next/back navigation; memory-only state.
- Review shows **suggested discussion**, not a quoted price, confirmed eligibility, spot availability, appointment or obligation.
- Links to the currently live `/book` system rather than replacing it. Rosie bringing ordinary water/power is stated; safe access/weather remain subject to staff review.
- No customer name, street address, e-mail, phone, photo, token, public price, API request, storage, cookie, browser analytics or payment integration.
- No new server routes, schema migrations, environment variables, pricing rules, permission changes or provider dependencies. Never collect production customer data to test a preview.
- CSP and accessibility behavior must be verified on actual Cloudflare feature preview, especially the page's module loading, focus, keyboard navigation and viewport rendering. Automated model tests are source evidence only, not proof of real-device accessibility.
- Existing `pricing.html`, `services.html`, `book.html`, `booking-planner.html`, site home, cart and Stripe remain byte-for-byte untouched.

## Dependency/release safety
Build 569 PR #366 must first be independent protected-main code Production GREEN; similarly Builds 563–568 must reach GREEN sequentially. Build 570 feature PR is **stacked behind 569** and may not target `dev`/`main` until predecessor promotion. After exact current feature CI and Cloudflare preview proof, promote through development and a protected main PR only with required source/business checks, exact Cloudflare production deployment and runtime smoke. Do not mark Build 570 GREEN from source checks alone.

## Future Builds 571–575
Owner must approve live price display policy, actual App Management catalog parity, quote-first vs direct booking CTA, customer lead/consent/retention and real media assets. These are separate future releases; Build 570 does not activate them.

## Validation
`node --check assets/quote-first-wizard-model-v570.js`; `node --check assets/quote-first-wizard-v570.js`; `node scripts/quote_first_wizard_570_test.mjs`, plus dedicated feature/PR job `Quote-first preview model safety`.
