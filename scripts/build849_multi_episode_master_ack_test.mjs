// Build 849 adversarial regression: repeat episodes, priority, signed Master
// schema preflight and no provider / Master side effects.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {generateKeyPairSync,sign} from 'node:crypto';
import {episodeIntegrity849,exceptionPriority849,schemaDigest849,canonicalAckPreflight849,validateAckPreflight849,MASTER_CONTRACT_849} from '../functions/api/_lib/jobday-integrity-849.js';
import {onRequest as endpoint} from '../functions/api/admin/jobday_integrity_849.js';
import {onRequestGet as source,onRequestPost as sourcePost} from '../functions/api/admin/master_social_intelligence_v849.js';
const booking='11111111-1111-4111-8111-111111111111',projectId='33333333-3333-4333-8333-333333333333',postId='44444444-4444-4444-8444-444444444444';
const ago=m=>new Date(Date.now()-m*60000).toISOString(),later=m=>new Date(Date.now()+m*60000).toISOString();
const uuid=()=>crypto.randomUUID(),row=(status,min,res={},req={})=>({id:uuid(),social_post_id:postId,status,platform:'instagram',created_at:ago(min),request_summary:req,response_summary:res});
const post={id:postId,booking_id:booking,platform:'instagram',status:'failed',source_type:'daip_job_media_tag',posted_at:ago(360),external_post_id:'IG123',external_post_url:'https://www.instagram.com/p/approved/',media_urls:['https://assets.rosiedazzlers.ca/gallery/approved.webp']};
const project={id:projectId,source_booking_id:booking,consent_status:'declined',public_publish_allowed:false};
const recall=row('recall_required',250),initial=row('recall_sla_closed_scoped',180),live1=row('provider_api_authenticated_post_visible',170,{authenticated_provider_read:true,provider_http_status:200});
const reopen1=row('recall_reopened_verified_provider_conflict',160,{previous_scoped_closure_superseded:true},{original_closure_id:initial.id,conflicting_provider_live_receipt_id:live1.id});
const provider1=row('provider_witness_verified_removed',130,{independent_witness_signature_valid:true,provider_result:'provider_delete_acknowledged',provider_http_status:204,observed_at:ago(131),external_post_id:post.external_post_id,external_post_url:post.external_post_url});
const cdn1=row('cdn_witness_verified_invalidation',125,{independent_witness_signature_valid:true,cache_purge_result:'cdn_purge_acknowledged',cache_purge_http_status:204,public_asset_url:post.media_urls[0],observed_at:ago(126)});
const reclose1=row('recall_reclosed_verified_recovery_848',120,{r2_head_after_reopen:'absent'},{reopen_id:reopen1.id,provider_removal_receipt_id:provider1.id,cdn_witness_receipt_id:cdn1.id});
const live2=row('provider_api_authenticated_post_visible',30,{authenticated_provider_read:true,provider_http_status:200});
const attempts=[recall,initial,live1,reopen1,provider1,cdn1,reclose1,live2],audits=[{id:uuid(),created_at:ago(240),safe_note:'Build 843 consent revoked: verified withdrawal'}];
const env={SUPABASE_URL:'https://example.supabase.co',SUPABASE_SERVICE_ROLE_KEY:'test-only',CF_PAGES_COMMIT_SHA:'b'.repeat(40),ADMIN_PASSWORD:'legacy'};
const {publicKey,privateKey}=generateKeyPairSync('ed25519');
const pin=publicKey.export({format:'jwk'}).x;
let signed=true,offline=false,externalCalls=0,externalMutations=0;
const reply=(value,status=200)=>new Response(JSON.stringify(value),{status,headers:{'Content-Type':'application/json'}});
const originalFetch=globalThis.fetch;
globalThis.fetch=async(uri,opt={})=>{
 const url=new URL(uri),table=url.pathname.split('/').pop(),method=opt.method||'GET';
 if(url.host!=='example.supabase.co'){externalCalls++;throw Error('Unexpected provider or Master external request');}
 if(table==='staff_auth_sessions')return reply(signed?[{id:uuid(),expires_at:'2030-01-01T00:00:00Z',revoked_at:null,staff_user:{id:uuid(),email:'owner@rosiedazzlers.ca',role_code:'admin',is_active:true,can_manage_staff:true,can_manage_promos:true,can_manage_bookings:true,permissions_profile:{action_access:{'operations.customer.manage':true,'operations.assignment.manage':true}}}}]:[]);
 if(offline)return reply({error:'offline'},503);
 if(table==='bookings')return reply([{id:booking,customer_name:'SECRET_CUSTOMER_849'}]);
 if(table==='creative_projects')return reply([project]);
 if(table==='social_post_queue')return reply(url.searchParams.get('select')==='id,platform,status'?[{id:postId,platform:'instagram',status:'failed'}]:[post]);
 if(table==='creative_project_audit'){
   if(method==='POST'){const a={...JSON.parse(opt.body),id:uuid(),created_at:new Date().toISOString()};audits.unshift(a);return reply([a]);}
   if(url.search.includes('safe_note=like.'))return reply(url.search.includes('Build%20843')?audits.filter(a=>a.safe_note.startsWith('Build 843 consent revoked:')):[]);
   return reply(audits);
 }
 if(table==='social_dispatch_attempts'){
   if(method==='POST'){const a={...JSON.parse(opt.body),id:uuid(),created_at:new Date().toISOString()};attempts.unshift(a);return reply([a]);}
   return reply(attempts);
 }
 externalMutations++;throw Error('Unexpected table '+table);
};
const req=(method='GET',data,auth=true)=>new Request('https://rosie.example/api/admin/jobday_integrity_849'+(method==='GET'?'?booking_id='+booking:''),{method,headers:{...(auth?{Cookie:'rd_staff_session=token'}:{}),...(data?{'Content-Type':'application/json'}:{})},...(data?{body:JSON.stringify({booking_id:booking,post_id:postId,owner_case_reference:'CASE-849',...data})}:{})});
const call=async data=>{const r=await endpoint({request:req('POST',data),env});return {status:r.status,data:await r.json()};};
const makePreflight=async()=>({version:1,kind:'runtime_ack_preflight_review',source_id:'rosiedazzlers',source_contract:MASTER_CONTRACT_849,source_revision:env.CF_PAGES_COMMIT_SHA,consumer_id:'ai-data-platform',receiver_id:'ai-data-social-evidence',decision:'schema_preflight_compatible_hold',permissions:'review_only_no_consumer_grant',schema_digest_sha256:await schemaDigest849(),master_case_reference:'CASE-849',nonce:'original_master_849_123456789',issued_at:ago(3),observed_at:ago(2),expires_at:later(10),signer_id:'independent-master-custodian',runtime_acknowledged:false,consumer_authorized:false});
const sig=r=>sign(null,Buffer.from(canonicalAckPreflight849(r)),privateKey).toString('base64url');
try{
 assert.equal(episodeIntegrity849(attempts).state,'CONFLICT_REOPEN_REQUIRED');
 assert.equal(episodeIntegrity849(attempts).integrity_gaps.length,0);
 assert.equal(exceptionPriority849(attempts).priority,'CRITICAL');
 assert.equal((await endpoint({request:req('GET',null,false),env})).status,401,'Unsigned owner access denied');
 let a=await (await endpoint({request:req(),env})).json();assert.equal(a.build,849);assert.equal(a.summary.priorities.CRITICAL,1);assert.equal(a.summary.repeat_episode_cases,0);assert.equal(a.cases[0].reopen_episode_count,1);
 assert.equal((await call({action:'reopen_repeat_verified_conflict',confirm_second_provider_live_evidence:true})).status,409,'Both owner acknowledgments required');
 a=await call({action:'reopen_repeat_verified_conflict',confirm_second_provider_live_evidence:true,acknowledge_revoked_consent_and_external_hold:true});assert.equal(a.status,200,JSON.stringify(a.data));assert.equal(a.data.episode_number,2);
 assert.equal(episodeIntegrity849(attempts).episode_count,2);assert.equal(episodeIntegrity849(attempts).state,'REOPENED_VERIFIED_PROVIDER_CONFLICT_HOLD');
 assert.equal((await call({action:'reopen_repeat_verified_conflict',confirm_second_provider_live_evidence:true,acknowledge_revoked_consent_and_external_hold:true})).status,409,'Duplicate multi-episode LIVE receipt must not reopen');
 a=await (await endpoint({request:req(),env})).json();assert.equal(a.summary.repeat_episode_cases,1);assert.equal(a.cases[0].reopen_episode_count,2);
 const bad=attempts.map(x=>({...x}));const current=bad.find(x=>x.status==='recall_reopened_verified_provider_conflict'&&x.request_summary?.episode_number===2);current.request_summary={...current.request_summary,previous_scoped_closure_id:'ffffffff-ffff-4fff-8fff-ffffffffffff'};
 assert.ok(episodeIntegrity849(bad).integrity_gaps.length>0,'Fabricated closure link fails integrity');
 assert.equal(exceptionPriority849(bad).priority,'CRITICAL');
 let p=await makePreflight(),signature=sig(p);
 assert.equal((await validateAckPreflight849(env,p,signature,{actor:'owner@rosiedazzlers.ca',ownerCase:'CASE-849'})).ok,false,'Missing public pin blocks');
 assert.equal((await call({action:'preflight_independent_master_runtime_ack',receipt:p,signature,confirm_independent_master_preflight_signature:true,acknowledge_no_master_runtime_ack_or_connection:true})).status,409);
 env.ROSIE_AIDATA_SOCIAL_ACK_PREFLIGHT_ED25519_PUBLIC_KEY=pin;
 for(const t of [
    {...p,source_revision:'a'.repeat(40)},
    {...p,schema_digest_sha256:'a'.repeat(64)},
    {...p,issued_at:ago(20),observed_at:ago(19)},
    {...p,runtime_acknowledged:true},
    {...p,consumer_authorized:true},
    {...p,consumer_id:'unapproved-third-party'}
 ])assert.equal((await call({action:'preflight_independent_master_runtime_ack',receipt:t,signature:sig(t),confirm_independent_master_preflight_signature:true,acknowledge_no_master_runtime_ack_or_connection:true})).status,409,'Invalid revision/digest/stale/permission or consumer must fail');
 assert.equal((await call({action:'preflight_independent_master_runtime_ack',receipt:p,signature:'not-a-signature',confirm_independent_master_preflight_signature:true,acknowledge_no_master_runtime_ack_or_connection:true})).status,409);
 a=await call({action:'preflight_independent_master_runtime_ack',receipt:p,signature,confirm_independent_master_preflight_signature:true,acknowledge_no_master_runtime_ack_or_connection:true});assert.equal(a.status,200,JSON.stringify(a.data));assert.equal(a.data.master_runtime_ack,false);assert.equal(a.data.master_connection,'HOLD');
 assert.equal((await call({action:'preflight_independent_master_runtime_ack',receipt:p,signature,confirm_independent_master_preflight_signature:true,acknowledge_no_master_runtime_ack_or_connection:true})).status,409,'Duplicate signed nonce blocked');
 const masterRequest=new Request('https://rosie.example/api/admin/master_social_intelligence_v849',{headers:{Cookie:'rd_staff_session=token'}});
 let sourceResponse=await source({request:masterRequest,env});assert.equal(sourceResponse.status,200);const projection=await sourceResponse.json();assert.equal(projection.projection.contract,MASTER_CONTRACT_849);assert.equal(projection.projection.counts.multi_episode_recall,1);assert.equal(projection.projection.counts.priority_critical,1);assert.equal(projection.projection.externalConnection,'HOLD');assert.equal(projection.authority.master_runtime_ack,'HOLD');assert.equal(JSON.stringify(projection).includes('SECRET_CUSTOMER_849'),false);assert.equal(JSON.stringify(projection).includes(booking),false);assert.equal(JSON.stringify(projection).includes(postId),false);assert.equal((await sourcePost()).status,405);
 offline=true;assert.equal((await endpoint({request:req(),env})).status,503);
 for(const path of ['admin-social.html','admin-social/index.html'])assert.match(readFileSync(new URL('../'+path,import.meta.url),'utf8'),/jobday-integrity-849\.js/);
 assert.equal(externalCalls,0);assert.equal(externalMutations,0);
 console.log('Build 849 PASS: multi-episode linked LIVE reopening, replay/chain integrity, owner marketing severity, independent signed Master ACK preflight schema/freshness/revision, privacy and no runtime connection.');
}finally{globalThis.fetch=originalFetch;}
