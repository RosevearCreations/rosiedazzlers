import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {CONTINUITY_SCHEMA_837,consentIncidentReadiness837} from '../assets/build837-consent-incident-continuity.mjs';
import {verifyOriginalJourney837,createOriginal837Reviewer,status837,ORIGINAL_REVIEW_SCHEMA_837}
  from './ql837_original_consent_incident_handoff.mjs';
import {onRequestGet,onRequestPost,onRequestOptions,onRequestPut,onRequestPatch,onRequestDelete}
  from '../functions/api/admin/comms_consent_incident_continuity_v837.js';
const read=p=>readFileSync(new URL(p,import.meta.url),'utf8');
const now=Date.parse('2026-11-10T07:00:00.000Z'),date=v=>new Date(now+v).toISOString();
const revision='a'.repeat(40);
const report=consentIncidentReadiness837({runtimeRevision:revision,generatedAt:date(0)});
assert.equal(report.schema,CONTINUITY_SCHEMA_837);
assert.equal(report.source.revisionClaim,revision);
assert.equal(consentIncidentReadiness837({runtimeRevision:'invalid'}).source.revisionClaim,null);
assert.throws(()=>consentIncidentReadiness837({generatedAt:'wrong'}),/HOLD_INVALID_SOURCE_CLOCK/);
assert.equal(report.journeys.length,3);assert.equal(report.gates.length,8);
assert.equal(report.outcome.messagesSent,0);assert.equal(report.outcome.state,'DISCONNECTED / HOLD');
assert.equal(report.outcome.outboundEligible,false);
assert.equal(report.incidents.archiveIsNotResolution,true);
assert.equal(report.incidents.sourceIncidentsMutated,0);
assert.equal(status837(['--status']).originalOperatorInstalled,false);
assert.throws(()=>status837(['--run']),/DENY_UNSUPERVISED/);
assert.throws(()=>createOriginal837Reviewer(),/HOLD_ORIGINAL_OPERATOR/);

const request={sourceId:'rosiedazzlers',sourceRevision:revision,
  correlationId:'corr-837-abcdef',sourceEventId:'evt-837-abcdef',recipientRef:'rref-837-abcdef',
  purpose:'incident',channel:'private_operator'};
const consent={sourceId:'rosiedazzlers',correlationId:request.correlationId,
  recipientRef:request.recipientRef,purpose:'incident',channel:'private_operator',
  originalCurrentConsentVerified:true,revoked:false,optedOut:false,
  validFrom:date(-600000),validUntil:date(600000),checkedAt:date(-5000)};
const providerReceipt={sourceEventId:request.sourceEventId,correlationId:request.correlationId,
  recipientRef:request.recipientRef,purpose:'incident',channel:'private_operator',
  originalProviderSignatureVerified:true,originalRecipientDeliveryVerified:true,
  outcome:'delivered',deliveredAt:date(-2000)};
const incident={sourceId:'rosiedazzlers',sourceEventId:request.sourceEventId,
  correlationId:request.correlationId,sourceIssueRef:'issue-837-abcdef',
  sourceBookingRef:'booking-837-abcdef',assigneeRef:'staff-837-abcdef',
  originalSourceLinkVerified:true,independentOperatorRouteApproved:true,
  assigneeAcknowledged:true,openedAt:date(-30_000),acknowledgedAt:date(-10_000),
  slaMinutes:15,status:'investigating',escalationOwnerVerified:false};
const examine=(req=request,c=consent,p=providerReceipt,i=incident)=>
  verifyOriginalJourney837({request:req,consent:c,providerReceipt:p,incident:i,now});
assert.equal(examine().ok,true);
assert.equal(examine().incidentStatus,'investigating');
for(const c of [{...consent,revoked:true},{...consent,optedOut:true},
  {...consent,validUntil:date(-1)},{...consent,checkedAt:date(-400000)},
  {...consent,channel:'sms'},{...consent,recipientRef:'other-recipient'},
  {...consent,originalCurrentConsentVerified:false}])
  assert.equal(examine(request,c).reason,'HOLD_CONSENT_EXPIRED_REVOKED_STALE_OR_MISMATCHED');
for(const p of [{...providerReceipt,outcome:'accepted'},
  {...providerReceipt,originalProviderSignatureVerified:false},
  {...providerReceipt,originalRecipientDeliveryVerified:false},
  {...providerReceipt,recipientRef:'different'},
  {...providerReceipt,deliveredAt:date(4000)}])
  assert.equal(examine(request,consent,p).reason,'HOLD_INDEPENDENT_PROVIDER_DELIVERY_UNVERIFIED');
for(const i of [{...incident,sourceBookingRef:null},
  {...incident,assigneeAcknowledged:false},{...incident,acknowledgedAt:date(-40000)},
  {...incident,independentOperatorRouteApproved:false}])
  assert.equal(examine(request,consent,providerReceipt,i).reason,'HOLD_ORIGINAL_INCIDENT_OWNER_AND_CHRONOLOGY');
assert.equal(examine({...request,sourceId:'icamp'}).ok,false);
assert.equal(examine({...request,channel:'sms'}).ok,false);
assert.equal(examine(request,consent,providerReceipt,{...incident,status:'resolved'}).reason,
  'HOLD_ACKNOWLEDGED_OR_ARCHIVED_NOT_RESOLVED');
assert.equal(examine(request,consent,providerReceipt,{...incident,openedAt:date(-3600000)}).reason,
  'HOLD_OVERDUE_WITHOUT_ESCALATION_OWNER');
