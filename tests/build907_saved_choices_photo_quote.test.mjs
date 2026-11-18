import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {sanitizeSmartDraft907,parseSmartDraft907,reconcileSmartDraft907,SMART_DRAFT_TTL_MS907} from '../assets/smart-draft-v907.mjs';
import {cleanQuote907,sha256Receipt907,validOriginalUpload907,normalizedReceipts907} from '../functions/api/_lib/photo-quote-907.js';
import {onRequestPost as confirmUpload} from '../functions/api/public_photo_estimate_complete_v907.js';
import {onRequestPost as sendQuote} from '../functions/api/public_photo_quote_v907.js';
const get=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const uid='0ef47114-f98b-4b8a-8078-44b501193dd9',quoteId='f461df96-6234-4f6a-84ec-7bf6f480e640';
const uploadId='f2f4bc10-a48b-42ac-9c17-6f2a72ea3c47',proof='ab'.repeat(32);
const env={SUPABASE_URL:'https://fake-storage.supabase.co',SUPABASE_SERVICE_ROLE_KEY:'test_service_secret'};
const jr=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json'}});
const req=(path,body)=>new Request('https://rosiedazzlers.ca'+path,{method:'POST',
 headers:{origin:'https://rosiedazzlers.ca','Content-Type':'application/json'},body:JSON.stringify(body)});
const cat={packages:[{code:'interior_detail',name:'Interior',prices_cad:{small:195,mid:220,oversize:245},deposit_cad:100},
 {code:'complete_detail',name:'Complete',prices_cad:{small:319,mid:369,oversize:419},deposit_cad:100}],
 addons:[{code:'pet_removal',name:'Pet Hair Removal',category:'interior',prices_cad:{small:40,mid:50,oversize:60}},
 {code:'other',name:'Engine wash',category:'engine'}]};
const draft={size:'mid',goal:'interior',condition:'heavy',concerns:['pets','salt'],
 accepted_addons:['pet_removal','retired_item'],saved_at:1763400000000};
