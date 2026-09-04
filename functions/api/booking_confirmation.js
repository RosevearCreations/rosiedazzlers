// Build 326: browser-safe booking completion authority.
// This endpoint never confirms a booking from a redirect alone.
// Stripe settlement remains webhook-authoritative; PayPal settlement remains capture-order-authoritative.
// Only low-risk rebooking hints are returned after provider evidence matches the stored booking.

export async function onRequestOptions() {
  return jsonResponse({}, 204);
}

export async function onRequestGet({ request, env }) {
  try {
    if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
      return jsonResponse({ error: "Server not configured." }, 500);
    }

    const url = new URL(request.url);
    const provider = String(url.searchParams.get("provider") || "").trim().toLowerCase();
    const bookingId = String(url.searchParams.get("booking_id") || "").trim();
    if (!bookingId) return jsonResponse({ error: "Missing booking confirmation reference." }, 400);
    if (!["stripe", "paypal"].includes(provider)) return jsonResponse({ error: "Unsupported payment provider." }, 400);

    const bookingLoad = await loadBooking(env, bookingId);
    if (!bookingLoad.ok) return jsonResponse({ error: bookingLoad.error }, bookingLoad.status || 500);
    const booking = bookingLoad.booking;

    if (provider === "stripe") {
      return confirmStripe({ url, env, booking, bookingId });
    }
    if (provider === "paypal") {
      return confirmPayPal({ url, booking, bookingId });
    }

    return jsonResponse({ error: "Unsupported payment provider." }, 400);
  } catch (err) {
    return jsonResponse({ error: err?.message || "Could not verify booking confirmation." }, 500);
  }
}

async function confirmStripe({ url, env, booking, bookingId }) {
  const sessionId = String(url.searchParams.get("session_id") || "").trim();
  if (!sessionId) return jsonResponse({ error: "Missing Stripe Checkout Session reference." }, 400);
  if (!env.STRIPE_SECRET_KEY) return jsonResponse({ error: "Stripe verification is not configured." }, 500);

  if (String(booking.stripe_session_id || "").trim() !== sessionId) {
    return jsonResponse({ error: "Stripe session does not match the stored booking." }, 409);
  }
  if (booking.payment_provider && String(booking.payment_provider).toLowerCase() !== "stripe") {
    return jsonResponse({ error: "Booking is not assigned to Stripe." }, 409);
  }

  const stripeRes = await fetch(`https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}`, {
    headers: { Authorization: `Bearer ${env.STRIPE_SECRET_KEY}` }
  });
  const stripeText = await stripeRes.text();
  const session = safeJson(stripeText);
  if (!stripeRes.ok || !session?.id) {
    return jsonResponse({ error: "Stripe Checkout Session could not be verified." }, 502);
  }

  if (String(session.id || "") !== sessionId) {
    return jsonResponse({ error: "Stripe session identity mismatch." }, 409);
  }
  if (String(session?.metadata?.booking_id || "").trim() !== bookingId) {
    return jsonResponse({ error: "Stripe booking metadata mismatch." }, 409);
  }
  if (String(session.currency || "").toLowerCase() !== "cad") {
    return jsonResponse({ error: "Stripe currency did not match the booking authority." }, 409);
  }

  const expectedPayableCents = expectedPayableDepositCents(booking);
  const receivedCents = Number(session.amount_total ?? session.amount_subtotal ?? -1);
  if (!Number.isFinite(receivedCents) || receivedCents !== expectedPayableCents) {
    return jsonResponse({ error: "Stripe amount did not match the booking deposit authority." }, 409);
  }

  const paymentVerified = String(session.payment_status || "").toLowerCase() === "paid";
  if (!paymentVerified) {
    return jsonResponse({
      ok: true,
      provider: "stripe",
      payment_verified: false,
      booking_confirmed: false,
      state: "payment_pending"
    });
  }

  const bookingConfirmed = isConfirmed(booking);
  return jsonResponse({
    ok: true,
    provider: "stripe",
    payment_verified: true,
    booking_confirmed: bookingConfirmed,
    state: bookingConfirmed ? "confirmed" : "settlement_processing",
    rebook: bookingConfirmed ? safeRebookHints(booking) : null
  });
}

function confirmPayPal({ url, booking, bookingId }) {
  const orderId = String(url.searchParams.get("order_id") || "").trim();
  if (!orderId) return jsonResponse({ error: "Missing PayPal order reference." }, 400);

  if (String(booking.paypal_order_id || "").trim() !== orderId) {
    return jsonResponse({ error: "PayPal order does not match the stored booking." }, 409);
  }
  if (booking.payment_provider && String(booking.payment_provider).toLowerCase() !== "paypal") {
    return jsonResponse({ error: "Booking is not assigned to PayPal." }, 409);
  }

  const paymentVerified = !!String(booking.paypal_capture_id || "").trim() && isConfirmed(booking);
  return jsonResponse({
    ok: true,
    provider: "paypal",
    payment_verified: paymentVerified,
    booking_confirmed: paymentVerified,
    state: paymentVerified ? "confirmed" : "capture_required",
    rebook: paymentVerified ? safeRebookHints(booking) : null,
    booking_reference_matches: String(booking.id || "") === bookingId
  });
}

async function loadBooking(env, bookingId) {
  const select = [
    "id", "status", "job_status", "deposit_cents", "payment_provider",
    "stripe_session_id", "stripe_payment_intent_id",
    "paypal_order_id", "paypal_capture_id",
    "package_code", "vehicle_size", "confirmed_at", "notes"
  ].join(",");
  const res = await fetch(
    `${env.SUPABASE_URL}/rest/v1/bookings?select=${encodeURIComponent(select)}&id=eq.${encodeURIComponent(bookingId)}&limit=1`,
    { headers: supaHeaders(env) }
  );
  const text = await res.text();
  const rows = safeJson(text);
  if (!res.ok) return { ok: false, status: res.status, error: "Could not load booking confirmation state." };
  const booking = Array.isArray(rows) ? rows[0] || null : null;
  if (!booking) return { ok: false, status: 404, error: "Booking not found." };
  return { ok: true, booking };
}

function safeRebookHints(booking) {
  return {
    package_code: safeChoice(booking?.package_code, 80),
    vehicle_size: ["small", "mid", "oversize"].includes(String(booking?.vehicle_size || "").toLowerCase())
      ? String(booking.vehicle_size).toLowerCase()
      : null
  };
}

function expectedPayableDepositCents(booking) {
  const depositCents = Math.max(0, Math.round(Number(booking?.deposit_cents || 0)));
  const note = String(booking?.notes || "");
  const giftAmount = note.match(/Gift redeemed against deposit:\s*([0-9]+(?:\.[0-9]{1,2})?)\s*CAD/i)?.[1] || "0";
  const giftCents = moneyToCents(giftAmount);
  return Math.max(0, depositCents - giftCents);
}

function isConfirmed(booking) {
  return String(booking?.status || "").trim().toLowerCase() === "confirmed";
}

function moneyToCents(value) {
  const number = Number(value || 0);
  return Number.isFinite(number) ? Math.round(number * 100) : 0;
}

function safeChoice(value, maxLength) {
  const text = String(value || "").trim();
  if (!text || text.length > maxLength) return null;
  return /^[a-z0-9_-]+$/i.test(text) ? text : null;
}

function supaHeaders(env) {
  return {
    apikey: env.SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
    Accept: "application/json"
  };
}

function safeJson(text) {
  try { return JSON.parse(text); } catch { return null; }
}

function jsonResponse(data, status = 200) {
  return new Response(status === 204 ? null : JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    }
  });
}
