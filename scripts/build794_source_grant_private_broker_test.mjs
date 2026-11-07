import assert from 'node:assert/strict';
import {createHash,generateKeyPairSync,sign} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {createQl794OriginalSourceGrantSafety,ql794Cli}
  from './ql794_scoped_original_source_grant_private_broker.mjs';

// SYNTHETIC CI fixtures only. Keys are not Ree/Jack's original credentials.
const now=Date.parse('2026-11-07T20:00:00.000Z'),SHA=c=>c.repeat(64);
const canonical=v=>Array.isArray(v)?'['+v.map(canonical).join(',')+']':
  v!==null&&typeof v==='object'?'{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+canonical(v[k])).join(',')+'}':JSON.stringify(v);
const hash=v=>createHash('sha256').update(canonical(v)).digest('hex');
const uuid='fbca306d-6867-4d46-9c63-7ce2172b870e';
const roles=['source','master'];
const keys=Object.fromEntries(roles.map(role=>{
  const pair=generateKeyPairSync('ed25519');
  return [role,{privateKey:pair.privateKey,
    publicKeyPem:pair.publicKey.export({format:'pem',type:'spki'}).toString(),
    spkiSha256:createHash('sha256').update(pair.publicKey.export({format:'der',type:'spki'})).digest('hex')}];
}));
const peers={rosiedazzlers:['business','rosiedazzlers'],
  devilndove:['business','devilndove-site'],icamp:['business','iCamp'],
  yw:['business','yw'],'ai-data-platform':['support','ai-data-platform'],
  'rosevear-ai-hub':['support','rosevear-ai-hub']};
const handoff={schema:'rosevear.hub.ql361.archived-chain-redaction-handoff.v1',
  kind:'OWNER_PRIVATE_OFFLINE_SOURCE_REVIEW_ONLY',
  archiveId:'ql360-29a59710-c3b8-46ce-b868-8a1671d04c39.json',
  archiveSha256:SHA('1'),redactionAuditSha256:SHA('2'),
  independentAuditorSpkiSha256:SHA('3'),
  auditAttestation:{payload:{schema:'rosevear.hub.ql361.independent-redaction-audit.v1'},
    signature:Buffer.alloc(64).toString('base64url')},
  receiverStopped:true,connectedCount:0,candidateCount:6,
  candidates:Object.entries(peers).map(([peerId,[peerKind,repository]])=>({
    peerId,peerKind,repository,state:'AWAITING_INDEPENDENT_SOURCE_OWNER_SIGNATURE',
    sourceTestAuthorized:false,customerDataAllowed:false,
    requestedScope:'HEALTH_READ_ONLY_TEST_PROPOSAL_NOT_AUTHORIZATION'})),
  customerCommunications:false,deviceActions:false,
  nextAction:'SIX_SEPARATE_SOURCE_OWNER_SIGNED_TEST_DECISIONS_REQUIRED'};
const proof={schema:handoff.schema,
  state:'ORIGINAL_TEST_ARCHIVE_INDEPENDENTLY_AUDITED_SIX_OWNER_CANDIDATES_HELD',
  archivedOriginalChainVerified:true,independentRedactionAuditVerified:true,
  ownerControlledHandoffVerified:true,candidateCount:6,
  connected:false,connectedCount:0,connectionState:'DISCONNECTED / HOLD',
  handoffId:'ql361-29a59710-c3b8-46ce-b868-8a1671d04c39.json',
  handoffSha256:hash(handoff)};
const readback={state:'ORIGINAL_REE_QL361_HANDOFF_READBACK_VERIFIED',
  originalComputer:'DESKTOP-AE894KC',originalUser:'Ree',ownerOnlyAcl:true,
  handoffId:proof.handoffId,sha256:proof.handoffSha256,handoff};
const payload={schema:'rosie.comms.ql794.scoped-source-grant-request.v1',
  audience:'rosevear-comms-hub:rosiedazzlers:TEST',
  sourceId:'rosiedazzlers',tenantId:'rosie-dazzlers',environment:'TEST',
  method:'GET',path:'/api/integration/v1/shell/health',
  scope:'one-read-only-health-test-no-customer-access',
  handoffSha256:proof.handoffSha256,archiveSha256:handoff.archiveSha256,
  nonce:uuid,issuedAt:new Date(now-5_000).toISOString(),
  expiresAt:new Date(now+45_000).toISOString(),
  customerDataAllowed:false,deviceActionsAllowed:false};
