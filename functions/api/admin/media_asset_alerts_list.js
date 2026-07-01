// Build 216 — staff-only list of persistent public-media health alerts.
import { requireStaffAccess, json, serviceHeaders } from "../_lib/staff-auth.js";

export async function onRequestGet({ request, env }) { return handle({ request, env, body: Object.fromEntries(new URL(request.url).searchParams.entries()) }); }
export async function onRequestPost({ request, env }) { return handle({ request, env, body: await request.json().catch(() => ({})) }); }

async function handle({ request, env, body }) {
  try {
    const access = await requireStaffAccess({ request, env, body, capability: "manage_bookings", allowLegacyAdminFallback: true });
    if (!access.ok) return access.response;
    if (!configured(env)) return json({ ok: true, table_ready: false, alerts: [], warning: "Supabase is not configured." });
    const status = clean(body.status || "active");
    const limit = Math.max(1, Math.min(300, Number(body.limit || 120) || 120));
    const params = new URLSearchParams({ select: "*", order: "severity.desc,last_failed_at.desc,first_failed_at.asc", limit: String(limit) });
    if (status && status !== "all") params.set("alert_status", `eq.${status}`);
    const res = await fetch(`${env.SUPABASE_URL}/rest/v1/media_asset_alerts?${params}`, { headers: serviceHeaders(env) });
    const text = await res.text();
    const data = parse(text);
    if (!res.ok) return json({ ok: true, table_ready: false, alerts: [], warning: data?.message || data?.hint || "Build 216 alert table is not ready. Apply the Build 216 SQL migration." });
    return json({ ok: true, table_ready: true, alerts: Array.isArray(data) ? data : [] });
  } catch (error) {
    return json({ ok: false, error: error?.message || "Could not load media asset alerts." }, 500);
  }
}
function configured(env) { return !!(env?.SUPABASE_URL && (env?.SUPABASE_SERVICE_ROLE_KEY || env?.SUPABASE_SERVICE_KEY || env?.SUPABASE_SERVICE_ROLE || env?.SUPABASE_SECRET_KEY)); }
function clean(value) { return String(value || "").trim().toLowerCase(); }
function parse(value) { try { return JSON.parse(value); } catch { return null; } }
