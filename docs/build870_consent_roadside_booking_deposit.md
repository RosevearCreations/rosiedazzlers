# Rosie Dazzlers Build 870 — Customer-Consented Roadside Quote, Booking Prefill and Original Deposit Reconciliation

Build 870 extends original Build 868–869 private Supabase intake; no second storage or payment provider is introduced.

## Staff workflow

1. Open **Admin Booking**, capture and save a private intake under the customer's photo permission. Save the quick CAD quote and the email only after explicit contact consent.
2. Select the recommended package and vehicle size (optional). **Separately** ask permission to share this quote and permission to send the link by the chosen channel. Both boxes start unchecked. Select **Create private quote link**.
3. Copy the seven-day, revocable link. The system **does not auto-send email or SMS**, advertise the private media, or create a booking. A lost active link must be revoked before reissuing.
4. The customer opens the link, sees the estimate without personal details or photos, and chooses **Continue to booking & secure deposit**. Only safe package and size choices prefill the existing /book wizard. The customer must still supply details, choose availability, accept terms, and complete checkout. No quote estimate overrides canonical prices.
5. After the real booking exists, use Build 869's **Link this intake to existing booking** with exact customer-email matching. Then **Verify original deposit**. Build 870 calls the existing canonical booking-confirmation authority: Stripe live session is checked for booking metadata, currency and exact deposit; its webhook must also have saved the payment intent and confirmed booking. PayPal requires the existing confirmed capture ID. Gift-only bookings are reported separately, never as cash deposits.
6. An append-only staff-only check records whether the original deposit was verified or remains on HOLD. This is not a refund-ledger or live net balance. Refunds/current balance require a separate provider review. The private intake and booking payment rows are never mutated by this reconciliation.

## Security and retention

- 256-bit CSPRNG bearer token; **only SHA-256 token hash stored** in original Supabase, never a plaintext token. A URL fragment avoids sending the token in a normal HTTP request or checkout query string. Client posts the token to a read-only verification endpoint.
- Only signed-in staff with booking-management permission can issue/revoke/reconcile. Sharing requires distinct quote-delivery consent attestation. Quote revisions, revocation, draft expiration, and link expiration fail closed.
- The public API exposes estimate, optionally approved package/size, expiry and the booking link. **No email, name, phone, address, media, object URLs, booking UUID, provider reference or private draft UUID** is returned.
- No automatic customer messaging; staff uses the customer-approved contact channel. No marketing or public-photo consent is inferred.
- Storage remains the original private Supabase bucket (`rosie-intake-private`), with the existing 869 quota guards unchanged.

## Release gates

Apply `supabase/migrations/20261113000300_build870_roadside_quote_sharing.sql` to the original Rosie Dazzlers Supabase project **after 869** before enabling the customer link. Confirm anon/authenticated/public cannot access these tables. Run `node scripts/build870_consent_roadside_quote_test.mjs`, inherited Build 868–869 tests, the four protected production business suites, and exact SHA Cloudflare deployment and live production checks. A green source test alone is **not** a deployed GREEN release.

## Unsupported or held

- No arbitrary quick-quote charge, automatic deposit capture, booking confirmation from redirect, silent photo sharing, direct private-media link, or automatic send.
- Quote scope is advisory until the customer finishes canonical booking. If the canonical amount differs from the roadside estimate, the customer must review it before paying.
- Payment verification is historical original settlement; full/partial refund and current net payment balance need dedicated provider reconciliation.
