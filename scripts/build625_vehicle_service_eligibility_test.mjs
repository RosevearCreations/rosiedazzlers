import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {
  evaluateVehicleServiceEligibility625,
  normalizeVehicleProfile625,attachVehicleEligibility625
} from "../functions/api/_lib/booking-vehicle-eligibility-625.js";
import {buildUnifiedBookingContract623} from "../functions/api/_lib/booking-unified-contract-623.js";

const catalog={
  packages:[
    {code:"basic_detail",name:"Basic Detail",prices_cad:{small:229,mid:269,oversize:309},deposit_cad:50},
    {code:"rv_only",name:"RV Special",prices_cad:{small:null,mid:null,oversize:450},allowed_vehicle_types:["rv"]}
  ],addons:[],service_areas:[{value:"Tillsonburg",label:"Tillsonburg",county:"Oxford"}]
};
const selection={package_code:"basic_detail",vehicle_size:"mid",addon_codes:[],service_area:"Tillsonburg",
  service_date:"2026-11-13",start_slot:"AM",duration_slots:1};
const profile={vehicle_year:"2020",vehicle_make:"Toyota",vehicle_model:"RAV4",
  vehicle_type:"suv",vehicle_size_confirmed:"mid",condition_flags:[]};
const evalProfile=(input=profile,s=selection,c=catalog)=>
  evaluateVehicleServiceEligibility625({input,selection:s,catalog:c});
const p=evalProfile();
assert.equal(p.status,"review_ready");
assert.equal(p.can_commit_booking,false);
assert.equal(p.vehicle_size_automatically_inferred,false);
assert.equal(normalizeVehicleProfile625(profile).year,2020);
assert.equal(evalProfile({}).status,"not_provided");
assert.equal(evalProfile({...profile,vehicle_size_confirmed:"small"}).status,"hold");
assert.ok(evalProfile({...profile,vehicle_size_confirmed:"small"}).issues.some(i=>i.code==="VEHICLE_SIZE_MISMATCH"));
assert.ok(evalProfile({...profile,vehicle_year:"1888"}).issues.some(i=>i.code==="VEHICLE_YEAR_INVALID"));
assert.ok(evalProfile({...profile,vehicle_make:""}).issues.some(i=>i.code==="VEHICLE_MAKE_REQUIRED"));
assert.ok(evalProfile({...profile,condition_flags:["pet_hair","staining"]}).review_reasons.length>=2);
assert.equal(evalProfile({...profile,condition_flags:["pet_hair"]}).status,"quote_review_required");
assert.equal(evalProfile({...profile,condition_flags:["biohazard"]}).status,"quote_review_required");
assert.equal(evalProfile({...profile,vehicle_type:"rv"}).status,"quote_review_required");
assert.equal(evalProfile({...profile,vehicle_type:"van"}).status,"quote_review_required");
assert.equal(evalProfile({...profile,condition_flags:["not_a_condition"]}).status,"hold");
assert.equal(evalProfile({...profile,condition_flags:["odor","odor"]}).status,"hold");
assert.ok(evalProfile({...profile,vehicle_type:"suv"},{...selection,package_code:"rv_only",vehicle_size:"oversize"},
  catalog).issues.some(i=>i.code==="PACKAGE_VEHICLE_TYPE_EXCLUDED"));
const parameters=new URLSearchParams({
  vehicle_year:"2021",vehicle_make:"Mazda",vehicle_model:"5",vehicle_type:"van",vehicle_size_confirmed:"mid"
});
parameters.append("condition_flag","road_salt");parameters.append("condition_flag","pet_hair");
assert.deepEqual(normalizeVehicleProfile625(parameters).condition_flags,["road_salt","pet_hair"]);
const booking=buildUnifiedBookingContract623({selection,checkoutCatalog:catalog,
  publicCatalog:catalog,authorityVerified:true,availability:{ok:true}});
assert.equal(booking.decision,"review_ready");
const reviewed=attachVehicleEligibility625(booking,evalProfile({...profile,condition_flags:["odor"]}));
assert.equal(reviewed.decision,"quote_review_required");
assert.equal(reviewed.pricing.displayed_total_cents,26900);
assert.equal(reviewed.can_commit_booking,false);
assert.equal(attachVehicleEligibility625(booking,evalProfile({...profile,vehicle_size_confirmed:"small"})).decision,"hold");
assert.equal(attachVehicleEligibility625(booking,evalProfile({})).decision,"review_ready");
assert.equal(attachVehicleEligibility625({...booking,decision:"hold"},p).decision,"hold");
const endpoint=readFileSync(new URL("../functions/api/booking_contract_623.js",import.meta.url),"utf8");
const page=readFileSync(new URL("../booking-eligibility-preview.html",import.meta.url),"utf8");
const ui=readFileSync(new URL("../assets/booking-eligibility-preview-625.js",import.meta.url),"utf8");
const root=readFileSync(new URL("../book.html",import.meta.url),"utf8");
const mirrored=readFileSync(new URL("../book/index.html",import.meta.url),"utf8");
assert.match(endpoint,/evaluateVehicleServiceEligibility625/);
assert.match(endpoint,/attachVehicleEligibility625/);
assert.match(endpoint,/export function onRequestPost/);
assert.match(page,/booking-eligibility-preview-625\.js/);
assert.match(ui,/booking_contract_623/);
assert.match(page,/role="status"/);
assert.match(page,/vehicle_size_confirmed/);
assert.match(ui,/new FormData/);
assert.match(page,/does not reserve a date, create a booking or charge a deposit/);
assert.equal(root,mirrored,"public booking route copies must be identical");
assert.match(root,/booking-eligibility-preview.html/);
console.log("Build 625 vehicle type, size, conditions, catalog fit and read-only integration: PASS");
