// functions/api/analytics/ingest.js
// Public analytics ingestion. This endpoint fails open so public pages never show console 500s when analytics storage is unavailable.

import { loadFeatureFlags } from "../_lib/app-settings.js";
import { loadEditableSetting } from "../_lib/editable-settings.js";

export async function onRequestOptions() {
  return new Response("", { status: 204, headers: corsHeaders() });
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const serviceKey = getSupabaseServiceRoleKey(env);

  try {
    if (!env?.SUPABASE_URL || !serviceKey) {
      return withCors(json({ ok: true, skipped: true, reason: "analytics_storage_not_configured" }));
    }

    const flags = await loadFeatureFlags(normalizeEnv(env)).catch(() => ({}));
    if (flags?.analytics_tracking_enabled === false) {
      return withCors(json({ ok: true, skipped: true, reason: "analytics_disabled" }));
    }

    const body = await request.json().catch(() => ({}));
    const visitor_id = clean(body.visitor_id, 128);
    const session_id = clean(body.session_id, 128);
    const event_type = clean(body.event_type, 80) || "page_view";
    const page_path = normalizePath(body.page_path || "/");
    const page_title = clean(body.page_title, 200);
    const referrer = clean(body.referrer, 1000);
    const country = clean(body.country, 80) || request.headers.get("cf-ipcountry") || null;
    const ip_address = request.headers.get("cf-connecting-ip") || null;
    const user_agent = request.headers.get("user-agent") || null;
    const locale = clean(body.locale, 40);
    const timezone = clean(body.timezone, 80);
    const screen = clean(body.screen, 40);
    const source = clean(body.source, 80);
    const campaign = clean(body.campaign, 120);
    const checkout_state = clean(body.checkout_state, 40);
    const registry = await loadAnalyticsEventMeta(env, event_type).catch(() => ({ known: false, active: true }));
    if (registry.active === false) {
      return withCors(json({ ok: true, skipped: true, reason: "analytics_event_inactive", event_type }));
    }
    const basePayload = sanitizePayload({
      ...(body.payload || {}),
      event_label: registry.label || body.payload?.event_label || event_type,
      event_category: registry.category || body.payload?.event_category || "",
      event_registry_known: registry.known === true
    });
    const cf = request.cf || {};
    const payload = sanitizePayload({
      ...basePayload,
      city: clean(cf.city, 120),
      region: clean(cf.region, 120),
      region_code: clean(cf.regionCode, 32),
      postal_code: clean(cf.postalCode, 40),
      metro_code: clean(cf.metroCode, 32),
      timezone: clean(cf.timezone, 80) || timezone,
      latitude: clean(cf.latitude, 40),
      longitude: clean(cf.longitude, 40),
      colo: clean(cf.colo, 32),
      client_tcp_rtt: clean(cf.clientTcpRtt, 32),
      request_priority: clean(request.headers.get("priority"), 64),
      method: clean(request.method, 16),
      device_type: classifyDeviceType(user_agent)
    });

    if (!visitor_id || !session_id) {
      return withCors(json({ ok: true, skipped: true, reason: "missing_visitor_or_session" }));
    }

    const res = await fetch(`${env.SUPABASE_URL}/rest/v1/site_activity_events`, {
      method: "POST",
      headers: serviceHeaders(env),
      body: JSON.stringify([{
        visitor_id,
        session_id,
        event_type,
        page_path,
        page_title,
        referrer,
        country,
        ip_address,
        user_agent,
        locale,
        timezone,
        screen,
        source,
        campaign,
        checkout_state,
        payload,
        created_at: new Date().toISOString()
      }])
    });

    if (!res.ok) {
      return withCors(json({ ok: true, skipped: true, reason: "analytics_storage_unavailable", diagnostic: safeError(await res.text()) }));
    }

    return withCors(json({ ok: true }));
  } catch (err) {
    return withCors(json({ ok: true, skipped: true, reason: "analytics_ingest_exception", diagnostic: safeError(err) }));
  }
}

export async function onRequestGet() {
  return withCors(json({ ok: true, skipped: true, reason: "analytics_post_only" }));
}

async function loadAnalyticsEventMeta(env, eventType) {
  const loaded = await loadEditableSetting(env, "analytics_event_registry", { headers: serviceHeaders(env) });
  const events = Array.isArray(loaded?.value?.events) ? loaded.value.events : [];
  const match = events.find((event) => String(event.key || "").trim() === String(eventType || "").trim());
  if (!match) return { known: false, active: true, label: eventType, category: "" };
  return { known: true, active: match.is_active !== false, label: match.label || eventType, category: match.category || "" };
}

function normalizeEnv(env) {
  return new Proxy(env || {}, {
    get(target, prop) {
      if (prop === "SUPABASE_SERVICE_ROLE_KEY") return getSupabaseServiceRoleKey(target);
      return target[prop];
    }
  });
}

function getSupabaseServiceRoleKey(env) {
  return env?.SUPABASE_SERVICE_ROLE_KEY || env?.SUPABASE_SERVICE_KEY || env?.SUPABASE_SERVICE_ROLE || env?.SUPABASE_SECRET_KEY || "";
}

function serviceHeaders(env) {
  const serviceKey = getSupabaseServiceRoleKey(env);
  return { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, "Content-Type": "application/json", Prefer: "return=minimal" };
}

function clean(v, n = 255) {
  const s = String(v ?? "").trim();
  return s ? s.slice(0, n) : null;
}

function normalizePath(p) {
  const s = String(p || "/").trim();
  if (!s) return "/";
  return s.startsWith("/") ? s.slice(0, 255) : `/${s.slice(0, 254)}`;
}

function sanitizePayload(payload) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return {};
  const out = {};
  for (const [k, v] of Object.entries(payload).slice(0, 40)) {
    const key = String(k).slice(0, 80);
    if (v == null) out[key] = null;
    else if (["string", "number", "boolean"].includes(typeof v)) out[key] = typeof v === "string" ? v.slice(0, 500) : v;
  }
  return out;
}

function classifyDeviceType(userAgent) {
  const ua = String(userAgent || "").toLowerCase();
  if (/mobile|iphone|ipod|android(?!.*tablet)/.test(ua)) return "mobile";
  if (/ipad|tablet|kindle|silk|playbook/.test(ua)) return "tablet";
  return "desktop";
}

function safeError(err) {
  const raw = err?.message || String(err || "Unexpected server error.");
  return raw.replace(/Bearer\s+[A-Za-z0-9._\-]+/g, "Bearer [redacted]").slice(0, 500);
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), { status, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" } });
}

function corsHeaders() {
  return { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET,POST,OPTIONS", "Access-Control-Allow-Headers": "Content-Type", "Cache-Control": "no-store" };
}

function withCors(response) {
  const headers = new Headers(response.headers || {});
  for (const [key, value] of Object.entries(corsHeaders())) headers.set(key, value);
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}
