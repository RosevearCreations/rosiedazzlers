// Build 197 — safely write missing fallback pricing groups/rows into app_management_settings.pricing_catalog.
import { requireStaffAccess, serviceHeaders, json, methodNotAllowed } from "../_lib/staff-auth.js";
import fallbackPricingCatalog from "../data/rosie_services_pricing_and_packages.json";

const ARRAY_GROUPS = ["charts", "packages", "addons", "service_matrix", "service_areas", "public_requirements"];

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json().catch(() => ({}));
    const access = await requireStaffAccess({ request, env, body, capability: "manage_staff", allowLegacyAdminFallback: true });
    if (!access.ok) return withCors(access.response);
    if (!env?.SUPABASE_URL) return withCors(json({ ok: false, table_ready: false, error: "Supabase URL is not configured." }, 200));

    const headers = serviceHeaders(env);
    const current = await loadCurrentPricing(env, headers);
    const repair = buildRepairedCatalog(current.value || {}, fallbackPricingCatalog);
    if (body.preview_only === true) return withCors(json({ ok: true, build: "197", preview_only: true, changed_groups: repair.changed_groups, repaired_value: repair.value }));
    if (!repair.changed_groups.length) return withCors(json({ ok: true, build: "197", saved: false, message: "No missing fallback pricing rows were found.", changed_groups: [] }));

    const payload = {
      ...repair.value,
      source_status: "app_management_settings",
      repaired_from_fallback_at: new Date().toISOString(),
      build197_repair_note: "Only missing fallback pricing groups/rows were added; existing DB values were preserved."
    };
    const res = await fetch(`${env.SUPABASE_URL}/rest/v1/app_management_settings?on_conflict=key`, {
      method: "POST",
      headers: { ...headers, Prefer: "resolution=merge-duplicates,return=representation", "Content-Type": "application/json" },
      body: JSON.stringify([{ key: "pricing_catalog", value: payload, updated_at: new Date().toISOString() }])
    });
    const text = await res.text();
    const data = safeJson(text);
    if (!res.ok) return withCors(json({ ok: false, table_ready: false, error: extractError(data, text, "Could not repair pricing catalog.") }, 200));
    return withCors(json({ ok: true, build: "197", saved: true, changed_groups: repair.changed_groups, setting: Array.isArray(data) ? data[0] || null : data }));
  } catch (err) {
    return withCors(json({ ok: false, table_ready: false, error: err?.message || "Could not repair pricing catalog." }, 200));
  }
}
export async function onRequestGet() { return withCors(methodNotAllowed()); }
export async function onRequestOptions() { return new Response("", { status: 204, headers: corsHeaders() }); }

async function loadCurrentPricing(env, headers) {
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/app_management_settings?select=key,value,updated_at&key=eq.pricing_catalog&limit=1`, { headers });
  const text = await res.text();
  const data = safeJson(text) || [];
  if (!res.ok) throw new Error(extractError(data, text, "Could not load current pricing catalog."));
  const row = Array.isArray(data) ? data[0] || null : null;
  return { value: row?.value && typeof row.value === "object" ? row.value : {}, updated_at: row?.updated_at || null };
}

function buildRepairedCatalog(current, fallback) {
  const next = deepClone(current || {});
  const changed = [];
  for (const group of ARRAY_GROUPS) {
    const currentRows = Array.isArray(next[group]) ? next[group] : [];
    const fallbackRows = Array.isArray(fallback?.[group]) ? fallback[group] : [];
    if (!fallbackRows.length) continue;
    if (!currentRows.length) {
      next[group] = deepClone(fallbackRows);
      changed.push({ group, action: "added_group", added_count: fallbackRows.length });
      continue;
    }
    const existing = new Set(currentRows.map(rowKey).filter(Boolean));
    const additions = fallbackRows.filter((row, index) => {
      const key = rowKey(row, index);
      return key && !existing.has(key);
    });
    if (additions.length) {
      next[group] = currentRows.concat(deepClone(additions));
      changed.push({ group, action: "added_missing_rows", added_count: additions.length, added_keys: additions.map(rowKey).filter(Boolean).slice(0, 30) });
    }
  }
  if (!next.booking_rules && fallback?.booking_rules) {
    next.booking_rules = deepClone(fallback.booking_rules);
    changed.push({ group: "booking_rules", action: "added_group", added_count: 1 });
  } else if (next.booking_rules && fallback?.booking_rules) {
    next.booking_rules = mergePlainObjects(fallback.booking_rules, next.booking_rules);
  }
  return { value: next, changed_groups: changed };
}
function mergePlainObjects(fallback, current) {
  const out = deepClone(fallback || {});
  for (const [key, value] of Object.entries(current || {})) out[key] = value && typeof value === "object" && !Array.isArray(value) ? mergePlainObjects(out[key], value) : value;
  return out;
}
function rowKey(row, index) { if (row && typeof row === "object") return String(row.code || row.value || row.slug || row.filename || row.title || row.label || index || "").trim(); return String(row || index || "").trim(); }
function deepClone(value) { return JSON.parse(JSON.stringify(value || {})); }
function safeJson(text) { try { return JSON.parse(text); } catch { return null; } }
function extractError(data, text, fallback) { if (data?.message) return data.message; if (typeof text === "string" && text.trim()) return text.slice(0, 300); return fallback; }
function corsHeaders() { return { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST,OPTIONS", "Access-Control-Allow-Headers": "Content-Type, x-admin-password, x-staff-email, x-staff-user-id", "Cache-Control": "no-store" }; }
function withCors(response) { const headers = new Headers(response.headers || {}); for (const [k, v] of Object.entries(corsHeaders())) headers.set(k, v); return new Response(response.body, { status: response.status, statusText: response.statusText, headers }); }
