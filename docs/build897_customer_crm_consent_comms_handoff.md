# Rosie Dazzlers Build 897 — Customer CRM, Consent & Comms Handoff

## Delivered software
The original authenticated Admin CRM Queue links customers to the new Consent & Comms staff review. Supervisors can review the original customer ID, original inbound worksite concerns, notification source-state history, current per-purpose/per-channel preference, and append internal dated follow-up plans. Five allowlisted purposes cover booking questions, support, service follow-up, maintenance invitations and review requests.

Existing Build 743 protected source table customer_communication_handoff_audit holds immutable, idempotent staff review records. No new CRM database, migrations, customer messages, external delivery, payment, booking, account changes, preference grants or cross-application requests are made. The page does not store personal data locally. Plain queued/sent fields never prove inbox or SMS delivery.

## Security
- Only a real signed-in Rosie staff session with existing customer operations access and admin/operations_manager role can use the GET and POST endpoint. Legacy header/password fallback is not accepted.
- POST requires same-origin request, bounded JSON, exact customer and client request UUIDs, an approved template/channel and a future review date within 90 days. Unknown fields, free-form message bodies and recipient overrides are rejected.
- The server re-reads the original active customer profile and latest purpose-specific preference. Global opt-out, service channel opt-out, channel drift and missing separate marketing opt-in fail closed. A denied contact is saved as blocked_by_preference, never as consent or dispatch proof.
- Append-only staff record includes a unique client request key and privacy-safe fixed metadata. Browser roles remain denied direct table privileges by the existing Build 743 migration. The session must be verified before private reads or writes.
- Current consent in a plan is only a snapshot for internal review. Any future dispatch needs fresh authorization and withdrawal recheck.

## Integration and release
AI Data Platform, Rosevear AI Hub and Rosevear Comms Hub remain separate Masters. Local protocol 1.1 accepts backward-compatible 1.0 peers, but NO independent issuer key, delegated Comms grant, tenant/audience authorization, signed envelope, provider receipt, durable ACK, or original Windows receiver activation is claimed. Comms handoff remains HOLD_UNENROLLED. This additive Rosie-only release does not touch Vercel-managed apps.

Tests: node --test tests/build897_crm_consent_handoff.test.mjs; node --check functions/api/admin/crm_consent_handoff_v897.js; node scripts/build743_consent_notification_reconciliation_test.mjs. Protected PR checks, Cloudflare preview, exact-main production Pages/Functions deployment and live HTTP/release-health verification remain mandatory before software Production GREEN.

All tests are synthetic. Actual customer consent, delivery-provider receipt, staff device testing and operational Comms authorization are separate BUSINESS ACCEPTANCE HOLD items. Prior 892–896 business holds persist.

Next proposed Build 898 — Finance, Payment Reconciliation & Accounting. No live charges, price approval or standalone checkout activation by this build.
