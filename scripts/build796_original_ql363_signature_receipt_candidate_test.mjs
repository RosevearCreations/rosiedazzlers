import assert from 'node:assert/strict';
import {createHash,generateKeyPairSync,sign} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {createQl796OriginalDeviceReceiptCandidate,ql796Cli}
  from './ql796_original_ql363_signature_receipt_candidate.mjs';

// SYNTHETIC ephemeral signers and private-readback fixtures only. This test
// NEVER proves a real Ree/Jack authorization, DB retention or HTTP GET.
const at=Date.parse('2026-11-07T20:00:00.000Z');
const id='dc02007d-f7bd-47ba-aa9d-4a0236cd801b';
const fmt=x=>new Date(x).toISOString();
const hex=x=>x.repeat(64);
const canon=v=>Array.isArray(v)?'['+v.map(canon).join(',')+']':
  v!==null&&typeof v==='object'?'{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+canon(v[k])).join(',')+'}':JSON.stringify(v);
const sha=v=>createHash('sha256').update(canon(v)).digest('hex');
const clone=v=>structuredClone(v);
const roles=['issuer','witness','source_owner','master_owner',
  'redaction_auditor','source_signer','retention_witness'];
const keys=Object.fromEntries(roles.map(role=>{
  const pair=generateKeyPairSync('ed25519');
  const pub=pair.publicKey.export({type:'spki',format:'der'});
  return [role,{secret:pair.privateKey,
    publicKeyPem:pair.publicKey.export({type:'spki',format:'pem'}).toString(),
    spkiSha256:createHash('sha256').update(pub).digest('hex')}];
}));
const signed=(role,payload)=>sign(null,Buffer.from(canon(payload)),
  keys[role].secret).toString('base64url');
const source='rosiedazzlers',healthPath='/api/integration/v1/shell/health';
const scope='HEALTH_METADATA_ONLY_NO_CUSTOMERS_OR_DEVICES';
const held='DISCONNECTED / HOLD',commit='b'.repeat(40);
const contractPayload={
  schema:'rosevear.hub.ql363.six-source-health-contract.v1',
  sourceId:source,sourceAppId:source,repository:'RosevearCreations/rosiedazzlers',
  tenantBoundary:'owned_business_legacy',sourceCommitSha:commit,
  manifestSha256:hex('a'),sourceOrigin:'https://rosie-private.example.invalid',
  environment:'TEST',method:'GET',path:healthPath,
  responseSchema:'rosevear.hub.ql362.source-health-receipt.v1',
  receiptSchema:'rosevear.hub.ql363.source-signed-health-receipt.v1',
  scope,redirects:'DENY',maxResponseBytes:4096,persistentConnectionAllowed:false,
  issuedAt:fmt(at-1000),expiresAt:fmt(at+60_000)};
const contract={schema:contractPayload.schema,payload:contractPayload,
  signature:signed('source_signer',contractPayload),keyId:'rosie-test-signing-ephemeral'};
const record={sourceId:source,commitSha:commit,tlsSpkiSha256:hex('c'),
  manifest:{source_id:source,source_commit_sha:commit},
  manifestTrustPin:{sourceId:source,spkiSha256:hex('e')},contract};
const requestSha256=hex('f');
const preflight={schema:'rosie.comms.ql796.original-ql362-device-preflight.v1',
  state:'ORIGINAL_REE_JACK_INDEPENDENT_SIGNERS_DEVICE_TEST_READY',
  originalReeComputer:'DESKTOP-AE894KC',originalReeUser:'Ree',
  independentJackComputer:'TEMPLAR',independentJackUser:'jfros',
  originalIssuerAuthenticated:true,independentWitnessAuthenticated:true,
  sourceOwnerCustodyAuthenticated:true,masterOwnerCustodyAuthenticated:true,
  originalEnrollmentCount:1,originalSignedTestReceiptCount:1,
  originalRevocationCount:0,databaseRole:'ql340c_private_receiver',
  receiverListenerCount:0,tailnetGatewayListenerCount:0,connectedCount:0,
  connectionState:held,observedAt:at,
  issuerSpkiSha256:keys.issuer.spkiSha256,
  witnessSpkiSha256:keys.witness.spkiSha256,
  sourceOwnerSpkiSha256:keys.source_owner.spkiSha256,
  masterOwnerSpkiSha256:keys.master_owner.spkiSha256,
  redactionAuditorSpkiSha256:keys.redaction_auditor.spkiSha256};
