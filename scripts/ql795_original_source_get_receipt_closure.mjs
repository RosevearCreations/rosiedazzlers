/** Rosie 795: private original QL-362 one-GET closure, not source enrollment.
 * All private operations and DB reads MUST be supplied by authenticated
 * original-host adapters. This module never signs for an owner or sends HTTP. */
import {createHash,createPublicKey,verify} from 'node:crypto';
import {pathToFileURL} from 'node:url';

const SOURCE='rosiedazzlers', REPO='rosiedazzlers';
const HEALTH='/api/integration/v1/shell/health', HELD='DISCONNECTED / HOLD';
const SHA=/^[0-9a-f]{64}$/, COMMIT=/^[0-9a-f]{40}$/;
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const SIG=/^[A-Za-z0-9_-]{86}$/;
const SCHEMA='rosie.comms.ql795.original-ql362-one-get-closure.v1';
const QL362='rosevear.hub.ql362.source-owner-one-get.v1';
const APPROVAL='rosevear.hub.ql362.exact-source-owner-approval.v1';
const AUDIT='rosevear.hub.ql361.independent-redaction-audit.v1';
const EXPORT='rosie.comms.ql795.redacted-original-source-get-export.v1';
const repositories={rosiedazzlers:['business','rosiedazzlers'],
  devilndove:['business','devilndove-site'],icamp:['business','iCamp'],
  yw:['business','yw'],'ai-data-platform':['support','ai-data-platform'],
  'rosevear-ai-hub':['support','rosevear-ai-hub']};
const object=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
const exact=(v,ks)=>object(v)&&Object.keys(v).length===ks.length&&Object.keys(v).every(k=>ks.includes(k));
const canonical=v=>Array.isArray(v)?'['+v.map(canonical).join(',')+']':
  object(v)?'{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+canonical(v[k])).join(',')+'}':JSON.stringify(v);
const sha=v=>createHash('sha256').update(canonical(v)).digest('hex');
const hold=(state,extra={})=>({schema:SCHEMA,state,
  accepted:false,verifiedOriginalQl362Get:false,verifiedIndependentWitness:false,
  verifiedSixPeersHeld:false,verifiedIndependentSignedExport:false,
  connected:false,connectedCount:0,connectionState:HELD,
  sourceTestAuthorized:false,customerCommunications:false,
  customerBytes:0,deviceActions:0,sourceRepositoryWrites:0,
  retryAutomatically:false,...extra});
const requestKeys=['schema','kind','archiveId','handoffSha256','sourceId',
  'repository','operationId','sourceCommitSha','manifestSha256',
  'sourceOrigin','environment','method','path','issuedAt','expiresAt',
  'customerDataAllowed','deviceActionsAllowed','persistentConnectionAllowed'];
const approvalKeys=['schema','role','sourceId','requestSha256','audience',
  'decision','issuedAt','expiresAt'];
const handoffKeys=['schema','kind','archiveId','archiveSha256',
  'redactionAuditSha256','independentAuditorSpkiSha256','auditAttestation',
  'receiverStopped','connectedCount','candidateCount','candidates',
  'customerCommunications','deviceActions','nextAction'];
const candidateKeys=['peerId','peerKind','repository','state',
  'sourceTestAuthorized','customerDataAllowed','requestedScope'];
const peerKeys=['peer_id','peer_kind','source_repo','connection_state',
  'source_test_authorized','customer_data_allowed'];
const witnessKeys=['schema','state','sourceId','operationId','requestSha256',
  'receiptSha256','sourceGetCount','durableUniqueClaim','sourceSignerAuthenticated',
  'immutableWitnessReadback','receiverStopped','customerBytes','deviceActions',
  'connectedCount','connectionState'];
const exportKeys=['schema','sourceId','operationId','requestSha256','receiptSha256',
  'handoffSha256','sourceCommitSha','manifestSha256','sourceGetCount',
  'connectedCount','otherPeersHeld','ownerKeysDistinct',
  'sourceSignedReceiptVerified','immutableClaimVerified','customerBytes',
  'deviceActions','sourceRepositoryWrites','connectionState','closureTimestamp'];