const signature=(role,v)=>sign(null,Buffer.from(canonical(v)),keys[role].privateKey).toString('base64url');
const ownerDecisions={payload,sourceSignature:signature('source',payload),
  masterSignature:signature('master',payload)};
const grant={schema:'rosie.comms.ql794.original-source-only-grant-readback.v1',
  state:'ONE_ORIGINAL_ROSIE_HEALTH_TEST_GRANT_INDEPENDENTLY_APPROVED',
  sourceId:'rosiedazzlers',tenantId:'rosie-dazzlers',environment:'TEST',
  method:'GET',path:payload.path,decisionSha256:hash(payload),
  originalHandoffSha256:proof.handoffSha256,sourceGrantId:uuid,
  grantCount:1,revocationCount:0,sourceTestAuthorized:true,
  customerDataAllowed:false,otherPeerGrantCount:0,
  connected:false,connectionState:'DISCONNECTED / HOLD'};
const packet={envelope:{source:'rosiedazzlers',tenant:'rosie-dazzlers',
  environment:'TEST',method:'GET',path:payload.path,grantId:grant.sourceGrantId,
  decisionSha256:hash(payload),issuedAt:new Date(now-4_000).toISOString(),
  expiresAt:new Date(now+30_000).toISOString()},signature:'SIMULATED_NEVER_NETWORK'};
const get={state:'ONE_AUTHENTICATED_PRIVATE_ROSIE_SOURCE_GET_ACCEPTED_STILL_HELD',
  accepted:true,originalOperationId:uuid,requestSha256:SHA('4'),
  brokerReceiptSha256:SHA('5'),signedFieldWitnessSha256:SHA('6'),
  connected:false,connectionState:'DISCONNECTED / HOLD'};
const receipt={schema:'rosie.comms.ql794.original-private-source-isolation-readback.v1',
  state:'ONE_ROSIE_SOURCE_HEALTH_TEST_VERIFIED_FIVE_OTHER_PEERS_HELD',
  sourceId:'rosiedazzlers',tenantId:'rosie-dazzlers',environment:'TEST',
  method:'GET',path:payload.path,sourceGrantId:grant.sourceGrantId,
  originalOperationId:get.originalOperationId,requestSha256:get.requestSha256,
  brokerReceiptSha256:get.brokerReceiptSha256,
  signedFieldWitnessSha256:get.signedFieldWitnessSha256,
  sourceGetCount:1,connectedCount:0,customerBytes:0,deviceActions:0,
  otherPeerGrantCount:0,peers:Object.entries(peers).map(([peerId,[kind,repository]])=>({
    peerId,kind,repository,connectionState:'DISCONNECTED / HOLD',
    sourceTestAuthorized:peerId==='rosiedazzlers',customerDataAllowed:false})),
  connected:false,connectionState:'DISCONNECTED / HOLD'};
const clone=v=>structuredClone(v);
function setup(){
  const calls={handoff:0,read:0,pin:0,custody:0,grant:0,get:0,receipt:0};
  const originalOperator={
    verifyOriginalQl361Handoff:async()=>{calls.handoff++;return clone(proof);},
    readOriginalQl361Handoff:async()=>{calls.read++;return clone(readback);},
    resolveIndependentlyPinnedOriginalOwner:async role=>{
      calls.pin++;return {role,publicKeyPem:keys[role]?.publicKeyPem,spkiSha256:keys[role]?.spkiSha256};},
    verifyIndependentOriginalOwnerCustody:async args=>{
      calls.custody++;return {...args,authenticated:true,revoked:false};},
    readOriginalRosieSourceGrant:async()=>{calls.grant++;return clone(grant);},
    runOneAuthenticatedPrivateRosieGet:async()=>{calls.get++;return clone(get);},
    readIndependentBrokerReceiptAndSixPeerIsolation:async()=>{calls.receipt++;return clone(receipt);}
  };
  return {calls,originalOperator,make:()=>createQl794OriginalSourceGrantSafety({originalOperator,now:()=>now})};
}
const s=setup(),runner=s.make(),valid=await runner.runOne({ownerDecisions,sourceSignedPacket:packet});
assert.equal(valid.accepted,true,valid.state);
assert.equal(valid.ownerSignaturesVerified,true);
assert.equal(valid.privateBrokerHealthVerified,true);
assert.equal(valid.fiveOtherPeersIsolated,true);
assert.equal(valid.connected,false);
assert.equal(valid.customerBytes,0);
assert.deepEqual(s.calls,{handoff:1,read:1,pin:2,custody:2,grant:1,get:1,receipt:1});
assert.equal((await runner.runOne({ownerDecisions,sourceSignedPacket:packet})).accepted,false);
assert.equal(s.calls.get,1);

