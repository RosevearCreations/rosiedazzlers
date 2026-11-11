import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {generateKeyPairSync,sign} from 'node:crypto';
import {canonicalCdn846,verifyCdnWitness846,recallPolicy846,masterSocialProjection846} from '../functions/api/_lib/jobday-capabilities-846.js';
import {onRequest} from '../functions/api/admin/jobday_recall_capabilities_846.js';
import {onRequestGet as masterGet,onRequestPost as masterPost} from '../functions/api/admin/master_social_intelligence_v846.js';

const booking='11111111-1111-4111-8111-111111111111',project='33333333-3333-4333-8333-333333333333',postId='44444444-4444-4444-8444-444444444444';
const account='IG_ACCOUNT',asset='https://assets.rosiedazzlers.ca/gallery/approved.webp';
const env={SUPABASE_URL:'https://example.supabase.co',SUPABASE_SERVICE_ROLE_KEY:'test-role',ADMIN_PASSWORD:'test',ALLOW_LEGACY_ADMIN_FALLBACK:'true',INSTAGRAM_BUSINESS_ACCOUNT_ID:account,INSTAGRAM_ACCESS_TOKEN:'SECRET_META_846',META_GRAPH_VERSION:'v20.0',CF_PAGES_COMMIT_SHA:'a'.repeat(40)};
const {publicKey,privateKey}=generateKeyPairSync('ed25519'),pin=publicKey.export({format:'jwk'}).x;
const post={id:postId,booking_id:booking,source_type:'daip_job_media_tag',platform:'instagram',source_id:'22222222-2222-4222-8222-222222222222',status:'failed',posted_at:new Date().toISOString(),external_post_url:'https://www.instagram.com/p/approved/',external_post_id:'IG123',media_urls:[asset]};
const recallAt=new Date(Date.now()-77*3600e3).toISOString();
const audits=[{id:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',created_at:new Date().toISOString(),safe_note:`Build 845 real provider adapter enrollment: instagram; account ${account}; authenticated HTTP 200; response sha256 ${'a'.repeat(64)}; owner case CASE-845; no posting or takedown.`},{id:'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',created_at:new Date().toISOString(),safe_note:'Build 843 consent revoked: customer_withdrawal; case CASE-123;'}];
const attempts=[{id:'cccccccc-cccc-4ccc-8ccc-cccccccccccc',social_post_id:postId,status:'recall_required',created_at:recallAt,response_summary:{},request_summary:{}},{id:'dddddddd-dddd-4ddd-8ddd-dddddddddddd',social_post_id:postId,status:'public_derivative_r2_deleted',created_at:new Date().toISOString(),request_summary:{photo_id:'88888888-8888-4888-8888-888888888888'},response_summary:{r2_head_after_delete:'absent',photo_studio_status:'archived',r2_key:'gallery/approved.webp'}}];
const projectRow={id:project,source_booking_id:booking,consent_status:'declined',public_publish_allowed:false};
const reply=(x,status=200)=>new Response(JSON.stringify(x),{status,headers:{'Content-Type':'application/json'}});
let graphStatus=200,graphId=account,graphList={data:[]},sessionSigned=false,dbOffline=false,externalCalls=0;
const originalFetch=globalThis.fetch;
globalThis.fetch=async(uri,opts={})=>{
  const u=new URL(uri),table=u.pathname.split('/').pop(),method=opts.method||'GET';
  if(u.hostname==='graph.facebook.com'){
    externalCalls++;assert.equal(method,'GET');assert.equal(opts.redirect,'error');assert.equal(opts.headers.Authorization,'Bearer SECRET_META_846');assert.equal(u.searchParams.has('access_token'),false);
    if(u.pathname.endsWith('/media'))return reply(graphList,graphStatus);
    return reply({id:graphId},graphStatus);
  }
  if(table==='staff_auth_sessions')return reply(sessionSigned?[{expires_at:'2031-01-01T00:00:00Z',revoked_at:null,staff_user:{id:'99999999-9999-4999-8999-999999999999',role_code:'operations_manager',is_active:true,can_manage_bookings:true,permissions_profile:{action_access:{'operations.customer.manage':true,'operations.assignment.manage':true}}}}]:[]);
  if(dbOffline)return reply({message:'offline'},503);
  const payload=opts.body?JSON.parse(opts.body):null;
  if(method==='POST'&&table==='creative_project_audit'){const row={...payload,id:crypto.randomUUID(),created_at:new Date().toISOString()};audits.unshift(row);return reply([row]);}
  if(method==='POST'&&table==='social_dispatch_attempts'){const row={...payload,id:crypto.randomUUID(),created_at:new Date().toISOString()};attempts.unshift(row);return reply([row]);}
  if(table==='bookings')return reply([{id:booking,private_customer_name:'DO_NOT_RETURN'}]);
  if(table==='creative_projects')return reply([projectRow]);
  if(table==='social_post_queue')return reply(u.searchParams.get('select')==='id,platform,status'?[{id:postId,platform:'instagram',status:'failed'}]:[post]);
  if(table==='creative_project_audit')return reply(u.search.includes('safe_note=like.')?u.search.includes('Build%20843')?audits.filter(a=>a.safe_note.startsWith('Build 843 consent revoked:')):audits.filter(a=>a.safe_note.startsWith('Build 846 provider read capability:')):audits);
  if(table==='social_dispatch_attempts')return reply(u.searchParams.get('select')==='social_post_id,status,created_at'?attempts.map(a=>({social_post_id:a.social_post_id,status:a.status,created_at:a.created_at})):attempts);
  throw Error('Unexpected external destination or table: '+uri);
};
const ownerCtx=(method='GET',body,authorized=true)=>({env,request:new Request(`https://rosie.test/api/admin/jobday_recall_capabilities_846${method==='GET'?`?booking_id=${booking}`:''}`,{method,headers:{...(authorized?{'x-admin-password':'test'}:{}),...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify({booking_id:booking,owner_case_reference:'CASE-846',...body})}:{})})});
const postAction=async b=>{const r=await onRequest(ownerCtx('POST',b));return {status:r.status,body:await r.json()};};
const cdn=()=>({version:1,kind:'cdn_invalidation',booking_id:booking,post_id:postId,platform:'instagram',public_asset_url:asset,edge_origin:'https://assets.rosiedazzlers.ca',cache_purge_operation_id:'purge_12345',cache_purge_http_status:204,cache_purge_result:'cdn_purge_acknowledged',cache_response_sha256:'b'.repeat(64),observed_at:new Date().toISOString(),nonce:'cdn_nonce_unique_1234567890123',witness_id:'independent-cdn-verifier',authenticated_edge_request:true});
const signature=r=>sign(null,Buffer.from(canonicalCdn846(r)),privateKey).toString('base64url');
const closeRequest={action:'close_recall_sla',post_id:postId,confirm_scoped_closure_only:true,acknowledge_external_mirrors_unknown:true};
try{
  assert.equal((await onRequest(ownerCtx('GET',null,false))).status,401);
  assert.equal((await masterPost()).status,405);
  assert.equal((await masterGet({request:new Request('https://rosie.test/api/admin/master_social_intelligence_v846',{headers:{Cookie:'rd_staff_session=token'}}),env})).status,401);
  assert.equal(recallPolicy846({ROSIE_RECALL_SLA_TARGET_HOURS:'169'}).configured,false);assert.equal(recallPolicy846({ROSIE_RECALL_SLA_TARGET_HOURS:'24'}).target_hours,24);
  let view=await (await onRequest(ownerCtx())).json();assert.equal(view.recall_policy.configured,false);assert.equal(view.posts[0].recall_aging,'CRITICAL_72H');
  assert.equal((await postAction({action:'verify_read_capability',platform:'instagram'})).status,409);
  graphStatus=403;assert.equal((await postAction({action:'verify_read_capability',platform:'instagram',confirm_read_only_provider_check:true})).status,409);graphStatus=200;
  graphId='wrong';assert.equal((await postAction({action:'verify_read_capability',platform:'instagram',confirm_read_only_provider_check:true})).status,409);graphId=account;
  graphList={data:[{id:'IG_OTHER'}, {id:'IG_OTHER_2'}]};assert.equal((await postAction({action:'verify_read_capability',platform:'instagram',confirm_read_only_provider_check:true})).status,409);graphList={data:[]};
  const verified=await postAction({action:'verify_read_capability',platform:'instagram',confirm_read_only_provider_check:true});assert.equal(verified.status,200);assert.equal(verified.body.publish_permission_verified,false);assert.equal(verified.body.takedown_permission_verified,false);
  const c=cdn(),sig=signature(c);
  assert.equal((await postAction({action:'admit_cdn_invalidation_witness',post_id:postId,receipt:c,signature:sig})).status,409);
  const changed={...c,public_asset_url:'https://evil.example/private.jpg'};assert.equal((await postAction({action:'admit_cdn_invalidation_witness',post_id:postId,receipt:changed,signature:signature(changed),confirm_independent_edge_evidence:true})).status,409);
  assert.equal((await postAction({action:'admit_cdn_invalidation_witness',post_id:postId,receipt:c,signature:sig,confirm_independent_edge_evidence:true})).status,409);
  env.ROSIE_SOCIAL_CDN_WITNESS_ED25519_PUBLIC_KEY=pin;
  assert.equal((await verifyCdnWitness846(env,c,sig)).ok,true);
  assert.equal((await postAction({action:'admit_cdn_invalidation_witness',post_id:postId,receipt:c,signature:'not_a_signature',confirm_independent_edge_evidence:true})).status,409);
  const admitted=await postAction({action:'admit_cdn_invalidation_witness',post_id:postId,receipt:c,signature:sig,confirm_independent_edge_evidence:true});assert.equal(admitted.status,200);assert.equal(admitted.body.all_global_edges_verified,false);
  assert.equal((await postAction({action:'admit_cdn_invalidation_witness',post_id:postId,receipt:c,signature:sig,confirm_independent_edge_evidence:true})).status,409);
  assert.equal((await postAction(closeRequest)).status,409,'policy must be configured');env.ROSIE_RECALL_SLA_TARGET_HOURS='24';
  assert.equal((await postAction(closeRequest)).status,409,'provider signed removal missing');
  attempts.unshift({id:crypto.randomUUID(),social_post_id:postId,status:'provider_witness_verified_removed',created_at:new Date().toISOString(),response_summary:{independent_witness_signature_valid:true,provider_result:'provider_delete_acknowledged',provider_http_status:204},request_summary:{}});
  const closed=await postAction(closeRequest);assert.equal(closed.status,200,JSON.stringify(closed.body));assert.equal(closed.body.disposition,'BREACHED_OWNER_TARGET');assert.equal(closed.body.external_mirrors_verified,false);
  assert.equal((await postAction(closeRequest)).status,409,'closure replay denied');
  view=await (await onRequest(ownerCtx())).json();assert.equal(view.posts[0].closure_state,'SCOPED_EVIDENCE_CLOSED_EXTERNAL_MIRRORS_UNKNOWN');
  sessionSigned=true;
  const masterRequest=new Request('https://rosie.test/api/admin/master_social_intelligence_v846',{headers:{Cookie:'rd_staff_session=token'}});
  const master=await masterGet({request:masterRequest,env});assert.equal(master.status,200);const m=await master.json();
  assert.equal(m.projection.sourceId,'rosiedazzlers');assert.equal(m.projection.counts.recall_closed_scoped,1);assert.equal(m.projection.completionPercent,null);assert.deepEqual(m.projection.approvedAudience,[]);assert.equal(m.authority.master_events_emitted,0);assert.equal(m.projection.externalConnection,'HOLD');
  for(const forbidden of [booking,postId,account,'SECRET_META_846','DO_NOT_RETURN',asset,project,'CASE-846'])assert.equal(JSON.stringify(m).includes(forbidden),false,`Source privacy leak ${forbidden}`);
  dbOffline=true;assert.equal((await masterGet({request:masterRequest,env})).status,503);
  const pure=masterSocialProjection846({posts:[{id:postId}],attempts:[],capabilityAudits:[],now:new Date().toISOString(),truncated:true});assert.equal(pure.sourceWindowComplete,false);assert.equal(pure.consumerPayloadEligible,false);
  assert.ok(externalCalls>=4,'Read-only provider was contacted only inside explicit owner actions');
  for(const route of ['admin-social.html','admin-social/index.html'])assert.match(readFileSync(new URL(`../${route}`,import.meta.url),'utf8'),/jobday-recall-capability-846\.js/);
  console.log('Build 846 PASS: authenticated provider capability/permissions HOLD, independent CDN Ed25519, replay/conflict/SLA BREACH, scoped closure, signed-supervisor redacted Master projection, no external connection.');
}finally{globalThis.fetch=originalFetch;}
