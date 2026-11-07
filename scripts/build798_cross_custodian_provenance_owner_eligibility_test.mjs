import assert from 'node:assert/strict';
import {createHash,generateKeyPairSync,sign} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {createQl798OriginalRenewalDashboard,ql798Cli}
  from './ql798_cross_custodian_provenance_owner_eligibility.mjs';
import {syntheticQl797Fixture,syntheticQl797Input,
  syntheticQl797Keys,syntheticQl797Sign,syntheticQl797At,
  syntheticQl797OperationId,syntheticQl797Fmt,syntheticQl797Sha,
  syntheticQl797Clone,syntheticQl797Hold} from
  './build797_original_receipt_custody_decision_audit_test.mjs';

// All evidence below is SYNTHETIC, with ephemeral process-local test keys.
// No original Windows certificate, encrypted key or Comms database is used.
const at=syntheticQl797At,id=syntheticQl797OperationId;
const fmt=syntheticQl797Fmt,sha=syntheticQl797Sha,clone=syntheticQl797Clone;
const held=syntheticQl797Hold,hex=c=>c.repeat(64);
const canon=v=>Array.isArray(v)?'['+v.map(canon).join(',')+']':
  v!==null&&typeof v==='object'?'{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+canon(v[k])).join(',')+'}':JSON.stringify(v);
const keys={...syntheticQl797Keys};
for(const role of ['custody_primary','custody_secondary']){
  const pair=generateKeyPairSync('ed25519');
  keys[role]={secret:pair.privateKey,
    publicKeyPem:pair.publicKey.export({type:'spki',format:'pem'}).toString(),
    spkiSha256:createHash('sha256').update(pair.publicKey.export({type:'spki',format:'der'})).digest('hex')};
}
const signAs=(role,payload)=>['source_owner','master_owner'].includes(role)?
  syntheticQl797Sign(role,payload):sign(null,Buffer.from(canon(payload)),
    keys[role].secret).toString('base64url');
const input=clone(syntheticQl797Input);
const baseline=await syntheticQl797Fixture().make().reviewOne(input);
assert.equal(baseline.accepted,true,baseline.state);
const source='rosiedazzlers',sourceProof={
  schema:'rosie.comms.ql798.original-ql364-source-receipt-provenance.v1',
  state:'INDEPENDENT_ORIGINAL_SOURCE_AND_HANDLER_READBACK_HELD',
  sourceId:source,sourceCommitSha:input.record.commitSha,
  handlerPath:'functions/api/_lib/ql364-source-health.mjs',
  handlerSha256:hex('a'),receiptSha256:baseline.receiptSha256,
  receiptBytesSha256:hex('b'),independentSourceRevisionReadback:true,
  originalSourceSignerCustody:true,customerBytes:0,sourceTestAuthorized:false,
  connectedCount:0,connectionState:held,observedAt:at};
const makeRenewal=role=>({schema:'rosie.comms.ql798.original-independent-custody-renewal.v1',
  role,sourceId:source,operationId:id,receiptSha256:baseline.receiptSha256,
  archiveHeadSha256:baseline.archiveHeadSha256,
  decisionAuditSha256:baseline.decisionAuditSha256,
  sourceCommitSha:sourceProof.sourceCommitSha,handlerSha256:sourceProof.handlerSha256,
  receiptBytesSha256:sourceProof.receiptBytesSha256,
  independentStoreId:'rosie-'+role+'-original',renewalSequence:1,
  previousRenewalSha256:hex('0'),issuedAt:fmt(at-1000),
  expiresAt:fmt(at+172_800_000),retainedUntil:fmt(at+7*86_400_000),
  purpose:'RETAIN_ORIGINAL_SOURCE_RECEIPT_HOLD_ONLY',
  connectedCount:0,connectionState:held,sourceTestAuthorized:false,customerBytes:0});
const signRenew=role=>{
  const payload=makeRenewal(role);
  return {payload,signature:signAs(role,payload),keyId:'synthetic-ql798-'+role};
};
const renewals={custody_primary:signRenew('custody_primary'),
  custody_secondary:signRenew('custody_secondary')};
const anchors=Object.fromEntries(Object.entries(renewals).map(([role,att])=>[
  role,{state:'INDEPENDENT_ORIGINAL_RENEWAL_ANCHOR_READBACK',
    sourceId:source,role,renewalSha256:sha(att.payload),
    sequence:att.payload.renewalSequence,
    previousRenewalSha256:att.payload.previousRenewalSha256,
    independentStoreId:att.payload.independentStoreId,
    immutable:true,revoked:false,connectedCount:0}]));
