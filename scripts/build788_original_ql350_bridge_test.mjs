import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {createOriginalQl350RosieBridge788,ql788Cli}
  from './ql788_original_ql350_rosie_bridge.mjs';

const now=Date.parse('2026-11-07T18:00:00.000Z');
const sha=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
const canonical=v=>Array.isArray(v)?'['+v.map(canonical).join(',')+']':
  v&&typeof v==='object'?'{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+canonical(v[k])).join(',')+'}':JSON.stringify(v);
const digest=x=>createHash('sha256').update(canonical(x)).digest('hex');
const roles={source:'a'.repeat(64),ree:'b'.repeat(64),jack:'c'.repeat(64),
  issuer:'d'.repeat(64),witness:'e'.repeat(64),broker:'f'.repeat(64),device:'9'.repeat(64)};
const operationId='a213c154-0248-4a44-9f2b-b716a9bf01c1';
const path='/api/integration/v1/shell/health';
const packet={envelope:{schema:'rosie.comms.source-signed-get.v1',
  source:'rosiedazzlers',tenant:'rosie-dazzlers',
  audience:'rosevear-comms-hub:nonproduction',environment:'TEST',
  method:'GET',path,nonce:'synthetic-ql788-original-operator-1234567890',
  issuedAt:new Date(now-10_000).toISOString(),
  expiresAt:new Date(now+60_000).toISOString(),
  authorizationSha256:'1'.repeat(64)},signature:'A'.repeat(86)};
const requestSha256=digest(packet),nonceSha256=digest(packet.envelope.nonce);
const auth=packet.envelope.authorizationSha256;
const inspectOk={state:'ORIGINAL_TEST_RECEIPT_VERIFIED_PER_SOURCE_AUTHORITY_PENDING',
  authenticatedPrivateOperator:true,originalEnrollmentCount:1,
  originalReceiptVerified:true,readyForOneSourceTest:true,connectedCount:0};

