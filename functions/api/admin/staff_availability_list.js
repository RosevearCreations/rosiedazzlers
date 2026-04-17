import { requireStaffAccess, serviceHeaders, json, methodNotAllowed } from "../_lib/staff-auth.js";
import { parsePayrollRange } from "../_lib/payroll.js";

export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    const body = await request.json().catch(() => ({}));
    const access = await requireStaffAccess({ request, env, body, capability: "manage_staff", allowLegacyAdminFallback: true });
    if (!access.ok) return access.response;

    const range = parsePayrollRange({ start_date: body.start_date, end_date: body.end_date });
    const startIso = `${range.start_date}T00:00:00.000Z`;
    const endIso = `${addDays(range.end_date, 1)}T00:00:00.000Z`;
    let url = `${env.SUPABASE_URL}/rest/v1/staff_availability_blocks?select=id,created_at,updated_at,staff_user_id,start_at,end_at,availability_type,note,created_by_name&end_at=gte.${encodeURIComponent(startIso)}&start_at=lt.${encodeURIComponent(endIso)}&order=start_at.asc`;
    const staffUserId = String(body.staff_user_id || "").trim();
    if (staffUserId) url += `&staff_user_id=eq.${encodeURIComponent(staffUserId)}`;
    const res = await fetch(url, { headers: serviceHeaders(env) });
    if (!res.ok) return json({ error: `Could not load staff availability blocks. ${await res.text()}` }, 500);
    const rows = await res.json().catch(() => []);
    return json({ ok: true, range, availability_blocks: Array.isArray(rows) ? rows : [] });
  } catch (err) {
    return json({ error: err?.message || "Could not load staff availability blocks." }, 500);
  }
}

export async function onRequestOptions() {
  return new Response("", { status: 204, headers: corsHeaders() });
}
export async function onRequestGet() { return withCors(methodNotAllowed()); }
function addDays(dateText, days) { const d = new Date(`${dateText}T00:00:00.000Z`); d.setUTCDate(d.getUTCDate() + Number(days || 0)); return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`; }
function corsHeaders() { return { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST,OPTIONS", "Access-Control-Allow-Headers": "Content-Type, x-admin-password, x-staff-email, x-staff-user-id", "Cache-Control": "no-store" }; }
function withCors(response) { const headers = new Headers(response.headers || {}); for (const [k,v] of Object.entries(corsHeaders())) headers.set(k,v); return new Response(response.body, { status: response.status, statusText: response.statusText, headers }); }
