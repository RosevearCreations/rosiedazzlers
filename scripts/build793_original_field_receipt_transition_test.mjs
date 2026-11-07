import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {createQl793OriginalTrustReconciliation,ql793Cli}
  from './ql793_original_field_receipt_source_transition.mjs';

// CI only. No object here is a genuine signer, original Windows storage,
// protected PostgreSQL receipt, or authorization to connect Rosie.
const now=Date.parse('2026-11-07T20:00:00.000Z');
const SHA=c=>c.repeat(64);
const archiveId='ql360-29a59710-c3b8-46ce-b868-8a1671d04c39.json';
const refs={rosiedazzlers:['business','rosiedazzlers'],
  devilndove:['business','devilndove-site'],icamp:['business','iCamp'],
  yw:['business','yw'],'ai-data-platform':['support','ai-data-platform'],
  'rosevear-ai-hub':['support','rosevear-ai-hub']};
const evidence={schema:'rosevear.hub.ql360.original-private-evidence-archive.v1',
  kind:'ORIGINAL_POST_TEST_PRIVATE_EVIDENCE_ONLY',
  sessionId:'original-synthetic-session-793',
  deviceId:'rosevear-windows-hub',signedTranscriptSha256:SHA('b'),
  externallyPinnedWitnessSpkiSha256:SHA('a'),
  closeoutAt:new Date(now-80_000).toISOString(),
  shutdownObservedAt:new Date(now-70_000).toISOString(),
  receiptCount:1,revocationCount:0,receiverListenerCount:0,
  tailnetGatewayListenerCount:0,authenticatedDatabaseRole:'ql340c_private_receiver',
  peerCount:6,connectedCount:0,
  sources:Object.entries(refs).map(([id,[kind,sourceRepository]])=>({
    id,kind,sourceRepository,state:'HOLD'})).sort((a,b)=>a.id.localeCompare(b.id)),
  customerCommunications:false,deviceActions:false};
const canonical=v=>Array.isArray(v)?'['+v.map(canonical).join(',')+']':
  v!==null&&typeof v==='object'?
    '{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+canonical(v[k])).join(',')+'}':JSON.stringify(v);
const digest=v=>createHash('sha256').update(canonical(v)).digest('hex');
const archive={schema:'rosevear.hub.ql360.original-private-evidence-archive.v1',
  state:'ORIGINAL_PRIVATE_TEST_ARCHIVE_VERIFIED_ALL_SIX_PEERS_STILL_HELD',
  authenticatedOriginalArchive:true,timeBoundShutdownWitnessVerified:true,
  exactOneImmutableReceiptVerified:true,sixPeersHeldVerified:true,
  exportedEvidenceCount:6,archiveAccepted:true,
  receiverActivated:false,connected:false,connectedCount:0,
  connectionState:'DISCONNECTED / HOLD',archiveId,evidenceSha256:digest(evidence)};
const readback={state:'ORIGINAL_REE_PRIVATE_ARCHIVE_READBACK_VERIFIED',
  originalComputer:'DESKTOP-AE894KC',originalUser:'Ree',ownerOnlyAcl:true,
  archiveId,sha256:archive.evidenceSha256,evidence};
const source={schema:'rosie.comms.ql793.protected-first-source-receipt.v1',
  state:'ORIGINAL_ROSIE_FIRST_TEST_SIGNED_RECEIPT_RECONCILED',
  sourceId:'rosiedazzlers',tenantId:'rosie-dazzlers',environment:'TEST',
  method:'GET',path:'/api/integration/v1/shell/health',
  deviceId:'rosevear-windows-hub',ql360ArchiveSha256:archive.evidenceSha256,
  ql359SessionId:evidence.sessionId,ql359TranscriptSha256:evidence.signedTranscriptSha256,
  sourceEnrollmentSha256:SHA('5'),sourceSignerSpkiSha256:SHA('1'),
  sourceOwnerDecisionSha256:SHA('2'),masterOwnerDecisionSha256:SHA('3'),
  originalIssuerSpkiSha256:SHA('4'),
  independentWitnessSpkiSha256:evidence.externallyPinnedWitnessSpkiSha256,
  originalOperationId:'fbca306d-6867-4d46-9c63-7ce2172b870e',
  requestSha256:SHA('6'),brokerReceiptSha256:SHA('7'),
  signedFieldWitnessSha256:SHA('8'),firstSourceReceiptCount:1,
  authorizedSourceGrants:0,sourceTestAuthorized:false,customerBytes:0,
  connected:false,connectionState:'DISCONNECTED / HOLD'};
