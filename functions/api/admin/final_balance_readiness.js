// Build 317 — read-only final-balance readiness authority.
// This endpoint never creates a request, checkout, notification, charge, or recurring billing instruction.
import { requireStaffAccess, json, serviceHeaders } from "../_lib/staff-auth.js";

const FINANCE_EVENT_TYPES = ["deposit", "final_payment", "tip", "refund", "discount", "other"].map((type) => `booking_finance_${type}`);
const PAYMENT_STAGE_STATUSES = new Set(["completed", "complete", "in_progress", "in-progress", "in progress"]);
const PAID_REQUEST_STATUSES = new Set(["paid", "succeeded", "complete", "completed"]);
const CLOSED_REQUEST_STATUSES = new Set(["cancelled", "canceled", "expired", "void"]);

export async function onRequestGet({ request, env }) {
  try {
    const access = await requireStaffAccess({ request, env, capability: "manage_bookings", allowLegacyAdminFallback: true });
    if (!access.ok) return access.response;
    if (!hasSupabaseConfig(env)) return json({ ok: false, error: "Supabase service configuration is missing." }, 500);

    const url = new URL(request.url);
    const limit = Math.max(1, Math.min(250, Number(url.searchParams.get("limit") || 150) || 150));
    const [bookingsResult, financeResult, requestsResult] = await Promise.all([
      loadBookings(env, limit),
      loadFinanceEvents(env),
      loadFinalBalanceRequests(env)
    ]);

    if (!bookingsResult.ok) return json({ ok: false, error: bookingsResult.error }, 500);

    const financeByBooking = summarizeFinance(financeResult.rows);
    const requestsByBooking = groupRequests(requestsResult.rows);
    const rows = bookingsResult.rows.map((booking) => deriveReadiness({
      booking,
      finance: financeByBooking.get(String(booking.id)) || emptyFinanceSummary(),
      financeAvailable: financeResult.ok,
      requests: requestsByBooking.get(String(booking.id)) || [],
      requestsAvailable: requestsResult.ok
    }));

    const counts = rows.reduce((acc, row) => {
      acc[row.readiness] = (acc[row.readiness] || 0) + 1;
      return acc;
    }, { ready: 0, blocked: 0, requested: 0, paid: 0 });

    return json({
      ok: true,
      generated_at: new Date().toISOString(),
      contract: {
        automatic_charge: false,
        automatic_final_balance_request: false,
        recurring_billing: false,
        operator_action_required: true
      },
      counts,
      rows,
      warnings: [financeResult.warning, requestsResult.warning].filter(Boolean)
    });
  } catch (err) {
    return json({ ok: false, error: err?.message || "Could not calculate final-balance readiness." }, 500);
  }
}

export async function onRequestPost() {
  return json({ ok: false, error: "Readiness is read-only. Use the existing explicit final-balance request endpoint for operator-approved mutations." }, 405);
}

async function loadBookings(env, limit) {
  const select = ["id", "status", "job_status", "customer_name", "customer_email", "service_date", "start_slot", "package_code", "vehicle_size", "price_total_cents", "progress_token", "created_at"].join(",");
  const endpoint = `${env.SUPABASE_URL}/rest/v1/bookings?select=${encodeURIComponent(select)}&order=${encodeURIComponent("service_date.desc,created_at.desc")}&limit=${limit}`;
  const res = await fetch(endpoint, { headers: serviceHeaders(env) });
  const text = await res.text();
  if (!res.ok) return { ok: false, rows: [], error: `Could not load bookings for final-balance readiness. ${text}` };
  return { ok: true, rows: safeArray(text) };
}

async function loadFinanceEvents(env) {
  const eventFilter = FINANCE_EVENT_TYPES.map((type) => `event_type.eq.${type}`).join(",");
  const endpoint = `${env.SUPABASE_URL}/rest/v1/booking_events?select=${encodeURIComponent("booking_id,event_type,payload,created_at")}&or=(${eventFilter})&order=created_at.asc&limit=5000`;
  const res = await fetch(endpoint, { headers: serviceHeaders(env) });
  const text = await res.text();
  if (!res.ok) return { ok: false, rows: [], warning: `Finance entries could not be read; affected bookings are blocked. ${text}` };
  return { ok: true, rows: safeArray(text), warning: null };
}

