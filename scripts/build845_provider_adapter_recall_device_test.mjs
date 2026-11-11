import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {providerSetup845,verifyLivePost845,ageLevel845} from '../functions/api/_lib/jobday-provider-845.js';
import {onRequest} from '../functions/api/admin/jobday_provider_pilot_845.js';

const booking='11111111-1111-4111-8111-111111111111',project='33333333-3333-4333-8333-333333333333',postId='44444444-4444-4444-8444-444444444444',deviceId='55555555-5555-4555-8555-555555555555';
const env={SUPABASE_URL:'https://example.supabase.co',SUPABASE_SERVICE_ROLE_KEY:'test-role',ADMIN_PASSWORD:'test',ALLOW_LEGACY_ADMIN_FALLBACK:'true'};
const posts=[{id:postId,booking_id:booking,source_type:'daip_job_media_tag',source_id:'22222222-2222-4222-8222-222222222222',platform:'instagram',status:'failed',posted_at:new Date().toISOString(),external_post_url:'https://www.instagram.com/p/demo/',external_post_id:'IG123'}];
const proj={id:project,source_booking_id:booking,consent_status:'declined',public_publish_allowed:false};
const audits=[{id:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',safe_note:'Build 843 consent revoked: customer_withdrawal; reference C1;',created_at:new Date().toISOString()},{id:deviceId,safe_note:'Build 844 independently signed device witness: iphone; owner closure 66666666-6666-4666-8666-666666666666; witness independent-custodian; witness nonce abc_1234_1234_1234_1234; signature verified; accessible/recovery pass; hardware attestation HOLD.',created_at:new Date().toISOString()}];
const attempts=[{id:'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',social_post_id:postId,status:'recall_required',created_at:new Date(Date.now()-26*3600e3).toISOString(),request_summary:{},response_summary:{}}];
const reply=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json'}});
const ctx=(method='GET',body,authorized=true)=>({env,request:new Request(`https://rosie.test/api/admin/jobday_provider_pilot_845${method==='GET'?`?booking_id=${booking}`:''}`,{method,headers:{...(authorized?{'x-admin-password':'test'}:{}),...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify({booking_id:booking,owner_case_reference:'CASE-845',...body})}:{})})});
let graphStatus=200,graphId='IG123',graphUrl='https://www.instagram.com/p/demo/',readCount=0,providerTokensObserved=[];
const originalFetch=globalThis.fetch;
globalThis.fetch=async(uri,options={})=>{
  const u=new URL(uri),table=u.pathname.split('/').pop(),method=options.method||'GET';
  if(u.hostname==='graph.facebook.com'){
    readCount++;
    assert.equal(method,'GET');assert.equal(options.redirect,'error');assert.equal(options.cache,'no-store');assert.equal(u.protocol,'https:');assert.equal(u.hostname,'graph.facebook.com');assert.equal(u.searchParams.has('access_token'),false);
    providerTokensObserved.push(options.headers.Authorization);
    if(u.pathname.endsWith('/IG_ACCOUNT'))return reply({id:'IG_ACCOUNT'},graphStatus);
    return reply({id:graphId,permalink:graphUrl},graphStatus);
  }
  const body=options.body?JSON.parse(options.body):null;
  if(method==='POST'&&table==='creative_project_audit'){const row={...body,id:crypto.randomUUID(),created_at:new Date().toISOString()};audits.unshift(row);return reply([row]);}
  if(method==='POST'&&table==='social_dispatch_attempts'){const row={...body,id:crypto.randomUUID(),created_at:new Date().toISOString()};attempts.unshift(row);return reply([row]);}
  if(table==='bookings')return reply([{id:booking,customer_name:'PRIVATE CUSTOMER'}]);
  if(table==='creative_projects')return reply([proj]);
  if(table==='social_post_queue')return reply(posts);
  if(table==='creative_project_audit')return reply(u.searchParams.toString().includes('safe_note=like.')?audits.filter(a=>a.safe_note.startsWith('Build 843 consent revoked:')):audits);
  if(table==='social_dispatch_attempts')return reply(attempts);
  return reply([],404);
};
const doPost=async(body)=>{const r=await onRequest(ctx('POST',body));return {response:r,data:await r.json()};};
try{
  assert.equal((await onRequest(ctx('GET',null,false))).status,401);
  let state=await (await onRequest(ctx())).json();
  assert.equal(state.adapters[1].configured,false);assert.equal(state.posts[0].recall_aging,'ESCALATED_24H');assert.equal(state.posts[0].recall_state,'RECALL_REQUIRED_PROVIDER_HOLD');
  assert.equal(JSON.stringify(state).includes('PRIVATE CUSTOMER'),false);
  assert.equal((await doPost({action:'enroll_adapter',platform:'instagram',confirm_read_only_provider_auth:true})).response.status,409);
  env.INSTAGRAM_BUSINESS_ACCOUNT_ID='IG_ACCOUNT';env.INSTAGRAM_ACCESS_TOKEN='SECRET_PROVIDER_TOKEN';env.META_GRAPH_VERSION='v20.0';
  assert.equal(providerSetup845(env,'instagram').configured,true);
  assert.equal((await doPost({action:'enroll_adapter',platform:'facebook',confirm_read_only_provider_auth:true})).response.status,409);
  graphStatus=401;assert.equal((await doPost({action:'enroll_adapter',platform:'instagram',confirm_read_only_provider_auth:true})).response.status,409);
  graphStatus=200;
  const enrolled=await doPost({action:'enroll_adapter',platform:'instagram',confirm_read_only_provider_auth:true});assert.equal(enrolled.response.status,200);assert.equal(enrolled.data.account_authenticated_read_only,true);
  const before=readCount;
  const bad=await doPost({action:'probe_live_post',post_id:postId,confirm_read_only_provider_auth:false});assert.equal(bad.response.status,409);assert.equal(readCount,before);
  graphId='OTHER';assert.equal((await doPost({action:'probe_live_post',post_id:postId,confirm_read_only_provider_auth:true})).response.status,409);graphId='IG123';
  graphUrl='https://evil.example/steal';assert.equal((await doPost({action:'probe_live_post',post_id:postId,confirm_read_only_provider_auth:true})).response.status,409);graphUrl='https://www.instagram.com/p/demo/';
  graphStatus=404;const missing=await doPost({action:'probe_live_post',post_id:postId,confirm_read_only_provider_auth:true});assert.equal(missing.response.status,409);assert.match(missing.data.error,/cannot be treated as deleted/);graphStatus=200;
  const verified=await doPost({action:'probe_live_post',post_id:postId,confirm_read_only_provider_auth:true});assert.equal(verified.response.status,200);assert.equal(verified.data.takedown_verified,false);assert.equal(verified.data.revoked_consent_still_blocked,true);
  const declined=await doPost({action:'escalate_recall',post_id:postId,escalation_route:'provider_support'});assert.equal(declined.response.status,409);
  const escalated=await doPost({action:'escalate_recall',post_id:postId,escalation_route:'provider_support',confirm_no_platform_takedown:true});assert.equal(escalated.response.status,200);assert.equal(escalated.data.owner_follow_up_required,true);
  assert.equal((await doPost({action:'escalate_recall',post_id:postId,escalation_route:'provider_support',confirm_no_platform_takedown:true})).response.status,409);
  const unsupportedWitness=await doPost({action:'owner_device_pilot',device_type:'ipad',independent_witness_audit_id:deviceId,confirm_original_device_review:true,confirm_independent_evidence_scope:true});assert.equal(unsupportedWitness.response.status,409);
  const pilot=await doPost({action:'owner_device_pilot',device_type:'iphone',independent_witness_audit_id:deviceId,confirm_original_device_review:true,confirm_independent_evidence_scope:true});assert.equal(pilot.response.status,200);assert.equal(pilot.data.global_device_acceptance,false);
  assert.equal((await doPost({action:'owner_device_pilot',device_type:'iphone',independent_witness_audit_id:deviceId,confirm_original_device_review:true,confirm_independent_evidence_scope:true})).response.status,409);
  state=await (await onRequest(ctx())).json();assert.equal(state.posts[0].recall_state,'OWNER_ESCALATION_OPEN');assert.equal(state.posts[0].provider_live_read,'AUTHENTICATED_API_200_READ_ONLY');assert.equal(state.device_pilots.length,1);
  assert.equal(JSON.stringify(state).includes('SECRET_PROVIDER_TOKEN'),false);
  assert.ok(providerTokensObserved.every(x=>x==='Bearer SECRET_PROVIDER_TOKEN'));
  assert.equal(ageLevel845(new Date(Date.now()-74*3600e3).toISOString()),'CRITICAL_72H');
  for(const filename of ['admin-social.html','admin-social/index.html'])assert.match(readFileSync(new URL(`../${filename}`,import.meta.url),'utf8'),/jobday-provider-pilot-845\.js/);
  console.log('Build 845 provider identity, anti-SSRF, 404 denial, consent recall, original-device pilot & UI mirrors: PASS');
}finally{globalThis.fetch=originalFetch;}
