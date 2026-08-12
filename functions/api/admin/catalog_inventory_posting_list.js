import { requireStaffAccess, json } from "../_lib/staff-auth.js";
import { serviceHeaders, safeText } from "../_lib/inventory-posting.js";

export async function onRequestOptions() { return new Response("", { status: 204, headers: corsHeaders() }); }
export async function onRequestGet({ request, env }) {
  try {
    const access = await requireStaffAccess({ request, env, capability: "manage_staff", allowLegacyAdminFallback: false });
    if (!access.ok) return withCors(access.response);
    const url = new URL(request.url);
    const limit = Math.max(1, Math.min(200, Number(url.searchParams.get("limit") || 75)));
    const sourceKind = safeText(url.searchParams.get("source_kind"), 40);
    const sourceId = safeText(url.searchParams.get("source_reference_id"), 80);
    let path = `catalog_inventory_posting_batches?select=*&order=created_at.desc&limit=${limit}`;
    if (["booking", "creative_project"].includes(sourceKind)) path += `&source_kind=eq.${encodeURIComponent(sourceKind)}`;
    if (sourceId) path += `&source_reference_id=eq.${encodeURIComponent(sourceId)}`;
    const batchesRes = await fetch(`${env.SUPABASE_URL}/rest/v1/${path}`, { headers: serviceHeaders(env) });
    if (!batchesRes.ok) {
      const detail = await batchesRes.text();
      if (/does not exist|schema cache|PGRST/i.test(detail)) return withCors(json({ error: "Build 240 migration is required.", migration_required: true, migration: "sql/2026-08-05_build240_transactional_inventory_posting_reversal.sql", detail: detail.slice(0, 800) }, 409));
      return withCors(json({ error: detail.slice(0, 800) }, 500));
    }
    const batches = await batchesRes.json().catch(() => []);
    const ids = (Array.isArray(batches) ? batches : []).map((row) => row.id).filter(Boolean);
    let rows = [];
    if (ids.length) {
      const rowsRes = await fetch(`${env.SUPABASE_URL}/rest/v1/catalog_inventory_posting_rows?select=*&batch_id=in.(${ids.join(",")})&order=created_at.asc`, { headers: serviceHeaders(env) });
      if (rowsRes.ok) rows = await rowsRes.json().catch(() => []);
    }
    const byBatch = new Map();
    for (const row of Array.isArray(rows) ? rows : []) {
      if (!byBatch.has(row.batch_id)) byBatch.set(row.batch_id, []);
      byBatch.get(row.batch_id).push(row);
    }
    return withCors(json({ ok: true, batches: (Array.isArray(batches) ? batches : []).map((batch) => ({ ...batch, rows: byBatch.get(batch.id) || [] })) }));
  } catch (err) {
    return withCors(json({ error: safeText(err?.message || err, 800) }, 500));
  }
}
function corsHeaders() { return { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET,OPTIONS", "Access-Control-Allow-Headers": "Content-Type, x-admin-password, x-staff-email, x-staff-user-id", "Cache-Control": "no-store" }; }
function withCors(response) { const headers = new Headers(response.headers || {}); for (const [key, value] of Object.entries(corsHeaders())) headers.set(key, value); return new Response(response.body, { status: response.status, statusText: response.statusText, headers }); }