const peers={schema:'rosevear.hub.ql341.private-peer-readback.v1',
  exportedAt:new Date(now-40_000).toISOString(),
  source:'PRIVATE_POSTGRES_OWNER_READBACK',peerCount:6,connectedCount:0,
  customerCommunications:0,deviceActions:0,authorizedExternalGets:0,
  heldDeviceReceiptCount:1,
  peers:Object.entries(refs).map(([peerId,[kind,repository]])=>({
    peerId,kind,repository,connection:'DISCONNECTED / HOLD',
    sourceTestAuthorized:false,customerDataAllowed:false})),
  witness:{state:'ORIGINAL_SIGNED_TEST_HEARTBEAT_AND_DB_RECEIPT_VERIFIED',
    verified:true,connected:false}};
const deep=v=>structuredClone(v);
function setup(){
  const calls={ticket:0,archive:0,source:0,peers:0};
  const originalOperator={
    verifyOriginalQl360Archive:async()=>{calls.ticket++;return deep(archive);},
    readOriginalQl360Archive:async()=>{calls.archive++;return deep(readback);},
    verifyOriginalRosieFirstSourceReceipt:async()=>{calls.source++;return deep(source);},
    readOriginalSixAppPeerSnapshot:async()=>{calls.peers++;return deep(peers);}
  };
  return {calls,originalOperator,make:()=>createQl793OriginalTrustReconciliation({
    originalOperator,now:()=>now})};
}
const good=setup(),runner=good.make();
assert.equal(runner.inspect().accepted,false);
const verified=await runner.importAndReconcile();
assert.equal(verified.accepted,true,verified.state);
assert.equal(verified.originalArchiveVerified,true);
assert.equal(verified.independentSourceReceiptVerified,true);
assert.equal(verified.testEvidenceTransitionVerified,true);
assert.equal(verified.connectionTransitionVerified,false);
assert.equal(verified.testEvidenceState,'VERIFIED TEST / HOLD');
assert.equal(verified.verifiedConnectionTransition,'UNVERIFIED_TEST_TO_VERIFIED_TEST_ONLY');
assert.equal(verified.connected,false);
assert.equal(verified.connectionState,'DISCONNECTED / HOLD');
assert.equal(verified.sourceGrants,0);
assert.equal(verified.customerCommunications,0);
assert.deepEqual(good.calls,{ticket:1,archive:1,source:1,peers:1});
assert.equal((await runner.importAndReconcile()).accepted,false,'one-use import');
assert.equal(good.calls.ticket,1);

const negative=[
  ['ticket','archive absent','archiveAccepted',false],
  ['ticket','archive unauthenticated','authenticatedOriginalArchive',false],
  ['ticket','shutdown witness absent','timeBoundShutdownWitnessVerified',false],
  ['ticket','original receipt absent','exactOneImmutableReceiptVerified',false],
  ['ticket','not all six held','sixPeersHeldVerified',false],
  ['ticket','partial export','exportedEvidenceCount',5],
  ['ticket','receiver active','receiverActivated',true],
  ['ticket','peer connected','connectedCount',1],
  ['ticket','wrong archive digest','evidenceSha256',SHA('f')],
  ['archive','not original Ree','originalComputer','TEMPLAR'],
  ['archive','not original user','originalUser','Admin'],
  ['archive','ACL not owner only','ownerOnlyAcl',false],
  ['archive','wrong archive filename','archiveId','ql360-other.json'],
  ['archive','private readback wrong digest','sha256',SHA('e')],
  ['source','source not Rosie','sourceId','devilndove'],
  ['source','child scope wrong','tenantId','foreign'],
  ['source','wrong method','method','POST'],
  ['source','wrong environment','environment','PRODUCTION'],
  ['source','wrong health path','path','/api/customers'],
  ['source','archive source mismatch','ql360ArchiveSha256',SHA('d')],
  ['source','original session mismatch','ql359SessionId','other'],
  ['source','original transcript mismatch','ql359TranscriptSha256',SHA('d')],
  ['source','independent witness differs','independentWitnessSpkiSha256',SHA('c')],
  ['source','signer pin malformed','sourceSignerSpkiSha256','bad'],
  ['source','owners have same digest','masterOwnerDecisionSha256',SHA('2')],
  ['source','source permission escalated','authorizedSourceGrants',1],
  ['source','source authorized early','sourceTestAuthorized',true],
  ['source','source customer bytes','customerBytes',2],
  ['source','source connected','connected',true],
  ['source','operation UUID invalid','originalOperationId','bad'],
  ['source','receipt duplicate','firstSourceReceiptCount',2],
  ['source','broker receipt changed','brokerReceiptSha256','bad'],
  ['peers','one source connected','connectedCount',1],
  ['peers','new authorization claimed','authorizedExternalGets',1],
  ['peers','extra device receipt','heldDeviceReceiptCount',2],
  ['peers','customer data touched','customerCommunications',1],
  ['peers','old roster readback','exportedAt',new Date(now-500_000).toISOString()],
  ['peers','fresh signed original receipt absent','witness',{verified:false,connected:false}],
  ['peers','peer missing','peerCount',5]
];
const which={ticket:'verifyOriginalQl360Archive',
  archive:'readOriginalQl360Archive',source:'verifyOriginalRosieFirstSourceReceipt',
  peers:'readOriginalSixAppPeerSnapshot'};
