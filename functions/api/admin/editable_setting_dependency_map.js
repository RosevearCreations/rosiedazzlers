// File: /functions/api/admin/editable_setting_dependency_map.js
// Build 191: protected dependency map for editable settings.
import { requireStaffAccess, json } from "../_lib/staff-auth.js";
import dependencyMap from "../../../data/editable_setting_dependency_map.json";
import { normalizeSettingKey } from "../_lib/editable-settings.js";

export async function onRequestGet({ request, env }) {
  const auth = await requireStaffAccess({ request, env, capability: "manage_staff", allowLegacyAdminFallback: true });
  if (!auth.ok) return auth.response;
  const url = new URL(request.url);
  const key = normalizeSettingKey(url.searchParams.get("key") || "");
  if (key) return json({ ok: true, build: "191", key, dependencies: dependencyMap.settings?.[key] || null, map_updated_at: dependencyMap.updated_at });
  return json({ ok: true, build: "191", dependency_map: dependencyMap });
}
