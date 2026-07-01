// Build 216 — acknowledge/reopen a persistent public-media asset alert.
// Resolution is deliberately scan-driven so an alert is not manually hidden before a verified healthy scan.
import { requireStaffAccess, json, serviceHeaders, isUuid, cleanText } from "../_lib/staff-auth.js";

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json().catch(() => ({}));
    const access = await requireStaffAccess({ request, env, body, capability: "manage_bookings", allowLegacyAdminFallback: true });
    if (!access.ok) return access.response;
    if (!configured(env)) return json({ ok: false, error: "Supabase configuration is required." }, 500);
    const id = cleanText(body.id);
    const action = cleanText(body.action)?.toLowerCase();
    if (!isUuid(id)) return json({ ok: false, error: "A valid alert id is required." }, 400);
    if (!["acknowledge", "reopen"].includes(action || "")) return json({ ok: false, error: "Only acknowledge or reopen is allowed. A passing scan resolves alerts automatically." }, 400);
    const actor = String(access.actor?.full_name || access.actor?.email || "staff").trim().slice(0, 180);
    const now = new Date().toISOString();
    const patch = action === "acknowledge"
      ? { alert_status: "acknowledged", acknowledged_at: now, acknowledged_by: actor, updated_at: now }
      : { alert_status: "active", acknowledged_at: null, acknowledged_by: null, resolved_at: null, resolved_by: null, updated_at: now };
    const res = await fetch(`${env.SUPABASE_URL}/rest/v1/media_asset_alerts?id=eq.${encodeURIComponent(id)}`, { method: "PATCH", headers: { ...serviceHeaders(env), Prefer: "return=representation" }, body: JSON.stringify(patch) });
    const text = await res.text();
    const data = parse(text);
    if (!res.ok) throw new Error(data?.message || text || "Could not update media asset alert.");
    return json({ ok: true, alert: Array.isArray(data) ? data[0] : data, note: action === "acknowledge" ? "Alert acknowledged. It remains visible until a passing scan resolves it." : "Alert reopened." });
  } catch (error) {
    return json({ ok: false, error: error?.message || "Could not update media asset alert." }, 500);
  }
}
function configured(env) { return !!(env?.SUPABASE_URL && (env?.SUPABASE_SERVICE_ROLE_KEY || env?.SUPABASE_SERVICE_KEY || env?.SUPABASE_SERVICE_ROLE || env?.SUPABASE_SECRET_KEY)); }
function parse(value) { try { return JSON.parse(value); } catch { return null; } }
