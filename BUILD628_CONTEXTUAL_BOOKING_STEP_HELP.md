# Build 628 — Step-Level Inline Explanations & Contextual Help

## Purpose
Build on the existing accessible **five-step customer booking planner** (Build 627) with guided explanations exactly where customers need them. Do not alter pricing, service/package rules, availability authority, vehicle-size assignments, database, deposits, payment, checkout or public themes.

## Delivered
- `assets/booking-context-help-v628.js` registers exactly five customer-facing **circled-i help disclosures**, one per canonical `.wizard-step[data-step]`:
  1. Date, service area, AM/PM slot, vehicle-size class and conditions.
  2. Main cleaning service and size-based catalog prices.
  3. Fixed versus quote-required add-ons and optional gift/promo codes.
  4. Safe access, local bylaws and water/power/site requirements.
  5. Final contact/review, estimates and deposit payment/confirmation.
- Field hints attach to the actual date, area, vehicle-size and year, gift/promo, email and service-address inputs using **`aria-describedby`**, preserving any existing description IDs. They are visible without needing to open help.
- `assets/booking-context-help-v628.css` supplies keyboard-focus visibility, high-contrast layouts, responsive mobile sizing and reduced-motion treatment.
- `booking-planner.html` loads both modules without changing the native `validateStep`, `gotoStep`, checkout or payment handlers.
- `scripts/build628_booking_context_help_test.mjs` checks the five-step/field registry, DOM anchors, clean checkout boundary, and route-copy parity.
- The required **Current Source Gate — source checks suite A** runs the Build 627/628 booking-wizard regression scripts on exact CI commit.

## Required trust boundaries
- The current catalog and canonical checkout set prices, availability and deposit. **No static price claim is a new source of authority.**
- A displayed available date isn't a reservation; a quote-required add-on isn't automatically charged.
- Rosie Dazzlers brings standard water and power, but staff must still confirm safe access, weather and applicable bylaws.
- Guidance is **read-only and non-persisting**. It makes no calls to payment providers, does not save details, and cannot submit bookings.
- All current quote-first and public Standard-theme release HOLDs remain separate and unchanged.

## Acceptance
1. Run `node scripts/build627_customer_wizard_usability_test.mjs`, `node scripts/build628_booking_context_help_test.mjs`, and `node --check assets/booking-context-help-v628.js`.
2. Confirm all five details controls can open using keyboard/assistive technology; no selection or navigation changes when a help disclosure is toggled.
3. Verify eight inline guidance fields and their `aria-describedby` association within the intended step; verify idempotence after reinitialization.
4. Inspect responsive planner at 320, 375, 768 and desktop widths; ensure no height clipping or sticky overlays in embedded `/book` iframe.
5. Confirm original date/slot, package, add-ons, acknowledgements and final contact validation; reject invalid input in canonical checkout as before.
6. Confirm approved Basic Detail **CAD $229 / $269 / $309** and existing deposits remain unchanged.
7. Require protected `dev`/ `main` GitHub checks and a **matching exact-main-SHA** Cloudflare Pages Production GREEN deployment before declaring release complete.

## Following queued build
Build 629 — **Service-Card Comparisons & Customer Package Decision Clarity**, grounding comparisons in the editable live catalog rather than a second fixed price table.

No live customer booking or payment is created by this build.
