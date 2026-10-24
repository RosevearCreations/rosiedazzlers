import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {
 BOOKING_HELP_VERSION_628, BOOKING_STEP_HELP_628, BOOKING_FIELD_HELP_628,
 validateBookingHelpPlan628, installContextualBookingHelp628
} from "../assets/booking-context-help-v628.js";
const read=path=>readFileSync(new URL(path,import.meta.url),"utf8");
const planner=read("../booking-planner.html");
const css=read("../assets/booking-context-help-v628.css");
const js=read("../assets/booking-context-help-v628.js");
const checkout=read("../functions/api/checkout.js");
const book=read("../book.html");
const bookCopy=read("../book/index.html");

assert.equal(BOOKING_HELP_VERSION_628,"rosie-booking-step-help.v1");
assert.deepEqual(BOOKING_STEP_HELP_628.map(row=>row.step),[1,2,3,4,5]);
assert.equal(validateBookingHelpPlan628().ok,true);
assert.equal(validateBookingHelpPlan628([BOOKING_STEP_HELP_628[0]]).code,"STEPS_MISSING");
assert.equal(validateBookingHelpPlan628([...BOOKING_STEP_HELP_628.slice(0,4),
 {...BOOKING_STEP_HELP_628[4],tips:[]}]).code,"STEP_CONTENT_INVALID");
assert.equal(validateBookingHelpPlan628(BOOKING_STEP_HELP_628,[BOOKING_FIELD_HELP_628[0],BOOKING_FIELD_HELP_628[0]]).code,"FIELD_HELP_INVALID");
assert.equal(installContextualBookingHelp628(null),false);
assert.equal(BOOKING_FIELD_HELP_628.length,8);
assert.ok(BOOKING_STEP_HELP_628.every(row=>row.tips.length>=3));
for(const row of BOOKING_FIELD_HELP_628){
 assert.match(planner,new RegExp('id="'+row.id+'"'));
 assert.match(planner,new RegExp('for="'+row.id+'"'));
 const start=planner.indexOf('<section class="section panel wizard-card wizard-step" data-step="'+row.step+'"');
 const end=planner.indexOf('<section class="section panel wizard-card wizard-step"',start+1);
 const slice=planner.slice(start,end<0?undefined:end);
 assert.ok(slice.includes('id="'+row.id+'"'),"Field "+row.id+" is not in declared step");
}
for(const n of [1,2,3,4,5]){
 assert.match(planner,new RegExp('class="section panel wizard-card wizard-step" data-step="'+n+'"'));
 assert.ok(BOOKING_STEP_HELP_628.some(item=>item.step===n));
}
assert.equal(book,bookCopy,"Do not create public /book route drift");
assert.match(planner,/booking-context-help-v628\.js/);
assert.match(planner,/booking-context-help-v628\.css/);
assert.match(planner,/booking-wizard-v627\.js/,"Retain previous accessible progress enhancement");
assert.match(js,/insertAdjacentElement\("afterend",details\)/);
assert.match(js,/aria-describedby/);
assert.match(js,/aria-hidden/);
assert.match(js,/document\.readyState/);
assert.match(css,/focus-visible/);
assert.match(css, /prefers-reduced-motion:reduce/);
assert.match(css, /max-width:600px/);
assert.match(planner,/function validateStep\(step\)/);
assert.match(planner,/fetch\("\/api\/checkout"/);
assert.match(checkout,/loadPricingCatalog\(env\)/);
assert.doesNotMatch(js, /(?:fetch\(|sessionStorage|localStorage|\/api\/checkout|window\.location|payment_provider)/);
assert.ok(BOOKING_STEP_HELP_628[4].tips.some(x=>x.includes("confirmed")),"Final help must not imply early confirmation");
assert.ok(BOOKING_STEP_HELP_628[0].tips.some(x=>x.includes("not a reservation")),"Availability must be non-binding");
console.log("Build 628 five-step contextual help, field guidance, accessible descriptions, checkout boundary: PASS");
