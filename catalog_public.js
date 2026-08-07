export async function onRequestGet({ request, env }) {
  try {
    if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) return json({ ok: true, items: [], source: "unconfigured" });
    const kind = (new URL(request.url).searchParams.get("kind") || "").trim().toLowerCase();
    const base = "id,item_key,item_type,name,category,subcategory,description,image_url,gallery_image_urls,amazon_url,qty_on_hand,reorder_point,unit_label,rating_value,rating_count,preferred_vendor,reuse_policy,sort_key,notes,purchase_date,estimated_jobs_per_unit";
    const fallback = base.replace(",gallery_image_urls", "");
    let result = await loadCatalog(env, kind, base);
    if (!result.ok && /gallery_image_urls|schema cache|PGRST204/i.test(result.error || "")) result = await loadCatalog(env, kind, fallback);
    if (!result.ok) return json({ ok: false, items: [], error: result.error }, 500);
    return json({ ok: true, source: "database", items: result.items });
  } catch (err) {
    return json({ ok: false, items: [], error: String(err) }, 500);
  }
}

async function loadCatalog(env, kind, select) {
  let path = `${env.SUPABASE_URL}/rest/v1/catalog_inventory_items?select=${select}&is_public=eq.true&is_active=eq.true&order=name.asc`;
  if (kind && ["tool", "consumable"].includes(kind)) path += `&item_type=eq.${encodeURIComponent(kind)}`;
  const res = await fetch(path, { headers: { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`, Accept: "application/json" } });
  if (!res.ok) return { ok: false, error: await res.text() };
  const rows = await res.json().catch(() => []);
  return { ok: true, items: Array.isArray(rows) ? rows : [] };
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });
}
