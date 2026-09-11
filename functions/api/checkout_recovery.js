// Build 380 — Booking Recovery & Failure Handling
// Recovery wrapper around the canonical checkout authority.
// It never weakens canonical pricing, availability, acknowledgement, or payment rules.
// It only resumes a matching recent pending booking for the same customer/slot when a usable provider session already exists.

import { onRequestPost as canonicalCheckout, onRequestOptions as canonicalOptions } from "./checkout.js";
import { loadPricingCatalog } from "./_lib/pricing-catalog.js";

export async function onRequestOptions() {
  return typeof canonicalOptions === "function" ? canonicalOptions() : corsResponse("", 204);
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const cloned = request.clone();
  const body = await cloned.json().catch(() => null);

  if (!body || typeof body !== "object" || !env?.SUPABASE_URL || !env?.SUPABASE_SERVICE_ROLE_KEY) {
    return canonicalCheckout(context);
  }

  const serviceDate = String(body.service_date || "").trim();
  const email = String(body.customer_email || "").trim().toLowerCase();
  const packageCode = String(body.package_code || "").trim();
  const vehicleSize = String(body.vehicle_size || "").trim();
  const requestedSlots = requestedSlotList(body.start_slot, body.duration_slots);

  if (!/^\d{4}-\d{2}-\d{2}$/.test(serviceDate) || !email || !packageCode || !vehicleSize || !requestedSlots.length) {
    return canonicalCheckout(context);
  }

  let sameDateRows = [];
  try {
    sameDateRows = await fetchSameDateBookings(env, serviceDate);
  } catch {
    // Recovery is an enhancement only. If its read path is unavailable, fall through to the canonical checkout.
    return canonicalCheckout(context);
  }

  let holdMinutes = 30;
  try {
    const pricing = await loadPricingCatalog(env);
    const configured = Number(pricing?.booking_rules?.hold_minutes || 30);
    if (Number.isFinite(configured) && configured > 0 && configured <= 240) holdMinutes = configured;
  } catch {
    // Canonical checkout currently defaults to 30 minutes as well.
  }

  const holdSinceMs = Date.now() - holdMinutes * 60 * 1000;
  const activeRows = sameDateRows.filter((row) => {
    const status = String(row?.status || "").toLowerCase();
    if (status === "confirmed") return true;
    if (status !== "pending") return false;
    const createdMs = Date.parse(row?.created_at || "");
    return Number.isFinite(createdMs) && createdMs >= holdSinceMs;
  });

  const candidate = activeRows.find((row) => {
    if (String(row?.status || "").toLowerCase() !== "pending") return false;
    if (String(row?.customer_email || "").trim().toLowerCase() !== email) return false;
    if (String(row?.package_code || "").trim() !== packageCode) return false;
    if (String(row?.vehicle_size || "").trim() !== vehicleSize) return false;
    return slotsOverlap(requestedSlots, bookingSlots(row));
  }) || null;

  if (!candidate) return canonicalCheckout(context);

  const otherBlocker = activeRows.find((row) => row?.id !== candidate.id && slotsOverlap(requestedSlots, bookingSlots(row)));
  if (otherBlocker) {
    return corsJson({
      error: "Selected slot is no longer available. Refresh availability and choose another time.",
      recovery_state: "stale_availability",
      retryable: true
    }, 409);
  }

  const provider = String(candidate.payment_provider || body.payment_provider || "stripe").trim().toLowerCase();

  if (provider === "paypal") {
    return recoverPayPal({ env, request, booking: candidate, holdMinutes });
  }

  return recoverStripe({ env, request, booking: candidate, holdMinutes });
}

async function fetchSameDateBookings(env, serviceDate) {
  const fields = [
    "id", "status", "created_at", "service_date", "start_slot", "duration_slots",
    "customer_email", "package_code", "vehicle_size", "payment_provider",
    "stripe_session_id", "paypal_order_id"
  ].join(",");
  const path = `/rest/v1/bookings?select=${encodeURIComponent(fields)}&service_date=eq.${encodeURIComponent(serviceDate)}&status=in.(pending,confirmed)&order=created_at.desc&limit=100`;
  const res = await fetch(`${env.SUPABASE_URL}${path}`, {
    headers: {
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      Accept: "application/json"
    }
  });
  if (!res.ok) throw new Error("booking recovery lookup failed");
  const data = await res.json().catch(() => []);
  return Array.isArray(data) ? data : [];
}

function requestedSlotList(startSlot, durationSlots) {
  const slot = String(startSlot || "").trim().toUpperCase();
  const duration = Number(durationSlots);
  if (!["AM", "PM"].includes(slot) || ![1, 2].includes(duration)) return [];
  if (duration === 2) return ["AM", "PM"];
  return [slot];
}

function bookingSlots(row) {
  return requestedSlotList(row?.start_slot, row?.duration_slots);
}

function slotsOverlap(left, right) {
  return left.some((slot) => right.includes(slot));
}

