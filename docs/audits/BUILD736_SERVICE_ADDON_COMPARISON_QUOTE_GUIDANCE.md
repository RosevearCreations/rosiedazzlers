# Build 736 — Service/Add-On Comparison & Quote-Required Guidance

**Decision:** Customer-facing package comparisons and add-on explanations read the current canonical pricing catalog; no amounts, provider permissions, taxes, deposits, bookings, database records or checkout rules are changed. Build 735's existing owner-approved Basic Detail starting-price schedule remains **Small $229 / Mid $269 / Oversized $309**.

## Customer-facing behaviour

- `/book` offers expandable inclusion/exclusion details on all five packages. “Not listed” means present in other catalogue packages but not in this one's published inclusions. Conditional notes such as **“Where equipped”** remain attached to the included work. The side-by-side comparison provides all three starting-price tiers as well as the selected-size summary, scope differences, deposit and photo-review status.
- All 24 specialty add-ons have source-derived starting-price explanations. Where vehicle-size tiers are published, show **Small, Mid-sized and Oversized** individually rather than assuming Mid for an unknown vehicle. An add-on without a published positive price says **No fixed amount / Confirm price** rather than $0.
- Catalogue entries with `quote_required` or `pricing_mode: condition_assessed` show an explicit **individual quote required** disclosure, a real `pricing_basis` for why assessment is needed, and a no-diagnosis/no-guarantee note. **Tint, ceramic, graphene** and other variable-condition services retain indicative starting prices; they are not mistaken for a final quotation. Other add-ons retain `Starting at:` language without a false fixed-price promise.
- The proven booking planner shows the same size and quote explanations. On `/book`, the existing optional add-on controls start empty, use explicit customer toggles, and keep quote-required extras out of estimated fixed subtotals. Customer click selection or an intentionally supplied return link can carry an add-on for review; no silent selection or condition diagnosis occurs. A quote-review selection is not consent to charge.
- Rich media add-on cards keep their working controls and guide links while wrapping long prices and showing the same three tiers. Styles have 720px and 340px responsive rules; the canonical `/book` and `/book/index.html` remain identical.

## Source and trust boundaries

`assets/service-addon-guidance-v736.js` is a pure read-only formatter that receives the current catalog object. It has no network access, storage, checkout, or mutation path, and it does not introduce another price table. The current public bundled catalog and Cloudflare Functions server fallback are asserted identical. The price-source review of Build 735 remains owner-only and read-only. Any genuine external App Management database discrepancy is for subsequent owner review, not a reason to edit the authoritative price automatically.

Displayed `Starting at:` amounts are before HST, with condition, accessibility, vehicle size, location and worksite suitability still subject to review. Exact deposit, tax and payment calculations are retained in their existing transactional code. No provider activation, auto-upgrade, automatically diagnosed condition, payment, or actual booking is performed by a comparison card.

## Acceptance

- `node scripts/build736_service_addon_comparison_quote_guidance_test.mjs` covers price-source parity, package inclusions/exclusions, three tiers for all available package/add-on prices, quote-required cases and missing price safeguards, preview/planner/rich-card routes, initial add-on emptiness, copy and responsive overflow constraints.
- `bash scripts/current_booking_wizard_regression.sh`, `bash scripts/current_source_gate_contracts.sh`, release hygiene/check scripts and existing commercial/Build 624/735 pricing regressions must pass before promotion.
- Promotion requires PR source gates for both `dev` and `main`, Cloudflare exact-main-SHA Production acceptance, and independent release health **GREEN**. Live `/book` desktop/mobile and quote/add-on display should be spot-checked after deployment.
