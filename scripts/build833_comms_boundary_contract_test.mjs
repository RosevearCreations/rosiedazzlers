import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {COMMS_SCHEMA_833,COMMS_ROUTE_DRAFTS_833,reviewCommsBoundary833}
  from '../assets/build833-comms-boundary.mjs';
import {onRequestGet,onRequestPost,onRequestOptions,onRequestPut,onRequestPatch,onRequestDelete}
  from '../functions/api/admin/comms_boundary_review_v833.js';
const read=file=>readFileSync(new URL(file,import.meta.url),'utf8');
const uuid=n=>'00000000-0000-4000-8000-'+String(n).padStart(12,'0');
const now='2026-11-09T20:00:00.000Z';
const issue=(n=1,overrides={})=>({id:uuid(n),category:'utilities_restriction',status:'pending_review',
  submitted_at:now,customer_description:'SECRET CUSTOMER ADDRESS',
  booking_id:uuid(500),customer_profile_id:uuid(501),...overrides});
const handoff=(n=2,overrides={})=>({id:uuid(n),channel:'sms',purpose:'service',
  outcome:'planned_not_contacted',recorded_at:now,
  staff_report_unverified:true,provider_delivery_verified:false,outbound_dispatched:false,
  staff_actor_name:'SECRET STAFF',note_summary:'SECRET NOTES',customer_profile_id:uuid(501),...overrides});
const empty=reviewCommsBoundary833({sampledAt:now});
assert.equal(empty.schema,COMMS_SCHEMA_833);
assert.equal(empty.sourceConnectionState,'DISCONNECTED / HOLD');
assert.equal(empty.rows.length,5);
assert.equal(COMMS_ROUTE_DRAFTS_833.length,5);
assert.equal(new Set(empty.rows.map(x=>x.id)).size,5);
assert.equal(empty.canonicalTenantBoundary,'owned_business_legacy');
assert.equal(empty.ql364HealthOnly,true);
assert.equal(empty.sourceManifestIsNotAuthentication,true);
assert.equal(empty.approvedRoutingContracts,0);
assert.equal(empty.noCurrentRecipientOrPurposeConsentEstablished,true);
for(const k of ['fanOutAuthorized','manyToManyAuthorized','sourceSignerVerified',
  'independentOwnerTestGrantVerified','oneUsePrivateGetVerified',
  'customerMessagesSent','staffMessagesSent','remoteIncidentsCreated','remoteTasksCreated',
  'masterEventsPublished','sourceRecordsMutated','receiverActivated','canonicalHoldChanged'])
  assert.equal(empty[k],false,k);
for(const route of empty.rows){
  assert.equal(route.contractReviewState,'HOLD');assert.equal(route.outboundEligible,false);
  assert.equal(route.currentConsentVerified,false);assert.equal(route.authorizedIncidentWrite,false);
  assert.match(route.next,/^\/admin-/);assert.ok(route.authority.length>40);
}
const local=reviewCommsBoundary833({issues:[issue()],handoffs:[handoff()],sampledAt:now,
  sourceRevision:'a'.repeat(40)});
assert.equal(local.sourceCounts.issues,1);
assert.equal(local.issueStatuses.pending_review,1);
assert.equal(local.issueCategories.utilities_restriction,1);
assert.equal(local.historicalStaffReportedHandoffs.planned_not_contacted,1);
assert.equal(local.historicalChannel.sms,1);
assert.equal(local.sourceRevisionClaim,'a'.repeat(40));
assert.equal(local.revisionIndependentlyVerified,false);
assert.doesNotMatch(JSON.stringify(local),/SECRET CUSTOMER ADDRESS|SECRET STAFF|SECRET NOTES|00000000-0000-4000/);
assert.throws(()=>reviewCommsBoundary833({issues:[issue(),issue()],sampledAt:now}),/duplicate/);
assert.throws(()=>reviewCommsBoundary833({issues:[issue(1,{category:'unknown'})],sampledAt:now}),/Malformed/);
assert.throws(()=>reviewCommsBoundary833({issues:[issue(1,{submitted_at:'bad'})],sampledAt:now}),/Malformed/);
assert.throws(()=>reviewCommsBoundary833({handoffs:[handoff(2,{outbound_dispatched:true})],sampledAt:now}),/promoted/);
assert.throws(()=>reviewCommsBoundary833({handoffs:[handoff(2,{provider_delivery_verified:true})],sampledAt:now}),/promoted/);
assert.throws(()=>reviewCommsBoundary833({handoffs:[handoff(),handoff()],sampledAt:now}),/Malformed or promoted/);
assert.throws(()=>reviewCommsBoundary833({issues:Array.from({length:101},(_,n)=>issue(n+10)),sampledAt:now}),/Bounded/);
assert.equal(reviewCommsBoundary833({issues:Array.from({length:100},(_,n)=>issue(n+10)),sampledAt:now}).sourceWindowsAtCap,true);

