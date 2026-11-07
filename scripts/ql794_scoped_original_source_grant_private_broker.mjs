/** Rosie 794. Only original private operators may import the nonserializable
 * QL-361 handoff, verify separately signed owner decisions, query an actual
 * original source-only grant, run ONE approved signed TEST GET and independently
 * read its receipt + five other HELD peers. This file never grants or connects. */
import {createHash,createPublicKey,verify} from 'node:crypto';
import {pathToFileURL} from 'node:url';
const HASH=/^[a-f0-9]{64}$/;
const UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/;
const SIG=/^[A-Za-z0-9_-]{86}$/;
const HEALTH='/api/integration/v1/shell/health';
const HELD='DISCONNECTED / HOLD';
const repos=Object.freeze({rosiedazzlers:['business','rosiedazzlers'],
  devilndove:['business','devilndove-site'],icamp:['business','iCamp'],
  yw:['business','yw'],'ai-data-platform':['support','ai-data-platform'],
  'rosevear-ai-hub':['support','rosevear-ai-hub']});
const record=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
const keys=(v,ks)=>record(v)&&Object.keys(v).length===ks.length&&Object.keys(v).every(k=>ks.includes(k));
const canonical=v=>Array.isArray(v)?'['+v.map(canonical).join(',')+']':
  record(v)?'{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+canonical(v[k])).join(',')+'}':JSON.stringify(v);
const hash=v=>createHash('sha256').update(canonical(v)).digest('hex');
const hold=(state,extra={})=>({
  schema:'rosie.comms.ql794.original-owner-signed-source-only-test.v1',
  state,accepted:false,ownerSignaturesVerified:false,
  originalSourceGrantVerified:false,privateBrokerHealthVerified:false,
  fiveOtherPeersIsolated:false,connected:false,connectionState:HELD,
  customerCommunications:0,customerBytes:0,deviceActions:0,
  otherSourceGrants:0,retryAutomatically:false,...extra});
const payloadKeys=['schema','audience','sourceId','tenantId','environment',
  'method','path','scope','handoffSha256','archiveSha256','nonce',
  'issuedAt','expiresAt','customerDataAllowed','deviceActionsAllowed'];
const handoffKeys=['schema','kind','archiveId','archiveSha256',
  'redactionAuditSha256','independentAuditorSpkiSha256','auditAttestation',
  'receiverStopped','connectedCount','candidateCount','candidates',
  'customerCommunications','deviceActions','nextAction'];
const candidateKeys=['peerId','peerKind','repository','state',
  'sourceTestAuthorized','customerDataAllowed','requestedScope'];
const grantKeys=['schema','state','sourceId','tenantId','environment','method',
  'path','decisionSha256','originalHandoffSha256','sourceGrantId','grantCount',
  'revocationCount','sourceTestAuthorized','customerDataAllowed',
  'otherPeerGrantCount','connected','connectionState'];
const getKeys=['state','accepted','originalOperationId','requestSha256',
  'brokerReceiptSha256','signedFieldWitnessSha256','connected','connectionState'];
const receiptKeys=['schema','state','sourceId','tenantId','environment','method',
  'path','sourceGrantId','originalOperationId','requestSha256',
  'brokerReceiptSha256','signedFieldWitnessSha256','sourceGetCount',
  'connectedCount','customerBytes','deviceActions','otherPeerGrantCount',
  'peers','connected','connectionState'];
const peerKeys=['peerId','kind','repository','connectionState',
  'sourceTestAuthorized','customerDataAllowed'];
