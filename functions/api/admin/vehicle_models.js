import { fetchVehicleModelsForMakeYear, cacheVehicleModels } from './_lib/vehicle-catalog.js';

export async function onRequestGet({ request, env }) {
  try {
    const url = new URL(request.url);
    const make = String(url.searchParams.get('make') || '').trim();
    const year = Number(url.searchParams.get('year') || 0);
    if (!make) return json({ error: 'Missing make.' }, 400);
    if (!Number.isFinite(year)) return json({ error: 'Missing year.' }, 400);

    const models = await fetchVehicleModelsForMakeYear({ make, year });
    await cacheVehicleModels({ env, rows: models, year });
    return json({ ok: true, make, year, models });
  } catch (err) {
    return json({ error: err?.message || 'Could not load vehicle models.' }, 500);
  }
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'Access-Control-Allow-Origin': '*' } });
}
