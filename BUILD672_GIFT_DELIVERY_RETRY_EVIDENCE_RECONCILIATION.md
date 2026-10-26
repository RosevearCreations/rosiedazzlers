# Build 672 — Gift delivery retry evidence, recipient/copy state reconciliation and owner-safe resend readiness

## Staff review

In **Admin → Site Settings → Gift delivery retry evidence**, an authorized owner enters the internal gift UUID from Customer 360 (not the gift code, email address or Stripe payment reference).

The protected GET-only review retrieves one `gift_certificates` row and up to 30 `notification_events` rows whose JSONB payload `gift_id` matches. Only necessary server-side fields are selected. The response gives each target's event UUID, state, attempt count/limit, whether a provider error exists and any next retry window. It never returns gift codes, email addresses, purchaser/recipient names, message bodies, notification payloads, payment data, raw provider errors or delivery tokens.

The review distinguishes:

- **Provider-accepted recipient send:** do not resend recipient email solely because gift context says `failed`. Inbox delivery is not verified.
- **Recipient failure:** possible review of the **existing** failed recipient event only when exactly one recipient event is found, it has attempts remaining, no backoff is active and the gift is active. Owner authorization and provider evidence are still required.
- **Purchaser-copy failure after recipient success:** only purchaser-copy event can become an owner-review candidate; the recipient must not be resent.
- **Queued/pending/cancelled/sent or exhausted event:** hold; no duplicate send.
- **Missing, stale, conflicting or 30-row-truncated history:** hold; do not infer eligibility.

The audit is not a resend endpoint or a delivery reconciliation writer. It cannot change the gift context or the notification event. The pre-existing Admin Notifications retry workflow is separate and must be used only with operator authorization.

## Source problems still requiring operational owner decisions

1. Generic notification retry can leave gift delivery context stale and lacks gift-specific duplicate recipient safeguards. The new screen provides visibility, not synchronization or an automated repair.
2. A failed purchaser-copy send can set the shared gift context to `failed` after the recipient provider accepted the message. The review explicitly isolates recipient/copy states.
3. Checkout submits `sender_name`, `delivery_date` and `gift_message` in Stripe metadata, but the current gift webhook creates `purchase_context` initially from vehicle metadata only. Newly issued gift delivery scheduling metadata may therefore be missing unless populated through another process. Treat missing context as a finding and investigate before enabling automatic retries.
4. Historic events lacking `payload.gift_id`, unavailable data sources or more than 30 matching events fail closed; staff must reconcile source records manually.
5. Real inbox delivery, provider bounce logs, authenticated live gift evidence and authorized resend activity were not claimed or simulated.

## Verification

- `node scripts/build672_gift_delivery_retry_evidence_test.mjs`: tests independent recipient/copy outcomes, stale shared state, duplicate events, attempt exhaustion, backoff, missing history, auth, no-PII response, service failure and GET-only access with mocked database responses.
- Both stable regression wrappers include Build 672 without dropping previous tests.
- Exact `main` business-acceptance, source-gate and production deploy evidence required before Production GREEN.
