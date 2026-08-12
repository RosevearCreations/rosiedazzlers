export function serviceHeaders(env) {
  return {
    apikey: env.SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
    "Content-Type": "application/json",
    Accept: "application/json"
  };
}

export async function callInventoryPostingRpc(env, payload) {
  return callRpc(env, "admin_catalog_inventory_post", payload);
}

export async function callInventoryReversalRpc(env, payload) {
  return callRpc(env, "admin_catalog_inventory_post_reverse", payload);
}

export async function markInventoryPostingAccounting(env, batchId, status, note = null) {
  if (!batchId || !env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) return { ok: false };
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/catalog_inventory_posting_batches?id=eq.${encodeURIComponent(batchId)}`, {
    method: "PATCH",
    headers: { ...serviceHeaders(env), Prefer: "return=minimal" },
    body: JSON.stringify({ accounting_status: status, accounting_note: safeText(note, 1800), updated_at: new Date().toISOString() })
  });
  return { ok: res.ok, error: res.ok ? null : (await res.text()).slice(0, 800) };
}

async function callRpc(env, name, payload) {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    return { ok: false, error: "Supabase service configuration is unavailable.", migrationRequired: false };
  }
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/rpc/${name}`, {
    method: "POST",
    headers: serviceHeaders(env),
    body: JSON.stringify(payload)
  });
  const text = await res.text();
  if (!res.ok) {
    return {
      ok: false,
      error: safeRpcError(text),
      migrationRequired: /PGRST202|Could not find the function|schema cache|does not exist|catalog_inventory_posting/i.test(text)
    };
  }
  let data = {};
  try { data = text ? JSON.parse(text) : {}; } catch { data = {}; }
  return { ok: true, data: data && typeof data === "object" ? data : {} };
}

export function normalizePostingLines(value) {
  if (!Array.isArray(value)) return [];
  return value.map((row) => ({
    item_key: safeText(row?.item_key, 180),
    quantity: roundQuantity(row?.quantity ?? row?.qty_used),
    reservation_id: safeText(row?.reservation_id, 80) || null
  })).filter((row) => row.item_key && row.quantity > 0);
}

export function safeRpcError(value) {
  const raw = String(value || "Inventory posting failed.").slice(0, 1800);
  try {
    const parsed = JSON.parse(raw);
    return safeText(parsed?.message || parsed?.details || parsed?.hint || raw, 900) || "Inventory posting failed.";
  } catch {
    return raw.replace(/\s+/g, " ").trim().slice(0, 900) || "Inventory posting failed.";
  }
}

export function safeText(value, max = 1200) {
  return String(value == null ? "" : value).trim().slice(0, max);
}

export function roundQuantity(value) {
  const number = Number(value || 0);
  return Number.isFinite(number) ? Math.round(number * 1000) / 1000 : 0;
}
