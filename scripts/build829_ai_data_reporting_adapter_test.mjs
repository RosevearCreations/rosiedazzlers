import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {reportingPreview829,REPORTING_SCHEMA_829,TARGET_EVENT_SCHEMA_829} from '../assets/build829-ai-data-adapter.mjs';
import {onRequestGet,onRequestPost,onRequestOptions} from '../functions/api/admin/master_shell_reporting_v829.js';

const read=path=>readFileSync(new URL(path,import.meta.url),'utf8');
const now=Date.parse('2026-11-09T14:00:00.000Z');
const a='aa00dffd-194d-4cb1-84bd-50a95ab44e84';
const b='bb00dffd-194d-4cb1-84bd-50a95ab44e85';
const c='cc00dffd-194d-4cb1-84bd-50a95ab44e86';
const id=n=>'00000000-0000-4000-8000-'+String(n).padStart(12,'0');
const when=days=>new Date(now+days*86400000).toISOString();
const evidence=[
  {id:id(3),event_kind:'module_review',module_id:'customer-experience-mobile',
    actor_staff_user_id:c,target_event_id:id(2),review_state:'owner_review_candidate',
    evidence_ref:'REVIEW-LOCAL-ONLY',recorded_at:when(-33)},
  {id:id(2),event_kind:'signoff',actor_staff_user_id:b,target_event_id:id(1),
    review_state:'accepted_for_review',evidence_ref:'SIGNOFF-LOCAL-ONLY',recorded_at:when(-34)},
  {id:id(1),event_kind:'observation',actor_staff_user_id:a,role_id:'customer',
    device_class:'phone',browser_class:'chrome',observed_outcome:'pass',
    observed_at:when(-36),evidence_ref:'DEVICE-LOCAL-ONLY',recorded_at:when(-35)},
];
const empty=reportingPreview829({events:[],sourceRevision:'bad',now});
assert.equal(empty.schema,REPORTING_SCHEMA_829);
assert.equal(empty.sourceId,'rosiedazzlers');
assert.equal(empty.shellId,'rosiedazzlers');
assert.equal(empty.tenantId,null);
assert.deepEqual(empty.approvedAudience,[]);
assert.equal(empty.currentDeploymentRevisionClaim,null);
assert.equal(empty.contractCompatibility.targetEventSchema,TARGET_EVENT_SCHEMA_829);
assert.deepEqual(empty.contractCompatibility.fieldsMapped,
  ['moduleId','readinessState','completionPercent','evidenceURI','expiresAt']);
assert.equal(empty.contractCompatibility.authorizedForOutbound,false);
assert.equal(empty.contractCompatibility.signedEventEnvelopeAvailable,false);
assert.equal(empty.contractCompatibility.consumerApproved,false);
assert.equal(empty.moduleScopeCount,45);
assert.equal(empty.requirementsDraft,39);
assert.equal(new Set(empty.scopes.map(x=>x.scopeId)).size,45);
assert.ok(empty.scopes.every(x=>x.readinessState==='UNKNOWN'&&
  x.completionPercent===null&&x.expiresAt===null&&x.evidenceURI===null&&
  x.approvedDenominator===null&&!x.consumerPayloadEligible));
assert.equal(empty.approvedDenominator,null);
assert.equal(empty.completionPercent,null);
assert.equal(empty.masterScoreCalculated,false);
assert.equal(empty.sourceConnectionState,'DISCONNECTED / HOLD');
assert.equal(empty.dataSentToAIPlatform,false);
assert.equal(empty.dataSentToCommsHub,false);
assert.equal(empty.canonicalHoldChanged,false);
const linked=reportingPreview829({events:evidence,sourceRevision:'a'.repeat(40),now});
const item=linked.scopes.find(x=>x.moduleId==='customer-experience-mobile');
assert.equal(linked.currentDeploymentRevisionClaim,'a'.repeat(40));
assert.equal(linked.revisionIndependentlyVerified,false);
assert.equal(linked.historicalEventReleaseRevisionAvailable,false);
assert.equal(item.localChainState,'LOCAL_CHAIN_LINKED_UNVERIFIED');
assert.equal(item.localReviewState,'owner_review_candidate');
assert.equal(item.localFreshnessAdvisory,'DRAFT_REVIEW_DUE');
assert.equal(item.readinessState,'UNKNOWN');
assert.equal(item.approvedEvidenceFreshness,'UNKNOWN');
assert.equal(linked.scopes.find(x=>x.moduleId==='customer-experience-desktop').localReviewState,'UNKNOWN');
for(const forbidden of [a,b,c,'REVIEW-LOCAL-ONLY','SIGNOFF-LOCAL-ONLY','DEVICE-LOCAL-ONLY'])
  assert.equal(JSON.stringify(linked).includes(forbidden),false,'Sensitive local record leaked into adapter: '+forbidden);
