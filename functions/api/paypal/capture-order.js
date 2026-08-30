// functions/api/paypal/capture-order.js
// Build 274: capture an approved PayPal booking order with booking/order/amount validation,
// idempotent gift redemption, checked database writes and replay-safe confirmation.

import { queueOrderConfirmationNotification } from "../_lib/booking-documents.js";

export async function onRequestOptions() {
  return corsResponse("", 204);
}

export async function onRequestPost({ request, env }) {
  try {
    if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
      return corsJson({ error: "Server not configured (Supabase service credentials missing)." }, 500);
    }

    const body = await request.json().catch(() => ({}));
    const orderId = String(body.order_id || "").trim();
    const bookingId = String(body.booking_id || "").trim();
    if (!orderId) return corsJson({ error: "Missing order_id." }, 400);
    if (!bookingId) return corsJson({ error: "Missing booking_id." }, 400);

    const bookingLoad = await loadBooking(env, bookingId);
    if (!bookingLoad.ok) return corsJson({ error: bookingLoad.error }, bookingLoad.status || 500);
    const booking = bookingLoad.booking;

    // Never capture an arbitrary client-supplied PayPal order against a different booking.
    if (String(booking.paypal_order_id || "").trim() !== orderId) {
      return corsJson({ error: "PayPal order does not match the stored booking order." }, 409);
    }
    if (booking.payment_provider && String(booking.payment_provider).toLowerCase() !== "paypal") {
      return corsJson({ error: "Booking is not assigned to PayPal." }, 409);
    }

    // Browser retries after a successful capture must not ask PayPal to capture the order again.
    if (isConfirmed(booking) && booking.paypal_capture_id) {
      return corsJson({
        ok: true,
        idempotent: true,
        order: { id: orderId, status: "COMPLETED" },
        booking_id: bookingId,
        capture_id: booking.paypal_capture_id,
        notification: { ok: true, skipped: true, reason: "already_confirmed" }
      });
    }

    const accessToken = await getAccessToken(env);
    if (!accessToken.ok) return corsJson({ error: accessToken.error }, 500);

    const captureRes = await fetch(`${paypalBase(env)}/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken.token}`,
        "Content-Type": "application/json",
        Prefer: "return=representation"
      },
      body: "{}"
    });
    const captureText = await captureRes.text();
    const captureData = safeJson(captureText);
    if (!captureRes.ok) return corsJson({ error: "PayPal capture failed.", details: sanitizeProviderError(captureData) }, 502);
    if (String(captureData?.status || "").toUpperCase() !== "COMPLETED") {
      return corsJson({ error: "PayPal order was not completed.", details: sanitizeProviderError(captureData) }, 400);
    }

    const purchaseUnit = Array.isArray(captureData?.purchase_units) ? captureData.purchase_units[0] || {} : {};
    const metadata = decodeBookingMetadata(purchaseUnit.custom_id);
    const metadataBookingId = String(metadata.booking_id || metadata.bookingId || "").trim();
    const plainCustomId = String(purchaseUnit.custom_id || "").trim();
    // Build 274 remains backward-compatible with pre-fix checkout orders whose custom_id was only booking.id.
    if (metadataBookingId ? metadataBookingId !== bookingId : plainCustomId !== bookingId) {
      return corsJson({ error: "Booking metadata mismatch." }, 409);
    }

    const capture = purchaseUnit?.payments?.captures?.[0] || {};
    const captureId = String(capture.id || "").trim() || null;
    const capturedCurrency = String(capture?.amount?.currency_code || purchaseUnit?.amount?.currency_code || "").toUpperCase();
    const capturedCents = moneyToCents(capture?.amount?.value || purchaseUnit?.amount?.value || 0);
    const giftInfo = resolveGiftInfo({ booking, metadata });
    const expectedPayableCents = Math.max(0, Number(booking.deposit_cents || 0) - giftInfo.amount_cents);

    if (capturedCurrency !== "CAD") {
      return corsJson({ error: `PayPal capture currency mismatch. Expected CAD, received ${capturedCurrency || "unknown"}.` }, 409);
    }
    if (capturedCents !== expectedPayableCents) {
      return corsJson({
        error: "PayPal capture amount does not match the booking deposit authority.",
        expected_cents: expectedPayableCents,
        captured_cents: capturedCents
      }, 409);
    }

    const settled = await updateBookingAndGift({ env, booking, bookingId, orderId, captureId, giftInfo });
    if (!settled.ok) return corsJson({ error: settled.error }, settled.status || 500);

    const notification = settled.idempotent
      ? { ok: true, skipped: true, reason: "already_confirmed" }
      : await queueOrderConfirmationNotification(env, bookingId, "paypal_capture");

    return corsJson({
      ok: true,
      idempotent: !!settled.idempotent,
      order: { id: captureData.id || orderId, status: captureData.status },
      booking_id: bookingId,
      capture_id: captureId,
      gift_redeemed_cents: giftInfo.amount_cents,
      notification
    });
  } catch (err) {
    return corsJson({ error: err?.message || "Unexpected server error." }, 500);
  }
}