async function loadFinalBalanceRequests(env) {
  const select = ["id", "booking_id", "amount_cents", "currency", "status", "payment_url", "checkout_url", "provider", "provider_status", "expires_at", "link_sent_at", "cancelled_at", "paid_at", "paid_amount_cents", "created_at", "updated_at"].join(",");
  const endpoint = `${env.SUPABASE_URL}/rest/v1/final_balance_payment_requests?select=${encodeURIComponent(select)}&order=created_at.desc&limit=1000`;
  const res = await fetch(endpoint, { headers: serviceHeaders(env) });
  const text = await res.text();
  if (!res.ok) return { ok: false, rows: [], warning: `Final-balance requests could not be read; affected bookings are blocked. ${text}` };
  return { ok: true, rows: safeArray(text), warning: null };
}

function summarizeFinance(rows) {
  const map = new Map();
  for (const row of Array.isArray(rows) ? rows : []) {
    const bookingId = String(row?.booking_id || "");
    if (!bookingId) continue;
    const summary = map.get(bookingId) || emptyFinanceSummary();
    const payload = row && typeof row.payload === "object" && row.payload ? row.payload : {};
    const type = String(payload.entry_type || row.event_type || "").replace("booking_finance_", "");
    const amount = Number(payload.amount_cad || 0);
    if (Object.prototype.hasOwnProperty.call(summary, type) && Number.isFinite(amount)) summary[type] += amount;
    map.set(bookingId, summary);
  }
  return map;
}

function emptyFinanceSummary() {
  return { deposit: 0, final_payment: 0, tip: 0, refund: 0, discount: 0, other: 0 };
}

function groupRequests(rows) {
  const map = new Map();
  for (const row of Array.isArray(rows) ? rows : []) {
    const bookingId = String(row?.booking_id || "");
    if (!bookingId) continue;
    if (!map.has(bookingId)) map.set(bookingId, []);
    map.get(bookingId).push(row);
  }
  return map;
}

