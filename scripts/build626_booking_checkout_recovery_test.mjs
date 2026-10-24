import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {
  classifyBookingState626,normalizedRecoverySlots626,priceSnapshot626,evaluateBookingRecovery626
} from "../functions/api/_lib/booking-recovery-contract-626.js";
import {evaluateSlotAvailability,compareAcceptedTermsToCurrentPrice} from "../functions/api/_lib/quote-booking-terms.js";

const NOW=Date.parse("2026-10-24T14:00:00.000Z");
const catalog={
 packages:[{code:"basic_detail",prices_cad:{small:229,mid:269,oversize:309},deposit_cad:50}],
 addons:[
  {code:"wax",prices_cad:{small:20,mid:25,oversize:30}},
  {code:"ozone",prices_cad:{small:65,mid:75,oversize:85},quote_required:true},
  {code:"coating",prices_cad:{mid:150},requires_package_codes_any:["complete_detail"]}
 ]
};
const body={service_date:"2026-11-08",start_slot:"AM",duration_slots:1,
 customer_email:"customer@example.com",package_code:"basic_detail",vehicle_size:"mid",
 service_area:"Tillsonburg",address_line1:"123 Test Street",vehicle:{year:2015,make:"Mazda",model:"5"},
 addon_codes:["wax"],payment_provider:"stripe"};
const booking={id:"test-only-booking",status:"pending",created_at:new Date(NOW-5*60000).toISOString(),
 service_date:body.service_date,start_slot:"AM",duration_slots:1,
 customer_email:body.customer_email,package_code:body.package_code,vehicle_size:"mid",
 service_area:body.service_area,address_line1:body.address_line1,
 vehicle_year:2015,vehicle_make:"Mazda",vehicle_model:"5",payment_provider:"stripe",
 addons:[{code:"wax",label:"Wax",cents:2500,quote_required:false}],
 price_total_cents:29400,deposit_cents:5000};
const verify=(b=booking,requestBody=body,prices=catalog,minutes=30)=>
 evaluateBookingRecovery626({booking:b,requestBody,catalog:prices,nowMs:NOW,holdMinutes:minutes});
assert.equal(verify().ok,true,"exact pending session can be considered for provider verification");
assert.equal(verify().code,"EXACT_PENDING_PAYMENT_SESSION_MATCH");
assert.equal(verify().price_total_cents,29400);
assert.equal(verify({...booking,created_at:new Date(NOW-31*60000).toISOString()}).ok,false);
assert.equal(classifyBookingState626({...booking,status:"confirmed"},NOW,30).holds_slot,true);
assert.equal(classifyBookingState626({...booking,status:"cancelled"},NOW,30).holds_slot,false);
assert.equal(classifyBookingState626({...booking,created_at:new Date(NOW-31*60000).toISOString()},NOW,30).status,"expired_hold");
assert.equal(classifyBookingState626({...booking,created_at:"not-a-date"},NOW,30).status,"unverified");
assert.equal(verify(booking,{...body,address_line1:"456 New Avenue"}).code,"BOOKING_TERMS_CHANGED");
assert.equal(verify(booking,{...body,service_area:"Woodstock"}).code,"BOOKING_TERMS_CHANGED");
assert.equal(verify(booking,{...body,vehicle:{year:2015,make:"Mazda",model:"3"}}).code,"BOOKING_TERMS_CHANGED");
assert.equal(verify(booking,{...body,vehicle:{year:2016,make:"Mazda",model:"5"}}).code,"VEHICLE_DETAILS_CHANGED");
assert.equal(verify(booking,{...body,addon_codes:[]}).code,"ADDON_SELECTION_CHANGED");
assert.equal(verify(booking,{...body,payment_provider:"paypal"}).code,"PAYMENT_PROVIDER_CHANGED");
assert.equal(verify(booking,{...body,promo_code:"HALFOFF"}).code,"DISCOUNT_REQUIRES_REVIEW");
assert.equal(verify({...booking,deposit_cents:7000}).code,"CURRENT_PRICE_CHANGED");
assert.equal(verify({...booking,price_total_cents:11500}).code,"CURRENT_PRICE_CHANGED");
assert.equal(verify(booking,body,{...catalog,packages:[{...catalog.packages[0],prices_cad:{small:229,mid:279,oversize:309}}]}).code,"CURRENT_PRICE_CHANGED");
assert.equal(verify(booking,body,{...catalog,addons:[{...catalog.addons[0],prices_cad:{mid:30}}]}).code,"CURRENT_PRICE_CHANGED");
assert.equal(verify(booking,{...body,start_slot:"PM"}).code,"SLOT_CHANGED");
assert.deepEqual(normalizedRecoverySlots626("AM",2),["AM","PM"]);
assert.deepEqual(normalizedRecoverySlots626("PM",2),[],"full day cannot start PM");
assert.equal(priceSnapshot626(catalog,{...body,addon_codes:["ozone"]}).code,"QUOTE_REQUIRED");
assert.equal(priceSnapshot626(catalog,{...body,addon_codes:["coating"]}).code,"ADDON_INCOMPATIBLE");
assert.equal(priceSnapshot626(catalog,{...body,addon_codes:["missing"]}).code,"ADDON_UNAVAILABLE");
assert.equal(priceSnapshot626(catalog,{...body,addon_codes:["wax","wax"]}).code,"ADDON_SELECTION_INVALID");
assert.equal(evaluateSlotAvailability({startSlot:"AM",durationSlots:2,blockedSlots:["PM"]}).code,"BOOKING_SLOT_UNAVAILABLE");
assert.equal(evaluateSlotAvailability({startSlot:"AM",durationSlots:2,conflicts:[{start_slot:"PM",duration_slots:1}]}).code,"BOOKING_SLOT_UNAVAILABLE");
assert.equal(evaluateSlotAvailability({startSlot:"PM",durationSlots:2}).code,"BOOKING_SLOT_INVALID");
assert.equal(evaluateSlotAvailability({startSlot:"AM",durationSlots:1,conflicts:[{start_slot:"PM",duration_slots:1}]}).ok,true);
const terms={package_code:"basic_detail",vehicle_size:"mid",addon_codes:["wax"],total_cents:29400,
 deposit_cents:5000,expires_at:"2026-12-01T12:00:00.000Z",currency:"CAD"};
assert.equal(compareAcceptedTermsToCurrentPrice(terms,{ok:true,...terms},NOW).ok,true);
assert.equal(compareAcceptedTermsToCurrentPrice(terms,{ok:true,...terms,total_cents:29900},NOW).code,"QUOTE_PRICE_CHANGED");

const read=p=>readFileSync(new URL(p,import.meta.url),"utf8");
const wrapper=read("../functions/api/checkout_recovery.js");
const checkout=read("../functions/api/checkout.js");
const quote=read("../functions/api/_lib/quote-booking-authority.js");
assert.match(wrapper,/evaluateBookingRecovery626/);
assert.match(wrapper,/recovery_state: "details_changed"/);
assert.match(wrapper,/"addons", "price_total_cents", "deposit_cents"/);
assert.match(wrapper,/canonicalCheckout/);
assert.match(wrapper,/pending_session_attach/);
assert.match(wrapper,/payment_session_expired/);
assert.match(checkout,/Full-day bookings must start in AM/);
assert.match(quote,/A full-day booking must start in AM/);
assert.doesNotMatch(wrapper,/(INSERT INTO|UPDATE bookings|DELETE FROM|CREATE TABLE)/i);
console.log("Build 626 booking hold, recovery, pricing, quote and slot conflict regression: PASS");