function validHandoff(proof,read){
  if(proof?.schema!=='rosevear.hub.ql361.archived-chain-redaction-handoff.v1'||
    proof.state!=='ORIGINAL_TEST_ARCHIVE_INDEPENDENTLY_AUDITED_SIX_OWNER_CANDIDATES_HELD'||
    proof.archivedOriginalChainVerified!==true||
    proof.independentRedactionAuditVerified!==true||
    proof.ownerControlledHandoffVerified!==true||proof.candidateCount!==6||
    proof.connected!==false||proof.connectedCount!==0||
    proof.connectionState!==HELD||
    !/^ql361-[a-f0-9-]{36}\.json$/.test(proof.handoffId??'')||
    !HASH.test(proof.handoffSha256??'')||
    read?.state!=='ORIGINAL_REE_QL361_HANDOFF_READBACK_VERIFIED'||
    read.originalComputer!=='DESKTOP-AE894KC'||read.originalUser!=='Ree'||
    read.ownerOnlyAcl!==true||read.handoffId!==proof.handoffId||
    read.sha256!==proof.handoffSha256||
    !keys(read.handoff,handoffKeys)||hash(read.handoff)!==proof.handoffSha256)
    return false;
  const h=read.handoff;
  if(h.schema!==proof.schema||h.kind!=='OWNER_PRIVATE_OFFLINE_SOURCE_REVIEW_ONLY'||
    h.receiverStopped!==true||h.connectedCount!==0||h.candidateCount!==6||
    h.customerCommunications!==false||h.deviceActions!==false||
    h.nextAction!=='SIX_SEPARATE_SOURCE_OWNER_SIGNED_TEST_DECISIONS_REQUIRED'||
    !HASH.test(h.archiveSha256??'')||!HASH.test(h.redactionAuditSha256??'')||
    !HASH.test(h.independentAuditorSpkiSha256??'')||
    !keys(h.auditAttestation,['payload','signature'])||
    !SIG.test(h.auditAttestation.signature??'')||
    !Array.isArray(h.candidates)||h.candidates.length!==6)return false;
  const seen=new Set();
  for(const c of h.candidates){
    if(!keys(c,candidateKeys)||!Object.hasOwn(repos,c.peerId)||seen.has(c.peerId))return false;
    const [kind,repo]=repos[c.peerId];
    if(c.peerKind!==kind||c.repository!==repo||
      c.state!=='AWAITING_INDEPENDENT_SOURCE_OWNER_SIGNATURE'||
      c.sourceTestAuthorized!==false||c.customerDataAllowed!==false||
      c.requestedScope!=='HEALTH_READ_ONLY_TEST_PROPOSAL_NOT_AUTHORIZATION')return false;
    seen.add(c.peerId);
  }
  return seen.size===6;
}
function scope(p,h,now){
  if(!keys(p,payloadKeys)||p.schema!=='rosie.comms.ql794.scoped-source-grant-request.v1'||
    p.audience!=='rosevear-comms-hub:rosiedazzlers:TEST'||
    p.sourceId!=='rosiedazzlers'||p.tenantId!=='rosie-dazzlers'||
    p.environment!=='TEST'||p.method!=='GET'||p.path!==HEALTH||
    p.scope!=='one-read-only-health-test-no-customer-access'||
    p.handoffSha256!==h.handoffSha256||p.archiveSha256!==h.handoff.archiveSha256||
    !UUID.test(p.nonce??'')||p.customerDataAllowed!==false||
    p.deviceActionsAllowed!==false)return false;
  const from=Date.parse(p.issuedAt),to=Date.parse(p.expiresAt);
  return Number.isFinite(from)&&Number.isFinite(to)&&
    p.issuedAt===new Date(from).toISOString()&&p.expiresAt===new Date(to).toISOString()&&
    from<=now+5_000&&from>=now-600_000&&to>now&&to-from<=600_000;
}
async function checkOwners(op,ownerDecisions,body,proof,handoffSha){
  if(!keys(ownerDecisions,['payload','sourceSignature','masterSignature'])||
    !SIG.test(ownerDecisions.sourceSignature??'')||
    !SIG.test(ownerDecisions.masterSignature??''))return null;
  const digest=hash(body),pins=[];
  for(const [role,signature] of [['source',ownerDecisions.sourceSignature],
    ['master',ownerDecisions.masterSignature]]){
    const pin=await op.resolveIndependentlyPinnedOriginalOwner(role);
    if(pin?.role!==role||!HASH.test(pin.spkiSha256??'')||
      typeof pin.publicKeyPem!=='string'||pin.publicKeyPem.length>2000||
      pin.spkiSha256===proof.handoff.independentAuditorSpkiSha256)return null;
    const key=createPublicKey(pin.publicKeyPem);
    if(key.asymmetricKeyType!=='ed25519'||
      createHash('sha256').update(key.export({type:'spki',format:'der'})).digest('hex')!==pin.spkiSha256)
      return null;
    const custody=await op.verifyIndependentOriginalOwnerCustody({
      role,spkiSha256:pin.spkiSha256,requestSha256:digest,
      originalHandoffSha256:handoffSha});
    if(custody?.authenticated!==true||custody.revoked!==false||
      custody.role!==role||custody.spkiSha256!==pin.spkiSha256||
      custody.requestSha256!==digest||
      custody.originalHandoffSha256!==handoffSha)return null;
    const bytes=Buffer.from(signature,'base64url');
    if(bytes.length!==64||!verify(null,Buffer.from(canonical(body)),key,bytes))return null;
    pins.push(pin.spkiSha256);
  }
  return pins[0]!==pins[1]?digest:null;
}
function validGrant(g,digest,handoffSha){
  return keys(g,grantKeys)&&
    g.schema==='rosie.comms.ql794.original-source-only-grant-readback.v1'&&
    g.state==='ONE_ORIGINAL_ROSIE_HEALTH_TEST_GRANT_INDEPENDENTLY_APPROVED'&&
    g.sourceId==='rosiedazzlers'&&g.tenantId==='rosie-dazzlers'&&
    g.environment==='TEST'&&g.method==='GET'&&g.path===HEALTH&&
    g.decisionSha256===digest&&g.originalHandoffSha256===handoffSha&&
    UUID.test(g.sourceGrantId??'')&&g.grantCount===1&&g.revocationCount===0&&
    g.sourceTestAuthorized===true&&g.customerDataAllowed===false&&
    g.otherPeerGrantCount===0&&g.connected===false&&g.connectionState===HELD;
}
function validFivePeerIsolation(r,g,out){
  if(!keys(out,getKeys)||out.accepted!==true||
    out.state!=='ONE_AUTHENTICATED_PRIVATE_ROSIE_SOURCE_GET_ACCEPTED_STILL_HELD'||
    out.connected!==false||out.connectionState!==HELD||
    !UUID.test(out.originalOperationId??'')||
    !HASH.test(out.requestSha256??'')||!HASH.test(out.brokerReceiptSha256??'')||
    !HASH.test(out.signedFieldWitnessSha256??'')||
    !keys(r,receiptKeys)||
    r.schema!=='rosie.comms.ql794.original-private-source-isolation-readback.v1'||
    r.state!=='ONE_ROSIE_SOURCE_HEALTH_TEST_VERIFIED_FIVE_OTHER_PEERS_HELD'||
    r.sourceId!=='rosiedazzlers'||r.tenantId!=='rosie-dazzlers'||
    r.environment!=='TEST'||r.method!=='GET'||r.path!==HEALTH||
    r.sourceGrantId!==g.sourceGrantId||r.originalOperationId!==out.originalOperationId||
    r.requestSha256!==out.requestSha256||r.brokerReceiptSha256!==out.brokerReceiptSha256||
    r.signedFieldWitnessSha256!==out.signedFieldWitnessSha256||
    r.sourceGetCount!==1||r.connectedCount!==0||r.customerBytes!==0||
    r.deviceActions!==0||r.otherPeerGrantCount!==0||r.connected!==false||
    r.connectionState!==HELD||!Array.isArray(r.peers)||r.peers.length!==6)
    return false;
  const seen=new Set();
  for(const p of r.peers){
    if(!keys(p,peerKeys)||!Object.hasOwn(repos,p.peerId)||seen.has(p.peerId))return false;
    const [kind,repo]=repos[p.peerId];
    if(p.kind!==kind||p.repository!==repo||p.connectionState!==HELD||
      p.customerDataAllowed!==false||
      p.sourceTestAuthorized!==(p.peerId==='rosiedazzlers'))return false;
    seen.add(p.peerId);
  }
  return seen.size===6;
}

