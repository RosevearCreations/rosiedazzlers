import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createQl791OriginalLiveRosieHandoff,ql791Cli}
  from './ql791_original_ql358_live_rosie_handoff.mjs';

const now=Date.parse('2026-11-07T20:00:00.000Z');
const path='/api/integration/v1/shell/health';
const packet={envelope:{source:'rosiedazzlers',tenant:'rosie-dazzlers',
  environment:'TEST',method:'GET',path,authorizationSha256:'a'.repeat(64),
  issuedAt:new Date(now-10_000).toISOString(),
  expiresAt:new Date(now+45_000).toISOString()},signature:'SYNTHETIC_ONLY'};
const device={schema:'rosevear.hub.ql358.original-field-credential-live-test.v1',
  state:'FIRST_AUTHENTIC_ORIGINAL_TEST_RECEIPT_RECONCILED_SIX_APPS_HELD',
  firstLiveTestReceiptVerified:true,verifiedReceiptCount:1,
  deviceId:'rosevear-windows-hub',originalIssuerAuthenticated:true,
  independentWitnessAuthenticated:true,ownersIndependentlyApproved:true,
  databaseEnrollmentVerified:true,dedicatedReceiverCredentialVerified:true,
  connected:false,connectedCount:0,connectionState:'DISCONNECTED / HOLD'};
const enrollment={schema:'rosie.comms.ql791.protected-original-source-enrollment.v1',
  state:'ORIGINAL_ROSIE_SOURCE_AND_CHILD_SCOPE_ENROLLMENT_VERIFIED',
  sourceId:'rosiedazzlers',tenantId:'rosie-dazzlers',environment:'TEST',
  method:'GET',path,authorizationSha256:packet.envelope.authorizationSha256,
  originalDeviceEnrollmentSha256:'1'.repeat(64),
  originalRosieSourceEnrollmentSha256:'2'.repeat(64),
  sourceSignerSpkiSha256:'3'.repeat(64),
  sourceOwnerDecisionSha256:'4'.repeat(64),
  masterOwnerDecisionSha256:'5'.repeat(64),
  issuerSpkiSha256:'6'.repeat(64),witnessSpkiSha256:'7'.repeat(64),
  sourceEnrollmentCount:1,sourceTestAuthorized:false,
  customerDataAllowed:false,connectionState:'DISCONNECTED / HOLD'};
const get={state:'ONE_GENUINE_ROSIE_BROKER_GET_AND_INDEPENDENT_FIRST_RECEIPT_ACCEPTED_STILL_HELD',
  accepted:true,firstGenuineRosieGetAccepted:true,connected:false,
  connectionState:'DISCONNECTED / HOLD',
  originalOperationId:'fbca306d-6867-4d46-9c63-7ce2172b870e',
  requestSha256:'8'.repeat(64),brokerReceiptSha256:'9'.repeat(64),
  signedFieldWitnessSha256:'b'.repeat(64)};
const ledger={schema:'rosie.comms.ql791.original-first-source-handshake.v1',
  sourceId:'rosiedazzlers',tenantId:'rosie-dazzlers',environment:'TEST',
  method:'GET',path,operationId:get.originalOperationId,
  requestSha256:get.requestSha256,brokerReceiptSha256:get.brokerReceiptSha256,
  fieldWitnessSha256:get.signedFieldWitnessSha256,
  originalRosieSourceEnrollmentSha256:enrollment.originalRosieSourceEnrollmentSha256,
  sourceTestCount:1,customerBytes:0,sourceConnected:false,
  connectionState:'DISCONNECTED / HOLD'};
function setup(){
  const calls={device:0,source:0,get:0,ledger:0},operator={
    verifyQl358FirstLiveDeviceReceipt:async()=>{calls.device++;return device;},
    verifyRosieOriginalSourceEnrollment:async()=>{calls.source++;return enrollment;},
    runOneOriginalRosie790:async()=>{calls.get++;return get;},
    readOriginalRosieCrossAppHandshake:async()=>{calls.ledger++;return ledger;}};
  return {calls,operator,make:()=>createQl791OriginalLiveRosieHandoff({
    originalPrivateOperator:operator,now:()=>now})};
}
const s=setup(),runner=s.make();
assert.equal(runner.inspect().accepted,false);
const pass=await runner.runOne(packet);
assert.equal(pass.accepted,true,pass.state);
assert.equal(pass.sourceTestVerified,true);
assert.equal(pass.connected,false);
assert.equal(pass.sourceGrants,0);
assert.equal(pass.customerCommunications,0);
assert.deepEqual(s.calls,{device:1,source:1,get:1,ledger:1});
assert.equal((await runner.runOne(packet)).accepted,false);
assert.equal(s.calls.get,1,'original GET must be single-use');

