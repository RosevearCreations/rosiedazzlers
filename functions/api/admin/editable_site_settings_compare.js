// File: /functions/api/admin/editable_site_settings_compare.js
// Build 194: compare current DB-backed setting values with bundled fallbacks and optional history rows.

import { requireStaffAccess, serviceHeaders, json } from "../_lib/staff-auth.js";
import { fallbackForKey, loadEditableSetting, normalizeSettingKey } from "../_lib/editable-settings.js";

export async function onRequestOptions() {
  return new Response("", { status: 204, headers: corsHeaders() });
}

export async function onRequestPost({ request, env }) {
  const body = await request.json().catch(() => ({}));
  const auth = await requireStaffAccess({ request, env, body, capability: "manage_staff", allowLegacyAdminFallback: true });
  if (!auth.ok) return withCors(auth.response);
  try {
    const key = normalizeSettingKey(body.key);
    const headers = serviceHeaders(env);
    const current = body.current && typeof body.current === "object"
      ? { key, value: body.current, source_status: "unsaved_editor_json" }
      : await loadEditableSetting(env, key, { headers });
    const fallbackValue = fallbackForKey(key);
    const fallback = { key, value: fallbackValue, source_status: "bundled_json_fallback" };
    const diff = diffObjects(current.value || {}, fallback.value || {});
    const history = body.include_history === false ? [] : await loadRecentHistory(env, key, headers);
    return withCors(json({
      ok: true,
      build: "194",
      key,
      current_source: current.source_status || current.source || "unknown",
      fallback_source: fallback.source_status,
      diff,
      history
    }));
  } catch (error) {
    return withCors(json({ ok: false, error: error?.message || "Could not compare editable setting." }, 500));
  }
}

export async function onRequestGet({ request, env }) {
  const auth = await requireStaffAccess({ request, env, capability: "manage_staff", allowLegacyAdminFallback: true });
  if (!auth.ok) return withCors(auth.response);
  const url = new URL(request.url);
  const key = normalizeSettingKey(url.searchParams.get("key") || "");
  const headers = serviceHeaders(env);
  const current = await loadEditableSetting(env, key, { headers });
  const fallback = { key, value: fallbackForKey(key), source_status: "bundled_json_fallback" };
  return withCors(json({ ok: true, build: "194", key, current_source: current.source_status || "unknown", diff: diffObjects(current.value || {}, fallback.value || {}) }));
}

async function loadRecentHistory(env, key, headers) {
  if (!env?.SUPABASE_URL || !key) return [];
  try {
    const res = await fetch(`${env.SUPABASE_URL}/rest/v1/app_management_setting_history?select=id,key,value,created_at&key=eq.${encodeURIComponent(key)}&order=created_at.desc&limit=5`, { headers });
    if (!res.ok) return [];
    const rows = await res.json().catch(() => []);
    return (Array.isArray(rows) ? rows : []).map((row) => ({
      id: row.id || null,
      created_at: row.created_at || null,
      change_count_vs_current: null,
      preview_keys: Object.keys(row.value || {}).slice(0, 12)
    }));
  } catch {
    return [];
  }
}

function diffObjects(current, fallback) {
  const currentFlat = flatten(current);
  const fallbackFlat = flatten(fallback);
  const paths = new Set([...Object.keys(currentFlat), ...Object.keys(fallbackFlat)]);
  const added = [];
  const removed = [];
  const changed = [];
  const same = [];
  for (const path of Array.from(paths).sort()) {
    const hasCurrent = Object.prototype.hasOwnProperty.call(currentFlat, path);
    const hasFallback = Object.prototype.hasOwnProperty.call(fallbackFlat, path);
    if (hasCurrent && !hasFallback) added.push({ path, current: currentFlat[path] });
    else if (!hasCurrent && hasFallback) removed.push({ path, fallback: fallbackFlat[path] });
    else if (JSON.stringify(currentFlat[path]) !== JSON.stringify(fallbackFlat[path])) changed.push({ path, current: currentFlat[path], fallback: fallbackFlat[path] });
    else same.push(path);
  }
  return {
    added_count: added.length,
    removed_count: removed.length,
    changed_count: changed.length,
    same_count: same.length,
    added: added.slice(0, 80),
    removed: removed.slice(0, 80),
    changed: changed.slice(0, 120)
  };
}

function flatten(value, prefix = "", out = {}) {
  if (Array.isArray(value)) {
    value.forEach((item, index) => flatten(item, `${prefix}[${index}]`, out));
    if (!value.length && prefix) out[prefix] = [];
    return out;
  }
  if (value && typeof value === "object") {
    const keys = Object.keys(value);
    if (!keys.length && prefix) out[prefix] = {};
    for (const key of keys) flatten(value[key], prefix ? `${prefix}.${key}` : key, out);
    return out;
  }
  if (prefix) out[prefix] = value;
  return out;
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
