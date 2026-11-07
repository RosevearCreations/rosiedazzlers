import assert from 'node:assert/strict';
import {createHash,generateKeyPairSync,sign} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {createQl797OriginalReceiptCustodyAudit,ql797Cli}
  from './ql797_original_receipt_custody_decision_audit.mjs';
import {syntheticQl796Fixture,syntheticQl796Input,syntheticKeys,
  syntheticSign,syntheticSha,syntheticClone,syntheticFmt,syntheticAt,
  syntheticOperationId,syntheticHold} from
  './build796_original_ql363_signature_receipt_candidate_test.mjs';

// Original Windows databases, signers and private GET are NOT available here.
// Every receipt, signer and readback is SYNTHETIC and ephemeral.
const at=syntheticAt,id=syntheticOperationId,held=syntheticHold;
const fmt=syntheticFmt,sha=syntheticSha,clone=syntheticClone;
const hex=c=>c.repeat(64);
const canon=v=>Array.isArray(v)?'['+v.map(canon).join(',')+']':
  v!==null&&typeof v==='object'?'{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+canon(v[k])).join(',')+'}':JSON.stringify(v);
const keys={...syntheticKeys};
for(const role of ['custody_witness','audit_witness']){
  const pair=generateKeyPairSync('ed25519');
  keys[role]={secret:pair.privateKey,
    publicKeyPem:pair.publicKey.export({type:'spki',format:'pem'}).toString(),
    spkiSha256:createHash('sha256').update(pair.publicKey.export({type:'spki',format:'der'})).digest('hex')};
}
const signAs=(role,payload)=>role==='source_owner'||role==='master_owner'?
  syntheticSign(role,payload):sign(null,Buffer.from(canon(payload)),
    keys[role].secret).toString('base64url');
const source='rosiedazzlers',scope='AUDIT_ONLY_NO_CONNECTION_OR_SOURCE_GRANT';
const input=clone(syntheticQl796Input);
const qb=await syntheticQl796Fixture().review().reviewOne(input);
assert.equal(qb.accepted,true);
const receiptSha256=qb.receiptSha256;
const importPayload={schema:'rosie.comms.ql797.original-ql363-custody-import.v1',
  sourceId:source,operationId:id,requestSha256:input.requestSha256,
  receiptSha256,signedRetentionSha256:qb.signedRetentionSha256,
  sourceCommitSha:input.record.commitSha,originalComputer:'DESKTOP-AE894KC',
  ownerOnlyAcl:true,immutableObjectId:'rosie-ql363-'+receiptSha256,
  uniqueImportCount:1,importedAt:fmt(at),retainUntil:fmt(at+7*86_400_000),
  customerBytes:0,deviceActions:0,sourceRepositoryWrites:0,connectedCount:0,
  connectionState:held};
const importSha256=sha(importPayload);
const witnessPayload={schema:'rosie.comms.ql797.original-custody-witness.v1',
  role:'custody_witness',sourceId:source,operationId:id,
  requestSha256:input.requestSha256,receiptSha256,importSha256,
  originalComputer:'DESKTOP-AE894KC',
  scope:'ORIGINAL_OWNER_ONLY_IMMUTABLE_RECEIPT_RETENTION',
  issuedAt:fmt(at-1000),expiresAt:fmt(at+89_000),connected:false};
const witness={payload:witnessPayload,signature:signAs('custody_witness',witnessPayload),
  keyId:'synthetic-original-custody-witness'};
const witnessSha256=sha(witnessPayload);
const archive={schema:'rosie.comms.ql797.independent-import-archive-head.v1',
  state:'ORIGINAL_IMMUTABLE_CUSTODY_HEAD_INDEPENDENTLY_RECORDED',
  sourceId:source,operationId:id,importSha256,witnessSha256,sequence:1,
  previousSha256:hex('0'),headSha256:'',
  independentStoreId:'rosie-custody-archive-primary',
  immutableReadback:true,ownerOnlyAcl:true,connectedCount:0,observedAt:at};
archive.headSha256=sha({sourceId:source,operationId:id,importSha256,
  witnessSha256,sequence:archive.sequence,previousSha256:archive.previousSha256});
const archiveAnchor={state:'INDEPENDENT_ORIGINAL_ARCHIVE_HEAD_READBACK',
  headSha256:archive.headSha256,previousSha256:archive.previousSha256,
  sequence:archive.sequence,independentStoreId:archive.independentStoreId,
  immutable:true,connectedCount:0};