const negative=[
  ['Ql358 is only QL357', 'device', {...device,schema:'rosevear.hub.ql357.original-private-test-activation.v1'},0,0],
  ['Ql358 no signed receipt','device',{...device,firstLiveTestReceiptVerified:false},0,0],
  ['Ql358 wrong credential','device',{...device,dedicatedReceiverCredentialVerified:false},0,0],
  ['Ql358 missing issuer','device',{...device,originalIssuerAuthenticated:false},0,0],
  ['Ql358 extra receipt','device',{...device,verifiedReceiptCount:2},0,0],
  ['Ql358 connected peer','device',{...device,connectedCount:1},0,0],
  ['Rosie source not enrolled','source',{...enrollment,sourceEnrollmentCount:0},0,0],
  ['Rosie child wrong','source',{...enrollment,tenantId:'other'},0,0],
  ['Rosie signer wrong','source',{...enrollment,sourceSignerSpkiSha256:'X'},0,0],
  ['Rosie owners share receipt','source',{...enrollment,masterOwnerDecisionSha256:enrollment.sourceOwnerDecisionSha256},0,0],
  ['Rosie self authorized','source',{...enrollment,sourceTestAuthorized:true},0,0],
  ['Rosie source grants customer data','source',{...enrollment,customerDataAllowed:true},0,0],
  ['Rosie source duplicate','source',{...enrollment,sourceEnrollmentCount:2},0,0],
  ['Rosie source foreign environment','source',{...enrollment,environment:'PRODUCTION'},0,0],
  ['Rosie source owner digest mismatch','source',{...enrollment,authorizationSha256:'e'.repeat(64)},0,0],
  ['Rosie source untrusted extra','source',{...enrollment,approved:true},0,0],
  ['Rosie first GET absent','get',{...get,accepted:false},1,0],
  ['Rosie first GET connected','get',{...get,connected:true},1,0],
  ['Rosie first GET witness absent','get',{...get,signedFieldWitnessSha256:''},1,0],
  ['Rosie ledger extra source GET','ledger',{...ledger,sourceTestCount:2},1,1],
  ['Rosie ledger receipt mismatch','ledger',{...ledger,brokerReceiptSha256:'c'.repeat(64)},1,1],
  ['Rosie ledger witness mismatch','ledger',{...ledger,fieldWitnessSha256:'c'.repeat(64)},1,1],
  ['Rosie ledger source enrollment mismatch','ledger',{...ledger,originalRosieSourceEnrollmentSha256:'c'.repeat(64)},1,1],
  ['Rosie ledger customer bytes','ledger',{...ledger,customerBytes:1},1,1],
  ['Rosie ledger connected','ledger',{...ledger,sourceConnected:true},1,1],
  ['Rosie ledger foreign source','ledger',{...ledger,sourceId:'yw'},1,1]
];
for(const [label,type,value,getCalls,ledgerCalls] of negative){
  const c=setup();
  const names={device:'verifyQl358FirstLiveDeviceReceipt',
    source:'verifyRosieOriginalSourceEnrollment',get:'runOneOriginalRosie790',
    ledger:'readOriginalRosieCrossAppHandshake'};
  c.operator[names[type]]=async()=>{c.calls[type]++;return value;};
  const denied=await c.make().runOne(packet);
  assert.equal(denied.accepted,false,`${label}: ${denied.state}`);
  assert.equal(denied.connected,false,label);
  assert.equal(c.calls.get,getCalls,label);
  assert.equal(c.calls.ledger,ledgerCalls,label);
}
for(const mutate of [x=>x.envelope.source='other',x=>x.envelope.method='POST',
  x=>x.envelope.tenant='wrong',x=>x.envelope.environment='PRODUCTION',
  x=>x.envelope.path='/api/customer',
  x=>x.envelope.expiresAt=new Date(now-1).toISOString()]){
  const c=setup(),bad=structuredClone(packet);mutate(bad);
  assert.equal((await c.make().runOne(bad)).accepted,false);
  assert.deepEqual(c.calls,{device:0,source:0,get:0,ledger:0});
}
assert.equal(ql791Cli(['--status']).accepted,false);
assert.throws(()=>ql791Cli(['--run']));
assert.throws(()=>createQl791OriginalLiveRosieHandoff({}));
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const win=read('scripts/inspect-rosie-original-field-791.ps1');
assert.match(win,/88ceba4fdcf0115b48d3f510159682c8d530d6e8/);
assert.match(win,/ql358-windows-original-field\.ps1/);
for(const op of ['ReviewRequest','ReviewSigned','CredentialHandoff','ReceiverReadback','VerifyReceipt'])
  assert.match(win,new RegExp('-'+op));
assert.doesNotMatch(win,/Start-Service|Stop-Service|Set-ExecutionPolicy|New-NetFirewallRule|Set-NetFirewallRule|git\s+pull|service_role/i);
assert.match(read('admin-comms-hub-v781.html'),/Build 791 · original QL-358/);
assert.match(read('admin-integrations.html'),/Build 791/);
assert.match(read('admin-catalog.html'),/Build 791/);
assert.equal(read('admin-integrations.html'),read('admin-integrations/index.html'));
assert.equal(read('admin-catalog.html'),read('admin-catalog/index.html'));
assert.match(read('scripts/current_booking_wizard_regression.sh'),/build791_original_live_rosie_handoff_test/);
console.log('Build 791 PASS: original QL-358 device/credential proof and Rosie child enrollment required before exactly one authenticated QL-790 GET and independently matching first receipt; 32 fail-closed cases, no public activation.');