function originalHandoff(read,id,digest){
  if(read?.state!=='ORIGINAL_REE_QL361_HANDOFF_READBACK_VERIFIED'||
    read.originalComputer!=='DESKTOP-AE894KC'||read.originalUser!=='Ree'||
    read.ownerOnlyAcl!==true||read.handoffId!==id||read.sha256!==digest||
    !exact(read.handoff,handoffKeys)||sha(read.handoff)!==digest)return false;
  const h=read.handoff;
  if(h.schema!=='rosevear.hub.ql361.archived-chain-redaction-handoff.v1'||
    h.kind!=='OWNER_PRIVATE_OFFLINE_SOURCE_REVIEW_ONLY'||
    h.receiverStopped!==true||h.connectedCount!==0||h.candidateCount!==6||
    h.customerCommunications!==false||h.deviceActions!==false||
    !SHA.test(h.archiveSha256??'')||!SHA.test(h.redactionAuditSha256??'')||
    !SHA.test(h.independentAuditorSpkiSha256??'')||
    h.nextAction!=='SIX_SEPARATE_SOURCE_OWNER_SIGNED_TEST_DECISIONS_REQUIRED'||
    !exact(h.auditAttestation,['payload','signature'])||
    !Array.isArray(h.candidates)||h.candidates.length!==6)return false;
  const seen=new Set();
  for(const c of h.candidates){
    if(!exact(c,candidateKeys)||!Object.hasOwn(repositories,c.peerId)||seen.has(c.peerId))return false;
    const [kind,repo]=repositories[c.peerId];
    if(c.peerKind!==kind||c.repository!==repo||
      c.state!=='AWAITING_INDEPENDENT_SOURCE_OWNER_SIGNATURE'||
      c.sourceTestAuthorized!==false||c.customerDataAllowed!==false||
      c.requestedScope!=='HEALTH_READ_ONLY_TEST_PROPOSAL_NOT_AUTHORIZATION')return false;
    seen.add(c.peerId);
  }
  return seen.size===6;
}
function originalRequest(request,handoffDigest,handoff,now){
  if(!exact(request,requestKeys)||request.schema!==QL362||
    request.kind!=='ONE_PRIVATE_HEALTH_GET_INTENT'||
    request.archiveId!==handoff.archiveId||
    request.handoffSha256!==handoffDigest||request.sourceId!==SOURCE||
    request.repository!==REPO||!UUID.test(request.operationId??'')||
    !COMMIT.test(request.sourceCommitSha??'')||
    !SHA.test(request.manifestSha256??'')||
    request.environment!=='TEST'||request.method!=='GET'||
    request.path!==HEALTH||request.customerDataAllowed!==false||
    request.deviceActionsAllowed!==false||request.persistentConnectionAllowed!==false)
    return false;
  try{const url=new URL(request.sourceOrigin);
    if(url.protocol!=='https:'||url.origin!==request.sourceOrigin||
      url.username||url.password||url.pathname!=='/'||url.search||url.hash)return false;
  }catch{return false;}
  const a=Date.parse(request.issuedAt),b=Date.parse(request.expiresAt);
  return Number.isFinite(a)&&Number.isFinite(b)&&
    request.issuedAt===new Date(a).toISOString()&&
    request.expiresAt===new Date(b).toISOString()&&
    now>=a&&now-a<=15_000&&b>now&&b-a===90_000;
}
async function pinAndVerify(op,role,sourceId,body,signature,disallow=[]){
  if(!SIG.test(signature??''))return null;
  const pin=await op.resolveOriginalPinnedAuthority(role,sourceId);
  if(pin?.role!==role||pin.sourceId!==sourceId||
    !SHA.test(pin.spkiSha256??'')||
    disallow.includes(pin.spkiSha256)||
    typeof pin.publicKeyPem!=='string'||pin.publicKeyPem.length>2000)return null;
  const key=createPublicKey(pin.publicKeyPem);
  if(key.asymmetricKeyType!=='ed25519'||
    createHash('sha256').update(key.export({type:'spki',format:'der'})).digest('hex')!==pin.spkiSha256)
    return null;
  const digest=role==='redaction_auditor'?body.redactionReportSha256:
    (role==='source_owner'||role==='master_owner')?body.requestSha256:sha(body);
  const custody=await op.verifyIndependentOriginalCustody({role,sourceId,
    spkiSha256:pin.spkiSha256,requestSha256:digest});
  if(custody?.authenticated!==true||custody.revoked!==false||
    custody.role!==role||custody.sourceId!==sourceId||
    custody.spkiSha256!==pin.spkiSha256||custody.requestSha256!==digest)
    return null;
  const signatureBytes=Buffer.from(signature,'base64url');
  if(signatureBytes.length!==64||!verify(null,Buffer.from(canonical(body)),key,signatureBytes))return null;
  return pin.spkiSha256;
}
async function verifyOriginalDecisions(op,handoff,request,source,master,now){
  const audit=handoff.auditAttestation;
  if(!SIG.test(audit.signature??'')||!object(audit.payload)||
    audit.payload.schema!==AUDIT||audit.payload.role!=='redaction_auditor'||
    audit.payload.archiveId!==handoff.archiveId||
    audit.payload.archiveSha256!==handoff.archiveSha256||
    audit.payload.redactionReportSha256!==handoff.redactionAuditSha256||
    audit.payload.audience!=='rosevear-comms-hub:original-archive:TEST'||
    audit.payload.scope!=='independent-redaction-review-owner-handoff-only'||
    Date.parse(audit.payload.issuedAt)>now+5_000||
    Date.parse(audit.payload.expiresAt)<=now)return null;
  const auditorPin=await pinAndVerify(op,'redaction_auditor',undefined,
    audit.payload,audit.signature);
  if(!auditorPin||auditorPin!==handoff.independentAuditorSpkiSha256)return null;
  const requestSha256=sha(request),pins=[auditorPin];
  for(const [approval,role] of [[source,'source_owner'],[master,'master_owner']]){
    if(!exact(approval,['schema','payload','signature'])||
      approval.schema!==APPROVAL||!exact(approval.payload,approvalKeys))return null;
    const p=approval.payload,a=Date.parse(p.issuedAt),b=Date.parse(p.expiresAt);
    if(p.schema!==APPROVAL||p.role!==role||p.sourceId!==SOURCE||
      p.requestSha256!==requestSha256||
      p.audience!=='rosevear-comms-hub:source-only-health-get:TEST'||
      p.decision!=='APPROVE_EXACTLY_ONE_SOURCE_HEALTH_GET'||
      !Number.isFinite(a)||!Number.isFinite(b)||
      p.issuedAt!==new Date(a).toISOString()||p.expiresAt!==new Date(b).toISOString()||
      a>now+5_000||b<=now||b-a>90_000)return null;
    const pin=await pinAndVerify(op,role,SOURCE,p,approval.signature,pins);
    if(!pin)return null;
    pins.push(pin);
  }
  return {requestSha256,sourceOwnerSpkiSha256:pins[1],
    masterOwnerSpkiSha256:pins[2],auditorSpkiSha256:pins[0]};
}
function validQl362Result(v,request,digest){
  return v?.schema===QL362&&
    v.state==='ONE_APPROVED_SOURCE_ONLY_HEALTH_GET_VERIFIED_SIX_APPS_STILL_HELD'&&
    v.originalArchivedTestVerified===true&&
    v.sourceOwnerSignatureVerified===true&&v.masterOwnerSignatureVerified===true&&
    v.privateOperationClaimed===true&&v.firstSourceGetVerified===true&&
    v.sourceId===SOURCE&&v.operationId===request.operationId&&
    v.requestSha256===digest&&SHA.test(v.receiptSha256??'')&&
    v.otherPeersHeld===5&&v.connected===false&&v.connectedCount===0&&
    v.sourceTestAuthorized===false&&v.customerDataAllowed===false&&
    v.customerCommunications===false&&v.deviceActions===false&&
    v.sourceRepositoryWrites===0&&v.connectionState===HELD&&
    v.retryAutomatically===false;
}
function validWitness(w,result){
  return exact(w,witnessKeys)&&
    w.schema==='rosie.comms.ql795.original-ql362-witness-readback.v1'&&
    w.state==='ORIGINAL_ONE_SOURCE_DURABLE_CLAIM_AND_WITNESS_VERIFIED'&&
    w.sourceId===SOURCE&&w.operationId===result.operationId&&
    w.requestSha256===result.requestSha256&&w.receiptSha256===result.receiptSha256&&
    w.sourceGetCount===1&&w.durableUniqueClaim===true&&
    w.sourceSignerAuthenticated===true&&w.immutableWitnessReadback===true&&
    w.receiverStopped===true&&w.customerBytes===0&&w.deviceActions===0&&
    w.connectedCount===0&&w.connectionState===HELD;
}
function validSixPeers(s){
  if(s?.schema!=='rosie.comms.ql795.original-six-peer-post-test-readback.v1'||
    s.state!=='SIX_ORIGINAL_SOURCE_PEERS_STILL_HELD_AFTER_ONE_GET'||
    s.databaseRole!=='ql340c_private_receiver'||s.connectedCount!==0||
    !Array.isArray(s.rows)||s.rows.length!==6)return false;
  const seen=new Set();
  for(const row of s.rows){
    if(!exact(row,peerKeys)||!Object.hasOwn(repositories,row.peer_id)||
      seen.has(row.peer_id))return false;
    const [kind,repo]=repositories[row.peer_id];
    if(row.peer_kind!==kind||row.source_repo!==repo||
      row.connection_state!=='HOLD'||row.source_test_authorized!==false||
      row.customer_data_allowed!==false)return false;
    seen.add(row.peer_id);
  }
  return seen.size===6;
}
function validExport(v,request,result,handoffSha256,at){
  const p=v?.payload;
  if(!exact(v,['payload','signature'])||!SIG.test(v.signature??'')||
    !exact(p,exportKeys)||p.schema!==EXPORT||p.sourceId!==SOURCE||
    p.operationId!==result.operationId||p.requestSha256!==result.requestSha256||
    p.receiptSha256!==result.receiptSha256||
    p.handoffSha256!==handoffSha256||
    p.sourceCommitSha!==request.sourceCommitSha||
    p.manifestSha256!==request.manifestSha256||
    p.sourceGetCount!==1||p.connectedCount!==0||p.otherPeersHeld!==5||
    p.ownerKeysDistinct!==true||p.sourceSignedReceiptVerified!==true||
    p.immutableClaimVerified!==true||p.customerBytes!==0||p.deviceActions!==0||
    p.sourceRepositoryWrites!==0||p.connectionState!==HELD)return false;
  const date=Date.parse(p.closureTimestamp);
  return Number.isFinite(date)&&p.closureTimestamp===new Date(date).toISOString()&&
    Math.abs(at-date)<=60_000;
}

