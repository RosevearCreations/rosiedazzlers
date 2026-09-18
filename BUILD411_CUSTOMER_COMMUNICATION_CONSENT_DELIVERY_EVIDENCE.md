# Build 411 — Customer Communication, Consent & Delivery Evidence

Build 411 closes the customer-communication consent gap across queued email, SMS, push, review-request and abandoned-checkout recovery paths.

This release is schema-neutral. It does not authorize automatic outreach, a provider send, a database migration, Production business-data mutation, or fabricated delivery evidence.

## Current explicit consent

Customer communication consent is owned by the authenticated customer profile. A queued message is not durable permission to send later. At dispatch time, immediately before provider dispatch, customer-directed communication revalidates the canonical customer, current explicit opt-in, current email/SMS channel, canonical recipient, and owned push subscription/event preference where relevant.

If current explicit consent no longer permits the message, the queued event is cancelled fail-closed before provider dispatch. Consent is never inferred from an email address, phone number, old queue row or earlier opt-in. Staff-owned push remains under staff authentication/subscription ownership.

## Abandoned checkout recovery

Abandoned checkout recovery is outreach. The recovery queue requires a canonical customer profile and current explicit customer communication consent. A contact field by itself never implies permission. The queued event records its customer profile owner.

This source acceptance does not start automatic recovery outreach. Staff/provider execution remains separately authorized.

## Preference and unsubscribe boundaries

Authenticated customers own their communication preferences and push subscriptions. Customer profile updates preserve omitted communication choices instead of silently clearing them. Explicit opt-out remains authoritative. Push unsubscribe remains an authenticated owner action, and dispatch-time validation blocks stale queued push after opt-out or event-level preference change.

Admin customer-profile maintenance does not manufacture customer consent.

## Delivery evidence

A successful provider HTTP dispatch is recorded as provider accepted/sent evidence. It is **not final delivery**. Definitive delivery requires separately observed provider delivery evidence and remains provider-dependent until then. Failed, cancelled and suppressed states remain distinct.

The I.T. notification list exposes `sent_at` provider-acceptance evidence without relabeling it as delivery.

## Recovery and error states

- stale consent/channel/recipient queue items cancel before provider contact;
- provider failure remains failed with bounded retry timing;
- review-request lifecycle checks remain active after the consent gate;
- missing canonical ownership fails closed;
- no permanent polling is introduced.

## Acceptance boundary

A GREEN source release means current consent ownership and truthful delivery classification are enforced. It does not mean a provider delivered a real message, a customer opted in, or outreach was enabled.

Acceptance performs no real message send, no customer mutation, no provider mutation, no inferred consent, no schema migration and no Production business-data mutation.
