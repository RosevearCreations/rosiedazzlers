# Build 647 — Website Visual Repair & Responsive Layout

## Implementation

Repair the actual current customer surfaces: `/pricing` and `/services` are canonical redirects to the unified `/book` page, so the package/card/price/add-on repairs target `book/index.html`. Add `assets/build647-public-responsive.css`, loaded after Standard via `assets/site.css`, with scoped layout fixes at desktop, tablet, narrow mobile, and 380px breakpoints.

- Booking: readable heading and package titles, stable three-size price chips, wrapped add-ons and selection totals, mobile single-column flow, no horizontal clipping.
- Gift cards: responsive cards with readable gold/charcoal artwork fallback, consistent primary actions; preserve the existing `/gifts` purchase system.
- Maintenance interest: fluid form controls, readable summary rows and existing Photo Studio placeholder/fallback; fix obsolete `/pricing#booking-planner` link to `/book#booking`. The form remains interest-only, without subscription or booking changes.
- Refresh public stylesheet cache key on relevant canonical and compatibility routes. Preserve Standard theme variables and all dynamic Photo Studio/R2 assignments.

## Verification

`scripts/build647_public_layout_test.mjs` checks route structure, responsive selectors/breakpoints, single H1, Standard theme loading order, purchase/form preservation and canonical redirects. It runs inside the stable protected Source Gate booking regression wrapper alongside Builds 627–631.

## Boundaries

This is a visual/responsive repair, not a change to pricing, deposits, bookings, permissions, customer data or inventory. It does not claim live media coverage when Photo Studio images are unassigned. Actual device screenshots and customer UAT remain distinct from passing source tests.

Require protected dev/main suites A–D and aggregate GREEN, exact main Cloudflare Production deployment success, then live homepage/book/gift/maintenance HTTP checks before reporting GREEN.
