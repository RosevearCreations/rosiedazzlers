# Build 312 — Inventory data-integrity sweep

## Release boundary

Build 312 hardens the accepted Inventory Operations data path without changing schema, pricing, accounting policy, authorization, or Production. It fixes deterministic integrity risks proven in the accepted Build 311 source and records a read-only database audit rather than guessing at live-data repairs.

- Accepted final Build 311 Development SHA: `1364289339555ba31d7c84b7ef1b8a48c28ece76`.
- Build 312 feature branch final SHA: `1e077eed673f7b7d743e0b3c12f9a54ad886816b`.
- PR #59 merged to pre-documentation Development SHA: `33aa012a0fcedb51bc7d23e3f8fb6095b4eb9290`.
- Accepted Production/main remains Build 303 at `09442c53d385aca7995150ace4bde55abd51d7df`.
- Build 312 has **no Production promotion authorization**.

## Deterministic integrity corrections

Build 312 corrects source-level defects that could corrupt inventory state:

- manual stock decreases now reject an overdraw instead of silently clamping the result to zero;
- inventory adjustment arithmetic is normalized to the existing three-decimal quantity precision;
- purchase-order receipt is replay-safe, so submitting `received` again cannot add the ordered quantity twice;
- successful purchase-order receipts record a corresponding inventory movement with the purchase-order ID as source evidence;
- receipt failure paths attempt stock/movement cleanup before returning an error and leave the order unreceived when finalization cannot complete;
- future inventory saves reject non-finite/negative quantity, reorder, cost and rating-count values, while rating values remain bounded to 0–5;
- new reorder requests require a finite positive explicit quantity and a finite non-negative unit cost;
- the existing fallback of one unit remains available when a legacy saved reorder quantity is zero and the caller does not explicitly override it.

## Read-only database audit

The connected RosieDazzlers Supabase project was inspected with SELECT-only queries. No rows, schema objects, functions or policies were changed.

Observed boundary at Build 312 review:

- 39 catalog inventory items;
- zero negative stock, negative reorder-point, negative cost, invalid rating or negative rating-count findings;
- zero duplicate normalized-name groups;
- zero duplicate ASIN groups;
- zero duplicate vendor/SKU groups;
- zero inventory movements, posting batches, posting rows, purchase orders or creative-project inventory reservations at the time of the audit;
- therefore zero orphan/reference, arithmetic, rollup or posting/reservation mismatch findings in those currently empty relationship tables;
- one active reorderable legacy item, `10_hceramic_coating` / `10 HCeramic Coating`, has `reorder_qty = 0`.

That single legacy row was **reported but not mutated**. The connected Rosie Supabase project has no isolated Development database branch, and the existing reorder-request path safely defaults an unspecified legacy zero reorder quantity to one. A live-data rewrite was therefore neither necessary nor authorized.

## Regression authority

Build 312 adds or retains:

- `functions/api/_lib/catalog-integrity.js` — shared three-decimal quantity planning, numeric validation and receipt-replay detection;
- `scripts/build312_inventory_integrity_audit.query` — deterministic read-only integrity query across inventory, movements, posting batches/rows, purchase orders and reservations;
- `scripts/build312_inventory_integrity_test.mjs` — focused source/behavior checks for overdraw, precision, validation and receipt replay;
- `scripts/build312_release_check.py` — fail-closed Build 312 changed-file, schema, retained-authority and audit-read-only boundary;
- `scripts/build312_http_smoke.sh` — read-only Development UI/API identity and anonymous fail-closed smoke;
- Build 312 source, Development source and Development runtime workflows;
- exact successor-aware Build 309/311 historical guards;
- a Build 301 Development source-hygiene exclusion only for the byte-for-byte Build 311 extracted runtime asset, whose preserved trailing whitespace was already part of the accepted source.

## Accepted pre-documentation evidence

On exact Development feature merge SHA `33aa012a0fcedb51bc7d23e3f8fb6095b4eb9290`:

- Build 312 Development Source Gate run `33770506099`: **SUCCESS**;
- Build 312 Development Runtime Acceptance run `33770506175`: **SUCCESS**;
- Cloudflare Development Acceptance run `33770505966` / #104: **SUCCESS**;
- retained Build 309 Development Source Gate run `33770505920`: **SUCCESS**;
- retained Build 309 Development Runtime Acceptance run `33770505929`: **SUCCESS**;
- Build 301 Development Runtime Acceptance run `33770505868`: **SUCCESS**;
- Build 301 Development Source Gate run `33770505921` reached and passed every Build 271–301 release/authorization/cumulative check, then failed only because its historical generic `git diff --check` included the byte-preserved `assets/admin-catalog-v311.js` trailing-whitespace line.

The closeout repair excludes only that immutable extracted asset from the historical Build 301 whitespace scan. It does not weaken Build 301 release, authorization, schema, route or cumulative checks.

## Explicitly unchanged

Build 312 does not change:

- database schema, migrations, constraints, RLS or transactional posting RPC authority;
- live inventory rows or the reported legacy zero reorder quantity;
- pricing, package, booking or maintenance rules;
- accounting/tax policy or journal-account authority;
- role/module/action permissions or staff authentication;
- Inventory Operations UI behavior outside corrected error/integrity handling;
- payment-provider or external-publishing authority;
- Production source or Production data.

## Closure rule

The Build 312 feature/runtime boundary is GREEN on exact Development SHA `33aa012a0fcedb51bc7d23e3f8fb6095b4eb9290`. Build 312 becomes the final documentation-synchronized Development boundary after this summary, queue checkpoint and narrow Build 301 historical hygiene compatibility repair are merged to `dev` and that exact closeout SHA again passes Build 312 source/runtime, retained historical source gates and Cloudflare Development acceptance.

## Next autonomous build

**Build 313 — Catalog/Product Administration extraction:** separate the Product/Catalog administration runtime while preserving existing pricing, product, inventory-link and authorization authority exactly. It is a maintainability extraction, not a pricing or product-policy redesign.
