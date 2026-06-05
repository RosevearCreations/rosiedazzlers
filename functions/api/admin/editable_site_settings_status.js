// File: /functions/api/admin/editable_site_settings_status.js
// Build 190: diagnostics for editable settings DB/fallback status.

import { requireStaffAccess, serviceHeaders, json } from "../_lib/staff-auth.js";
import { ADMIN_SETTING_KEYS, EDITABLE_SETTING_FALLBACKS, loadEditableSetting } from "../_lib/editable-settings.js";

export async function onRequestGet({ request, env }) {
  const auth = await requireStaffAccess({ request, env, capability: "manage_staff", allowLegacyAdminFallback: true });
  if (!auth.ok) return auth.response;
  const headers = serviceHeaders(env);
  const keys = Array.from(ADMIN_SETTING_KEYS).filter((key) => EDITABLE_SETTING_FALLBACKS[key]).sort();
  const rows = [];
  for (const key of keys) {
    const loaded = await loadEditableSetting(env, key, { headers });
    rows.push({
      key,
      source_status: loaded.source_status || "unknown",
      is_db_backed: loaded.source_status === "app_management_settings",
      has_fallback: !!EDITABLE_SETTING_FALLBACKS[key],
      updated_at: loaded.updated_at || loaded.value?.updated_at || null,
      warning: loaded.warning || null
    });
  }
  return json({ ok: true, build: "190", settings: rows, summary: { total: rows.length, db_backed: rows.filter((row) => row.is_db_backed).length, fallback_backed: rows.filter((row) => !row.is_db_backed).length } });
}