const conflict={schema:'rosie.comms.ql798.owner-conflict-register.v1',
  state:'ORIGINAL_OWNER_CONFLICTS_CLOSED_NEW_SIGNATURES_REQUIRED',
  sourceId:source,operationId:id,
  decisionAuditSha256:baseline.decisionAuditSha256,
  unresolvedCount:0,previousConflictSha256:hex('c'),
  connectionState:held,connectedCount:0};
const conflictSha256=sha(conflict);
const makeResolution=role=>({
  schema:'rosie.comms.ql798.original-owner-conflict-resolution.v1',
  role,sourceId:source,operationId:id,receiptSha256:baseline.receiptSha256,
  auditSha256:baseline.decisionAuditSha256,
  primaryRenewalSha256:sha(renewals.custody_primary.payload),
  secondaryRenewalSha256:sha(renewals.custody_secondary.payload),
  conflictRegisterSha256:conflictSha256,decision:baseline.ownerDecision,
  audience:'rosiedazzlers:ql798:original-owner-hold-renewal',
  scope:'RESOLVE_AUDIT_CONFLICT_ONLY_NO_CONNECTION_GRANT',
  issuedAt:fmt(at-1000),expiresAt:fmt(at+89_000),
  connectionApproved:false,sourceTestAuthorized:false,
  customerDataAllowed:false,deviceActions:false});
const signOwner=role=>{
  const payload=makeResolution(role);
  return {payload,signature:signAs(role,payload),keyId:'synthetic-owner-ql798-'+role};
};
const resolutions={sourceOwner:signOwner('source_owner'),
  masterOwner:signOwner('master_owner')};
const six={state:'QL798_RENEWED_ORIGINAL_SIX_PEERS_STILL_HELD',
  databaseRole:'ql340c_private_receiver',connectedCount:0,
  rows:Object.entries({rosiedazzlers:['business','rosiedazzlers'],
    devilndove:['business','devilndove-site'],icamp:['business','iCamp'],
    yw:['business','yw'],'ai-data-platform':['support','ai-data-platform'],
    'rosevear-ai-hub':['support','rosevear-ai-hub']}).map(([peer_id,[peer_kind,source_repo]])=>({
    peer_id,peer_kind,source_repo,connection_state:'HOLD',
    source_test_authorized:false,customer_data_allowed:false}))};
const originals={sourceProof,renewals,anchors,conflict,resolutions,six};
function fixture(change=()=>{},extra={}){
  const v=clone(originals);change(v);
  const prior=syntheticQl797Fixture();const counts={};
  const hit=k=>{counts[k]=(counts[k]??0)+1;};
  const callbacks={
    readOriginalQl798SourceByteProvenance:async()=>{hit('source');return v.sourceProof;},
    readOriginalQl798IndependentRenewal:async({role})=>{hit('renew');return v.renewals[role];},
    resolveOriginalQl798PinnedSigner:async({sourceId,role})=>{hit('pin');return {
      sourceId,role,spkiSha256:keys[role].spkiSha256,
      keyId:'synthetic-ql798-'+role,
      publicKeyPem:keys[role].publicKeyPem,revoked:false};},
    readIndependentQl798SignerCustody:async args=>{hit('custody');return {
      ...args,state:'INDEPENDENT_ORIGINAL_QL798_SIGNER_AUTHENTICATED',
      revoked:false,observedAt:at};},
    readIndependentQl798CustodianAnchor:async({role})=>{hit('anchor');return v.anchors[role];},
    readOriginalQl798OwnerConflictRegister:async()=>{hit('conflict');return v.conflict;},
    readOriginalQl798OwnerResolutionSignatures:async()=>{hit('owners');return v.resolutions;},
    readIndependentQl798OwnerResolutionCustody:async args=>{hit('ownerCustody');return {
      ...args,state:'INDEPENDENT_ORIGINAL_OWNER_RENEWAL_AUTHENTICATED',
      revoked:false,observedAt:at};},
    readIndependentQl798SixPeersAfterRenewal:async()=>{hit('six');return v.six;}
  };
  Object.assign(callbacks,extra);
  const originalOperator={...prior.originalOperator,...callbacks};
  return {counts,originalOperator,make:()=>createQl798OriginalRenewalDashboard({
    originalOperator,now:()=>at})};
}
const f=fixture(),one=f.make();
assert.equal(one.inspect().connected,false);
const success=await one.reviewOne(input);
assert.equal(success.accepted,true,success.state);
assert.equal(success.sourceProofVerified,true);
assert.equal(success.independentCustodiansVerified,2);
assert.equal(success.ownerConflictResolved,true);
assert.equal(success.originalOwnersSignedHoldResolution,true);
assert.equal(success.independentSixPeerIsolationVerified,true);
assert.equal(success.dashboard.custodiansVerified,2);
assert.equal(success.dashboard.reviewEligibility,true);
assert.equal(success.dashboard.connectionEligible,false);
assert.equal(success.dashboard.expirySeverity,'URGENT_90_SECONDS');
assert.equal(success.connected,false);
assert.equal(success.sourceTestAuthorized,false);
assert.equal(f.counts.six,1);
assert.equal((await one.reviewOne(input)).accepted,false);
assert.equal(f.counts.six,1);