const makeDecision=(role,decision='ACKNOWLEDGE_HOLD')=>{
  const payload={schema:'rosie.comms.ql797.original-owner-reviewed-hold-decision.v1',
    role,sourceId:source,operationId:id,requestSha256:input.requestSha256,
    receiptSha256,importSha256,archiveHeadSha256:archive.headSha256,
    decision,environment:'TEST',
    audience:'rosiedazzlers:ql797:original-offline-owner-review',scope,
    issuedAt:fmt(at-1000),expiresAt:fmt(at+89_000),
    sourceTestAuthorized:false,customerDataAllowed:false,deviceActions:false};
  return {payload,signature:signAs(role,payload),keyId:'synthetic-'+role+'-decision'};
};
const ownerDecisions={sourceOwner:makeDecision('source_owner'),
  masterOwner:makeDecision('master_owner')};
const decisionsSha256=sha(ownerDecisions);
const auditPayload={schema:'rosie.comms.ql797.original-owner-hold-audit-row.v1',
  state:'ORIGINAL_OWNER_GOVERNED_HELD_DECISION_AUDITED',
  sourceId:source,operationId:id,importSha256,
  archiveHeadSha256:archive.headSha256,witnessSha256,ownerDecisionsSha256:decisionsSha256,
  decision:'ACKNOWLEDGE_HOLD',sequence:1,previousSha256:hex('1'),
  ownerOnlyAcl:true,immutable:true,connectedCount:0,connectionState:held,
  sourceTestAuthorized:false,customerDataAllowed:false,
  customerCommunications:false,deviceActions:false,sourceRepositoryWrites:0,
  createdAt:fmt(at)};
const audit={payload:{...auditPayload,rowSha256:sha(auditPayload)},keyId:'synthetic-audit-witness',
  signature:null};
audit.signature=signAs('audit_witness',audit.payload);
const auditAnchor={state:'INDEPENDENT_OWNER_DECISION_APPEND_ONLY_ANCHOR',
  rowSha256:audit.payload.rowSha256,previousSha256:audit.payload.previousSha256,
  sequence:audit.payload.sequence,immutable:true,connectedCount:0};
const six={state:'QL797_AFTER_OWNER_DECISION_SIX_PEERS_HELD',
  databaseRole:'ql340c_private_receiver',connectedCount:0,
  rows:Object.entries({rosiedazzlers:['business','rosiedazzlers'],
    devilndove:['business','devilndove-site'],icamp:['business','iCamp'],
    yw:['business','yw'],'ai-data-platform':['support','ai-data-platform'],
    'rosevear-ai-hub':['support','rosevear-ai-hub']}).map(([peer_id,[peer_kind,source_repo]])=>({
    peer_id,peer_kind,source_repo,connection_state:'HOLD',
    source_test_authorized:false,customer_data_allowed:false}))};
const refs={importPayload,witness,archive,archiveAnchor,ownerDecisions,audit,
  auditAnchor,six};
function fixture(change=()=>{},extra={}){
  const v=clone(refs);change(v);
  const original=syntheticQl796Fixture();
  const counts={};const hit=name=>{counts[name]=(counts[name]??0)+1;};
  const callbacks={
    readOriginalQl797ImportedReceipt:async()=>{hit('import');return v.importPayload;},
    readOriginalQl797CustodyWitness:async()=>{hit('witness');return v.witness;},
    resolveOriginalQl797AuthorityPin:async({role,sourceId})=>{hit('pin');return {
      role,sourceId,keyId:role==='custody_witness'?'synthetic-original-custody-witness':
        role==='audit_witness'?'synthetic-audit-witness':'synthetic-'+role+'-decision',
      spkiSha256:keys[role].spkiSha256,
      publicKeyPem:keys[role].publicKeyPem,revoked:false};},
    readIndependentQl797AuthorityCustody:async args=>{hit('custody');return {
      ...args,state:'INDEPENDENT_ORIGINAL_QL797_SIGNER_AUTHENTICATED',
      revoked:false,observedAt:at};},
    readOriginalQl797ArchiveRecord:async()=>{hit('archive');return v.archive;},
    readIndependentQl797ArchiveAnchor:async()=>{hit('anchor');return v.archiveAnchor;},
    readOriginalQl797OwnerDecisions:async()=>{hit('owners');return v.ownerDecisions;},
    readOriginalQl797AuditedDecision:async()=>{hit('audit');return v.audit;},
    readIndependentQl797DecisionAnchor:async()=>{hit('auditAnchor');return v.auditAnchor;},
    readIndependentSixPeerSnapshotAfterDecision:async()=>{hit('six');return v.six;}
  };
  Object.assign(callbacks,extra);
  const originalOperator={...original.op,...callbacks};
  return {counts,originalOperator,make:()=>createQl797OriginalReceiptCustodyAudit({
    originalOperator,now:()=>at})};
}
const f=fixture(),one=f.make(),accepted=await one.reviewOne(input);
assert.equal(accepted.accepted,true,accepted.state);
assert.equal(accepted.baselineOriginalQl796ReceiptVerified,true);
assert.equal(accepted.importedReceiptCustodyVerified,true);
assert.equal(accepted.independentCustodyWitnessVerified,true);
assert.equal(accepted.independentArchiveHeadVerified,true);
assert.equal(accepted.independentOwnerDecisionVerified,true);
assert.equal(accepted.ownerDecisionAuditWitnessVerified,true);
assert.equal(accepted.postDecisionSixAppIsolationVerified,true);
assert.equal(accepted.connected,false);
assert.equal(accepted.sourceTestAuthorized,false);
assert.equal(accepted.ownerDecision,'ACKNOWLEDGE_HOLD');
assert.equal(f.counts.six,1);
assert.equal((await one.reviewOne(input)).accepted,false);
assert.equal(f.counts.six,1);
for(const choice of ['REQUEST_MORE_EVIDENCE','REJECT_CONNECTION']){
  const x=fixture(v=>{
    v.ownerDecisions.sourceOwner=makeDecision('source_owner',choice);
    v.ownerDecisions.masterOwner=makeDecision('master_owner',choice);
    const {rowSha256,...body}=v.audit.payload;
    body.decision=choice;body.ownerDecisionsSha256=sha(v.ownerDecisions);
    v.audit.payload={...body,rowSha256:sha(body)};
    v.audit.signature=signAs('audit_witness',v.audit.payload);
    v.auditAnchor.rowSha256=v.audit.payload.rowSha256;
  });
  const review=await x.make().reviewOne(input);
  assert.equal(review.accepted,true,choice+' '+review.state);
  assert.equal(review.ownerDecision,choice);
  assert.equal(review.connected,false);
}

