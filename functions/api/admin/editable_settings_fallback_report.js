// File: /functions/api/admin/editable_settings_fallback_report.js
// Build 195: dashboard-ready report for settings still served from bundled JSON fallbacks.

import { requireStaffAccess, serviceHeaders, json } from "../_lib/staff-auth.js";
import { listEditableFallbackKeys, loadEditableSetting } from "../_lib/editable-settings.js";

export async function onRequestGet({ request, env }) {
  const auth = await requireStaffAccess({ request, env, capability: "manage_staff", allowLegacyAdminFallback: true });
  if (!auth.ok) return auth.response;
  const headers = serviceHeaders(env);
  const rows = [];
  for (const key of listEditableFallbackKeys()) {
    const loaded = await loadEditableSetting(env, key, { headers });
    const source = loaded.source_status || loaded.source || "unknown";
    rows.push({ key, source_status: source, db_backed: source === "app_management_settings", fallback_backed: source !== "app_management_settings", updated_at: loaded.updated_at || null, warning: loaded.warning || null });
  }
  return json({ ok: true, build: "195", generated_at: new Date().toISOString(), summary: { total: rows.length, db_backed: rows.filter((r) => r.db_backed).length, fallback_backed: rows.filter((r) => r.fallback_backed).length }, rows, dashboard_message: rows.some((r)=>r.fallback_backed) ? "Some settings are still using bundled fallback JSON; sync or save them when ready." : "All editable settings are DB-backed." });
}
