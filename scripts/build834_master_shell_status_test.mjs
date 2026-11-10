import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {MASTER_STATUS_SCHEMA_834,AI_DATA_EVENT_SCHEMA_834,LAST_PROVEN_RELEASE_834,
  MASTER_LINKS_834,masterStatus834} from '../assets/build834-master-status.mjs';
import {onRequestGet,onRequestPost,onRequestPut,onRequestPatch,onRequestDelete,onRequestOptions}
  from '../functions/api/admin/master_shell_status_v834.js';
const read=file=>readFileSync(new URL(file,import.meta.url),'utf8');
const id=n=>'00000000-0000-4000-8000-'+String(n).padStart(12,'0');
const observed=Date.parse(LAST_PROVEN_RELEASE_834.observedCompletedAt);
const at=new Date(observed+60_000).toISOString();
const report=masterStatus834({runtimeRevision:LAST_PROVEN_RELEASE_834.commit,
  generatedAt:at,now:observed+60_000});
assert.equal(report.schema,MASTER_STATUS_SCHEMA_834);
assert.equal(report.sourceIdentity.sourceId,'rosiedazzlers');
assert.equal(report.sourceIdentity.tenantBoundary,'owned_business_legacy');
assert.equal(report.sourceIdentity.childTenantId,null);
assert.equal(report.sourceHealth.state,'AUTHORIZATION_HELD');
assert.equal(report.sourceHealth.connectionState,'DISCONNECTED / HOLD');
assert.equal(report.sourceHealth.currentStatusWitnessedByConsumer,false);
assert.equal(report.runtimeRevision.matchesLastHistoricalProductionProof,true);
assert.equal(report.runtimeRevision.currentProductionVerifiedByThisRequest,false);
assert.equal(report.lastVerifiedReleaseReference.jobCountAtObservation,6);
assert.equal(report.lastVerifiedReleaseReference.referenceIndependentlyRecheckedOnThisRequest,false);
assert.equal(report.lastVerifiedReleaseReference.evidenceExpiryAt,null);
assert.equal(report.lastVerifiedReleaseReference.deploymentObservationFreshness,'RECENT_HISTORICAL_REFERENCE');
assert.equal(report.consumerEventContract.schema,AI_DATA_EVENT_SCHEMA_834);
assert.deepEqual(report.consumerEventContract.targetFamilies,['source.health.reported','release.promoted']);
assert.equal(report.consumerEventContract.proposedSourceHealthPayload.registryStatus,'AUTHORIZATION_HELD');
assert.equal(report.consumerEventContract.proposedSourceHealthPayload.expiresAt,null);
assert.equal(report.consumerEventContract.proposedReleasePayload.expiresAt,null);
assert.equal(report.consumerEventContract.proposedReleasePayload.deploymentStatus,'UNKNOWN');
assert.equal(report.consumerEventContract.signedEventEnvelopeAvailable,false);
assert.equal(report.consumerEventContract.targetSchemaValid,false);
assert.equal(report.consumerEventContract.publishEligible,false);
assert.equal(report.consumerEventContract.sourceSequence,null);
assert.equal(report.masterRelationship.links.length,6);
assert.equal(MASTER_LINKS_834.length,6);
assert.equal(new Set(report.masterRelationship.links.map(x=>x.sourceId)).size,6);
assert.equal(report.masterRelationship.links.filter(x=>x.role.startsWith('MASTER')).length,2);
assert.equal(report.masterRelationship.links.filter(x=>x.receiverStatus==='NOT_QUERIED').length,4);
assert.equal(report.masterRelationship.peersHaveNoImplicitDataAccess,true);
assert.equal(report.acceptance.masterCompletionPercent,null);
assert.equal(report.acceptance.commsConnectionState,'DISCONNECTED / HOLD');
for(const key of ['originalOwnerFieldAcceptance','independentSignersAndReceipts',
  'peerConnectionsProved','consumerOnboarded','liveMasterIngest','canonicalHoldChanged'])
  assert.equal(report.acceptance[key],false,key);
