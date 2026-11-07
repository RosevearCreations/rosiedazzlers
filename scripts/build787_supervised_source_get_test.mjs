import assert from 'node:assert/strict';
import {performSupervisedRosieGet787,ql787Cli}
  from './ql787_supervised_source_get.mjs';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const at=Date.parse('2026-11-07T17:00:00.000Z');
const sha=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
const canonical=v=>Array.isArray(v)?'['+v.map(canonical).join(',')+']':
  v&&typeof v==='object'?'{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+canonical(v[k])).join(',')+'}':JSON.stringify(v);
const digest=x=>createHash('sha256').update(canonical(x)).digest('hex');
const sourcePin='a'.repeat(64),reePin='b'.repeat(64),jackPin='c'.repeat(64);
const issuerPin='d'.repeat(64),witnessPin='e'.repeat(64),brokerPin='f'.repeat(64);
const deviceEnrollmentSha256='9'.repeat(64);
const packet={envelope:{schema:'rosie.comms.source-signed-get.v1',
  source:'rosiedazzlers',tenant:'rosie-dazzlers',
  audience:'rosevear-comms-hub:nonproduction',environment:'TEST',
  method:'GET',path:'/api/integration/v1/shell/health',
  nonce:'synthetic-source-get-nonce-abcdefghijklmnop',
  issuedAt:new Date(at-10_000).toISOString(),
  expiresAt:new Date(at+60_000).toISOString(),
  authorizationSha256:'1'.repeat(64)},signature:'A'.repeat(86)};
const requestSha256=digest(packet),nonceSha256=digest(packet.envelope.nonce),auth=packet.envelope.authorizationSha256;

function setup(){
  const calls={get:0,nonce:0,receipt:0};
  const deps={
    verifyOriginalIssuer:async()=>({role:'original_issuer',authenticated:true,
      revoked:false,spkiSha256:issuerPin,
      enrollmentPayloadSha256:deviceEnrollmentSha256}),
    verifyIndependentWitness:async()=>({role:'field_witness',authenticated:true,
      revoked:false,spkiSha256:witnessPin,
      enrollmentPayloadSha256:deviceEnrollmentSha256}),
    verifyOriginalDeviceReceipt:async()=>({state:
      'FIRST_PRIVATE_ORIGINAL_DEVICE_TEST_ACCEPTED_SIX_SOURCES_STILL_HELD',
      receiptCount:1,firstPrivateTestAccepted:true,sourceTestAuthorized:false,
      connected:false,enrollmentPayloadSha256:deviceEnrollmentSha256}),
    verifyOriginalSourceEnrollment:async()=>({state:'ORIGINAL_ROSIE_SOURCE_ENROLLED_TEST',
      source:'rosiedazzlers',tenant:'rosie-dazzlers',environment:'TEST',
      revoked:false,keyPin:sourcePin,sourceTestAuthorized:true,
      originalDeviceEnrollmentSha256:deviceEnrollmentSha256}),
    verifySourceOwnerDecision:async()=>({role:'source',decision:'APPROVE_TEST_ONLY',
      authorizationSha256:auth,spkiSha256:reePin,expiresAt:at+200_000}),
    verifyMasterOwnerDecision:async()=>({role:'master',decision:'APPROVE_TEST_ONLY',
      authorizationSha256:auth,spkiSha256:jackPin,expiresAt:at+200_000}),
    verifySourceSignature:async()=>({verified:true,sourceKeyPin:sourcePin,
      requestSha256}),
    verifyPrivateOperator:async()=>({state:'ORIGINAL_OWNER_AUTHENTICATED_PRIVATE_SESSION',
      originalComputer:'DESKTOP-AE894KC',expiresAt:at+200_000}),
    verifyPrivateTransport:async()=>({state:'ORIGINAL_TLS_TAILNET_TRANSPORT_INDEPENDENTLY_VERIFIED',
      originalComputer:'DESKTOP-AE894KC',tlsVerified:true,
      privateReceiverLoopbackVerified:true,observedAt:at-5_000}),
    claimNonceOnce:async()=>{calls.nonce++;return {claimed:true,nonceSha256,requestSha256};},
    performPrivateGet:async ({method,fixedPath})=>{
      calls.get++;assert.equal(method,'GET');
      assert.equal(fixedPath,packet.envelope.path);
      return {method:'GET',httpStatus:200,path:fixedPath,
        customerBytes:0,requestSha256,receipt:{private:'fake-memory-only'}};},
    verifyOriginalBrokerReceipt:async()=>{calls.receipt++;return {
      verified:true,receiptSha256:brokerPin,originalBrokerSpkiSha256:brokerPin,
      requestSha256,nonceSha256,authorizationSha256:auth,
      source:'rosiedazzlers',tenant:'rosie-dazzlers',path:packet.envelope.path,
      customerBytes:0,observedAt:at-1_000};}
  };
  return {deps,calls};
}
const run=({deps,calls},p=packet,now=at)=>performSupervisedRosieGet787({packet:p,
  privateDependencies:deps,now});
