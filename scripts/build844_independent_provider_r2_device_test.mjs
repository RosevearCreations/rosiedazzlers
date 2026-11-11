import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {generateKeyPairSync,sign} from 'node:crypto';
import {canonical844,verifyPinnedWitness844} from '../functions/api/_lib/jobday-acceptance-844.js';
import {onRequest} from '../functions/api/admin/jobday_independent_acceptance_844.js';

const booking='11111111-1111-4111-8111-111111111111',projectId='33333333-3333-4333-8333-333333333333',postId='44444444-4444-4444-8444-444444444444';
const observedId='55555555-5555-4555-8555-555555555555',closureId='66666666-6666-4666-8666-666666666666',photoId='77777777-7777-4777-8777-777777777777';
const url='https://assets.rosiedazzlers.ca/gallery/approved.webp',externalUrl='https://www.instagram.com/p/approvedphoto/';
const generate=()=>{const {publicKey,privateKey}=generateKeyPairSync('ed25519');return {pin:publicKey.export({format:'jwk'}).x,sign:receipt=>sign(null,Buffer.from(canonical844(receipt.kind,receipt)),privateKey).toString('base64url')};};
const provider=generate(),device=generate();
let deleted=false,activeAssignment=false,otherBookingUse=false,requests=[],audits=[
  {id:'88888888-8888-4888-8888-888888888888',safe_note:'Build 843 consent revoked: customer_withdrawal; reference CASE-1; external takedown required.',created_at:new Date(Date.now()-240000).toISOString()},
  {id:observedId,safe_note:'Build 842 device observation: iphone | pass | accessibility checked | recovery checked | owner reference OWNER-OBSERVER | owner-attested, independent verification HOLD.',created_at:new Date(Date.now()-180000).toISOString()},
  {id:closureId,safe_note:`Build 843 mobile owner closure: iphone; observation ${observedId}; evidence OWNER-TEST; owner review OWNER-REVIEW; OWNER_OBSERVED_PASS; independent device verification HOLD.`,created_at:new Date(Date.now()-120000).toISOString()}
];
let posts=[{id:postId,booking_id:booking,source_type:'daip_job_media_tag',source_id:'22222222-2222-4222-8222-222222222222',platform:'instagram',status:'failed',posted_at:new Date().toISOString(),external_post_url:externalUrl,external_post_id:'provider123',media_urls:[url]}];
let proj={id:projectId,source_booking_id:booking,consent_status:'declined',public_publish_allowed:false},photo={id:photoId,r2_key:'gallery/approved.webp',source_status:'active'};
let attempts=[
  {id:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',social_post_id:postId,platform:'instagram',status:'recall_required',request_summary:{},response_summary:{},created_at:new Date().toISOString()},
  {id:'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',social_post_id:postId,platform:'instagram',status:'derivative_handoff_review',request_summary:{photo_id:photoId},response_summary:{public_url:url,project_id:projectId},created_at:new Date().toISOString()}
];
const env={SUPABASE_URL:'https://example.supabase.co',SUPABASE_SERVICE_ROLE_KEY:'test-role',ADMIN_PASSWORD:'test',ALLOW_LEGACY_ADMIN_FALLBACK:'true',ROSIE_PUBLIC_ASSETS_BUCKET:{head:async key=>deleted?null:{key},delete:async key=>{assert.equal(key,'gallery/approved.webp');assert.equal(photo.source_status,'archived','Quarantine before destructive R2 deletion');deleted=true;}}};
const response=(value,status=200)=>new Response(JSON.stringify(value),{status,headers:{'Content-Type':'application/json'}});
const ctx=(method='GET',body,authenticated=true)=>({env,request:new Request('https://rosie.test/api/admin/jobday_independent_acceptance_844'+(method==='GET'?`?booking_id=${booking}`:''),{method,headers:{...(authenticated?{'x-admin-password':'test'}:{}),...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify({booking_id:booking,...body})}:{})})});
const originalFetch=globalThis.fetch;
globalThis.fetch=async(url,opts={})=>{
  const u=new URL(url),table=u.pathname.split('/').pop(),method=opts.method||'GET',body=opts.body?JSON.parse(opts.body):null;requests.push({table,method,body});
  if(method==='POST'&&['social_dispatch_attempts','creative_project_audit'].includes(table)){
    const row={...body,id:crypto.randomUUID(),created_at:new Date().toISOString()};(table==='social_dispatch_attempts'?attempts:audits).unshift(row);return response([row]);
  }
  if(method==='PATCH'&&table==='app_media_library'){photo={...photo,...body};return response([photo]);}
  if(table==='bookings')return response([{id:booking,customer_name:'CONFIDENTIAL CUSTOMER'}]);
  if(table==='creative_projects')return response([proj]);
  if(table==='social_post_queue')return response(u.search.includes('media_urls=cs.')&&otherBookingUse?[...posts,{...posts[0],id:'cccccccc-cccc-4ccc-8ccc-cccccccccccc',booking_id:'dddddddd-dddd-4ddd-8ddd-dddddddddddd'}]:posts);
  if(table==='creative_project_audit')return response(u.search.includes('safe_note=like.')?audits.filter(a=>a.safe_note.startsWith('Build 843 consent revoked:')):audits);
  if(table==='social_dispatch_attempts')return response(attempts.filter(a=>a.social_post_id===postId));
  if(table==='app_media_library')return response([photo]);
  if(table==='app_media_assignments')return response(activeAssignment?[{id:'some-assignment'}]:[]);
  return response([],404);
};
const now=()=>new Date().toISOString();
const providerReceipt=()=>({version:1,kind:'provider',booking_id:booking,post_id:postId,platform:'instagram',external_post_id:'provider123',external_post_url:externalUrl,outcome:'post_removed',provider_request_id:'provider-request-id',provider_http_status:204,provider_result:'provider_delete_acknowledged',provider_response_sha256:'a'.repeat(64),observed_at:now(),nonce:'new_nonreplayable_nonce_12345',witness_id:'external-platform-reviewer',provider_access_authenticated:true});
const deviceReceipt=()=>({version:1,kind:'device',booking_id:booking,project_id:projectId,device_type:'iphone',observation_audit_id:observedId,owner_closure_audit_id:closureId,witness_id:'independent-device-reviewer',witness_reference_sha256:'b'.repeat(64),observed_at:now(),nonce:'independent_device_nonce_1234',accessibility_pass:true,recovery_pass:true});
try{
  assert.equal((await onRequest(ctx('GET',null,false))).status,401);
  const before=await (await onRequest(ctx())).json();assert.equal(before.provider_pin_enrolled,false);assert.equal(before.posts[0].provider_receipt,'RECALL_REQUIRED_PROVIDER_HOLD');assert.equal(JSON.stringify(before).includes('CONFIDENTIAL CUSTOMER'),false);
  const p=providerReceipt(),sig=provider.sign(p);
  const noPin=await onRequest(ctx('POST',{action:'admit_provider_receipt',post_id:postId,receipt:p,signature:sig}));assert.equal(noPin.status,409);assert.match((await noPin.json()).error,/not enrolled/i);
  env.ROSIE_SOCIAL_PROVIDER_WITNESS_ED25519_PUBLIC_KEY=provider.pin;
  assert.equal((await verifyPinnedWitness844(env,'provider',p,sig)).ok,true);
  const altered={...p,external_post_id:'attacker'};assert.equal((await onRequest(ctx('POST',{action:'admit_provider_receipt',post_id:postId,receipt:altered,signature:sig}))).status,409);
  const ambiguous={...p,provider_http_status:404,provider_result:'provider_delete_acknowledged'};assert.equal((await onRequest(ctx('POST',{action:'admit_provider_receipt',post_id:postId,receipt:ambiguous,signature:provider.sign(ambiguous)}))).status,409);
  const badSig=await onRequest(ctx('POST',{action:'admit_provider_receipt',post_id:postId,receipt:p,signature:device.sign(deviceReceipt())}));assert.equal(badSig.status,409);
  const received=await onRequest(ctx('POST',{action:'admit_provider_receipt',post_id:postId,receipt:p,signature:sig}));assert.equal(received.status,200,JSON.stringify(await received.clone().json()));assert.equal((await received.json()).provider_self_signed,false);
  assert.equal((await onRequest(ctx('POST',{action:'admit_provider_receipt',post_id:postId,receipt:p,signature:sig}))).status,409);
  const d=deviceReceipt(),dsig=device.sign(d);
  assert.equal((await onRequest(ctx('POST',{action:'admit_independent_device_review',receipt:d,signature:dsig}))).status,409);
  env.ROSIE_DEVICE_INDEPENDENT_WITNESS_ED25519_PUBLIC_KEY=device.pin;
  const reviewed=await onRequest(ctx('POST',{action:'admit_independent_device_review',receipt:d,signature:dsig}));assert.equal(reviewed.status,200,JSON.stringify(await reviewed.clone().json()));assert.equal((await reviewed.json()).original_hardware_independently_attested,false);
  assert.equal((await onRequest(ctx('POST',{action:'admit_independent_device_review',receipt:d,signature:dsig}))).status,409);
  let payload={action:'delete_public_r2_derivative',post_id:postId,owner_case_reference:'OWNER-RECALL-CASE',confirm_permanent_public_r2_deletion:true,acknowledge_cdn_and_platform_copies_remain:true};
  activeAssignment=true;assert.equal((await onRequest(ctx('POST',payload))).status,409);assert.equal(deleted,false);
  activeAssignment=false;otherBookingUse=true;assert.equal((await onRequest(ctx('POST',payload))).status,409);assert.equal(deleted,false);
  otherBookingUse=false;const removed=await onRequest(ctx('POST',payload));assert.equal(removed.status,200,JSON.stringify(await removed.clone().json()));const removal=await removed.json();assert.equal(removal.r2_origin_absent_verified,true);assert.equal(removal.external_platform_posts_deleted,false);assert.equal(photo.source_status,'archived');assert.equal(deleted,true);
  const after=await (await onRequest(ctx())).json();assert.equal(after.posts[0].public_derivative_recall,'R2_ORIGIN_DELETED_CDN_CACHE_HOLD');assert.equal(after.posts[0].provider_receipt,'PINNED_INDEPENDENT_VERIFIER_REPORTED_REMOVED');assert.equal(after.device_receipts.length,1);
  assert.equal((await onRequest(ctx('POST',payload))).status,409);
  assert.equal(requests.some(x=>x.table==='job_media'),false,'Never fetch private job media to run public recall.');
}finally{globalThis.fetch=originalFetch;}
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
for(const name of ['admin-social.html','admin-social/index.html'])assert.match(read(name),/jobday-independent-acceptance-844\.js/);
assert.match(read('assets/jobday-independent-acceptance-844.js'),/job844DeleteAck/);
console.log('Build 844 PASS: pinned independent provider and device signatures, replay denial, provider/removal boundary, shared-use checks, R2 HEAD+DELETE+archive, honest external/CDN HOLD and mirrored UI.');
