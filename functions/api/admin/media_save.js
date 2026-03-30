// functions/api/admin/media_save.js
// Role-aware job media save endpoint aligned to the current job_media schema.

import {
  requireStaffAccess,
  serviceHeaders,
  json,
  methodNotAllowed,
  cleanText,
  isUuid,
  toNullableInteger
} from "../_lib/staff-auth.js";

export async function onRequestOptions() {
  return new Response("", { status: 204, headers: corsHeaders() });
}

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const body = await request.json().catch(() => ({}));
    const booking_id = String(body.booking_id || "").trim();
    const media_url = cleanMediaUrl(body.media_url);
    const kind = cleanKind(body.media_type || body.kind);
    const caption = cleanText(body.caption);
    const visibility = cleanVisibility(body.visibility);
    const sort_order = toNullableInteger(body.sort_order);

    if (!booking_id || !isUuid(booking_id)) {
      return withCors(json({ error: "Invalid booking_id." }, 400));
    }
    if (!media_url) {
      return withCors(json({ error: "Valid media_url is required." }, 400));
    }
    if (!kind) {
      return withCors(json({ error: "Invalid media type." }, 400));
    }
    if (!visibility) {
      return withCors(json({ error: "Invalid visibility." }, 400));
    }
    if (sort_order !== null && sort_order < 0) {
      return withCors(json({ error: "sort_order cannot be negative." }, 400));
    }

    const access = await requireStaffAccess({
      request,
      env,
      body,
      capability: "work_booking",
      bookingId: booking_id,
      allowLegacyAdminFallback: false
    });
    if (!access.ok) return withCors(access.response);

    const payload = {
      booking_id,
      created_by: access.actor.full_name || cleanText(body.staff_name) || "Staff",
      kind,
      caption,
      media_url,
      visibility,
      sort_order: sort_order ?? 0,
      staff_user_id: access.actor.id || null
    };

    const res = await fetch(`${env.SUPABASE_URL}/rest/v1/job_media`, {
      method: "POST",
      headers: {
        ...serviceHeaders(env),
        Prefer: "return=representation"
      },
      body: JSON.stringify([payload])
    });

    if (!res.ok) {
      const text = await res.text();
      return withCors(json({ error: `Could not save media. ${text}` }, 500));
    }

    const rows = await res.json().catch(() => []);
    return withCors(json({ ok: true, message: "Media saved.", media: Array.isArray(rows) ? rows[0] || null : null }));
  } catch (err) {
    return withCors(json({ error: err && err.message ? err.message : "Unexpected server error." }, 500));
  }
}

export async function onRequestGet() {
  return withCors(methodNotAllowed());
}

function cleanMediaUrl(value) {
  const s = cleanText(value);
  if (!s) return null;
  if (/^https?:\/\//i.test(s)) return s;
  if (/^\/[^/]/.test(s)) return s;
  return null;
}
function cleanKind(value) {
  const s = String(value || "image").trim().toLowerCase();
  if (["image","photo"].includes(s)) return "photo";
  if (s === "video") return "video";
  if (s === "file") return "photo";
  return null;
}
function cleanVisibility(value) {
  const s = String(value || "customer").trim().toLowerCase();
  return ["customer", "internal"].includes(s) ? s : null;
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