const request=new Request('https://rosiedazzlers.ca/api/admin/comms_boundary_review_v833',
  {headers:{Cookie:'rd_staff_session=token'}});
const env={SUPABASE_URL:'https://supabase-mock.invalid',SUPABASE_SERVICE_ROLE_KEY:'service-only',
  CF_PAGES_COMMIT_SHA:'b'.repeat(40)};
let signed=false,role='detailer',assignment=true,sourceOkay=true;
const reads=[];
const oldFetch=globalThis.fetch;
globalThis.fetch=async(input,init={})=>{
  const url=new URL(input),table=url.pathname.split('/').pop();
  reads.push({table,method:init.method||'GET',search:url.search,headers:init.headers});
  assert.equal(init.method||'GET','GET');
  if(table==='staff_auth_sessions')return Response.json(signed?[{expires_at:'2031-01-01T00:00:00Z',
    revoked_at:null,staff_user:{id:uuid(999),role_code:role,is_active:true,
      can_manage_bookings:true,permissions_profile:{action_access:{
        'operations.customer.manage':true,'operations.assignment.manage':assignment}}}}]:[]);
  if(table==='customer_worksite_issues_v811')return sourceOkay?Response.json([issue()]):Response.json({error:'offline'},{status:503});
  if(table==='customer_communication_handoff_audit')return Response.json([handoff()]);
  throw Error('Unexpected private read '+table);
};
try{
  assert.equal((await onRequestGet({request,env})).status,401);
  signed=true;assert.equal((await onRequestGet({request,env})).status,403);
  role='operations_manager';assignment=false;assert.equal((await onRequestGet({request,env})).status,403);
  assignment=true;
  const allowed=await onRequestGet({request,env});
  assert.equal(allowed.status,200);assert.match(allowed.headers.get('Cache-Control'),/no-store/);
  const body=await allowed.json();
  assert.equal(body.report.schema,COMMS_SCHEMA_833);
  assert.equal(body.report.sourceRevisionClaim,'b'.repeat(40));
  assert.equal(body.report.sourceConnectionState,'DISCONNECTED / HOLD');
  assert.equal(body.authority.comms_api_calls,0);
  assert.equal(body.authority.notifications_sent,0);
  assert.doesNotMatch(JSON.stringify(body),/SECRET|00000000-0000-4000/);
  assert.ok(reads.some(x=>x.table==='customer_worksite_issues_v811'&&x.search.includes('limit=100')));
  assert.ok(reads.some(x=>x.table==='customer_communication_handoff_audit'));
  assert.ok(reads.filter(x=>x.table!=='staff_auth_sessions').every(x=>x.method==='GET'&&x.headers.apikey==='service-only'));
  for(const mutation of [onRequestOptions,onRequestPost,onRequestPut,onRequestPatch,onRequestDelete])
    assert.equal((await mutation()).status,405);
  sourceOkay=false;
  const down=await onRequestGet({request,env});assert.equal(down.status,503);
  assert.equal(Object.hasOwn(await down.json(),'report'),false);
}finally{globalThis.fetch=oldFetch;}
const page=read('../admin-handoff-acceptance.html');
assert.equal(page,read('../admin-handoff-acceptance/index.html'));
assert.match(page,/build833Heading/);assert.match(page,/id="build833Rows"/);
assert.match(page,/startCommsReview833\(\)/);assert.match(page,/build833-comms\.css/);
assert.match(page,/DISCONNECTED \/ HOLD/);
const ui=read('../assets/build833-comms-ui.mjs');
const api=read('../functions/api/admin/comms_boundary_review_v833.js');
const css=read('../assets/build833-comms.css');
assert.match(ui,/textContent/);
assert.doesNotMatch(ui,/innerHTML|method:\s*['"](?:POST|PUT|PATCH|DELETE)/);
assert.doesNotMatch(api,/method:\s*['"](?:POST|PUT|PATCH|DELETE)/);
assert.match(css,/focus-visible/);
assert.match(read('./current_booking_wizard_regression.sh'),/build833_comms_boundary_contract_test/);
console.log('Build 833 source-owned Comms, private consent/incident route, no-send and HOLD tests PASS');
