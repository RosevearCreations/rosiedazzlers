import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {normalizeQuoteFirstRequest573 as norm,sameQuoteFirstRequest573 as same} from "../assets/quote-first-intake-v573.js";
import {onRequestPost,onRequestGet} from "../functions/api/quote_first_request.js";
const id="a1b2c3d4-1234-4abc-8123-123456789abc";
const raw={request_id:id,vehicle:"mid",goal:"interior",condition:"heavy",extras:["pet_hair","salt"],
 full_name:"Test User",email:"test@example.org",phone:"",service_area:"Tillsonburg",notes:"Fabric stain",
 contact_consent:true};
const p=norm(raw);assert.equal(p.ok,true);assert.equal(p.payload.id,id);assert.equal(p.payload.status,"new");
assert.equal(p.payload.topic,"general");assert.equal(p.payload.source_path,"/preview/quote-first/");
assert.equal(p.payload.photo_estimate_links.length,0);assert.ok(p.payload.message.includes("not a quote or booking"));
assert.equal(same({...p.payload},p.payload),true);
assert.equal(same({...p.payload,email:"other@example.com"},p.payload),false);
for(const update of [{vehicle:"invalid"},{goal:"other"},{extras:["not-real"]},
 {extras:["pet_hair","pet_hair"]},{contact_consent:false},{request_id:"not-uuid"},
 {full_name:""},{email:"not-an-email"},{phone:"abc",email:""}]){
 assert.equal(norm({...raw,...update}).ok,false,JSON.stringify(update));
}
const disabled=await onRequestPost({env:{},request:new Request("https://rosiedazzlers.ca/api/quote_first_request",{method:"POST",headers:{"Origin":"https://rosiedazzlers.ca","Content-Type":"application/json"},body:JSON.stringify(raw)})});
assert.equal(disabled.status,503);
assert.equal((await onRequestGet({env:{}})).status,200);
const settings={QUOTE_FIRST_INTAKE_ENABLED:"true",QUOTE_FIRST_TURNSTILE_SITE_KEY:"public-key",QUOTE_FIRST_TURNSTILE_SECRET:"private-key",
 SUPABASE_URL:"https://example.supabase.co",SUPABASE_SERVICE_ROLE_KEY:"fake-test-key"};
const get=await (await onRequestGet({env:settings})).json();assert.equal(get.enabled,true);
assert.equal(get.accepts_booking,false);
const calls=[];const originalFetch=globalThis.fetch;
globalThis.fetch=async(url,options)=>{
 calls.push({url:String(url),method:options?.method||"GET",body:String(options?.body||"")});
 if(String(url).includes("turnstile"))return new Response(JSON.stringify({success:true,hostname:"rosiedazzlers.ca"}),{status:200});
 if(String(url).includes("supabase"))return new Response("",{status:201});
 throw Error("unexpected outbound destination");
};
try{
 const post=async(data=raw,origin="https://rosiedazzlers.ca")=>onRequestPost({env:settings,request:new Request("https://rosiedazzlers.ca/api/quote_first_request",{method:"POST",headers:{"Origin":origin,"Content-Type":"application/json"},body:JSON.stringify({...data,turnstile_token:"test-token"})})});
 const noOrigin=await post(raw,"https://attacker.example");assert.equal(noOrigin.status,403);assert.equal(calls.length,0);
 const first=await post();assert.equal(first.status,201);
 const body=await first.json();assert.equal(body.staff_review_required,true);assert.equal(body.booking_created,false);
 assert.deepEqual(calls.map(x=>x.method),["POST","POST"]);
 assert.equal(calls[1].url,"https://example.supabase.co/rest/v1/public_inquiry_leads");
 const stored=JSON.parse(calls[1].body);assert.equal(stored.id,id);
 assert.equal(stored.status,"new");
 assert.equal(stored.source_path,"/preview/quote-first/");
 assert.ok(!("booking_id" in stored));assert.ok(!("price" in stored));
}finally{globalThis.fetch=originalFetch;}
const ui=readFileSync(new URL("../assets/quote-first-intake-ui-v573.js",import.meta.url),"utf8");
assert.ok(ui.includes("rosie-quote-preview-review"));
assert.ok(ui.includes("turnstile"));
assert.ok(!ui.includes("localStorage"));
const html=readFileSync(new URL("../preview/quote-first/index.html",import.meta.url),"utf8");
assert.ok(html.includes("noindex,nofollow,noarchive"));
assert.ok(html.includes("quote-first-intake-v573"));
console.log("Build 573: safe, gated quote-first intake, consent, Turnstile and existing staff lead handoff PASS");
