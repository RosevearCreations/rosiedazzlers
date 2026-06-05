// File: /functions/api/admin/editable_site_settings_validate.js
// Build 190: field-level JSON validation for editable settings.

import { requireStaffAccess, json } from "../_lib/staff-auth.js";
import { normalizeSettingKey, validateEditableSetting } from "../_lib/editable-settings.js";

export async function onRequestPost({ request, env }) {
  const body = await request.json().catch(() => ({}));
  const auth = await requireStaffAccess({ request, env, body, capability: "manage_staff", allowLegacyAdminFallback: true });
  if (!auth.ok) return auth.response;
  const key = normalizeSettingKey(body.key);
  const value = body.value && typeof body.value === "object" ? body.value : {};
  return json({ ok: true, validation: validateEditableSetting(key, value) });
}
