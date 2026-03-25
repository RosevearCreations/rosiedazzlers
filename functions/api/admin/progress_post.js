import { requireStaffAccess, json, methodNotAllowed, cleanText, isUuid } from "../_lib/staff-auth.js";

export async function onRequestOptions() { return new Response("", { status: 204, headers: corsHeaders() }); }
export async function onRequestGet() { return withCors(methodNotAllowed()); }
export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    const body = await request.json().catch(() => ({}));
    const booking_id = String(body.booking_id || "").trim();
    const note = cleanText(body.note);
    const visibility = String(body.visibility || "customer").trim().toLowerCase();
    if (!isUuid(booking_id)) return withCors(json({ error: "Invalid booking_id." }, 400));
    if (!note) return withCors(json({ error: "Missing note." }, 400));
    if (!["customer","internal"].includes(visibility)) return withCors(json({ error: "Invalid visibility." }, 400));

    const access = await requireStaffAccess({ request, env, body, capability: "work_booking", bookingId: booking_id, allowLegacyAdminFallback: true });
    if (!access.ok) return withCors(access.response);

    const headers = {
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=representation"
    };
    const insertRes = await fetch(`${env.SUPABASE_URL}/rest/v1/job_updates`, {
      method: "POST",
      headers,
      body: JSON.stringify([{ booking_id, created_by: access.actor.full_name || "Staff", note, visibility, staff_user_id: access.actor.id || null }])
    });
    if (!insertRes.ok) return withCors(json({ error: `Could not save update. ${await insertRes.text()}` }, 500));
    const rows = await insertRes.json().catch(() => []);
    return withCors(json({ ok: true, message: "Update posted.", update: Array.isArray(rows) ? rows[0] || null : null }));
  } catch (err) {
    return withCors(json({ error: err && err.message ? err.message : "Unexpected server error." }, 500));
  }
}
function corsHeaders() { return { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST,OPTIONS", "Access-Control-Allow-Headers": "Content-Type, x-admin-password, x-staff-email, x-staff-user-id", "Cache-Control": "no-store" }; }
function withCors(response) { const headers = new Headers(response.headers || {}); for (const [k,v] of Object.entries(corsHeaders())) headers.set(k,v); return new Response(response.body, { status: response.status, statusText: response.statusText, headers }); }
