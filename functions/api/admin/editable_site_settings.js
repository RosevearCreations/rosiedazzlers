// File: /functions/api/admin/editable_site_settings.js
// Build 189: protected editor API for site settings that should not be hard-coded in JS.

import { requireStaffAccess, serviceHeaders, json } from "../_lib/staff-auth.js";
import { ADMIN_SETTING_KEYS, EDITABLE_SETTING_FALLBACKS, loadEditableSetting, normalizeSettingKey, saveEditableSetting } from "../_lib/editable-settings.js";

export async function onRequestOptions() {
  return new Response("", { status: 204, headers: corsHeaders() });
}

export async function onRequestGet({ request, env }) {
  const auth = await requireStaffAccess({ request, env, capability: "manage_staff", allowLegacyAdminFallback: true });
  if (!auth.ok) return withCors(auth.response);
  const url = new URL(request.url);
  const requested = normalizeSettingKey(url.searchParams.get("key") || "");
  const keys = requested ? [requested] : Array.from(ADMIN_SETTING_KEYS).filter((key) => EDITABLE_SETTING_FALLBACKS[key]);
  const headers = serviceHeaders(env);
  const settings = {};
  for (const key of keys) {
    if (!ADMIN_SETTING_KEYS.has(key)) continue;
    settings[key] = await loadEditableSetting(env, key, { headers });
  }
  return withCors(json({ ok: true, settings, allowed_keys: Array.from(ADMIN_SETTING_KEYS).sort() }));
}

export async function onRequestPost({ request, env }) {
  const body = await request.json().catch(() => ({}));
  const auth = await requireStaffAccess({ request, env, body, capability: "manage_staff", allowLegacyAdminFallback: true });
  if (!auth.ok) return withCors(auth.response);
  try {
    const key = normalizeSettingKey(body.key);
    const value = body.value && typeof body.value === "object" ? body.value : body.payload;
    const saved = await saveEditableSetting(env, key, value, serviceHeaders(env));
    return withCors(json({ ok: true, key, saved }));
  } catch (error) {
    return withCors(json({ ok: false, error: error?.message || "Could not save editable setting." }, 400));
  }
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type,x-admin-password,x-staff-user-id,x-staff-email",
    "Cache-Control": "no-store"
  };
}
function withCors(response) {
  const headers = new Headers(response.headers || {});
  for (const [key, value] of Object.entries(corsHeaders())) headers.set(key, value);
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}