assert.equal(report.acceptance.masterEventsSent,0);
assert.equal(report.acceptance.remoteHealthGetsPerformed,0);
assert.equal(report.acceptance.approvedNumerator,null);
assert.equal(report.acceptance.approvedDenominator,null);
const missing=masterStatus834({generatedAt:at,now:observed+60_000});
assert.equal(missing.runtimeRevision.claim,null);
assert.equal(missing.runtimeRevision.matchesLastHistoricalProductionProof,null);
const drift=masterStatus834({runtimeRevision:'a'.repeat(40),generatedAt:at,now:observed+60_000});
assert.equal(drift.runtimeRevision.matchesLastHistoricalProductionProof,false);
assert.equal(drift.runtimeRevision.currentProductionVerifiedByThisRequest,false);
const older=masterStatus834({now:observed+25*60*60*1000});
assert.equal(older.lastVerifiedReleaseReference.deploymentObservationFreshness,'OLDER_HISTORICAL_REFERENCE');
const clock=masterStatus834({now:observed-1000});
assert.equal(clock.lastVerifiedReleaseReference.deploymentObservationFreshness,'CLOCK_OR_RECORD_MISMATCH');
assert.throws(()=>masterStatus834({connectionState:'CONNECTED'}),/No stronger connection/);
assert.throws(()=>masterStatus834({now:Infinity}),/No stronger connection/);
assert.throws(()=>masterStatus834({now:observed,generatedAt:'2022-01-01T00:00:00.000Z'}),/Current bounded/);
assert.deepEqual(JSON.parse(read('../.well-known/rosevear-integration-manifest.json')).source_id,'rosiedazzlers');
assert.doesNotMatch(JSON.stringify(report),/customer_email|staff_actor_name|provider_token|api_key|secret_key/);

const request=new Request('https://rosiedazzlers.ca/api/admin/master_shell_status_v834',
  {headers:{Cookie:'rd_staff_session=token'}});
const env={SUPABASE_URL:'https://supabase-mock.invalid',SUPABASE_SERVICE_ROLE_KEY:'service-only',
  CF_PAGES_COMMIT_SHA:LAST_PROVEN_RELEASE_834.commit};
let signed=false,role='detailer',assignment=true;
const fetches=[];
const originalFetch=globalThis.fetch;
globalThis.fetch=async(input,init={})=>{
  const url=new URL(input),table=url.pathname.split('/').pop();
  fetches.push({table,method:init.method||'GET'});
  assert.equal(table,'staff_auth_sessions','No extra database, Master, Comms or provider requests');
  assert.equal(init.method||'GET','GET');
  return Response.json(signed?[{expires_at:'2031-01-01T00:00:00Z',revoked_at:null,
    staff_user:{id:id(99),role_code:role,is_active:true,can_manage_bookings:true,
      permissions_profile:{action_access:{'operations.customer.manage':true,
        'operations.assignment.manage':assignment}}}}]:[]);
};
try{
  assert.equal((await onRequestGet({request,env})).status,401);
  signed=true;assert.equal((await onRequestGet({request,env})).status,403);
  role='operations_manager';assignment=false;
  assert.equal((await onRequestGet({request,env})).status,403);
  assignment=true;
  const response=await onRequestGet({request,env});
  assert.equal(response.status,200);
  assert.match(response.headers.get('Cache-Control'),/no-store/);
  const result=await response.json();
  assert.equal(result.report.schema,MASTER_STATUS_SCHEMA_834);
  assert.equal(result.report.runtimeRevision.claim,LAST_PROVEN_RELEASE_834.commit);
  assert.equal(result.report.runtimeRevision.currentProductionVerifiedByThisRequest,false);
  assert.equal(result.authority.remote_verification_calls,0);
  assert.equal(result.authority.master_publishes,0);
  assert.equal(result.authority.comms_calls,0);
  assert.equal(result.authority.database_writes,0);
  assert.ok(fetches.every(x=>x.table==='staff_auth_sessions'&&x.method==='GET'));
  assert.doesNotMatch(JSON.stringify(result),/service-only|rd_staff_session|00000000-0000-4000/);
  for(const mutation of [onRequestOptions,onRequestPost,onRequestPut,onRequestPatch,onRequestDelete])
    assert.equal((await mutation()).status,405);
}finally{globalThis.fetch=originalFetch;}
const html=read('../admin-handoff-acceptance.html'),ui=read('../assets/build834-master-status-ui.mjs');
assert.equal(html,read('../admin-handoff-acceptance/index.html'));
assert.match(html,/build834Heading/);assert.match(html,/id="build834Rows"/);
assert.match(html,/startMasterStatus834\(\)/);assert.match(html,/build834-master-status\.css/);
assert.match(ui,/textContent/);assert.doesNotMatch(ui,/innerHTML|method:\s*['"]POST/);
assert.match(read('../assets/build834-master-status.css'),/focus-visible/);
assert.match(read('./current_booking_wizard_regression.sh'),/build834_master_shell_status_test/);
console.log('Build 834 local process health, independent historical release, Master Shell roles, no-event/no-connection tests PASS');
