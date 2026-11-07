/** Rosie 796: original-device QL-362 preflight, QL-363 signed health receipt
 * retention and owner-only candidate REVIEW. This code has no HTTP transport,
 * signer provisioner, database writer or production connection transition. */
import {createHash,createPublicKey,verify} from 'node:crypto';
import {pathToFileURL} from 'node:url';

const ID='rosiedazzlers',REPO='RosevearCreations/rosiedazzlers';
const HEALTH='/api/integration/v1/shell/health',HELD='DISCONNECTED / HOLD';
const SCHEMA='rosie.comms.ql796.original-ql363-source-receipt-review.v1';
const CONTRACT='rosevear.hub.ql363.six-source-health-contract.v1';
const RECEIPT='rosevear.hub.ql363.source-signed-health-receipt.v1';
const ENVELOPE='rosevear.hub.ql363.source-health-envelope.v1';
const SOURCE_HEALTH='rosevear.hub.ql362.source-health-receipt.v1';
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const SHA=/^[0-9a-f]{64}$/,COMMIT=/^[0-9a-f]{40}$/,SIG=/^[A-Za-z0-9_-]{86}$/;
const peers={rosiedazzlers:['business','rosiedazzlers'],
  devilndove:['business','devilndove-site'],icamp:['business','iCamp'],
  yw:['business','yw'],'ai-data-platform':['support','ai-data-platform'],
  'rosevear-ai-hub':['support','rosevear-ai-hub']};
const isObj=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
const exact=(v,ks)=>isObj(v)&&Object.keys(v).length===ks.length&&Object.keys(v).every(k=>ks.includes(k));
const canon=v=>Array.isArray(v)?'['+v.map(canon).join(',')+']':
  isObj(v)?'{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+canon(v[k])).join(',')+'}':JSON.stringify(v);
const sha=v=>createHash('sha256').update(canon(v)).digest('hex');
const hold=(state,extra={})=>({schema:SCHEMA,state,accepted:false,
  originalDevicePreflightVerified:false,sourceContractSignatureVerified:false,
  originalQl362OwnerClaimVerified:false,originalQl363ReceiptVerified:false,
  originalReceiptRetained:false,sixPeersHeld:false,
  candidateReviewOnly:true,connected:false,connectedCount:0,
  connectionState:HELD,sourceTestAuthorized:false,customerDataAllowed:false,
  customerCommunications:false,deviceActions:false,sourceRepositoryWrites:0,
  automaticallyRetry:false,...extra});
const contractKeys=['schema','sourceId','sourceAppId','repository',
  'tenantBoundary','sourceCommitSha','manifestSha256','sourceOrigin',
  'environment','method','path','responseSchema','receiptSchema',
  'scope','redirects','maxResponseBytes','persistentConnectionAllowed',
  'issuedAt','expiresAt'];
const receiptKeys=['schema','sourceId','operationId','requestSha256',
  'receiptSha256','sourceCommitSha','sourceOrigin','environment',
  'method','path','scope','issuedAt','expiresAt'];
const approvalKeys=['schema','role','sourceId','requestSha256','audience',
  'decision','issuedAt','expiresAt'];
const peerKeys=['peer_id','peer_kind','source_repo','connection_state',
  'source_test_authorized','customer_data_allowed'];
const retentionKeys=['schema','sourceId','operationId','requestSha256',
  'receiptSha256','originalComputer','ownerOnlyAcl','durableUniqueClaim',
  'sourceSignerAuthenticated','immutableWitnessReadback','customerBytes',
  'deviceActions','sourceRepositoryWrites','connectedCount','connectionState',
  'retainedAt','retainUntil'];
