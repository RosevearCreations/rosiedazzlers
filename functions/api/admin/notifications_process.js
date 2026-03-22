import { requireStaffAccess, serviceHeaders, json, methodNotAllowed } from "../_lib/staff-auth.js";

export async function onRequestOptions() { return new Response("", { status: 204, headers: corsHeaders() }); }
export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    const body = await request.json().catch(() => ({}));
    const access = await requireStaffAccess({ request, env, body, capability: 'manage_staff', allowLegacyAdminFallback: true });
    if (!access.ok) return withCors(access.response);

    const ids = Array.isArray(body.ids) ? body.ids.filter(Boolean) : [];
    const action = String(body.action || 'retry').trim().toLowerCase();
    const headers = serviceHeaders(env);
    let url = `${env.SUPABASE_URL}/rest/v1/notification_events?select=id,event_type,channel,recipient_email,recipient_phone,payload,status,attempt_count,last_error`;
    if (ids.length) url += `&id=in.(${ids.map(encodeURIComponent).join(',')})`;
    else url += `&status=in.(queued,failed)&limit=50&order=created_at.asc`;

    const res = await fetch(url, { headers });
    if (!res.ok) return withCors(json({ error: `Could not load notifications. ${await res.text()}` }, 500));
    const rows = await res.json().catch(() => []);
    const items = Array.isArray(rows) ? rows : [];
    const results = [];

    for (const item of items) {
      const simulatedOk = !!(item.recipient_email || item.recipient_phone);
      const patch = action === 'mark_failed'
        ? { status: 'failed', attempt_count: Number(item.attempt_count || 0) + 1, last_error: 'Manually marked failed.', processed_at: new Date().toISOString() }
        : simulatedOk
          ? { status: 'sent', attempt_count: Number(item.attempt_count || 0) + 1, last_error: null, processed_at: new Date().toISOString() }
          : { status: 'failed', attempt_count: Number(item.attempt_count || 0) + 1, last_error: 'Missing recipient.', processed_at: new Date().toISOString() };

      const patchRes = await fetch(`${env.SUPABASE_URL}/rest/v1/notification_events?id=eq.${encodeURIComponent(item.id)}`, {
        method: 'PATCH', headers: { ...headers, Prefer: 'return=minimal' }, body: JSON.stringify(patch)
      });
      results.push({ id: item.id, ok: patchRes.ok, status: patch.status, last_error: patch.last_error || null });
    }

    return withCors(json({ ok: true, processed: results.length, results }));
  } catch (err) {
    return withCors(json({ error: err?.message || 'Unexpected server error.' }, 500));
  }
}
export async function onRequestGet() { return withCors(methodNotAllowed()); }
function corsHeaders(){return {'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'POST,OPTIONS','Access-Control-Allow-Headers':'Content-Type','Cache-Control':'no-store'};}
function withCors(response){const h=new Headers(response.headers||{});for(const[k,v]of Object.entries(corsHeaders()))h.set(k,v);return new Response(response.body,{status:response.status,statusText:response.statusText,headers:h});}
