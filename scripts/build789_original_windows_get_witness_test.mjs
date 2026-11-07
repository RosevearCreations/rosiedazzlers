import assert from 'node:assert/strict';
import {createHash,generateKeyPairSync,sign} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {createOriginalWindowsGetWitness789,ql789Cli}
  from './ql789_original_windows_get_witness.mjs';

const now=Date.parse('2026-11-07T20:00:00.000Z');
const canonical=v=>Array.isArray(v)?'['+v.map(canonical).join(',')+']':
  v&&typeof v==='object'?'{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+canonical(v[k])).join(',')+'}':JSON.stringify(v);
const hash=v=>createHash('sha256').update(v).digest('hex');
const keys=generateKeyPairSync('ed25519');
const der=keys.publicKey.export({format:'der',type:'spki'});
const pem=keys.publicKey.export({format:'pem',type:'spki'});
const pin={publicSpkiPem:pem,spkiSha256:hash(der)};
const ids={device:'1'.repeat(64),source:'2'.repeat(64),ree:'3'.repeat(64),
  jack:'4'.repeat(64),issuer:'5'.repeat(64),sourceSigner:'6'.repeat(64),
  brokerSigner:'7'.repeat(64),ownerReePin:'8'.repeat(64),ownerJackPin:'9'.repeat(64)};
const operationId='fbca306d-6867-4d46-9c63-7ce2172b870e';
const path='/api/integration/v1/shell/health';
const packet={envelope:{schema:'rosie.comms.source-signed-get.v1',
  source:'rosiedazzlers',tenant:'rosie-dazzlers',
  environment:'TEST',method:'GET',path,
  issuedAt:new Date(now-10_000).toISOString(),
  expiresAt:new Date(now+60_000).toISOString(),
  authorizationSha256:'a'.repeat(64)},signature:'TEST_ONLY'};
const got={accepted:true,connected:false,
  state:'ONE_SUPERVISED_ROSIE_TEST_GET_ACCEPTED_SOURCE_STILL_HELD',
  requestSha256:'b'.repeat(64),originalBrokerReceiptSha256:'c'.repeat(64),
  originalOperationId:operationId};
const field={state:'ORIGINAL_FIELD_ENROLLMENT_AND_OWNER_SIGNATURES_VERIFIED',
  originalComputer:'DESKTOP-AE894KC',source:'rosiedazzlers',
  tenant:'rosie-dazzlers',firstOriginalDeviceReceiptCount:1,
  originalDeviceEnrollmentSha256:ids.device,
  originalSourceEnrollmentSha256:ids.source,
  sourceOwnerDecisionSha256:ids.ree,
  masterOwnerDecisionSha256:ids.jack,
  sourceOwnerSpkiSha256:ids.ownerReePin,
  masterOwnerSpkiSha256:ids.ownerJackPin,
  originalIssuerSpkiSha256:ids.issuer,
  sourceSignerSpkiSha256:ids.sourceSigner,
  brokerSignerSpkiSha256:ids.brokerSigner};
const envelope={schema:'rosie.comms.ql789.original-signed-test-get-witness.v1',
  sourceId:'rosiedazzlers',tenantId:'rosie-dazzlers',
  originalComputer:'DESKTOP-AE894KC',environment:'TEST',
  operationId,requestSha256:got.requestSha256,
  receiptSha256:got.originalBrokerReceiptSha256,
  authorizationSha256:packet.envelope.authorizationSha256,
  originalDeviceEnrollmentSha256:field.originalDeviceEnrollmentSha256,
  originalSourceEnrollmentSha256:field.originalSourceEnrollmentSha256,
  sourceOwnerDecisionSha256:field.sourceOwnerDecisionSha256,
  masterOwnerDecisionSha256:field.masterOwnerDecisionSha256,
  result:'ONE_AUTHENTICATED_ROSIE_TEST_GET_STILL_HELD',
  observedAt:new Date(now-1_000).toISOString(),
  expiresAt:packet.envelope.expiresAt,customerBytes:0};
const signed=e=>({envelope:e,signature:sign(null,Buffer.from(canonical(e)),
  keys.privateKey).toString('base64url')});

function setup(){
  const calls={bridge:0,read:0,field:0,pin:0};
  const s={
    bridge:{runOne:async()=>{calls.bridge++;return got;}},
    originalOperator:{
      readOriginalField:async()=>{calls.field++;return field;},
      readAppendOnlyWitness:async()=>{calls.read++;return signed(envelope);},
      resolvePinnedFieldWitness:async()=>{calls.pin++;return pin;}
    },
    calls
  };
  s.make=()=>createOriginalWindowsGetWitness789({bridge:s.bridge,
    originalOperator:s.originalOperator,now:()=>now});
  return s;
}
const original=setup(),adapter=original.make();
assert.equal(adapter.inspect().accepted,false);
const accepted=await adapter.runOne(packet);
assert.equal(accepted.accepted,true,accepted.state);
assert.equal(accepted.originalWindowsWitnessAccepted,true);
assert.equal(accepted.connected,false);
assert.equal(accepted.sourceGrants,0);
assert.deepEqual(original.calls,{bridge:1,read:1,field:1,pin:1});
assert.equal((await adapter.runOne(packet)).accepted,false);
assert.equal(original.calls.bridge,1,'no replayed original GET');

