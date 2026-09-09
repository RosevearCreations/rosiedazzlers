import { getCurrentCustomerSession, serviceHeaders } from "../_lib/customer-session.js";
import { customerSafeReview } from "./_lib/customer-safe-shape.js";
import { decideReviewRequestLifecycle } from "../_lib/review-request-eligibility.js";

const GOOGLE_REVIEW_URL = "https://www.google.com/search?q=Rosie+Dazzlers+review";
const MAX_ELIGIBLE_BOOKINGS = 100;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function onRequestOptions() {
  return new Response("", { status: 204, headers: corsHeaders() });
}

export async function onRequestGet({ request, env }) {
  try {
    const current = await getCurrentCustomerSession({ env, request });
    if (!current?.customer_profile?.id) return withCors(json({ error: "Unauthorized." }, 401));

    const email = cleanEmail(current.customer_profile.email);
    if (!email) return withCors(json({ error: "Customer account email is unavailable." }, 400));

    const eligibleBookings = await loadEligibleBookings({
      env,
      email,
      customerProfileId: current.customer_profile.id
    });
    return withCors(
      json({
        ok: true,
        eligibility_rule: "authenticated_customer_completed_booking_with_completion_evidence",
        eligible_bookings: eligibleBookings,
        google_review_url: GOOGLE_REVIEW_URL
      })
    );
  } catch (err) {
    return withCors(json({ error: safeError(err) }, 500));
  }
}

export async function onRequestPost({ request, env }) {
  try {
    const current = await getCurrentCustomerSession({ env, request });
    if (!current?.customer_profile?.id) return withCors(json({ error: "Unauthorized." }, 401));

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return withCors(json({ error: "A review payload is required." }, 400));
    }

    const rating = Number(body.rating || 0);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return withCors(json({ error: "Rating must be a whole number between 1 and 5." }, 400));
    }

    const bookingId = cleanId(body.booking_id);
    if (!bookingId || !UUID_RE.test(bookingId)) {
      return withCors(json({ error: "Choose one of your completed bookings before submitting a review." }, 400));
    }

    const email = cleanEmail(current.customer_profile.email);
    if (!email) return withCors(json({ error: "Customer account email is unavailable." }, 400));

    const booking = await loadOwnedBooking({
      env,
      email,
      customerProfileId: current.customer_profile.id,
      bookingId
    });
    if (!booking || !bookingIsCompleted(booking)) {
      return withCors(json({ error: "Choose one of your completed bookings before submitting a review." }, 400));
    }

    const existing = await loadExistingReview({ env, bookingId: booking.id });
    if (existing) {
      const reviewRequestReconciled = await reconcileReviewRequestQueue({ env, bookingId: booking.id });
      return withCors(
        json({
          ok: true,
          duplicate: true,
          review: customerSafeReview(existing),
          booking_verified: true,
          publication_state: existing.status || "submitted_for_approval",
          review_request_reconciled: reviewRequestReconciled,
          google_review_url: GOOGLE_REVIEW_URL
        })
      );
    }

    const now = new Date().toISOString();
    const payload = {
      customer_profile_id: current.customer_profile.id,
      booking_id: booking.id,
      vehicle_id: null,
      review_source: "app",
      rating,
      review_title: cleanText(body.review_title, 160),
      review_text: cleanText(body.review_text, 4000),
      is_public: body.is_public === true,
      status: "submitted",
      google_review_url: GOOGLE_REVIEW_URL,
      reviewer_name: cleanText(current.customer_profile.full_name || current.customer_profile.email || "Customer", 200) || "Customer",
      updated_at: now
    };

    const res = await fetch(`${env.SUPABASE_URL}/rest/v1/customer_reviews`, {
      method: "POST",
      headers: { ...serviceHeaders(env), Prefer: "return=representation" },
      body: JSON.stringify([payload])
    });
    if (!res.ok) return withCors(json({ error: "Review storage is temporarily unavailable." }, 503));

    const rows = await res.json().catch(() => []);
    const saved = Array.isArray(rows) ? rows[0] || null : null;
    const reviewRequestReconciled = await reconcileReviewRequestQueue({ env, bookingId: booking.id });

    return withCors(
      json({
        ok: true,
        duplicate: false,
        review: customerSafeReview(saved),
        booking_verified: true,
        publication_state: "submitted_for_approval",
        review_request_reconciled: reviewRequestReconciled,
        google_review_url: GOOGLE_REVIEW_URL
      })
    );
  } catch (err) {
    return withCors(json({ error: safeError(err) }, 500));
  }
}

