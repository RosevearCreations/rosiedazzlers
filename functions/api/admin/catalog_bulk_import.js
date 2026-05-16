import { requireStaffAccess, json, methodNotAllowed } from "../_lib/staff-auth.js";

const ALLOWED_TYPES = new Set(["tool", "consumable"]);

export async function onRequestOptions() { return new Response("", { status: 204, headers: corsHeaders() }); }

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json().catch(() => null);
    const access = await requireStaffAccess({ request, env, body: body || {}, capability: "manage_staff", allowLegacyAdminFallback: false });
    if (!access.ok) return withCors(access.response);

    const rows = Array.isArray(body?.items) ? body.items.slice(0, 300) : [];
    if (!rows.length) return withCors(json({ error: "items array is required." }, 400));

    const now = new Date().toISOString();
    const payload = rows.map((row) => normalizeRow(row, now)).filter(Boolean);
    if (!payload.length) return withCors(json({ error: "No valid rows to import." }, 400));

    const result = await safeBulkUpsert(env, payload);
    if (!result.ok) return withCors(json({ error: result.error, stripped_columns: result.strippedColumns || [] }, 500));
    return withCors(json({ ok: true, imported: result.items.length, items: result.items, stripped_columns: result.strippedColumns || [] }));
  } catch (err) {
    return withCors(json({ error: String(err) }, 500));
  }
}

export async function onRequestGet() { return withCors(methodNotAllowed()); }

function normalizeRow(row, now) {
  const item_type = String(row?.item_type || row?.type || "").trim().toLowerCase().includes("tool") || String(row?.type || "").trim().toLowerCase().includes("gear") ? "tool" : "consumable";
  const costCad = toNum(row?.cost_cad);
  const payload = {
    item_key: String(row?.item_key || row?.key || makeKey(row?.name || row?.title || row?.filename)).trim(),
    item_type,
    name: String(row?.name || row?.title || row?.filename || "").trim(),
    category: String(row?.category || "general").trim() || "general",
    subcategory: String(row?.subcategory || row?.source_kind || "").trim() || null,
    image_url: String(row?.image_url || row?.r2_url || row?.image || "").trim() || null,
    amazon_url: String(row?.amazon_url || row?.purchase_url || "").trim() || null,
    qty_on_hand: Number(row?.qty_on_hand || 0),
    reorder_point: Number(row?.reorder_point || 0),
    reorder_qty: Number(row?.reorder_qty || 1),
    unit_label: String(row?.unit_label || "each").trim() || "each",
    cost_cents: row?.cost_cents != null ? Number(row.cost_cents) : (costCad == null ? null : Math.round(costCad * 100)),
    rating_value: row?.rating_value == null || row?.rating_value === "" ? null : Number(row.rating_value),
    rating_count: Number(row?.rating_count || 0),
    preferred_vendor: String(row?.preferred_vendor || row?.vendor || "").trim() || null,
    vendor_sku: String(row?.vendor_sku || "").trim() || null,
    reuse_policy: String(row?.reuse_policy || "reorder").trim() || "reorder",
    sort_key: row?.sort_key == null || row?.sort_key === "" ? 9999 : Number(row.sort_key),
    purchase_date: String(row?.purchase_date || "").trim() || null,
    estimated_jobs_per_unit: toNum(row?.estimated_jobs_per_unit),
    notes: String(row?.notes || "").trim() || null,
    is_public: row?.is_public !== false,
    is_active: row?.is_active !== false,
    receipt_url: String(row?.receipt_url || row?.bill_url || "").trim() || null,
    assigned_station: String(row?.assigned_station || "").trim() || null,
    service_tags: normalizeTags(row?.service_tags || row?.service_link_tags),
    updated_at: now
  };
  if (!payload.item_key || !payload.name || !ALLOWED_TYPES.has(payload.item_type)) return null;
  return payload;
}

async function safeBulkUpsert(env, payload) {
  const strippedColumns = [];
  let rows = payload.map((row) => ({ ...row }));
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const res = await fetch(`${env.SUPABASE_URL}/rest/v1/catalog_inventory_items?on_conflict=item_key`, {
      method: "POST",
      headers: {
        apikey: env.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates,return=representation"
      },
      body: JSON.stringify(rows)
    });
    if (res.ok) return { ok: true, items: await res.json().catch(() => []), strippedColumns };
    const text = await res.text();
    const missing = detectMissingColumn(text);
    if (missing && rows.some((row) => Object.prototype.hasOwnProperty.call(row, missing))) {
      rows = rows.map((row) => { const copy = { ...row }; delete copy[missing]; return copy; });
      strippedColumns.push(missing);
      continue;
    }
    return { ok: false, error: text, strippedColumns };
  }
  return { ok: false, error: "Could not import catalog rows after compatibility retries.", strippedColumns };
}

function detectMissingColumn(text) {
  const value = String(text || "");
  for (const key of ["receipt_url", "assigned_station", "service_tags", "estimated_jobs_per_unit", "purchase_date", "vendor_sku", "sort_key", "reuse_policy", "is_public", "is_active"]) {
    if (value.includes(key)) return key;
  }
  const match = value.match(/['"]([a-zA-Z0-9_]+)['"] column/i) || value.match(/column ["']?([a-zA-Z0-9_]+)["']? .*does not exist/i);
  return match?.[1] || null;
}
function makeKey(value) { return String(value || "inventory_item").toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 80) || "inventory_item"; }
function normalizeTags(value) { if (Array.isArray(value)) return value.map((v) => String(v || "").trim()).filter(Boolean); const list = String(value || "").split(/[,\n]/).map((v) => v.trim()).filter(Boolean); return list.length ? list : null; }
function toNum(v) { if (v === null || v === undefined || v === "") return null; const n = Number(v); return Number.isFinite(n) ? n : null; }
function corsHeaders() { return { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST,OPTIONS", "Access-Control-Allow-Headers": "Content-Type, x-admin-password, x-staff-email, x-staff-user-id", "Cache-Control": "no-store" }; }
function withCors(response) { const headers = new Headers(response.headers || {}); for (const [k, v] of Object.entries(corsHeaders())) headers.set(k, v); return new Response(response.body, { status: response.status, statusText: response.statusText, headers }); }
