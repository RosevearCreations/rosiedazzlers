import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {onRequest,validPlatformPostUrl843} from '../functions/api/admin/jobday_platform_recall_843.js';
import {sourceGate842} from '../functions/api/_lib/jobday-social-842.js';

const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const booking='11111111-1111-4111-8111-111111111111',source='22222222-2222-4222-8222-222222222222',project='33333333-3333-4333-8333-333333333333',postId='44444444-4444-4444-8444-444444444444';
const env={SUPABASE_URL:'https://example.supabase.co',SUPABASE_SERVICE_ROLE_KEY:'test-role',ADMIN_PASSWORD:'test',ALLOW_LEGACY_ADMIN_FALLBACK:'true'};
let posts=[{id:postId,booking_id:booking,source_type:'daip_job_media_tag',source_id:source,platform:'instagram',status:'posted',posted_at:new Date().toISOString(),external_post_url:'https://www.instagram.com/p/approvedphoto/',external_post_id:'platform123',media_urls:['https://assets.rosiedazzlers.ca/gallery/approved.webp']}];
let proj={id:project,source_booking_id:booking,consent_status:'approved_public',public_publish_allowed:true,content_package_status:'approved',before_after_applicability:'not_applicable'};
let audits=[{id:'99999999-9999-4999-8999-999999999999',created_at:new Date().toISOString(),safe_note:'Build 842 device observation: iphone | pass | accessibility checked | recovery checked | owner reference TEST-DEVICE | owner-attested, independent verification HOLD.'}];
let attempts=[],writes=[];
const originalFetch=globalThis.fetch;
const respond=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json'}});
function ctx(method='GET',body,authorized=true){return {env,request:new Request('https://rosie.test/api/admin/jobday_platform_recall_843'+(method==='GET'?'?booking_id='+booking:''),{method,headers:{...(authorized?{'x-admin-password':'test'}:{}),...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify({booking_id:booking,...body})}:{})})};}
globalThis.fetch=async(url,opts={})=>{
  const u=new URL(url),table=u.pathname.split('/').pop(),method=opts.method||'GET',body=opts.body?JSON.parse(opts.body):null;
  if(method==='POST'){writes.push({table,body});if(table==='creative_project_audit'){const row={...body,id:crypto.randomUUID(),created_at:new Date().toISOString()};audits.unshift(row);return respond([row]);}if(table==='social_dispatch_attempts'){const row={...body,id:crypto.randomUUID(),created_at:new Date().toISOString()};attempts.unshift(row);return respond([row]);}}
  if(method==='PATCH'){writes.push({table,body});if(table==='creative_projects'){proj={...proj,...body};return respond([proj]);}if(table==='social_post_queue'){posts=posts.map(p=>({...p,...body}));return respond(posts);}}
  if(table==='bookings')return respond([{id:booking,customer_name:'PRIVATE DATA'}]);
  if(table==='creative_projects')return respond([proj]);
  if(table==='social_post_queue')return respond(posts);
  if(table==='creative_project_audit'){if(u.search.includes('safe_note=like.'))return respond(audits.filter(a=>a.safe_note.startsWith('Build 843 consent revoked:')));return respond(audits);}
  if(table==='social_dispatch_attempts'){const status=u.searchParams.get('status');return respond(status?attempts.filter(a=>a.status===status.slice(3)):attempts);}
  if(table==='job_media')return respond([{id:source,booking_id:booking}]);
  if(table==='daip_project_media_assets')return respond([{id:'777',upload_status:'uploaded',story_review_status:'selected',consent_status:'approved_public',capture_stage:'during'}]);
  if(table==='daip_media_processing_jobs')return respond([]);
  if(table==='creative_project_sessions')return respond([{id:'888',approved_for_story:true}]);
  return respond([],404);
};
try{
  assert.equal(validPlatformPostUrl843('instagram','https://www.instagram.com/p/approvedphoto/'),true);
  for(const value of ['http://www.instagram.com/p/notsecure','https://instagram.com.attacker.test/p/abc','https://127.0.0.1/p/abc','https://www.facebook.com/p/abc','https://www.instagram.com/p/a?access_token=secret'])assert.equal(validPlatformPostUrl843('instagram',value),false,value);
  const denied=await onRequest(ctx('GET',undefined,false));assert.equal(denied.status,401);
  const wrong=await onRequest(ctx('POST',{action:'confirm_platform_post',post_id:postId,post_url:'https://www.facebook.com/post/abc',platform_post_id:'platform123',evidence_reference:'OWNER1',owner_opened_public_post:true}));assert.equal(wrong.status,400);assert.equal(writes.length,0);
  const observation=await onRequest(ctx('POST',{action:'confirm_platform_post',post_id:postId,post_url:'https://www.instagram.com/p/approvedphoto/',platform_post_id:'platform123',evidence_reference:'OWNER-PLATFORM1',owner_opened_public_post:true}));assert.equal(observation.status,200,JSON.stringify(await observation.clone().json()));assert.equal((await observation.json()).independently_verified,false);
  const close=await onRequest(ctx('POST',{action:'close_mobile_accessibility',device_type:'iphone',evidence_reference:'DEVICE-PASS1',owner_review_reference:'OWNER-READ1',accessible_journey_confirmed:true,manual_recovery_confirmed:true}));assert.equal(close.status,200,JSON.stringify(await close.clone().json()));assert.equal((await close.json()).independently_device_verified,false);
  const before=await onRequest(ctx());const prior=await before.json();assert.equal(prior.posts[0].platform_confirmation,'OWNER_OBSERVED_PROVIDER_UNVERIFIED');assert.equal(JSON.stringify(prior).includes('PRIVATE DATA'),false);
  const revoked=await onRequest(ctx('POST',{action:'revoke_public_consent',reason_code:'customer_withdrawal',evidence_reference:'CONSENT-WITHDRAWAL-1',confirm_recall_required:true}));assert.equal(revoked.status,200,JSON.stringify(await revoked.clone().json()));const result=await revoked.json();assert.equal(result.consent_revoked,true);assert.equal(result.provider_takedown_performed,false);assert.equal(result.queue_rows_failed,1);assert.equal(posts[0].status,'failed');assert.equal(proj.consent_status,'declined');assert.equal(proj.public_publish_allowed,false);
  const now=await (await onRequest(ctx())).json();assert.equal(now.consent.revoked,true);assert.equal(now.posts[0].platform_confirmation,'RECALL_REQUIRED_PLATFORM_TAKEDOWN_UNVERIFIED');assert.equal(now.posts[0].external_recall_required,true);
  const repeat=await onRequest(ctx('POST',{action:'confirm_platform_post',post_id:postId,post_url:'https://www.instagram.com/p/approvedphoto/',platform_post_id:'platform123',evidence_reference:'TEST',owner_opened_public_post:true}));assert.equal(repeat.status,409);
  // Even if someone later flips project flags without a new consent episode,
  // immutable Build 843 withdrawal history still blocks publish validation.
  proj={...proj,consent_status:'approved_public',public_publish_allowed:true};
  const gate=await sourceGate842(env,posts[0]);assert.equal(gate.ok,false);assert.match(gate.reason,/withdrawal|revoked/i);
}finally{globalThis.fetch=originalFetch;}

assert.match(read('assets/jobday-platform-recall-843.js'),/job843Revoke/);
for(const file of ['admin-social.html','admin-social/index.html'])assert.match(read(file),/jobday-platform-recall-843\.js/);
console.log('Build 843 PASS: allowlisted platform URL observations, owner mobile closure, durable consent revocation, unchanged independent provider HOLD and repeat-source publish denial.');
