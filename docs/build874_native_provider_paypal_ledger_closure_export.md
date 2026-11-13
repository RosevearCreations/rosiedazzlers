# Rosie Dazzlers 874 — Native Provider Webhook Mapping Self-Test, PayPal Partial-Refund Transaction Ledger Verification & Owner Closure Evidence Export

## Native provider mapping: **test only, not a receipt**
- The original outbound provider adapter is generic `NOTIFICATIONS_EMAIL_WEBHOOK_URL`; there is no confirmed named vendor. The native provider must first authenticate with its OWN upstream signature validation (outside the mapping helper). Only then may its trusted adapter generate the dedicated Build 872 HMAC-signed canonical callback `POST /api/roadside_quote_delivery_v872`.
- An original provider payload for `rosie_notification_adapter_v1` may have `{id:"event-id",type:"email.delivered",data:{message_id:"original-provider-message-id",metadata:{quote_dispatch_id:"original-dispatch-uuid"}}}`. `email.failed` and `email.bounced` are allowed failure mappings. The owner-only `GET /api/admin/roadside_provider_mapping_v874?draft_id=...` describes the dry-run status; owner-only POST with `{action:"dry_run_native_receipt_mapping",draft_id,native_event:{...}}` validates original dispatch and message ID. It NEVER submits callbacks, signs events, sends email, changes consent or creates evidence.
- A successful dry run is **not** native provider enrollment, authenticated native signature, delivered message or live pilot. No synthetic external provider receipt is admitted to the operational ledger.

## PayPal original deposit partial-refund transaction ledger
- The Build 871 staff `reconcile_net_deposit` path now uses Build 874 pure `assessPaypalPartialRefundLedger` when the actual, live capture reports `PARTIALLY_REFUNDED`.
- Retrieve `quote_deposit_refund_records` scoped to the canonical original booking and `provider=paypal`. For each unique refund ID, use original PayPal OAuth credentials to GET `/v2/payments/refunds/{id}`; verify **COMPLETED**, CAD amount, stored amount and exact capture backlink. Require total of ALL independently verified refund IDs to equal the live PayPal cumulative `total_refunded_amount` on the original capture/order representation, and order/capture identity/status agreement.
- Missing cumulative provider amount, incomplete/ambiguous refund IDs, pending refunds, extra external refunds, mismatched currency/status/capture, 25+ results, non-200 provider response, or inconsistent totals = **HOLD**. Missing evidence is never replaced by staff assertion, past payment status, or local arithmetic.
- This does not issue a refund, collect a deposit, settle an invoice or prove that future refunds will not occur. A successful result is an original deposit snapshot only.

## Owner closure export
- After a genuine Build 873 owner-accepted closure exists, signed-in Admin GET `/api/admin/roadside_closure_export_v874?draft_id=<uuid>` returns a `no-store` JSON attachment with exact source references: original closure decision, dispatch, independently signed callback receipts, owner-witnessed field device, original net deposit snapshot and refund case history.
- Export carries a SHA-256 digest for **integrity only**. It is not a second independently signed approval or proof of current customer consent and contains no original share token or media. If closure is missing or source relationships are inconsistent, the endpoint fails closed and exports nothing.
- The export never changes booking, financial or provider records.

## Verification / release gate
1. Run `node scripts/build874_native_paypal_export_test.mjs` plus inherited 868–873 regression and the current source gate on `dev` and `main`.
2. Merge protected PR into `dev`, then protected `dev` → `main`; verify exact final main commit, Cloudflare Functions-aware check, exact-SHA deploy and live application health.
3. Deploy no new migration for this build. Retain the existing original Rosie Supabase service-role RLS and **never** expose service keys to browser clients.
4. Native provider enrollment and live signed callback, real original-device evidence, and an owner closure MUST remain independently verified. A simulated mapping test cannot make Production/field-pilot GREEN.
5. Source references: PayPal Payments v2 API `https://developer.paypal.com/api/payments/v2`, PayPal refund definitions `https://developer.paypal.com/api/payments/v2/definitions/refund/`, Supabase API grants `https://supabase.com/changelog/45329-breaking-change-tables-not-exposed-to-data-and-graphql-api-automatically`.

**Next proposed Build 875 — Original Provider-Native Signature Adapter Proof, Refund Source Completeness Drift Alerts & Owner Evidence Export Download UX.**