const validTime=(start,end,at,maxAge)=>{
  const a=Date.parse(start),b=Date.parse(end);
  return Number.isFinite(a)&&Number.isFinite(b)&&
    start===new Date(a).toISOString()&&end===new Date(b).toISOString()&&
    a<=at+5_000&&b>at&&b>a&&b-a<=maxAge;
};
const originValid=o=>{
  if(typeof o!=='string'||o.length>250)return false;
  try{const u=new URL(o);return u.protocol==='https:'&&u.origin===o&&
    u.pathname==='/'&&!u.username&&!u.password&&!u.search&&!u.hash;}
  catch{return false;}
};
function validateOriginalDevicePreflight(d,at){
  if(d?.schema!=='rosie.comms.ql796.original-ql362-device-preflight.v1'||
    d.state!=='ORIGINAL_REE_JACK_INDEPENDENT_SIGNERS_DEVICE_TEST_READY'||
    d.originalReeComputer!=='DESKTOP-AE894KC'||d.originalReeUser!=='Ree'||
    d.independentJackComputer!=='TEMPLAR'||d.independentJackUser!=='jfros'||
    d.originalIssuerAuthenticated!==true||d.independentWitnessAuthenticated!==true||
    d.sourceOwnerCustodyAuthenticated!==true||d.masterOwnerCustodyAuthenticated!==true||
    d.originalEnrollmentCount!==1||d.originalSignedTestReceiptCount!==1||
    d.originalRevocationCount!==0||d.databaseRole!=='ql340c_private_receiver'||
    d.receiverListenerCount!==0||d.tailnetGatewayListenerCount!==0||
    d.connectedCount!==0||d.connectionState!==HELD||
    !Number.isFinite(d.observedAt)||Math.abs(at-d.observedAt)>30_000)
    return false;
  const fingerprints=['issuerSpkiSha256','witnessSpkiSha256','sourceOwnerSpkiSha256',
    'masterOwnerSpkiSha256','redactionAuditorSpkiSha256'];
  const ids=fingerprints.map(k=>d[k]);
  return ids.every(x=>SHA.test(x??''))&&new Set(ids).size===ids.length;
}
function validateContract(record,at){
  const p=record?.contract?.payload;
  if(record?.sourceId!==ID||!COMMIT.test(record.commitSha??'')||
    !SHA.test(record.tlsSpkiSha256??'')||
    record.manifest?.source_id!==ID||
    !exact(record.contract,['schema','payload','signature','keyId'])||
    !SIG.test(record.contract.signature??'')||
    !exact(p,contractKeys)||record.contract.schema!==CONTRACT||
    p.schema!==CONTRACT||p.sourceId!==ID||p.sourceAppId!==ID||
    p.repository!==REPO||p.tenantBoundary!=='owned_business_legacy'||
    p.sourceCommitSha!==record.commitSha||
    !SHA.test(p.manifestSha256??'')||!originValid(p.sourceOrigin)||
    p.environment!=='TEST'||p.method!=='GET'||p.path!==HEALTH||
    p.responseSchema!==SOURCE_HEALTH||p.receiptSchema!==RECEIPT||
    p.scope!=='HEALTH_METADATA_ONLY_NO_CUSTOMERS_OR_DEVICES'||
    p.redirects!=='DENY'||p.maxResponseBytes!==4096||
    p.persistentConnectionAllowed!==false||
    !validTime(p.issuedAt,p.expiresAt,at,86_400_000))return false;
  return true;
}
async function pin(op,role,commit,record,at){
  const trust=await op.resolveOriginalSourceSignerPin({sourceId:ID});
  if(trust?.role!==role||trust.sourceId!==ID||trust.repository!==REPO||
    trust.keyId!==record.contract.keyId||trust.revoked!==false||
    !SHA.test(trust.spkiSha256??'')||
    typeof trust.publicKeyPem!=='string'||trust.publicKeyPem.length>2000)
    return null;
  const key=createPublicKey(trust.publicKeyPem);
  if(key.asymmetricKeyType!=='ed25519'||
    createHash('sha256').update(key.export({type:'spki',format:'der'})).digest('hex')!==trust.spkiSha256)
    return null;
  if(!SIG.test(record.contract.signature??'')||
    !verify(null,Buffer.from(canon(record.contract.payload)),key,
      Buffer.from(record.contract.signature,'base64url')))
    return null;
  const digest=sha(record.contract.payload);
  const custody=await op.readIndependentSourceSignerCustody({sourceId:ID,
    sourceCommitSha:commit,spkiSha256:trust.spkiSha256,contractSha256:digest});
  if(custody?.state!=='INDEPENDENT_ORIGINAL_SOURCE_SIGNER_AUTHENTICATED'||
    custody.sourceId!==ID||custody.revoked!==false||
    custody.spkiSha256!==trust.spkiSha256||custody.contractSha256!==digest||
    custody.sourceCommitSha!==commit||
    !Number.isFinite(custody.observedAt)||Math.abs(at-custody.observedAt)>30_000)
    return null;
  return {trust,key,contractSha256:digest};
}
function exactOwnerClaim(q,operationId,requestSha,at){
  return q?.state==='ORIGINAL_QL362_DUAL_OWNER_SIGNED_GET_IMMUTABLE_READBACK'&&
    q.originalComputer==='DESKTOP-AE894KC'&&q.ownerOnlyAcl===true&&
    q.sourceOwnerSignatureVerified===true&&q.masterOwnerSignatureVerified===true&&
    q.durableUniqueClaimVerified===true&&q.sourceId===ID&&
    q.operationId===operationId&&q.requestSha256===requestSha&&
    q.receiverStopped===true&&q.connected===false&&
    q.connectionState===HELD&&
    Number.isFinite(q.observedAt)&&Math.abs(at-q.observedAt)<=30_000;
}
async function verifyIndependentQl362OwnerSignatures(op,approvals,original,requestSha,at){
  if(!exact(approvals,['sourceOwnerApproval','masterOwnerApproval']))return false;
  for(const [role,item,pinName] of [
    ['source_owner',approvals.sourceOwnerApproval,'sourceOwnerSpkiSha256'],
    ['master_owner',approvals.masterOwnerApproval,'masterOwnerSpkiSha256']]){
    const p=item?.payload;
    if(!exact(item,['schema','payload','signature'])||
      !exact(p,approvalKeys)||
      item.schema!=='rosevear.hub.ql362.exact-source-owner-approval.v1'||
      p.schema!==item.schema||p.role!==role||p.sourceId!==ID||
      p.requestSha256!==requestSha||
      p.audience!=='rosevear-comms-hub:source-only-health-get:TEST'||
      p.decision!=='APPROVE_EXACTLY_ONE_SOURCE_HEALTH_GET'||
      !validTime(p.issuedAt,p.expiresAt,at,90_000)||
      !SIG.test(item.signature??''))return false;
    const trust=await op.resolveOriginalPinnedOwnerAuthority({role,sourceId:ID});
    if(trust?.role!==role||trust.sourceId!==ID||
      trust.spkiSha256!==original[pinName]||trust.revoked!==false||
      typeof trust.publicKeyPem!=='string'||trust.publicKeyPem.length>2000)
      return false;
    const key=createPublicKey(trust.publicKeyPem);
    if(key.asymmetricKeyType!=='ed25519'||
      createHash('sha256').update(key.export({type:'spki',format:'der'})).digest('hex')!==trust.spkiSha256||
      !verify(null,Buffer.from(canon(p)),key,Buffer.from(item.signature,'base64url')))
      return false;
    const custody=await op.verifyIndependentOriginalOwnerCustody({
      role,sourceId:ID,requestSha256:requestSha,spkiSha256:trust.spkiSha256});
    if(custody?.role!==role||custody.sourceId!==ID||
      custody.requestSha256!==requestSha||custody.spkiSha256!==trust.spkiSha256||
      custody.authenticated!==true||custody.revoked!==false)return false;
  }
  return true;
}
function exactOriginalReceipt(e,record,operationId,requestSha,at){
  const env=e?.envelope,health=env?.health,receipt=env?.receipt;
  if(e?.state!=='ORIGINAL_QL363_PINNED_TLS_SIGNED_SOURCE_GET_READBACK'||
    e.sourceId!==ID||e.operationId!==operationId||
    e.requestSha256!==requestSha||e.originalComputer!=='DESKTOP-AE894KC'||
    e.receiverStopped!==true||e.transportAuthenticated!==true||
    e.redirected!==false||e.httpStatus!==200||
    e.tlsSpkiSha256!==record.tlsSpkiSha256||
    e.sourceOrigin!==record.contract.payload.sourceOrigin||
    !Number.isSafeInteger(e.byteLength)||e.byteLength<1||e.byteLength>4096||
    !exact(env,['schema','health','receipt'])||env.schema!==ENVELOPE||
    !exact(health,['schema','sourceId','operationId','health','connected',
      'customerDataAllowed','deviceActions'])||
    health.schema!==SOURCE_HEALTH||health.sourceId!==ID||
    health.operationId!==operationId||health.health!=='ok'||
    health.connected!==false||health.customerDataAllowed!==false||
    health.deviceActions!==false||
    !exact(receipt,['schema','payload','signature','keyId'])||
    receipt.schema!==RECEIPT||
    !exact(receipt.payload,receiptKeys)||receipt.payload.schema!==RECEIPT||
    receipt.payload.sourceId!==ID||receipt.payload.operationId!==operationId||
    receipt.payload.requestSha256!==requestSha||
    receipt.payload.receiptSha256!==sha(health)||
    receipt.payload.sourceCommitSha!==record.commitSha||
    receipt.payload.sourceOrigin!==record.contract.payload.sourceOrigin||
    receipt.payload.environment!=='TEST'||receipt.payload.method!=='GET'||
    receipt.payload.path!==HEALTH||
    receipt.payload.scope!=='HEALTH_METADATA_ONLY_NO_CUSTOMERS_OR_DEVICES'||
    !validTime(receipt.payload.issuedAt,receipt.payload.expiresAt,at,90_000))
    return false;
  return true;
}
function validPeerRows(snapshot){
  if(snapshot?.state!=='ORIGINAL_QL363_SIX_PEERS_STILL_HELD_POST_GET'||
    snapshot.databaseRole!=='ql340c_private_receiver'||
    snapshot.connectedCount!==0||!Array.isArray(snapshot.rows)||
    snapshot.rows.length!==6)return false;
  const seen=new Set();
  for(const row of snapshot.rows){
    if(!exact(row,peerKeys)||!Object.hasOwn(peers,row.peer_id)||seen.has(row.peer_id))
      return false;
    const [kind,repo]=peers[row.peer_id];
    if(row.peer_kind!==kind||row.source_repo!==repo||
      row.connection_state!=='HOLD'||row.source_test_authorized!==false||
      row.customer_data_allowed!==false)return false;
    seen.add(row.peer_id);
  }
  return seen.size===6;
}
function retentionIsValid(r,operationId,requestSha,receiptSha,at){
  const p=r?.payload;
  if(!exact(r,['payload','signature','keyId'])||
    !exact(p,retentionKeys)||!SIG.test(r.signature??'')||
    p.schema!=='rosie.comms.ql796.original-signed-receipt-retention.v1'||
    p.sourceId!==ID||p.operationId!==operationId||
    p.requestSha256!==requestSha||p.receiptSha256!==receiptSha||
    p.originalComputer!=='DESKTOP-AE894KC'||p.ownerOnlyAcl!==true||
    p.durableUniqueClaim!==true||p.sourceSignerAuthenticated!==true||
    p.immutableWitnessReadback!==true||p.customerBytes!==0||
    p.deviceActions!==0||p.sourceRepositoryWrites!==0||p.connectedCount!==0||
    p.connectionState!==HELD)return false;
  const retained=Date.parse(p.retainedAt),until=Date.parse(p.retainUntil);
  return Number.isFinite(retained)&&Number.isFinite(until)&&
    p.retainedAt===new Date(retained).toISOString()&&
    p.retainUntil===new Date(until).toISOString()&&
    retained<=at+5_000&&retained>=at-60_000&&until>at+86_400_000;
}
async function verifyRetentionSigner(op,r,sourcePin,at){
  const pin=await op.resolveOriginalRetentionWitnessPin({sourceId:ID});
  if(pin?.role!=='retention_witness'||pin.sourceId!==ID||
    pin.keyId!==r.keyId||pin.revoked!==false||
    !SHA.test(pin.spkiSha256??'')||pin.spkiSha256===sourcePin||
    typeof pin.publicKeyPem!=='string'||pin.publicKeyPem.length>2000)return false;
  const key=createPublicKey(pin.publicKeyPem);
  if(key.asymmetricKeyType!=='ed25519'||
    createHash('sha256').update(key.export({type:'spki',format:'der'})).digest('hex')!==pin.spkiSha256||
    !verify(null,Buffer.from(canon(r.payload)),key,Buffer.from(r.signature,'base64url')))
    return false;
  const witness=await op.readIndependentRetentionWitnessCustody({sourceId:ID,
    spkiSha256:pin.spkiSha256,retentionSha256:sha(r.payload)});
  return witness?.state==='ORIGINAL_INDEPENDENT_RETENTION_WITNESS_AUTHENTICATED'&&
    witness.spkiSha256===pin.spkiSha256&&witness.retentionSha256===sha(r.payload)&&
    witness.revoked===false&&Number.isFinite(witness.observedAt)&&
    Math.abs(at-witness.observedAt)<=30_000;
}
function validOwnerCandidate(c,operationId,requestSha,receiptSha){
  return exact(c,['schema','state','sourceId','operationId','requestSha256',
    'receiptSha256','ownerApprovedPersistentConnection','sourceTestAuthorized',
    'customerDataAllowed','peerCount','connectedCount','connectionState',
    'reviewScope'])&&
    c.schema==='rosie.comms.ql796.protected-owner-candidate.v1'&&
    c.state==='ORIGINAL_TEST_EVIDENCE_CANDIDATE_AWAITING_NEW_OWNER_APPROVAL'&&
    c.sourceId===ID&&c.operationId===operationId&&
    c.requestSha256===requestSha&&c.receiptSha256===receiptSha&&
    c.ownerApprovedPersistentConnection===false&&
    c.sourceTestAuthorized===false&&c.customerDataAllowed===false&&
    c.peerCount===6&&c.connectedCount===0&&c.connectionState===HELD&&
    c.reviewScope==='TEST_EVIDENCE_ONLY_NOT_SOURCE_AUTHORIZATION';
}

