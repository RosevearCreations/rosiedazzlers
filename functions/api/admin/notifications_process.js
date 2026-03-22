import { requireStaffAccess, serviceHeaders, json, methodNotAllowed } from "../_lib/staff-auth.js";
import { loadFeatureFlags } from "../_lib/app-settings.js";

export async function onRequestOptions() { return new Response("", { status: 204, headers: corsHeaders() }); }
export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    const body = await request.json().catch(() => ({}));
    const flags = await loadFeatureFlags(env);
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
      const hasRecipient = !!(item.recipient_email || item.recipient_phone);
      const currentAttempts = Number(item.attempt_count || 0);
      const maxAttempts = Number(item.max_attempts || 5);
      const canRetry = flags.notifications_retry_enabled !== false && currentAttempts < maxAttempts;
      const backoffMinutes = Math.min(60, Math.max(5, currentAttempts * 5 || 5));
      const nextAttemptAt = new Date(Date.now() + backoffMinutes * 60 * 1000).toISOString();

      let patch;
      if (action === 'mark_failed') {
        patch = {
          status: 'failed',
          attempt_count: currentAttempts + 1,
          last_error: 'Manually marked failed.',
          processed_at: new Date().toISOString(),
          next_attempt_at: canRetry ? nextAttemptAt : null
        };
      } else if (hasRecipient) {
        patch = {
          status: 'sent',
          attempt_count: currentAttempts + 1,
          last_error: null,
          processed_at: new Date().toISOString(),
          next_attempt_at: null
        };
      } else {
        patch = {
          status: canRetry ? 'queued' : 'failed',
          attempt_count: currentAttempts + 1,
          last_error: 'Missing recipient.',
          processed_at: new Date().toISOString(),
          next_attempt_at: canRetry ? nextAttemptAt : null
        };
      }

      const patchRes = await fetch(`${env.SUPABASE_URL}/rest/v1/notification_events?id=eq.${encodeURIComponent(item.id)}`, {
        method: 'PATCH', headers: { ...headers, Prefer: 'return=minimal' }, body: JSON.stringify(patch)
      });
      results.push({ id: item.id, ok: patchRes.ok, status: patch.status, last_error: patch.last_error || null, next_attempt_at: patch.next_attempt_at || null });
    }

    return withCors(json({ ok: true, processed: results.length, results }));
  } catch (err) {
    return withCors(json({ error: err?.message || 'Unexpected server error.' }, 500));
  }
}
export async function onRequestGet() { return withCors(methodNotAllowed()); }
function corsHeaders(){return {'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'POST,OPTIONS','Access-Control-Allow-Headers':'Content-Type','Cache-Control':'no-store'};}
function withCors(response){const h=new Headers(response.headers||{});for(const[k,v]of Object.entries(corsHeaders()))h.set(k,v);return new Response(response.body,{status:response.status,statusText:response.statusText,headers:h});}