assert.equal((await performSupervisedRosieGet787({packet})).accepted,false);
const healthy=setup();
const synthetic=await run(healthy);
assert.equal(synthetic.accepted,true,synthetic.state);
assert.equal(synthetic.independentBrokerReceiptAccepted,true);
assert.equal(synthetic.connected,false);
assert.equal(synthetic.connection,'DISCONNECTED / HOLD');
assert.equal(healthy.calls.get,1);
assert.equal(healthy.calls.nonce,1);
assert.equal(healthy.calls.receipt,1);
assert.equal(synthetic.customerBytes,0);
assert.equal(JSON.stringify(synthetic).includes(packet.envelope.nonce),false);

const cases=[
  [s=>{s.deps.verifyOriginalIssuer=async()=>({authenticated:false});},'issuer missing'],
  [s=>{s.deps.verifyIndependentWitness=async()=>({role:'field_witness',authenticated:true,revoked:true,spkiSha256:witnessPin});},'witness revoked'],
  [s=>{s.deps.verifyOriginalDeviceReceipt=async()=>({receiptCount:0});},'device absent'],
  [s=>{s.deps.verifyOriginalSourceEnrollment=async()=>({state:'HOLD'});},'source not enrolled'],
  [s=>{s.deps.verifyOriginalSourceEnrollment=async()=>({state:'ORIGINAL_ROSIE_SOURCE_ENROLLED_TEST',source:'rosiedazzlers',tenant:'other',environment:'TEST',revoked:false,keyPin:sourcePin,sourceTestAuthorized:true,originalDeviceEnrollmentSha256:deviceEnrollmentSha256});},'wrong tenant'],
  [s=>{s.deps.verifySourceOwnerDecision=async()=>({decision:'REVIEW_ONLY'});},'review only'],
  [s=>{s.deps.verifyMasterOwnerDecision=async()=>({role:'master',decision:'REJECT'});},'owner rejects'],
  [s=>{s.deps.verifyMasterOwnerDecision=async()=>({role:'master',decision:'APPROVE_TEST_ONLY',authorizationSha256:auth,spkiSha256:reePin,expiresAt:at+200_000});},'same owner key'],
  [s=>{s.deps.verifyMasterOwnerDecision=async()=>({role:'master',decision:'APPROVE_TEST_ONLY',authorizationSha256:'0'.repeat(64),spkiSha256:jackPin,expiresAt:at+200_000});},'owner digest mismatch'],
  [s=>{s.deps.verifySourceSignature=async()=>({verified:false});},'source signature'],
  [s=>{s.deps.verifyPrivateOperator=async()=>({state:'INVALID'});},'private operator'],
  [s=>{s.deps.verifyPrivateTransport=async()=>({state:'WRONG'});},'transport missing'],
  [s=>{s.deps.claimNonceOnce=async()=>({claimed:false});},'nonce replay']
];
for(const [tamper,label] of cases){
  const s=setup();tamper(s);const got=await run(s);
  assert.equal(got.accepted,false,`${label}: ${got.state}`);
  assert.equal(s.calls.get,0,label);
  assert.equal(got.connected,false,label);
}
const wrongs=[
  p=>{p.envelope.path='/api/payments';},
  p=>{p.envelope.method='POST';},
  p=>{p.envelope.environment='PROD';},
  p=>{p.envelope.tenant='other';},
  p=>{p.envelope.expiresAt=new Date(at+95_000).toISOString();},
  p=>{p.envelope.customerEmail='private';},
  p=>{p.envelope.nonce='short';},
  p=>{p.signature='invalid';}
];
for(const change of wrongs){
  const p=structuredClone(packet),s=setup();change(p);
  assert.equal((await run(s,p)).accepted,false);
  assert.equal(s.calls.get,0);
}
assert.equal((await run(setup(),packet,at+61_000)).accepted,false,'expired 90sec GET');
{
  const s=setup();s.deps.performPrivateGet=async()=>{s.calls.get++;throw Error('unreachable');};
  const got=await run(s);assert.equal(got.accepted,false);assert.equal(s.calls.get,1);
  assert.match(got.state,/NO_AUTOMATIC_RETRY/);
}
{
  const s=setup();s.deps.verifyOriginalBrokerReceipt=async()=>({verified:false});
  const got=await run(s);assert.equal(got.accepted,false);assert.equal(s.calls.get,1);
}
assert.equal(ql787Cli(['--status']).accepted,false);
assert.throws(()=>ql787Cli(['--run']));
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
assert.match(read('admin-comms-hub-v781.html'),/First supervised Rosie source GET/);
assert.match(read('admin-integrations.html'),/Build 787/);
assert.match(read('admin-catalog.html'),/Build 787/);
assert.equal(read('admin-integrations.html'),read('admin-integrations/index.html'));
assert.equal(read('admin-catalog.html'),read('admin-catalog/index.html'));
assert.match(read('scripts/current_booking_wizard_regression.sh'),/build787_supervised_source_get_test/);
console.log('Build 787 PASS: private-operator-only one-shot GET, verified original device/source/owner/issuer/broker gates, 23 deny/fail cases and no public execution; synthetic success does not prove original trust.');
