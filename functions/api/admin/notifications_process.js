
import { requireStaffAccess, serviceHeaders, json, methodNotAllowed } from "../_lib/staff-auth.js";
import { loadFeatureFlags } from "../_lib/app-settings.js";
import { dispatchNotificationThroughProvider } from "../_lib/provider-dispatch.js";

export async function onRequestOptions() { return new Response("", { status: 204, headers: corsHeaders() }); }

export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    const body = await request.json().catch(() => ({}));
    const flags = await loadFeatureFlags(env);
    const access = await requireStaffAccess({ request, env, body, capability: "manage_staff", allowLegacyAdminFallback: true });
    if (!access.ok) return withCors(access.response);

    if (flags.notifications_retry_enabled === false) {
      return withCors(json({ error: "Notification retry is disabled by app settings." }, 403));
    }

    const ids = Array.isArray(body.ids) ? body.ids.filter(Boolean) : [];
    const nowIso = new Date().toISOString();
    let url = `${env.SUPABASE_URL}/rest/v1/notification_events?select=id,event_type,channel,recipient_email,recipient_phone,subject,body_text,body_html,payload,status,attempt_count,last_error,max_attempts,next_attempt_at`;
    if (ids.length) {
      url += `&id=in.(${ids.map(encodeURIComponent).join(",")})`;
    } else {
      url += `&status=in.(queued,failed)&or=(next_attempt_at.is.null,next_attempt_at.lte.${encodeURIComponent(nowIso)})&limit=50&order=created_at.asc`;
    }

    const res = await fetch(url, { headers: serviceHeaders(env) });
    if (!res.ok) return withCors(json({ error: `Could not load notifications. ${await res.text()}` }, 500));
    const items = await res.json().catch(() => []);
    const rows = Array.isArray(items) ? items : [];
    const results = [];

    for (const item of rows) {
      const currentAttempts = Number(item.attempt_count || 0);
      const maxAttempts = Number(item.max_attempts || 5);
      const hasRecipient = !!(item.recipient_email || item.recipient_phone);

      if (!hasRecipient) {
        await patchEvent(env, item.id, {
          status: "failed",
          last_error: "Missing recipient.",
          attempt_count: currentAttempts + 1,
          processed_at: new Date().toISOString()
        });
        results.push({ id: item.id, ok: false, error: "Missing recipient." });
        continue;
      }

      if (currentAttempts >= maxAttempts) {
        await patchEvent(env, item.id, {
          status: "failed",
          last_error: "Max attempts reached.",
          processed_at: new Date().toISOString()
        });
        results.push({ id: item.id, ok: false, error: "Max attempts reached." });
        continue;
      }

      const dispatch = await dispatchNotificationThroughProvider(env, item);

      if (dispatch.ok) {
        await patchEvent(env, item.id, {
          status: "sent",
          attempt_count: currentAttempts + 1,
          last_error: null,
          processed_at: new Date().toISOString(),
          next_attempt_at: null
        });
        results.push({ id: item.id, ok: true, status: "sent", provider: dispatch.provider_response || null });
      } else {
        const nextAttemptAt = new Date(Date.now() + computeBackoffMinutes(currentAttempts) * 60000).toISOString();
        await patchEvent(env, item.id, {
          status: "failed",
          attempt_count: currentAttempts + 1,
          last_error: dispatch.error || "Dispatch failed.",
          processed_at: new Date().toISOString(),
          next_attempt_at: nextAttemptAt
        });
        results.push({ id: item.id, ok: false, status: "failed", error: dispatch.error || "Dispatch failed.", next_attempt_at: nextAttemptAt });
      }
    }

    return withCors(json({ ok: true, processed: results.length, results }));
  } catch (err) {
    return withCors(json({ error: err?.message || "Unexpected server error." }, 500));
  }
}

export async function onRequestGet() {
  return withCors(methodNotAllowed());
}

async function patchEvent(env, id, patch) {
  await fetch(`${env.SUPABASE_URL}/rest/v1/notification_events?id=eq.${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { ...serviceHeaders(env), Prefer: "return=minimal" },
    body: JSON.stringify(patch)
  }).catch(() => null);
}

function computeBackoffMinutes(attemptCount) {
  const n = Math.max(1, Number(attemptCount || 0) + 1);
  return Math.min(240, n * 10);
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Cache-Control": "no-store"
  };
}
function withCors(response) {
  const h = new Headers(response.headers || {});
  for (const [k,v] of Object.entries(corsHeaders())) h.set(k,v);
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers: h });
}
