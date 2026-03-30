import { requireStaffAccess, serviceHeaders, json, methodNotAllowed } from "../_lib/staff-auth.js";

export async function onRequestOptions() {
  return new Response("", { status: 204, headers: corsHeaders() });
}

export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    const body = await request.json().catch(() => ({}));
    const access = await requireStaffAccess({ request, env, body, capability: "manage_staff", allowLegacyAdminFallback: false });
    if (!access.ok) return withCors(access.response);

    const templateKey = String(body.template_key || "").trim();
    const limit = Math.min(100, Math.max(1, Number(body.limit || 50)));
    let url = `${env.SUPABASE_URL}/rest/v1/notification_events?select=id,created_at,event_type,channel,recipient_email,recipient_phone,subject,status,attempt_count,last_error,processed_at,payload&order=created_at.desc&limit=${limit}`;
    if (templateKey) url += `&payload->>template_key=eq.${encodeURIComponent(templateKey)}`;
    else url += `&or=(event_type.ilike.*recovery*,payload->>template_key.not.is.null)`;

    const res = await fetch(url, { headers: serviceHeaders(env) });
    if (!res.ok) return withCors(json({ error: `Could not load recovery audit. ${await res.text()}` }, 500));
    const rows = await res.json().catch(() => []);
    return withCors(json({ ok: true, count: Array.isArray(rows) ? rows.length : 0, items: Array.isArray(rows) ? rows : [] }));
  } catch (err) {
    return withCors(json({ error: err?.message || "Unexpected server error." }, 500));
  }
}

export async function onRequestGet() { return withCors(methodNotAllowed()); }
function corsHeaders(){ return {"Access-Control-Allow-Origin":"*","Access-Control-Allow-Methods":"POST,OPTIONS","Access-Control-Allow-Headers":"Content-Type, x-staff-email, x-staff-user-id","Cache-Control":"no-store"}; }
function withCors(response){ const h=new Headers(response.headers||{}); for (const [k,v] of Object.entries(corsHeaders())) h.set(k,v); return new Response(response.body,{status:response.status,statusText:response.statusText,headers:h}); }
