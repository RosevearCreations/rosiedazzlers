import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {MASTER_PILOT_SCHEMA_835,masterPilot835}
  from '../assets/build835-master-pilot.mjs';
import {PILOT_SCHEMA_835,reconcile835OriginalReadback,
  createRosie835OriginalPilot,ql835Status}
  from './ql835_original_one_source_pilot.mjs';
import {onRequestGet,onRequestPost,onRequestPut,onRequestPatch,onRequestDelete,onRequestOptions}
  from '../functions/api/admin/master_shell_pilot_v835.js';

const read=p=>readFileSync(new URL(p,import.meta.url),'utf8');
const revision='a'.repeat(40),digest=c=>c.repeat(64);
const report=masterPilot835({runtimeRevision:revision,
  generatedAt:'2026-11-10T03:00:00.000Z'});
assert.equal(report.schema,MASTER_PILOT_SCHEMA_835);
assert.equal(report.source.sourceId,'rosiedazzlers');
assert.equal(report.source.boundary,'owned_business_legacy');
assert.equal(report.source.currentRuntimeRevisionClaim,revision);
assert.equal(report.source.currentRuntimeRevisionIndependentlyVerified,false);
assert.equal(report.pilot.maxGetCount,1);
assert.equal(report.pilot.maxAuthorizationMs,90000);
assert.equal(report.pilot.sourceGetExecutedHere,false);
assert.equal(report.pilot.sourceSignedReceiptVerifiedHere,false);
assert.equal(report.pilot.aiDataAcceptedEventReceiptVerified,false);
assert.equal(report.pilot.originalPrivateOperatorInstalledHere,false);
assert.equal(report.outcome.connectionState,'DISCONNECTED / HOLD');
assert.equal(report.outcome.masterConnectionGranted,false);
assert.equal(report.outcome.canonicalHoldChanged,false);
assert.equal(report.outcome.remoteHealthGets,0);
assert.equal(report.outcome.masterEventsSent,0);
assert.equal(report.steps.length,7);
assert.equal(masterPilot835({runtimeRevision:'bad'}).source.currentRuntimeRevisionClaim,null);
assert.throws(()=>masterPilot835({generatedAt:'invalid'}),/HOLD_INVALID_SOURCE_CLOCK/);
assert.equal(ql835Status(['--status']).accepted,false);
assert.throws(()=>ql835Status(['--run']),/DENY_PUBLIC_OR_UNSUPERVISED/);
assert.throws(()=>createRosie835OriginalPilot(),/HOLD_ORIGINAL_OWNER_OPERATOR/);

// Synthetic reconciliation shapes only. The real accepted closure is produced
// exclusively by QL-795's cryptographic original private verifier.
const operationId='1dd33a36-a9de-4e1a-afb4-e3ff094a7d38';
const closure={accepted:true,
  state:'ONE_ORIGINAL_QL362_ROSIE_GET_RECEIPT_CLOSED_SIX_PEERS_HELD',
  verifiedOriginalQl362Get:true,verifiedIndependentWitness:true,
  verifiedSixPeersHeld:true,verifiedIndependentSignedExport:true,
  sourceId:'rosiedazzlers',operationId,requestSha256:digest('a'),
  receiptSha256:digest('b'),redactedExportSha256:digest('c'),
  connected:false,connectedCount:0,sourceTestAuthorized:false,
  customerCommunications:false,customerBytes:0,deviceActions:0,
  connectionState:'DISCONNECTED / HOLD',retryAutomatically:false};
const at=Date.parse('2026-11-10T03:00:00.000Z');
const post={schema:'rosie.master-shell.ql835.original-independent-post-test-readback.v1',
  sourceId:'rosiedazzlers',operationId,
  requestSha256:closure.requestSha256,receiptSha256:closure.receiptSha256,
  observedAt:new Date(at).toISOString(),
  originalOwnerSessionVerified:true,independentWitnessReadback:true,
  receiverStopped:true,sourceGetCount:1,otherPeersHeld:5,
  connectedCount:0,sourceTestAuthorized:false,customerDataAllowed:false,
  customerBytes:0,deviceActions:0,sourceWrites:0,
  commsConnectionState:'DISCONNECTED / HOLD',aiDataConnectionState:'DISCONNECTED / HOLD'};
const positive=reconcile835OriginalReadback(closure,post,at);
assert.equal(positive.schema,PILOT_SCHEMA_835);
assert.equal(positive.accepted,true);assert.equal(positive.originalReceiptReviewed,true);
assert.equal(positive.connectionState,'DISCONNECTED / HOLD');
assert.equal(positive.connected,false);assert.equal(positive.masterConnectionGranted,false);
assert.equal(positive.automaticRetry,false);
assert.doesNotMatch(JSON.stringify(positive),/secret|token|privateKey/);
for(const [field,value] of [
  ['sourceId','yw'],['operationId','wrong'],['requestSha256',digest('d')],
  ['receiptSha256',digest('d')],['originalOwnerSessionVerified',false],
  ['independentWitnessReadback',false],['receiverStopped',false],
  ['sourceGetCount',2],['otherPeersHeld',4],['connectedCount',1],
  ['sourceTestAuthorized',true],['customerDataAllowed',true],
  ['customerBytes',1],['deviceActions',1],['sourceWrites',1],
  ['commsConnectionState','CONNECTED'],['aiDataConnectionState','CONNECTED'],
  ['observedAt',new Date(at-120_000).toISOString()]]){
  const x=reconcile835OriginalReadback(closure,{...post,[field]:value},at);
  assert.equal(x.accepted,false,'post gate '+field);
  assert.equal(x.connected,false,'connection '+field);
  assert.equal(x.automaticRetry,false,'retry '+field);
}
for(const [field,value] of [
  ['accepted',false],['sourceId','icamp'],['receiptSha256','invalid'],
  ['redactedExportSha256','invalid'],['verifiedIndependentWitness',false],
  ['verifiedSixPeersHeld',false],['verifiedIndependentSignedExport',false],
  ['connected',true],['sourceTestAuthorized',true],['customerBytes',1],
  ['connectionState','CONNECTED'],['retryAutomatically',true]]){
  const x=reconcile835OriginalReadback({...closure,[field]:value},post,at);
  assert.equal(x.accepted,false,'closure gate '+field);
  assert.equal(x.connected,false,'connection '+field);
}
assert.equal(reconcile835OriginalReadback(closure,{...post,extra:true},at).accepted,false);
assert.equal(reconcile835OriginalReadback(closure,post,Infinity).accepted,false);

