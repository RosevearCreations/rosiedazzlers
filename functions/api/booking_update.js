import { requireStaffAccess, json, isUuid, serviceHeaders, cleanText } from "../_lib/staff-auth.js";

export async function onRequestOptions() {
  return corsResponse("", 204);
}

export async function onRequestPost({ request, env }) {
  try {
    const body = await readJson(request);
    const booking_id = String(body.booking_id || "").trim();
    if (!isUuid(booking_id)) return corsJson({ ok: false, error: "booking_id must be a uuid" }, 400);

    const access = await requireStaffAccess({
      request,
      env,
      body,
      capability: "manage_bookings",
      bookingId: booking_id,
      allowLegacyAdminFallback: false,
    });
    if (!access.ok) return corsResponseFrom(access.response);

    if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
      return corsJson({ ok: false, error: "Server not configured (Supabase env vars missing)" }, 500);
    }

    const action = String(body.action || "").trim();
    const supa = async (method, path, payload, prefer = "return=representation") => {
      const res = await fetch(`${env.SUPABASE_URL}${path}`, {
        method,
        headers: { ...serviceHeaders(env), Accept: "application/json", Prefer: prefer },
        body: payload ? JSON.stringify(payload) : undefined,
      });
      const text = await res.text();
      const data = text ? safeJson(text) : null;
      return { ok: res.ok, status: res.status, data, raw: text };
    };

    const get = await supa(
      "GET",
      `/rest/v1/bookings?select=id,progress_token,progress_enabled,job_status,service_date,package_code,vehicle_size,status,notes&id=eq.${encodeURIComponent(booking_id)}&limit=1`,
      null,
      "return=representation"
    );
    if (!get.ok) return corsJson({ ok: false, error: "Supabase error (booking lookup)", details: get }, 502);

    const booking = Array.isArray(get.data) ? get.data[0] : null;
    if (!booking) return corsJson({ ok: false, error: "Booking not found" }, 404);

    const now = new Date().toISOString();
    let patchPayload = null;
    let eventType = null;
    let eventNote = null;

    if (action === "set_job_status") {
      const job_status = String(body.job_status || "").trim();
      if (!["scheduled", "in_progress", "completed", "cancelled"].includes(job_status)) {
        return corsJson({ ok: false, error: "job_status must be scheduled|in_progress|completed|cancelled" }, 400);
      }
      patchPayload = { job_status, updated_at: now };
      if (job_status === "completed") patchPayload.completed_at = now;
      eventType = "job_status_changed";
      eventNote = `Job status set to ${job_status}.`;
    }

    if (action === "set_progress_enabled") {
      const pe = body.progress_enabled;
      if (typeof pe !== "boolean") return corsJson({ ok: false, error: "progress_enabled must be boolean" }, 400);
      patchPayload = { progress_enabled: pe, updated_at: now };
      if (pe === true && !booking.progress_token) patchPayload.progress_token = crypto.randomUUID();
      eventType = "progress_enabled_changed";
      eventNote = pe ? "Customer progress feed enabled." : "Customer progress feed disabled.";
    }

    if (action === "regen_progress_token") {
      patchPayload = { progress_token: crypto.randomUUID(), progress_enabled: true, updated_at: now };
      eventType = "progress_token_regenerated";
      eventNote = "Customer progress link regenerated.";
    }

    if (action === "set_intake_review") {
      const allowedPhotoStatuses = ["not_requested", "requested", "reviewing", "quote_needed", "quoted", "not_needed"];
      const allowedConditionStatuses = ["not_needed", "needs_review", "reviewing", "reviewed"];
      const allowedPrivacyStatuses = ["not_needed", "needs_review", "reviewing", "approved_for_public_use", "blocked_private_only"];

      const photoStatus = cleanChoice(body.photo_estimate_status, allowedPhotoStatuses, "not_requested");
      const conditionStatus = cleanChoice(body.condition_review_status, allowedConditionStatuses, "not_needed");
      const privacyStatus = cleanChoice(body.media_privacy_status, allowedPrivacyStatuses, "not_needed");
      const reviewNote = cleanText(body.intake_review_note).slice(0, 1500);

      patchPayload = {
        photo_estimate_status: photoStatus,
        condition_review_status: conditionStatus,
        media_privacy_status: privacyStatus,
        plate_privacy_reviewed: body.plate_privacy_reviewed === true,
        face_privacy_reviewed: body.face_privacy_reviewed === true,
        address_privacy_reviewed: body.address_privacy_reviewed === true,
        blur_crop_needed: body.blur_crop_needed === true,
        blur_crop_complete: body.blur_crop_complete === true,
        intake_review_note: reviewNote || null,
        intake_reviewed_at: now,
        intake_reviewed_by: access.actor?.id || null,
        updated_at: now
      };

      if (privacyStatus === "approved_for_public_use" || privacyStatus === "blocked_private_only") {
        patchPayload.media_consent_reviewed_at = now;
      }

      eventType = "booking_intake_review_updated";
      eventNote = [
        `Photo estimate=${photoStatus}`,
        `Condition review=${conditionStatus}`,
        `Media privacy=${privacyStatus}`,
        patchPayload.blur_crop_needed ? "Blur/crop needed" : "",
        patchPayload.blur_crop_complete ? "Blur/crop complete" : "",
        reviewNote ? `Note: ${reviewNote}` : ""
      ].filter(Boolean).join("; ");
    }

    if (!patchPayload) return corsJson({ ok: false, error: "Unknown action" }, 400);

    let upd = await supa("PATCH", `/rest/v1/bookings?id=eq.${encodeURIComponent(booking_id)}`, patchPayload, "return=representation");
    let usedIntakeFallback = false;

    if (!upd.ok && action === "set_intake_review" && looksLikeMissingOptionalIntakeColumn(upd.raw)) {
      usedIntakeFallback = true;
      const fallbackNotes = appendIntakeReviewFallbackNote(booking.notes, eventNote, now, access.actor);
      upd = await supa(
        "PATCH",
        `/rest/v1/bookings?id=eq.${encodeURIComponent(booking_id)}`,
        { notes: fallbackNotes, updated_at: now },
        "return=representation"
      );
    }

    if (!upd.ok) return corsJson({ ok: false, error: "Supabase update failed (bookings)", details: upd }, 502);

    const row = Array.isArray(upd.data) ? upd.data[0] : upd.data;
    if (eventType) {
      await fetch(`${env.SUPABASE_URL}/rest/v1/booking_events`, {
        method: "POST",
        headers: { ...serviceHeaders(env), Prefer: "return=minimal" },
        body: JSON.stringify([{
          booking_id,
          event_type: eventType,
          event_note: eventNote,
          actor_name: access.actor.full_name || access.actor.email || "Staff",
          payload: {
            actor_id: access.actor.id || null,
            action,
            job_status: cleanText(row?.job_status),
            progress_enabled: row?.progress_enabled === true,
          },
        }]),
      }).catch(() => null);
    }

    const origin = new URL(request.url).origin;
    const token = row.progress_token || null;
    const links = token ? {
      progress_url: `${origin}/progress?token=${encodeURIComponent(token)}`,
      complete_url: `${origin}/complete?token=${encodeURIComponent(token)}`,
    } : null;

    return corsJson({
      ok: true,
      row,
      links,
      actor: access.actor.full_name || access.actor.email || "Staff",
      warning: usedIntakeFallback ? "Optional intake-review columns are not migrated yet, so the review was appended to booking notes." : null
    });
  } catch (e) {
    return corsJson({ ok: false, error: "Server error", details: String(e) }, 500);
  }
}

