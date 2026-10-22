# Build 614 — Live Pricing Source Parity & Owner Review

## Decision boundary

**Read-only delivery. No price, tax, deposit, booking, checkout, payment, Supabase or publication settings were edited.** Owner resolution of the pricing authority is still required. A successful Cloudflare deployment of this diagnostic does **not** mean the prices agree.

## Verified evidence (22 October 2026)

| Source / consumer | Basic Detail small | Mid | Oversize | Evidence |
| --- | ---: | ---: | ---: | --- |
| Committed bundled JSON (`data/…` and `functions/api/data/…`) | $115 | $135 | $170 | Repository source at Build 613 main SHA `6bd7da6e` |
| Supabase `public.app_management_settings`, `pricing_catalog` row | $115 | $135 | $170 | Read-only SQL query of RosieDazzlers project `cwxhhvwpilmrfwxirixx`; row updated 2026-03-25 22:18:30 UTC |
| Expected checkout / quote-to-booking source | $115 | $135 | $170 | `functions/api/checkout.js` and `_lib/quote-booking-authority.js` call `loadPricingCatalog` directly, then price using `pkg.prices_cad[vehicleSize]` |
| Source-owned public API override | $229 | $269 | $309 | `functions/api/_lib/commercial-accuracy.js` overrides Basic Detail in `CANONICAL_PACKAGE_PRICES_CAD` after catalog load |
| Actual customer public API | $229 | $269 | $309 | HTTP GET `https://rosiedazzlers.ca/api/pricing_catalog_public` returns the three prices |

The customer booking pages use `assets/pricing-catalog-client-legacy.js` and normally pull the public endpoint, but they can fall back to bundled JSON on API failure. Consequently, **a display-to-checkout mismatch is possible**, and a fallback could show another set of prices. This is inferred from source, **not** from executing a charge or confirming a payment. No real booking or payment was created.

Other fields warrant review: `engine_cleaning` is `quote_required: false` in the stored catalog while source-owned commercial accuracy marks it `true` in the public API. More mismatches may be surfaced by the installed report. Financial impact needs owner assessment before implementing a change.

## Delivered owner-review surfaces

- Protected, read-only `GET /api/admin/pricing_source_parity_614` (requires staff `manage_staff`; other methods return 405). Reads the App Management row without writing. If the row is unavailable, reports an explicit unverified state; never invents DB parity.
- `admin.html` and `admin/index.html` display a price-source owner review below the existing catalog coverage diagnostics. The report compares bundled JSON, App Management values, **server checkout/quote prices** and the **public API projection** for package names, S/M/O prices, deposits, and add-on flags/prices. It distinguishes a modeled API projection from an actual independent HTTP check.
- Automated Build 614 test covers Basic Detail prices, quote-required differences, unknown DB state, authentication, and GET-only boundary.

## Owner decision required before corrective pricing build

1. Confirm whether **Basic Detail** should be $115/$135/$170 or $229/$269/$309 (or another specifically approved schedule).
2. Decide whether App Management should control both the public display **and** checkout/quote calculations, or whether source-owned overrides remain authoritative and must be reconciled across every consumer.
3. Approve the add-on `quote_required` source of truth, including engine cleaning, and confirm how quote-required add-ons must behave in checkout.
4. Only after those decisions, authorize a separately tested release covering booking preview, payment amount/deposit, staff quotes, catalog fallback, taxes, customer copy and price charts. No unapproved automatic catalog repair.

Release acceptance for Build 614: diagnostic GET tests, source guardrails and exact Cloudflare `main` verification may be GREEN; **pricing policy stays on OWNER HOLD** until the decisions above are made.