function setup(){
  const calls={inspect:0,run:0,read:0,reserve:0,verify:0,claim:0};
  const ql350={
    inspect:async()=>{calls.inspect++;return inspectOk;},
    runOne:async(_op,{sourceId,operationId:id})=>{
      calls.run++;assert.equal(sourceId,'rosiedazzlers');
      assert.equal(id,operationId);
      return {state:'ONE_SOURCE_SIGNED_TEST_WITNESS_VERIFIED_STILL_HELD',
        authenticatedTest:true,sourceId:'rosiedazzlers',operationId:id,
        receiptSha256:roles.broker,connectedCount:0};}
  };
  const trust={
    verifyOriginalIssuer:async()=>({role:'original_issuer',authenticated:true,
      revoked:false,spkiSha256:roles.issuer,enrollmentPayloadSha256:roles.device}),
    verifyIndependentWitness:async()=>({role:'field_witness',authenticated:true,
      revoked:false,spkiSha256:roles.witness,enrollmentPayloadSha256:roles.device}),
    verifyOriginalDeviceReceipt:async()=>({state:
      'FIRST_PRIVATE_ORIGINAL_DEVICE_TEST_ACCEPTED_SIX_SOURCES_STILL_HELD',
      receiptCount:1,firstPrivateTestAccepted:true,sourceTestAuthorized:false,
      connected:false,enrollmentPayloadSha256:roles.device}),
    verifyOriginalSourceEnrollment:async()=>({state:'ORIGINAL_ROSIE_SOURCE_ENROLLED_TEST',
      source:'rosiedazzlers',tenant:'rosie-dazzlers',environment:'TEST',
      revoked:false,keyPin:roles.source,sourceTestAuthorized:true,
      originalDeviceEnrollmentSha256:roles.device}),
    verifySourceOwnerDecision:async()=>({role:'source',decision:'APPROVE_TEST_ONLY',
      authorizationSha256:auth,spkiSha256:roles.ree,expiresAt:now+200_000}),
    verifyMasterOwnerDecision:async()=>({role:'master',decision:'APPROVE_TEST_ONLY',
      authorizationSha256:auth,spkiSha256:roles.jack,expiresAt:now+200_000}),
    verifySourceSignature:async()=>({verified:true,sourceKeyPin:roles.source,
      requestSha256}),
    verifyPrivateOperator:async()=>({state:'ORIGINAL_OWNER_AUTHENTICATED_PRIVATE_SESSION',
      originalComputer:'DESKTOP-AE894KC',expiresAt:now+200_000}),
    verifyPrivateTransport:async()=>({state:'ORIGINAL_TLS_TAILNET_TRANSPORT_INDEPENDENTLY_VERIFIED',
      originalComputer:'DESKTOP-AE894KC',tlsVerified:true,
      privateReceiverLoopbackVerified:true,observedAt:now-5_000}),
    claimNonceOnce:async()=>{calls.claim++;return {claimed:true,nonceSha256,requestSha256};},
    reserveQl350Operation:async()=>{calls.reserve++;return {
      state:'PERSISTENT_SINGLE_USE_OPERATION_RESERVED',
      sourceId:'rosiedazzlers',operationId,nonceSha256,requestSha256,
      authorizationSha256:auth};},
    readOriginalSignedGet:async()=>{calls.read++;return {
      receiptSha256:roles.broker,requestSha256,nonceSha256,method:'GET',
      path,httpStatus:200,customerBytes:0,signedReceipt:{original:'synthetic'}};},
    verifyOriginalBrokerReceipt:async()=>{calls.verify++;return {
      verified:true,receiptSha256:roles.broker,
      originalBrokerSpkiSha256:roles.broker,requestSha256,nonceSha256,
      authorizationSha256:auth,source:'rosiedazzlers',tenant:'rosie-dazzlers',
      path,customerBytes:0,observedAt:now-1_000};}
  };
  const make=()=>createOriginalQl350RosieBridge788({ql350,
    operatorSession:{originalPrivate:true},originalTrust:trust,now:()=>now});
  return {calls,ql350,trust,make};
}
const one=setup(),bridge=one.make();
assert.equal(bridge.inspect().accepted,false);
const good=await bridge.runOne(packet);
assert.equal(good.accepted,true,good.state);
assert.equal(good.originalBrokerReceiptSha256,roles.broker);
assert.equal(good.connected,false);
assert.equal(good.connection,'DISCONNECTED / HOLD');
assert.deepEqual(one.calls,{inspect:1,run:1,read:1,reserve:1,verify:1,claim:1});
assert.equal((await bridge.runOne(packet)).accepted,false,'one operation per bridge');
assert.equal(one.calls.run,1,'replay must not dispatch');
const fail=[
  ['original device unenrolled',s=>{s.ql350.inspect=async()=>({...inspectOk,
    originalEnrollmentCount:0});}],
  ['QL350 original receipt absent',s=>{s.ql350.inspect=async()=>({...inspectOk,
    originalReceiptVerified:false});}],
  ['source signer missing',s=>{s.trust.verifyOriginalSourceEnrollment=async()=>({state:'HOLD'});}],
  ['source owner not signed',s=>{s.trust.verifySourceOwnerDecision=async()=>({decision:'REVIEW_ONLY'});}],
  ['master owner rejects',s=>{s.trust.verifyMasterOwnerDecision=async()=>({decision:'REJECT'});}],
  ['issuer revoked',s=>{s.trust.verifyOriginalIssuer=async()=>({revoked:true});}],
  ['not private operator',s=>{s.trust.verifyPrivateOperator=async()=>({state:'DENIED'});}],
  ['TLS not verified',s=>{s.trust.verifyPrivateTransport=async()=>({state:'OFF'});}],
  ['nonce replay',s=>{s.trust.claimNonceOnce=async()=>({claimed:false});}],
  ['operation missing persistent binding',s=>{s.trust.reserveQl350Operation=async()=>({state:'CANDIDATE'});}],
  ['operation wrong authorization binding',s=>{s.trust.reserveQl350Operation=async()=>({
    state:'PERSISTENT_SINGLE_USE_OPERATION_RESERVED',sourceId:'rosiedazzlers',
    operationId,nonceSha256,requestSha256,authorizationSha256:'0'.repeat(64)});}],
  ['QL350 denies signed GET',s=>{s.ql350.runOne=async()=>{s.calls.run++;
    return {state:'HOLD_SOURCE_TEST'};};}],
  ['wrong original receipt digest',s=>{s.trust.readOriginalSignedGet=async()=>({
    receiptSha256:'0'.repeat(64)});}],
  ['invalid independent receipt',s=>{s.trust.verifyOriginalBrokerReceipt=async()=>({verified:false});}]
];
for(const [label,change] of fail){
  const s=setup();change(s);const result=await s.make().runOne(packet);
  assert.equal(result.accepted,false,`${label}: ${result.state}`);
  assert.equal(result.connected,false,label);
  assert.ok(s.calls.run<=1,label);
}
for(const altered of [
  p=>{p.envelope.method='POST';},
  p=>{p.envelope.path='/api/integration/v1/shell/capabilities';},
  p=>{p.envelope.source='devilndove';},
  p=>{p.envelope.tenant='other';}
]){
  const s=setup(),p=structuredClone(packet);altered(p);
  assert.equal((await s.make().runOne(p)).accepted,false);
  assert.equal(s.calls.run,0);
}
assert.equal(ql788Cli(['--status']).accepted,false);
assert.throws(()=>ql788Cli(['--run']));
assert.throws(()=>createOriginalQl350RosieBridge788({ql350:{},originalTrust:{}}));
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
assert.match(read('admin-comms-hub-v781.html'),/Original QL-350 Rosie broker integration/);
assert.match(read('admin-integrations.html'),/Build 788/);
assert.match(read('admin-catalog.html'),/Build 788/);
assert.equal(read('admin-integrations.html'),read('admin-integrations/index.html'));
assert.equal(read('admin-catalog.html'),read('admin-catalog/index.html'));
assert.match(read('scripts/current_booking_wizard_regression.sh'),/build788_original_ql350_bridge_test/);
console.log('Build 788 PASS: one-shot original QL350 Rosie bridge, exact signed receipt readback, 18 denial scopes, no public activation, original authorities still unverified.');
