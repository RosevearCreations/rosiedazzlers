import assert from 'node:assert/strict';
import {createHash,generateKeyPairSync,sign} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {createQl795OriginalReceiptClosure,ql795Cli}
  from './ql795_original_source_get_receipt_closure.mjs';

// Ephemeral SYNTHETIC keys + private adapters. No actual original Windows key,
// source signature, private PostgreSQL connection or receiver is involved.
const time=Date.parse('2026-11-07T20:00:00.000Z');
const canon=v=>Array.isArray(v)?'['+v.map(canon).join(',')+']':
  v!==null&&typeof v==='object'?'{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+canon(v[k])).join(',')+'}':JSON.stringify(v);
const sha=v=>createHash('sha256').update(canon(v)).digest('hex');
const digest=c=>c.repeat(64);
const copy=v=>structuredClone(v);
const id='1dd33a36-a9de-4e1a-afb4-e3ff094a7d38';
const handoffId='ql361-42e0aef9-e44d-4d89-af64-cc4709d2b804.json';
const roles=['redaction_auditor','source_owner','master_owner','receipt_witness'];
const keys=Object.fromEntries(roles.map(role=>{
  const pair=generateKeyPairSync('ed25519');
  return [role,{privateKey:pair.privateKey,
    publicKeyPem:pair.publicKey.export({type:'spki',format:'pem'}).toString(),
    spkiSha256:createHash('sha256').update(pair.publicKey.export({type:'spki',format:'der'})).digest('hex')}];
}));
const signAs=(role,payload)=>sign(null,Buffer.from(canon(payload)),
  keys[role].privateKey).toString('base64url');
const sources={rosiedazzlers:['business','rosiedazzlers'],
  devilndove:['business','devilndove-site'],icamp:['business','iCamp'],
  yw:['business','yw'],'ai-data-platform':['support','ai-data-platform'],
  'rosevear-ai-hub':['support','rosevear-ai-hub']};
const auditPayload={schema:'rosevear.hub.ql361.independent-redaction-audit.v1',
  role:'redaction_auditor',audience:'rosevear-comms-hub:original-archive:TEST',
  scope:'independent-redaction-review-owner-handoff-only',
  archiveId:'ql360-original-fixture-archive',
  archiveSha256:digest('1'),redactionReportSha256:digest('2'),
  issuedAt:new Date(time-1_000).toISOString(),
  expiresAt:new Date(time+180_000).toISOString()};
const handoff={schema:'rosevear.hub.ql361.archived-chain-redaction-handoff.v1',
  kind:'OWNER_PRIVATE_OFFLINE_SOURCE_REVIEW_ONLY',
  archiveId:auditPayload.archiveId,archiveSha256:auditPayload.archiveSha256,
  redactionAuditSha256:auditPayload.redactionReportSha256,
  independentAuditorSpkiSha256:keys.redaction_auditor.spkiSha256,
  auditAttestation:{payload:auditPayload,signature:signAs('redaction_auditor',auditPayload)},
  receiverStopped:true,connectedCount:0,candidateCount:6,
  candidates:Object.entries(sources).map(([peerId,[peerKind,repository]])=>({
    peerId,peerKind,repository,state:'AWAITING_INDEPENDENT_SOURCE_OWNER_SIGNATURE',
    sourceTestAuthorized:false,customerDataAllowed:false,
    requestedScope:'HEALTH_READ_ONLY_TEST_PROPOSAL_NOT_AUTHORIZATION'})),
  customerCommunications:false,deviceActions:false,
  nextAction:'SIX_SEPARATE_SOURCE_OWNER_SIGNED_TEST_DECISIONS_REQUIRED'};
const handoffSha256=sha(handoff);
const handoffRead={state:'ORIGINAL_REE_QL361_HANDOFF_READBACK_VERIFIED',
  originalComputer:'DESKTOP-AE894KC',originalUser:'Ree',ownerOnlyAcl:true,
  handoffId,sha256:handoffSha256,handoff};
