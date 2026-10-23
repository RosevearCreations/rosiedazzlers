import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {requestIdentity615,intakeState615} from "../assets/quote-first-handoff-v615.js";
import {normalizeQuoteFirstRequest573} from "../assets/quote-first-intake-v573.js";
import {onRequestGet,onRequestPost} from "../functions/api/quote_first_request.js";

const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const choices={vehicle:"mid",goal:"interior",condition:"heavy",extras:["salt"]};
const fields={full_name:"Demo Customer",email:"demo@example.test",phone:"",service_area:"Tillsonburg",notes:"Demo only",contact_consent:true};
const ids=["a1b2c3d4-1234-4abc-8123-123456789abc","b2c3d4e5-1234-4abc-8123-123456789abc","c3d4e5f6-1234-4abc-8123-123456789abc"];
let generated=0;
const createId=()=>ids[generated++];
const initial=requestIdentity615(null,choices,fields,createId);
assert.equal(initial.id,ids[0]);
assert.equal(requestIdentity615(initial,choices,{...fields},createId),initial,"Identical retry must reuse the request key");
const edited=requestIdentity615(initial,choices,{...fields,notes:"Other condition"},createId);
assert.equal(edited.id,ids[1],"Edited details require a new request identity");
assert.equal(requestIdentity615(edited,{...choices,vehicle:"small"},fields,createId).id,ids[2]);
assert.equal(generated,3);
assert.equal(intakeState615(null,true),"disabled");
assert.equal(intakeState615({enabled:false,site_key:"key"},true),"disabled");
assert.equal(intakeState615({enabled:true,site_key:null},true),"disabled");
assert.equal(intakeState615({enabled:true,site_key:"key"},false),"awaiting_review");
assert.equal(intakeState615({enabled:true,site_key:"key"},true),"ready");

const sample={...choices,...fields,request_id:initial.id,turnstile_token:"test-token"};
const normalized=normalizeQuoteFirstRequest573(sample);
assert.equal(normalized.ok,true);
assert.equal(normalized.payload.status,"new");
assert.equal(normalized.payload.source_path,"/preview/quote-first/");
assert.match(normalized.payload.message,/not a quote or booking/i);
assert.match(normalized.payload.message,/not marketing/i);
assert.ok(!("marketing_consent" in normalized.payload));
for(const invalid of [{contact_consent:false},{contact_consent:"true"},{email:"",phone:""}]){
  assert.equal(normalizeQuoteFirstRequest573({...sample,...invalid}).ok,false);
}

const request=(body=sample,origin="https://rosiedazzlers.ca")=>new Request("https://rosiedazzlers.ca/api/quote_first_request",{
  method:"POST",headers:{Origin:origin,"Content-Type":"application/json"},body:JSON.stringify(body)
});
const disabled=await onRequestPost({env:{},request:request()});
assert.equal(disabled.status,503);
assert.equal((await disabled.json()).code,"INTAKE_NOT_ENABLED");
const disabledGet=await (await onRequestGet({env:{}})).json();
assert.equal(disabledGet.enabled,false);
assert.equal(disabledGet.accepts_booking,false);
assert.equal(disabledGet.accepts_payment,false);

// No live provider request or contact information is used: all outbound calls
// are replaced with an in-memory Supabase/Turnstile fixture.
const settings={QUOTE_FIRST_INTAKE_ENABLED:"true",QUOTE_FIRST_TURNSTILE_SITE_KEY:"public-test-key",
 QUOTE_FIRST_TURNSTILE_SECRET:"private-test-key",SUPABASE_URL:"https://test.supabase.co",SUPABASE_SERVICE_ROLE_KEY:"unit-test-only"};
