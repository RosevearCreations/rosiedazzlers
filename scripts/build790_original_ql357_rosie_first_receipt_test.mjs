import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createOriginalQl357RosieFirstReceipt790,ql790Cli}
  from './ql790_original_ql357_rosie_first_receipt.mjs';

const time=Date.parse('2026-11-07T20:00:00.000Z');
const packet={envelope:{source:'rosiedazzlers',tenant:'rosie-dazzlers',
  environment:'TEST',method:'GET',path:'/api/integration/v1/shell/health',
  authorizationSha256:'a'.repeat(64),
  issuedAt:new Date(time-10_000).toISOString(),
  expiresAt:new Date(time+60_000).toISOString()},signature:'SYNTHETIC_TEST_ONLY'};
const acceptedDevice={schema:'rosevear.hub.ql357.original-private-test-activation.v1',
  state:'ONE_ORIGINAL_CROSS_DEVICE_TEST_RECEIPT_VERIFIED_SIX_APPS_STILL_HELD',
  firstPrivateTestAccepted:true,originalTestReceiptVerified:true,
  originalReceiptCount:1,deviceId:'rosevear-windows-hub',
  receivedAt:new Date(time-20_000).toISOString(),connected:false,
  connectedCount:0,connectionState:'DISCONNECTED / HOLD'};
const got={state:'ONE_GENUINE_ROSIE_ORIGINAL_GET_WITNESS_CLOSED_STILL_HELD',
  accepted:true,originalWindowsWitnessAccepted:true,connected:false,
  connection:'DISCONNECTED / HOLD',witnessSha256:'b'.repeat(64),
  requestSha256:'c'.repeat(64),originalBrokerReceiptSha256:'d'.repeat(64),
  originalOperationId:'fbca306d-6867-4d46-9c63-7ce2172b870e'};
const ledger={schema:'rosie.comms.ql790.original-ledger-first-get.v1',
  sourceId:'rosiedazzlers',tenantId:'rosie-dazzlers',environment:'TEST',
  method:'GET',path:'/api/integration/v1/shell/health',
  operationId:got.originalOperationId,
  requestSha256:got.requestSha256,brokerReceiptSha256:got.originalBrokerReceiptSha256,
  fieldWitnessSha256:got.witnessSha256,sourceTestCount:1,customerBytes:0,
  sourceConnected:false,connectionState:'DISCONNECTED / HOLD'};
function setup(){
  const calls={device:0,get:0,ledger:0};
  const operator={
    verifyQl357DeviceReceipt:async()=>{calls.device++;return acceptedDevice;},
    runOriginal789:async()=>{calls.get++;return got;},
    readFirstRosieLedger:async()=>{calls.ledger++;return ledger;}};
  return {operator,calls,make:()=>createOriginalQl357RosieFirstReceipt790({
    originalOperator:operator,now:()=>time})};
}
const good=setup(),first=good.make();
assert.equal(first.inspect().accepted,false);
const success=await first.runOne(packet);
assert.equal(success.accepted,true,success.state);
assert.equal(success.firstGenuineRosieGetAccepted,true);
assert.equal(success.connected,false);
assert.equal(success.connectionState,'DISCONNECTED / HOLD');
assert.equal(success.sourceGrants,0);
assert.equal(success.customerCommunications,0);
assert.deepEqual(good.calls,{device:1,get:1,ledger:1});
assert.equal((await first.runOne(packet)).accepted,false);
assert.equal(good.calls.get,1,'no second private GET');