async function loadBooking(env, bookingId) {
  const res = await fetch(
    `${env.SUPABASE_URL}/rest/v1/bookings?select=id,status,job_status,deposit_cents,payment_provider,paypal_order_id,paypal_capture_id,confirmed_at,notes&id=eq.${encodeURIComponent(bookingId)}&limit=1`,
    { headers: supaHeaders(env) }
  );
  const text = await res.text();
  const rows = safeJson(text);
  if (!res.ok) return { ok: false, status: res.status, error: `Could not load booking before PayPal capture. ${text}` };
  const booking = Array.isArray(rows) ? rows[0] || null : null;
  if (!booking) return { ok: false, status: 404, error: "Booking not found." };
  return { ok: true, booking };
}

async function updateBookingAndGift({ env, booking, bookingId, orderId, captureId, giftInfo }) {
  const headers = supaHeaders(env);
  const alreadyConfirmed = isConfirmed(booking) && !!booking.paypal_capture_id;
  if (alreadyConfirmed) return { ok: true, idempotent: true };

  if (giftInfo.amount_cents > 0) {
    const giftResult = await applyGiftRedemption({ env, bookingId, giftInfo });
    if (!giftResult.ok) return giftResult;
  }

  const patch = await fetch(`${env.SUPABASE_URL}/rest/v1/bookings?id=eq.${encodeURIComponent(bookingId)}`, {
    method: "PATCH",
    headers: { ...headers, Prefer: "return=representation" },
    body: JSON.stringify({
      status: "confirmed",
      job_status: "scheduled",
      paypal_order_id: orderId,
      paypal_capture_id: captureId,
      payment_provider: "paypal",
      confirmed_at: booking.confirmed_at || new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
  });
  const patchText = await patch.text();
  const patchedRows = safeJson(patchText);
  if (!patch.ok || !Array.isArray(patchedRows) || !patchedRows.length) {
    return { ok: false, status: patch.status || 500, error: `PayPal was captured but booking confirmation could not be persisted. ${patchText}` };
  }

  await fetch(`${env.SUPABASE_URL}/rest/v1/booking_events`, {
    method: "POST",
    headers: { ...headers, Prefer: "return=minimal" },
    body: JSON.stringify({
      booking_id: bookingId,
      event_type: "paypal_capture_confirmed",
      details: { order_id: orderId, capture_id: captureId, gift_redeemed_cents: giftInfo.amount_cents }
    })
  }).catch(() => null);

  return { ok: true, idempotent: false };
}

async function applyGiftRedemption({ env, bookingId, giftInfo }) {
  const headers = supaHeaders(env);
  let giftCertificateId = String(giftInfo.certificate_id || "").trim();
  const giftCode = String(giftInfo.code || "").trim();

  if (!giftCertificateId && giftCode) {
    const byCode = await fetch(
      `${env.SUPABASE_URL}/rest/v1/gift_certificates?select=id,code,status,remaining_cents&code=eq.${encodeURIComponent(giftCode)}&limit=1`,
      { headers }
    );
    const rows = byCode.ok ? await byCode.json().catch(() => []) : [];
    giftCertificateId = String(Array.isArray(rows) ? rows[0]?.id || "" : "").trim();
  }
  if (!giftCertificateId) return { ok: false, status: 409, error: "Gift redemption metadata is incomplete for this PayPal booking." };

  const already = await fetch(
    `${env.SUPABASE_URL}/rest/v1/gift_certificate_redemptions?select=id,amount_cents&booking_id=eq.${encodeURIComponent(bookingId)}&gift_certificate_id=eq.${encodeURIComponent(giftCertificateId)}&limit=1`,
    { headers }
  );
  const alreadyRows = already.ok ? await already.json().catch(() => []) : [];
  if (Array.isArray(alreadyRows) && alreadyRows.length) return { ok: true, idempotent: true };

  const giftRes = await fetch(
    `${env.SUPABASE_URL}/rest/v1/gift_certificates?select=id,code,status,remaining_cents&id=eq.${encodeURIComponent(giftCertificateId)}&limit=1`,
    { headers }
  );
  const giftRows = giftRes.ok ? await giftRes.json().catch(() => []) : [];
  const gift = Array.isArray(giftRows) ? giftRows[0] || null : null;
  if (!gift) return { ok: false, status: 409, error: "Gift certificate could not be loaded before redemption." };
  if (giftCode && String(gift.code || "").trim().toUpperCase() !== giftCode.toUpperCase()) {
    return { ok: false, status: 409, error: "Gift certificate metadata mismatch." };
  }
  if (!/^(active|redeemed)$/i.test(String(gift.status || "active"))) {
    return { ok: false, status: 409, error: "Gift certificate is not redeemable." };
  }
  if (Number(gift.remaining_cents || 0) < giftInfo.amount_cents) {
    return { ok: false, status: 409, error: "Gift certificate balance is lower than the booking redemption amount." };
  }

  const insert = await fetch(`${env.SUPABASE_URL}/rest/v1/gift_certificate_redemptions`, {
    method: "POST",
    headers: { ...headers, Prefer: "return=representation" },
    body: JSON.stringify([{
      gift_certificate_id: giftCertificateId,
      booking_id: bookingId,
      amount_cents: giftInfo.amount_cents,
      notes: `Applied automatically from PayPal booking checkout${giftCode ? ` gift code ${giftCode}` : ""}`
    }])
  });
  const insertText = await insert.text();
  if (!insert.ok) return { ok: false, status: insert.status, error: `Could not record gift redemption. ${insertText}` };

  const nextRemaining = Math.max(0, Number(gift.remaining_cents || 0) - giftInfo.amount_cents);
  const giftPatch = await fetch(`${env.SUPABASE_URL}/rest/v1/gift_certificates?id=eq.${encodeURIComponent(giftCertificateId)}`, {
    method: "PATCH",
    headers: { ...headers, Prefer: "return=minimal" },
    body: JSON.stringify({
      remaining_cents: nextRemaining,
      status: nextRemaining > 0 ? "active" : "redeemed",
      redeemed_at: nextRemaining === 0 ? new Date().toISOString() : null
    })
  });
  if (!giftPatch.ok) {
    return { ok: false, status: giftPatch.status, error: `Gift redemption was recorded but the remaining balance could not be updated. ${await giftPatch.text()}` };
  }
  return { ok: true, idempotent: false };
}

function resolveGiftInfo({ booking, metadata }) {
  const noteText = String(booking?.notes || "");
  const noteCode = noteText.match(/Gift code provided:\s*([^\s.]+)/i)?.[1] || null;
  const noteAmount = noteText.match(/Gift redeemed against deposit:\s*([0-9]+(?:\.[0-9]{1,2})?)\s*CAD/i)?.[1] || null;
  return {
    code: String(metadata.gift_code || noteCode || "").trim() || null,
    certificate_id: String(metadata.gift_certificate_id || "").trim() || null,
    amount_cents: Math.max(0, Math.floor(Number(metadata.gift_redeemed_cents || (noteAmount ? moneyToCents(noteAmount) : 0)) || 0))
  };
}

function decodeBookingMetadata(customId) {
  const raw = String(customId || "").trim();
  if (!raw) return {};
  for (const candidate of [raw, tryDecodeURIComponent(raw)]) {
    if (!candidate) continue;
    const parsed = safeJson(candidate);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) return parsed;
  }
  return {};
}

function tryDecodeURIComponent(value) {
  try { return decodeURIComponent(value); } catch { return value; }
}

function isConfirmed(booking) {
  return String(booking?.status || "").toLowerCase() === "confirmed" || !!booking?.confirmed_at;
}

function moneyToCents(value) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.round(n * 100) : 0;
}