assert.equal(reportingPreview829({events:Array(101).fill(evidence[0]),now}).sourceWindowReturned,100);

const request=new Request('https://rosiedazzlers.ca/api/admin/master_shell_reporting_v829',
  {headers:{Cookie:'rd_staff_session=token'}});
const env={SUPABASE_URL:'https://supabase-mock.invalid',SUPABASE_SERVICE_ROLE_KEY:'mock',
  CF_PAGES_COMMIT_SHA:'c'.repeat(40)};
const originalFetch=globalThis.fetch;
let signed=false,role='detailer',allowed=true,sourceOk=true,requestedSource=0;
globalThis.fetch=async (url,options={})=>{
  const path=new URL(url).pathname;
  if(path.endsWith('/staff_auth_sessions'))return Response.json(signed?[{
    expires_at:'2031-01-01T00:00:00Z',revoked_at:null,staff_user:{
      id:a,role_code:role,is_active:true,can_manage_bookings:true,
      permissions_profile:{action_access:{'operations.customer.manage':true,
        'operations.assignment.manage':allowed}}}
  }]:[]);
  if(path.endsWith('/rosie_field_acceptance_events_v826')){
    requestedSource++;
    assert.equal(options.method,undefined,'Adapter may only use GET');
    assert.match(String(url),/limit=100/);
    assert.doesNotMatch(String(url),/customer_profile|booking|staff_private_note/i);
    return sourceOk?Response.json(evidence):Response.json({error:'offline'},{status:503});
  }
  throw Error('Unexpected network destination: '+url);
};
try{
  assert.equal((await onRequestOptions()).status,405);
  assert.equal((await onRequestPost()).status,405);
  assert.equal((await onRequestGet({request,env})).status,401);
  signed=true;assert.equal((await onRequestGet({request,env})).status,403);
  role='operations_manager';allowed=false;
  assert.equal((await onRequestGet({request,env})).status,403);
  assert.equal(requestedSource,0,'Unauthorized readers must not query source rows');
  allowed=true;
  const result=await onRequestGet({request,env});
  assert.equal(result.status,200);
  assert.match(result.headers.get('cache-control'),/no-store/);
  assert.equal(result.headers.get('access-control-allow-origin'),'none');
  const body=await result.json();
  assert.equal(body.preview.moduleScopeCount,45);
  assert.equal(body.preview.contractCompatibility.authorizedForOutbound,false);
  assert.equal(body.preview.dataSentToAIPlatform,false);
  assert.equal(body.preview.currentDeploymentRevisionClaim,'c'.repeat(40));
  assert.equal(body.preview.scopes.find(x=>x.moduleId==='customer-experience-mobile').localFreshnessAdvisory,
    'DRAFT_REVIEW_DUE');
  assert.equal(JSON.stringify(body).includes(a),false);
  sourceOk=false;
  const offline=await onRequestGet({request,env});
  assert.equal(offline.status,503);
  assert.equal(Object.hasOwn(await offline.json(),'preview'),false);
}finally{globalThis.fetch=originalFetch;}

const page=read('../admin-handoff-acceptance.html');
assert.equal(page,read('../admin-handoff-acceptance/index.html'));
for(const name of ['build829Reporting','build829Heading','build829Search','build829Filter',
  'build829Refresh','build829Status','build829Count','build829Rows'])
  assert.ok(page.includes('id="'+name+'"'),'Missing accessible 829 control '+name);
assert.match(page,/build829-reporting-ui\.mjs\?v=build829/);
assert.match(read('../assets/build829-reporting.css'),/@media\(max-width:650px\)/);
assert.doesNotMatch(read('../assets/build829-reporting-ui.mjs'),/localStorage|sessionStorage|method:\s*['"]POST|innerHTML/);
assert.doesNotMatch(read('../functions/api/admin/master_shell_reporting_v829.js'),/https:\/\/[^'"\s]+\.rosevear\.ai|\/api\/master-shell-ingestion/);
assert.match(read('./current_booking_wizard_regression.sh'),/build829_ai_data_reporting_adapter_test\.mjs/);
console.log('Build 829 PASS: source-only AI Data V1 compatibility, signed-supervisor GET, no PII or exported event, unknown scoring, no consumer grant or trust promotion.');