const scenarios=[
  ['no QL357 original device receipt',s=>{s.operator.verifyQl357DeviceReceipt=async()=>({...acceptedDevice,originalReceiptCount:0});},0,0],
  ['QL357 own verified flag false',s=>{s.operator.verifyQl357DeviceReceipt=async()=>({...acceptedDevice,originalTestReceiptVerified:false});},0,0],
  ['QL357 different device',s=>{s.operator.verifyQl357DeviceReceipt=async()=>({...acceptedDevice,deviceId:'not-original'});},0,0],
  ['QL357 foreign issuer state',s=>{s.operator.verifyQl357DeviceReceipt=async()=>({...acceptedDevice,state:'HOLD'});},0,0],
  ['QL357 claims connected',s=>{s.operator.verifyQl357DeviceReceipt=async()=>({...acceptedDevice,connected:true});},0,0],
  ['QL357 wrong peer count',s=>{s.operator.verifyQl357DeviceReceipt=async()=>({...acceptedDevice,connectedCount:1});},0,0],
  ['QL789 no authenticated GET',s=>{s.operator.runOriginal789=async()=>{s.calls.get++;return {...got,accepted:false};};},1,0],
  ['QL789 witness not verified',s=>{s.operator.runOriginal789=async()=>{s.calls.get++;return {...got,originalWindowsWitnessAccepted:false};};},1,0],
  ['QL789 no receipt',s=>{s.operator.runOriginal789=async()=>{s.calls.get++;return {...got,originalBrokerReceiptSha256:''};};},1,0],
  ['QL789 missing operation',s=>{s.operator.runOriginal789=async()=>{s.calls.get++;return {...got,originalOperationId:''};};},1,0],
  ['private ledger not present',s=>{s.operator.readFirstRosieLedger=async()=>{s.calls.ledger++;return null;};},1,1],
  ['private ledger request mismatch',s=>{s.operator.readFirstRosieLedger=async()=>{s.calls.ledger++;return {...ledger,requestSha256:'e'.repeat(64)};};},1,1],
  ['private ledger receipt mismatch',s=>{s.operator.readFirstRosieLedger=async()=>{s.calls.ledger++;return {...ledger,brokerReceiptSha256:'e'.repeat(64)};};},1,1],
  ['private ledger witness mismatch',s=>{s.operator.readFirstRosieLedger=async()=>{s.calls.ledger++;return {...ledger,fieldWitnessSha256:'e'.repeat(64)};};},1,1],
  ['private ledger duplicate GET',s=>{s.operator.readFirstRosieLedger=async()=>{s.calls.ledger++;return {...ledger,sourceTestCount:2};};},1,1],
  ['private ledger customer data',s=>{s.operator.readFirstRosieLedger=async()=>{s.calls.ledger++;return {...ledger,customerBytes:1};};},1,1],
  ['private ledger connected',s=>{s.operator.readFirstRosieLedger=async()=>{s.calls.ledger++;return {...ledger,sourceConnected:true};};},1,1],
  ['private ledger foreign source',s=>{s.operator.readFirstRosieLedger=async()=>{s.calls.ledger++;return {...ledger,sourceId:'icamp'};};},1,1],
  ['private ledger extra untrusted fields',s=>{s.operator.readFirstRosieLedger=async()=>{s.calls.ledger++;return {...ledger,approved:true};};},1,1]
];
for(const [name,alter,getCount,ledgerCount] of scenarios){
  const s=setup();alter(s);
  const denied=await s.make().runOne(packet);
  assert.equal(denied.accepted,false,`${name} ${denied.state}`);
  assert.equal(denied.connected,false,name);
  assert.equal(s.calls.get,getCount,name);
  assert.equal(s.calls.ledger,ledgerCount,name);
}
for(const alter of [p=>p.envelope.source='other',
  p=>p.envelope.tenant='wrong',p=>p.envelope.environment='PRODUCTION',
  p=>p.envelope.method='POST',p=>p.envelope.path='/api/customer',
  p=>p.envelope.expiresAt=new Date(time).toISOString()]){
  const s=setup(),bad=structuredClone(packet);alter(bad);
  assert.equal((await s.make().runOne(bad)).accepted,false);
  assert.deepEqual(s.calls,{device:0,get:0,ledger:0});
}
assert.throws(()=>createOriginalQl357RosieFirstReceipt790({}));
assert.equal(ql790Cli(['--status']).accepted,false);
assert.throws(()=>ql790Cli(['--run']));
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const win=read('scripts/inspect-rosie-original-field-790.ps1');
assert.match(win,/67759492e56443f9c70f4ed25e506a6253e2b237/);
assert.match(win,/ql357-windows-owner-activation\.ps1/);
assert.match(win,/-ReviewSigned/);
assert.match(win,/-PrivateReadback/);
assert.match(win,/-VerifyReceipt/);
assert.doesNotMatch(win,/Start-Service|Stop-Service|Set-ExecutionPolicy|New-NetFirewallRule|Set-NetFirewallRule|git\s+pull|service_role/i);
assert.match(read('admin-comms-hub-v781.html'),/Build 790 original QL-357/);
assert.match(read('admin-integrations.html'),/Build 790/);
assert.match(read('admin-catalog.html'),/Build 790/);
assert.equal(read('admin-integrations.html'),read('admin-integrations/index.html'));
assert.equal(read('admin-catalog.html'),read('admin-catalog/index.html'));
assert.match(read('scripts/current_booking_wizard_regression.sh'),/build790_original_ql357_rosie_first_receipt_test/);
console.log('Build 790 PASS: QL-357 genuine original device proof required before one Rosie QL-789 GET; exact independent first immutable ledger cross-check, 25 fail-closed cases, no public activation. Original Windows ceremony remains HOLD.');
