// File: /functions/api/site_settings_public.js
// Build 189: public, safe editable site-setting endpoint with JSON fallback.

import { serviceHeaders } from "./_lib/staff-auth.js";
import { PUBLIC_SETTING_KEYS, loadEditableSetting, normalizeSettingKey } from "./_lib/editable-settings.js";

export async function onRequestOptions() {
  return new Response("", { status: 204, headers: corsHeaders() });
}

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const requested = normalizeSettingKey(url.searchParams.get("key") || "");
  const keys = requested ? [requested] : Array.from(PUBLIC_SETTING_KEYS);
  const out = {};
  const headers = serviceHeaders(env);
  for (const key of keys) {
    if (!PUBLIC_SETTING_KEYS.has(key)) continue;
    out[key] = await loadEditableSetting(env, key, { headers });
  }
  return withCors(json({ ok: true, settings: out }));
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "public, max-age=120" } });
}
function corsHeaders() {
  return { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET,OPTIONS", "Access-Control-Allow-Headers": "Content-Type", "Cache-Control": "public, max-age=120" };
}
function withCors(response) {
  const headers = new Headers(response.headers || {});
  for (const [key, value] of Object.entries(corsHeaders())) headers.set(key, value);
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}
