import { fetchVehicleModelsForMakeYear, cacheVehicleModels } from './_lib/vehicle-catalog.js';

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const make = String(url.searchParams.get('make') || '').trim();
  const year = Number(url.searchParams.get('year') || 0);
  if (!make) return json({ error: 'Missing make.' }, 400);
  if (!Number.isInteger(year) || year < 2006 || year > new Date().getFullYear() + 1) return json({ error: 'Missing or invalid year.' }, 400);

  try {
    const models = await fetchVehicleModelsForMakeYear({ make, year });
    await cacheVehicleModels({ env, rows: models, year });
    return json({ ok: true, make, year, models });
  } catch {
    // Manual model entry remains valid even when the optional catalogue lookup
    // cannot provide suggestions.
    return json({
      ok: true,
      make,
      year,
      models: [],
      degraded: true,
      warning: 'Vehicle model suggestions are temporarily unavailable. You can still type the model manually.'
    });
  }
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'Access-Control-Allow-Origin': '*' } });
}