async function recoverStripe({ env, request, booking, holdMinutes }) {
  if (!env.STRIPE_SECRET_KEY) {
    return corsJson({ error: "Payment recovery is temporarily unavailable.", recovery_state: "provider_configuration", retryable: true }, 503);
  }

  const sessionId = String(booking?.stripe_session_id || "").trim();
  if (!sessionId) {
    return corsJson({
      error: "Your booking hold exists, but the payment session is still attaching. Please retry safely in a moment.",
      recovery_state: "pending_session_attach",
      booking_id: booking?.id || null,
      retryable: true,
      retry_after_seconds: 1
    }, 409);
  }

  const res = await fetch(`https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}`, {
    headers: { Authorization: `Bearer ${env.STRIPE_SECRET_KEY}` }
  });
  const text = await res.text();
  const session = safeJson(text);
  if (!res.ok || !session?.id) {
    return corsJson({
      error: "We found your booking hold, but could not verify the existing payment session. No duplicate booking was created.",
      recovery_state: "provider_lookup_failed",
      booking_id: booking?.id || null,
      retryable: true
    }, 502);
  }

  if (session.status === "open" && session.url) {
    return corsJson({
      ok: true,
      recovered: true,
      mode: "stripe_recovery",
      booking_id: booking.id,
      checkout_url: session.url,
      hold_minutes: holdMinutes
    });
  }

  if (session.status === "complete") {
    const completeUrl = new URL("/complete", request.url);
    completeUrl.searchParams.set("provider", "stripe");
    completeUrl.searchParams.set("booking_id", booking.id);
    completeUrl.searchParams.set("session_id", session.id);
    return corsJson({
      ok: true,
      recovered: true,
      mode: "stripe_complete_recovery",
      booking_id: booking.id,
      checkout_url: completeUrl.toString()
    });
  }

  return corsJson({
    error: "Your earlier payment session is no longer open. Your booking hold was preserved and no duplicate booking was created. Refresh availability before trying again.",
    recovery_state: "payment_session_expired",
    booking_id: booking.id,
    retryable: true
  }, 409);
}

async function recoverPayPal({ env, request, booking, holdMinutes }) {
  if (!env.PAYPAL_CLIENT_ID || !env.PAYPAL_CLIENT_SECRET) {
    return corsJson({ error: "Payment recovery is temporarily unavailable.", recovery_state: "provider_configuration", retryable: true }, 503);
  }

  const orderId = String(booking?.paypal_order_id || "").trim();
  if (!orderId) {
    return corsJson({
      error: "Your booking hold exists, but the payment session is still attaching. Please retry safely in a moment.",
      recovery_state: "pending_session_attach",
      booking_id: booking?.id || null,
      retryable: true,
      retry_after_seconds: 1
    }, 409);
  }

  const token = await getPayPalAccessToken(env).catch(() => null);
  if (!token) {
    return corsJson({ error: "Could not verify the existing PayPal session. No duplicate booking was created.", recovery_state: "provider_lookup_failed", retryable: true }, 502);
  }

  const res = await fetch(`${paypalBase(env)}/v2/checkout/orders/${encodeURIComponent(orderId)}`, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" }
  });
  const text = await res.text();
  const order = safeJson(text);
  if (!res.ok || !order?.id) {
    return corsJson({ error: "Could not verify the existing PayPal session. No duplicate booking was created.", recovery_state: "provider_lookup_failed", booking_id: booking?.id || null, retryable: true }, 502);
  }

  if (String(order.status || "").toUpperCase() === "COMPLETED") {
    const completeUrl = new URL("/complete", request.url);
    completeUrl.searchParams.set("provider", "paypal");
    completeUrl.searchParams.set("booking_id", booking.id);
    completeUrl.searchParams.set("token", order.id);
    return corsJson({ ok: true, recovered: true, mode: "paypal_complete_recovery", booking_id: booking.id, checkout_url: completeUrl.toString() });
  }

  const approveUrl = Array.isArray(order.links) ? (order.links.find((row) => row?.rel === "approve") || {}).href || null : null;
  if (approveUrl) {
    return corsJson({ ok: true, recovered: true, mode: "paypal_recovery", booking_id: booking.id, checkout_url: approveUrl, approve_url: approveUrl, hold_minutes: holdMinutes });
  }

  return corsJson({
    error: "Your PayPal session cannot be resumed from its current state. Your booking hold was preserved and no duplicate booking was created.",
    recovery_state: "payment_session_expired",
    booking_id: booking.id,
    retryable: true
  }, 409);
}

function paypalBase(env) {
  return String(env.PAYPAL_API_BASE || "").trim() || "https://api-m.paypal.com";
}

async function getPayPalAccessToken(env) {
  const auth = btoa(`${env.PAYPAL_CLIENT_ID}:${env.PAYPAL_CLIENT_SECRET}`);
  const res = await fetch(`${paypalBase(env)}/v1/oauth2/token`, {
    method: "POST",
    headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: "grant_type=client_credentials"
  });
  const text = await res.text();
  const data = safeJson(text);
  if (!res.ok || !data?.access_token) throw new Error("PayPal auth failed");
  return data.access_token;
}

function safeJson(text) {
  try { return JSON.parse(text); } catch { return null; }
}

function corsJson(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", ...corsHeaders() }
  });
}

function corsResponse(body = "", status = 200) {
  return new Response(body, { status, headers: corsHeaders() });
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Cache-Control": "no-store"
  };
}