for(const [where,label,field,value] of negative){
  const fixture=setup(),original=deep({ticket:archive,archive:readback,source,peers}[where]);
  original[field]=value;
  fixture.originalOperator[which[where]]=async()=>{fixture.calls[where]++;return original;};
  const result=await fixture.make().importAndReconcile();
  assert.equal(result.accepted,false,`${label}: ${result.state}`);
  assert.equal(result.connected,false,label);
  assert.equal(result.sourceGrants,0,label);
  assert.equal(fixture.calls.peers,where==='peers'?1:0,label);
}
const structural=[
  ['archive tampered content',c=>{c.evidence.sources[0].sourceRepository='evil';}],
  ['archive secret-bearing extra',c=>{c.evidence.databaseUrl='SECRET';}],
  ['archive missing peer',c=>{c.evidence.sources.pop();}],
  ['archive changed witness pin',c=>{c.evidence.externallyPinnedWitnessSpkiSha256=SHA('f');}],
  ['archive receiver running',c=>{c.evidence.receiverListenerCount=1;}],
  ['archive future shutdown',c=>{c.evidence.shutdownObservedAt=new Date(now+60_000).toISOString();}],
  ['archive wrong limited role',c=>{c.evidence.authenticatedDatabaseRole='postgres';}],
  ['archive duplicate rows',c=>{c.evidence.sources[1]=deep(c.evidence.sources[0]);}],
  ['snapshot altered peer kind',c=>{c.peers[0].kind='support';}],
  ['snapshot elevated source',c=>{c.peers[0].sourceTestAuthorized=true;}],
  ['snapshot foreign peer',c=>{c.peers[0].peerId='foreign';}],
  ['snapshot customer privilege',c=>{c.peers[0].customerDataAllowed=true;}],
  ['snapshot duplicate peer',c=>{c.peers[1]=deep(c.peers[0]);}],
  ['source extra unreviewed grant',c=>{c.granted=true;}]
];
for(const [label,mutate] of structural){
  const fx=setup(),where=label.startsWith('archive')?'archive':label.startsWith('snapshot')?'peers':'source';
  const v=deep({archive:readback,peers,source}[where]);mutate(v);
  fx.originalOperator[which[where]]=async()=>{fx.calls[where]++;return v;};
  const result=await fx.make().importAndReconcile();
  assert.equal(result.accepted,false,`${label}: ${result.state}`);
  assert.equal(result.connected,false,label);
}
const exception=setup();exception.originalOperator.verifyOriginalQl360Archive=async()=>{throw Error('device offline');};
assert.equal((await exception.make().importAndReconcile()).accepted,false);
assert.throws(()=>createQl793OriginalTrustReconciliation({}));
assert.equal(ql793Cli(['--status']).accepted,false);
assert.throws(()=>ql793Cli(['--import']));

const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const ps=read('scripts/inspect-rosie-original-ql360-793.ps1');
assert.match(ps,/da204096d362bf1b3f17c5dc243440fb7800f7e1/);
assert.match(ps,/ql360-windows-evidence-export\.ps1/);
assert.match(ps,/ShutdownReadback/);
assert.doesNotMatch(ps,/Start-Service|Stop-Service|Set-ExecutionPolicy|New-NetFirewallRule|Set-NetFirewallRule|git\s+pull|ExportPostTest|StoreCredential|service_role/i);
assert.match(read('admin-comms-hub-v781.html'),/Build 793 · original QL-360/);
assert.match(read('admin-integrations.html'),/Build 793/);
assert.match(read('admin-catalog.html'),/Build 793/);
assert.equal(read('admin-integrations.html'),read('admin-integrations/index.html'));
assert.equal(read('admin-catalog.html'),read('admin-catalog/index.html'));
assert.match(read('scripts/current_booking_wizard_regression.sh'),/build793_original_field_receipt_transition_test/);
console.log(`Build 793 PASS: 1 synthetic source evidence transition, ${negative.length+structural.length+1} strict denial cases. Original QL360 archive + Rosie independent first signed GET + fresh six-peer HOLD required; no connection grant or side effects.`);
