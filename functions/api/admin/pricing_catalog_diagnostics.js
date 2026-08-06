// Build 197 — admin pricing catalog diagnostics and partial-DB repair preview.
import { requireStaffAccess, serviceHeaders, json, methodNotAllowed } from "../_lib/staff-auth.js";
import fallbackPricingCatalog from "../data/rosie_services_pricing_and_packages.json";

const ARRAY_GROUPS = ["charts", "packages", "addons", "service_matrix", "service_areas", "public_requirements"];

export async function onRequestGet(context) { return handleDiagnostics(context); }
export async function onRequestPost(context) { return handleDiagnostics(context); }
export async function onRequestOptions() { return new Response("", { status: 204, headers: corsHeaders() }); }

async function handleDiagnostics({ request, env }) {
  try {
    const body = request?.method === "POST" ? await request.json().catch(() => ({})) : {};
    const access = await requireStaffAccess({ request, env, body, capability: "manage_staff", allowLegacyAdminFallback: true });
    if (!access.ok) return withCors(access.response);
    const current = await loadPricingSetting(env);
    const diff = compareCatalog(current.value, fallbackPricingCatalog);
    return withCors(json({
      ok: true,
      build: "197",
      source_status: current.source_status,
      updated_at: current.updated_at || null,
      table_ready: current.table_ready,
      warning: current.warning || null,
      summary: {
        groups_checked: diff.groups.length,
        missing_groups: diff.groups.filter((row) => row.status === "missing_group").length,
        missing_rows: diff.groups.reduce((sum, row) => sum + Number(row.missing_count || 0), 0),
        fallback_rows: diff.groups.reduce((sum, row) => sum + Number(row.fallback_count || 0), 0),
        current_rows: diff.groups.reduce((sum, row) => sum + Number(row.current_count || 0), 0),
        needs_repair: diff.needs_repair
      },
      groups: diff.groups,
      repair_available: !!env?.SUPABASE_URL && current.table_ready,
      recommendation: diff.needs_repair
        ? "Review the missing groups/rows, then use Repair partial pricing catalog to write only missing fallback rows into app_management_settings.pricing_catalog."
        : "Pricing catalog has the expected fallback groups/rows available."
    }));
  } catch (err) {
    return withCors(json({ ok: true, build: "197", source_status: "bundled_json_fallback", table_ready: false, warning: err?.message || "Pricing catalog diagnostics could not run.", summary: { needs_repair: false }, groups: [] }));
  }
}

async function loadPricingSetting(env) {
  if (!env?.SUPABASE_URL) return { value: fallbackPricingCatalog, source_status: "bundled_json_fallback", table_ready: false, warning: "Supabase URL is not configured." };
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/app_management_settings?select=key,value,updated_at&key=eq.pricing_catalog&limit=1`, { headers: serviceHeaders(env) });
  const text = await res.text();
  const rows = safeJson(text) || [];
  if (!res.ok) return { value: fallbackPricingCatalog, source_status: "bundled_json_fallback", table_ready: false, warning: extractError(rows, text, `DB returned ${res.status}`) };
  const row = Array.isArray(rows) ? rows[0] || null : null;
  if (!row || !row.value || typeof row.value !== "object") return { value: {}, source_status: "missing_db_row", table_ready: true, warning: "No DB pricing_catalog row was found." };
  return { value: row.value, source_status: "app_management_settings", table_ready: true, updated_at: row.updated_at || null };
}

function compareCatalog(current, fallback) {
  const groups = ARRAY_GROUPS.map((name) => compareGroup(name, current?.[name], fallback?.[name]));
  const needsRepair = groups.some((row) => row.status !== "ok");
  return { groups, needs_repair: needsRepair };
}

function compareGroup(name, currentRows, fallbackRows) {
  const currentList = Array.isArray(currentRows) ? currentRows : [];
  const fallbackList = Array.isArray(fallbackRows) ? fallbackRows : [];
  const currentKeys = new Set(currentList.map(rowKey).filter(Boolean));
  const fallbackKeys = fallbackList.map(rowKey).filter(Boolean);
  const missing = fallbackKeys.filter((key) => !currentKeys.has(key));
  let status = "ok";
  if (!currentList.length && fallbackList.length) status = "missing_group";
  else if (missing.length) status = "missing_rows";
  return {
    name,
    status,
    current_count: currentList.length,
    fallback_count: fallbackList.length,
    missing_count: missing.length,
    missing_keys: missing.slice(0, 30),
    note: status === "ok" ? "Current DB row has this group." : "Safe repair can add missing fallback rows while preserving saved DB values."
  };
}

function rowKey(row, index) {
  if (row && typeof row === "object") return String(row.code || row.value || row.slug || row.filename || row.title || row.label || index || "").trim();
  return String(row || index || "").trim();
}
function safeJson(text) { try { return JSON.parse(text); } catch { return null; } }
function extractError(data, text, fallback) { if (data?.message) return data.message; if (typeof text === "string" && text.trim()) return text.slice(0, 300); return fallback; }
function corsHeaders() { return { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET,POST,OPTIONS", "Access-Control-Allow-Headers": "Content-Type, x-admin-password, x-staff-email, x-staff-user-id", "Cache-Control": "no-store" }; }
function withCors(response) { const headers = new Headers(response.headers || {}); for (const [k, v] of Object.entries(corsHeaders())) headers.set(k, v); return new Response(response.body, { status: response.status, statusText: response.statusText, headers }); }
export async function onRequestPut() { return withCors(methodNotAllowed()); }
