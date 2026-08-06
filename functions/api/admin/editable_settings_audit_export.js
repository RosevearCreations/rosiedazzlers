// File: /functions/api/admin/editable_settings_audit_export.js
// Build 195: CSV/JSON export of editable-setting changes and restore history.

import { requireStaffAccess, serviceHeaders, json } from "../_lib/staff-auth.js";

export async function onRequestGet({ request, env }) {
  const auth = await requireStaffAccess({ request, env, capability: "manage_staff", allowLegacyAdminFallback: true });
  if (!auth.ok) return auth.response;
  const url = new URL(request.url);
  const format = String(url.searchParams.get("format") || "json").toLowerCase();
  const rows = await loadRows(env);
  if (format === "csv") {
    const csv = toCsv(rows);
    return new Response(csv, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": "attachment; filename=editable-settings-audit-build195.csv", "Cache-Control": "no-store" } });
  }
  return json({ ok: true, build: "195", exported_at: new Date().toISOString(), row_count: rows.length, rows });
}
async function loadRows(env) {
  if (!env?.SUPABASE_URL) return [];
  try {
    const res = await fetch(`${env.SUPABASE_URL}/rest/v1/app_management_setting_history?select=history_id,key,created_at,value&order=created_at.desc&limit=500`, { headers: serviceHeaders(env) });
    if (!res.ok) return [];
    const rows = await res.json().catch(() => []);
    return Array.isArray(rows) ? rows.map((row) => ({ history_id: row.history_id, key: row.key, created_at: row.created_at, top_level_keys: Object.keys(row.value || {}).join("|"), byte_size: JSON.stringify(row.value || {}).length })) : [];
  } catch { return []; }
}
function toCsv(rows) { const header = ["history_id","key","created_at","top_level_keys","byte_size"]; return [header.join(","), ...rows.map((row) => header.map((key) => csvCell(row[key])).join(","))].join("\n"); }
function csvCell(value) { const s = String(value ?? ""); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; }
