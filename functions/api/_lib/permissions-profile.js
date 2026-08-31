// Build 269 - schema-tolerant staff permissions profile helpers.
// Historical Development databases may expose permissions_profile as TEXT while
// fresh/canonical databases expose JSONB. Runtime code must accept both.

export function parsePermissionsProfile(value) {
  if (value && typeof value === "object" && !Array.isArray(value)) return value;
  if (typeof value !== "string") return {};
  const text = value.trim();
  if (!text) return {};
  try {
    const parsed = JSON.parse(text);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return { _legacy_permissions_profile_text: text };
  }
}

export function moduleAccessFromProfile(value) {
  const profile = parsePermissionsProfile(value);
  return profile.module_access && typeof profile.module_access === "object" && !Array.isArray(profile.module_access) ? profile.module_access : {};
}

export function actionAccessFromProfile(value) {
  const profile = parsePermissionsProfile(value);
  return profile.action_access && typeof profile.action_access === "object" && !Array.isArray(profile.action_access) ? profile.action_access : {};
}

export function profileForDatabase(profile, observedValue) {
  const normalized = parsePermissionsProfile(profile);
  return typeof observedValue === "string" ? JSON.stringify(normalized) : normalized;
}