const request={schema:'rosevear.hub.ql362.source-owner-one-get.v1',
  kind:'ONE_PRIVATE_HEALTH_GET_INTENT',archiveId:handoff.archiveId,
  handoffSha256,sourceId:'rosiedazzlers',repository:'rosiedazzlers',
  operationId:id,sourceCommitSha:'b'.repeat(40),
  manifestSha256:digest('3'),sourceOrigin:'https://rosie-private.example.invalid',
  environment:'TEST',method:'GET',path:'/api/integration/v1/shell/health',
  issuedAt:new Date(time-1_000).toISOString(),
  expiresAt:new Date(time+89_000).toISOString(),
  customerDataAllowed:false,deviceActionsAllowed:false,persistentConnectionAllowed:false};
const requestSha256=sha(request);
const owner=role=>{
  const payload={schema:'rosevear.hub.ql362.exact-source-owner-approval.v1',
    role,sourceId:'rosiedazzlers',requestSha256,
    audience:'rosevear-comms-hub:source-only-health-get:TEST',
    decision:'APPROVE_EXACTLY_ONE_SOURCE_HEALTH_GET',
    issuedAt:new Date(time-1_000).toISOString(),
    expiresAt:new Date(time+89_000).toISOString()};
  return {schema:payload.schema,payload,signature:signAs(role,payload)};
};
const sourceOwnerApproval=owner('source_owner');
const masterOwnerApproval=owner('master_owner');
const result={schema:request.schema,
  state:'ONE_APPROVED_SOURCE_ONLY_HEALTH_GET_VERIFIED_SIX_APPS_STILL_HELD',
  originalArchivedTestVerified:true,sourceOwnerSignatureVerified:true,
  masterOwnerSignatureVerified:true,privateOperationClaimed:true,
  firstSourceGetVerified:true,sourceId:'rosiedazzlers',operationId:id,
  requestSha256,receiptSha256:digest('4'),otherPeersHeld:5,
  connected:false,connectedCount:0,sourceTestAuthorized:false,
  customerDataAllowed:false,customerCommunications:false,deviceActions:false,
  sourceRepositoryWrites:0,connectionState:'DISCONNECTED / HOLD',
  retryAutomatically:false};
const witness={schema:'rosie.comms.ql795.original-ql362-witness-readback.v1',
  state:'ORIGINAL_ONE_SOURCE_DURABLE_CLAIM_AND_WITNESS_VERIFIED',
  sourceId:'rosiedazzlers',operationId:id,requestSha256,
  receiptSha256:result.receiptSha256,sourceGetCount:1,durableUniqueClaim:true,
  sourceSignerAuthenticated:true,immutableWitnessReadback:true,
  receiverStopped:true,customerBytes:0,deviceActions:0,connectedCount:0,
  connectionState:'DISCONNECTED / HOLD'};
const snapshot={schema:'rosie.comms.ql795.original-six-peer-post-test-readback.v1',
  state:'SIX_ORIGINAL_SOURCE_PEERS_STILL_HELD_AFTER_ONE_GET',
  databaseRole:'ql340c_private_receiver',connectedCount:0,
  rows:Object.entries(sources).map(([peer_id,[peer_kind,source_repo]])=>({
    peer_id,peer_kind,source_repo,connection_state:'HOLD',
    source_test_authorized:false,customer_data_allowed:false}))};
const exportPayload={schema:'rosie.comms.ql795.redacted-original-source-get-export.v1',
  sourceId:'rosiedazzlers',operationId:id,requestSha256,
  receiptSha256:result.receiptSha256,handoffSha256,
  sourceCommitSha:request.sourceCommitSha,manifestSha256:request.manifestSha256,
  sourceGetCount:1,connectedCount:0,otherPeersHeld:5,
  ownerKeysDistinct:true,sourceSignedReceiptVerified:true,
  immutableClaimVerified:true,customerBytes:0,deviceActions:0,
  sourceRepositoryWrites:0,connectionState:'DISCONNECTED / HOLD',
  closureTimestamp:new Date(time+1_000).toISOString()};
const exportRead={payload:exportPayload,signature:signAs('receipt_witness',exportPayload)};
const valid={handoffId,expectedHandoffSha256:handoffSha256,
  request,sourceOwnerApproval,masterOwnerApproval};
