# Build 671 — Gift delivery status, failed delivery and owner-safe resend mobile copy audit

## Scope

- Adds a staff-only, GET-only owner review under Admin Site Settings. It checks the published `/gifts` and `/gift-cards` mobile copy, bundled policy/FAQ/document text, and bounded public FAQ / managed gift-delivery and notification settings. It never fetches customer gift records or provider message events.
- Adds a public mobile-readable guide explaining preferred send dates, waiting/queued/provider-accepted/failed delivery states, spam-folder checks, the contact route and protection of gift codes.
- Rewords an ambiguous *immediate automated send* preview to the next eligible send window, subject to review.
- Shows source-review findings for the known email and retry logic, plus illustrative staff/customer status messages. These are **not claims about actual deliveries**.

## Known owner-review findings — not cleared by this copy audit

1. **Provider-accepted is not inbox-delivered.** `gift-delivery.js` writes `sent` following provider acceptance; purchaser-copy email says "has been delivered." Review customer-facing claims and provider evidence before changing delivery semantics.
2. **Mixed recipient/copy outcomes.** The shared gift status can be marked `failed` because the purchaser copy failed, even if recipient dispatch succeeded. A blind scheduled rerun risks duplicate recipient mail.
3. **Retry reconciliation.** The generic notification retry updates `notification_events` but does not reconcile the gift's `purchase_context.gift_delivery` state. Staff need to inspect both notification IDs.
4. **Scheduled-date drift.** Gift email templates refer to `gift.delivery_date` even though the scheduled date is inside `purchase_context.gift_delivery.delivery_date`; verify exact email date copy.
5. **No blind resend.** The existing scheduled delivery processor can create a new recipient event for a failed gift while an earlier event exists. Any future dedicated resend action must check recipient event state, approval, idempotency, consent and notification outcomes.

## Safe owner procedure

1. Check the original checkout/issuance record in the authorized admin workflow without sharing a gift code publicly.
2. Inspect recipient versus purchaser-copy notification events, each event's `queued`/`sent`/`failed` state, attempts and most recent provider error.
3. If provider-accepted, first ask the recipient to check spam/junk. Do not promise inbox delivery based on `sent` alone.
4. Only an authorized operator should decide whether a specific existing failed/queued notification is suitable for retry, and verify the result; do not automatically create a new gift or send a second recipient email.
5. Reconcile customer-safe copy and gift status after confirming real event evidence. Gift credit, gift expiry/refund policy and payment semantics belong to their existing independent owner reviews.

## Acceptance

- Public `/gifts` and `/gift-cards` and Admin Site Settings flat/index routes remain identical.
- Protected endpoint is read-only, returns redacted findings and source warnings; POST returns 405.
- No actual gift code, recipient address, notification event, balance, settlement or customer message is read or mutated by this build.
- Run `node scripts/build671_gift_delivery_failure_resend_test.mjs`, both aggregate contract wrappers, and the exact-SHA deployment gates.
