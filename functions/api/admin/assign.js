import { requireStaffAccess, json, isUuid, serviceHeaders, cleanText, cleanEmail } from "../_lib/staff-auth.js";

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

    const assigned_staff_name = body.assigned_staff_name != null ? String(body.assigned_staff_name).trim() : "";
    const assigned_staff_email = cleanEmail(body.assigned_staff_email) || null;
    const internal_notes = body.internal_notes != null ? String(body.internal_notes).trim() : "";

    const patch = await fetch(`${env.SUPABASE_URL}/rest/v1/bookings?id=eq.${encodeURIComponent(booking_id)}`, {
      method: "PATCH",
      headers: { ...serviceHeaders(env), Accept: "application/json", Prefer: "return=representation" },
      body: JSON.stringify({
        assigned_staff_name: assigned_staff_name || null,
        assigned_staff_email,
        internal_notes: internal_notes || null,
        updated_at: new Date().toISOString(),
      }),
    });
    const text = await patch.text();
    const data = text ? safeJson(text) : null;
    if (!patch.ok) return corsJson({ ok: false, error: "Supabase update failed (bookings)", details: data }, 502);

    const row = Array.isArray(data) ? data[0] : data;
    await fetch(`${env.SUPABASE_URL}/rest/v1/booking_events`, {
      method: "POST",
      headers: { ...serviceHeaders(env), Prefer: "return=minimal" },
      body: JSON.stringify([{
        booking_id,
        event_type: assigned_staff_name ? "booking_assigned" : "booking_unassigned",
        event_note: assigned_staff_name ? `Assigned to ${assigned_staff_name}.` : "Assignment cleared.",
        actor_name: access.actor.full_name || access.actor.email || "Staff",
        payload: {
          actor_id: access.actor.id || null,
          assigned_staff_name: cleanText(assigned_staff_name),
          assigned_staff_email,
        },
      }]),
    }).catch(() => null);

    return corsJson({ ok: true, row, actor: access.actor.full_name || access.actor.email || "Staff" });
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
