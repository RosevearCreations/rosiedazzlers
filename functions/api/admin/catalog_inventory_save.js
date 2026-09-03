import { requireStaffAccess, json, methodNotAllowed } from "../_lib/staff-auth.js";
import { evaluateCatalogReadiness } from "../_lib/catalog-readiness.js";
import { validateInventoryPayloadNumbers } from "../_lib/catalog-integrity.js";

export async function onRequestOptions() { return new Response("", { status: 204, headers: corsHeaders() }); }

export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    const body = await request.json().catch(() => null);
    const access = await requireStaffAccess({ request, env, body: body || {}, capability: "manage_staff", allowLegacyAdminFallback: false });
    if (!access.ok) return withCors(access.response);

    const costCad = toNum(body?.cost_cad);
    const payload = {
      item_key: String(body?.item_key || "").trim(),
      item_type: String(body?.item_type || "").trim().toLowerCase(),
      name: String(body?.name || "").trim(),
      category: String(body?.category || "").trim() || null,
      subcategory: String(body?.subcategory || "").trim() || null,
      description: String(body?.description || "").trim() || null,
      image_url: String(body?.image_url || "").trim() || null,
      gallery_image_urls: normalizeGalleryImages(body?.gallery_image_urls || body?.gallery_images),
      amazon_url: String(body?.amazon_url || "").trim() || null,
      qty_on_hand: Number(body?.qty_on_hand || 0),
      reorder_point: Number(body?.reorder_point || 0),
      reorder_qty: Number(body?.reorder_qty || 0),
      unit_label: String(body?.unit_label || "").trim() || null,
      cost_cents: costCad == null ? null : Math.round(costCad * 100),
      rating_value: body?.rating_value == null || body?.rating_value === "" ? null : Number(body.rating_value),
      rating_count: Number(body?.rating_count || 0),
      preferred_vendor: String(body?.preferred_vendor || "").trim() || null,
      vendor_sku: String(body?.vendor_sku || "").trim() || null,
      reuse_policy: String(body?.reuse_policy || "reorder").trim() || "reorder",
      sort_key: body?.sort_key == null || body?.sort_key === "" ? 0 : Number(body.sort_key),
      purchase_date: String(body?.purchase_date || "").trim() || null,
      estimated_jobs_per_unit: toNum(body?.estimated_jobs_per_unit),
      notes: String(body?.notes || "").trim() || null,
      is_public: body?.is_public !== false,
      is_active: body?.is_active !== false,
      receipt_url: String(body?.receipt_url || body?.bill_url || "").trim() || null,
      assigned_station: String(body?.assigned_station || body?.station_label || "").trim() || null,
      amazon_asin: String(body?.amazon_asin || "").trim() || null,
      amazon_title: String(body?.amazon_title || "").trim() || null,
      amazon_match_status: String(body?.amazon_match_status || "").trim() || null,
      amazon_match_score: body?.amazon_match_score == null || body?.amazon_match_score === "" ? null : Number(body.amazon_match_score),
      amazon_seller_name: String(body?.amazon_seller_name || "").trim() || null,
      amazon_brand: String(body?.amazon_brand || "").trim() || null,
      amazon_category: String(body?.amazon_category || "").trim() || null,
      amazon_quantity_total: body?.amazon_quantity_total == null || body?.amazon_quantity_total === "" ? null : Number(body.amazon_quantity_total),
      amazon_net_total_cents: body?.amazon_net_total_cents == null || body?.amazon_net_total_cents === "" ? null : Number(body.amazon_net_total_cents),
      service_tags: normalizeTags(body?.service_tags || body?.service_link_tags),
      updated_at: new Date().toISOString()
    };

    if (!payload.item_key || !payload.name || !["tool", "consumable"].includes(payload.item_type)) return withCors(json({ error: "Missing required fields." }, 400));
    if (!["reorder", "single_use", "never_reuse"].includes(payload.reuse_policy)) return withCors(json({ error: "Invalid reuse policy." }, 400));
    const numericErrors = validateInventoryPayloadNumbers(payload);
    if (numericErrors.length) return withCors(json({ error: numericErrors.join(' '), integrity_validation: true }, 400));

    const readiness = evaluateCatalogReadiness(payload);
    if (payload.is_public && !readiness.ready) return withCors(json({ error: "This item cannot be public until its publishing blockers are corrected.", publish_readiness: readiness }, 409));

    const result = await safeUpsertInventory(env, payload);
    if (!result.ok) return withCors(json({ error: result.error, stripped_columns: result.strippedColumns || [] }, 500));
    return withCors(json({ ok: true, item: result.item, publish_readiness: evaluateCatalogReadiness(result.item || payload), stripped_columns: result.strippedColumns || [] }));
  } catch (err) {
    return withCors(json({ error: String(err) }, 500));
  }
}

