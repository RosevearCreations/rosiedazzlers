import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {buildUnifiedBookingContract623,normalizeBookingSelection623,validateBookingSelection623}
  from "../functions/api/_lib/booking-unified-contract-623.js";

const base = {
  packages:[{code:"premium_wash",name:"Premium Wash",prices_cad:{small:85,mid:105,oversize:125},deposit_cad:50},
    {code:"basic_detail",name:"Basic Detail",prices_cad:{small:115,mid:135,oversize:170},deposit_cad:50}],
  addons:[{code:"wax",name:"Wax",prices_cad:{small:25,mid:30,oversize:35},quote_required:false},
    {code:"ozone",name:"Ozone",quote_required:true,prices_cad:{small:50,mid:50,oversize:50}},
    {code:"coating",name:"Coating",requires_package_codes_any:["complete_detail"],prices_cad:{small:100}}],
  service_areas:[{value:"Tillsonburg, ON",label:"Tillsonburg, ON",county:"Oxford County",travel_tier:"urban"}]
};
const selection = {package_code:"premium_wash",vehicle_size:"small",addon_codes:["wax"],
  service_area:"Tillsonburg, ON",service_date:"2026-11-08",start_slot:"AM",duration_slots:1};
const evaluate = (selectionOverride={},other={}) => buildUnifiedBookingContract623({
  selection:{...selection,...selectionOverride},
  checkoutCatalog:base,publicCatalog:base,availability:{ok:true},authorityVerified:true,...other
});
const ready=evaluate();
assert.equal(ready.schema,"rosie-booking-contract.v1");
assert.equal(ready.decision,"review_ready");
assert.equal(ready.pricing.parity_status,"matched");
assert.equal(ready.pricing.displayed_total_cents,11000);
assert.equal(ready.pricing.checkout_deposit_cents,5000);
assert.equal(ready.can_commit_booking,false);
assert.equal(ready.payment_taken,false);
assert.equal(ready.reservation_created,false);
assert.equal(ready.eligibility.staff_review_required,true);
assert.equal(ready.availability.status,"tentatively_available");

const mismatch=evaluate({package_code:"basic_detail",addon_codes:[]},{
  publicCatalog:{...base,packages:base.packages.map(p=>p.code==="basic_detail"?
    {...p,prices_cad:{small:229,mid:269,oversize:309}}:p)}});
assert.equal(mismatch.pricing.displayed_total_cents,22900);
assert.equal(mismatch.pricing.checkout_total_cents,11500);
assert.equal(mismatch.pricing.parity_status,"owner_hold");
assert.equal(mismatch.decision,"hold");
assert.ok(mismatch.issues.some(i=>i.code==="OWNER_PRICING_PARITY_HOLD"));

const manual=evaluate({addon_codes:["ozone"]});
assert.equal(manual.decision,"quote_review_required");
assert.equal(manual.pricing.amount_is_final,false);
assert.equal(manual.can_commit_booking,false);

assert.ok(evaluate({addon_codes:["coating"]}).issues.some(i=>i.code==="ADDON_INCOMPATIBLE"));
assert.ok(evaluate({addon_codes:["ghost"]}).issues.some(i=>i.code==="ADDON_UNAVAILABLE"));
assert.ok(evaluate({service_area:"Unknown city"}).issues.some(i=>i.code==="AREA_NOT_VERIFIED"));
assert.equal(evaluate({service_date:"",start_slot:"",duration_slots:null}).decision,"incomplete");
assert.equal(evaluate({}, {availability:{ok:false,code:"BOOKING_SLOT_UNAVAILABLE"}}).decision,"hold");
assert.equal(evaluate({}, {authorityVerified:false}).decision,"hold");
assert.ok(validateBookingSelection623(normalizeBookingSelection623({...selection,addon_codes:["wax","wax"]})).length);
assert.ok(validateBookingSelection623(normalizeBookingSelection623({...selection,service_date:"2026-02-31"})).length);
assert.ok(validateBookingSelection623(normalizeBookingSelection623({...selection,start_slot:"PM",duration_slots:2})).length);
const file=readFileSync(new URL("../functions/api/booking_contract_623.js",import.meta.url),"utf8");
assert.match(file,/checkCurrentBookingAvailability/);
assert.match(file,/applyCommercialAccuracy/);
assert.match(file,/onRequestPost/);
assert.doesNotMatch(file,/(stripe\.checkout\.sessions\.create|CREATE\s+TABLE|INSERT\s+INTO)/i);
console.log("Build 623 pricing, quote, eligibility, availability and read-only boundary tests passed.");