async function loadEligibleBookings({ env, email, customerProfileId }) {
  const ownerFilter = buildOwnerFilter({ email, customerProfileId });
  const url = `${env.SUPABASE_URL}/rest/v1/bookings?select=id,created_at,service_date,package_code,status,job_status,completed_at&${ownerFilter}&order=created_at.desc&limit=${MAX_ELIGIBLE_BOOKINGS}`;
  const res = await fetch(url, { headers: serviceHeaders(env) });
  if (!res.ok) throw new Error("Could not load completed bookings for review eligibility.");

  const rows = await res.json().catch(() => []);
  return (Array.isArray(rows) ? rows : [])
    .filter(bookingIsCompleted)
    .map((row) => ({
      id: row.id,
      service_date: row.service_date || null,
      package_code: row.package_code || null,
      status: row.status || null,
      job_status: row.job_status || null,
      completed_at: row.completed_at || null
    }));
}

async function loadOwnedBooking({ env, email, customerProfileId, bookingId }) {
  const ownerFilter = buildOwnerFilter({ email, customerProfileId });
  const url = `${env.SUPABASE_URL}/rest/v1/bookings?select=id,service_date,package_code,status,job_status,completed_at,customer_profile_id,customer_email&id=eq.${encodeURIComponent(bookingId)}&${ownerFilter}&limit=1`;
  const res = await fetch(url, { headers: serviceHeaders(env) });
  if (!res.ok) throw new Error("Could not verify review booking authority.");

  const rows = await res.json().catch(() => []);
  return Array.isArray(rows) ? rows[0] || null : null;
}

async function loadExistingReview({ env, bookingId }) {
  const url = `${env.SUPABASE_URL}/rest/v1/customer_reviews?select=id,created_at,updated_at,customer_profile_id,booking_id,vehicle_id,review_source,rating,review_title,review_text,is_public,status,google_review_url,reviewer_name&booking_id=eq.${encodeURIComponent(bookingId)}&order=created_at.asc&limit=1`;
  const res = await fetch(url, { headers: serviceHeaders(env) });
  if (!res.ok) throw new Error("Could not verify existing review evidence.");

  const rows = await res.json().catch(() => []);
  return Array.isArray(rows) ? rows[0] || null : null;
}

async function reconcileReviewRequestQueue({ env, bookingId }) {
  try {
    const headers = serviceHeaders(env);
    const url = `${env.SUPABASE_URL}/rest/v1/review_request_queue?select=id,status,sent_at,created_at&booking_id=eq.${encodeURIComponent(bookingId)}&order=created_at.asc`;
    const res = await fetch(url, { headers });
    if (!res.ok) return false;

    const rows = await res.json().catch(() => []);
    const now = new Date().toISOString();
    for (const row of Array.isArray(rows) ? rows : []) {
      if (!row?.id) continue;
      const decision = decideReviewRequestLifecycle({ request: row, hasReview: true, blocked: false });
      if (decision.action !== "update") continue;

      const patchRes = await fetch(
        `${env.SUPABASE_URL}/rest/v1/review_request_queue?id=eq.${encodeURIComponent(row.id)}`,
        {
          method: "PATCH",
          headers,
          body: JSON.stringify({ status: decision.status, updated_at: now })
        }
      );
      if (!patchRes.ok) return false;
    }

    await fetch(`${env.SUPABASE_URL}/rest/v1/bookings?id=eq.${encodeURIComponent(bookingId)}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ review_request_blocked_reason: null })
    }).catch(() => null);
    return true;
  } catch {
    return false;
  }
}

function buildOwnerFilter({ email, customerProfileId }) {
  const profile = encodeURIComponent(String(customerProfileId || "").trim());
  const mail = encodeURIComponent(cleanEmail(email));
  return `or=(customer_profile_id.eq.${profile},customer_email.eq.${mail})`;
}

function bookingIsCompleted(row) {
  return (
    !!row &&
    String(row.status || "").trim().toLowerCase() === "completed" &&
    String(row.job_status || "").trim().toLowerCase() === "completed" &&
    Boolean(row.completed_at)
  );
}

function cleanEmail(value) {
  return String(value || "").trim().toLowerCase().slice(0, 320);
}

function cleanId(value) {
  return String(value || "").trim().slice(0, 160) || null;
}

function cleanText(value, maxLength) {
  const text = String(value == null ? "" : value).trim();
  return text ? text.slice(0, maxLength) : null;
}

function safeError(err) {
  const raw = err?.message || String(err || "Unexpected review error.");
  return raw.replace(/Bearer\s+[A-Za-z0-9._\-]+/g, "Bearer [redacted]").slice(0, 300);
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" }
  });
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Cache-Control": "no-store"
  };
}

function applyCors(headers) {
  const out = headers instanceof Headers ? new Headers(headers) : new Headers(headers || {});
  for (const [key, value] of Object.entries(corsHeaders())) if (!out.has(key)) out.set(key, value);
  return out;
}

function withCors(response) {
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: applyCors(response.headers || {})
  });
}
