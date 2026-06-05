// File: /functions/api/_lib/editable-settings.js
// Build 189: shared editable site-setting loader with DB-first, JSON-fallback behavior.

import businessProfile from "../../../data/business_profile.json";
import sitePolicies from "../../../data/site_policies.json";
import documentTemplates from "../../../data/document_templates.json";
import businessHoursHolidays from "../../../data/business_hours_holidays.json";
import navigationFooter from "../../../data/navigation_footer.json";
import optionLibraries from "../../../data/admin_option_libraries.json";
import analyticsEventRegistry from "../../../data/analytics_event_registry.json";
import mediaRequirements from "../../../data/media_requirements.json";
import landingPagesContent from "../data/landing_pages_content.json";

export const EDITABLE_SETTING_FALLBACKS = {
  business_profile: businessProfile,
  site_policies: sitePolicies,
  document_templates: documentTemplates,
  business_hours_holidays: businessHoursHolidays,
  navigation_footer: navigationFooter,
  option_libraries: optionLibraries,
  analytics_event_registry: analyticsEventRegistry,
  media_requirements: mediaRequirements,
  landing_pages_content: landingPagesContent
};

export const PUBLIC_SETTING_KEYS = new Set([
  "business_profile",
  "site_policies",
  "business_hours_holidays",
  "navigation_footer",
  "option_libraries",
  "analytics_event_registry",
  "media_requirements"
]);

export const ADMIN_SETTING_KEYS = new Set([
  ...Object.keys(EDITABLE_SETTING_FALLBACKS),
  "landing_pages",
  "pricing_catalog",
  "water_restriction_rules",
  "catalog_dropdown_options",
  "social_feeds",
  "before_after_gallery",
  "media_library",
  "review_proof",
  "notification_templates",
  "receipt_templates",
  "refund_templates",
  "quote_templates",
  "proposal_templates",
  "invoice_templates"
]);

export function normalizeSettingKey(value) {
  return String(value || "").trim().toLowerCase().replace(/[^a-z0-9_]+/g, "_").replace(/^_+|_+$/g, "");
}

export function fallbackForKey(key) {
  const normalized = normalizeSettingKey(key);
  const value = EDITABLE_SETTING_FALLBACKS[normalized];
  if (!value || typeof value !== "object") return {};
  return deepClone({ ...value, source_status: value.source_status || "bundled_json_fallback" });
}

export async function loadEditableSetting(env, key, options = {}) {
  const normalized = normalizeSettingKey(key);
  const fallback = options.fallback !== undefined ? options.fallback : fallbackForKey(normalized);
  if (!normalized) return { key: normalized, value: fallback, source_status: "invalid_key" };
  if (!env?.SUPABASE_URL) return { key: normalized, value: fallback, source_status: "bundled_json_fallback" };

  try {
    const res = await fetch(
      `${env.SUPABASE_URL}/rest/v1/app_management_settings?select=key,value,updated_at&key=eq.${encodeURIComponent(normalized)}&limit=1`,
      { headers: options.headers || {} }
    );
    if (!res.ok) return { key: normalized, value: fallback, source_status: "bundled_json_fallback", warning: `DB returned ${res.status}` };
    const rows = await res.json().catch(() => []);
    const row = Array.isArray(rows) ? rows[0] || null : null;
    if (!row || !row.value || typeof row.value !== "object") return { key: normalized, value: fallback, source_status: "bundled_json_fallback" };
    return { key: normalized, value: row.value, updated_at: row.updated_at || null, source_status: "app_management_settings" };
  } catch (error) {
    return { key: normalized, value: fallback, source_status: "bundled_json_fallback", warning: error?.message || "Could not load DB setting." };
  }
}


export function listEditableFallbackKeys() {
  return Object.keys(EDITABLE_SETTING_FALLBACKS).sort();
}

export function validateEditableSetting(key, value) {
  const normalized = normalizeSettingKey(key);
  const errors = [];
  const payload = value && typeof value === "object" ? value : {};
  if (!ADMIN_SETTING_KEYS.has(normalized)) errors.push(`Unknown or blocked setting key: ${normalized}`);
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) errors.push("Setting payload must be a JSON object.");
  if (normalized === "business_profile") {
    const business = payload.business || payload;
    if (!business.name && !business.short_name) errors.push("business_profile should include business.name or business.short_name.");
    if (!business.contact) errors.push("business_profile should include business.contact.");
  }
  if (normalized === "navigation_footer") {
    if (!Array.isArray(payload.navigation)) errors.push("navigation_footer should include a navigation array.");
  }
  if (normalized === "site_policies") {
    if (!payload.policies || typeof payload.policies !== "object") errors.push("site_policies should include a policies object.");
  }
  if (normalized === "analytics_event_registry") {
    if (!Array.isArray(payload.events)) errors.push("analytics_event_registry should include an events array.");
  }
  if (normalized === "media_requirements") {
    if (!Array.isArray(payload.required_assets)) errors.push("media_requirements should include a required_assets array.");
  }
  return { ok: errors.length === 0, key: normalized, errors };
}

async function recordSettingHistory(env, key, value, headers = {}) {
  if (!env?.SUPABASE_URL) return null;
  try {
    const res = await fetch(`${env.SUPABASE_URL}/rest/v1/app_management_setting_history`, {
      method: "POST",
      headers: { ...headers, Prefer: "return=minimal", "Content-Type": "application/json" },
      body: JSON.stringify([{ key, value, created_at: new Date().toISOString() }])
    });
    if (!res.ok) return null;
    return true;
  } catch { return null; }
}

export async function saveEditableSetting(env, key, value, headers = {}) {
  const normalized = normalizeSettingKey(key);
  if (!normalized) throw new Error("Missing setting key.");
  if (!ADMIN_SETTING_KEYS.has(normalized)) throw new Error(`Setting key is not allowed: ${normalized}`);
  if (!env?.SUPABASE_URL) throw new Error("Supabase is not configured. Edit the bundled JSON fallback or configure Supabase first.");
  const payload = value && typeof value === "object" ? value : {};
  const validation = validateEditableSetting(normalized, payload);
  if (!validation.ok) throw new Error(validation.errors.join(" "));
  await recordSettingHistory(env, normalized, payload, headers);
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/app_management_settings?on_conflict=key`, {
    method: "POST",
    headers: {
      ...headers,
      Prefer: "resolution=merge-duplicates,return=representation",
      "Content-Type": "application/json"
    },
    body: JSON.stringify([{ key: normalized, value: { ...payload, updated_at: new Date().toISOString(), source_status: "app_management_settings" }, updated_at: new Date().toISOString() }])
  });
  const text = await res.text();
  if (!res.ok) throw new Error(text || `Could not save ${normalized}.`);
  const rows = safeJson(text) || [];
  return Array.isArray(rows) ? rows[0] || null : rows;
}

function deepClone(value) {
  return JSON.parse(JSON.stringify(value || {}));
}
function safeJson(text) {
  try { return JSON.parse(text); } catch { return null; }
}
