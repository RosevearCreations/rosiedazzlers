// Build 623 — read-only public contract preview. Never creates holds, payments or bookings.
import bundled from "./data/rosie_services_pricing_and_packages.json";
import { mergeCatalog, normalizeCatalog } from "./_lib/pricing-catalog.js";
import { applyCommercialAccuracy } from "./_lib/commercial-accuracy.js";
import { serviceHeaders } from "./_lib/staff-session.js";
import { checkCurrentBookingAvailability } from "./_lib/quote-booking-authority.js";
import { evaluateVehicleServiceEligibility625, attachVehicleEligibility625 } from "./_lib/booking-vehicle-eligibility-625.js";
import { normalizeBookingSelection623, validateBookingSelection623, buildUnifiedBookingContract623 }
  from "./_lib/booking-unified-contract-623.js";

const respond = (value, status = 200) => new Response(JSON.stringify(value), {
  status, headers: { "Content-Type":"application/json; charset=utf-8",
    "Cache-Control":"no-store", "X-Content-Type-Options":"nosniff" }
});
export async function onRequestGet({request, env}) {
  const url = new URL(request.url);
  const input = normalizeBookingSelection623(url.searchParams);
  // A malformed selection must not trigger an availability query.
  if (validateBookingSelection623(input).length) return respond({
    ...attachVehicleEligibility625(
      buildUnifiedBookingContract623({
        selection:input, checkoutCatalog:normalizeCatalog(bundled),
        publicCatalog:applyCommercialAccuracy(normalizeCatalog(bundled))
      }),
      evaluateVehicleServiceEligibility625({input:url.searchParams,selection:input,catalog:normalizeCatalog(bundled)})
    ), read_only:true
  }, 400);
  let catalog = normalizeCatalog(bundled);
  let authorityVerified = false;
  if (env?.SUPABASE_URL && env?.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const result = await fetch(`${env.SUPABASE_URL}/rest/v1/app_management_settings?select=value&key=eq.pricing_catalog&limit=1`,
        {method:"GET",headers:serviceHeaders(env)});
      if (result.ok) {
        const rows = await result.json();
        if (Array.isArray(rows) && rows[0]?.value && typeof rows[0].value === "object") {
          catalog = mergeCatalog(rows[0].value,bundled);
          authorityVerified = true;
        }
      }
    } catch {}
  }
  let availability = null;
  if (authorityVerified && input.service_date && input.start_slot && input.duration_slots) {
    try {
      availability = await checkCurrentBookingAvailability(env,{
        service_date:input.service_date, start_slot:input.start_slot,
        duration_slots:input.duration_slots, hold_minutes:catalog.booking_rules?.hold_minutes
      });
    } catch {availability = {ok:false,code:"AVAILABILITY_CHECK_FAILED"};}
  }
  const result = buildUnifiedBookingContract623({
    selection:input,checkoutCatalog:catalog,publicCatalog:applyCommercialAccuracy(catalog),
    availability,authorityVerified
  });
  const vehicle = evaluateVehicleServiceEligibility625({
    input:url.searchParams,selection:input,catalog
  });
  return respond({...attachVehicleEligibility625(result,vehicle),
    read_only:true,generated_at:new Date().toISOString()});
}
export function onRequestPost(){return respond({ok:false,error:"Read-only contract: bookings and payments use separate endpoints."},405);}
export function onRequestPut(){return onRequestPost();}
export function onRequestPatch(){return onRequestPost();}
export function onRequestDelete(){return onRequestPost();}
