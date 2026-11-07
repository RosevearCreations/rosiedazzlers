/** Rosie 798 — original-only cross-custodian renewal and owner HOLD dashboard.
 * No HTTP transport, signer creation, DB writes, grants or automatic retry.
 * All input callbacks MUST read independent ORIGINAL private authorities. */
import {createHash,createPublicKey,verify} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {createQl797OriginalReceiptCustodyAudit} from
  './ql797_original_receipt_custody_decision_audit.mjs';

const ID='rosiedazzlers',HELD='DISCONNECTED / HOLD';
const SCHEMA='rosie.comms.ql798.cross-custodian-renewal-owner-eligibility.v1';
const HEX=/^[0-9a-f]{64}$/,COMMIT=/^[0-9a-f]{40}$/,
  SIG=/^[A-Za-z0-9_-]{86}$/;
const ROLE=['custody_primary','custody_secondary'];
const peers={rosiedazzlers:['business','rosiedazzlers'],
  devilndove:['business','devilndove-site'],icamp:['business','iCamp'],
  yw:['business','yw'],'ai-data-platform':['support','ai-data-platform'],
  'rosevear-ai-hub':['support','rosevear-ai-hub']};
const peerKeys=['peer_id','peer_kind','source_repo','connection_state',
  'source_test_authorized','customer_data_allowed'];
const renewKeys=['schema','role','sourceId','operationId','receiptSha256',
  'archiveHeadSha256','decisionAuditSha256','sourceCommitSha',
  'handlerSha256','receiptBytesSha256','independentStoreId',
  'renewalSequence','previousRenewalSha256','issuedAt','expiresAt',
  'retainedUntil','purpose','connectedCount','connectionState',
  'sourceTestAuthorized','customerBytes'];
const ownerKeys=['schema','role','sourceId','operationId','receiptSha256',
  'auditSha256','primaryRenewalSha256','secondaryRenewalSha256',
  'conflictRegisterSha256','decision','audience','scope',
  'issuedAt','expiresAt','connectionApproved',
  'sourceTestAuthorized','customerDataAllowed','deviceActions'];
const isObj=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
const exact=(v,ks)=>isObj(v)&&Object.keys(v).length===ks.length&&
  Object.keys(v).every(k=>ks.includes(k));
const canon=v=>Array.isArray(v)?'['+v.map(canon).join(',')+']':
  isObj(v)?'{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+canon(v[k])).join(',')+'}':JSON.stringify(v);
const sha=v=>createHash('sha256').update(canon(v)).digest('hex');
const date=x=>{const n=Date.parse(x);return Number.isFinite(n)&&
  x===new Date(n).toISOString()?n:NaN;};
const held=(state,extra={})=>({schema:SCHEMA,state,accepted:false,
  sourceProofVerified:false,independentCustodiansVerified:0,
  ownerConflictResolved:false,originalOwnersSignedHoldResolution:false,
  independentSixPeerIsolationVerified:false,
  dashboard:{schema:'rosie.comms.ql798.connection-eligibility-dashboard.v1',
    state:'HOLD_ORIGINAL_PROOF_UNAVAILABLE',sourceId:ID,
    custodiansVerified:0,ownerConflicts:'NOT_VERIFIED',
    earliestExpiryAt:null,expirySeverity:'NOT_VERIFIED',
    reviewEligibility:false,connectionEligible:false,
    connected:false,connectionState:HELD,peerCount:6},
  connected:false,connectedCount:0,connectionState:HELD,
  sourceTestAuthorized:false,customerDataAllowed:false,
  customerCommunications:false,deviceActions:false,
  sourceRepositoryWrites:0,automaticallyRetry:false,...extra});
