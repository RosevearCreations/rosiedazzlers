import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { applyCommercialAccuracy } from "../functions/api/_lib/commercial-accuracy.js";
import { buildUnifiedBookingContract623 } from "../functions/api/_lib/booking-unified-contract-623.js";
const read = path => JSON.parse(readFileSync(new URL(path,import.meta.url), "utf8"));
const expected = {small:229,mid:269,oversize:309};
const bundled = read("../data/rosie_services_pricing_and_packages.json");
const functionsFallback = read("../functions/api/data/rosie_services_pricing_and_packages.json");
assert.deepEqual(bundled,functionsFallback,"server and public fallback catalogs must match");
const basic = bundled.packages.find(p=>p.code==="basic_detail");
assert.deepEqual(basic.prices_cad,expected,"approved size-specific Basic Detail prices");
assert.equal(basic.deposit_cad,50,"Basic Detail deposit policy must remain unchanged");
const projected = applyCommercialAccuracy(bundled);
assert.deepEqual(projected.package_map.basic_detail.prices_cad,expected);
const catalogWithOwnerEdit={...bundled, packages:bundled.packages.map(p=>p.code==="basic_detail"
 ? {...p,prices_cad:{small:239,mid:279,oversize:319}}:p)};
assert.deepEqual(applyCommercialAccuracy(catalogWithOwnerEdit).package_map.basic_detail.prices_cad,
 {small:239,mid:279,oversize:319},"future catalog edits must not be overridden by published projection");
const area=bundled.service_areas.find(a=>a.value||a.label);
assert.ok(area,"a configured service area is required for contract test");
for(const [size,dollars] of Object.entries(expected)){
 const selection={package_code:"basic_detail",vehicle_size:size,service_area:area.value||area.label,
  service_date:"2026-11-08",start_slot:"AM",duration_slots:1};
 const contract=buildUnifiedBookingContract623({selection,checkoutCatalog:bundled,
   publicCatalog:projected,authorityVerified:true,availability:{ok:true}});
 assert.equal(contract.pricing.parity_status,"matched",size);
 assert.equal(contract.pricing.displayed_total_cents,dollars*100,size);
 assert.equal(contract.pricing.checkout_total_cents,dollars*100,size);
 assert.equal(contract.can_commit_booking,false,"preview must never create bookings");
 assert.equal(contract.pricing.checkout_deposit_cents,5000,"existing deposit preserved");
}
const checkout=readFileSync(new URL("../functions/api/checkout.js",import.meta.url),"utf8");
const quote=readFileSync(new URL("../functions/api/_lib/quote-booking-authority.js",import.meta.url),"utf8");
const publicApi=readFileSync(new URL("../functions/api/pricing_catalog_public.js",import.meta.url),"utf8");
assert.match(checkout,/loadPricingCatalog\(env\)/);
assert.match(quote,/loadPricingCatalog\(env\)/);
assert.match(publicApi,/applyCommercialAccuracy\(await loadPricingCatalog\(env\)\)/);
console.log("Build 624 owner-approved Basic Detail price parity: PASS");
