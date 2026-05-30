// Build 182 — conservative replay control for stored verified quote-deposit webhook events.
import { requireStaffAccess, json, serviceHeaders, cleanText, isUuid, methodNotAllowed } from "../_lib/staff-auth.js";
import { markQuoteDepositPaidFromProvider, moneyToCents } from "../_lib/quote-deposit-payments.js";
import { loadPaymentWebhookEvent, updatePaymentWebhookEvent, queueQuoteDepositReceiptEmail, recordQuoteDepositRefund } from "../_lib/quote-payment-events.js";

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json().catch(() => ({}));
    const access = await requireStaffAccess({ request, env, body, capability: "manage_bookings", allowLegacyAdminFallback: true });
    if (!access.ok) return withCors(access.response);
    if (!hasSupabaseConfig(env)) return withCors(json({ ok: false, error: "Supabase service configuration is missing." }, 500));
    const eventId = cleanText(body.webhook_event_id || body.event_id || body.id);
    if (!isUuid(eventId)) return withCors(json({ ok: false, error: "Valid webhook_event_id is required." }, 400));
    const row = await loadPaymentWebhookEvent(env, eventId);
    if (!row) return withCors(json({ ok: false, error: "Webhook event was not found." }, 404));
    if (["unverified", "failed"].includes(String(row.status || ""))) {
      await bumpReplay(env, row, "blocked", "Unverified or failed webhook history rows must be reviewed manually before replay.");
      return withCors(json({ ok: false, error: "Unverified or failed webhook history rows are not replayed automatically." }, 400));
    }

    const raw = row.raw_payload || {};
    const eventType = row.provider_event_type;
    let result = null;
    if (row.provider === "stripe" && eventType === "checkout.session.completed") {
      const session = raw?.data?.object || raw?.session || row.processed_payload?.session || {};
      const metadata = session.metadata || {};
      const requestId = row.quote_deposit_payment_request_id || metadata.quote_deposit_payment_request_id || metadata.quoteDepositPaymentRequestId;
      result = await markQuoteDepositPaidFromProvider({
        env,
        paymentRequestId: requestId,
        externalCheckoutId: session.id,
        provider: "stripe",
        paidAmountCents: session.amount_total || session.amount_subtotal || null,
        paymentReference: session.payment_intent || session.id || row.payment_reference,
        providerPaymentIntentId: session.payment_intent || null,
        providerEventId: row.provider_event_id,
        providerEventType: eventType,
        providerPayload: { replayed_from_webhook_history_id: row.id, original: raw },
        actorName: access.actor?.full_name || access.actor?.email || "Staff webhook replay"
      });
      if (result?.ok) await queueQuoteDepositReceiptEmail(env, result.payment_request, { paidAmountCents: session.amount_total || session.amount_subtotal || null, provider: "stripe", paymentReference: session.payment_intent || session.id || row.payment_reference }).catch(() => null);
    } else if (row.provider === "paypal" && ["PAYMENT.CAPTURE.COMPLETED", "PAYMENT.SALE.COMPLETED"].includes(eventType)) {
      const resource = raw?.resource || {};
      const meta = extractPayPalMetadata(resource);
      const requestId = row.quote_deposit_payment_request_id || meta.quote_deposit_payment_request_id;
      result = await markQuoteDepositPaidFromProvider({
        env,
        paymentRequestId: requestId,
        externalCheckoutId: resource.id || meta.paypal_order_id || null,
        provider: "paypal",
        paidAmountCents: paypalAmountCents(resource),
        paymentReference: resource.id || row.payment_reference || row.provider_event_id,
        providerOrderId: resource.id || meta.paypal_order_id || null,
        providerCaptureId: resource.id || null,
        providerEventId: row.provider_event_id,
        providerEventType: eventType,
        providerPayload: { replayed_from_webhook_history_id: row.id, original: raw },
        actorName: access.actor?.full_name || access.actor?.email || "Staff webhook replay"
      });
      if (result?.ok) await queueQuoteDepositReceiptEmail(env, result.payment_request, { paidAmountCents: paypalAmountCents(resource), provider: "paypal", paymentReference: resource.id || row.payment_reference || row.provider_event_id }).catch(() => null);
    } else if (String(eventType || "").toLowerCase().includes("refund")) {
      result = await recordQuoteDepositRefund(env, {
        payment_request_id: row.quote_deposit_payment_request_id,
        provider: row.provider,
        provider_refund_id: row.payment_reference || row.provider_event_id,
        provider_event_id: row.provider_event_id,
        provider_event_type: row.provider_event_type,
        refund_amount_cents: guessRefundAmountCents(raw, row),
        refund_status: "succeeded",
        reason: "staff replay from stored webhook history",
        provider_payload: { replayed_from_webhook_history_id: row.id, original: raw }
      });
    } else {
      await bumpReplay(env, row, "blocked", `Replay is not supported for event type ${eventType || "unknown"}.`);
      return withCors(json({ ok: false, error: `Replay is not supported for event type ${eventType || "unknown"}.` }, 400));
    }

    if (!result?.ok) {
      await bumpReplay(env, row, "failed", result?.error || "Replay did not settle.");
      return withCors(json({ ok: false, error: result?.error || "Replay did not settle.", result }, result?.status || 500));
    }
    const replayed = await bumpReplay(env, row, "replayed", null, result);
    return withCors(json({ ok: true, replayed: true, event: replayed?.event || null, result }));
  } catch (err) {
    return withCors(json({ ok: false, error: err?.message || "Could not replay webhook event." }, 500));
  }
}
export async function onRequestGet() { return withCors(methodNotAllowed()); }
export async function onRequestOptions() { return new Response("", { status: 204, headers: corsHeaders() }); }

async function bumpReplay(env, row, replayStatus, error = null, result = null) {
  return updatePaymentWebhookEvent(env, { id: row.id }, {
    replay_status: replayStatus,
    status: replayStatus === "replayed" ? "replayed" : row.status,
    replay_count: Number(row.replay_count || 0) + 1,
    last_replayed_at: new Date().toISOString(),
    last_error: error || null,
    processed_payload: { ...(row.processed_payload || {}), last_replay_result: result || null, last_replay_error: error || null }
  });
}
function extractPayPalMetadata(resource) { const customId = cleanText(resource.custom_id || resource.purchase_units?.[0]?.custom_id || ""); try { return JSON.parse(decodeURIComponent(customId)); } catch { try { return JSON.parse(customId); } catch { return {}; } } }
function paypalAmountCents(resource) { return moneyToCents(resource?.amount?.value || resource?.seller_receivable_breakdown?.gross_amount?.value || resource?.purchase_units?.[0]?.amount?.value || 0); }
function guessRefundAmountCents(raw, row) { const obj = raw?.data?.object || raw?.resource || {}; return moneyToCents(obj.amount_refunded || obj.amount || obj.amount?.value || row.processed_payload?.refund_amount_cents || 0); }
function hasSupabaseConfig(env) { return !!(env?.SUPABASE_URL && (env?.SUPABASE_SERVICE_ROLE_KEY || env?.SUPABASE_SERVICE_KEY || env?.SUPABASE_SERVICE_ROLE || env?.SUPABASE_SECRET_KEY)); }
function corsHeaders() { return { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST,OPTIONS", "Access-Control-Allow-Headers": "Content-Type, x-admin-password, x-staff-email, x-staff-user-id", "Cache-Control": "no-store" }; }
function withCors(response) { const headers = new Headers(response.headers || {}); for (const [k, v] of Object.entries(corsHeaders())) headers.set(k, v); return new Response(response.body, { status: response.status, statusText: response.statusText, headers }); }
