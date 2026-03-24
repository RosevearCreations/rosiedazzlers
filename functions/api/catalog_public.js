import { json } from "./_lib/http.js";

export async function onRequestOptions() {
  return new Response("", { status: 204, headers: corsHeaders() });
}

export async function onRequestGet(context) {
  const { request, env } = context;
  try {
    if (!env?.SUPABASE_URL || !env?.SUPABASE_SERVICE_ROLE_KEY) {
      return withCors(json({ ok: true, items: [] }));
    }

    const urlObj = new URL(request.url);
    const catalogType = String(urlObj.searchParams.get('catalog_type') || '').trim().toLowerCase();
    let url = `${env.SUPABASE_URL}/rest/v1/catalog_items?select=id,catalog_type,title,category,image_url,supplier_url,sort_order,quantity_on_hand,reorder_level,notes,is_active,brand,model,location_label,acquired_on,condition_rating,usefulness_rating,overall_rating&is_active=eq.true&order=sort_order.asc,updated_at.desc&limit=500`;
    if (catalogType) url = `${env.SUPABASE_URL}/rest/v1/catalog_items?select=id,catalog_type,title,category,image_url,supplier_url,sort_order,quantity_on_hand,reorder_level,notes,is_active,brand,model,location_label,acquired_on,condition_rating,usefulness_rating,overall_rating&is_active=eq.true&catalog_type=eq.${encodeURIComponent(catalogType)}&order=sort_order.asc,updated_at.desc&limit=500`;
    const res = await fetch(url, {
      headers: {
        apikey: env.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    if (!res.ok) return withCors(json({ ok: false, items: [], error: await res.text() }, 500));
    const rows = await res.json().catch(() => []);
    return withCors(json({ ok: true, items: Array.isArray(rows) ? rows : [] }));
  } catch (err) {
    return withCors(json({ ok: false, items: [], error: err?.message || 'Unexpected server error.' }, 500));
  }
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Cache-Control': 'no-store'
  };
}
function withCors(response) {
  const h = new Headers(response.headers || {});
  for (const [k,v] of Object.entries(corsHeaders())) h.set(k,v);
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers: h });
}
