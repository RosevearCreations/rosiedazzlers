import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {generateKeyPairSync,sign} from 'node:crypto';
import {canonicalMaster847,validateMaster847,recallState847,MASTER_CONTRACT_847,REOPEN_STATUS_847} from '../functions/api/_lib/jobday-pilot-847.js';
import {onRequest as pilot847} from '../functions/api/admin/jobday_pilot_review_847.js';
import {onRequest as prior846} from '../functions/api/admin/jobday_recall_capabilities_846.js';
import {onRequestGet as source847,onRequestPost as postSource847} from '../functions/api/admin/master_social_intelligence_v847.js';

const booking='11111111-1111-4111-8111-111111111111',projectId='33333333-3333-4333-8333-333333333333',postId='44444444-4444-4444-8444-444444444444',asset='https://assets.rosiedazzlers.ca/gallery/approved.webp';
const env={SUPABASE_URL:'https://example.supabase.co',SUPABASE_SERVICE_ROLE_KEY:'test-role',ADMIN_PASSWORD:'test',ALLOW_LEGACY_ADMIN_FALLBACK:'true',CF_PAGES_COMMIT_SHA:'b'.repeat(40),INSTAGRAM_BUSINESS_ACCOUNT_ID:'IG_ACCOUNT',INSTAGRAM_ACCESS_TOKEN:'private',META_GRAPH_VERSION:'v20.0'};
const {publicKey,privateKey}=generateKeyPairSync('ed25519'),pin=publicKey.export({format:'jwk'}).x;
const now=Date.now(),ago=h=>new Date(now-h*3600e3).toISOString(),post={id:postId,booking_id:booking,source_type:'daip_job_media_tag',platform:'instagram',status:'failed',posted_at:ago(200),external_post_id:'IG123',external_post_url:'https://www.instagram.com/p/approved/',media_urls:[asset]};
const project={id:projectId,source_booking_id:booking,consent_status:'declined',public_publish_allowed:false};
const audits=[{id:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',created_at:ago(1),safe_note:'Build 845 real provider adapter enrollment: instagram; account IG_ACCOUNT; authenticated HTTP 200; response sha256 abc; owner case CASE-845;'},{id:'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',created_at:ago(1),safe_note:'Build 846 provider read capability: instagram; account IG_ACCOUNT; instagram_business_media_list_read; authenticated HTTP 200; response sha256 def;'},{id:'cccccccc-cccc-4ccc-8ccc-cccccccccccc',created_at:ago(90),safe_note:'Build 843 consent revoked: customer_withdrawal;'}];
const attempts=[{id:'dddddddd-dddd-4ddd-8ddd-dddddddddddd',social_post_id:postId,platform:'instagram',status:'recall_required',created_at:ago(80),request_summary:{},response_summary:{}},{id:'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',social_post_id:postId,platform:'instagram',status:'provider_witness_verified_removed',created_at:ago(5),request_summary:{},response_summary:{independent_witness_signature_valid:true,provider_result:'provider_delete_acknowledged',provider_http_status:204}},{id:'ffffffff-ffff-4fff-8fff-ffffffffffff',social_post_id:postId,platform:'instagram',status:'cdn_witness_verified_invalidation',created_at:ago(4),request_summary:{},response_summary:{independent_witness_signature_valid:true,cache_purge_result:'cdn_purge_acknowledged',public_asset_url:asset}},{id:'12121212-1212-4212-8212-121212121212',social_post_id:postId,platform:'instagram',status:'recall_sla_closed_scoped',created_at:ago(2),request_summary:{},response_summary:{disposition:'BREACHED_OWNER_TARGET'}}];
const reply=(x,status=200)=>new Response(JSON.stringify(x),{status,headers:{'Content-Type':'application/json'}});
let signed=true,offline=false,networkCalls=0;const originalFetch=globalThis.fetch;
globalThis.fetch=async(uri,opts={})=>{
  networkCalls++;const u=new URL(uri),table=u.pathname.split('/').pop(),method=opts.method||'GET';assert.equal(u.host,'example.supabase.co','Never use provider/AI Data network as an owner action in 847');
  if(table==='staff_auth_sessions')return reply(signed?[{id:'67676767-6767-4676-8676-676767676767',expires_at:'2030-01-01T00:00:00Z',revoked_at:null,staff_user:{id:'99999999-9999-4999-8999-999999999999',email:'owner@rosiedazzlers.ca',role_code:'admin',is_active:true,can_manage_staff:true,can_manage_promos:true,can_manage_bookings:true,permissions_profile:{action_access:{'operations.customer.manage':true,'operations.assignment.manage':true}}}}]:[]);
  if(offline)return reply({error:'offline'},503);
  if(method==='POST'&&table==='creative_project_audit'){const row={...JSON.parse(opts.body),id:crypto.randomUUID(),created_at:new Date().toISOString()};audits.unshift(row);return reply([row]);}
  if(method==='POST'&&table==='social_dispatch_attempts'){const row={...JSON.parse(opts.body),id:crypto.randomUUID(),created_at:new Date().toISOString()};attempts.unshift(row);return reply([row]);}
  if(table==='bookings')return reply([{id:booking,customer_private_name:'SECRET_PII_847'}]);
  if(table==='creative_projects')return reply([project]);
  if(table==='social_post_queue')return reply(u.searchParams.get('select')==='id,platform,status'?[{id:postId,platform:post.platform,status:post.status}]:[post]);
  if(table==='creative_project_audit')return reply(u.search.includes('safe_note=like.')?u.search.includes('Build%20843')?audits.filter(a=>a.safe_note.startsWith('Build 843 consent revoked:')):audits.filter(a=>a.safe_note.startsWith('Build 846 provider read capability:')):audits);
  if(table==='social_dispatch_attempts')return reply(u.searchParams.get('select')==='social_post_id,status,created_at'?attempts.map(a=>({social_post_id:a.social_post_id,status:a.status,created_at:a.created_at,request_summary:a.request_summary,response_summary:a.response_summary})):attempts);
  throw Error('Unexpected database path: '+uri);
};
const req=(method='GET',values,authed=true)=>new Request(`https://rosie.example/api/admin/jobday_pilot_review_847${method==='GET'?`?booking_id=${booking}`:''}`,{method,headers:{...(authed?{Cookie:'rd_staff_session=token'}:{}),...(values?{'Content-Type':'application/json'}:{})},...(values?{body:JSON.stringify({booking_id:booking,post_id:postId,owner_case_reference:'CASE-847',...values})}:{})});
const action=async values=>{const r=await pilot847({request:req('POST',values),env});return {status:r.status,body:await r.json()};};
const masterReceipt=()=>({version:1,kind:'source_contract_review',source_id:'rosiedazzlers',shell_id:'rosiedazzlers',source_contract:MASTER_CONTRACT_847,source_revision:env.CF_PAGES_COMMIT_SHA,consumer_id:'ai-data-platform',decision:'source_contract_accepted_counts_only',permissions:'read_redacted_counts_only_no_event',booking_id:booking,project_id:projectId,master_case_reference:'CASE-847',nonce:'source_contract_nonce_12345678',issued_at:ago(0.1),expires_at:new Date(now+3600000).toISOString(),signer_id:'independent-ai-data-custodian'});
const signature=r=>sign(null,Buffer.from(canonicalMaster847(r)),privateKey).toString('base64url');
try{
  assert.equal((await pilot847({request:req('GET',null,false),env})).status,401,'Original signed session is mandatory');
  assert.equal((await postSource847()).status,405);
  let overview=await (await pilot847({request:req(),env})).json();assert.equal(overview.cases[0].recall_state,'CLOSED_SCOPED_EXTERNAL_MIRRORS_HOLD');assert.equal(overview.master_signer_pin_enrolled,false);
  let a=await action({action:'review_original_provider_custodian_pilot'});assert.equal(a.status,409,'Owner two confirmations required');
  a=await action({action:'review_original_provider_custodian_pilot',confirm_original_owner_pilot_review:true,acknowledge_external_acceptance_hold:true});assert.equal(a.status,200,JSON.stringify(a.body));assert.equal(a.body.real_provider_custodian_acceptance,'HOLD');assert.deepEqual(a.body.source_gaps,[]);
  assert.equal((await action({action:'review_original_provider_custodian_pilot',confirm_original_owner_pilot_review:true,acknowledge_external_acceptance_hold:true})).status,409,'Pilot case replay blocked');
  const m=masterReceipt(),sig=signature(m);assert.equal((await validateMaster847(env,m,sig,{bookingId:booking,projectId,actor:'owner@rosiedazzlers.ca'})).ok,false,'No independent pin');
  assert.equal((await action({action:'admit_independent_master_contract',receipt:m,signature:sig,confirm_independent_master_receipt_review:true,acknowledge_master_runtime_hold:true})).status,409);
  env.ROSIE_AIDATA_SOCIAL_CONTRACT_ED25519_PUBLIC_KEY=pin;
  const drift={...m,source_revision:'a'.repeat(40)};assert.equal((await action({action:'admit_independent_master_contract',receipt:drift,signature:signature(drift),confirm_independent_master_receipt_review:true,acknowledge_master_runtime_hold:true})).status,409,'Revision drift blocked');
  const expired={...m,expires_at:ago(1)};assert.equal((await action({action:'admit_independent_master_contract',receipt:expired,signature:signature(expired),confirm_independent_master_receipt_review:true,acknowledge_master_runtime_hold:true})).status,409,'Expired receipt blocked');
  assert.equal((await action({action:'admit_independent_master_contract',receipt:m,signature:'bad',confirm_independent_master_receipt_review:true,acknowledge_master_runtime_hold:true})).status,409,'Bad signature blocked');
  a=await action({action:'admit_independent_master_contract',receipt:m,signature:sig,confirm_independent_master_receipt_review:true,acknowledge_master_runtime_hold:true});assert.equal(a.status,200,JSON.stringify(a.body));assert.equal(a.body.master_connection,'HOLD');assert.equal(a.body.master_runtime_consumer_ack,false);
  assert.equal((await action({action:'admit_independent_master_contract',receipt:m,signature:sig,confirm_independent_master_receipt_review:true,acknowledge_master_runtime_hold:true})).status,409,'Signed contract nonce replay blocked');
  const sourceRequest=new Request('https://rosie.example/api/admin/master_social_intelligence_v847',{headers:{Cookie:'rd_staff_session=token'}});
  let s=await source847({request:sourceRequest,env});assert.equal(s.status,200);let z=await s.json();assert.equal(z.projection.contract,MASTER_CONTRACT_847);assert.equal(z.projection.counts.recall_closed_scoped,1);assert.equal(z.authority.master_events_emitted,0);
  attempts.unshift({id:'abababab-abab-4bab-8bab-abababababab',social_post_id:postId,platform:'instagram',status:'provider_api_authenticated_post_visible',created_at:ago(1),request_summary:{},response_summary:{authenticated_provider_read:true,provider_http_status:200}});
  assert.equal(recallState847(attempts).state,'CONFLICT_REOPEN_REQUIRED');
  overview=await (await pilot847({request:req(),env})).json();assert.equal(overview.cases[0].recall_state,'CONFLICT_REOPEN_REQUIRED');
  let prior=await (await prior846({request:new Request(`https://rosie.example/api/admin/jobday_recall_capabilities_846?booking_id=${booking}`,{headers:{Cookie:'rd_staff_session=token'}}),env})).json();assert.equal(prior.posts[0].closure_state,'CONFLICT_REOPEN_REQUIRED');
  z=await (await source847({request:sourceRequest,env})).json();assert.equal(z.projection.counts.recall_closed_scoped,0);assert.equal(z.projection.counts.recall_open,1);assert.equal(z.projection.counts.recall_reopen_required,1);assert.equal(JSON.stringify(z).includes('SECRET_PII_847'),false);assert.equal(JSON.stringify(z).includes(booking),false);assert.equal(JSON.stringify(z).includes(postId),false);
  assert.equal((await action({action:'reopen_verified_conflict',confirm_reopen_verified_conflict:true})).status,409,'Both reopen confirmations required');
  a=await action({action:'reopen_verified_conflict',confirm_reopen_verified_conflict:true,acknowledge_takedown_unverified:true});assert.equal(a.status,200,JSON.stringify(a.body));assert.equal(a.body.recall_state,'REOPENED_VERIFIED_PROVIDER_CONFLICT_HOLD');
  assert.equal(attempts[0].status,REOPEN_STATUS_847);assert.equal((await action({action:'reopen_verified_conflict',confirm_reopen_verified_conflict:true,acknowledge_takedown_unverified:true})).status,409,'Reopen replay blocked');
  z=await (await source847({request:sourceRequest,env})).json();assert.equal(z.projection.counts.recall_reopened_verified,1);assert.equal(z.projection.counts.recall_closed_scoped,0);assert.equal(z.projection.externalConnection,'HOLD');
  offline=true;assert.equal((await source847({request:sourceRequest,env})).status,503,'Master source cannot silently go GREEN offline');
  for(const path of ['admin-social.html','admin-social/index.html'])assert.match(readFileSync(new URL(`../${path}`,import.meta.url),'utf8'),/jobday-pilot-review-847\.js/);
  assert.ok(networkCalls>0);console.log('Build 847 PASS: signed owner pilot, independently pinned Master contract review, exact deployed revision, replay/expiry denial, post-closure LIVE reopening, scoped source-count correction, privacy and HOLD.');
}finally{globalThis.fetch=originalFetch;}
