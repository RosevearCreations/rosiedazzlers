import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {generateKeyPairSync,sign} from 'node:crypto';
import {canonicalFresh848,validateFresh848,recallState848,recoveryEvidence848,RECLOSE_848,MASTER_CONTRACT_848} from '../functions/api/_lib/jobday-recovery-848.js';
import {onRequest as recovery} from '../functions/api/admin/jobday_recovery_848.js';
import {onRequestGet as master, onRequestPost as masterPost} from '../functions/api/admin/master_social_intelligence_v848.js';
const booking='11111111-1111-4111-8111-111111111111',projectId='33333333-3333-4333-8333-333333333333',postId='44444444-4444-4444-8444-444444444444',r2key='gallery/approved.webp',asset='https://assets.rosiedazzlers.ca/gallery/approved.webp';
const now=Date.now(),ago=m=>new Date(now-m*60000).toISOString(),later=m=>new Date(now+m*60000).toISOString();
let r2Present=false,headed=0,mutated=0,providerCalls=0,offline=false,signed=true;
const env={SUPABASE_URL:'https://example.supabase.co',SUPABASE_SERVICE_ROLE_KEY:'test-only',CF_PAGES_COMMIT_SHA:'b'.repeat(40),ADMIN_PASSWORD:'legacy',ROSIE_PUBLIC_ASSETS_BUCKET:{head:async key=>{headed++;assert.equal(key,r2key);return r2Present?{etag:'exists'}:null;},delete:async()=>{mutated++;}}};
const post={id:postId,booking_id:booking,platform:'instagram',status:'failed',source_type:'daip_job_media_tag',posted_at:ago(180),external_post_id:'IG123',external_post_url:'https://www.instagram.com/p/approved/',media_urls:[asset]};
const project={id:projectId,source_booking_id:booking,consent_status:'declined',public_publish_allowed:false};
const audits=[{id:crypto.randomUUID(),created_at:ago(100),safe_note:'Build 843 consent revoked: customer withdrawal;'}];
const row=(status,minutes,response_summary={},request_summary={})=>({id:crypto.randomUUID(),social_post_id:postId,platform:post.platform,status,created_at:ago(minutes),response_summary,request_summary});
const attempts=[
 row('recall_required',120),
 row('public_derivative_r2_deleted',110,{r2_key:r2key,r2_head_after_delete:'absent',photo_studio_status:'archived'}),
 row('provider_witness_verified_removed',100,{independent_witness_signature_valid:true,provider_result:'provider_delete_acknowledged',provider_http_status:204}),
 row('cdn_witness_verified_invalidation',90,{independent_witness_signature_valid:true,cache_purge_result:'cdn_purge_acknowledged',cache_purge_http_status:204,public_asset_url:asset}),
 row('recall_sla_closed_scoped',80,{disposition:'WITHIN_OWNER_TARGET'}),
 row('provider_api_authenticated_post_visible',70,{authenticated_provider_read:true,provider_http_status:200}),
 row('recall_reopened_verified_provider_conflict',60,{previous_scoped_closure_superseded:true})
];
const reply=(v,status=200)=>new Response(JSON.stringify(v),{status,headers:{'Content-Type':'application/json'}});
const originalFetch=globalThis.fetch;
globalThis.fetch=async(uri,opts={})=>{
  const url=new URL(uri),table=url.pathname.split('/').pop(),method=opts.method||'GET';
  if(url.host!=='example.supabase.co'){providerCalls++;throw Error('Unexpected outbound provider/Master request');}
  if(table==='staff_auth_sessions')return reply(signed?[{id:crypto.randomUUID(),expires_at:'2030-01-01T00:00:00Z',revoked_at:null,staff_user:{id:crypto.randomUUID(),email:'owner@rosiedazzlers.ca',role_code:'admin',is_active:true,can_manage_staff:true,can_manage_promos:true,can_manage_bookings:true,permissions_profile:{action_access:{'operations.customer.manage':true,'operations.assignment.manage':true}}}}]:[]);
  if(offline)return reply({error:'offline'},503);
  if(table==='bookings')return reply([{id:booking,customer_name:'SECRET_CUSTOMER_848'}]);
  if(table==='creative_projects')return reply([project]);
  if(table==='social_post_queue')return reply(url.searchParams.get('select')==='id,platform,status'?[{id:postId,platform:post.platform,status:post.status}]:[post]);
  if(table==='creative_project_audit'){
    if(method==='POST'){const a={...JSON.parse(opts.body),id:crypto.randomUUID(),created_at:new Date().toISOString()};audits.unshift(a);return reply([a]);}
    return reply(url.search.includes('safe_note=like.')?audits.filter(a=>a.safe_note.startsWith('Build 843 consent revoked:')):audits);
  }
  if(table==='social_dispatch_attempts'){
    if(method==='POST'){const a={...JSON.parse(opts.body),id:crypto.randomUUID(),created_at:new Date().toISOString()};attempts.unshift(a);return reply([a]);}
    return reply(attempts);
  }
  throw Error('Unexpected database table: '+table);
};
const req=(method='GET',values,authed=true)=>new Request('https://rosie.example/api/admin/jobday_recovery_848'+(method==='GET'?'?booking_id='+booking:''),{method,headers:{...(authed?{Cookie:'rd_staff_session=token'}:{}),...(values?{'Content-Type':'application/json'}:{})},...(values?{body:JSON.stringify({booking_id:booking,post_id:postId,owner_case_reference:'CASE-848',...values})}:{})});
const action=async values=>{const r=await recovery({request:req('POST',values),env});return {status:r.status,body:await r.json()};};
const {publicKey,privateKey}=generateKeyPairSync('ed25519');
const pin=publicKey.export({format:'jwk'}).x;
const receipt=()=>({version:1,kind:'source_contract_freshness_review',source_id:'rosiedazzlers',shell_id:'rosiedazzlers',source_contract:MASTER_CONTRACT_848,source_revision:env.CF_PAGES_COMMIT_SHA,consumer_id:'ai-data-platform',decision:'freshness_reviewed_no_runtime_ack',permissions:'read_redacted_counts_only_no_event',booking_id:booking,project_id:projectId,master_case_reference:'CASE-848',nonce:'independent_master_nonce_848123',issued_at:ago(3),observed_at:ago(2),expires_at:later(15),signer_id:'independent-data-custodian'});
const signature=r=>sign(null,Buffer.from(canonicalFresh848(r)),privateKey).toString('base64url');
try{
  assert.equal((await recovery({request:req('GET',null,false),env})).status,401);
  let data=await (await recovery({request:req(),env})).json();assert.equal(data.summary.reopened,1);assert.equal(data.summary.reclosed,0);assert.equal(data.cases[0].recall_state,'REOPENED_VERIFIED_PROVIDER_CONFLICT_HOLD');
  assert.deepEqual(recoveryEvidence848(attempts,post,true).gaps.filter(x=>x.startsWith('FRESH_')).sort(),['FRESH_SIGNED_CDN_ACK_HOLD','FRESH_SIGNED_PROVIDER_REMOVAL_HOLD']);
  assert.equal((await action({action:'reclose_verified_recovery',confirm_fresh_independent_recovery:true,acknowledge_external_mirrors_unknown:true})).status,409,'Historical pre-reopen receipts must not close again');
  attempts.unshift(row('provider_witness_verified_removed',20,{external_post_id:post.external_post_id,external_post_url:post.external_post_url,independent_witness_signature_valid:true,provider_result:'provider_delete_acknowledged',provider_http_status:204,observed_at:ago(21)}));
  attempts.unshift(row('cdn_witness_verified_invalidation',15,{public_asset_url:asset,independent_witness_signature_valid:true,cache_purge_result:'cdn_purge_acknowledged',cache_purge_http_status:204,observed_at:ago(16)}));
  assert.equal((await action({action:'reclose_verified_recovery',confirm_fresh_independent_recovery:true})).status,409,'Both owner confirmations required');
  r2Present=true;assert.equal((await action({action:'reclose_verified_recovery',confirm_fresh_independent_recovery:true,acknowledge_external_mirrors_unknown:true})).status,409,'An actually present R2 asset blocks closure');
  r2Present=false;
  let a=await action({action:'reclose_verified_recovery',confirm_fresh_independent_recovery:true,acknowledge_external_mirrors_unknown:true});assert.equal(a.status,200,JSON.stringify(a.body));assert.equal(a.body.recall_state,'RECLOSED_VERIFIED_RECOVERY_EXTERNAL_MIRRORS_HOLD');assert.ok(headed>=2);assert.equal(mutated,0);assert.equal(providerCalls,0);
  assert.equal(recallState848(attempts).state,'RECLOSED_VERIFIED_RECOVERY_EXTERNAL_MIRRORS_HOLD');
  assert.equal((await action({action:'reclose_verified_recovery',confirm_fresh_independent_recovery:true,acknowledge_external_mirrors_unknown:true})).status,409,'No duplicate recovery episode');
  let z=await master({request:new Request('https://rosie.example/api/admin/master_social_intelligence_v848',{headers:{Cookie:'rd_staff_session=token'}}),env});assert.equal(z.status,200);let m=await z.json();assert.equal(m.projection.contract,MASTER_CONTRACT_848);assert.equal(m.projection.counts.recall_reclosed_verified,1);assert.equal(m.projection.counts.recall_closed_scoped,1);assert.equal(JSON.stringify(m).includes('SECRET_CUSTOMER_848'),false);assert.equal(JSON.stringify(m).includes(booking),false);assert.equal(JSON.stringify(m).includes(postId),false);assert.equal(m.projection.externalConnection,'HOLD');assert.equal((await masterPost()).status,405);
  const moreLive=row('provider_api_authenticated_post_visible',-1,{authenticated_provider_read:true,provider_http_status:200});moreLive.created_at=later(1);attempts.unshift(moreLive);
  assert.equal(recallState848(attempts,now+120000).state,'CONFLICT_REOPEN_REQUIRED','A later authenticated LIVE post invalidates recovered closure');
  m=await (await master({request:new Request('https://rosie.example/api/admin/master_social_intelligence_v848',{headers:{Cookie:'rd_staff_session=token'}}),env})).json();assert.equal(m.projection.counts.recall_closed_scoped,0);
  const r=receipt(),sig=signature(r);assert.equal((await validateFresh848(env,r,sig,{bookingId:booking,projectId,actor:'owner@rosiedazzlers.ca'})).ok,false,'Unenrolled Master pin blocks');
  env.ROSIE_AIDATA_SOCIAL_CONTRACT_ED25519_PUBLIC_KEY=pin;
  let wrong={...r,source_revision:'c'.repeat(40)};assert.equal((await action({action:'admit_independent_master_freshness',receipt:wrong,signature:signature(wrong),confirm_fresh_master_signature_review:true,acknowledge_master_runtime_hold:true})).status,409);
  wrong={...r,issued_at:ago(20),observed_at:ago(19)};assert.equal((await action({action:'admit_independent_master_freshness',receipt:wrong,signature:signature(wrong),confirm_fresh_master_signature_review:true,acknowledge_master_runtime_hold:true})).status,409);
  assert.equal((await action({action:'admit_independent_master_freshness',receipt:r,signature:'invalid',confirm_fresh_master_signature_review:true,acknowledge_master_runtime_hold:true})).status,409);
  a=await action({action:'admit_independent_master_freshness',receipt:r,signature:sig,confirm_fresh_master_signature_review:true,acknowledge_master_runtime_hold:true});assert.equal(a.status,200,JSON.stringify(a.body));assert.equal(a.body.master_connection,'HOLD');
  assert.equal((await action({action:'admit_independent_master_freshness',receipt:r,signature:sig,confirm_fresh_master_signature_review:true,acknowledge_master_runtime_hold:true})).status,409,'Signed replay denied');
  offline=true;assert.equal((await recovery({request:req(),env})).status,503);
  for(const path of ['admin-social.html','admin-social/index.html'])assert.match(readFileSync(new URL('../'+path,import.meta.url),'utf8'),/jobday-recovery-848\.js/);
  assert.ok(attempts.some(x=>x.status===RECLOSE_848));assert.equal(providerCalls,0);
  console.log('Build 848 PASS: original owner scope, fresh post-reopen independent provider/CDN evidence, original R2 HEAD recheck, future LIVE conflict, redacted Master counts, fresh signed Master receipt, replay/stale/revision denial, no external side effects, HOLD.');
}finally{globalThis.fetch=originalFetch;}
