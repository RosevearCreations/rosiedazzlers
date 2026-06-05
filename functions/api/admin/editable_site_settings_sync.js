// File: /functions/api/admin/editable_site_settings_sync.js
// Build 190: sync bundled JSON fallback into editable app_management_settings rows.

import { requireStaffAccess, serviceHeaders, json } from "../_lib/staff-auth.js";
import { EDITABLE_SETTING_FALLBACKS, loadEditableSetting, normalizeSettingKey, saveEditableSetting } from "../_lib/editable-settings.js";

export async function onRequestPost({ request, env }) {
  const body = await request.json().catch(() => ({}));
  const auth = await requireStaffAccess({ request, env, body, capability: "manage_staff", allowLegacyAdminFallback: true });
  if (!auth.ok) return auth.response;
  const key = normalizeSettingKey(body.key || "");
  const force = body.force === true;
  const keys = key ? [key] : Object.keys(EDITABLE_SETTING_FALLBACKS).sort();
  const headers = serviceHeaders(env);
  const results = [];
  for (const itemKey of keys) {
    if (!EDITABLE_SETTING_FALLBACKS[itemKey]) { results.push({ key: itemKey, ok: false, skipped: true, reason: "No bundled fallback for key." }); continue; }
    const current = await loadEditableSetting(env, itemKey, { headers });
    if (!force && current.source_status === "app_management_settings") { results.push({ key: itemKey, ok: true, skipped: true, reason: "Already DB-backed. Use force=true to overwrite." }); continue; }
    try {
      const saved = await saveEditableSetting(env, itemKey, { ...EDITABLE_SETTING_FALLBACKS[itemKey], synced_from_bundle_at: new Date().toISOString() }, headers);
      results.push({ key: itemKey, ok: true, saved: !!saved });
    } catch (error) {
      results.push({ key: itemKey, ok: false, error: error?.message || "Sync failed." });
    }
  }
  return json({ ok: results.every((row) => row.ok), results });
}
