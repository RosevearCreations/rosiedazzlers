# Build 629 — Service-Card Comparisons & Customer Package Decision Clarity

## Objective
Help customers decide between existing detailing packages using **the current editable Rosie Dazzlers pricing catalog**, not a second set of static prices or an unapproved new service tier. This build does not change checkout, Stripe/PayPal, booking holds, deposit calculations, service availability, or customer data.

## Delivered
- `assets/booking-service-comparison-v629.js`: pure comparison data builder for at most three distinct package codes. Reads `name`, `display_alias`, `best_for`, `customer_goal`, `included_services`, `prices_cad[vehicle_size]`, `deposit_cad`, and `photo_estimate_recommended` from the **already-loaded live catalog**.
- `assets/booking-service-comparison-v629.css`: responsive choice controls and horizontally scrollable keyboard-focusable semantic table. The service inclusion matrix uses exact catalog service names.
- `book.html` and `book/index.html`: synchronized side-by-side comparison below the package cards. Defaults to Basic Detail and Complete Detail; users can select up to three packages. Price display depends on selected small/mid/oversize size and shows **choose vehicle size** if absent. A compare-table Select button invokes the existing `data-choose-package` booking selection handler, preserving add-on eligibility pruning and planner prefill.
- `booking-planner.html`: explicit comparison link in Step 2, opening in a new tab to avoid destroying a partially completed booking.
- `scripts/build629_package_comparison_test.mjs`: catalog rates and deposits, service inclusions, owner future edits, empty/missing values, duplicate cap, route parity, planner navigation and no payment side effects.
- The existing **Current Source Gate suite A** includes `node scripts/build629_package_comparison_test.mjs` and syntax checks for the new module.

## Display contract
1. The three vehicle-size price columns are **not cleaning tiers**; the compared columns are the actual package codes.
2. Basic Detail remains CAD **$229 / $269 / $309** for small / medium / oversize at the time of this build, with the unchanged CAD $50 deposit. Future catalog edits flow through automatically.
3. Each inclusion is based on `included_services`. “Not listed” does not assert that a particular procedure is prohibited; only the current catalog describes package scope.
4. Add-ons and taxes are not included in these package-only displayed amounts. Quote-required specialty work remains an inspection/staff-review decision.
5. Selecting a package in the comparison invokes the existing public booking card and its compatibility checks; no new booking or payment endpoint is called.
6. No personal information is saved or transmitted by the comparison module.

## Acceptance
- `node scripts/build629_package_comparison_test.mjs` alongside Build 627 and 628 regressions.
- Verify current package names, price-by-size, included services, descriptions and deposits against `/api/pricing_catalog_public` in Production.
- Check comparison of 1, 2 and 3 packages, fourth-selection disabled, change selection, keyboard, mobile 320/375 px horizontal scroll and screen-reader caption.
- Choose a package through the comparison and verify the standard `/book` booking summary and iframe receive the selected package without losing availability or add-on filtering. Test no customer charge.
- Verify identical `book.html` and `book/index.html` route copies; planner Step 2 opens the comparison in a new tab.
- Re-run protected source checks on the *exact* release candidate, promote with protected dev/main policies only, and independently verify exact-main SHA Cloudflare Production GREEN. A merged PR or HTTP 200 is not deployment proof.

## Next logical build
Build 630 — **Booking Draft Persistence, Safe Return & Planner Handoff UX**. Preserve the existing browser-tab-only recovery and guard against private-data exposure, accidental duplication, stale price or slot reuse.

**No customer booking, payment, tier or public theme change is authorized by Build 629.**
