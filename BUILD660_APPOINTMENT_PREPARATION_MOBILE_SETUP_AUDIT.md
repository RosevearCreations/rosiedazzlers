# Build 660 — Appointment Preparation Email/SMS & Customer Checklist Mobile Setup Audit

Rosie Dazzlers brings standard detailing water and power for normal mobile service. Customer preparation covers safe legal parking, a usable work area, access, personal belongings, vehicle condition and applicable municipal/building/runoff restrictions.

## Delivered

- Added a single conservative preparation checklist to existing **confirmed-booking emails** (both plain text and escaped HTML) and token-protected customer order confirmations. No extra notification is queued.
- Corrected ambiguous legacy preparation guidance in the customer self-service panel.
- During existing appointment-related email/SMS notification dispatch, correct only known contradictory utility claims, **after** the existing customer consent and review eligibility gates. Original queue records, recipients, scheduling, channel, and provider settings remain untouched. Old unsafe HTML is omitted in favour of corrected plain text. Other event types are untouched.
- Added authenticated, GET-only `/api/admin/appointment_preparation_mobile_setup_review`, exposing bounded excerpts and provenance from bundled document templates and three independently managed settings: `document_templates`, `notification_templates`, `membership_plan_settings`. No customer contact records or notification-event bodies are returned. No auto-sync, database update, scheduling, or send.
- Added manual source-review control on both Admin Site Settings routes. SMS copy is a **draft preview only**; no appointment-reminder SMS scheduler or new provider integration is activated.

## Owner decisions held

- Review any flagged managed template text and explicitly approve edits through existing authorized settings tools.
- SMS opt-in, STOP/HELP behavior, provider enabling and actual sending are separate operational authority. This build does not activate or bypass them.
- Booking/payment/availability, weather, water-use and runoff restrictions, Terms and Waiver are not rewritten.

## Verification

`node scripts/build660_appointment_preparation_mobile_setup_test.mjs` and `bash scripts/current_booking_wizard_regression.sh`. Production promotion requires protected source checks A–D, matching dev/main trees, Cloudflare success, exact-main-SHA acceptance and live read-only route/asset smoke.

## Next expected Build 661

**Quote & Deposit Follow-Up Messaging Mobile Setup Copy Audit & Consent-Safe Reconciliation.** Review quote/proposal, deposit, and quote follow-up messages independently of confirmed appointment communication without authorizing additional provider sends or altering consent/legal records.
