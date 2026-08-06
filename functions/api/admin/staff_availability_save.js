import { requireStaffAccess, serviceHeaders, json, methodNotAllowed, isUuid, cleanText } from "../_lib/staff-auth.js";

export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    const body = await request.json().catch(() => ({}));
    const access = await requireStaffAccess({ request, env, body, capability: "manage_staff", allowLegacyAdminFallback: true });
    if (!access.ok) return access.response;

    const id = String(body.id || "").trim() || null;
    const staff_user_id = String(body.staff_user_id || "").trim();
    const start_at = normalizeDateTime(body.start_at);
    const end_at = normalizeDateTime(body.end_at);
    const availability_type = normalizeType(body.availability_type);
    const note = cleanText(body.note);

    if (!isUuid(staff_user_id)) return json({ error: "Valid staff_user_id is required." }, 400);
    if (!start_at || !end_at) return json({ error: "start_at and end_at are required." }, 400);
    if (Date.parse(end_at) <= Date.parse(start_at)) return json({ error: "end_at must be after start_at." }, 400);
    if (!availability_type) return json({ error: "Invalid availability_type." }, 400);

    const payload = {
      staff_user_id,
      start_at,
      end_at,
      availability_type,
      note,
      updated_at: new Date().toISOString(),
      created_by_name: access.actor?.full_name || access.actor?.email || null,
      created_by_staff_user_id: access.actor?.id || null
    };

    if (id) {
      const res = await fetch(`${env.SUPABASE_URL}/rest/v1/staff_availability_blocks?id=eq.${encodeURIComponent(id)}`, { method: "PATCH", headers: { ...serviceHeaders(env), Prefer: "return=representation" }, body: JSON.stringify(payload) });
      if (!res.ok) return json({ error: `Could not update availability block. ${await res.text()}` }, 500);
      const rows = await res.json().catch(() => []);
      return json({ ok: true, message: "Availability block updated.", availability_block: Array.isArray(rows) ? rows[0] || null : null });
    }

    const res = await fetch(`${env.SUPABASE_URL}/rest/v1/staff_availability_blocks`, { method: "POST", headers: { ...serviceHeaders(env), Prefer: "return=representation" }, body: JSON.stringify([{ ...payload, created_at: new Date().toISOString() }]) });
    if (!res.ok) return json({ error: `Could not create availability block. ${await res.text()}` }, 500);
    const rows = await res.json().catch(() => []);
    return json({ ok: true, message: "Availability block created.", availability_block: Array.isArray(rows) ? rows[0] || null : null });
  } catch (err) {
    return json({ error: err?.message || "Could not save staff availability block." }, 500);
  }
}

export async function onRequestOptions() { return new Response("", { status: 204, headers: corsHeaders() }); }
export async function onRequestGet() { return withCors(methodNotAllowed()); }
function normalizeDateTime(value) { const s = String(value || "").trim(); const d = new Date(s); return Number.isFinite(d.getTime()) ? d.toISOString() : null; }
function normalizeType(value) { const s = String(value || "").trim().toLowerCase(); return ["unavailable", "vacation", "sick", "training", "light_duty"].includes(s) ? s : null; }
function corsHeaders() { return { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST,OPTIONS", "Access-Control-Allow-Headers": "Content-Type, x-admin-password, x-staff-email, x-staff-user-id", "Cache-Control": "no-store" }; }
function withCors(response) { const headers = new Headers(response.headers || {}); for (const [k,v] of Object.entries(corsHeaders())) headers.set(k,v); return new Response(response.body, { status: response.status, statusText: response.statusText, headers }); }
