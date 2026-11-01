# Build 735 — Existing Owner Schedule Reconciliation & Starting-Price Presentation

**Disposition:** The Basic Detail **three-size schedule was already owner-approved** in Build 624. Build 735 does **not** ask for fresh approval of unchanged values and does **not** make any database, checkout, booking, or provider mutation.

## Already-approved Basic Detail schedule (CAD, before HST)

| Vehicle size | Public starting price | Authority |
| --- | ---: | --- |
| Small car / compact | **Starting at: $229** | Build 624 existing owner approval |
| Mid-sized crossover / SUV | **Starting at: $269** | Build 624 existing owner approval |
| Oversized SUV / van / truck | **Starting at: $309** | Build 624 existing owner approval |

The bundled public and Cloudflare Functions catalog JSON, the commercial-accuracy projection, and the retained checkout contract already include these three amounts. The unused legacy `assets/config.js` shadow map still held $115/$135/$170; Build 735 aligns only that inactive reference with the existing approved values so it cannot be mistakenly reused later. The active pricing catalog is not overwritten.

## Read-only source verification

Existing Admin `/api/admin/pricing_source_parity_614` continues to compare the bundled catalog, the authenticated App Management pricing row when available, the checkout/quote projection, and the expected public API projection. Build 735 adds a **three-row Basic Detail owner schedule readback** to the protected Admin view and report. Each row separately identifies the approved reference, bundled, DB (or **not verified**), checkout and public amount. An actual mismatch is flagged for owner review, not silently corrected or approved. No missing DB source is described as verified.

The public package cards retain all three distinct size prices. Each marketing/service price says **“Starting at:”**; the booking planner's package selections, optional add-on cards, service comparison, live chart headers, specialty-condition guide amounts and landing summary use equivalent wording. Missing amounts say **Confirm price / Ask for price / Condition quote**, never **$0.00**. Quoted work remains clearly subject to scope review.

The booked/quoted price-display modules are cache-versioned at `20261101build735`. Public booking and planner module imports, the shared catalog wrapper, and actual landing-page script tags are updated so existing browsers receive the revised display language without relying on stale earlier Build 336/388 imports. Historical audit comments are unchanged.

**Important financial boundary:** Deposits, HST, actual booking totals, order balances, gift-card denominations, invoices and paid receipts are exact transactional amounts, **not** “starting at” marketing prices. Add-ons, unusual condition and taxes may change the final booking amount; the planner must revalidate current authoritative pricing before checkout. A starting price is neither a guaranteed quote nor an automatic authorization to bill a different amount.

## Verification boundaries

- `scripts/build735_canonical_pricing_starting_at_test.mjs` checks three owner-approved tiers, two fallback catalog copies, projection and inactive legacy parity, synthetic unchanged/stale/unavailable DB source cases, 39 specialty-condition price labels, route mirrors, protected GET-only review and unchanged checkout/deposit semantics.
- The canonical booking regression and source gate are required before `dev → main` promotion, followed by Cloudflare exact-SHA Production acceptance and release health GREEN.
- No authenticated live App Management DB response, owner actual-device review, tax computation, or real payment is manufactured by this source test. Any genuine DB/source discrepancy remains for separate owner review and an explicitly approved price change.
