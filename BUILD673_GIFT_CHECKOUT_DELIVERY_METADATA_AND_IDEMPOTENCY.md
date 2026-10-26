# Build 673 — Gift Checkout Delivery Metadata Persistence, Provider-State Reconciliation & Duplicate-Send Prevention

## Changes

- The signed Stripe gift checkout webhook now persists the chosen `sender_name`, `delivery_date` and `gift_message` in `gift_certificates.purchase_context.gift_delivery` for every issued certificate. The vehicle intake remains intact. Malformed nonempty dates are held for review rather than treated as send-now instructions.
- New certificates begin with `delivery_status: pending`. The scheduled processor and webhook may only send after a conditional PostgREST `PATCH` changes the **single active** certificate from `pending` to `processing`. A concurrent or stale second worker receives zero claimed rows and skips; existing `sent`, `failed`, `processing`, missing-context and legacy statuses never automatically resend.
- The recipient notification event ID is persisted *before* calling the provider. If the subsequent provider/event state or gift context cannot be recorded, the claim stays held for owner reconciliation. Provider `sent` means **accepted by provider**, not inbox receipt.
- Recipient and purchaser-copy outcomes are separate (`recipient_provider_status`, `purchaser_copy_status`, two event IDs). A failed purchaser copy does not negate a successfully accepted recipient submission; a failed recipient submission does not generate a misleading purchaser-delivered copy.
- The generic notifications processor skips both gift delivery event types, even when their IDs are explicitly passed, so generic retry jobs do not initiate another send without comparing provider and gift history first. The old admin delivery helper now re-exports the canonical implementation.
- Client checkout rejects invalid `YYYY-MM-DD` gift dates before creating a Stripe session. Signed webhook fulfillment fails closed if the idempotency lookup is unavailable.

## Safety and operator boundaries

- **No database schema change or outbound live send was performed in verification.** Tests mock Stripe signature handling, Supabase PostgREST, concurrent claims, and provider outcomes.
- **No automatic gift resend is enabled.** A gift left in `processing`, `failed`, `review_required` or an inconsistent state needs authorized inspection of the exact notification IDs and provider evidence. Do not infer recipient inbox delivery from provider acceptance.
- Existing historical gifts without persisted `gift_delivery` metadata remain held; this build does not backfill unverified recipient/date/message data.
- An unexpected failure after provider submission can leave `processing` while the provider already accepted the email. This is an intentional safety hold; do not use an indiscriminate retry to clear it.
- Concurrent webhook **certificate issuance** still depends on existing database uniqueness and Stripe's webhook re-delivery semantics; this build specifically enforces single-claim **delivery per gift certificate**, not a new transactional checkout issuance schema. Repeated/parallel issuance deserves a separate database-level constraint review.

## Validation

`node scripts/build673_gift_delivery_idempotency_test.mjs` verifies signed fulfillment metadata, strict dates, concurrent worker claims, recipient and purchaser-copy outcomes, failed provider attempts, persistence failure holds, and generic retry separation. The existing Build 671 audit expectations were updated where the former observed bugs were corrected. The standard source and booking gates also invoke this test.

## Next expected

Build 674 — Gift Certificate Issuance Atomicity, Webhook Replay Evidence & Owner Recovery Hold.
