import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {
  BOOKING_DRAFT_SCHEMA_630,BOOKING_DRAFT_FIELDS_630,BOOKING_DRAFT_MAX_AGE_630,
  sanitizedBookingChoices630,parseBookingChoices630,reconcileBookingChoices630
} from "../assets/booking-draft-policy-v630.js";
const read=p=>readFileSync(new URL(p,import.meta.url),"utf8");
const now=Date.parse("2026-10-24T16:00:00Z");
const input={
 saved_at:now,fields:{
 vehicle_size:"mid",service_area:"Tillsonburg, ON",
 service_date:"2026-11-05",veh_year:"2018",veh_make:"Mazda",
 veh_model:"5",veh_plate:"CONFIDENTIAL123",customer_name:"Private Name",
 customer_email:"private@example.com",customer_phone:"5551234567",
 address_line1:"88 Private Street",special_notes:"personal notes",
 gift_code:"TESTGIFT123",promo_code:"PRIVATEPROMO",photo_estimate_links:"https://photos.invalid"
 },
 package_code:"basic_detail",addon_codes:["wax","wax","ozone","invalid space"],
 slot:"PM",checks:{ack_driveway:true,ack_bylaw:true},
 media_consent_preference:"publish",price_total_cents:26900,deposit_cents:5000,
 booking_id:"booking-secret",card_number:"4111111111111111"
};
const safe=sanitizedBookingChoices630(input,now);
assert.equal(safe.schema,BOOKING_DRAFT_SCHEMA_630);
assert.deepEqual(BOOKING_DRAFT_FIELDS_630,["service_area","vehicle_size"]);
assert.deepEqual(Object.keys(safe.fields).sort(),["service_area","vehicle_size"]);
assert.equal(safe.fields.vehicle_size,"mid");
assert.equal(safe.fields.service_area,"Tillsonburg, ON");
assert.deepEqual(safe.addon_codes,["wax","ozone"]);
const serialized=JSON.stringify(safe);
for(const secret of ["Private Name","private@example.com","CONFIDENTIAL123","Private Street",
  "TESTGIFT123","PRIVATEPROMO","personal notes","booking-secret","4111111111111111",
  "2026-11-05","2018","Mazda","publish","price_total_cents","deposit_cents","slot"]){
 assert.ok(!serialized.includes(secret),"Must never persist "+secret);
}
const parsed=parseBookingChoices630(serialized,now+1000);
assert.equal(parsed.package_code,"basic_detail");
assert.equal(parseBookingChoices630(serialized,now+BOOKING_DRAFT_MAX_AGE_630+1),null);
assert.equal(parseBookingChoices630('{"version":380,"saved_at":1,"fields":{"customer_email":"private"}}',now),null);
assert.equal(parseBookingChoices630("bad-json",now),null);
assert.equal(parseBookingChoices630(JSON.stringify({...safe,saved_at:now+2*60000}),now),null);
const catalog={
 packages:[{code:"basic_detail"},{code:"complete_detail"}],
 addons:[
   {code:"wax",quote_required:false},
   {code:"ozone",quote_required:true},
   {code:"coating",requires_package_codes_any:["complete_detail"],quote_required:false}
 ],
 service_areas:[{value:"Tillsonburg, ON"},{value:"Woodstock, ON"}]
};
const reconciled=reconcileBookingChoices630(safe,catalog);
assert.equal(reconciled.fields.service_area,"Tillsonburg, ON");
assert.equal(reconciled.fields.vehicle_size,"mid");
assert.equal(reconciled.package_code,"basic_detail");
assert.deepEqual(reconciled.addon_codes,["wax"],"quote-required items require fresh review");
assert.equal(reconciled.requires_price_recheck,true);
assert.equal(reconciled.requires_availability_recheck,true);
assert.equal(reconciled.restore_step,1);
assert.equal(reconciled.holds_slot,false);
assert.equal(reconciled.slot,"");
assert.equal(reconciled.service_date,"");
assert.equal(reconcileBookingChoices630(safe,{packages:[],addons:[],service_areas:[]}).package_code,"");
const storageModule=read("../assets/booking-recovery.js");
const policyHook=read("../assets/site-policies.js");
const planner=read("../booking-planner.html");
assert.match(storageModule,/const DRAFT_KEY = "rd_booking_draft_v630"/);
assert.match(storageModule,/LEGACY_DRAFT_KEY = "rd_booking_draft_v380"/);
assert.match(storageModule,/safeSessionRemove\(LEGACY_DRAFT_KEY\)/);
assert.match(storageModule,/Continue your package choices\?/);
assert.match(storageModule,/data-recovery-continue/);
assert.match(storageModule,/resume\?\.addEventListener\("click"/);
assert.match(storageModule,/const draft=readDraft\(\)/);
assert.match(storageModule,/parseBookingChoices630/);
assert.match(storageModule,/if \(!restoring\) safeSessionSet/);
assert.doesNotMatch(storageModule,/localStorage/);
assert.doesNotMatch(storageModule,/id === "service_date"/);
assert.doesNotMatch(storageModule,/slot: selectedCode/);
assert.doesNotMatch(storageModule,/draft\.slot/);
assert.match(storageModule,/Do not restore a date or slot|do not restore a date or slot/i);
assert.match(policyHook,/wireBookingRecovery/);
assert.match(planner,/function refreshAvailability\(\)/);
assert.match(planner,/function validateStep\(step\)/);
assert.match(planner,/fetch\("\/api\/checkout"/);
console.log("Build 630 anonymous session draft, opt-in restore, stale availability and payment boundary: PASS");