const manifest={state:'SIGNED_MANIFEST_VERIFIED_SOURCE_GRANT_HELD',
  sourceId:source,sourceCommitSha:commit,manifestSha256:hex('a'),
  originalIndependentPinVerified:true,sourceTestAuthorized:false};
const signer={role:'source_signer',sourceId:source,
  repository:'RosevearCreations/rosiedazzlers',keyId:contract.keyId,
  revoked:false,spkiSha256:keys.source_signer.spkiSha256,
  publicKeyPem:keys.source_signer.publicKeyPem};
const claim={state:'ORIGINAL_QL362_DUAL_OWNER_SIGNED_GET_IMMUTABLE_READBACK',
  originalComputer:'DESKTOP-AE894KC',ownerOnlyAcl:true,
  sourceOwnerSignatureVerified:true,masterOwnerSignatureVerified:true,
  durableUniqueClaimVerified:true,sourceId:source,operationId:id,requestSha256,
  receiverStopped:true,connected:false,connectionState:held,observedAt:at};
const approval=role=>{
  const payload={schema:'rosevear.hub.ql362.exact-source-owner-approval.v1',
    role,sourceId:source,requestSha256,
    audience:'rosevear-comms-hub:source-only-health-get:TEST',
    decision:'APPROVE_EXACTLY_ONE_SOURCE_HEALTH_GET',
    issuedAt:fmt(at-1000),expiresAt:fmt(at+89_000)};
  return {schema:payload.schema,payload,signature:signed(role,payload)};
};
const approvals={sourceOwnerApproval:approval('source_owner'),
  masterOwnerApproval:approval('master_owner')};
const health={schema:'rosevear.hub.ql362.source-health-receipt.v1',sourceId:source,
  operationId:id,health:'ok',connected:false,customerDataAllowed:false,
  deviceActions:false};
const receiptPayload={schema:'rosevear.hub.ql363.source-signed-health-receipt.v1',
  sourceId:source,operationId:id,requestSha256,receiptSha256:sha(health),
  sourceCommitSha:commit,sourceOrigin:contractPayload.sourceOrigin,
  environment:'TEST',method:'GET',path:healthPath,scope,
  issuedAt:fmt(at-1000),expiresAt:fmt(at+89_000)};
const evidence={state:'ORIGINAL_QL363_PINNED_TLS_SIGNED_SOURCE_GET_READBACK',
  sourceId:source,operationId:id,requestSha256,
  originalComputer:'DESKTOP-AE894KC',receiverStopped:true,
  transportAuthenticated:true,redirected:false,httpStatus:200,
  tlsSpkiSha256:record.tlsSpkiSha256,
  sourceOrigin:contractPayload.sourceOrigin,byteLength:384,
  envelope:{schema:'rosevear.hub.ql363.source-health-envelope.v1',health,
    receipt:{schema:receiptPayload.schema,payload:receiptPayload,
      signature:signed('source_signer',receiptPayload),keyId:contract.keyId}}};
const receiptSha256=sha(health);
const retentionPayload={schema:'rosie.comms.ql796.original-signed-receipt-retention.v1',
  sourceId:source,operationId:id,requestSha256,receiptSha256,
  originalComputer:'DESKTOP-AE894KC',ownerOnlyAcl:true,
  durableUniqueClaim:true,sourceSignerAuthenticated:true,
  immutableWitnessReadback:true,customerBytes:0,deviceActions:0,
  sourceRepositoryWrites:0,connectedCount:0,connectionState:held,
  retainedAt:fmt(at),retainUntil:fmt(at+7*86_400_000)};
const retention={payload:retentionPayload,
  signature:signed('retention_witness',retentionPayload),
  keyId:'rosie-original-retention-witness'};
const witnessPin={role:'retention_witness',sourceId:source,
  keyId:retention.keyId,revoked:false,
  spkiSha256:keys.retention_witness.spkiSha256,
  publicKeyPem:keys.retention_witness.publicKeyPem};
