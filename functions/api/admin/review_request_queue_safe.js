import { requireStaffAccess, serviceHeaders, json, isUuid } from "../_lib/staff-auth.js";
import { queueReviewRequestInvitation } from "../_lib/review-request-dispatch.js";
import {
  bookingHasCompletionEvidence,
  chooseCanonicalReviewRequest,
  decideReviewRequestLifecycle,
  normalizeReviewRequestStatus,
  shouldSuppressDuplicateReviewRequest
} from "../_lib/review-request-eligibility.js";

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json().catch(() => ({}));
    const bookingId = String(body.booking_id || "").trim();
    if (!isUuid(bookingId)) return withCors(json({ ok: false, error: "Valid booking_id is required." }, 400));

    const access = await requireStaffAccess({
      request,
      env,
      body,
      capability: "manage_bookings",
      bookingId,
      allowLegacyAdminFallback: true
    });
    if (!access.ok) return withCors(access.response);

    const headers = serviceHeaders(env);
    const bookingRes = await fetch(
      `${env.SUPABASE_URL}/rest/v1/bookings?select=id,customer_profile_id,customer_email,customer_name,job_status,status,completed_at&id=eq.${encodeURIComponent(bookingId)}&limit=1`,
      { headers }
    );
    if (!bookingRes.ok) return withCors(json({ ok: false, error: `Could not load booking. ${await bookingRes.text()}` }, 500));
    const booking = (await bookingRes.json().catch(() => []))?.[0] || null;
    if (!booking) return withCors(json({ ok: false, error: "Booking not found." }, 404));

    const [incidents, payments, balances, summary, reviews, queueRows] = await Promise.all([
      load(env, `incident_reports?select=id,status,decision_status,title&booking_id=eq.${encodeURIComponent(bookingId)}`),
      load(env, `quote_deposit_payment_requests?select=id,payment_status,paid_at&or=(booking_id.eq.${encodeURIComponent(bookingId)},confirmed_booking_id.eq.${encodeURIComponent(bookingId)})`),
      load(env, `final_balance_payment_requests?select=id,status,paid_at&booking_id=eq.${encodeURIComponent(bookingId)}`),
      load(env, `completed_job_summaries?select=id,status,customer_visible&booking_id=eq.${encodeURIComponent(bookingId)}&limit=1`),
      loadRequired(env, `customer_reviews?select=id,status,created_at&booking_id=eq.${encodeURIComponent(bookingId)}&order=created_at.asc&limit=1`, "review evidence"),
      loadRequired(env, `review_request_queue?select=id,status,sent_at,send_after,created_at,updated_at,channel,review_url,trigger_event,customer_id&booking_id=eq.${encodeURIComponent(bookingId)}&order=created_at.asc`, "review request lifecycle")
    ]);

    const blockers = [];
    if (!bookingHasCompletionEvidence(booking)) blockers.push("Job completion evidence is incomplete.");

    const unresolved = (incidents || []).filter(
      (row) =>
        !["resolved", "closed", "customer_visible"].includes(String(row.status || "").toLowerCase()) &&
        !["resolved", "no_fault", "customer_resolved"].includes(String(row.decision_status || "").toLowerCase())
    );
    if (unresolved.length) blockers.push(`${unresolved.length} incident report(s) remain unresolved.`);

    const paid =
      (balances || []).some((row) => row.paid_at || /paid/i.test(String(row.status || ""))) ||
      (payments || []).some((row) => row.paid_at || /paid/i.test(String(row.payment_status || "")));
    if (!paid) blockers.push("Final payment is not recorded as paid.");
    if (!(summary || [])[0]?.customer_visible) blockers.push("Customer-visible completed-job summary is not ready.");

    const review = (reviews || [])[0] || null;
    const existingRows = Array.isArray(queueRows) ? queueRows : [];
    const canonical = chooseCanonicalReviewRequest(existingRows);
    const decision = decideReviewRequestLifecycle({
      request: canonical,
      hasReview: Boolean(review),
      blocked: blockers.length > 0
    });
    const now = new Date().toISOString();

    await suppressDuplicateRows({ env, rows: existingRows, canonicalId: canonical?.id || null, now });

    if (!canonical && review) {
      await updateBookingBlockedReason(env, bookingId, null);
      return withCors(
        json({
          ok: true,
          status: "review_exists",
          blocked: false,
          blockers: [],
          queued: false,
          replay: true,
          already_reviewed: true,
          review,
          request: null,
          dispatch_queue: null
        })
      );
    }

    if (canonical) {
      const previousStatus = normalizeReviewRequestStatus(canonical.status);
      const patch = { updated_at: now };
      let shouldPatch = decision.action === "update";

      if (decision.action === "update") patch.status = decision.status;
      if (decision.status === "queued" && !canonical.send_after) {
        patch.send_after = body.send_after || new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
        shouldPatch = true;
      }
      if (decision.status === "blocked" && previousStatus !== "sent" && !canonical.sent_at) {
        patch.send_after = null;
        shouldPatch = true;
      }

      const saved = shouldPatch ? await patchQueueRow(env, canonical.id, patch) : canonical;
      await updateBookingBlockedReason(env, bookingId, review ? null : blockers.join(" ") || null);

      let dispatchQueue = null;
      if (!review && decision.status === "queued" && previousStatus !== "queued") {
        dispatchQueue = await queueReviewRequestInvitation({ env, booking, request: saved }).catch((err) => ({
          ok: false,
          error: err?.message || "Could not queue review invitation notification."
        }));
      }

      return withCors(
        json({
          ok: true,
          status: decision.status,
          blocked: !review && decision.status === "blocked",
          blockers: review ? [] : blockers,
          queued: decision.status === "queued",
          replay: true,
          already_reviewed: Boolean(review),
          lifecycle_reason: decision.reason,
          review,
          request: saved,
          dispatch_queue: dispatchQueue
        })
      );
    }

    const status = blockers.length ? "blocked" : "queued";
    const row = {
      booking_id: bookingId,
      customer_id: booking.customer_profile_id || null,
      trigger_event: "completed_booking",
      status,
      channel: String(body.channel || "email"),
      send_after: blockers.length ? null : body.send_after || new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
      sent_at: null,
      review_url: String(body.review_url || env.GOOGLE_REVIEW_URL || ""),
      reusable_as_public_proof: false,
      updated_at: now,
      created_at: now
    };

    const res = await fetch(`${env.SUPABASE_URL}/rest/v1/review_request_queue`, {
      method: "POST",
      headers: { ...headers, Prefer: "return=representation" },
      body: JSON.stringify([row])
    });
    if (!res.ok) return withCors(json({ ok: false, error: `Could not save review request. ${await res.text()}` }, 500));
    const saved = (await res.json().catch(() => []))?.[0] || row;

    await updateBookingBlockedReason(env, bookingId, blockers.join(" ") || null);
    let dispatchQueue = null;
    if (!blockers.length) {
      dispatchQueue = await queueReviewRequestInvitation({ env, booking, request: saved }).catch((err) => ({
        ok: false,
        error: err?.message || "Could not queue review invitation notification."
      }));
    }

    return withCors(
      json({
        ok: true,
        status,
        blocked: blockers.length > 0,
        blockers,
        queued: status === "queued",
        replay: false,
        already_reviewed: false,
        lifecycle_reason: blockers.length ? "eligibility_blocked" : "eligible",
        request: saved,
        dispatch_queue: dispatchQueue
      })
    );
  } catch (err) {
    return withCors(json({ ok: false, error: err?.message || "Could not queue review request." }, 500));
  }
}

