import { requireStaffAccess, json, methodNotAllowed } from "../_lib/staff-auth.js";
import { evaluateCatalogReadiness } from "../_lib/catalog-readiness.js";

export async function onRequestOptions() { return new Response("", { status: 204, headers: corsHeaders() }); }
export async function onRequestGet() { return withCors(methodNotAllowed()); }

export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    const body = await request.json().catch(() => null);
    const access = await requireStaffAccess({ request, env, body: body || {}, capability: "manage_staff", allowLegacyAdminFallback: false });
    if (!access.ok) return withCors(access.response);
    const changes = normalizeChanges(body?.changes);
    const reason = String(body?.reason || "").trim();
    const operationType = normalizeOperation(body?.operation_type);
    const dryRun = body?.dry_run !== false;
    if (!changes.length) return withCors(json({ error: "Select at least one inventory row and one change." }, 400));
    if (changes.length > 500) return withCors(json({ error: "A maximum of 500 rows can be changed in one batch." }, 400));
    if (reason.length < 8) return withCors(json({ error: "Enter a reason with at least 8 characters." }, 400));

    const publishRows = changes.filter((row) => row.changes?.is_public === true);
    if (publishRows.length) {
      const readiness = await validatePublishChanges(env, publishRows);
      if (!readiness.ok) return withCors(json({ error: "One or more selected rows are not ready for public publishing.", blocked_items: readiness.blocked }, 409));
    }

    const payload = {
      p_changes: changes,
      p_actor_email: String(access.actor?.email || body?.actor_email || "").trim() || null,
      p_reason: reason,
      p_operation_type: operationType,
      p_dry_run: dryRun
    };
    const result = await callRpc(env, "admin_catalog_inventory_bulk_update", payload);
    if (!result.ok) {
      if (result.migrationRequired) return withCors(json({
        error: "Build 238 inventory transaction migration is required before bulk changes can run.",
        migration_required: true,
        migration: "sql/2026-07-30_build238_inventory_transactions_merge_seo_preflight.sql",
        detail: result.error
      }, 409));
      return withCors(json({ error: result.error || "Could not process the inventory batch." }, 500));
    }
    return withCors(json({ ok: true, ...result.data }));
  } catch (err) {
    return withCors(json({ error: safeError(err) }, 500));
  }
}

function normalizeChanges(value) {
  if (!Array.isArray(value)) return [];
  return value.map((row) => {
    const itemKey = String(row?.item_key || "").trim();
    const input = row?.changes && typeof row.changes === "object" && !Array.isArray(row.changes) ? row.changes : {};
    const changes = {};
    const allowed = ["name","item_type","category","subcategory","description","qty_on_hand","reorder_point","reorder_qty","unit_label","cost_cents","preferred_vendor","reuse_policy","image_url","gallery_image_urls","is_public","is_active","notes"];
    for (const key of allowed) if (Object.prototype.hasOwnProperty.call(input, key)) changes[key] = normalizeField(key, input[key]);
    if (Object.prototype.hasOwnProperty.call(input, "cost_cad")) {
      const valueCad = input.cost_cad === "" || input.cost_cad == null ? null : Number(input.cost_cad);
      changes.cost_cents = valueCad == null || !Number.isFinite(valueCad) ? null : Math.round(valueCad * 100);
    }
    return { item_key: itemKey, changes };
  }).filter((row) => row.item_key && Object.keys(row.changes).length);
}

function normalizeField(key, value) {
  if (["is_public","is_active"].includes(key)) return value === true || String(value).toLowerCase() === "true";
  if (["qty_on_hand","reorder_point","reorder_qty"].includes(key)) return Number(value || 0);
  if (key === "cost_cents") return value == null || value === "" ? null : Math.round(Number(value));
  if (key === "gallery_image_urls") {
    const list = Array.isArray(value) ? value : String(value || "").split(/[\n,]/);
    return [...new Set(list.map((v) => String(v || "").trim()).filter(Boolean))].slice(0, 7);
  }
  return value == null ? null : String(value).trim();
}
function normalizeOperation(value) { return ["archive","restore"].includes(String(value || "")) ? String(value) : "bulk_update"; }

async function validatePublishChanges(env, rows) {
  const keys = rows.map((row) => row.item_key);
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) return { ok: false, blocked: keys.map((item_key) => ({ item_key, blockers: ["Supabase service configuration is unavailable."] })) };
  const encoded = keys.map((key) => `"${String(key).replaceAll('"','\"')}"`).join(',');
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/catalog_inventory_items?select=*&item_key=in.(${encodeURIComponent(encoded)})`, { headers: serviceHeaders(env) });
  if (!res.ok) return { ok: false, blocked: keys.map((item_key) => ({ item_key, blockers: ["Could not load the current inventory row for publishing review."] })) };
  const current = await res.json().catch(() => []);
  const byKey = new Map((Array.isArray(current) ? current : []).map((item) => [String(item.item_key), item]));
  const blocked = [];
  for (const row of rows) {
    const merged = { ...(byKey.get(row.item_key) || {}), ...(row.changes || {}) };
    const readiness = evaluateCatalogReadiness(merged);
    if (!readiness.ready) blocked.push({ item_key: row.item_key, ...readiness });
  }
  return { ok: blocked.length === 0, blocked };
}

async function callRpc(env, name, payload) {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) return { ok: false, error: "Supabase service configuration is unavailable." };
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/rpc/${name}`, {
    method: "POST",
    headers: serviceHeaders(env),
    body: JSON.stringify(payload)
  });
  const text = await res.text();
  if (!res.ok) return { ok: false, error: text.slice(0, 1000), migrationRequired: /PGRST202|Could not find the function|schema cache|does not exist/i.test(text) };
  const data = text ? JSON.parse(text) : {};
  return { ok: true, data: data && typeof data === "object" ? data : {} };
}
function serviceHeaders(env) { return { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`, "Content-Type": "application/json", Accept: "application/json" }; }
function safeError(err) { return String(err?.message || err || "Unexpected error").slice(0, 800); }
function corsHeaders() { return { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST,OPTIONS", "Access-Control-Allow-Headers": "Content-Type, x-admin-password, x-staff-email, x-staff-user-id", "Cache-Control": "no-store" }; }
function withCors(response) { const headers = new Headers(response.headers || {}); for (const [key, value] of Object.entries(corsHeaders())) headers.set(key, value); return new Response(response.body, { status: response.status, statusText: response.statusText, headers }); }