// Even with a local callback-shaped object, bad source scope is denied before
// any QL-795 original-operator callback or private network request.
const calls=[];
const op={readIndependentQl835PostTestHoldReadback:async()=>{calls.push('post');return post;},
  readOriginalQl361Handoff:async()=>{calls.push('handoff');throw Error('No original owner session');},
  resolveOriginalPinnedAuthority:async()=>{calls.push('pin');return null;},
  verifyIndependentOriginalCustody:async()=>{calls.push('custody');return null;},
  runOneOriginalQl362PrivateSourceGet:async()=>{calls.push('GET');throw Error('No original private operator');},
  readOriginalImmutableQl362WitnessAndClaim:async()=>{calls.push('witness');return null;},
  readIndependentSixSourceDatabaseSnapshot:async()=>{calls.push('peers');return null;},
  readOriginalSignedRedactedEvidenceExport:async()=>{calls.push('export');return null;}};
const original=createRosie835OriginalPilot({originalOperator:op,now:()=>at});
assert.equal(original.inspect().accepted,false);
const denied=await original.runOne({request:{sourceId:'yw'}});
assert.equal(denied.state,'DENY_NONEXACT_ROSIE_ONE_SOURCE_TEST_SCOPE');
assert.equal(calls.length,0);
assert.equal((await original.runOne({request:{sourceId:'rosiedazzlers'}})).state,
  'DENY_DUPLICATE_OR_REPLAYED_QL835_PILOT');
assert.equal(calls.length,0);

const actorId='00000000-0000-4000-8000-000000000099';
const request=new Request('https://rosiedazzlers.ca/api/admin/master_shell_pilot_v835',
  {headers:{Cookie:'rd_staff_session=private-fixture'}});
const env={SUPABASE_URL:'https://supabase-mock.invalid',
  SUPABASE_SERVICE_ROLE_KEY:'service-fixture',CF_PAGES_COMMIT_SHA:revision};
const oldFetch=globalThis.fetch;
let signed=false,role='detailer',permission=true;
const hits=[];
globalThis.fetch=async(input,init={})=>{
  const url=new URL(input),table=url.pathname.split('/').pop();
  hits.push(table);
  assert.equal(table,'staff_auth_sessions','No extra database or Master/comms API read');
  assert.equal(init.method??'GET','GET');
  return Response.json(signed?[{expires_at:'2031-01-01T00:00:00Z',revoked_at:null,
    staff_user:{id:actorId,role_code:role,is_active:true,
      can_manage_bookings:true,permissions_profile:{action_access:{
        'operations.customer.manage':true,'operations.assignment.manage':permission}}}}]:[]);
};
try{
  assert.equal((await onRequestGet({request,env})).status,401);
  signed=true;assert.equal((await onRequestGet({request,env})).status,403);
  role='operations_manager';permission=false;
  assert.equal((await onRequestGet({request,env})).status,403);
  permission=true;
  const response=await onRequestGet({request,env});
  assert.equal(response.status,200);
  assert.match(response.headers.get('Cache-Control'),/no-store/);
  const data=await response.json();
  assert.equal(data.report.schema,MASTER_PILOT_SCHEMA_835);
  assert.equal(data.report.source.currentRuntimeRevisionIndependentlyVerified,false);
  assert.equal(data.report.outcome.connected,false);
  assert.equal(data.authority.originalPrivateOperatorInvoked,false);
  assert.equal(data.authority.remoteHealthGets,0);
  assert.equal(data.authority.masterPublishes,0);
  assert.equal(data.authority.databaseWrites,0);
  assert.ok(hits.every(x=>x==='staff_auth_sessions'));
  assert.doesNotMatch(JSON.stringify(data),/service-fixture|private-fixture|00000000-0000-4000/);
  for(const mutation of [onRequestOptions,onRequestPost,onRequestPut,onRequestPatch,onRequestDelete])
    assert.equal((await mutation()).status,405);
}finally{globalThis.fetch=oldFetch;}

const html=read('../admin-handoff-acceptance.html');
assert.equal(html,read('../admin-handoff-acceptance/index.html'));
assert.match(html,/id="build835Heading"/);
assert.match(html,/id="build835Steps"/);
assert.match(html,/startOwnerPilot835\(\)/);
assert.match(html,/build835-pilot\.css/);
const ui=read('../assets/build835-pilot-ui.mjs');
assert.match(ui,/textContent/);assert.doesNotMatch(ui,/innerHTML|method:\s*['"]POST/);
assert.match(read('../assets/build835-pilot.css'),/focus-visible/);
assert.match(read('./current_booking_wizard_regression.sh'),/build835_owner_master_pilot_test/);
console.log('Build 835 owner-only one-source pilot readiness, tamper/replay HOLD and safe private API PASS');