const peerTypes={rosiedazzlers:['business','rosiedazzlers'],
  devilndove:['business','devilndove-site'],icamp:['business','iCamp'],
  yw:['business','yw'],'ai-data-platform':['support','ai-data-platform'],
  'rosevear-ai-hub':['support','rosevear-ai-hub']};
const peers={state:'ORIGINAL_QL363_SIX_PEERS_STILL_HELD_POST_GET',
  databaseRole:'ql340c_private_receiver',connectedCount:0,
  rows:Object.entries(peerTypes).map(([peer_id,[peer_kind,source_repo]])=>({
    peer_id,peer_kind,source_repo,connection_state:'HOLD',
    source_test_authorized:false,customer_data_allowed:false}))};
const candidate={schema:'rosie.comms.ql796.protected-owner-candidate.v1',
  state:'ORIGINAL_TEST_EVIDENCE_CANDIDATE_AWAITING_NEW_OWNER_APPROVAL',
  sourceId:source,operationId:id,requestSha256,receiptSha256,
  ownerApprovedPersistentConnection:false,sourceTestAuthorized:false,
  customerDataAllowed:false,peerCount:6,connectedCount:0,connectionState:held,
  reviewScope:'TEST_EVIDENCE_ONLY_NOT_SOURCE_AUTHORIZATION'};
const base={record,operationId:id,requestSha256};
const baseReads={preflight,manifest,signer,claim,approvals,evidence,retention,witnessPin,
  peers,candidate};
function fixture(mutate=()=>{},extra={}){
  const v=clone(baseReads);mutate(v);
  const calls={};const hit=k=>{calls[k]=(calls[k]??0)+1;};
  const op={
    readOriginalQl362DevicePreflight:async()=>{hit('preflight');return v.preflight;},
    verifyOriginalSourceManifest:async()=>{hit('manifest');return v.manifest;},
    resolveOriginalSourceSignerPin:async()=>{hit('signer');return v.signer;},
    readIndependentSourceSignerCustody:async args=>{hit('custody');return {
      ...args,state:'INDEPENDENT_ORIGINAL_SOURCE_SIGNER_AUTHENTICATED',
      revoked:false,observedAt:at};},
    readOriginalQl362DualOwnerClaim:async()=>{hit('claim');return v.claim;},
    readOriginalQl362SignedOwnerApprovals:async()=>{hit('approvals');return v.approvals;},
    resolveOriginalPinnedOwnerAuthority:async({role,sourceId})=>{
      hit('ownerPin');return {role,sourceId,spkiSha256:keys[role].spkiSha256,
        publicKeyPem:keys[role].publicKeyPem,revoked:false};},
    verifyIndependentOriginalOwnerCustody:async args=>{
      hit('ownerCustody');return {...args,authenticated:true,revoked:false};},
    readOriginalQl363SignedGetEvidence:async()=>{hit('evidence');return v.evidence;},
    readOriginalSignedReceiptRetention:async()=>{hit('retention');return v.retention;},
    resolveOriginalRetentionWitnessPin:async()=>{hit('witnessPin');return v.witnessPin;},
    readIndependentRetentionWitnessCustody:async args=>{hit('retentionCustody');return {
      ...args,state:'ORIGINAL_INDEPENDENT_RETENTION_WITNESS_AUTHENTICATED',
      revoked:false,observedAt:at};},
    readIndependentSixPeerSnapshot:async()=>{hit('peers');return v.peers;},
    readProtectedOwnerConnectionCandidate:async()=>{hit('candidate');return v.candidate;}
  };Object.assign(op,extra);
  return {calls,op,review:()=>createQl796OriginalDeviceReceiptCandidate({
    originalOperator:op,now:()=>at})};
}
const good=fixture(),one=good.review();
assert.equal(one.inspect().connectionState,held);
const verified=await one.reviewOne(base);
assert.equal(verified.accepted,true,verified.state);
assert.equal(verified.originalDevicePreflightVerified,true);
assert.equal(verified.originalQl363ReceiptVerified,true);
assert.equal(verified.originalReceiptRetained,true);
assert.equal(verified.sixPeersHeld,true);
assert.equal(verified.connected,false);
assert.equal(verified.sourceTestAuthorized,false);
assert.equal(good.calls.candidate,1);
assert.equal((await one.reviewOne(base)).accepted,false);
assert.equal(good.calls.candidate,1);