/** All seven functions must originate from protected original private code.
 * Source and master signatures are verified HERE, but pin provenance, grant,
 * broker receipt and the independent DB snapshot require original systems. */
export function createQl794OriginalSourceGrantSafety({originalOperator,now=()=>Date.now()}={}){
  const funcs=['verifyOriginalQl361Handoff','readOriginalQl361Handoff',
    'resolveIndependentlyPinnedOriginalOwner','verifyIndependentOriginalOwnerCustody',
    'readOriginalRosieSourceGrant','runOneAuthenticatedPrivateRosieGet',
    'readIndependentBrokerReceiptAndSixPeerIsolation'];
  if(typeof now!=='function'||funcs.some(k=>typeof originalOperator?.[k]!=='function'))
    throw Error('HOLD_ORIGINAL_QL361_HANDOFF_OWNERS_AND_BROKER_NOT_ENROLLED');
  let used=false;
  return Object.freeze({
    inspect(){return hold('HOLD_ORIGINAL_INDEPENDENT_ROSIE_SOURCE_GRANT_AND_PRIVATE_GET',
      {attempted:used});},
    async runOne({ownerDecisions,sourceSignedPacket}={}){
      if(used)return hold('DENY_DUPLICATE_OR_REPLAYED_OWNER_SIGNED_TEST');
      const time=now();
      if(!Number.isFinite(time))return hold('HOLD_ORIGINAL_CLOCK_UNAVAILABLE');
      used=true;
      try{
        const proof=await originalOperator.verifyOriginalQl361Handoff();
        if(proof?.ownerControlledHandoffVerified!==true||!HASH.test(proof.handoffSha256??''))
          return hold('HOLD_REAL_QL361_INDEPENDENT_AUDIT_AND_CANDIDATE_REQUIRED');
        const handoff=await originalOperator.readOriginalQl361Handoff({
          handoffId:proof.handoffId,expectedSha256:proof.handoffSha256});
        if(!validHandoff(proof,handoff))
          return hold('HOLD_ORIGINAL_Ql361_OWNER_ONLY_HANDOFF_OR_SIX_PEERS_MISMATCH');
        const p=ownerDecisions?.payload;
        if(!scope(p,{handoffSha256:proof.handoffSha256,handoff:handoff.handoff},time))
          return hold('DENY_UNSCOPED_OR_EXPIRED_SOURCE_OWNER_GRANT_REQUEST');
        const decisionSha=await checkOwners(originalOperator,ownerDecisions,p,
          handoff,proof.handoffSha256);
        if(!decisionSha)return hold('HOLD_DISTINCT_ORIGINAL_SOURCE_AND_MASTER_SIGNATURES');
        const grant=await originalOperator.readOriginalRosieSourceGrant({
          sourceId:'rosiedazzlers',tenantId:'rosie-dazzlers',
          decisionSha256:decisionSha,originalHandoffSha256:proof.handoffSha256});
        if(!validGrant(grant,decisionSha,proof.handoffSha256))
          return hold('HOLD_ORIGINAL_ONE_SOURCE_TEST_GRANT_AND_REVOCATION_READBACK');
        const envelope=sourceSignedPacket?.envelope;
        if(envelope?.source!=='rosiedazzlers'||envelope?.tenant!=='rosie-dazzlers'||
          envelope?.environment!=='TEST'||envelope?.method!=='GET'||
          envelope?.path!==HEALTH||envelope?.grantId!==grant.sourceGrantId||
          envelope?.decisionSha256!==decisionSha||
          !Number.isFinite(Date.parse(envelope.issuedAt))||
          !Number.isFinite(Date.parse(envelope.expiresAt))||
          Date.parse(envelope.issuedAt)>time||Date.parse(envelope.expiresAt)<=time)
          return hold('DENY_ROSIE_PRIVATE_GET_REQUEST_NOT_BOUND_TO_OWNER_GRANT');
        const outcome=await originalOperator.runOneAuthenticatedPrivateRosieGet({
          sourceSignedPacket,originalSourceGrantId:grant.sourceGrantId,
          decisionSha256:decisionSha});
        if(!keys(outcome,getKeys)||outcome.accepted!==true||
          outcome.state!=='ONE_AUTHENTICATED_PRIVATE_ROSIE_SOURCE_GET_ACCEPTED_STILL_HELD'||
          outcome.connected!==false||outcome.connectionState!==HELD||
          !UUID.test(outcome.originalOperationId??'')||
          !HASH.test(outcome.requestSha256??'')||
          !HASH.test(outcome.brokerReceiptSha256??'')||
          !HASH.test(outcome.signedFieldWitnessSha256??''))
          return hold('HOLD_GENUINE_ONE_ROSIE_SIGNED_BROKER_GET_REQUIRED');
        const independent=await originalOperator.readIndependentBrokerReceiptAndSixPeerIsolation({
          sourceId:'rosiedazzlers',tenantId:'rosie-dazzlers',
          sourceGrantId:grant.sourceGrantId,
          originalOperationId:outcome?.originalOperationId,
          requestSha256:outcome?.requestSha256,
          brokerReceiptSha256:outcome?.brokerReceiptSha256,
          signedFieldWitnessSha256:outcome?.signedFieldWitnessSha256});
        if(!validFivePeerIsolation(independent,grant,outcome))
          return hold('HOLD_INDEPENDENT_SIGNED_BROKER_GET_AND_FIVE_PEER_ISOLATION');
        return {...hold('ONE_ROSIE_READ_ONLY_TEST_GET_VERIFIED_NO_PRODUCTION_CONNECTION'),
          accepted:true,ownerSignaturesVerified:true,
          originalSourceGrantVerified:true,privateBrokerHealthVerified:true,
          fiveOtherPeersIsolated:true,
          authenticatedTestOnly:true,sourceGrantId:grant.sourceGrantId,
          originalOperationId:outcome.originalOperationId,
          brokerReceiptSha256:outcome.brokerReceiptSha256,
          nextAction:'Keep customer and production connection DISCONNECTED/HOLD pending separate owner production authorization.'};
      }catch{return hold('HOLD_ORIGINAL_PRIVATE_AUTHORITY_OR_BROKER_UNAVAILABLE');}
    }
  });
}

export function ql794Cli(args=process.argv.slice(2)){
  if(args.length===1&&args[0]==='--status')
    return hold('HOLD_ORIGINAL_SOURCE_OWNER_GRANT_AND_REAL_PRIVATE_BROKER_ABSENT');
  throw Error('DENY_PUBLIC_GRANT_OR_UNSIGNED_PRIVATE_BROKER_EXECUTION');
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  try{process.stdout.write(JSON.stringify(ql794Cli())+'\n');}
  catch{process.stderr.write('DENY_PUBLIC_Ql794_OWNER_GRANT\n');process.exitCode=1;}
}