const cases=[
  ['no original device receipt',s=>{s.originalOperator.readOriginalField=async()=>({...field,firstOriginalDeviceReceiptCount:0});},0],
  ['foreign original computer',s=>{s.originalOperator.readOriginalField=async()=>({...field,originalComputer:'OTHER'});},0],
  ['unverified original field',s=>{s.originalOperator.readOriginalField=async()=>({...field,state:'HOLD'});},0],
  ['broker QL350 fails',s=>{s.bridge.runOne=async()=>{s.calls.bridge++;return {accepted:false};};},1],
  ['broker signed digest missing',s=>{s.bridge.runOne=async()=>{s.calls.bridge++;return {...got,originalBrokerReceiptSha256:''};};},1],
  ['witness original readback unavailable',s=>{s.originalOperator.readAppendOnlyWitness=async()=>null;},1],
  ['independent witness pin mismatch',s=>{s.originalOperator.resolvePinnedFieldWitness=async()=>({...pin,spkiSha256:ids.source});},1],
  ['invalid independent witness signature',s=>{s.originalOperator.readAppendOnlyWitness=async()=>({...signed(envelope),signature:'B'.repeat(86)});},1],
  ['wrong source',s=>{s.originalOperator.readAppendOnlyWitness=async()=>signed({...envelope,sourceId:'devilndove'});},1],
  ['wrong tenant',s=>{s.originalOperator.readAppendOnlyWitness=async()=>signed({...envelope,tenantId:'other'});},1],
  ['wrong operation',s=>{s.originalOperator.readAppendOnlyWitness=async()=>signed({...envelope,operationId:'deca306d-6867-4d46-9c63-7ce2172b870e'});},1],
  ['wrong request digest',s=>{s.originalOperator.readAppendOnlyWitness=async()=>signed({...envelope,requestSha256:ids.ree});},1],
  ['wrong receipt digest',s=>{s.originalOperator.readAppendOnlyWitness=async()=>signed({...envelope,receiptSha256:ids.ree});},1],
  ['owner decision hash mismatch',s=>{s.originalOperator.readAppendOnlyWitness=async()=>signed({...envelope,masterOwnerDecisionSha256:ids.ree});},1],
  ['signed after source expiry',s=>{s.originalOperator.readAppendOnlyWitness=async()=>signed({...envelope,observedAt:packet.envelope.expiresAt});},1],
  ['customer bytes',s=>{s.originalOperator.readAppendOnlyWitness=async()=>signed({...envelope,customerBytes:1});},1],
  ['witness key equals broker key',s=>{s.originalOperator.readOriginalField=async()=>({...field,brokerSignerSpkiSha256:pin.spkiSha256});},1]
];
for(const [name,change,expectedBridgeCalls] of cases){
  const s=setup();change(s);
  const got=await s.make().runOne(packet);
  assert.equal(got.accepted,false,`${name}: ${got.state}`);
  assert.equal(got.connected,false,name);
  assert.equal(s.calls.bridge,expectedBridgeCalls,name);
}
for(const change of [p=>p.envelope.source='yw',
  p=>p.envelope.method='POST',p=>p.envelope.path='/api/customer',
  p=>p.envelope.tenant='wrong']){
  const s=setup(),altered=structuredClone(packet);change(altered);
  assert.equal((await s.make().runOne(altered)).accepted,false);
  assert.equal(s.calls.bridge,0);
}
assert.equal(ql789Cli(['--status']).accepted,false);
assert.throws(()=>ql789Cli(['--run']));
assert.throws(()=>createOriginalWindowsGetWitness789({}));
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
assert.match(read('admin-comms-hub-v781.html'),/Build 789 original Windows field witness/);
assert.match(read('admin-integrations.html'),/Build 789/);
assert.match(read('admin-catalog.html'),/Build 789/);
assert.equal(read('admin-integrations.html'),read('admin-integrations/index.html'));
assert.equal(read('admin-catalog.html'),read('admin-catalog/index.html'));
assert.match(read('scripts/current_booking_wizard_regression.sh'),/build789_original_windows_get_witness_test/);
const win=read('scripts/inspect-rosie-original-field-789.ps1');
assert.match(win,/ql356-windows-field-handoff\.ps1/);
assert.match(win,/-Status/);
assert.match(win,/29d8a29e3cac8c969a83027498e3b73d0acbe58e/);
assert.doesNotMatch(win,/Start-Service|Stop-Service|Set-ExecutionPolicy|New-NetFirewallRule|Set-NetFirewallRule|git\s+pull|service_role/i);
console.log('Build 789 PASS: real Ed25519 signed witness verification mechanics, original operation/receipt/owner binding, 21 denial paths, zero public field activation; original ceremony still HOLD.');