const negative=[
  ['wrong original Windows computer',v=>v.preflight.originalReeComputer='TEMPLAR'],
  ['Jack device missing',v=>v.preflight.independentJackComputer='DESKTOP-AE894KC'],
  ['missing original issuer',v=>v.preflight.originalIssuerAuthenticated=false],
  ['revoked original authority',v=>v.preflight.originalRevocationCount=1],
  ['duplicate original receipt',v=>v.preflight.originalSignedTestReceiptCount=2],
  ['private receiver running',v=>v.preflight.receiverListenerCount=1],
  ['unauthorized receiver role',v=>v.preflight.databaseRole='anon'],
  ['source owner same as issuer',v=>v.preflight.sourceOwnerSpkiSha256=v.preflight.issuerSpkiSha256],
  ['source manifest not pinned',v=>v.manifest.originalIndependentPinVerified=false],
  ['source manifest permits TEST',v=>v.manifest.sourceTestAuthorized=true],
  ['foreign signer',v=>v.signer.sourceId='yw'],
  ['revoked source signer',v=>v.signer.revoked=true],
  ['forged original contract signer',v=>v.signer.publicKeyPem=keys.issuer.publicKeyPem],
  ['source key wrong trust pin',v=>v.signer.spkiSha256=keys.issuer.spkiSha256],
  ['missing source owner approval',v=>v.claim.sourceOwnerSignatureVerified=false],
  ['missing master owner approval',v=>v.claim.masterOwnerSignatureVerified=false],
  ['forged Ree owner signature',v=>v.approvals.sourceOwnerApproval.signature='bad'],
  ['forged Jack master signature',v=>v.approvals.masterOwnerApproval.signature='bad'],
  ['swapped owner approval roles',v=>v.approvals.sourceOwnerApproval.payload.role='master_owner'],
  ['owner approval over expired request',v=>v.approvals.masterOwnerApproval.payload.expiresAt=fmt(at-1)],
  ['owner approval wrong request',v=>v.approvals.sourceOwnerApproval.payload.requestSha256=hex('d')],
  ['reused QL362 original operation',v=>v.claim.durableUniqueClaimVerified=false],
  ['original receiver active after GET',v=>v.claim.receiverStopped=false],
  ['GET redirected',v=>v.evidence.redirected=true],
  ['HTTP non 200',v=>v.evidence.httpStatus=401],
  ['TLS identity mismatch',v=>v.evidence.tlsSpkiSha256=hex('f')],
  ['source GET body too large',v=>v.evidence.byteLength=4097],
  ['source GET foreign tenant',v=>v.evidence.envelope.health.sourceId='yw'],
  ['health claims connected',v=>v.evidence.envelope.health.connected=true],
  ['health exposes customer allowance',v=>v.evidence.envelope.health.customerDataAllowed=true],
  ['receipt substituted digest',v=>v.evidence.envelope.receipt.payload.receiptSha256=hex('d')],
  ['receipt forged signature',v=>v.evidence.envelope.receipt.signature='bad'],
  ['GET response replay',v=>v.evidence.envelope.receipt.payload.operationId='replay'],
  ['retention not owner-only',v=>v.retention.payload.ownerOnlyAcl=false],
  ['retention not unique',v=>v.retention.payload.durableUniqueClaim=false],
  ['retention customer bytes',v=>v.retention.payload.customerBytes=1],
  ['retention device action',v=>v.retention.payload.deviceActions=1],
  ['retention too short',v=>v.retention.payload.retainUntil=fmt(at+60_000)],
  ['retention forged witness signature',v=>v.retention.signature='bad'],
  ['retention witness same as signer',v=>v.witnessPin.spkiSha256=keys.source_signer.spkiSha256],
  ['one of six peers connected',v=>v.peers.rows[1].connection_state='CONNECTED'],
  ['foreign peer source authorized',v=>v.peers.rows[1].source_test_authorized=true],
  ['cross tenant customer grant',v=>v.peers.rows[2].customer_data_allowed=true],
  ['five rather than six peers',v=>v.peers.rows.pop()],
  ['duplicated peer',v=>v.peers.rows[1]=clone(v.peers.rows[0])],
  ['candidate grants persistent connection',v=>v.candidate.ownerApprovedPersistentConnection=true],
  ['candidate grants source TEST',v=>v.candidate.sourceTestAuthorized=true],
  ['candidate changes environment',v=>v.candidate.reviewScope='PRODUCTION']
];
for(const [label,change] of negative){
  const x=fixture(change);const denied=await x.review().reviewOne(base);
  assert.equal(denied.accepted,false,label+' '+denied.state);
  assert.equal(denied.connected,false,label);
  assert.equal(denied.connectionState,held,label);
}
const direct=[
  ['foreign source',v=>v.record.sourceId='yw'],
  ['production contract',v=>v.record.contract.payload.environment='PRODUCTION'],
  ['POST contract',v=>v.record.contract.payload.method='POST'],
  ['customer endpoint',v=>v.record.contract.payload.path='/api/customers'],
  ['redirects allowed',v=>v.record.contract.payload.redirects='ALLOW'],
  ['persistent enabled',v=>v.record.contract.payload.persistentConnectionAllowed=true],
  ['expired contract',v=>v.record.contract.payload.expiresAt=fmt(at-1)],
  ['unsigned changed contract',v=>v.record.contract.payload.maxResponseBytes=4095],
  ['wrong expected manifest',v=>v.record.contract.payload.manifestSha256='bad'],
  ['wrong signed operation',v=>v.operationId='wrong'],
  ['non-SHA request',v=>v.requestSha256='not-sha']
];
for(const [label,change] of direct){
  const input=clone(base);change(input);
  const x=fixture(),denied=await x.review().reviewOne(input);
  assert.equal(denied.accepted,false,label);
  assert.equal(x.calls.preflight??0,0,label);
}
for(const [label,method,callback] of [
  ['independent QL362 owner custody denied','verifyIndependentOriginalOwnerCustody',
    async()=>({authenticated:false})],
  ['original signer custody denied','readIndependentSourceSignerCustody',
    async()=>({state:'UNVERIFIED'})],
  ['retention witness independently denied','readIndependentRetentionWitnessCustody',
    async()=>({state:'UNVERIFIED'})],
  ['original peer database down','readIndependentSixPeerSnapshot',async()=>{
    throw Error('offline');}],
  ['protected candidate review missing','readProtectedOwnerConnectionCandidate',
    async()=>null]]){
  const x=fixture(()=>{},{[method]:callback});
  assert.equal((await x.review().reviewOne(base)).accepted,false,label);
}
assert.throws(()=>createQl796OriginalDeviceReceiptCandidate({}),/HOLD_ORIGINAL/);
assert.equal(ql796Cli(['--status']).connected,false);
assert.throws(()=>ql796Cli(['--run']),/DENY_PUBLIC/);
const html=readFileSync('admin-comms-hub-v781.html','utf8');
assert.match(html,/originalQl363Title796/);
assert.match(html,/Build 796/);
assert.match(html,/DISCONNECTED \/ HOLD/);
for(const page of ['admin-integrations.html','admin-integrations/index.html',
  'admin-catalog.html','admin-catalog/index.html'])
  assert.match(readFileSync(page,'utf8'),/#originalQl363Title796/,page);
const windows=readFileSync('scripts/inspect-rosie-original-ql363-796.ps1','utf8');
assert.match(windows,/-Status/);
assert.match(windows,/badda29755bf6a287257e778cd178de221eae237/);
assert.doesNotMatch(windows,/-RunOne|-Execute|-AcceptGrant/);
assert.match(readFileSync('scripts/current_booking_wizard_regression.sh','utf8'),
  /build796_original_ql363_signature_receipt_candidate_test\.mjs/);
console.log('Build 796 SYNTHETIC original QL362 device, QL363 contract/receipt, retention and six-peer HOLD regression PASS ('+
  (negative.length+direct.length+4)+' negative cases; no live connection).');
// Reusable SYNTHETIC fixtures for the dependent Build 797 audit-only test.
export {fixture as syntheticQl796Fixture,base as syntheticQl796Input,
  keys as syntheticKeys,signed as syntheticSign,sha as syntheticSha,
  clone as syntheticClone,fmt as syntheticFmt,at as syntheticAt,
  id as syntheticOperationId,held as syntheticHold,
  receiptSha256 as syntheticReceiptSha256};
