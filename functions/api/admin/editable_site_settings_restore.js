// File: /functions/api/admin/editable_site_settings_restore.js
// Build 191: restore an editable setting from app_management_setting_history.
import { requireStaffAccess, serviceHeaders, json } from "../_lib/staff-auth.js";
import { normalizeSettingKey, saveEditableSetting } from "../_lib/editable-settings.js";

export async function onRequestPost({ request, env }) {
  const body = await request.json().catch(() => ({}));
  const auth = await requireStaffAccess({ request, env, body, capability: "manage_staff", allowLegacyAdminFallback: true });
  if (!auth.ok) return auth.response;
  const historyId = Number(body.history_id || body.id || 0);
  const key = normalizeSettingKey(body.key || "");
  if (!(historyId > 0)) return json({ ok: false, error: "history_id is required." }, 400);
  if (!env?.SUPABASE_URL) return json({ ok: false, error: "Supabase is not configured." }, 400);
  const filter = key ? `&key=eq.${encodeURIComponent(key)}` : "";
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/app_management_setting_history?select=history_id,key,value,created_at&history_id=eq.${historyId}${filter}&limit=1`, { headers: serviceHeaders(env) });
  const rows = res.ok ? await res.json().catch(() => []) : [];
  const row = Array.isArray(rows) ? rows[0] || null : null;
  if (!row) return json({ ok: false, error: "History row was not found." }, 404);
  const saved = await saveEditableSetting(env, row.key, { ...(row.value || {}), restored_from_history_id: row.history_id, restored_at: new Date().toISOString() }, serviceHeaders(env));
  return json({ ok: true, restored: saved, history: row });
}