function validSource(s,baseline,record,at){
  return exact(s,['schema','state','sourceId','sourceCommitSha',
    'handlerPath','handlerSha256','receiptSha256','receiptBytesSha256',
    'independentSourceRevisionReadback','originalSourceSignerCustody',
    'customerBytes','sourceTestAuthorized','connectedCount',
    'connectionState','observedAt'])&&
    s.schema==='rosie.comms.ql798.original-ql364-source-receipt-provenance.v1'&&
    s.state==='INDEPENDENT_ORIGINAL_SOURCE_AND_HANDLER_READBACK_HELD'&&
    s.sourceId===ID&&s.sourceCommitSha===record.commitSha&&
    s.handlerPath==='functions/api/_lib/ql364-source-health.mjs'&&
    HEX.test(s.handlerSha256??'')&&
    s.receiptSha256===baseline.receiptSha256&&
    HEX.test(s.receiptBytesSha256??'')&&
    s.independentSourceRevisionReadback===true&&
    s.originalSourceSignerCustody===true&&s.customerBytes===0&&
    s.sourceTestAuthorized===false&&s.connectedCount===0&&
    s.connectionState===HELD&&Number.isFinite(s.observedAt)&&
    Math.abs(at-s.observedAt)<=30_000;
}
function validRenewal(p,role,baseline,source,at){
  if(!exact(p,renewKeys)||
    p.schema!=='rosie.comms.ql798.original-independent-custody-renewal.v1'||
    p.role!==role||p.sourceId!==ID||
    p.operationId!==baseline.operationId||
    p.receiptSha256!==baseline.receiptSha256||
    p.archiveHeadSha256!==baseline.archiveHeadSha256||
    p.decisionAuditSha256!==baseline.decisionAuditSha256||
    p.sourceCommitSha!==source.sourceCommitSha||
    p.handlerSha256!==source.handlerSha256||
    p.receiptBytesSha256!==source.receiptBytesSha256||
    p.independentStoreId!=='rosie-'+role+'-original'||
    !Number.isSafeInteger(p.renewalSequence)||p.renewalSequence<1||
    !HEX.test(p.previousRenewalSha256??'')||
    p.purpose!=='RETAIN_ORIGINAL_SOURCE_RECEIPT_HOLD_ONLY'||
    p.connectedCount!==0||p.connectionState!==HELD||
    p.sourceTestAuthorized!==false||p.customerBytes!==0)return false;
  const a=date(p.issuedAt),b=date(p.expiresAt),c=date(p.retainedUntil);
  return Number.isFinite(a)&&Number.isFinite(b)&&Number.isFinite(c)&&
    a>=at-60_000&&a<=at+5_000&&b>at&&b>a&&
    b-a<=7*86_400_000&&c>at+86_400_000;
}
async function verifyOriginalSigner(op,role,att,notAllowed,t){
  if(!exact(att,['payload','signature','keyId'])||
    !SIG.test(att.signature??''))return null;
  const pin=await op.resolveOriginalQl798PinnedSigner({sourceId:ID,role});
  if(pin?.role!==role||pin.sourceId!==ID||pin.keyId!==att.keyId||
    !HEX.test(pin.spkiSha256??'')||notAllowed.includes(pin.spkiSha256)||
    pin.revoked!==false||typeof pin.publicKeyPem!=='string'||
    pin.publicKeyPem.length>2000)return null;
  const key=createPublicKey(pin.publicKeyPem);
  if(key.asymmetricKeyType!=='ed25519'||
    createHash('sha256').update(key.export({type:'spki',format:'der'})).digest('hex')!==pin.spkiSha256||
    !verify(null,Buffer.from(canon(att.payload)),key,
      Buffer.from(att.signature,'base64url')))return null;
  const digest=sha(att.payload);
  const custody=await op.readIndependentQl798SignerCustody({sourceId:ID,
    role,keyId:pin.keyId,spkiSha256:pin.spkiSha256,payloadSha256:digest});
  if(custody?.state!=='INDEPENDENT_ORIGINAL_QL798_SIGNER_AUTHENTICATED'||
    custody.sourceId!==ID||custody.role!==role||custody.keyId!==pin.keyId||
    custody.spkiSha256!==pin.spkiSha256||custody.payloadSha256!==digest||
    custody.revoked!==false||!Number.isFinite(custody.observedAt)||
    Math.abs(t-custody.observedAt)>30_000)return null;
  return pin.spkiSha256;
}
function validOwner(p,role,baseline,renewed,conflictSha,at){
  if(!exact(p,ownerKeys)||
    p.schema!=='rosie.comms.ql798.original-owner-conflict-resolution.v1'||
    p.role!==role||p.sourceId!==ID||p.operationId!==baseline.operationId||
    p.receiptSha256!==baseline.receiptSha256||
    p.auditSha256!==baseline.decisionAuditSha256||
    p.primaryRenewalSha256!==renewed[0]||
    p.secondaryRenewalSha256!==renewed[1]||
    p.conflictRegisterSha256!==conflictSha||
    p.decision!==baseline.ownerDecision||
    !['ACKNOWLEDGE_HOLD','REQUEST_MORE_EVIDENCE','REJECT_CONNECTION'].includes(p.decision)||
    p.audience!=='rosiedazzlers:ql798:original-owner-hold-renewal'||
    p.scope!=='RESOLVE_AUDIT_CONFLICT_ONLY_NO_CONNECTION_GRANT'||
    p.connectionApproved!==false||p.sourceTestAuthorized!==false||
    p.customerDataAllowed!==false||p.deviceActions!==false)return false;
  const a=date(p.issuedAt),b=date(p.expiresAt);
  return Number.isFinite(a)&&Number.isFinite(b)&&a>=at-60_000&&
    a<=at+5_000&&b>at&&b>a&&b-a<=90_000;
}
function validSix(snapshot){
  if(snapshot?.state!=='QL798_RENEWED_ORIGINAL_SIX_PEERS_STILL_HELD'||
    snapshot.databaseRole!=='ql340c_private_receiver'||
    snapshot.connectedCount!==0||!Array.isArray(snapshot.rows)||
    snapshot.rows.length!==6)return false;
  const seen=new Set();
  for(const row of snapshot.rows){
    if(!exact(row,peerKeys)||!Object.hasOwn(peers,row.peer_id)||
      seen.has(row.peer_id))return false;
    const [kind,repo]=peers[row.peer_id];
    if(row.peer_kind!==kind||row.source_repo!==repo||
      row.connection_state!=='HOLD'||row.source_test_authorized!==false||
      row.customer_data_allowed!==false)return false;
    seen.add(row.peer_id);
  }
  return seen.size===6;
}
function safeDashboard({source,renewal,ownerExpiry,at}){
  const ends=[date(renewal[0].expiresAt),date(renewal[1].expiresAt),
    date(renewal[0].retainedUntil),date(renewal[1].retainedUntil),ownerExpiry];
  const earliest=Math.min(...ends),remaining=earliest-at;
  return {schema:'rosie.comms.ql798.connection-eligibility-dashboard.v1',
    state:'ORIGINAL_RENEWAL_EVIDENCE_REVIEWED_CONNECTION_STILL_HELD',
    sourceId:ID,custodiansVerified:2,ownerConflicts:'NONE_AFTER_DISTINCT_SIGNATURES',
    receiptBytesSha256:source.receiptBytesSha256,
    earliestExpiryAt:new Date(earliest).toISOString(),
    expirySeverity:remaining<=90_000?'URGENT_90_SECONDS':
      remaining<=86_400_000?'RENEW_WITHIN_24_HOURS':'CURRENT',
    reviewEligibility:true,connectionEligible:false,connected:false,
    connectionState:HELD,peerCount:6};
}
/** Never call this method from an unauthenticated client/browser. */
export function createQl798OriginalRenewalDashboard({originalOperator,now=()=>Date.now()}={}){
  const callbacks=['readOriginalQl798SourceByteProvenance',
    'readOriginalQl798IndependentRenewal','resolveOriginalQl798PinnedSigner',
    'readIndependentQl798SignerCustody','readIndependentQl798CustodianAnchor',
    'readOriginalQl798OwnerConflictRegister',
    'readOriginalQl798OwnerResolutionSignatures',
    'readIndependentQl798OwnerResolutionCustody',
    'readIndependentQl798SixPeersAfterRenewal'];
  if(typeof now!=='function'||callbacks.some(k=>typeof originalOperator?.[k]!=='function'))
    throw Error('HOLD_ORIGINAL_QL798_PRIVATE_OPERATOR_AND_DUAL_CUSTODIANS_REQUIRED');
  const previous=createQl797OriginalReceiptCustodyAudit({originalOperator,now});
  let attempted=false;
  return Object.freeze({
    inspect(){return held('HOLD_ORIGINAL_QL798_RENEWAL_AND_OWNER_REVIEW_REQUIRED',{attempted});},
    async reviewOne(input){
      if(attempted)return held('DENY_DUPLICATE_RENEWAL_OR_AUTOMATIC_RETRY');
      attempted=true;
      const t=now();
      if(!Number.isSafeInteger(t))return held('HOLD_ORIGINAL_TRUSTED_CLOCK_REQUIRED');
      try{
        const baseline=await previous.reviewOne(input);
        if(!baseline.accepted||baseline.connected!==false||
          baseline.connectionState!==HELD||
          baseline.postDecisionSixAppIsolationVerified!==true){
          return held(baseline.state==='HOLD_DIVERGENT_ORIGINAL_OWNER_DECISIONS'?
            'HOLD_OWNER_DECISION_CONFLICT_NEEDS_NEW_ORIGINAL_SIGNED_QL797_REVIEW':
            'HOLD_ORIGINAL_QL797_RECEIPT_AND_OWNER_AUDIT_NOT_VERIFIED',
            {priorHoldState:baseline.state});
        }
        const source=await originalOperator.readOriginalQl798SourceByteProvenance({
          sourceId:ID,operationId:baseline.operationId,
          receiptSha256:baseline.receiptSha256});
        if(!validSource(source,baseline,input?.record,t))
          return held('HOLD_ORIGINAL_QL364_RECEIPT_BYTES_OR_HANDLER_NOT_VERIFIED');
        const preflight=await originalOperator.readOriginalQl362DevicePreflight({sourceId:ID});
        const pins=[preflight?.issuerSpkiSha256,preflight?.witnessSpkiSha256,
          preflight?.sourceOwnerSpkiSha256,preflight?.masterOwnerSpkiSha256,
          preflight?.redactionAuditorSpkiSha256];
        const sourceSigner=await originalOperator.resolveOriginalSourceSignerPin({sourceId:ID});
        const retentionSigner=await originalOperator.resolveOriginalRetentionWitnessPin({sourceId:ID});
        const custodyWitness=await originalOperator.resolveOriginalQl797AuthorityPin({role:'custody_witness',sourceId:ID});
        const auditWitness=await originalOperator.resolveOriginalQl797AuthorityPin({role:'audit_witness',sourceId:ID});
        pins.push(sourceSigner?.spkiSha256,retentionSigner?.spkiSha256,
          custodyWitness?.spkiSha256,auditWitness?.spkiSha256);
        if(pins.some(v=>!HEX.test(v??''))||new Set(pins).size!==pins.length)
          return held('HOLD_CROSS_CUSTODIAN_SIGNER_ROLE_ISOLATION');
        const renewals=[],shaList=[],expires=[];
        for(const role of ROLE){
          const att=await originalOperator.readOriginalQl798IndependentRenewal({
            role,sourceId:ID,operationId:baseline.operationId,
            receiptSha256:baseline.receiptSha256});
          if(!validRenewal(att?.payload,role,baseline,source,t))
            return held('HOLD_ORIGINAL_CUSTODIAN_RENEWAL_EXPIRED_OR_MISMATCHED',{blockedRole:role});
          const spki=await verifyOriginalSigner(originalOperator,role,att,pins,t);
          if(!spki)return held('HOLD_INDEPENDENT_ORIGINAL_CUSTODIAN_SIGNATURE',{blockedRole:role});
          pins.push(spki);
          const digest=sha(att.payload);
          const anchor=await originalOperator.readIndependentQl798CustodianAnchor({
            sourceId:ID,role,renewalSha256:digest,
            sequence:att.payload.renewalSequence,
            independentStoreId:att.payload.independentStoreId});
          if(anchor?.state!=='INDEPENDENT_ORIGINAL_RENEWAL_ANCHOR_READBACK'||
            anchor.sourceId!==ID||anchor.role!==role||
            anchor.renewalSha256!==digest||
            anchor.sequence!==att.payload.renewalSequence||
            anchor.previousRenewalSha256!==att.payload.previousRenewalSha256||
            anchor.independentStoreId!==att.payload.independentStoreId||
            anchor.immutable!==true||anchor.revoked!==false||
            anchor.connectedCount!==0)
            return held('HOLD_INDEPENDENT_CROSS_CUSTODIAN_ARCHIVE_RENEWAL',{blockedRole:role});
          renewals.push(att.payload);shaList.push(digest);
          expires.push(date(att.payload.expiresAt));
        }
        if(shaList[0]===shaList[1])return held('DENY_SHARED_OR_REPLAYED_CUSTODIAN_RECEIPT');
        const conflict=await originalOperator.readOriginalQl798OwnerConflictRegister({
          sourceId:ID,operationId:baseline.operationId,
          decisionAuditSha256:baseline.decisionAuditSha256});
        if(conflict?.schema!=='rosie.comms.ql798.owner-conflict-register.v1'||
          conflict.sourceId!==ID||conflict.operationId!==baseline.operationId||
          conflict.decisionAuditSha256!==baseline.decisionAuditSha256||
          !Number.isSafeInteger(conflict.unresolvedCount)||conflict.unresolvedCount<0||
          !HEX.test(conflict.previousConflictSha256??'')||
          conflict.connectionState!==HELD||conflict.connectedCount!==0)
          return held('HOLD_ORIGINAL_OWNER_CONFLICT_REGISTER_NOT_VERIFIED');
        if(conflict.unresolvedCount>0||conflict.state!=='ORIGINAL_OWNER_CONFLICTS_CLOSED_NEW_SIGNATURES_REQUIRED'){
          return held('HOLD_UNRESOLVED_OWNER_DECISION_CONFLICT',{dashboard:{
            ...held('HOLD').dashboard,state:'OWNER_CONFLICT_REQUIRES_NEW_ORIGINAL_SIGNED_REVIEW',
            ownerConflicts:'UNRESOLVED',custodiansVerified:2}});
        }
        const conflictSha256=sha(conflict);
        const signed=await originalOperator.readOriginalQl798OwnerResolutionSignatures({
          sourceId:ID,operationId:baseline.operationId,
          conflictRegisterSha256:conflictSha256,
          primaryRenewalSha256:shaList[0],secondaryRenewalSha256:shaList[1]});
        if(!exact(signed,['sourceOwner','masterOwner']))
          return held('HOLD_ORIGINAL_REE_AND_JACK_SIGNED_RENEWAL_RESOLUTION');
        let earliestOwner=Infinity;
        for(const [role,key] of [['source_owner','sourceOwner'],['master_owner','masterOwner']]){
          const att=signed[key],p=att?.payload;
          if(!validOwner(p,role,baseline,shaList,conflictSha256,t)||
            !exact(att,['payload','signature','keyId'])||
            !SIG.test(att.signature??''))
            return held('DENY_OWNER_RENEWAL_CONNECTION_GRANT_OR_STALE_DECISION');
          const identity=await originalOperator.resolveOriginalPinnedOwnerAuthority({role,sourceId:ID});
          const ownerPin=role==='source_owner'?preflight.sourceOwnerSpkiSha256:
            preflight.masterOwnerSpkiSha256;
          if(identity?.role!==role||identity.sourceId!==ID||
            identity.spkiSha256!==ownerPin||identity.revoked!==false||
            typeof identity.publicKeyPem!=='string'||identity.publicKeyPem.length>2000)
            return held('HOLD_INDEPENDENT_ORIGINAL_OWNER_RENEWAL_PIN');
          const k=createPublicKey(identity.publicKeyPem);
          if(k.asymmetricKeyType!=='ed25519'||
            createHash('sha256').update(k.export({format:'der',type:'spki'})).digest('hex')!==ownerPin||
            !verify(null,Buffer.from(canon(p)),k,Buffer.from(att.signature,'base64url')))
            return held('HOLD_INDEPENDENT_ORIGINAL_OWNER_RENEWAL_SIGNATURE');
          const witness=await originalOperator.readIndependentQl798OwnerResolutionCustody({
            sourceId:ID,role,spkiSha256:ownerPin,payloadSha256:sha(p)});
          if(witness?.state!=='INDEPENDENT_ORIGINAL_OWNER_RENEWAL_AUTHENTICATED'||
            witness.sourceId!==ID||witness.role!==role||
            witness.spkiSha256!==ownerPin||witness.payloadSha256!==sha(p)||
            witness.revoked!==false||
            !Number.isFinite(witness.observedAt)||Math.abs(t-witness.observedAt)>30_000)
            return held('HOLD_INDEPENDENT_OWNER_RENEWAL_CUSTODY');
          earliestOwner=Math.min(earliestOwner,date(p.expiresAt));
        }
        const peersReadback=await originalOperator.readIndependentQl798SixPeersAfterRenewal({
          sourceId:ID,operationId:baseline.operationId,
          primaryRenewalSha256:shaList[0],secondaryRenewalSha256:shaList[1],
          ownerResolutionSha256:sha(signed)});
        if(!validSix(peersReadback))
          return held('DENY_CROSS_TENANT_OR_SOURCE_CONNECTION_ELIGIBILITY');
        const dashboard=safeDashboard({source,renewal:renewals,
          ownerExpiry:earliestOwner,at:t});
        return {...held('ORIGINAL_DUAL_CUSTODIAN_RENEWAL_AND_OWNER_HOLD_REVIEW_VERIFIED'),
          accepted:true,sourceProofVerified:true,independentCustodiansVerified:2,
          ownerConflictResolved:true,originalOwnersSignedHoldResolution:true,
          independentSixPeerIsolationVerified:true,dashboard,
          sourceId:ID,operationId:baseline.operationId,
          primaryRenewalSha256:shaList[0],secondaryRenewalSha256:shaList[1],
          ownerResolutionSha256:sha(signed),
          nextAction:'Expiry or conflict: stop and re-attest on ORIGINAL devices. Never infer connected.'};
      }catch{return held('HOLD_ORIGINAL_PROVENANCE_CUSTODY_OR_PRIVATE_DB_UNAVAILABLE');}
    }
  });
}
export function ql798Cli(args=process.argv.slice(2)){
  if(args.length===1&&args[0]==='--status')
    return held('HOLD_ORIGINAL_CUSTODIAN_RENEWAL_AND_OWNER_SIGNED_ELIGIBILITY_UNAVAILABLE');
  throw Error('DENY_PUBLIC_CUSTODIAN_RENEWAL_OWNER_SIGNING_OR_CONNECTION');
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  try{process.stdout.write(JSON.stringify(ql798Cli())+'\n');}
  catch{process.stderr.write('DENY_ROSIE_QL798_UNSUPERVISED_ACTION\n');process.exitCode=1;}
}