function paypalBase(env) {
  return String(env.PAYPAL_API_BASE || "").trim() || "https://api-m.paypal.com";
}

async function getAccessToken(env) {
  const clientId = String(env.PAYPAL_CLIENT_ID || "").trim();
  const clientSecret = String(env.PAYPAL_CLIENT_SECRET || "").trim();
  if (!clientId || !clientSecret) return { ok: false, error: "Missing PayPal client credentials." };
  const auth = btoa(`${clientId}:${clientSecret}`);
  const res = await fetch(`${paypalBase(env)}/v1/oauth2/token`, {
    method: "POST",
    headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: "grant_type=client_credentials"
  });
  const text = await res.text();
  const data = safeJson(text);
  if (!res.ok || !data?.access_token) return { ok: false, error: "Could not obtain PayPal access token." };
  return { ok: true, token: data.access_token };
}

function sanitizeProviderError(value) {
  if (!value || typeof value !== "object") return value || null;
  const copy = JSON.parse(JSON.stringify(value));
  if (copy?.payer?.email_address) copy.payer.email_address = "[redacted]";
  return copy;
}

function supaHeaders(env) {
  return {
    apikey: env.SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
    "Content-Type": "application/json",
    Accept: "application/json"
  };
}
function safeJson(text) { try { return typeof text === "string" ? JSON.parse(text) : text || null; } catch { return null; } }
function corsHeaders() { return { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST,OPTIONS", "Access-Control-Allow-Headers": "Content-Type", "Cache-Control": "no-store" }; }
function corsJson(obj, status = 200) { return new Response(JSON.stringify(obj), { status, headers: { "Content-Type": "application/json; charset=utf-8", ...corsHeaders() } }); }
function corsResponse(body = "", status = 200) { return new Response(body, { status, headers: corsHeaders() }); }
