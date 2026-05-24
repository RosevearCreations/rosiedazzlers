import { requireStaffAccess, json, serviceHeaders, cleanText, isUuid, methodNotAllowed } from "../_lib/staff-auth.js";

export async function onRequestPost({ request, env }) {
  try {
    if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
      return withCors(json({ ok: false, error: "Server configuration is incomplete." }, 500));
    }

    const body = await request.json().catch(() => ({}));
    const access = await requireStaffAccess({
      request,
      env,
      body,
      capability: "manage_bookings",
      allowLegacyAdminFallback: true
    });
    if (!access.ok) return withCors(access.response);

    const id = cleanText(body.id);
    if (!isUuid(id)) return withCors(json({ ok: false, error: "Valid upload id is required." }, 400));

    const booking_id = cleanText(body.booking_id);
    const lead_id = cleanText(body.lead_id);
    if (booking_id && !isUuid(booking_id)) return withCors(json({ ok: false, error: "Booking id must be a valid UUID or blank." }, 400));
    if (lead_id && !isUuid(lead_id)) return withCors(json({ ok: false, error: "Lead id must be a valid UUID or blank." }, 400));

    const patch = {
      status: normalizeStatus(body.status),
      privacy_status: normalizePrivacyStatus(body.privacy_status),
      booking_id: booking_id || null,
      lead_id: lead_id || null,
      linked_at: booking_id || lead_id ? new Date().toISOString() : null,
      staff_note: cleanText(body.staff_note) || null,
      privacy_note: cleanText(body.privacy_note) || null,
      reviewed_at: new Date().toISOString(),
      reviewed_by_staff_user_id: access.actor?.id || null
    };

    const saved = await patchUpload(env, id, patch);
    return withCors(json({ ok: true, upload: saved, actor: actorSummary(access.actor) }));
  } catch (err) {
    return withCors(json({
      ok: false,
      error: err?.message || "Could not update photo estimate upload.",
      migration_hint: "Run sql/2026-05-23_build168_admin_leads_photo_review.sql if review note fields are missing."
    }, 500));
  }
}

export async function onRequestOptions() {
  return new Response("", { status: 204, headers: corsHeaders() });
}

export async function onRequestGet() {
  return withCors(methodNotAllowed());
}

async function patchUpload(env, id, patch) {
  let res = await fetch(`${env.SUPABASE_URL}/rest/v1/photo_estimate_uploads?id=eq.${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { ...serviceHeaders(env), Prefer: "return=representation" },
    body: JSON.stringify(patch)
  });
  let text = await res.text();
  let data = safeJson(text);

  if (!res.ok && /staff_note|privacy_note|reviewed_at|reviewed_by_staff_user_id|column/i.test(String(data?.message || text))) {
    const fallbackPatch = {
      status: patch.status,
      privacy_status: patch.privacy_status,
      booking_id: patch.booking_id,
      lead_id: patch.lead_id,
      linked_at: patch.linked_at
    };
    res = await fetch(`${env.SUPABASE_URL}/rest/v1/photo_estimate_uploads?id=eq.${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: { ...serviceHeaders(env), Prefer: "return=representation" },
      body: JSON.stringify(fallbackPatch)
    });
    text = await res.text();
    data = safeJson(text);
  }

  if (!res.ok) throw new Error(extractSupabaseError(data, text, "Could not update photo estimate upload."));
  return Array.isArray(data) ? data[0] || null : data;
}

function normalizeStatus(value) {
  const status = cleanSlug(value);
  const allowed = new Set(["signed", "uploaded", "linked", "reviewed", "rejected", "expired"]);
  return allowed.has(status) ? status : "reviewed";
}

function normalizePrivacyStatus(value) {
  const status = cleanSlug(value);
  const allowed = new Set(["pending_review", "approved_private", "approved_public", "needs_blur", "rejected"]);
  return allowed.has(status) ? status : "pending_review";
}

function cleanSlug(value) {
  return String(value || "").trim().toLowerCase().replace(/[^a-z0-9_ -]+/g, "").replace(/\s+/g, "_");
}

function actorSummary(actor) {
  return actor ? { id: actor.id || null, full_name: actor.full_name || null, email: actor.email || null } : null;
}

function safeJson(text) {
  try { return JSON.parse(text); } catch { return null; }
}

function extractSupabaseError(data, text, fallback) {
  if (data && data.message) return data.message;
  if (typeof text === "string" && text.trim()) return text.slice(0, 300);
  return fallback;
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, x-admin-password, x-staff-email, x-staff-user-id",
    "Cache-Control": "no-store"
  };
}

function withCors(response) {
  const headers = new Headers(response.headers || {});
  for (const [key, value] of Object.entries(corsHeaders())) headers.set(key, value);
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}
