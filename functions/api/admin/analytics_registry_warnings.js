// functions/api/admin/analytics_registry_warnings.js
// Build 192: warn when raw analytics events are not listed in analytics_event_registry.

import { requireStaffAccess, serviceHeaders, json, methodNotAllowed } from "../_lib/staff-auth.js";
import { loadEditableSetting } from "../_lib/editable-settings.js";

export async function onRequestOptions() {
  return new Response("", { status: 204, headers: corsHeaders() });
}

export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    const body = await request.json().catch(() => ({}));
    const access = await requireStaffAccess({ request, env, body, capability: "view_analytics", allowLegacyAdminFallback: true });
    if (!access.ok) return withCors(access.response);

    const days = Math.min(90, Math.max(1, Number(body.days || 30)));
    const limit = Math.min(5000, Math.max(100, Number(body.limit || 1500)));
    const since = new Date(Date.now() - days * 86400000).toISOString();
    const registry = await loadEditableSetting(env, "analytics_event_registry", { headers: serviceHeaders(env) });
    const knownEvents = new Set(extractKnownEvents(registry?.value));

    if (!env?.SUPABASE_URL || !env?.SUPABASE_SERVICE_ROLE_KEY) {
      return withCors(json({ ok: true, build: "192", warnings: [], warning: "Supabase service role is not configured; registry warning scan skipped.", registry_source: registry?.source_status || registry?.source || "fallback" }));
    }

    const url = `${env.SUPABASE_URL}/rest/v1/site_activity_events?select=event_type,created_at&created_at=gte.${encodeURIComponent(since)}&order=created_at.desc&limit=${limit}`;
    const res = await fetch(url, { headers: serviceHeaders(env) });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return withCors(json({ ok: false, error: `Could not scan analytics event registry warnings. ${text}` }, 500));
    }
    const rows = await res.json().catch(() => []);
    const counts = new Map();
    for (const row of Array.isArray(rows) ? rows : []) {
      const eventType = String(row?.event_type || "").trim();
      if (!eventType || knownEvents.has(eventType)) continue;
      const existing = counts.get(eventType) || { event_type: eventType, count: 0, last_seen_at: null };
      existing.count += 1;
      if (!existing.last_seen_at || String(row.created_at || "") > existing.last_seen_at) existing.last_seen_at = row.created_at || null;
      counts.set(eventType, existing);
    }
    const warnings = Array.from(counts.values())
      .sort((a, b) => b.count - a.count || String(b.last_seen_at || "").localeCompare(String(a.last_seen_at || "")))
      .slice(0, 40)
      .map((row) => ({ ...row, recommendation: "Add this event to analytics_event_registry or fix the emitting code if it is a typo." }));

    return withCors(json({
      ok: true,
      build: "192",
      days,
      scanned_count: Array.isArray(rows) ? rows.length : 0,
      known_event_count: knownEvents.size,
      unknown_event_count: warnings.reduce((sum, row) => sum + Number(row.count || 0), 0),
      registry_source: registry?.source_status || registry?.source || "fallback",
      warnings
    }));
  } catch (error) {
    return withCors(json({ ok: false, error: String(error?.message || error) }, 500));
  }
}

export async function onRequestGet() {
  return withCors(methodNotAllowed());
}

function extractKnownEvents(value) {
  const out = [];
  const events = Array.isArray(value?.events) ? value.events : [];
  for (const row of events) {
    if (typeof row === "string") out.push(row);
    else if (row && typeof row === "object") out.push(row.event_type || row.name || row.key || row.event);
  }
  return out.map((item) => String(item || "").trim()).filter(Boolean);
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, x-admin-password, x-staff-email, x-staff-user-id",
    "Cache-Control": "no-store"
  };
}

function withCors(response) {
  const headers = new Headers(response.headers || {});
  Object.entries(corsHeaders()).forEach(([key, value]) => headers.set(key, value));
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}