export async function onRequestGet() { return withCors(methodNotAllowed()); }

async function safeUpsertInventory(env, payload) {
  const strippedColumns = [];
  let current = { ...payload };
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const res = await fetch(`${env.SUPABASE_URL}/rest/v1/catalog_inventory_items?on_conflict=item_key`, {
      method: "POST",
      headers: {
        apikey: env.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates,return=representation"
      },
      body: JSON.stringify([current])
    });
    if (res.ok) return { ok: true, item: (await res.json().catch(() => []))?.[0] || null, strippedColumns };
    const text = await res.text();
    const missing = detectMissingColumn(text);
    if (missing && Object.prototype.hasOwnProperty.call(current, missing)) {
      delete current[missing];
      strippedColumns.push(missing);
      continue;
    }
    return { ok: false, error: text, strippedColumns };
  }
  return { ok: false, error: "Could not save inventory item after compatibility retries.", strippedColumns };
}

function detectMissingColumn(text) {
  const value = String(text || "");
  const patterns = [
    /column ["']?([a-zA-Z0-9_]+)["']? (?:of relation )?(?:does not exist|is missing)/i,
    /Could not find the ['"]([a-zA-Z0-9_]+)['"] column/i,
    /schema cache.*['"]([a-zA-Z0-9_]+)['"]/i,
    /PGRST204.*['"]([a-zA-Z0-9_]+)['"]/i
  ];
  for (const pattern of patterns) {
    const match = value.match(pattern);
    if (match?.[1]) return match[1];
  }
  for (const key of ["gallery_image_urls", "description", "amazon_asin", "amazon_title", "amazon_match_status", "amazon_match_score", "amazon_seller_name", "amazon_brand", "amazon_category", "amazon_quantity_total", "amazon_net_total_cents", "receipt_url", "assigned_station", "service_tags", "estimated_jobs_per_unit", "purchase_date", "vendor_sku", "sort_key", "reuse_policy", "is_public", "is_active"]) {
    if (value.includes(key)) return key;
  }
  return null;
}

function normalizeGalleryImages(value) {
  let list = [];
  if (Array.isArray(value)) list = value;
  else if (typeof value === "string" && value.trim()) {
    try { const parsed = JSON.parse(value); list = Array.isArray(parsed) ? parsed : value.split(/[\n,]/); }
    catch { list = value.split(/[\n,]/); }
  }
  const seen = new Set();
  return list.map((v) => String(v || "").trim()).filter((v) => { const key = v.toLowerCase(); if (!v || seen.has(key)) return false; seen.add(key); return true; }).slice(0, 7);
}

function normalizeTags(value) {
  if (Array.isArray(value)) return value.map((v) => String(v || "").trim()).filter(Boolean);
  const list = String(value || "").split(/[,\n]/).map((v) => v.trim()).filter(Boolean);
  return list.length ? list : null;
}

function corsHeaders() { return { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST,OPTIONS", "Access-Control-Allow-Headers": "Content-Type, x-admin-password, x-staff-email, x-staff-user-id", "Cache-Control": "no-store" }; }
function withCors(response) { const headers = new Headers(response.headers || {}); for (const [k, v] of Object.entries(corsHeaders())) headers.set(k, v); return new Response(response.body, { status: response.status, statusText: response.statusText, headers }); }
function toNum(v) { if (v === null || v === undefined || v === "") return null; const n = Number(v); return Number.isFinite(n) ? n : null; }
