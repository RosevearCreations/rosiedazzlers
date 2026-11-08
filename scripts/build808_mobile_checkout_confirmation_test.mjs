import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { SourceTextModule } from "node:vm";
import { CHECKOUT_MOBILE_VERSION_808, classifyCheckoutResult808, checkoutReturnMessage808 } from "../assets/checkout-mobile-v808.mjs";
import { createCheckoutAttemptGuard737 } from "../assets/booking-journey-v737.js";
import { onRequestGet as getBookingConfirmation } from "../functions/api/booking_confirmation.js";

const read = path => readFileSync(new URL(path, import.meta.url), "utf8");
const bookingId = "a0d629a8-668f-4eb4-b68e-83d90697173c";
assert.equal(CHECKOUT_MOBILE_VERSION_808, "rosie-checkout-mobile.v1");
const stripe = classifyCheckoutResult808(200, {ok:true,mode:"stripe",checkout_url:"https://checkout.stripe.com/c/pay/mock808"});
assert.equal(stripe.kind,"redirect");
assert.equal(stripe.mode,"stripe");
assert.equal(stripe.url,"https://checkout.stripe.com/c/pay/mock808");
assert.equal(classifyCheckoutResult808(200,{ok:true,mode:"paypal",approve_url:"https://www.paypal.com/checkoutnow?token=mock808"}).kind,"redirect");
assert.equal(classifyCheckoutResult808(200,{ok:true,mode:"paypal",approve_url:"https://www.sandbox.paypal.com/checkoutnow?token=mock808"}).kind,"redirect");
for (const url of ["http://checkout.stripe.com/pay/abc", "https://checkout.stripe.com.evil.ca/pay/abc", "https://evil.ca/pay/abc", "javascript:alert(1)", "https://user:password@checkout.stripe.com/pay/abc", "/booking-confirmed?provider=gift", "https://checkout.stripe.com/pay/abc#fragment"]) {
  assert.equal(classifyCheckoutResult808(200,{ok:true,mode:"stripe",checkout_url:url}).kind,"review_required",url);
}
for (const result of [
  {ok:true,mode:"gift_only_confirm",booking_status:"pending",booking_id:bookingId,payable_now_cents:0,gift_redeemed_cents:5000},
  {ok:true,mode:"gift_only_confirm",booking_status:"confirmed",booking_id:"not-an-id",payable_now_cents:0,gift_redeemed_cents:5000},
  {ok:true,mode:"gift_only_confirm",booking_status:"confirmed",booking_id:bookingId,payable_now_cents:500,gift_redeemed_cents:5000},
  {ok:true,mode:"gift_only_confirm",booking_status:"confirmed",booking_id:bookingId,payable_now_cents:0}
]) assert.equal(classifyCheckoutResult808(200,result).kind,"review_required");
assert.equal(classifyCheckoutResult808(200,{ok:true,mode:"gift_only_confirm",booking_status:"confirmed",booking_id:bookingId,payable_now_cents:0,gift_redeemed_cents:5000,checkout_url:"/booking-confirmed?provider=gift"}).kind,"gift_confirmed");
assert.equal(classifyCheckoutResult808(400,{error:"invalid selection"}).kind,"correctable");
assert.equal(classifyCheckoutResult808(422,{error:"invalid selection"}).kind,"correctable");
assert.equal(classifyCheckoutResult808(409,{error:"Selected slot not available",reason:"one_car_capacity_conflict"}).kind,"correctable");
assert.equal(classifyCheckoutResult808(409,{error:"stale",recovery_state:"stale_availability"}).kind,"correctable");
for (const status of [0,401,409,429,500,503]) assert.equal(classifyCheckoutResult808(status,{error:"not proven"}).kind,"review_required");
assert.equal(classifyCheckoutResult808(200,null).kind,"review_required");
assert.equal(classifyCheckoutResult808(200,{ok:true,mode:"stripe",checkout_url:""}).kind,"review_required");
assert.equal(checkoutReturnMessage808(`?booking_id=${bookingId}`).includes("cannot verify"),true);
assert.equal(checkoutReturnMessage808("?booking_id=<script>") ,"");
assert.equal(checkoutReturnMessage808("?provider=gift&package=basic_detail"),"");
const guard=createCheckoutAttemptGuard737();
assert.equal(guard.begin(),true);assert.equal(guard.markSubmitted(),true);
assert.equal(guard.markCompleted(),true);assert.equal(guard.begin(),false);
assert.equal(createCheckoutAttemptGuard737().markCompleted(),false);

const planner = read("../booking-planner.html");
const book = read("../book.html");
const confirm = read("../booking-confirmed.html");
assert.equal(book,read("../book/index.html"));
assert.match(book,/id="paymentReturnNotice808"/);
assert.match(book,/checkoutReturnMessage808\(window\.location\.search\)/);
assert.match(planner,/classifyCheckoutResult808\(res\.status, out\)/);
assert.match(planner,/decision\.kind === "gift_confirmed"/);
assert.match(planner,/checkoutGuard737\.markCompleted\(\)/);
assert.match(planner,/checkoutProgress808\.textContent/);
assert.match(planner,/sessionStorage\.setItem\(CHECKOUT_UNCERTAIN_KEY_737, "1"\)/);
assert.match(planner,/location\.href = decision\.url/);
assert.doesNotMatch(planner,/location\.href = out\.checkout_url/);
assert.doesNotMatch(confirm,/showConfirmed\(\{ package: params\.get\("package"\)/);
assert.match(confirm,/showError\("Gift-covered bookings are confirmed only after/);
assert.match(confirm,/await getConfirmation\(query\)/);
assert.match(confirm,/await fetch\("\/api\/paypal\/capture-order"/);
const modules = [...planner.matchAll(/<script type="module">([\s\S]*?)<\/script>/g)];
for (const [,source] of modules) new SourceTextModule(source);
const embedded = [...book.matchAll(/<script type="module">([\s\S]*?)<\/script>/g)];
for (const [,source] of embedded) new SourceTextModule(source);
const unauthGift = await getBookingConfirmation({
  request: new Request(`https://rosiedazzlers.ca/api/booking_confirmation?provider=gift&booking_id=${bookingId}`),
  env: { SUPABASE_URL:"https://example.supabase.co", SUPABASE_SERVICE_ROLE_KEY:"test-only" }
});
assert.equal(unauthGift.status,400,"Gift URL must never obtain server-side payment verification");
console.log("Build 808 mobile checkout, gift confirmation, provider URL safety, retry classification and return-state regressions: PASS");
