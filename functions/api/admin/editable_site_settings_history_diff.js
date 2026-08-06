// File: /functions/api/admin/editable_site_settings_history_diff.js
// Build 195: side-by-side diff between selected editable-setting history rows and current editor/DB/fallback JSON.

import { requireStaffAccess, serviceHeaders, json } from "../_lib/staff-auth.js";
import { fallbackForKey, loadEditableSetting, normalizeSettingKey } from "../_lib/editable-settings.js";

export async function onRequestOptions() { return new Response("", { status: 204, headers: corsHeaders() }); }

export async function onRequestPost({ request, env }) {
  const body = await request.json().catch(() => ({}));
  const auth = await requireStaffAccess({ request, env, body, capability: "manage_staff", allowLegacyAdminFallback: true });
  if (!auth.ok) return withCors(auth.response);
  try {
    const key = normalizeSettingKey(body.key || "");
    const historyId = Number(body.history_id || body.id || 0);
    if (!key) return withCors(json({ ok: false, error: "key is required." }, 400));
    if (!(historyId > 0)) return withCors(json({ ok: false, error: "history_id is required." }, 400));
    const headers = serviceHeaders(env);
    const historyRow = await loadHistoryRow(env, key, historyId, headers);
    if (!historyRow) return withCors(json({ ok: false, error: "History row was not found." }, 404));
    const current = body.current && typeof body.current === "object"
      ? { value: body.current, source_status: "unsaved_editor_json" }
      : await loadEditableSetting(env, key, { headers });
    return withCors(json({
      ok: true,
      build: "195",
      key,
      history: { history_id: historyRow.history_id, created_at: historyRow.created_at || null, preview_keys: Object.keys(historyRow.value || {}).slice(0, 16) },
      current_source: current.source_status || "unknown",
      diff: diffObjects(current.value || {}, historyRow.value || {}),
      fallback_diff: diffObjects(fallbackForKey(key), historyRow.value || {})
    }));
  } catch (error) {
    return withCors(json({ ok: false, error: error?.message || "Could not diff history row." }, 500));
  }
}

async function loadHistoryRow(env, key, historyId, headers) {
  if (!env?.SUPABASE_URL) return null;
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/app_management_setting_history?select=history_id,key,value,created_at&history_id=eq.${historyId}&key=eq.${encodeURIComponent(key)}&limit=1`, { headers });
  if (!res.ok) return null;
  const rows = await res.json().catch(() => []);
  return Array.isArray(rows) ? rows[0] || null : null;
}

function diffObjects(left, right) {
  const a = flatten(left);
  const b = flatten(right);
  const paths = new Set([...Object.keys(a), ...Object.keys(b)]);
  const changed = [];
  const added = [];
  const removed = [];
  const same = [];
  for (const path of Array.from(paths).sort()) {
    const hasA = Object.prototype.hasOwnProperty.call(a, path);
    const hasB = Object.prototype.hasOwnProperty.call(b, path);
    if (hasA && !hasB) removed.push({ path, current: a[path] });
    else if (!hasA && hasB) added.push({ path, history: b[path] });
    else if (JSON.stringify(a[path]) !== JSON.stringify(b[path])) changed.push({ path, current: a[path], history: b[path] });
    else same.push(path);
  }
  return { changed_count: changed.length, added_count: added.length, removed_count: removed.length, same_count: same.length, changed: changed.slice(0, 120), added: added.slice(0, 80), removed: removed.slice(0, 80) };
}
function flatten(value, prefix = "", out = {}) {
  if (Array.isArray(value)) { value.forEach((item, index) => flatten(item, `${prefix}[${index}]`, out)); if (!value.length && prefix) out[prefix] = []; return out; }
  if (value && typeof value === "object") { const keys = Object.keys(value); if (!keys.length && prefix) out[prefix] = {}; keys.forEach((key) => flatten(value[key], prefix ? `${prefix}.${key}` : key, out)); return out; }
  if (prefix) out[prefix] = value;
  return out;
}
function corsHeaders() { return { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST,OPTIONS", "Access-Control-Allow-Headers": "Content-Type,x-admin-password,x-staff-user-id,x-staff-email", "Cache-Control": "no-store" }; }
function withCors(response) { const headers = new Headers(response.headers || {}); for (const [k,v] of Object.entries(corsHeaders())) headers.set(k,v); return new Response(response.body, { status: response.status, statusText: response.statusText, headers }); }
