import test from 'node:test';
import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {normalizePlan909,quoteSnapshot909,safeMediaTimeline909} from '../functions/api/_lib/customer-continuity-v909.js';
import {hashStructuredQuoteTerms} from '../functions/api/_lib/quote-booking-terms.js';
import {onRequestGet,onRequestPost} from '../functions/api/client/booking_continuity_v909.js';
if(!globalThis.crypto)globalThis.crypto=webcrypto;
const profile='b3d990b8-755f-4d62-9682-42d2172f8f4a',quoteId='d23e7d2d-c36f-4d3b-a752-100aaa9a7dc0';
const terms={version:1,package_code:'basic_detail',vehicle_size:'small',addon_codes:[],total_cents:12000,deposit_cents:5000,
 expires_at:'2027-01-25T13:00:00.000Z',currency:'CAD'};
const env={SUPABASE_URL:'https://demo-supabase.example',SUPABASE_SERVICE_ROLE_KEY:'test-only-not-live'};
const reqBody=(value)=>new Request('https://rosiedazzlers.ca/api/client/booking_continuity_v909',{
 method:'POST',headers:{origin:'https://rosiedazzlers.ca','content-type':'application/json',cookie:'rd_client_session=fakeToken'},
 body:JSON.stringify(value)});
test('909: allow only strictly non-sensitive Smart and Manual saved choices',()=>{
 const smart={mode:'smart',size:'mid',goal:'complete',condition:'moderate',concerns:['salt'],accepted_addons:[]};
 const manual={mode:'manual',size:'small',payable_codes:['wax'],quote_codes:['ceramic']};
 assert.deepEqual(normalizePlan909(smart),smart);
 assert.deepEqual(normalizePlan909(manual),manual);
 assert.equal(normalizePlan909({...smart,address:'1 Sample Street'}),null);
 assert.equal(normalizePlan909({...smart,email:'private@example.ca'}),null);
 assert.equal(normalizePlan909({...smart,appointment:'2026-11-20'}),null);
 assert.equal(normalizePlan909({...manual,quote_codes:['wax']}),null);
 assert.equal(normalizePlan909({...manual,payable_codes:['WRONG!']}),null);
});
test('909: quote status must be independently hashed and reviewed',async()=>{
 const hash=await hashStructuredQuoteTerms(terms);
 const q={id:quoteId,title:'Package quote',sent_at:'2026-11-18T13:00:00Z',updated_at:'2026-11-18T13:05:00Z',
  structured_terms:terms,structured_terms_hash:hash,status:'sent',acceptance_status:null};
 const pending=await quoteSnapshot909(q,false,Date.parse('2026-11-18T13:10:00Z'));
 assert.equal(pending.acceptance_ready,false);assert.equal(pending.terms.total_cents,12000);
 const allowed=await quoteSnapshot909(q,true,Date.parse('2026-11-18T13:10:00Z'));
 assert.equal(allowed.acceptance_ready,true);
 assert.equal((await quoteSnapshot909({...q,structured_terms_hash:'a'.repeat(64)},true,Date.parse('2026-11-18T13:10:00Z'))).acceptance_ready,false);
 assert.equal((await quoteSnapshot909({...q,acceptance_status:'declined'},true,Date.parse('2026-11-18T13:10:00Z'))).acceptance_ready,false);
 assert.equal((await quoteSnapshot909(q,true,Date.parse('2027-03-01T13:10:00Z'))).acceptance_ready,false);
});
test('909: private media timeline includes verified linked entries only, never source URLs',()=>{
 const timeline=safeMediaTimeline909([
  {status:'uploaded',verified_at:'2026-11-18T12:00:00Z',content_type:'image/jpeg',object_path:'private/path',bucket:'secret'},
  {status:'pending',verified_at:null,content_type:'video/mp4'},
  {status:'uploaded',verified_at:'2026-11-18T12:00:00Z',content_type:'application/pdf'}],
  'quote',quoteId,'Sample quote');
 assert.equal(timeline.length,1);assert.equal(timeline[0].public,false);
 assert.equal(timeline[0].staff_approved,false);assert.equal(JSON.stringify(timeline).includes('private/path'),false);
});
function mockSource({verified=true,reviewed=true,changed=false}={}){
 const oldFetch=globalThis.fetch;
 const now=new Date(),expires=new Date(now.getTime()+5*24*3600*1000).toISOString();
 let patchCount=0,queryCount=0;
 const q={id:quoteId,title:'Real accepted quote',customer_email:'client@example.ca',status:'sent',acceptance_status:null,
  sent_at:now.toISOString(),updated_at:now.toISOString(),accepted_at:null,declined_at:null,terms_expires_at:expires,
  structured_terms:{...terms,expires_at:expires},structured_terms_hash:null,accepted_terms_hash:null,lead_id:null};
 return (async()=>{
  q.structured_terms_hash=await hashStructuredQuoteTerms(q.structured_terms);
  const snapshot=await quoteSnapshot909(q,false,now.getTime());
  globalThis.fetch=async(url,opts={})=>{
   const u=String(url);queryCount++;
   const json=(a,status=200)=>new Response(JSON.stringify(a),{status,headers:{'Content-Type':'application/json'}});
   if(u.includes('/customer_auth_sessions?'))return json([{
     id:'ab001711-902e-4789-808a-ef1f9e0b6b77',customer_profile_id:profile,
     created_at:now.toISOString(),updated_at:now.toISOString(),expires_at:expires,revoked_at:null,
     customer_profile:{id:profile,email:'client@example.ca',full_name:'Test Client',
       is_active:true,email_verified_at:verified?now.toISOString():null}
   }]);
   if(u.includes('/quote_proposal_drafts?')&&opts.method==='PATCH'){
    patchCount++;
    if(changed)return json([]);
    return json([{...q,acceptance_status:'accepted',accepted_terms_hash:q.structured_terms_hash,accepted_at:now.toISOString()}]);
   }
   if(u.includes('/quote_proposal_drafts?'))return json([q]);
   if(u.includes('/customer_review_receipts_908?'))return json(reviewed?[{id:'c7000fd0-482b-48c5-aef7-4516a83f0ac2'}]:[]);
   if(u.includes('/customer_booking_plans_909?'))return json([]);
   if(u.includes('/bookings?'))return json([]);
   throw Error('Unexpected original source URL '+u);
  };
  return {q,snapshot,restore:()=>{globalThis.fetch=oldFetch},counts:()=>({patchCount,queryCount})};
 })();
}
test('909: acceptance requires exact review, verified session, explicit confirmation and cannot create payment',async()=>{
 const f=await mockSource({verified:true,reviewed:true});
 try{
  const response=await onRequestPost({request:reqBody({action:'accept_quote',quote_id:quoteId,
   revision:f.snapshot.revision,terms_hash:f.q.structured_terms_hash,confirmed:true}),env});
  const body=await response.json();assert.equal(response.status,200,JSON.stringify(body));
  assert.equal(body.accepted,true);assert.equal(body.booking_created,false);
  assert.equal(body.payment_attempted,false);assert.equal(f.counts().patchCount,1);
 }finally{f.restore();}
});
test('909: denial on missing quote review receipt (no mutation)',async()=>{
 const f=await mockSource({verified:true,reviewed:false});
 try{
  const r=await onRequestPost({request:reqBody({action:'accept_quote',quote_id:quoteId,
   revision:f.snapshot.revision,terms_hash:f.q.structured_terms_hash,confirmed:true}),env});
  assert.equal(r.status,409);assert.equal(f.counts().patchCount,0);
 }finally{f.restore();}
});
test('909: denial on unverified account (no mutation)',async()=>{
 const f=await mockSource({verified:false});
 try{
  const r=await onRequestPost({request:reqBody({action:'accept_quote',quote_id:quoteId,
   revision:f.snapshot.revision,terms_hash:f.q.structured_terms_hash,confirmed:true}),env});
  assert.equal(r.status,403);assert.equal(f.counts().patchCount,0);
 }finally{f.restore();}
});
test('909: denial on stale terms and no explicit confirmation',async()=>{
 const f=await mockSource();
 try{
  const bad=await onRequestPost({request:reqBody({action:'accept_quote',quote_id:quoteId,
   revision:'a'.repeat(64),terms_hash:f.q.structured_terms_hash,confirmed:true}),env});
  assert.equal(bad.status,409);
  const noConfirm=await onRequestPost({request:reqBody({action:'accept_quote',quote_id:quoteId,
   revision:f.snapshot.revision,terms_hash:f.q.structured_terms_hash,confirmed:false}),env});
  assert.equal(noConfirm.status,400);assert.equal(f.counts().patchCount,0);
 }finally{f.restore();}
});
test('909: reject quote acceptance concurrency mutation and cross-site request',async()=>{
 const f=await mockSource({changed:true});
 try{
  const lost=await onRequestPost({request:reqBody({action:'accept_quote',quote_id:quoteId,
   revision:f.snapshot.revision,terms_hash:f.q.structured_terms_hash,confirmed:true}),env});
  assert.equal(lost.status,409);
  const forged=new Request('https://rosiedazzlers.ca/api/client/booking_continuity_v909',{
   method:'POST',headers:{origin:'https://evil.example','content-type':'application/json'},body:'{}'});
  const denied=await onRequestPost({request:forged,env});
  assert.equal(denied.status,403);
 }finally{f.restore();}
});
test('909: browser route and retention of canonical checkout source',()=>{
 const account=readFileSync(new URL('../assets/customer-continuity-workbench-v909.mjs',import.meta.url),'utf8');
 const manual=readFileSync(new URL('../assets/ala-carte-booking-v889.js',import.meta.url),'utf8');
 const server=readFileSync(new URL('../functions/api/client/booking_continuity_v909.js',import.meta.url),'utf8');
 assert.match(account,/I accept these exact quote terms/);
 assert.match(manual,/restoreManualAccount909/);
 assert.match(server,/customer_review_receipts_908/);
 assert.match(server,/quote_proposal_drafts/);
 assert.doesNotMatch(server,/stripe\.com\/v1\/checkout/);
 assert.doesNotMatch(server,/object_path/);
});