const cases=[
  ['foreign source proof',v=>v.sourceProof.sourceId='yw'],
  ['wrong source handler',v=>v.sourceProof.handlerPath='functions/api/customers.mjs'],
  ['unproven source revision',v=>v.sourceProof.independentSourceRevisionReadback=false],
  ['wrong source commit',v=>v.sourceProof.sourceCommitSha='0'.repeat(40)],
  ['source signer custody missing',v=>v.sourceProof.originalSourceSignerCustody=false],
  ['wrong source receipt',v=>v.sourceProof.receiptSha256=hex('f')],
  ['customer bytes leak',v=>v.sourceProof.customerBytes=1],
  ['connected source handler',v=>v.sourceProof.connectionState='CONNECTED'],
  ['source TEST authorized',v=>v.sourceProof.sourceTestAuthorized=true],
  ['wrong primary role',v=>v.renewals.custody_primary.payload.role='custody_secondary'],
  ['wrong secondary store',v=>v.renewals.custody_secondary.payload.independentStoreId='rosie-custody_primary-original'],
  ['changed receipt byte digest',v=>v.renewals.custody_primary.payload.receiptBytesSha256=hex('f')],
  ['custodian wrong archive',v=>v.renewals.custody_primary.payload.archiveHeadSha256=hex('d')],
  ['custodian wrong audit',v=>v.renewals.custody_secondary.payload.decisionAuditSha256=hex('d')],
  ['custodian wrong handler hash',v=>v.renewals.custody_primary.payload.handlerSha256=hex('d')],
  ['custodian expired',v=>v.renewals.custody_primary.payload.expiresAt=fmt(at-1)],
  ['custodian future issue',v=>v.renewals.custody_primary.payload.issuedAt=fmt(at+60_000)],
  ['retention expired',v=>v.renewals.custody_secondary.payload.retainedUntil=fmt(at-1)],
  ['retention too short',v=>v.renewals.custody_secondary.payload.retainedUntil=fmt(at+60_000)],
  ['custodian duplicate sequence',v=>v.renewals.custody_secondary.payload.renewalSequence=0],
  ['custodian no prior hash',v=>v.renewals.custody_primary.payload.previousRenewalSha256='bad'],
  ['custodian permits customer',v=>v.renewals.custody_primary.payload.customerBytes=1],
  ['custodian permits TEST',v=>v.renewals.custody_secondary.payload.sourceTestAuthorized=true],
  ['custodian forged signature',v=>v.renewals.custody_primary.signature='bad'],
  ['independent primary anchor altered',v=>v.anchors.custody_primary.renewalSha256=hex('f')],
  ['secondary anchor mutable',v=>v.anchors.custody_secondary.immutable=false],
  ['secondary anchor revoked',v=>v.anchors.custody_secondary.revoked=true],
  ['source conflict ID',v=>v.conflict.sourceId='yw'],
  ['wrong owner audit',v=>v.conflict.decisionAuditSha256=hex('f')],
  ['owner conflict open',v=>v.conflict.unresolvedCount=1],
  ['owner conflict not closed',v=>v.conflict.state='OWNER_CONFLICT_PENDING'],
  ['owner conflict connected',v=>v.conflict.connectionState='CONNECTED'],
  ['owner conflict missing chain',v=>v.conflict.previousConflictSha256='bad'],
  ['master owner wrong receipt',v=>v.resolutions.masterOwner.payload.receiptSha256=hex('f')],
  ['source owner wrong primary',v=>v.resolutions.sourceOwner.payload.primaryRenewalSha256=hex('f')],
  ['master owner wrong secondary',v=>v.resolutions.masterOwner.payload.secondaryRenewalSha256=hex('f')],
  ['source owner wrong conflict hash',v=>v.resolutions.sourceOwner.payload.conflictRegisterSha256=hex('f')],
  ['owner signature forged',v=>v.resolutions.sourceOwner.signature='bad'],
  ['master role changed',v=>v.resolutions.masterOwner.payload.role='source_owner'],
  ['owner wants connection',v=>v.resolutions.masterOwner.payload.connectionApproved=true],
  ['owner wants customer data',v=>v.resolutions.sourceOwner.payload.customerDataAllowed=true],
  ['owner wants source TEST',v=>v.resolutions.masterOwner.payload.sourceTestAuthorized=true],
  ['owner wants device actions',v=>v.resolutions.sourceOwner.payload.deviceActions=true],
  ['owner expired',v=>v.resolutions.masterOwner.payload.expiresAt=fmt(at-1)],
  ['owner scope inflated',v=>v.resolutions.masterOwner.payload.scope='CONNECT_AND_SEND'],
  ['owner decision divergent',v=>v.resolutions.sourceOwner.payload.decision='REJECT_CONNECTION'],
  ['post renewal one peer connected',v=>v.six.rows[1].connection_state='CONNECTED'],
  ['post renewal one source authorized',v=>v.six.rows[3].source_test_authorized=true],
  ['post renewal one customer grant',v=>v.six.rows[2].customer_data_allowed=true],
  ['post renewal missing peer',v=>v.six.rows.pop()],
  ['post renewal duplicate',v=>v.six.rows[1]=clone(v.six.rows[0])],
  ['post renewal public DB role',v=>v.six.databaseRole='anon']
];
for(const [label,mutate] of cases){
  const x=fixture(mutate),denied=await x.make().reviewOne(input);
  assert.equal(denied.accepted,false,label+': '+denied.state);
  assert.equal(denied.connected,false,label);
  assert.equal(denied.connectionState,held,label);
  assert.equal(denied.dashboard.connectionEligible,false,label);
}
for(const [label,method,cb] of [
  ['missing independent signer','readIndependentQl798SignerCustody',
    async()=>({state:'UNVERIFIED'})],
  ['independent custodian unavailable','readIndependentQl798CustodianAnchor',
    async()=>{throw Error('offline');}],
  ['wrong owner identity','readIndependentQl798OwnerResolutionCustody',
    async()=>({state:'UNVERIFIED'})],
  ['peer DB unavailable','readIndependentQl798SixPeersAfterRenewal',
    async()=>null]]){
  const x=fixture(()=>{},{[method]:cb}),r=await x.make().reviewOne(input);
  assert.equal(r.accepted,false,label);
}
const wrong=clone(input);wrong.record.contract.payload.method='POST';
const premature=fixture();assert.equal((await premature.make().reviewOne(wrong)).accepted,false);
assert.equal(premature.counts.source??0,0);
assert.throws(()=>createQl798OriginalRenewalDashboard({}),/HOLD_ORIGINAL/);
assert.equal(ql798Cli(['--status']).connected,false);
assert.throws(()=>ql798Cli(['--run']),/DENY_PUBLIC/);
const html=readFileSync('admin-comms-hub-v781.html','utf8');
assert.match(html,/id="originalQl364Title798"/);
assert.match(html,/connection-eligibility-dashboard-798/);
for(const path of ['admin-catalog.html','admin-catalog/index.html',
  'admin-integrations.html','admin-integrations/index.html'])
  assert.match(readFileSync(path,'utf8'),/#originalQl364Title798/,path);
assert.match(readFileSync('scripts/inspect-rosie-original-ql364-798.ps1','utf8'),
  /inspect-rosie-original-ql363-797\.ps1/);
assert.match(readFileSync('scripts/current_booking_wizard_regression.sh','utf8'),
  /build798_cross_custodian_provenance_owner_eligibility_test\.mjs/);
console.log('Build 798 SYNTHETIC dual-custodian original receipt renewal, '+
  'independent owner conflict resolution and expiring HOLD dashboard PASS ('+
  (cases.length+4)+' negative cases, no real original credential).');
