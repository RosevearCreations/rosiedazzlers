# Rosie Dazzlers 875 — Original Provider-Native Signature Adapter Proof, Refund Source Completeness Drift Alerts & Owner Evidence Export Download UX

## Provider-native receipt boundary — opt-in, never synthetic

Existing original Rosie outbound notification integration is provider-neutral; **the actual email vendor is not demonstrated by source code**. This build adds one **optional** native receiver that supports Resend's Svix/Standard Webhooks signature format, but **does not enroll a new live provider**.

- New callback endpoint: `POST /api/roadside_native_resend_v875`. It is **disabled by default**. On the original Cloudflare Pages environment, explicitly set `ROSIE_ROADSIDE_NATIVE_PROVIDER=resend_svix` and a separately held `ROSIE_ROADSIDE_RESEND_WEBHOOK_SECRET=whsec_...` obtained from the **actual original provider webhook**. Do not use the Build 872 app-to-app HMAC key as the provider-native secret.
- Native verification: dedicated base64-decoded Resend/Svix HMAC-SHA256 secret, raw untouched body signed as `svix-id.svix-timestamp.raw_body`, bounded five-minute skew, accepted `v1,<base64>` signature, bounded body/signature list and a stable event ID. All unverified requests are rejected before any private database lookup or receipt admission. Native event types: `email.delivered`, `email.bounced`, `email.failed`.
- The original provider response must have stored a matching `provider_message_id` that equals the native Resend `data.email_id`. A single native `data.to` recipient is SHA-256 checked against the saved consented recipient hash. Require exactly ONE original accepted dispatch, correct source state and provider `email`/`resend`, then admit with the existing service-only `rosie872_admit_provider_receipt` RPC. A stable `svix-id` is replay-checked by the original unique provider event ledger. Signed duplicate retries are only acknowledged when original evidence exactly matches.
- The original receipt RPC independently checks revoked links and withdrawn contact consent. Replayed or newly received after-withdrawal records do not assert currently consented delivery. A delivery receipt is provider-reported delivery only, **not a customer read/open**.
- Owner GET `/api/admin/roadside_provider_mapping_v874?draft_id=<uuid>` displays configured/disabled adapter status without exposing secrets. A configured secret is not evidence of provider registration, live receipt or original field acceptance. A real signed native provider event is required for that.
- No automatic email send, no re-send after uncertainty, no payments, no booking creation or source status advancement due to CI. If original vendor differs, keep native integration DISABLED until a vendor-specific adapter with independently verifiable signatures is implemented.

## Refund source completeness drift alerts (owner-driven, not scheduled)
- Owner/Admin-only GET `/api/admin/roadside_refund_drift_v875?draft_id=<uuid>` reads the original linked booking, its last verified Build 871 snapshot, and the exact original Stripe/PayPal **live provider** using the existing read-only `refundReadback` logic. No new ledger writes. No external notification is dispatched.
- Source `SOURCE_STABLE` only when original booking, verified provider source, amounts, refund outcome and last saved snapshot are identical and fresh (15 minutes or less). `REFUND_COMPLETENESS_DRIFT` records the changed field names and alerts the owner. Missing baseline, provider ambiguity/HOLD, invalid arithmetic, stale snapshot or booking mismatch all remain **HOLD/owner-attention required**.
- A current PayPal `PARTIALLY_REFUNDED` still needs exact live individual refund IDs and a matching current cumulative source total from Build 874. This endpoint does not assert completeness from historical booking or local refund rows alone. If a new provider refund is detected, reopen owner review; the endpoint never automatically refunds or closes a finance exception.
- To refresh the original baseline, use existing **Recheck current deposit & refunds** action in Build 871, then compare again.

## Private owner dossier download
- Admin Booking page now offers **Check native provider enrollment**, **Check refund source drift**, **Check owner closure** and **Download owner evidence (.json)** with explicit current status indicators.
- Download disabled until the existing Build 873 owner closure has been recorded and verified. The browser obtains private JSON from the existing Build 874 `/api/admin/roadside_closure_export_v874` endpoint with credentials, no-store and no-referrer, creates an ephemeral download URL and revokes it. Failed/absent closure remains HOLD; nothing is constructed client-side as pretend source evidence.
- Owner output contains sensitive operational metadata, must be stored privately. A SHA-256 integrity hash is **not** a separately signed, externally anchored certificate.

## Release gate
1. `node scripts/build875_native_drift_export_test.mjs` and previous Builds 868–874 regressions; protected source and business acceptance.
2. Push feature into protected `dev`, followed by `dev` → protected `main` PR. Verify exact final `main` SHA against successful original Cloudflare Pages Production deployment and Functions-aware live static/contextual smoke.
3. Observe the original Release Health Dashboard state `GREEN` for the exact final SHA. **Do not** equate code release GREEN with real provider callback enrollment or original physical roadside device/pilot acceptance.
4. No Supabase schema migration in Build 875. Existing service-role-only receipt/closure tables and RLS remain unchanged. Secrets must not appear in commits, public clients or logs.

Documentation: Resend webhook signature verification https://resend.com/changelog/managing-webhooks-via-api ; Standard Webhooks HMAC format https://github.com/standard-webhooks/standard-webhooks/blob/main/spec/standard-webhooks.md ; Supabase RLS https://supabase.com/docs/guides/database/postgres/row-level-security

**Next proposed Build 876 — Original Signed Native Provider Field Readback, Automated Refund Drift Escalation Policy & Owner Closure Artifact Revalidation.**
