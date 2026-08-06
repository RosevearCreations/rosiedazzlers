import { fetchVehicleMakes, allowedYears } from './_lib/vehicle-catalog.js';

export async function onRequestGet() {
  try {
    const makes = await fetchVehicleMakes();
    return json({ ok: true, years: allowedYears(), makes });
  } catch (err) {
    return json({ error: err?.message || 'Could not load vehicle makes.' }, 500);
  }
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'Access-Control-Allow-Origin': '*' } });
}
