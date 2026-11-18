# Rosie Dazzlers Build 908 — customer-owned history, review receipts, checkout recovery and independent witness

## Account history and review
- Customer sessions bind new booking history to `customer_profile_id`. Legacy email-matched bookings and sent quotes are visible **only after email verification**, and rows already belonging to another profile are never accepted.
- `/my-account` and `/api/client/booking_reviews_v908` show the account-saved booking snapshot, staff-sent quote summaries, and counts of genuinely verified private media already linked to owned booking or sent quote. No private object path, token, raw media, unapproved draft, paid-session URL or unnecessary contact data is exposed.
- Explicit review POST captures a source-version SHA-256 and a service-role-only idempotent acknowledgement in original `customer_review_receipts_908`. Review is neither acceptance of terms, consent, media publication, booking confirmation nor payment.

## Checkout resume
- An earlier pending provider session is re-openable **only when** the current valid server session owns `bookings.customer_profile_id`, the submitted email matches the account, and Build 626 canonical exact booking/price/slot/provider revalidation succeeds.
- Unowned legacy/guest holds are **not** reopened using an email and slot. Show an ownership-required hold and direct the customer to staff if necessary; no duplicate booking or provider payment attempt.
- Provider URL allowlist requires HTTPS and genuine Stripe/PayPal hostnames. The original checkout authority and payment reconciliation remain unchanged.

## Independent recovery deliverability witness
- Transactional password-reset provider attempts are recorded as minimal service-only evidence: opaque token row ID, owner profile ID, provider key/ref and HTTP result. No raw reset link, token, recipient, message or email address is recorded in the Build 908 ledger.
- HTTP 200/202 is **accepted**, not **delivered**. Only a distinct signed callback at `/api/recovery_delivery_witness_v908`, using separate `RECOVERY_DELIVERY_WITNESS_SECRET_908` (minimum 32 characters), within a five-minute HMAC timestamp window, and matching an originally accepted provider reference can mark delivery/bounce/failure. Duplicate/replayed facts cannot rewrite prior evidence.
- Without independently enrolled secret/provider callback, state remains `pending` / `HOLD_INDEPENDENT_WITNESS_NOT_ENROLLED`. **Do not claim verified recovery delivery**.
- Current Build 906 manual-contact protections remain intact; password reset emails only send on explicit customer request, never automatically as marketing.

## Operational migration & verification
- Original project: `RosieDazzlers` (Supabase ref `cwxhhvwpilmrfwxirixx`). Apply reviewed additive migration `supabase/migrations/20261118090000_build908_customer_review_receipts.sql` and independently read back RLS enabled, anon/auth denied, service role grants and indexes before production.
- Protected source PR → exact-dev source check and original Cloudflare Development Acceptance → protected dev/main promotion → exact-main Cloudflare Production Pages & Functions + HTTPS/Release Health/CI budget gates.
- Live deliverability is separate business evidence, never inferred from synthetic acceptance tests. Never send real account recovery tests to customers.

**Next proposed Build 909 — Customer Booking Continuity, Verified Quote Acceptance & Account-Owned Media Timeline, without provider or consent bypass.**
