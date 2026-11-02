// Build 741: public, read-only gift catalog. Supabase remains the price/SKU
// authority; this endpoint never exposes recipient or payment information.
export async function onRequestGet({ env }) {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    return respond({ error: 'Gift options are temporarily unavailable.' }, 503);
  }
  try {
    const url = `${env.SUPABASE_URL}/rest/v1/gift_products?select=sku,type,name,package_code,vehicle_size,face_value_cents,sale_price_cents,currency,is_active&is_active=eq.true&order=sku.asc`;
    const result = await fetch(url, {
      headers: {
        apikey: env.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
        Accept: 'application/json'
      },
      cache: 'no-store'
    });
    if (!result.ok) return respond({ error: 'Gift options are temporarily unavailable.' }, 503);
    const rows = await result.json();
    if (!Array.isArray(rows)) return respond({ error: 'Gift options are temporarily unavailable.' }, 503);
    const products = rows.filter(p => {
      const cents = Number(p.sale_price_cents);
      return p.is_active === true && p.currency === 'CAD' && Number.isSafeInteger(cents) && cents > 0 &&
        (p.type === 'value' && /^GIFT-\d+$/.test(p.sku) ||
         p.type === 'service' && p.sku === `SVC-${p.package_code}-${p.vehicle_size}` &&
           ['small', 'mid', 'oversize'].includes(p.vehicle_size));
    }).map(p => ({
      sku: p.sku,
      type: p.type,
      name: String(p.name || '').slice(0, 130),
      package_code: p.type === 'service' ? p.package_code : null,
      vehicle_size: p.type === 'service' ? p.vehicle_size : null,
      sale_price_cents: Number(p.sale_price_cents),
      face_value_cents: Number(p.face_value_cents),
      currency: 'CAD'
    }));
    if (!products.length) return respond({ error: 'No gift options are available for checkout.' }, 503);
    return respond({ ok: true, version: 'gift_catalog_v741', products });
  } catch {
    return respond({ error: 'Gift options are temporarily unavailable.' }, 503);
  }
}

function respond(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff'
  }});
}
