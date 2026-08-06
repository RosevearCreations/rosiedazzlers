// File: /functions/api/admin/analytics_registry_add_event.js
// Build 194: one-click add for unknown analytics events shown by Admin Analytics registry warnings.

import { requireStaffAccess, serviceHeaders, json } from "../_lib/staff-auth.js";
import { loadEditableSetting, saveEditableSetting } from "../_lib/editable-settings.js";

export async function onRequestOptions() {
  return new Response("", { status: 204, headers: corsHeaders() });
}

export async function onRequestPost({ request, env }) {
  const body = await request.json().catch(() => ({}));
  const auth = await requireStaffAccess({ request, env, body, capability: "manage_staff", allowLegacyAdminFallback: true });
  if (!auth.ok) return withCors(auth.response);
  try {
    const eventType = cleanEvent(body.event_type || body.event || body.name);
    if (!eventType) return withCors(json({ ok: false, error: "Missing event_type." }, 400));
    const headers = serviceHeaders(env);
    const loaded = await loadEditableSetting(env, "analytics_event_registry", { headers });
    const value = loaded.value && typeof loaded.value === "object" ? { ...loaded.value } : {};
    const events = Array.isArray(value.events) ? value.events.slice() : [];
    const exists = events.some((row) => cleanEvent(typeof row === "string" ? row : row?.event_type || row?.name || row?.key || row?.event) === eventType);
    if (!exists) {
      events.push({
        event_type: eventType,
        label: cleanLabel(body.label) || eventType.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
        group: cleanLabel(body.group) || "admin_reviewed",
        description: cleanLabel(body.description) || "Added from Admin Analytics registry warnings.",
        added_from_warning: true,
        added_at: new Date().toISOString()
      });
    }
    value.events = events;
    value.updated_at = new Date().toISOString();
    value.source_status = "app_management_settings";
    const saved = await saveEditableSetting(env, "analytics_event_registry", value, headers);
    return withCors(json({ ok: true, build: "194", event_type: eventType, already_present: exists, saved }));
  } catch (error) {
    return withCors(json({ ok: false, error: error?.message || "Could not add analytics event to registry." }, 500));
  }
}

export async function onRequestGet() {
  return withCors(json({ ok: false, error: "Use POST." }, 405));
}

function cleanEvent(value) {
  return String(value || "").trim().toLowerCase().replace(/[^a-z0-9_:\-.]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 120);
}
function cleanLabel(value) {
  return String(value || "").trim().replace(/\s+/g, " ").slice(0, 180);
}
function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type,x-admin-password,x-staff-user-id,x-staff-email",
    "Cache-Control": "no-store"
  };
}
function withCors(response) {
  const headers = new Headers(response.headers || {});
  for (const [key, value] of Object.entries(corsHeaders())) headers.set(key, value);
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}