function deriveReadiness({ booking, finance, financeAvailable, requests, requestsAvailable }) {
  const totalCents = Math.max(0, Math.round(Number(booking?.price_total_cents || 0)));
  const depositCents = cents(finance.deposit);
  const finalPaymentCents = cents(finance.final_payment);
  const discountCents = cents(finance.discount);
  const refundCents = cents(finance.refund);
  const otherCents = cents(finance.other);
  const calculatedDueCents = Math.max(0, totalCents - depositCents - finalPaymentCents - discountCents - otherCents + refundCents);
  const latestRequest = Array.isArray(requests) && requests.length ? requests[0] : null;
  const paidRequest = (requests || []).find(isPaidRequest) || null;
  const activeRequest = (requests || []).find(isActiveRequest) || null;
  const staleRequest = !activeRequest && !paidRequest ? (requests || []).find(isClosedOrExpiredRequest) || null : null;
  const stage = normalizeStatus(booking?.job_status || booking?.status);
  const reasons = [];
  let readiness = "blocked";

  if (!financeAvailable) reasons.push("Finance entries are unavailable, so the remaining balance cannot be verified.");
  if (!requestsAvailable) reasons.push("Final-balance request history is unavailable, so duplicate-request protection cannot be verified.");

  if (paidRequest) {
    readiness = "paid";
    reasons.push("A tracked final-balance request reports paid.");
  } else if (financeAvailable && totalCents > 0 && calculatedDueCents <= 0) {
    readiness = "paid";
    reasons.push("Recorded service collections and adjustments leave no calculated balance due.");
  } else if (activeRequest) {
    readiness = "requested";
    reasons.push(`A final-balance request is already ${normalizeStatus(activeRequest.status) || "open"}; do not create a duplicate.`);
  } else if (financeAvailable && requestsAvailable) {
    if (totalCents <= 0) reasons.push("Booking total is zero or unavailable; verify the booking total before requesting payment.");
    if (staleRequest) reasons.push("A cancelled or expired final-balance request exists; review it before creating a replacement.");
    if (totalCents > 0 && calculatedDueCents > 0 && !staleRequest && PAYMENT_STAGE_STATUSES.has(stage)) {
      readiness = "ready";
      reasons.push("A positive service balance remains and no active final-balance request exists.");
    } else if (totalCents > 0 && calculatedDueCents > 0 && !PAYMENT_STAGE_STATUSES.has(stage)) {
      reasons.push("Job must be in progress or completed before the final-balance handoff is marked ready.");
    }
  }

  return {
    booking_id: booking.id,
    customer_name: booking.customer_name || "",
    customer_email: booking.customer_email || "",
    service_date: booking.service_date || null,
    start_slot: booking.start_slot || null,
    package_code: booking.package_code || "",
    vehicle_size: booking.vehicle_size || "",
    status: booking.status || "",
    job_status: booking.job_status || "",
    progress_token_available: !!booking.progress_token,
    total_cents: totalCents,
    calculated_due_cents: calculatedDueCents,
    finance: {
      deposit_cents: depositCents,
      final_payment_cents: finalPaymentCents,
      discount_cents: discountCents,
      refund_cents: refundCents,
      other_cents: otherCents,
      tip_cents: cents(finance.tip)
    },
    readiness,
    reasons,
    active_request: activeRequest ? safeRequest(activeRequest) : null,
    latest_request: latestRequest ? safeRequest(latestRequest) : null
  };
}

function isPaidRequest(row) {
  const status = normalizeStatus(row?.status);
  const providerStatus = normalizeStatus(row?.provider_status);
  return !!row?.paid_at || PAID_REQUEST_STATUSES.has(status) || providerStatus.includes("paid") || providerStatus.includes("succeeded");
}

function isActiveRequest(row) {
  if (!row || isPaidRequest(row) || isClosedOrExpiredRequest(row)) return false;
  const status = normalizeStatus(row.status);
  return !CLOSED_REQUEST_STATUSES.has(status);
}

function isClosedOrExpiredRequest(row) {
  if (!row) return false;
  if (row.cancelled_at) return true;
  const status = normalizeStatus(row.status);
  if (CLOSED_REQUEST_STATUSES.has(status)) return true;
  const expires = row.expires_at ? Date.parse(row.expires_at) : NaN;
  return Number.isFinite(expires) && expires <= Date.now();
}

function safeRequest(row) {
  return {
    id: row.id,
    amount_cents: Number(row.amount_cents || 0),
    currency: row.currency || "CAD",
    status: row.status || "",
    provider: row.provider || "",
    provider_status: row.provider_status || "",
    payment_url: row.payment_url || null,
    checkout_url: row.checkout_url || null,
    expires_at: row.expires_at || null,
    link_sent_at: row.link_sent_at || null,
    paid_at: row.paid_at || null,
    paid_amount_cents: Number(row.paid_amount_cents || 0),
    created_at: row.created_at || null,
    updated_at: row.updated_at || null
  };
}

function cents(cad) {
  const value = Number(cad || 0);
  return Number.isFinite(value) ? Math.round(value * 100) : 0;
}

function normalizeStatus(value) {
  return String(value || "").trim().toLowerCase();
}

function safeArray(text) {
  try {
    const value = text ? JSON.parse(text) : [];
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function hasSupabaseConfig(env) {
  return !!(env?.SUPABASE_URL && (env?.SUPABASE_SERVICE_ROLE_KEY || env?.SUPABASE_SERVICE_KEY || env?.SUPABASE_SERVICE_ROLE || env?.SUPABASE_SECRET_KEY));
}