function fixture(overrides={}){
  const calls={handoff:0,pin:0,custody:0,get:0,witness:0,peers:0,export:0};
  const op={
    readOriginalQl361Handoff:async()=>{calls.handoff++;return copy(handoffRead);},
    resolveOriginalPinnedAuthority:async(role,sourceId)=>{
      calls.pin++;return {role,sourceId,publicKeyPem:keys[role].publicKeyPem,
        spkiSha256:keys[role].spkiSha256};},
    verifyIndependentOriginalCustody:async args=>{calls.custody++;
      return {...args,authenticated:true,revoked:false};},
    runOneOriginalQl362PrivateSourceGet:async()=>{calls.get++;return copy(result);},
    readOriginalImmutableQl362WitnessAndClaim:async()=>{
      calls.witness++;return copy(witness);},
    readIndependentSixSourceDatabaseSnapshot:async()=>{
      calls.peers++;return copy(snapshot);},
    readOriginalSignedRedactedEvidenceExport:async()=>{
      calls.export++;return copy(exportRead);}
  };
  Object.assign(op,overrides);
  return {calls,op,make:()=>createQl795OriginalReceiptClosure({
    originalOperator:op,now:()=>time})};
}
const p=fixture(),one=p.make(),accepted=await one.runOne(valid);
assert.equal(accepted.accepted,true,accepted.state);
assert.equal(accepted.verifiedOriginalQl362Get,true);
assert.equal(accepted.verifiedIndependentWitness,true);
assert.equal(accepted.verifiedSixPeersHeld,true);
assert.equal(accepted.verifiedIndependentSignedExport,true);
assert.equal(accepted.connected,false);
assert.equal(accepted.sourceTestAuthorized,false);
assert.equal(accepted.redactedExportSha256,sha(exportPayload));
assert.equal(p.calls.get,1);
assert.equal((await one.runOne(valid)).accepted,false);
assert.equal(p.calls.get,1);

const fns={handoff:'readOriginalQl361Handoff',get:'runOneOriginalQl362PrivateSourceGet',
  witness:'readOriginalImmutableQl362WitnessAndClaim',
  peers:'readIndependentSixSourceDatabaseSnapshot',
  export:'readOriginalSignedRedactedEvidenceExport'};
const originals={handoff:handoffRead,get:result,witness,snapshot,peers:snapshot,
  export:exportRead};
