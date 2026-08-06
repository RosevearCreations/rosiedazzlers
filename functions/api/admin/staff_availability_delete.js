import { requireStaffAccess, serviceHeaders, json, methodNotAllowed, isUuid } from "../_lib/staff-auth.js";

export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    const body = await request.json().catch(() => ({}));
    const access = await requireStaffAccess({ request, env, body, capability: "manage_staff", allowLegacyAdminFallback: true });
    if (!access.ok) return access.response;
    const id = String(body.id || "").trim();
    if (!isUuid(id)) return json({ error: "Valid id is required." }, 400);
    const res = await fetch(`${env.SUPABASE_URL}/rest/v1/staff_availability_blocks?id=eq.${encodeURIComponent(id)}`, { method: "DELETE", headers: serviceHeaders(env) });
    if (!res.ok) return json({ error: `Could not delete availability block. ${await res.text()}` }, 500);
    return json({ ok: true, message: "Availability block deleted." });
  } catch (err) {
    return json({ error: err?.message || "Could not delete staff availability block." }, 500);
  }
}

export async function onRequestOptions() { return new Response("", { status: 204, headers: corsHeaders() }); }
export async function onRequestGet() { return withCors(methodNotAllowed()); }
function corsHeaders() { return { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST,OPTIONS", "Access-Control-Allow-Headers": "Content-Type, x-admin-password, x-staff-email, x-staff-user-id", "Cache-Control": "no-store" }; }
function withCors(response) { const headers = new Headers(response.headers || {}); for (const [k,v] of Object.entries(corsHeaders())) headers.set(k,v); return new Response(response.body, { status: response.status, statusText: response.statusText, headers }); }
