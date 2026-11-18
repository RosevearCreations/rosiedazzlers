# Rosie Dazzlers Build 909 — Customer Booking Continuity, Verified Quote Acceptance & Account-Owned Media Timeline

## Implemented paths
- Signed-in owner-only `/api/client/booking_continuity_v909` stores up to one generic Smart and one generic Manual preference set per customer. Smart preferences: size, goal, condition, concerns, explicitly chosen extras. Manual preferences: size and selected payable/quote-only add-on codes.
- Explicit Save/Restore buttons are added to `/book-smart` and `/book-custom`. Restores recheck the current service catalogue; no name, contact address, date, time, photos, tokens, payment selections, quote price, or reservation are carried across devices.
- `/my-account` now provides saved choice links, customer-safe summaries of staff-sent quotes, quote acceptance eligibility and verified private-photo/video activity timestamps scoped to a saved booking or sent quote's original lead.
- Staff quote acceptance requires the exact original sent quote, verified account email, fresh original source version, matching staff-stored structured term hash, unexpired structured CAD terms, a Build 908 version-bound explicit review receipt, and separate affirmative confirmation. Server-side compare-and-set updating quote source prevents stale or duplicated acceptance. Acceptance does not book, reserve, price-match to current catalog, charge, notify, or publish.
- The original quote response-token workflow remains available; authenticated account acceptance is an **additional** security-controlled path, not a client token bypass. Existing quote-to-booking canonical revalidation of availability/current pricing remains required.
- Private media timeline shows verified, linked original events only (type/date/booking or sent-quote context). Storage object path, bucket, intake proof, media body, and public release URLs never appear.

## Database and privacy
- Original RosieDazzlers Supabase project: `cwxhhvwpilmrfwxirixx`.
- Additive migration `supabase/migrations/20261118134000_build909_customer_booking_continuity.sql` adds private service-role-only `customer_booking_plans_909`. RLS enabled and no public/anon/auth read/write grants. Source quote acceptance remains in the canonical `quote_proposal_drafts` record.
- Quote acceptance is not payment, staff final appointment confirmation, or automatically dispatched communication. Build 908's independently signed password-recovery delivery witness remains HOLD until a separate real provider signs receipts.

## Exact release acceptance
- Feature PR → protected `dev` → Cloudflare exact-SHA Development source, Functions & HTTP acceptance → protected `main` PR → Cloudflare exact-SHA Production source, Functions & HTTPS smoke → independent Release Health GREEN with CI queue WITHIN_BUDGET pending=0.
- Original production email/password reset delivery, actual live payment settlement, live field-device acceptance and media private-object replay remain separate observed business evidence rather than claims from tests alone.
- Source-of-truth report in Word is a separate artifact. Historical feature documents prove design/code intent but not production field adoption.

**Next proposed Build 910 — Customer Quote-to-Booking Readiness, Private Media Retention Receipts & End-to-End Cross-Device Journey Verification.**