/** A protected adapter must do *independent* original DB/signature readbacks.
 * No trust is inferred from a browser JSON upload or a synthetic fixture. */
export function createQl796OriginalDeviceReceiptCandidate({originalOperator,now=()=>Date.now()}={}){
  const callbacks=['readOriginalQl362DevicePreflight','resolveOriginalSourceSignerPin',
    'readIndependentSourceSignerCustody','verifyOriginalSourceManifest',
    'readOriginalQl362DualOwnerClaim','readOriginalQl362SignedOwnerApprovals',
    'resolveOriginalPinnedOwnerAuthority','verifyIndependentOriginalOwnerCustody',
    'readOriginalQl363SignedGetEvidence',
    'readOriginalSignedReceiptRetention','resolveOriginalRetentionWitnessPin',
    'readIndependentRetentionWitnessCustody','readIndependentSixPeerSnapshot',
    'readProtectedOwnerConnectionCandidate'];
  if(typeof now!=='function'||callbacks.some(k=>typeof originalOperator?.[k]!=='function'))
    throw Error('HOLD_ORIGINAL_QL363_PRIVATE_OPERATOR_AND_PINS_REQUIRED');
  let attempted=false;
  return Object.freeze({
    inspect(){return hold('HOLD_ORIGINAL_REE_JACK_DEVICE_RECEIPT_AND_REVIEW',{attempted});},
    async reviewOne({record,operationId,requestSha256}={}){
      if(attempted)return hold('DENY_DUPLICATE_SOURCE_RECEIPT_REVIEW');
      attempted=true;
      const at=now();
      if(!Number.isSafeInteger(at)||!UUID.test(operationId??'')||
        !SHA.test(requestSha256??'')||!validateContract(record,at))
        return hold('DENY_NONEXACT_OR_EXPIRED_ROSIE_QL363_SOURCE_CONTRACT');
      try{
        const original=await originalOperator.readOriginalQl362DevicePreflight({sourceId:ID});
        if(!validateOriginalDevicePreflight(original,at))
          return hold('HOLD_GENUINE_ORIGINAL_REE_JACK_DEVICE_AND_RECEIVER_PREFLIGHT');
        const manifest=await originalOperator.verifyOriginalSourceManifest({
          sourceId:ID,sourceCommitSha:record.commitSha,
          manifestSha256:record.contract.payload.manifestSha256,
          manifest:record.manifest,manifestTrustPin:record.manifestTrustPin});
        if(manifest?.state!=='SIGNED_MANIFEST_VERIFIED_SOURCE_GRANT_HELD'||
          manifest.sourceId!==ID||manifest.sourceCommitSha!==record.commitSha||
          manifest.manifestSha256!==record.contract.payload.manifestSha256||
          manifest.originalIndependentPinVerified!==true||
          manifest.sourceTestAuthorized!==false)
          return hold('HOLD_ORIGINAL_SIGNED_SOURCE_MANIFEST_NOT_VERIFIED');
        const signed=await pin(originalOperator,'source_signer',record.commitSha,record,at);
        const reserved=[original.issuerSpkiSha256,original.witnessSpkiSha256,
          original.sourceOwnerSpkiSha256,original.masterOwnerSpkiSha256,
          original.redactionAuditorSpkiSha256];
        if(!signed||reserved.includes(signed.trust.spkiSha256))
          return hold('HOLD_DISTINCT_ORIGINAL_SOURCE_SIGNER_CUSTODY_AND_CONTRACT');
        const claim=await originalOperator.readOriginalQl362DualOwnerClaim({
          sourceId:ID,operationId,requestSha256});
        if(!exactOwnerClaim(claim,operationId,requestSha256,at))
          return hold('HOLD_ORIGINAL_QL362_DUAL_OWNER_SIGNED_SINGLE_USE_CLAIM');
        const approvals=await originalOperator.readOriginalQl362SignedOwnerApprovals({
          sourceId:ID,operationId,requestSha256});
        if(!await verifyIndependentQl362OwnerSignatures(
          originalOperator,approvals,original,requestSha256,at))
          return hold('HOLD_INDEPENDENT_ORIGINAL_QL362_REE_JACK_ED25519_SIGNATURES');
        const receipt=await originalOperator.readOriginalQl363SignedGetEvidence({
          sourceId:ID,operationId,requestSha256});
        if(!exactOriginalReceipt(receipt,record,operationId,requestSha256,at)||
          receipt.envelope.receipt.keyId!==signed.trust.keyId||
          !SIG.test(receipt.envelope.receipt.signature??'')||
          !verify(null,Buffer.from(canon(receipt.envelope.receipt.payload)),
            signed.key,Buffer.from(receipt.envelope.receipt.signature,'base64url')))
          return hold('HOLD_ORIGINAL_QL363_TLS_AND_SIGNED_HEALTH_RECEIPT');
        const receiptSha256=sha(receipt.envelope.health);
        const cust=await originalOperator.readIndependentSourceSignerCustody({
          sourceId:ID,sourceCommitSha:record.commitSha,
          spkiSha256:signed.trust.spkiSha256,contractSha256:signed.contractSha256,
          receiptSha256,requestSha256});
        if(cust?.state!=='INDEPENDENT_ORIGINAL_SOURCE_SIGNER_AUTHENTICATED'||
          cust.sourceId!==ID||cust.spkiSha256!==signed.trust.spkiSha256||
          cust.receiptSha256!==receiptSha256||cust.requestSha256!==requestSha256||
          cust.revoked!==false)
          return hold('HOLD_INDEPENDENT_SOURCE_RECEIPT_SIGNER_CUSTODY');
        const retention=await originalOperator.readOriginalSignedReceiptRetention({
          sourceId:ID,operationId,requestSha256,receiptSha256});
        if(!retentionIsValid(retention,operationId,requestSha256,receiptSha256,now())||
          !await verifyRetentionSigner(originalOperator,retention,signed.trust.spkiSha256,now()))
          return hold('HOLD_IMMUTABLE_ORIGINAL_RECEIPT_RETENTION_AND_CUSTODIAN');
        const snapshot=await originalOperator.readIndependentSixPeerSnapshot({
          sourceId:ID,operationId,requestSha256,receiptSha256});
        if(!validPeerRows(snapshot))
          return hold('HOLD_SIX_APP_ISOLATION_AFTER_ORIGINAL_SIGNED_GET');
        const candidate=await originalOperator.readProtectedOwnerConnectionCandidate({
          sourceId:ID,operationId,requestSha256,receiptSha256});
        if(!validOwnerCandidate(candidate,operationId,requestSha256,receiptSha256))
          return hold('DENY_UNAPPROVED_PERSISTENT_CONNECTION_OR_TENANT_GRANT');
        return {...hold('ORIGINAL_QL363_ROSIE_GET_CANDIDATE_EVIDENCE_REVIEWED_HELD'),
          accepted:true,originalDevicePreflightVerified:true,
          sourceContractSignatureVerified:true,originalQl362OwnerClaimVerified:true,
          originalQl363ReceiptVerified:true,originalReceiptRetained:true,
          sixPeersHeld:true,sourceId:ID,operationId,requestSha256,receiptSha256,
          signedContractSha256:signed.contractSha256,
          signedRetentionSha256:sha(retention.payload),
          nextAction:'Keep all peers DISCONNECTED/HOLD until separate independent persistent connection owner approval.'};
      }catch{return hold('HOLD_ORIGINAL_PRIVATE_DEVICE_SOURCE_OR_RETENTION_READBACK_UNAVAILABLE');}
    }
  });
}
export function ql796Cli(args=process.argv.slice(2)){
  if(args.length===1&&args[0]==='--status')
    return hold('HOLD_ORIGINAL_DEVICE_APPROVAL_AND_REAL_QL363_RECEIPT_UNAVAILABLE');
  throw Error('DENY_PUBLIC_SOURCE_GET_SIGNING_OR_CONNECTION_GRANT');
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  try{process.stdout.write(JSON.stringify(ql796Cli())+'\n');}
  catch{process.stderr.write('DENY_ROSIE_QL796_UNSUPERVISED_SOURCE_ACTION\n');process.exitCode=1;}
}