/** The original operator implements the exact QL-362 gate, independent
 * PostgreSQL and source receipt/witness readbacks. No fake test receipt may
 * substitute for private original evidence. */
export function createQl795OriginalReceiptClosure({originalOperator,now=()=>Date.now()}={}){
  const callbacks=['readOriginalQl361Handoff','resolveOriginalPinnedAuthority',
    'verifyIndependentOriginalCustody','runOneOriginalQl362PrivateSourceGet',
    'readOriginalImmutableQl362WitnessAndClaim',
    'readIndependentSixSourceDatabaseSnapshot','readOriginalSignedRedactedEvidenceExport'];
  if(typeof now!=='function'||callbacks.some(k=>typeof originalOperator?.[k]!=='function'))
    throw Error('HOLD_ORIGINAL_QL362_OPERATOR_AND_CUSTODY_UNAVAILABLE');
  let spent=false;
  return Object.freeze({
    inspect(){return hold('HOLD_ORIGINAL_OWNER_SIGNED_QL362_TEST_RECEIPT_AND_EXPORT',{attempted:spent});},
    async runOne({handoffId,expectedHandoffSha256,request,
      sourceOwnerApproval,masterOwnerApproval}={}){
      if(spent)return hold('DENY_SECOND_OR_REPLAYED_ORIGINAL_SOURCE_GET');
      spent=true;
      const at=now();
      if(!Number.isFinite(at)||!Number.isSafeInteger(at)||
        !/^ql361-[0-9a-f-]{36}\.json$/.test(handoffId??'')||
        !SHA.test(expectedHandoffSha256??''))
        return hold('DENY_UNTRUSTED_ORIGINAL_QL361_HANDOFF_REFERENCE');
      try{
        const read=await originalOperator.readOriginalQl361Handoff({
          handoffId,expectedSha256:expectedHandoffSha256});
        if(!originalHandoff(read,handoffId,expectedHandoffSha256))
          return hold('HOLD_ORIGINAL_QL361_SIX_CANDIDATE_AND_ACL_READBACK');
        if(!originalRequest(request,expectedHandoffSha256,read.handoff,at))
          return hold('DENY_NONEXACT_OR_EXPIRED_QL362_ROSIE_GET_REQUEST');
        const owners=await verifyOriginalDecisions(originalOperator,read.handoff,
          request,sourceOwnerApproval,masterOwnerApproval,at);
        if(!owners)return hold('HOLD_ORIGINAL_AUDITOR_REE_SOURCE_AND_JACK_MASTER_SIGNATURES');
        const result=await originalOperator.runOneOriginalQl362PrivateSourceGet({
          handoffId,expectedHandoffSha256,sourceId:SOURCE,
          operationId:request.operationId,request,sourceOwnerApproval,
          masterOwnerApproval});
        if(!validQl362Result(result,request,owners.requestSha256))
          return hold('HOLD_REAL_ORIGINAL_QL362_APPROVED_ONE_GET_RESULT');
        const witness=await originalOperator.readOriginalImmutableQl362WitnessAndClaim({
          sourceId:SOURCE,operationId:request.operationId,
          requestSha256:result.requestSha256,receiptSha256:result.receiptSha256});
        if(!validWitness(witness,result))
          return hold('HOLD_INDEPENDENT_ORIGINAL_DURABLE_CLAIM_AND_IMMUTABLE_WITNESS');
        const peers=await originalOperator.readIndependentSixSourceDatabaseSnapshot({
          sourceId:SOURCE,operationId:request.operationId});
        if(!validSixPeers(peers))
          return hold('HOLD_ORIGINAL_SIX_PEER_DATABASE_NOT_ALL_ISOLATED');
        const exportRead=await originalOperator.readOriginalSignedRedactedEvidenceExport({
          sourceId:SOURCE,operationId:request.operationId,
          requestSha256:result.requestSha256,receiptSha256:result.receiptSha256});
        if(!validExport(exportRead,request,result,expectedHandoffSha256,now()))
          return hold('HOLD_ORIGINAL_SIGNED_REDACTED_CLOSURE_EXPORT_ABSENT');
        const exportSigner=await pinAndVerify(originalOperator,'receipt_witness',SOURCE,
          exportRead.payload,exportRead.signature,
          [owners.auditorSpkiSha256,owners.sourceOwnerSpkiSha256,
            owners.masterOwnerSpkiSha256]);
        if(!exportSigner)return hold('HOLD_SEPARATE_PINNED_RECEIPT_EXPORT_WITNESS_REQUIRED');
        return {...hold('ONE_ORIGINAL_QL362_ROSIE_GET_RECEIPT_CLOSED_SIX_PEERS_HELD'),
          accepted:true,verifiedOriginalQl362Get:true,
          verifiedIndependentWitness:true,verifiedSixPeersHeld:true,
          verifiedIndependentSignedExport:true,sourceId:SOURCE,
          operationId:request.operationId,requestSha256:owners.requestSha256,
          receiptSha256:result.receiptSha256,
          redactedExportSha256:sha(exportRead.payload),
          nextAction:'All six connections remain HOLD; separate persistent authority required.'};
      }catch{return hold('HOLD_ORIGINAL_PRIVATE_QL362_OPERATOR_OR_EVIDENCE_UNAVAILABLE');}
    }
  });
}
export function ql795Cli(args=process.argv.slice(2)){
  if(args.length===1&&args[0]==='--status')
    return hold('HOLD_NO_ORIGINAL_QL362_SIGNED_OWNER_GET_OR_EXPORT_INSTALLED');
  throw Error('DENY_UNSUPERVISED_PRIVATE_GET_OR_SOURCE_ENROLLMENT');
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  try{process.stdout.write(JSON.stringify(ql795Cli())+'\n');}
  catch{process.stderr.write('DENY_ROSIE_QL795_UNSUPERVISED_EXECUTION\n');process.exitCode=1;}
}
