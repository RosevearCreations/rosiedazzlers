import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import vm from "node:vm";
import { hashStructuredQuoteTerms } from "../functions/api/_lib/quote-booking-terms.js";
import { evaluateQuoteBookingApproval740 } from "../functions/api/_lib/quote-booking-approval-v740.js";
import { onRequestPost as respondToQuote } from "../functions/api/quote_proposal_respond.js";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const terms = {
  version:1, package_code:"basic_detail", vehicle_size:"mid", addon_codes:["pet_hair"],
  total_cents:22500, deposit_cents:5000, expires_at:"2028-01-01T00:00:00.000Z", currency:"CAD"
};
const digest = await hashStructuredQuoteTerms(terms);
const accepted = {
  acceptance_status:"accepted",accepted_at:"2026-11-01T12:00:00Z",responded_at:"2026-11-01T12:00:00Z",
  delivered_at:"2026-10-31T11:00:00Z",follow_up_at:"2026-11-03T14:00:00Z",
  accepted_terms:terms,accepted_terms_hash:digest,structured_terms_hash:digest
};
const price = {ok:true,package_code:terms.package_code,vehicle_size:terms.vehicle_size,
  addon_codes:terms.addon_codes,total_cents:terms.total_cents,deposit_cents:terms.deposit_cents};
const provider = [{id:"existing-provider-reference",provider:"stripe",provider_status:"unconfirmed",payment_status:"pending",amount_cents:5000}];
const input = {quote:accepted,currentPrice:price,paymentRequests:provider,nowMs:Date.parse("2026-11-02T00:00:00Z")};
const okay = await evaluateQuoteBookingApproval740(input);
assert.equal(okay.status,"scope_accepted_deposit_held");
assert.equal(okay.scope_ready,true);
assert.equal(okay.customer_acceptance.accepted_snapshot_verified,true);
assert.equal(okay.accepted_scope.deposit_cents,5000);
assert.equal(okay.deposit.accepted_amount_cents,5000);
assert.equal(okay.deposit.provider_authorization,"HELD");
assert.equal(okay.deposit.can_create_payment_request,false);
assert.equal(okay.deposit.can_activate_live_provider,false);
assert.equal(okay.deposit.can_charge,false);
assert.deepEqual(okay.deposit.existing_requests.map(row=>[row.provider,row.provider_status,row.payment_status]),[["stripe","unconfirmed","pending"]]);
assert.deepEqual(await evaluateQuoteBookingApproval740(input),okay,"Repeated preview has no new session, state or payment effects");
assert.equal((await evaluateQuoteBookingApproval740({...input,proposedTerms:{...terms,deposit_cents:6000}})).scope_ready,false,"Changed deposit requires customer reacceptance");
assert.equal((await evaluateQuoteBookingApproval740({...input,proposedTerms:{...terms,addon_codes:[]}})).scope_ready,false,"Changed add-ons require customer reacceptance");
assert.equal((await evaluateQuoteBookingApproval740({...input,quote:{...accepted,accepted_terms:{...terms,total_cents:23000}}})).scope_ready,false,"Tampered stored scope must fail hash check");
assert.equal((await evaluateQuoteBookingApproval740({...input,quote:{...accepted,acceptance_status:"sent"}})).scope_ready,false,"Staff-marked status is not customer consent");
assert.equal((await evaluateQuoteBookingApproval740({...input,currentPrice:{...price,total_cents:24000}})).scope_ready,false,"Catalog price drift requires a new quote");
assert.equal((await evaluateQuoteBookingApproval740({...input,nowMs:Date.parse("2028-01-02T00:00:00Z")})).scope_ready,false,"Expired accepted terms need new acceptance");
assert.equal((await evaluateQuoteBookingApproval740({...input,quote:{...accepted,accepted_terms_hash:"invalid"}})).scope_ready,false);
assert.equal((await evaluateQuoteBookingApproval740({...input,quote:{...accepted,structured_terms_hash:"invalid"}})).scope_ready,false);

// Real handler replay/race checks against an in-memory HTTP adapter. No live
// Supabase, message, booking or payment endpoint is contacted.
const quoteId="2d2c3ad2-0fce-4f24-8d95-95fd9466f089";
const token="build740-test-response-token";
const tokenHash=createHash("sha256").update(token).digest("hex");
const oldTerms={...terms,expires_at:"2025-01-01T00:00:00.000Z"};
const oldHash=await hashStructuredQuoteTerms(oldTerms);
const acceptedOld={...accepted,id:quoteId,acceptance_token_hash:tokenHash,
  structured_terms:oldTerms,structured_terms_hash:oldHash,
  accepted_terms:oldTerms,accepted_terms_hash:oldHash};
const context=()=>({request:new Request("https://rosiedazzlers.ca/api/quote_proposal_respond",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({draft_id:quoteId,token,action:"accepted"})}),
  env:{SUPABASE_URL:"https://supabase-mock.invalid",SUPABASE_SERVICE_ROLE_KEY:"not-a-real-key"}});