const denied=[
  ['foreign import',v=>v.importPayload.sourceId='yw'],
  ['wrong original device',v=>v.importPayload.originalComputer='TEMPLAR'],
  ['wrong receipt binding',v=>v.importPayload.receiptSha256=hex('f')],
  ['wrong retention binding',v=>v.importPayload.signedRetentionSha256=hex('e')],
  ['wrong source commit',v=>v.importPayload.sourceCommitSha=hex('d')],
  ['nonoriginal immutable ID',v=>v.importPayload.immutableObjectId='test'],
  ['duplicate import',v=>v.importPayload.uniqueImportCount=2],
  ['missing owner-only ACL',v=>v.importPayload.ownerOnlyAcl=false],
  ['import stale',v=>v.importPayload.importedAt=fmt(at-200_000)],
  ['retention expired',v=>v.importPayload.retainUntil=fmt(at-1)],
  ['short retention',v=>v.importPayload.retainUntil=fmt(at+1000)],
  ['customer bytes leaked',v=>v.importPayload.customerBytes=1],
  ['imported device command',v=>v.importPayload.deviceActions=1],
  ['imported repo mutation',v=>v.importPayload.sourceRepositoryWrites=1],
  ['import marked connected',v=>v.importPayload.connectionState='CONNECTED'],
  ['custody witness other source',v=>v.witness.payload.sourceId='yw'],
  ['custody witness wrong hash',v=>v.witness.payload.importSha256=hex('a')],
  ['custody witness wrong receipt',v=>v.witness.payload.receiptSha256=hex('a')],
  ['custody witness wrong scope',v=>v.witness.payload.scope='ANY'],
  ['custody witness claims connected',v=>v.witness.payload.connected=true],
  ['custody witness forged signature',v=>v.witness.signature='bad'],
  ['custody witness expired',v=>v.witness.payload.expiresAt=fmt(at-1)],
  ['archive wrong import',v=>v.archive.importSha256=hex('f')],
  ['archive wrong witness',v=>v.archive.witnessSha256=hex('f')],
  ['archive head tampered',v=>v.archive.headSha256=hex('d')],
  ['archive sequence invalid',v=>v.archive.sequence=0],
  ['archive not immutable',v=>v.archive.immutableReadback=false],
  ['archive not owner private',v=>v.archive.ownerOnlyAcl=false],
  ['archive independent anchor mismatch',v=>v.archiveAnchor.headSha256=hex('f')],
  ['archive independent index mismatch',v=>v.archiveAnchor.sequence=3],
  ['archive anchor mutable',v=>v.archiveAnchor.immutable=false],
  ['source owner wrong role',v=>v.ownerDecisions.sourceOwner.payload.role='master_owner'],
  ['source owner forged signature',v=>v.ownerDecisions.sourceOwner.signature='bad'],
  ['master owner wrong imported head',v=>v.ownerDecisions.masterOwner.payload.archiveHeadSha256=hex('a')],
  ['master owner connected authority',v=>v.ownerDecisions.masterOwner.payload.sourceTestAuthorized=true],
  ['master owner expiration',v=>v.ownerDecisions.masterOwner.payload.expiresAt=fmt(at-1)],
  ['source owner production',v=>v.ownerDecisions.sourceOwner.payload.environment='PRODUCTION'],
  ['owner decisions divergent',v=>v.ownerDecisions.masterOwner=makeDecision('master_owner','REJECT_CONNECTION')],
  ['owner approval permits devices',v=>v.ownerDecisions.sourceOwner.payload.deviceActions=true],
  ['owner approval persistent scope',v=>v.ownerDecisions.sourceOwner.payload.scope='CONNECT'],
  ['audit row altered owner digest',v=>v.audit.payload.ownerDecisionsSha256=hex('b')],
  ['audit row not immutable',v=>v.audit.payload.immutable=false],
  ['audit row shows connected',v=>v.audit.payload.connectedCount=1],
  ['audit row not owner-only',v=>v.audit.payload.ownerOnlyAcl=false],
  ['audit row grants customer access',v=>v.audit.payload.customerDataAllowed=true],
  ['audit row altered digest',v=>v.audit.payload.rowSha256=hex('c')],
  ['audit witness signature forged',v=>v.audit.signature='bad'],
  ['final audit witness mismatch',v=>v.auditAnchor.rowSha256=hex('b')],
  ['final audit anchor mutable',v=>v.auditAnchor.immutable=false],
  ['post-decision peer connected',v=>v.six.rows[1].connection_state='CONNECTED'],
  ['post-decision TEST granted',v=>v.six.rows[2].source_test_authorized=true],
  ['post-decision PII granted',v=>v.six.rows[3].customer_data_allowed=true],
  ['post-decision peers missing',v=>v.six.rows.pop()],
  ['post-decision duplicate peer',v=>v.six.rows[1]=clone(v.six.rows[0])],
  ['post-decision receiver wrong role',v=>v.six.databaseRole='anon']
];
for(const [label,mutate] of denied){
  const x=fixture(mutate),r=await x.make().reviewOne(input);
  assert.equal(r.accepted,false,label+' '+r.state);
  assert.equal(r.connected,false,label);
  assert.equal(r.connectionState,held,label);
}
for(const [label,method,cb] of [
  ['no independent custodian','readIndependentQl797AuthorityCustody',
    async()=>({state:'UNVERIFIED'})],
  ['revoked original custodian','readIndependentQl797AuthorityCustody',
    async args=>({...args,state:'INDEPENDENT_ORIGINAL_QL797_SIGNER_AUTHENTICATED',
      revoked:true,observedAt:at})],
  ['archive readback unavailable','readIndependentQl797ArchiveAnchor',
    async()=>null],
  ['post decision DB unavailable','readIndependentSixPeerSnapshotAfterDecision',
    async()=>{throw Error('private db offline');}]]){
  const x=fixture(()=>{},{[method]:cb});
  assert.equal((await x.make().reviewOne(input)).accepted,false,label);
}
const wrong=clone(input);wrong.record.contract.payload.method='POST';
const fail=fixture();const a=await fail.make().reviewOne(wrong);
assert.equal(a.accepted,false);
assert.equal(fail.counts.import??0,0);
assert.equal(ql797Cli(['--status']).connected,false);
assert.throws(()=>ql797Cli(['--run']),/DENY_PUBLIC/);
assert.throws(()=>createQl797OriginalReceiptCustodyAudit({}),/HOLD_ORIGINAL/);
assert.match(readFileSync('admin-comms-hub-v781.html','utf8'),/id="originalQl363Title797"/);
for(const path of ['admin-catalog.html','admin-catalog/index.html',
  'admin-integrations.html','admin-integrations/index.html'])
  assert.match(readFileSync(path,'utf8'),/#originalQl363Title797/,path);
const windows=readFileSync('scripts/inspect-rosie-original-ql363-797.ps1','utf8');
assert.match(windows,/inspect-rosie-original-ql363-796\.ps1/);
assert.doesNotMatch(windows,/-RunOne|-Activate|-Execute/);
assert.match(readFileSync('scripts/current_booking_wizard_regression.sh','utf8'),
  /build797_original_receipt_custody_decision_audit_test\.mjs/);
console.log('Build 797 SYNTHETIC QL363 immutable custody, independent witness/owner signatures, '+
  'append-only audit and six-app HOLD PASS ('+(denied.length+4)+' negative cases; no real authority).');
// Dependent Build 798 may reuse these EPHEMERAL SYNTHETIC test fixtures only.
export {fixture as syntheticQl797Fixture,input as syntheticQl797Input,
  keys as syntheticQl797Keys,signAs as syntheticQl797Sign,
  at as syntheticQl797At,id as syntheticQl797OperationId,
  fmt as syntheticQl797Fmt,sha as syntheticQl797Sha,
  clone as syntheticQl797Clone,held as syntheticQl797Hold};
