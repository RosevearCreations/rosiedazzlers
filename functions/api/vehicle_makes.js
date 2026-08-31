import { fetchVehicleMakes, fallbackVehicleMakes, allowedYears } from './_lib/vehicle-catalog.js';

export async function onRequestGet() {
  try {
    const makes = await fetchVehicleMakes();
    return json({ ok: true, years: allowedYears(), makes });
  } catch {
    // Vehicle suggestions are optional enrichment. Never block booking because
    // an external catalogue or unexpected lookup path is unavailable.
    return json({
      ok: true,
      years: allowedYears(),
      makes: fallbackVehicleMakes(),
      degraded: true,
      warning: 'Vehicle suggestions are temporarily limited. You can still type your vehicle make manually.'
    });
  }
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'Access-Control-Allow-Origin': '*' } });
}