async function readJson(request) {
  const t = await request.text();
  if (!t) return {};
  try { return JSON.parse(t); } catch { return {}; }
}
function safeJson(text) {
  try { return JSON.parse(text); } catch { return { raw: text }; }
}
function cleanChoice(value, allowed, fallback) {
  const text = cleanText(value);
  return allowed.includes(text) ? text : fallback;
}
function looksLikeMissingOptionalIntakeColumn(raw) {
  const text = String(raw || "").toLowerCase();
  const fields = [
    "photo_estimate_status",
    "condition_review_status",
    "media_privacy_status",
    "plate_privacy_reviewed",
    "face_privacy_reviewed",
    "address_privacy_reviewed",
    "blur_crop_needed",
    "blur_crop_complete",
    "intake_review_note",
    "intake_reviewed_at",
    "intake_reviewed_by",
    "media_consent_reviewed_at"
  ];
  return fields.some((field) => text.includes(field)) &&
    (text.includes("column") || text.includes("schema cache") || text.includes("could not find") || text.includes("42703"));
}
function appendIntakeReviewFallbackNote(existingNotes, eventNote, reviewedAt, actor) {
  const actorLabel = cleanText(actor?.full_name || actor?.email || "Staff");
  const line = [
    "Staff intake review status",
    reviewedAt,
    actorLabel,
    eventNote
  ].filter(Boolean).join(" — ");
  return [cleanText(existingNotes), line].filter(Boolean).join("\n\n");
}
function corsHeaders() {
  return {
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "POST,OPTIONS",
    "access-control-allow-headers": "Content-Type, x-admin-password, x-staff-email, x-staff-user-id",
    "cache-control": "no-store",
  };
}
function corsJson(obj, status = 200) {
  return new Response(JSON.stringify(obj), { status, headers: { "content-type": "application/json", ...corsHeaders() } });
}
function corsResponse(body = "", status = 200) {
  return new Response(body, { status, headers: corsHeaders() });
}
function corsResponseFrom(response) {
  const headers = new Headers(response.headers || {});
  for (const [k, v] of Object.entries(corsHeaders())) headers.set(k, v);
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}
