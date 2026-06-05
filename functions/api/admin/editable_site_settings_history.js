// File: /functions/api/admin/editable_site_settings_history.js
// Build 190: version-history reader for editable settings.

import { requireStaffAccess, serviceHeaders, json } from "../_lib/staff-auth.js";
import { normalizeSettingKey } from "../_lib/editable-settings.js";

export async function onRequestGet({ request, env }) {
  const auth = await requireStaffAccess({ request, env, capability: "manage_staff", allowLegacyAdminFallback: true });
  if (!auth.ok) return auth.response;
  const url = new URL(request.url);
  const key = normalizeSettingKey(url.searchParams.get("key") || "");
  const limit = Math.max(1, Math.min(50, Number(url.searchParams.get("limit") || 20) || 20));
  if (!env?.SUPABASE_URL) return json({ ok: true, source_status: "fallback_no_supabase", history: [] });
  const filter = key ? `&key=eq.${encodeURIComponent(key)}` : "";
  try {
    const res = await fetch(`${env.SUPABASE_URL}/rest/v1/app_management_setting_history?select=history_id,key,value,created_at${filter}&order=created_at.desc&limit=${limit}`, { headers: serviceHeaders(env) });
    const rows = await res.json().catch(() => []);
    if (!res.ok) return json({ ok: true, source_status: "history_table_unavailable", history: [], warning: rows?.message || `DB returned ${res.status}` });
    return json({ ok: true, source_status: "app_management_setting_history", history: Array.isArray(rows) ? rows : [] });
  } catch (error) {
    return json({ ok: true, source_status: "history_read_failed", history: [], warning: error?.message || "History read failed." });
  }
}