const negative=[
  ['handoff','audit absent','independentRedactionAuditVerified',false],
  ['handoff','handoff absent','ownerControlledHandoffVerified',false],
  ['handoff','candidate count wrong','candidateCount',5],
  ['handoff','peer connected','connectedCount',1],
  ['handoff','digest wrong','handoffSha256',SHA('a')],
  ['read','foreign original','originalComputer','TEMPLAR'],
  ['read','wrong original user','originalUser','Root'],
  ['read','ACL wrong','ownerOnlyAcl',false],
  ['read','digest mismatch','sha256',SHA('b')],
  ['grant','not approved','state','PENDING'],
  ['grant','foreign source','sourceId','yw'],
  ['grant','foreign child','tenantId','other'],
  ['grant','decision mismatch','decisionSha256',SHA('d')],
  ['grant','wrong handoff','originalHandoffSha256',SHA('e')],
  ['grant','duplicate grants','grantCount',2],
  ['grant','revoked','revocationCount',1],
  ['grant','test denied','sourceTestAuthorized',false],
  ['grant','customer allowed','customerDataAllowed',true],
  ['grant','other grants','otherPeerGrantCount',1],
  ['grant','premature connection','connected',true],
  ['get','GET rejected','accepted',false],
  ['get','invalid operation','originalOperationId','bad'],
  ['get','missing witness','signedFieldWitnessSha256','bad'],
  ['get','GET connected','connected',true],
  ['receipt','foreign source receipt','sourceId','yw'],
  ['receipt','wrong grant receipt','sourceGrantId','bad'],
  ['receipt','operation mismatch','originalOperationId','bad'],
  ['receipt','broker mismatch','brokerReceiptSha256',SHA('f')],
  ['receipt','GET duplicated','sourceGetCount',2],
  ['receipt','customer bytes leaked','customerBytes',1],
  ['receipt','other grant','otherPeerGrantCount',1],
  ['receipt','connected count','connectedCount',1]
];
const fns={handoff:'verifyOriginalQl361Handoff',read:'readOriginalQl361Handoff',
  grant:'readOriginalRosieSourceGrant',get:'runOneAuthenticatedPrivateRosieGet',
  receipt:'readIndependentBrokerReceiptAndSixPeerIsolation'};
