# Build 741 — Gift Certificate Catalog, Checkout Recovery & Redemption Accuracy

## Source authority and verified baseline

- Read-only RosieDazzlers Supabase inspection on 2026-11-02 UTC: `gift_products` contains **19** rows (15 active service-size variants, three active fixed-value gifts and one active open-value product); `gift_certificates` has five records and `gift_certificate_redemptions` has zero. No purchase, send, redemption or balance mutation was used to establish that evidence.
- Live catalog already includes **`SVC-complete_detail-small`** (CAD 319.00), `SVC-complete_detail-mid` (CAD 369.00) and `SVC-complete_detail-oversize` (CAD 419.00). No product insertion or price rewrite is part of this build.
- The old `/gifts` form constructed `SERVICE-${package_code}-${size}` while the sellable `gift_products` SKUs use `SVC-…`. It also lacked five vehicle intake fields that the server required; service gifts therefore failed to start a valid checkout.
- The checkout route previously generated a fresh Stripe idempotency key on each retry. The booking gift-only branch separately posted redemption history and patched remaining balance without an atomic transaction, then could report confirmed even after either write failed. The mixed provider-payment branch displayed a gift discount without a matching settlement-time gift debit.

## Recovery and gift purchase behavior

1. `/api/gifts/catalog` reads only active, positive-priced, CAD fixed-value and service-size products from Supabase. It exposes no privileged key, purchaser, recipient or certificate records. Incomplete catalog requests fail closed.
2. `/gifts` and `/gifts/index.html` render current sellable SKUs and prices. The selected service gift carries the *actual* `SVC-…` SKU; vehicle year/make/model are collected from the recipient at booking, not required of the gift purchaser. A missing package-size pairing cannot checkout.
3. One tab keeps the draft and its UUID intent for up to one hour. A repeated request with identical terms reuses the same Stripe idempotency key and provider body; changed terms receive a new intent. Double-clicks are disabled while the call is pending. Network failures and canceled checkout preserve a safe draft; no card number, payment token or gift code is stored in the draft.
4. Stripe return is **not** treated as proof of paid gift issuance. `checkout.session.completed` must have `payment_status=paid` (or asynchronous payment success) and the preexisting Build 674 atomic issuance/owner-hold workflow still owns certificate creation. No new email delivery, resend, refund, or live provider activation is introduced by Build 741.
5. Receipts return original value, total recorded use, current remaining balance and a `reconciled` vs `owner_review_required` comparison against the redemption ledger. Delivery remains **staff/provider verification required**; a sent notification is not guaranteed inbox delivery.

## Redemption and checkout guard

- `redeem_gift_certificate_booking_v741` runs in one Postgres transaction, serializes certificate redemption under `FOR UPDATE`, checks certificate active/expiry/CAD, package and size, and confirms `face_value - remaining = ledger sum` before any debit. Unique booked-redemption index prevents repeat debit for the same booking; exact retries report `replayed` and conflicting retries fail closed.
- A gift-covered booking stays **pending** until the redemption RPC returns a verified receipt and its booking confirmation update is observed. An RPC or confirmation failure returns an owner recovery hold plus booking ID; a second payment or certificate is never attempted to repair it automatically.
- A *mixed* gift-plus-external-payment request is held **before any booking/provider call** until a separate owner/provider-verified settlement-time debit integration is approved. No unrecorded gift reduction is claimed. Partial balances remain available for subsequent eligible redemptions, but not all combinations are self-service.
- The SQL migration grants the redemption function to `service_role` only and revokes public, anonymous and authenticated execution. Service keys never reach the browser. This change introduces no new certificate issuance, dispatch or tax/pricing decision.

## Acceptance, rollout, and manual checks

- Run `node scripts/build741_gift_catalog_checkout_recovery_test.mjs`, `node scripts/build651_gift_choice_test.mjs`, `bash scripts/current_gift_issuance_regression.sh`, `bash scripts/current_booking_wizard_regression.sh` and `python3 scripts/sync_route_copies.py --check`.
- For deployment, apply the additive SQL migration to RosieDazzlers Supabase before enabling the matching booking endpoint; verify function grants and unchanged certificate/redemption counts. No live gift transaction is part of the migration check.
- Verify `/api/gifts/catalog` exposes `SVC-complete_detail-small` and `/gifts` displays Complete Detail / Small, current price, retained recipient/sender/date draft, safe cancel status, and receipt balance details. Verify a direct bogus `SERVICE-…` request is rejected without a provider call.
- Treat Cloudflare Production exact-main-SHA and release-health GREEN as **code deployment evidence only**. New gift delivery, charge, retry, and mixed-payment activation require separately authenticated owner/provider evidence; no production test charge is authorized by this source build.
