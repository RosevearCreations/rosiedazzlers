import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createQl792OriginalFirstRosieGet,ql792Cli}
  from './ql792_ql359_supervised_first_rosie_get.mjs';

// Every object below is a SYNTHETIC CI fixture, never evidence of a genuine
// owner signature, original field enrollment or live network connection.
const now=Date.parse('2026-11-07T20:00:00.000Z');
const path='/api/integration/v1/shell/health';
const packet={envelope:{source:'rosiedazzlers',tenant:'rosie-dazzlers',
  environment:'TEST',method:'GET',path,authorizationSha256:'a'.repeat(64),
  issuedAt:new Date(now-10_000).toISOString(),
  expiresAt:new Date(now+45_000).toISOString()},signature:'FAKE_TEST_ONLY'};
const closeout={schema:'rosevear.hub.ql359.original-supervised-private-test.v1',
  state:'ONE_SUPERVISED_ORIGINAL_PRIVATE_TEST_CLOSED_SIX_PEERS_STILL_HELD',
  originalIssuerAuthenticated:true,independentWitnessAuthenticated:true,
  ownersIndependentlyApproved:true,databaseEnrollmentVerified:true,
  dedicatedReceiverCredentialVerified:true,supervisedReceiverStopVerified:true,
  independentCloseoutWitnessVerified:true,firstPrivateTestReceiptVerified:true,
  verifiedReceiptCount:1,deviceId:'rosevear-windows-hub',receiverActivated:false,
  connected:false,connectedCount:0,connectionState:'DISCONNECTED / HOLD',
  sessionId:'original-synthetic-device-session',transcriptSha256:'c'.repeat(64),
  closedAt:new Date(now-20_000).toISOString()};
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
const ledger={schema:'rosie.comms.ql792.first-original-source-get-readback.v1',
  sourceId:'rosiedazzlers',tenantId:'rosie-dazzlers',environment:'TEST',
  method:'GET',path,ql359SessionId:closeout.sessionId,
  ql359TranscriptSha256:closeout.transcriptSha256,
  sourceEnrollmentSha256:enrollment.originalRosieSourceEnrollmentSha256,
  operationId:get.originalOperationId,requestSha256:get.requestSha256,
  brokerReceiptSha256:get.brokerReceiptSha256,
  signedWitnessSha256:get.signedFieldWitnessSha256,
  firstSourceReceiptCount:1,customerBytes:0,sixHeldPeers:6,connected:false};

function setup(){
  const calls={device:0,source:0,get:0,ledger:0};
  const originalOperator={
    verifyQl359IndependentDeviceCloseout:async()=>{calls.device++;return closeout;},
    verifyRosieOriginalSourceEnrollment:async()=>{calls.source++;return enrollment;},
    runOneOriginalRosie790:async()=>{calls.get++;return get;},
    readFirstSourceGetAfterQl359:async()=>{calls.ledger++;return ledger;}
  };
  return {calls,originalOperator,make:()=>createQl792OriginalFirstRosieGet({
    originalOperator,now:()=>now})};
}
const first=setup(),one=first.make();
assert.equal(one.inspect().accepted,false);
const good=await one.runOne(packet);
assert.equal(good.accepted,true,good.state);
assert.equal(good.originalDeviceCloseoutAccepted,true);
assert.equal(good.genuineFirstRosieTestAccepted,true);
assert.equal(good.sixAppGrants,0);
assert.equal(good.customerCommunications,0);
assert.equal(good.deviceActions,0);
assert.equal(good.connected,false);
assert.deepEqual(first.calls,{device:1,source:1,get:1,ledger:1});
assert.equal((await one.runOne(packet)).accepted,false);
assert.equal(first.calls.get,1,'no second original Rosie GET');

const names={device:'verifyQl359IndependentDeviceCloseout',
  source:'verifyRosieOriginalSourceEnrollment',get:'runOneOriginalRosie790',
  ledger:'readFirstSourceGetAfterQl359'};