const originalFetch=globalThis.fetch;
try {
  const missingAction=await respondToQuote({
    ...context(),
    request:new Request("https://rosiedazzlers.ca/api/quote_proposal_respond",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({draft_id:quoteId,token})})
  });
  assert.equal(missingAction.status,400,"Missing action must not crash or call a provider");
  assert.equal((await missingAction.json()).code,"QUOTE_RESPONSE_ACTION_REQUIRED");
  let callCount=0;
  globalThis.fetch=async (_url,options={})=>{
    callCount++;
    assert.notEqual(options.method,"PATCH","Already accepted replay must not write");
    return new Response(JSON.stringify([acceptedOld]),{status:200,headers:{"content-type":"application/json"}});
  };
  const replay=await respondToQuote(context());
  const replayBody=await replay.json();
  assert.equal(replay.status,200,JSON.stringify(replayBody));
  assert.deepEqual([replayBody.code,replayBody.replay],["QUOTE_ALREADY_ACCEPTED",true]);
  assert.equal(callCount,1,"Exact accepted replay needs one read and zero mutation calls");

  let reads=0,patches=0;
  globalThis.fetch=async (_url,options={})=>{
    if(options.method==="PATCH"){
      patches++;
      assert.match(String(_url),/accepted_terms_hash=is\.null/);
      return new Response("[]",{status:200,headers:{"content-type":"application/json"}});
    }
    reads++;
    const record=reads===1?{...accepted,id:quoteId,acceptance_status:"awaiting_response",accepted_at:null,
      accepted_terms:null,accepted_terms_hash:null,acceptance_token_hash:tokenHash,
      structured_terms:terms,structured_terms_hash:digest}:
      {...accepted,id:quoteId,acceptance_token_hash:tokenHash,structured_terms:terms};
    return new Response(JSON.stringify([record]),{status:200,headers:{"content-type":"application/json"}});
  };
  const concurrent=await respondToQuote(context());
  const concurrency=await concurrent.json();
  assert.equal(concurrent.status,200,JSON.stringify(concurrency));
  assert.deepEqual([concurrency.code,concurrency.replay],["QUOTE_ALREADY_ACCEPTED",true]);
  assert.deepEqual([reads,patches],[2,1],"Concurrent acceptance retry must re-read immutable winner");
} finally {globalThis.fetch=originalFetch;}

const preview = read("../functions/api/admin/quote_booking_approval_preview.js");
assert.match(preview,/requireStaffAccess\(/);
assert.match(preview,/capability:"manage_bookings"/);
assert.match(preview,/read_only:true/);
assert.match(preview,/quote_proposal_drafts/);
assert.match(preview,/quote_deposit_payment_requests/);
assert.match(preview,/resolveCurrentQuotePrice/);
assert.doesNotMatch(preview,/method:\s*"(?:POST|PATCH|DELETE)"/,"Preview cannot write to Supabase or provider");
assert.doesNotMatch(preview,/api\.stripe\.com|api-m\.paypal\.com/,"Preview cannot contact payment providers");

const deposit = read("../functions/api/admin/quote_deposit_request_create.js");
const guard = deposit.indexOf('if (QUOTE_DEPOSIT_PROVIDER_AUTHORIZATION_740 === "HELD")');
assert.ok(guard > 0 && guard < deposit.indexOf("const requestRow = await insertPaymentRequest("));
assert.match(deposit,/code:"QUOTE_DEPOSIT_PROVIDER_AUTHORIZATION_HELD"/);
assert.match(deposit,/provider_session_created:false, charged:false/);
assert.doesNotMatch(deposit,/body\.allow_unaccepted/);
assert.match(deposit,/amountCents = checkedTerms\.terms\.deposit_cents/);
assert.match(deposit,/QUOTE_DEPOSIT_AMOUNT_OVERRIDE_NOT_ALLOWED/);
assert.match(deposit,/Idempotency-Key/);
assert.doesNotMatch(deposit,/payment_method_types\[0\]/);

const saving = read("../functions/api/admin/quote_proposal_drafts_save.js");
assert.match(saving,/CUSTOMER_ACCEPTANCE_REQUIRED/);
assert.match(saving,/QUOTE_ACCEPTED_SCOPE_LOCKED/);
assert.match(saving,/acceptance_status\.is\.null,acceptance_status\.neq\.accepted/);
const response = read("../functions/api/quote_proposal_respond.js");
assert.match(response,/"accept_once"/);
assert.match(response,/accepted_terms_hash=is\.null/);
assert.match(response,/QUOTE_ALREADY_ACCEPTED/);
const delivery=read("../functions/api/admin/quote_proposal_deliver.js");
assert.match(delivery,/QUOTE_ACCEPTED_SCOPE_LOCKED/);
assert.match(delivery,/QUOTE_DELIVERY_CONFLICT/);
assert.match(delivery,/updated_at=eq\.\$\{encodeURIComponent\(expectedUpdatedAt\)\}/);
assert.ok(delivery.indexOf("const frozen = await patchDraft(") < delivery.indexOf("await dispatchNotificationThroughProvider(env, event"),"A quote delivery cannot contact email provider before safely freezing terms");
assert.match(delivery,/acceptance_status=eq\.awaiting_response/);

const leads = read("../admin-leads.html");
assert.match(leads,/data-approval-preview-740/);
assert.match(leads,/data-approval-summary-740/);
assert.match(leads,/quote_booking_approval_preview/);
assert.match(leads,/Live activation: OFF/);
assert.doesNotMatch(leads,/data-create-deposit-request/);
assert.doesNotMatch(leads,/api\('\/api\/admin\/quote_deposit_request_create'/);
for(const code of [...leads.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].map(match=>match[1]).filter(Boolean)) {
  new vm.Script(code,{filename:"admin-leads inline script"});
}
console.log("BUILD 740 QUOTE ACCEPTANCE, CONSENT, DEPOSIT, PROVIDER HOLD AND IDEMPOTENT PREVIEW: PASS");
