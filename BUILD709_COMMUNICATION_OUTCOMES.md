# Rosie Dazzlers Build 709 — Customer Communication Outcomes & Consent Alerts

## Staff workflow

From **Admin → Quotes**, choose a saved quote linked to the actual confirmed booking.
Reconcile staff confirmation (707), check current customer permission and prepare the staff-only
handoff (708), then choose **Refresh consent and outcomes** (709). The Build 709 panel shows
current handoff/consent drift, recent staff-reported outcomes and outstanding follow-up.

After actually observing an outcome, select one of: no contact, follow-up needed, failed
manual attempt, manual attempt reported, or customer replied. Press **Record actual staff outcome**
and acknowledge the truth of the selected status. Contact-attempt statuses require the
current linked customer profile's explicit opt-in, a supported preferred channel, fresh staff
confirmation and a current 708 handoff. A no-contact or follow-up record can be made even
when communication permission was revoked; it never grants permission to contact.

## Boundaries and evidence

- Staff reports are **unverified**, not third-party proof of transport acceptance, delivery or reply.
- Status actions append a role-protected event to the existing `booking_events` table; no tables,
  policies, secrets or external provider configurations are added.
- Event payloads include source marker, outcome and staff-only proof classification, no email or
  telephone number, and `provider_delivery_verified: false`.
- Current customer opt-out, profile update, channel switch, stale booking or quote and mismatched
  handoff are surfaced for re-review. The server rechecks these on every write.
- There is **no automated email, SMS, push, provider send, queue, payment or booking mutation**.
- Cross-app Rosevear Comms Hub integration remains independently `DISCONNECTED / HOLD`.

## Release verification

`node scripts/build709_communication_outcome_test.mjs` covers role denial, verified profile
readback, rejected stale writes, revoked consent, channel drift, manual event readback, duplicate
record suppression and stale booking changes. The full current booking regression gate includes it.