test('Smart choices are explicitly saved, 24h bounded, whitelisted and live-catalog rechecked',()=>{
 const d=sanitizeSmartDraft907({...draft,customer_email:'private@example.invalid',price_cad:9999,photo_url:'secret'});
 assert.deepEqual(Object.keys(d).sort(),['accepted_addons','concerns','condition','goal','saved_at','schema','size','version']);
 assert.equal(SMART_DRAFT_TTL_MS907,86400000);
 assert.equal(parseSmartDraft907(JSON.stringify(d),d.saved_at+3600000).size,'mid');
 assert.equal(parseSmartDraft907(JSON.stringify(d),d.saved_at+86400001),null);
 const r=reconcileSmartDraft907(d,cat,d.saved_at+1);
 assert.equal(r.recommendation.package_code,'interior_detail');
 assert.deepEqual(r.accepted_addons,['pet_removal']);
 assert.equal(r.requires_current_price_recheck,true);assert.equal(r.holds_reservation,false);
 assert.equal(sanitizeSmartDraft907({...draft,size:'incorrect'}),null);
 assert.equal(parseSmartDraft907('not json'),null);
});
test('Quote receipt input rejects duplicates, privileged fields, non-HTTPS and unsafe content',()=>{
 assert.equal(normalizedReceipts907([{intake_id:uploadId,proof}]).length,1);
 assert.equal(normalizedReceipts907([{intake_id:uploadId,proof},{intake_id:uploadId,proof}]),null);
 const x=cleanQuote907({client_request_id:uid,topic:'photo_estimate',full_name:'Demo Customer',
 email:'demo@example.test',message:'Request photos reviewed before final quote.',
 photo_receipts:[{intake_id:uploadId,proof}],
 photo_estimate_links:['https://files.example.test/photo','javascript:alert(1)'],
 requested_service_codes:['pet_hair','invalid spaces','pet_hair']});
 assert.equal(x.ok,true);assert.deepEqual(x.photo_estimate_links,['https://files.example.test/photo']);
 assert.deepEqual(x.requested_service_codes,['pet_hair']);
 assert.equal(cleanQuote907({...x,send:true}).ok,false);
 assert.equal(cleanQuote907({...x,photo_receipts:[{intake_id:uploadId,proof:'bad'}]}).ok,false);
});
test('Private original uploaded row expires; signed-only and linked media never count as evidence',async()=>{
 const row={id:uid,intake_id:uploadId,upload_proof_hash:await sha256Receipt907(proof),
  status:'uploaded',content_type:'image/jpeg',bucket:'job-media',
  object_path:'photo-estimates/sample.png',created_at:new Date().toISOString(),
  verified_at:new Date().toISOString(),lead_id:null,booking_id:null};
 assert.equal(validOriginalUpload907(row,{intake_id:uploadId,proof}),true);
 assert.equal(validOriginalUpload907({...row,status:'signed'},{intake_id:uploadId,proof}),false);
 assert.equal(validOriginalUpload907({...row,lead_id:quoteId},{intake_id:uploadId,proof}),false);
 assert.equal(validOriginalUpload907({...row,created_at:'2020-01-01T00:00:00Z'},{intake_id:uploadId,proof}),false);
});
test('Upload completion dry-run makes authenticated HEAD storage confirmation before DB uploaded status',async()=>{
 const before=globalThis.fetch,hash=await sha256Receipt907(proof),calls=[];
 try{
  globalThis.fetch=async(url,opts={})=>{
   const u=String(url);calls.push({u,method:opts.method||'GET'});
   if(u.includes('/rest/v1/photo_estimate_uploads?select='))return jr([{id:uid,intake_id:uploadId,
    upload_proof_hash:hash,created_at:new Date().toISOString(),status:'signed',lead_id:null,
    booking_id:null,bucket:'job-media',object_path:'photo-estimates/example.png'}]);
   if(u.includes('/storage/v1/object/authenticated/'))return new Response(null,{status:200});
   if(u.includes('/rest/v1/photo_estimate_uploads?id='))return jr([{id:uid,status:'uploaded'}]);
   throw Error('Unexpected fake network '+u);
  };
  const res=await confirmUpload({env,request:req('/api/public_photo_estimate_complete_v907',{intake_id:uploadId,proof})});
  const out=await res.json();assert.equal(res.status,200);assert.equal(out.original_upload_verified,true);
  assert.equal(out.staff_quote_linked,false);assert.equal(out.customer_media_published,false);
  assert.equal(calls.some(x=>x.method==='HEAD'&&x.u.includes('/storage/v1/object/authenticated/')),true);
  assert.equal(calls.some(x=>x.method==='PATCH'&&x.u.includes('/rest/v1/photo_estimate_uploads?id=')),true);
 }finally{globalThis.fetch=before;}
});
test('Upload completion fails closed when storage file was never actually received',async()=>{
 const before=globalThis.fetch,hash=await sha256Receipt907(proof),calls=[];
 try{
  globalThis.fetch=async(url,opts={})=>{
   calls.push({url:String(url),method:opts.method||'GET'});
   if(String(url).includes('/rest/v1/photo_estimate_uploads?select='))return jr([{id:uid,intake_id:uploadId,
    upload_proof_hash:hash,created_at:new Date().toISOString(),status:'signed',lead_id:null,
    booking_id:null,bucket:'job-media',object_path:'photo-estimates/example.png'}]);
   if(String(url).includes('/storage/v1/object/authenticated/'))return new Response(null,{status:404});
   throw Error('No update permitted');
  };
  const response=await confirmUpload({env,request:req('/api/public_photo_estimate_complete_v907',{intake_id:uploadId,proof})});
  assert.equal(response.status,409);assert.equal((await response.json()).ok,false);
  assert.equal(calls.some(x=>x.method==='PATCH'),false);
 }finally{globalThis.fetch=before;}
});
test('Original verified photo enters real staff lead and is linked without checkout or automatic send',async()=>{
 const before=globalThis.fetch,calls=[],hash=await sha256Receipt907(proof);
 const row={id:uid,intake_id:uploadId,upload_proof_hash:hash,created_at:new Date().toISOString(),
  verified_at:new Date().toISOString(),status:'uploaded',lead_id:null,booking_id:null,
  bucket:'job-media',object_path:'photo-estimates/example.png',content_type:'image/jpeg'};
 try{
  globalThis.fetch=async(url,opts={})=>{
   const u=String(url),method=opts.method||'GET';calls.push({url:u,method});
   if(u.includes('public_inquiry_leads?select=')&&method==='GET')return jr([]);
   if(u.includes('photo_estimate_uploads?select=')&&method==='GET')return jr([row]);
   if(u.includes('public_inquiry_leads?select=id,client_request_id')&&method==='POST')return jr([{id:quoteId,client_request_id:uid}]);
   if(u.includes('photo_estimate_uploads?id=')&&method==='PATCH')return jr([{...row,lead_id:quoteId}]);
   throw Error('Unexpected fake network '+u);
  };
  const response=await sendQuote({env,request:req('/api/public_photo_quote_v907',{
    client_request_id:uid,topic:'photo_estimate',full_name:'Demo Customer',email:'demo@example.test',
    message:'I would like Rosie to inspect these vehicle photos before quoting.',
    photo_receipts:[{intake_id:uploadId,proof}],requested_service_codes:['complete_detail']
  })});
  const out=await response.json();
  assert.equal(response.status,201);assert.equal(out.lead_recorded,true);
  assert.equal(out.linked_upload_count,1);assert.equal(out.linkage_verified,true);
  assert.equal(out.automatic_send,false);assert.equal(out.booking_created,false);
  assert.ok(calls.some(x=>x.url.includes('public_inquiry_leads?select=id')&&x.method==='POST'));
  assert.ok(calls.some(x=>x.url.includes('photo_estimate_uploads?id=')&&x.method==='PATCH'));
  assert.ok(!calls.some(x=>/\/api\/checkout|\/mail(?:[/?]|$)|\/sms(?:[/?]|$)|\/provider(?:[/?]|$)/i.test(new URL(x.url).pathname)));
 }finally{globalThis.fetch=before;}
});
test('Source files preserve prior checkout and explicit no-send contact boundaries',()=>{
 const smart=get('book-smart/index.html'),manual=get('book-custom/index.html'),planner=get('booking-planner.html');
 for(const x of ['saveSmart907','restoreSmart907','clearSmart907','SMART_DRAFT_KEY907'])assert.ok(smart.includes(x));
 for(const x of ['manualAddonSearch907','manualCategory907','requestManualQuote907','clearManualBasket907'])assert.ok(manual.includes(x));
 for(const x of ['photoQuoteBtn907','photo_estimate_complete_v907','quoteUploadReceipts907',
  'public_photo_quote_v907','/api/checkout'])assert.ok(planner.includes(x));
 const standalone=get('assets/ala-carte-booking-v889.js');
 for(const x of ['const selectable=approved&&permitted.has(item.code)','quoteRequested907',
  "booking_mode:'ala_carte'",'/api/public_photo_quote_v907'])assert.ok(standalone.includes(x));
 const sign=get('functions/api/public_photo_estimate_upload_url.js');
 for(const x of ['upload_proof','upload_proof_hash','recordUploadIntent','Same-origin estimate upload'])assert.ok(sign.includes(x));
 const quote=get('functions/api/public_photo_quote_v907.js');
 assert.doesNotMatch(quote,/dispatchNotificationThroughProvider|sendCustomerAuthEmail|\/api\/checkout|stripe\.com|paypal\.com/);
 const sql=get('supabase/migrations/20261117210000_build907_photo_quote_proof.sql');
 assert.match(sql,/enable row level security/);assert.match(sql,/revoke all.*anon,authenticated/);
 assert.match(sql,/rosie907_intake_unique/);assert.match(sql,/rosie907_quote_request_unique/);
});