for(const [where,label,field,value] of negative){
  const x=setup(),v=clone({handoff:proof,read:readback,grant,get,receipt}[where]);
  v[field]=value;x.originalOperator[fns[where]]=async()=>{x.calls[where]++;return v;};
  const denied=await x.make().runOne({ownerDecisions,sourceSignedPacket:packet});
  assert.equal(denied.accepted,false,label+': '+denied.state);
  assert.equal(denied.connected,false,label);
  assert.equal(x.calls.get,where==='get'||where==='receipt'?1:0,label);
  assert.equal(x.calls.receipt,where==='receipt'?1:0,label);
}
const nested=[
  ['duplicate candidate','read',v=>{v.handoff.candidates[1]=clone(v.handoff.candidates[0]);}],
  ['candidate prematurely authorized','read',v=>{v.handoff.candidates[0].sourceTestAuthorized=true;}],
  ['candidate secret extra','read',v=>{v.handoff.candidates[0].customerEmail='secret';}],
  ['candidate repo swapped','read',v=>{v.handoff.candidates[0].repository='foreign';}],
  ['auditor signature invalid','read',v=>{v.handoff.auditAttestation.signature='bad';}],
  ['other peer source authorized','receipt',v=>{v.peers[1].sourceTestAuthorized=true;}],
  ['other peer customer allowed','receipt',v=>{v.peers[1].customerDataAllowed=true;}],
  ['peer missing','receipt',v=>{v.peers.pop();}],
  ['duplicate peer','receipt',v=>{v.peers[1]=clone(v.peers[0]);}],
  ['foreign peer','receipt',v=>{v.peers[0].peerId='unknown';}],
  ['Rosie not authorized','receipt',v=>{v.peers[0].sourceTestAuthorized=false;}],
  ['peer connected','receipt',v=>{v.peers[0].connectionState='CONNECTED';}]
];
for(const [label,where,mutate] of nested){
  const x=setup(),v=clone({read:readback,receipt}[where]);mutate(v);
  x.originalOperator[fns[where]]=async()=>{x.calls[where]++;return v;};
  const denied=await x.make().runOne({ownerDecisions,sourceSignedPacket:packet});
  assert.equal(denied.accepted,false,label+': '+denied.state);
}
for(const mutate of [v=>v.payload.sourceId='devilndove',
  v=>v.payload.tenantId='wrong',v=>v.payload.method='POST',
  v=>v.payload.path='/api/customers',
  v=>v.payload.expiresAt=new Date(now-1).toISOString(),
  v=>v.payload.customerDataAllowed=true,
  v=>v.sourceSignature='tampered',
  v=>v.masterSignature=signature('source',payload)]){
  const x=setup(),bad=clone(ownerDecisions);mutate(bad);
  assert.equal((await x.make().runOne({ownerDecisions:bad,sourceSignedPacket:packet})).accepted,false);
  assert.equal(x.calls.get,0);
}
const badPacket=setup(),wrongPacket=clone(packet);wrongPacket.envelope.grantId='other';
assert.equal((await badPacket.make().runOne({ownerDecisions,sourceSignedPacket:wrongPacket})).accepted,false);
assert.equal(badPacket.calls.get,0);
const badPin=setup();badPin.originalOperator.resolveIndependentlyPinnedOriginalOwner=
  async role=>({role,spkiSha256:SHA('0'),publicKeyPem:keys[role].publicKeyPem});
assert.equal((await badPin.make().runOne({ownerDecisions,sourceSignedPacket:packet})).accepted,false);
const revoked=setup();revoked.originalOperator.verifyIndependentOriginalOwnerCustody=
  async args=>({...args,authenticated:true,revoked:true});
assert.equal((await revoked.make().runOne({ownerDecisions,sourceSignedPacket:packet})).accepted,false);
const offline=setup();offline.originalOperator.verifyOriginalQl361Handoff=async()=>{throw Error('offline');};
assert.equal((await offline.make().runOne({ownerDecisions,sourceSignedPacket:packet})).accepted,false);
assert.throws(()=>createQl794OriginalSourceGrantSafety({}));
assert.equal(ql794Cli(['--status']).accepted,false);
assert.throws(()=>ql794Cli(['--run']));

const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const win=read('scripts/inspect-rosie-original-ql361-794.ps1');
assert.match(win,/669a9f49351258e514b7730c290b159ef5b66c52/);
assert.match(win,/ql361-windows-owner-audit\.ps1/);
assert.match(win,/ArchiveDigest/);
assert.doesNotMatch(win,/Start-Service|Stop-Service|Set-ExecutionPolicy|New-NetFirewallRule|Set-NetFirewallRule|git\s+pull|StoreCredential|ExportPostTest|service_role/i);
assert.match(read('admin-comms-hub-v781.html'),/Build 794 · QL-361/);
assert.match(read('admin-integrations.html'),/Build 794/);
assert.match(read('admin-catalog.html'),/Build 794/);
assert.equal(read('admin-integrations.html'),read('admin-integrations/index.html'));
assert.equal(read('admin-catalog.html'),read('admin-catalog/index.html'));
assert.match(read('scripts/current_booking_wizard_regression.sh'),/build794_source_grant_private_broker_test/);
console.log('Build 794 PASS: synthetic distinct Ed25519 owner signatures, original scoped grant, single signed Rosie GET, five HELD peers; '+(negative.length+nested.length+8+3)+' denial cases, no real original authority.');