const negatives=[
  ['old QL358 receipt','device',{...closeout,schema:'rosevear.hub.ql358.original-field-credential-live-test.v1'}],
  ['no original issuer','device',{...closeout,originalIssuerAuthenticated:false}],
  ['no independent witness','device',{...closeout,independentWitnessAuthenticated:false}],
  ['owner did not approve','device',{...closeout,ownersIndependentlyApproved:false}],
  ['no original DB enrollment','device',{...closeout,databaseEnrollmentVerified:false}],
  ['no receiver credential','device',{...closeout,dedicatedReceiverCredentialVerified:false}],
  ['no independently verified stop','device',{...closeout,supervisedReceiverStopVerified:false}],
  ['no independent closeout signature','device',{...closeout,independentCloseoutWitnessVerified:false}],
  ['no first signed device receipt','device',{...closeout,firstPrivateTestReceiptVerified:false}],
  ['duplicate device receipt','device',{...closeout,verifiedReceiptCount:2}],
  ['receiver remains active','device',{...closeout,receiverActivated:true}],
  ['peer is connected','device',{...closeout,connectedCount:1}],
  ['invalid session transcript','device',{...closeout,transcriptSha256:'bad'}],
  ['future original closeout','device',{...closeout,closedAt:new Date(now+100_000).toISOString()}],
  ['wrong device owner','device',{...closeout,deviceId:'some-other-device'}],
  ['Rosie not originally enrolled','source',{...enrollment,sourceEnrollmentCount:0}],
  ['wrong Rosie child tenant','source',{...enrollment,tenantId:'another-tenant'}],
  ['no Rosie source signature','source',{...enrollment,sourceSignerSpkiSha256:'bad'}],
  ['missing separate owner signatures','source',{...enrollment,sourceOwnerDecisionSha256:enrollment.masterOwnerDecisionSha256}],
  ['wrong owner request hash','source',{...enrollment,authorizationSha256:'e'.repeat(64)}],
  ['source grants privileges','source',{...enrollment,sourceTestAuthorized:true}],
  ['source can access customers','source',{...enrollment,customerDataAllowed:true}],
  ['extra untrusted source key','source',{...enrollment,approved:true}],
  ['no authenticated first GET','get',{...get,accepted:false}],
  ['GET tries to connect','get',{...get,connected:true}],
  ['GET has no witness','get',{...get,signedFieldWitnessSha256:''}],
  ['wrong original operation id','get',{...get,originalOperationId:'fake'}],
  ['wrong QL359 session','ledger',{...ledger,ql359SessionId:'another-session'}],
  ['wrong QL359 signed transcript','ledger',{...ledger,ql359TranscriptSha256:'f'.repeat(64)}],
  ['wrong original Rosie enrollment','ledger',{...ledger,sourceEnrollmentSha256:'f'.repeat(64)}],
  ['unmatched GET operation','ledger',{...ledger,operationId:'other'}],
  ['unmatched GET request','ledger',{...ledger,requestSha256:'f'.repeat(64)}],
  ['unmatched GET receipt','ledger',{...ledger,brokerReceiptSha256:'f'.repeat(64)}],
  ['unmatched first independent witness','ledger',{...ledger,signedWitnessSha256:'f'.repeat(64)}],
  ['duplicate source receipts','ledger',{...ledger,firstSourceReceiptCount:2}],
  ['customer data leaked','ledger',{...ledger,customerBytes:1}],
  ['not six held apps','ledger',{...ledger,sixHeldPeers:5}],
  ['ledger pretends connection','ledger',{...ledger,connected:true}],
  ['ledger wrong child','ledger',{...ledger,tenantId:'wrong'}],
  ['ledger unknown extra grant','ledger',{...ledger,sourceGrant:true}]
];
for(const [label,where,value] of negatives){
  const c=setup();c.originalOperator[names[where]]=async()=>{c.calls[where]++;return value;};
  const denied=await c.make().runOne(packet);
  assert.equal(denied.accepted,false,`${label}: ${denied.state}`);
  assert.equal(denied.connected,false,label);
  assert.equal(c.calls.get,where==='get'||where==='ledger'?1:0,label);
  assert.equal(c.calls.ledger,where==='ledger'?1:0,label);
}
for(const mutate of [x=>x.envelope.source='foreign',
  x=>x.envelope.tenant='foreign',x=>x.envelope.environment='PRODUCTION',
  x=>x.envelope.method='POST',x=>x.envelope.path='/api/integration/v1/customers',
  x=>x.envelope.authorizationSha256='invalid',
  x=>x.envelope.issuedAt=new Date(now+100).toISOString(),
  x=>x.envelope.expiresAt=new Date(now-1).toISOString()]){
  const c=setup(),bad=structuredClone(packet);mutate(bad);
  assert.equal((await c.make().runOne(bad)).accepted,false);
  assert.deepEqual(c.calls,{device:0,source:0,get:0,ledger:0});
}
const thrower=setup();thrower.originalOperator.verifyQl359IndependentDeviceCloseout=
  async()=>{throw Error('original unavailable');};
assert.equal((await thrower.make().runOne(packet)).accepted,false);
assert.throws(()=>createQl792OriginalFirstRosieGet({}));
assert.equal(ql792Cli(['--status']).accepted,false);
assert.throws(()=>ql792Cli(['--run']));
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const win=read('scripts/inspect-rosie-original-ql359-792.ps1');
assert.match(win,/46a3465365d2136466aa8f3d3b3297bcb467f773/);
assert.match(win,/ql359-windows-supervised-test\.ps1/);
for(const cmd of ['OwnerReview','CredentialReadback','StopWitness','ReceiptReview'])
  assert.match(win,new RegExp(cmd));
assert.doesNotMatch(win,/Start-Service|Stop-Service|Set-ExecutionPolicy|New-NetFirewallRule|Set-NetFirewallRule|git\s+pull|service_role/i);
assert.match(read('admin-comms-hub-v781.html'),/Build 792 · original QL-359/);
assert.match(read('admin-integrations.html'),/Build 792/);
assert.match(read('admin-catalog.html'),/Build 792/);
assert.equal(read('admin-integrations.html'),read('admin-integrations/index.html'));
assert.equal(read('admin-catalog.html'),read('admin-catalog/index.html'));
assert.match(read('scripts/current_booking_wizard_regression.sh'),/build792_original_supervised_first_get_test/);
console.log(`Build 792 PASS: 1 synthetic acceptance, ${negatives.length+8+1} fail-closed cases; original signed QL359 STOP, separate Rosie source and exactly one original signed GET ledger required, all six app peers HELD.`);
