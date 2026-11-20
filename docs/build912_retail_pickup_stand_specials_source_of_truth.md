# Rosie Dazzlers Build 912 — Retail, Pickup / Stand Requests, Remote Specials, Customer Interest & DAIP Supplier Links

Status must be determined from **the exact protected \`main\` commit, applied original database migration, independent GitHub checks, Cloudflare production deployment and live HTTPS tests**. Presence of this file is not proof of rollout.

## Features added in Build 912
- Responsive customer \`/retail.html\` storefront requests from **staff-approved, stock-positive original Rosie merchandise** only. The server, not the browser, calculates every product unit price and line total in CAD.
- Original SKU/price/stock inventory listing source separate from detailing service catalog; no synthetic products or inventory records are inserted.
- Verified customer account \`/api/client/retail_order_v912\`: server-priced pickup or event-stand request; 12 lines maximum, quantity and stock limits, a per-customer idempotency key and SHA-256 snapshot digest; original-source readback required.
- **No payment attempt or stock reservation** is made by submitting a request. Customer order history is scoped by verified account, not by user-provided email.
- Staff-only \`/admin-retail-912.html\`: publish products with explicit approval; create pickup/stand/remote-service locations and time-limited specials; review or cancel unpaid requests. Staff requires real signed session plus operations/admin action permission; no bridge or legacy administrator fallback.
- Remote location specials: original staff-defined active service zone, date window, percentage proposal (1–50%) and \`quote_required=true\`. Cannot auto-discount a checkout or override travel/site eligibility.
- First-party interest: **explicit account consent at time of action**, deduplicated by verified customer/product/event/day in original private database. Admin sees bounded **aggregate interest counts**, never customer emails, public user identities, advertising pixels or third-party audience exports.
- Build 911 original VEVOR/supplier-review UUID may be attached privately to a retail SKU. The customer catalog never includes the private supplier draft, video preview, DAIP project ID or raw media. The supplier relationship is not an endorsement, receipt, ownership claim or publication permission.
- New restrictive RLS tables: \`rosie_retail_products_v912\`, \`rosie_retail_locations_v912\`, \`rosie_retail_specials_v912\`, \`rosie_retail_order_requests_v912\`, \`rosie_retail_interest_v912\`. All anon/auth grants revoked; server service role only.
- CI test coverage: private supplier/DAIP boundaries, unsigned and cross-origin rejection, stale/forged cart totals, unapproved/out-of-stock goods, inactive or wrong-mode sites, expired remote specials, RLS grants, opt-in and no-charge copy. Build 910–911 regression suites retained.

## Business acceptance: what is NOT yet proven
This is a **retail-request foundation**, NOT full live retail or a genuine POS. No original retail purchase, provider payment, product shipment, stand terminal charge, inventory transfer, printed receipt, refund, travel estimate acceptance, staffed pickup handoff, or phone/tablet/desktop checkout has been witnessed. A private product with \`publish_approved=true\` is owner-maintained catalog state, not independent stock custody proof.

The 13% Ontario HST displayed is an **illustrative estimate only**, not a tax invoice, accountant-approved tax position, or the final amount due. No tax is posted to the general ledger. Physical orders and remote detailing specials are kept separate; specials never modify the existing canonical detailing checkout without a verified quote and travel rules.

The staff \`quoted\` request state signifies an internal review decision only. It must not be represented to a customer as an invoice, payment authorization, stock reservation, booking or committed pickup window. No automated email or social send occurs.

## Original source-of-truth progress
Build 911 documented a **48-domain full-company planning estimate ~50.1% ±10–15 points**, versus the earlier 26-category core-service 66.9% estimate. Build 912 adds substantial code coverage to retail, local operations, customer interest and supplier linking, but **does not increase the independently verified full-business completion score** without original database/live provider/device transactions. A 5–10-point increase is a *target contingent on evidence*, not something that can be declared from new code alone.

Tracked categories advanced in architecture/implementation but still require acceptance:
- Retail products, cart and checkout: **request stage implemented; paid checkout HOLD**
- Local pickup/drop-off, event stand and POS: **pickup/stand request stage implemented; physical handoff/POS HOLD**
- Remote specials, travel/territory: **quote-only special publishing implemented; actual travel pricing HOLD**
- Customer-interest and funnel analytics: **private opt-in counts implemented; attribution/repeat conversion HOLD**
- Supplier/VEVOR and DAIP: **private link implemented; receipt, consent, approved publication and social analytics HOLD**
- Security and privacy: **signed staff, verified customer, RLS and same-origin protections implemented; full pen-test, MFA, CASL and retention/erasure witness HOLD**
- Refunds/finance: **no change to original payment authority; settlement, accounting, HST and refunds HOLD**

## Required promotion verification
1. GitHub PR from implementation branch to \`dev\`, required checks all success, no pending/failures.
2. Apply original Rosie Supabase migration once; verify \`pg_class.relrowsecurity\`, exact grants and no \`anon\`/\`authenticated\` select, insert or update.
3. Test original empty-source state (no invented product, location or order); signed-in owner can create a real SKU/location and see readback, authenticated customers only see approved sale items.
4. Verify actual original customer order request, cross-account isolation, duplicate request replay, stale price/stock rejection and explicit optional analytics consent on desktop/mobile/tablet.
5. Check Cloudflare exact dev SHA deployment, preview HTTPS, Functions and tests, followed by protected PR \`dev\` → \`main\`; verify Cloudflare production exact SHA and production business acceptance/release health and CI budget.
6. Mark software PRODUCTION GREEN **only** when all code/deploy gates pass. Keep all field-commerce and external master integrations on operational HOLD until independent witnessed evidence.

## Next queued
**Build 913 — Original Retail Payment/Refund Settlement, Issued Invoice/HST Evidence, Stand POS and Pickup/Drop-off Fulfillment Acceptance.** Integrate payment callbacks and bank reconciliations into the original finance ledger without synthetic receipts, then test actual operator/physical-device handoff and CASL-safe notifications.

## Original verifiable sources
- Existing Build 911 scope: \`docs/build911_full_business_source_of_truth_scope.md\`
- Existing quote and booking authority: \`functions/api/checkout.js\`, \`functions/api/client/booking_continuity_v909.js\`
- Existing supplier and DAIP controls: \`functions/api/admin/supplier_reviews_v911.js\`, \`functions/api/admin/daip_media_workflow.js\`
- Supabase RLS: https://supabase.com/docs/guides/database/postgres/row-level-security
- Canada material-connection disclosure: https://competition-bureau.canada.ca/en/deceptive-marketing-practices/types-deceptive-marketing-practices/influencer-marketing-and-competition-act
- CRTC CASL: https://crtc.gc.ca/eng/com500/guide.htm