const storage=new Map();
const calls=[];
let unavailable=false;
const originalFetch=globalThis.fetch;
globalThis.fetch=async(url,options={})=>{
  const target=String(url),method=options.method||"GET";
  calls.push({target,method});
  if(target.includes("siteverify"))return new Response(JSON.stringify({success:true,hostname:"rosiedazzlers.ca"}),{status:200});
  if(!target.startsWith("https://test.supabase.co/rest/v1/public_inquiry_leads"))throw Error("Unexpected outbound request");
  if(method==="POST"){
    if(unavailable){unavailable=false;return new Response("temporarily down",{status:503});}
    const row=JSON.parse(options.body);
    if(storage.has(row.id))return new Response(JSON.stringify({code:"23505"}),{status:409});
    storage.set(row.id,row);
    return new Response("",{status:201});
  }
  const id=new URL(target).searchParams.get("id").replace(/^eq\./,"");
  const row=storage.get(id);
  return new Response(JSON.stringify(row?[row]:[]),{status:200});
};
try{
  const status=await (await onRequestGet({env:settings})).json();
  assert.equal(status.enabled,true);
  assert.equal(status.manual_staff_review_required,true);
  const noConsent=await onRequestPost({env:settings,request:request({...sample,contact_consent:false})});
  assert.equal(noConsent.status,400);
  const wrongOrigin=await onRequestPost({env:settings,request:request(sample,"https://other.example")});
  assert.equal(wrongOrigin.status,403);
  assert.equal(calls.length,0,"Unauthorized submissions never reach providers");

  unavailable=true;
  const retryable=await onRequestPost({env:settings,request:request()});
  assert.equal(retryable.status,503);
  assert.equal(storage.size,0);

  const created=await onRequestPost({env:settings,request:request()});
  assert.equal(created.status,201);
  const createdBody=await created.json();
  assert.equal(createdBody.staff_review_required,true);
  assert.equal(createdBody.booking_created,false);
  assert.equal(createdBody.payment_taken,false);
  assert.equal(storage.size,1);

  const replay=await onRequestPost({env:settings,request:request()});
  assert.equal(replay.status,200);
  const replayBody=await replay.json();
  assert.equal(replayBody.replay,true);
  assert.equal(replayBody.reference,initial.id);
  assert.equal(storage.size,1,"A replay must never create a second lead");

  const changed=await onRequestPost({env:settings,request:request({...sample,notes:"Not the original inquiry"})});
  assert.equal(changed.status,409,"Same UUID with altered payload must not overwrite the lead");
  assert.equal(storage.size,1);
  assert.equal(storage.get(initial.id).staff_note,undefined);
  assert.equal(storage.get(initial.id).converted_booking_id,undefined);
  assert.equal(storage.get(initial.id).status,"new");
}finally{globalThis.fetch=originalFetch;}

const html=read("preview/quote-first/index.html");
const css=read("assets/quote-first-wizard-v570.css");
const ui=read("assets/quote-first-intake-ui-v573.js");
assert.match(html,/noindex,nofollow,noarchive/);
assert.match(html,/id="quote-intake-status" role="status" aria-live="polite"/);
assert.match(html,/id="quote-intake-form"[^>]*hidden/);
assert.match(html,/name="contact_consent"[^>]*required/);
assert.match(html,/not subscribe you to advertising or marketing/i);
assert.match(css,/#quote-intake-form\[hidden\]\{display:none\}/);
assert.match(css,/@media\(max-width:420px\)/);
assert.match(ui,/requestIdentity615\(identity,selected,fields/);
assert.match(ui,/pending\|\|accepted\|\|state\(\)!=="ready"/);
assert.match(ui,/if\(response\.status===409\)identity=null/);
assert.match(ui,/window\.turnstile\.reset/);
assert.ok(!/localStorage|sessionStorage|indexedDB/.test(ui));
const admin=read("admin-leads.html");
assert.equal(admin,read("admin-leads/index.html"));
assert.match(admin,/id="leadSource"/);
assert.match(admin,/source:els\.leadSource\.value/);
assert.match(admin,/row\.source_path === '\/preview\/quote-first\/'/);
assert.match(admin,/not marketing/i);
const staffRoute=read("functions/api/admin/public_inquiry_leads_list.js");
assert.match(staffRoute,/capability: "manage_bookings"/);
assert.match(staffRoute,/params\.set\("source_path", "eq\.\/preview\/quote-first\/"\)/);
assert.match(staffRoute,/body\.source === "quote_first"/);
const publicRoute=read("functions/api/quote_first_request.js");
assert.match(publicRoute,/QUOTE_FIRST_INTAKE_ENABLED==="true"/);
assert.ok(!/\/api\/booking_create|\/rest\/v1\/bookings|stripe\.com|\/rest\/v1\/quote_proposal_drafts/.test(publicRoute));
console.log("Build 615 gated intake, staff-source handoff, consent, retry and duplicate acceptance: PASS");