async function load(env, path) {
  try {
    const res = await fetch(`${env.SUPABASE_URL}/rest/v1/${path}`, { headers: serviceHeaders(env) });
    return res.ok ? await res.json().catch(() => []) : [];
  } catch {
    return [];
  }
}

async function loadRequired(env, path, label) {
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/${path}`, { headers: serviceHeaders(env) });
  if (!res.ok) throw new Error(`Could not verify ${label}.`);
  const rows = await res.json().catch(() => []);
  return Array.isArray(rows) ? rows : [];
}

async function patchQueueRow(env, id, patch) {
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/review_request_queue?id=eq.${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { ...serviceHeaders(env), Prefer: "return=representation" },
    body: JSON.stringify(patch)
  });
  if (!res.ok) throw new Error("Could not reconcile review request lifecycle.");
  const rows = await res.json().catch(() => []);
  return Array.isArray(rows) ? rows[0] || { id, ...patch } : { id, ...patch };
}

async function suppressDuplicateRows({ env, rows, canonicalId, now }) {
  for (const row of Array.isArray(rows) ? rows : []) {
    if (!row?.id || row.id === canonicalId || !shouldSuppressDuplicateReviewRequest(row)) continue;
    await patchQueueRow(env, row.id, { status: "suppressed", updated_at: now });
  }
}

async function updateBookingBlockedReason(env, bookingId, reason) {
  await fetch(`${env.SUPABASE_URL}/rest/v1/bookings?id=eq.${encodeURIComponent(bookingId)}`, {
    method: "PATCH",
    headers: serviceHeaders(env),
    body: JSON.stringify({ review_request_blocked_reason: reason || null })
  }).catch(() => null);
}

export async function onRequestOptions() {
  return new Response("", { status: 204, headers: corsHeaders() });
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type,x-admin-password,x-staff-email,x-staff-user-id",
    "Cache-Control": "no-store"
  };
}

function withCors(response) {
  const headers = new Headers(response.headers || {});
  for (const [key, value] of Object.entries(corsHeaders())) headers.set(key, value);
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}