assert.equal(examine(request,consent,providerReceipt,{...incident,openedAt:date(-3600000),
  escalationOwnerVerified:true}).overdue,true);
assert.equal(examine(request,consent,providerReceipt,{...incident,status:'resolved',
  originalSourceResolutionVerified:true,independentCommsResolutionApproved:true,
  resolutionEvidenceRef:'proof-837-abcdef'}).ok,true);
const serviceReq={...request,purpose:'service',channel:'email'};
assert.equal(examine(serviceReq,{...consent,purpose:'service',channel:'email'},
  {...providerReceipt,purpose:'service',channel:'email'},null).ok,true);
assert.equal(examine({...serviceReq,purpose:'marketing'},consent).ok,false);

const readCount=[];
const originalOperator={
  async reserveDurableReviewClaim(){readCount.push('reserve');return {fresh:true,inOrder:true,durablyRecorded:true};},
  async readOriginalCurrentConsent(){readCount.push('consent');return consent;},
  async readIndependentlyVerifiedProviderReceipt(){readCount.push('receipt');return providerReceipt;},
  async readOriginalSourceIncident(){readCount.push('incident');return incident;}
};
let reviewer=createOriginal837Reviewer({originalOperator,now:()=>now});
assert.equal((await reviewer.reviewOnce(request)).state,'ORIGINAL_EVIDENCE_REVIEWED_NO_REMOTE_MUTATION');
assert.deepEqual(readCount,['reserve','consent','receipt','incident']);
assert.equal((await reviewer.reviewOnce(request)).state,'HOLD_REPLAY_REVIEW_INSTANCE');
assert.equal(readCount.length,4);
reviewer=createOriginal837Reviewer({originalOperator:{...originalOperator,
  reserveDurableReviewClaim:async()=>({fresh:false,inOrder:false,durablyRecorded:false})},now:()=>now});
assert.equal((await reviewer.reviewOnce(request)).state,'HOLD_ORIGINAL_REPLAY_OR_SEQUENCE');
assert.equal(readCount.length,4);
reviewer=createOriginal837Reviewer({originalOperator:{...originalOperator,
  readOriginalCurrentConsent:async()=>{throw Error('private secret');}},now:()=>now});
const failure=await reviewer.reviewOnce(request);
assert.equal(failure.state,'HOLD_ORIGINAL_EVIDENCE_UNAVAILABLE');
assert.doesNotMatch(JSON.stringify(failure),/private secret/);

const req=new Request('https://rosiedazzlers.ca/api/admin/comms_consent_incident_continuity_v837',
  {headers:{Cookie:'rd_staff_session=private-fixture'}});
const env={SUPABASE_URL:'https://supabase-mock.invalid',SUPABASE_SERVICE_ROLE_KEY:'service-fixture',
  CF_PAGES_COMMIT_SHA:revision};
const originalFetch=globalThis.fetch;
let signed=false,role='detailer',allowed=true;const hits=[];
globalThis.fetch=async(input,init={})=>{
  const table=new URL(input).pathname.split('/').pop();hits.push(table);
  assert.equal(table,'staff_auth_sessions');assert.equal(init.method??'GET','GET');
  return Response.json(signed?[{expires_at:'2031-01-01T00:00:00Z',revoked_at:null,
    staff_user:{id:'00000000-0000-4000-8000-000000000099',role_code:role,is_active:true,
      can_manage_bookings:true,permissions_profile:{action_access:{
        'operations.assignment.manage':allowed}}}}]:[]);
};
try{
  assert.equal((await onRequestGet({request:req,env})).status,401);
  signed=true;assert.equal((await onRequestGet({request:req,env})).status,403);
  role='operations_manager';allowed=false;
  assert.equal((await onRequestGet({request:req,env})).status,403);
  allowed=true;
  const result=await onRequestGet({request:req,env});
  assert.equal(result.status,200);assert.match(result.headers.get('Cache-Control'),/no-store/);
  const body=await result.json();assert.equal(body.report.schema,CONTINUITY_SCHEMA_837);
  assert.equal(body.report.outcome.messagesSent,0);
  assert.equal(body.authority.customerReads,0);assert.equal(body.authority.providerCalls,0);
  assert.equal(body.authority.databaseWrites,0);assert.ok(hits.every(x=>x==='staff_auth_sessions'));
  assert.doesNotMatch(JSON.stringify(body),/service-fixture|private-fixture|00000000-0000-4000/);
  for(const mutation of [onRequestOptions,onRequestPost,onRequestPut,onRequestPatch,onRequestDelete])
    assert.equal((await mutation()).status,405);
}finally{globalThis.fetch=originalFetch;}
const html=read('../admin-handoff-acceptance.html');
assert.equal(html,read('../admin-handoff-acceptance/index.html'));
for(const id of ['build837Heading','build837Refresh','build837Journeys','build837Gates'])
  assert.match(html,new RegExp('id="'+id+'"'));
assert.match(html,/startConsentIncidentContinuity837\(\)/);
assert.match(html,/build837-consent-incident\.css/);
const ui=read('../assets/build837-consent-incident-ui.mjs');
assert.match(ui,/textContent/);assert.doesNotMatch(ui,/innerHTML|method:\s*['"]POST/);
assert.match(read('../assets/build837-consent-incident.css'),/focus-visible/);
assert.match(read('./current_booking_wizard_regression.sh'),/build837_consent_incident_continuity_test/);
assert.equal(ORIGINAL_REVIEW_SCHEMA_837,'rosie.comms.ql837.original-evidence-review.v1');
console.log('Build 837 source-only consent, no-send, original receipt, incident timeline, replay, staff authorization and mirrored UI PASS');
