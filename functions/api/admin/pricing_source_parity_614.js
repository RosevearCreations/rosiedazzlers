// Owner-facing, staff-protected GET-only price source review.
import { requireStaffAccess, serviceHeaders, json, methodNotAllowed } from "../_lib/staff-auth.js";
import { buildPricingSourceParity614 } from "../_lib/pricing-source-parity-614.js";
import { normalizeCatalog, mergeCatalog } from "../_lib/pricing-catalog.js";
import bundled from "../data/rosie_services_pricing_and_packages.json";

export async function onRequestGet({ request, env }) {
  const access = await requireStaffAccess({ request, env, capability: "manage_staff", allowLegacyAdminFallback: true });
  if (!access.ok) return noStore(access.response);
  if (!env?.SUPABASE_URL || !env?.SUPABASE_SERVICE_ROLE_KEY) {
    return noStore(json(buildPricingSourceParity614({ bundled, checkoutCatalog: normalizeCatalog(bundled), warning: "Supabase pricing credentials unavailable; database row not verified." })));
  }
  try {
    const response = await fetch(`${env.SUPABASE_URL}/rest/v1/app_management_settings?select=key,value,updated_at&key=eq.pricing_catalog&limit=1`, {
      method: "GET", headers: serviceHeaders(env)
    });
    if (!response.ok) throw new Error(`App Management pricing read failed (HTTP ${response.status}).`);
    const rows = await response.json();
    const row = Array.isArray(rows) ? rows[0] : null;
    if (!row?.value || typeof row.value !== "object") throw new Error("No valid pricing_catalog row was found.");
    return noStore(json(buildPricingSourceParity614({ bundled, appManagement: row.value, checkoutCatalog: mergeCatalog(row.value, bundled), dbAvailable: true, updatedAt: row.updated_at })));
  } catch (error) {
    return noStore(json(buildPricingSourceParity614({ bundled, checkoutCatalog: normalizeCatalog(bundled), warning: error?.message || "Cannot verify App Management pricing." })));
  }
}

export function onRequestPost() { return noStore(methodNotAllowed()); }
export function onRequestPut() { return noStore(methodNotAllowed()); }
export function onRequestPatch() { return noStore(methodNotAllowed()); }
export function onRequestDelete() { return noStore(methodNotAllowed()); }

function noStore(response) {
  const headers = new Headers(response.headers);
  headers.set("Cache-Control", "no-store");
  return new Response(response.body, { status: response.status, headers });
}