const failures=[
  ['handoff','foreign Windows','originalComputer','TEMPLAR'],
  ['handoff','missing original ACL','ownerOnlyAcl',false],
  ['handoff','wrong source digest','sha256',digest('f')],
  ['get','wrong source','sourceId','yw'],
  ['get','wrong operation','operationId','bad'],
  ['get','false source signature','sourceOwnerSignatureVerified',false],
  ['get','missing durable claim','privateOperationClaimed',false],
  ['get','wrong QL362 state','state','CANDIDATE_ONLY'],
  ['get','connected','connected',true],
  ['get','wrong receipt','receiptSha256','bad'],
  ['get','source persisted grant','sourceTestAuthorized',true],
  ['get','customer permitted','customerDataAllowed',true],
  ['get','other peers missing','otherPeersHeld',4],
  ['witness','different operation','operationId','bad'],
  ['witness','second GET','sourceGetCount',2],
  ['witness','claim absent','durableUniqueClaim',false],
  ['witness','unsigned source','sourceSignerAuthenticated',false],
  ['witness','witness absent','immutableWitnessReadback',false],
  ['witness','receiver running','receiverStopped',false],
  ['witness','PII bytes leaked','customerBytes',1],
  ['peers','connected count','connectedCount',1],
  ['peers','wrong receiver role','databaseRole','public_reader'],
  ['export','missing signature','signature','bad']
];
for(const [where,label,field,value] of failures){
  const v=copy(originals[where]);v[field]=value;
  const x=fixture({[fns[where]]:async()=>v});
  const denied=await x.make().runOne(valid);
  assert.equal(denied.accepted,false,label+': '+denied.state);
  assert.equal(denied.connected,false,label);
  if(where==='handoff')assert.equal(x.calls.get,0,label);
}
const nested=[
  ['original candidate premature access','handoff',v=>{v.handoff.candidates[0].sourceTestAuthorized=true;}],
  ['different candidate repo','handoff',v=>{v.handoff.candidates[0].repository='foreign';}],
  ['duplicate handoff peer','handoff',v=>{v.handoff.candidates[1]=copy(v.handoff.candidates[0]);}],
  ['forged redaction auditor','handoff',v=>{v.handoff.auditAttestation.signature='bad';}],
  ['source DB test persisted','peers',v=>{v.rows[0].source_test_authorized=true;}],
  ['another peer granted','peers',v=>{v.rows[2].source_test_authorized=true;}],
  ['one peer connected','peers',v=>{v.rows[1].connection_state='CONNECTED';}],
  ['customer peer permission','peers',v=>{v.rows[2].customer_data_allowed=true;}],
  ['missing peer','peers',v=>{v.rows.pop();}],
  ['duplicate peer','peers',v=>{v.rows[1]=copy(v.rows[0]);}],
  ['other source export','export',v=>{v.payload.sourceId='yw';}],
  ['export forged digest','export',v=>{v.payload.receiptSha256=digest('9');}],
  ['export customer action','export',v=>{v.payload.customerBytes=1;}],
  ['export unsigned payload change','export',v=>{v.payload.closureTimestamp=new Date(time).toISOString();}]
];
for(const [label,where,change] of nested){
  const v=copy(originals[where]);change(v);
  const x=fixture({[fns[where]]:async()=>v});
  const denied=await x.make().runOne(valid);
  assert.equal(denied.accepted,false,label+': '+denied.state);
}
const requestMutations=[
  v=>v.request.sourceId='yw',v=>v.request.repository='yw',
  v=>v.request.method='POST',v=>v.request.path='/api/customers',
  v=>v.request.environment='PRODUCTION',
  v=>v.request.expiresAt=new Date(time-1).toISOString(),
  v=>v.request.sourceOrigin='http://rosie-private.example.invalid',
  v=>v.request.persistentConnectionAllowed=true,
  v=>v.request.customerDataAllowed=true,
  v=>v.request.manifestSha256='bad',
  v=>v.sourceOwnerApproval.signature='bad',
  v=>v.masterOwnerApproval.payload.role='source_owner',
  v=>v.masterOwnerApproval.payload.expiresAt=new Date(time-1).toISOString()
];
for(const mutate of requestMutations){
  const input=copy(valid);mutate(input);
  const x=fixture(),denied=await x.make().runOne(input);
  assert.equal(denied.accepted,false,denied.state);
  assert.equal(x.calls.get,0);
}
for(const role of roles){
  const revoked=fixture({verifyIndependentOriginalCustody:async args=>({
    ...args,authenticated:args.role!==role,revoked:args.role===role})});
  assert.equal((await revoked.make().runOne(valid)).accepted,false,role);
}
const swap=fixture({resolveOriginalPinnedAuthority:async(role,sourceId)=>({
  role,sourceId,publicKeyPem:keys.source_owner.publicKeyPem,
  spkiSha256:keys.source_owner.spkiSha256})});
assert.equal((await swap.make().runOne(valid)).accepted,false);
const missing=fixture({runOneOriginalQl362PrivateSourceGet:async()=>{throw Error('offline');}});
assert.equal((await missing.make().runOne(valid)).accepted,false);
assert.throws(()=>createQl795OriginalReceiptClosure({}));
assert.equal(ql795Cli(['--status']).accepted,false);
assert.throws(()=>ql795Cli(['--run']));
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const windows=read('scripts/inspect-rosie-original-ql362-795.ps1');
assert.match(windows,/f23c2ddc6b1159efd95f67b6ae7f47ff672b006a/);
assert.match(windows,/ql362-windows-source-owner-handoff\.ps1/);
assert.doesNotMatch(windows,/Start-Service|Stop-Service|Set-ExecutionPolicy|New-NetFirewallRule|Set-NetFirewallRule|git\s+pull|service_role/i);
assert.match(read('admin-comms-hub-v781.html'),/Build 795 · original QL-362/);
assert.match(read('admin-integrations.html'),/Build 795/);
assert.match(read('admin-catalog.html'),/Build 795/);
assert.equal(read('admin-integrations.html'),read('admin-integrations/index.html'));
assert.equal(read('admin-catalog.html'),read('admin-catalog/index.html'));
assert.match(read('scripts/current_booking_wizard_regression.sh'),/build795_original_source_get_receipt_closure_test/);
console.log(`Build 795 PASS: QL-362 exact 90s signed offline request, one original GET, immutable witness, separate export signer and all six DB peers HELD; ${failures.length+nested.length+requestMutations.length+roles.length+4} fail-closed cases, zero real authority.`);
