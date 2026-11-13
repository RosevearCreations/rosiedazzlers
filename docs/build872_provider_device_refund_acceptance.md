# Rosie Dazzlers Build 872 — provider proof, refund exception and original-device test

Builds on 868–871 camera-first private roadside intakes and consented quote links. An estimate is not a booking. A provider-accepted send is not a delivered or read message; original deposit and net refund evidence remain separate from checkout status.

## Customer quote delivery
1. Signed-in booking staff save a consented roadside quote and issue one original private link. For a configured email provider, leave the just-issued link in the admin screen, check the customer's original email and both one-attempt confirmations, then choose **Send original quote**. Only the saved consented email can receive the email. One claim per quote link prevents unattended resends even if a timeout occurs.
2. The existing Rosie provider adapter sends the email through `NOTIFICATIONS_EMAIL_WEBHOOK_URL` (or the configured Recovery provider) and reports **provider_accepted** only when it returns a stable `message_id`, `id`, or `request_id`. Missing webhook, timeout or missing provider identity creates **dispatch_unknown**; investigate externally, never retry automatically. Sending does not create bookings, collect deposits or modify quote price.
3. To confirm provider-reported delivery, configure an independent authenticated provider callback to POST `/api/roadside_quote_delivery_v872` using env secret `ROSIE_QUOTE_RECEIPT_WEBHOOK_SECRET` (32+ characters), different from the provider outbound bearer. Required headers: `x-rosie-quote-timestamp` = current 10-digit Unix seconds, `x-rosie-quote-signature` = `sha256=<hex HMAC-SHA256(secret, timestamp + '.' + RAW JSON body)>`. JSON fields: `dispatch_id`, `provider_event_id`, `provider_message_id`, `event_type` (`delivered`, `failed` or `bounced`). The provider adapter needs to map native event metadata to this envelope; this release does NOT assume such a callback is already configured.
4. Server checks HMAC, timestamp ±5 minutes, non-replayed event identity and original provider message ID, then stores a service-only audit. If consent was withdrawn or link revoked by callback time, it marks `receipt_after_withdrawal`, not currently consented delivery. Even a valid receipt means **provider-reported delivered**, NOT that the customer opened/read the link.
5. Device/customer messages and private link tokens never appear in public GET endpoints or the receipt audit. Quote link is a bearer capability; do not put it into issue trackers, logs, analytics or checkout URLs.

## Refund exception owner workflow
- Use Build 871 **Recheck current deposit & refunds** first. Open exception only on unresolved/HOLD or refund-detected original booking evidence.
- Owner can mark **reviewed HOLD** with reason. **Close verified** is rejected unless the EXACT latest Build 871 provider readback is complete, from the same booking/draft, arithmetically consistent, and no more than 15 minutes old. This is a snapshot of the original deposit only; it neither refunds money nor establishes invoice paid in full.
- Refund cases remain private and visible with their owner decisions; no payment mutation, no duplicate open exception per original booking.

## Original physical device field acceptance
- From the same browser on the actual device, check original device present and **Start challenge**. Browser enrolls an ephemeral ECDSA P-256 public key with the 5-minute secret nonce recorded server-side.
- Use **Take Photo(s)/Video** above, save a NEW private media object in original Supabase storage, and complete the challenge from the original browser tab. Server verifies signature under that previously enrolled key, fresh media `verified_at >= issued_at`, original draft identity, storage state and consent. It marks **browser_proof_complete** only.
- Owner/Admin must physically witness device and inspect original private media and separately sign off within one hour. Only then does the record show **owner_accepted**. Browser key proof is not manufacturer hardware attestation; source and production CI never invent a real device test.
- Without original external provider/owner evidence, keep field acceptance and receipt state on HOLD. Do not claim real customer delivery or a field pilot has occurred until independently performed.

## Production and privacy gate
- Schema migration: `supabase/migrations/20261113000500_build872_provider_receipts_refund_review_device.sql` on original Rosie Supabase project only. Four additional service-role-only, RLS-protected audit tables, plus service-only claims and review RPCs.
- Protected dev PR, exact dev SHA Cloudflare deployment, then protected main PR. Exact final main SHA, successful original provider Cloudflare GitHub check, independent Functions-aware source/business/smoke jobs, and production release-health checks required for GREEN.
