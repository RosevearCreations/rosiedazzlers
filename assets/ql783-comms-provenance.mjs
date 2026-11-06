/** Build 783: locally reconcile REDACTED QL346/347/353 original reports.
 * A document's self-reported signature/grant status is NEVER independent proof.
 * No remote access, enrollment, private secret or database access occurs here. */
const SHA=/^[a-f0-9]{64}$/;
const CUSTODY=['PENDING_INDEPENDENT_VERIFICATION','HOLD','REJECT'];
const DECISIONS=['HOLD','REJECT','REVIEW_ACKNOWLEDGED_NO_ENROLLMENT'];
const safeKeys=new Set(['schema','state','issuerSignatureCryptographicallyValid',
  'devicePinMatches','originalIssuerIndependentlyAuthenticated',
  'originalIssuerOutOfBandCustodyApproved','sourceOwnerTestSignatureValid',
  'masterOwnerTestSignatureValid','readyForDatabaseEnrollment',
  'independentHumanReviewRequired','originalReceiverStopped','receiverActivated',
  'databaseEnrollmentCreated','connected','networkRequests',
  'customerCommunications','deviceActions','sourceReviewValid','masterReviewValid',
  'signedEnvelopeSha256','devicePublicSpkiSha256','ownerRequestPayloadSha256',
  'nextAction','issuerCustodyVerified','ownerEnrollmentAuthorized',
  'receipt','receiptSha256','authenticatedPrivateOperator',
  'verifiedOriginalEnrollment','verifiedSignedReceipt','sourceTestAuthorized',
  'connectedCount','connectionState','customerCommunications','deviceActions',
  'sourceRepositoryWrites','databaseMutations','automaticRetries',
  'originalEnrollmentCount','originalRevocationCount','originalReceiptCount',
  'heldPeerCount','originalOwnerPayloadSha256','receivedAt',
  'originalIssuerIndependentCustodyProofRequired','checkedAt']);
const receiptKeys=['schema','ql346EvidenceSha256','issuerCustodyDecision',
  'issuerEvidenceSha256','ownerDecisionDigests'];
const own=(v,keys)=>v&&typeof v==='object'&&!Array.isArray(v)&&
  Object.keys(v).length===keys.length&&Object.keys(v).every(k=>keys.includes(k));
const canonical=v=>Array.isArray(v)?'['+v.map(canonical).join(',')+']':
  v&&typeof v==='object'?'{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+canonical(v[k])).join(',')+'}':JSON.stringify(v);
const hex=bytes=>Array.from(new Uint8Array(bytes),b=>b.toString(16).padStart(2,'0')).join('');
const hold=(state,more={})=>({ok:false,state,
  reportFormatAndDigestLinksVerified:false,
  originalIssuerIndependentlyAuthenticated:false,
  originalOwnerTestEnrollmentAuthorized:false,
  originalDeviceReceiptIndependentlyVerified:false,
  brokerReceiptsIndependentlyVerified:false,nonproductionSourceTestAuthorized:false,
  connected:false,connection:'DISCONNECTED / HOLD',networkRequests:0,...more});
const safePacket=v=>v&&typeof v==='object'&&!Array.isArray(v)&&
  Object.keys(v).every(k=>safeKeys.has(k));
const digest=async (v,subtle)=>hex(await subtle.digest('SHA-256',new TextEncoder().encode(canonical(v))));

export async function inspectCommsProvenance783({ql346,ql347,ql353,ownerReview,
  now=Date.now(),subtle=globalThis.crypto?.subtle}={}){
  if(!Number.isFinite(now)||!subtle)return hold('HOLD_LOCAL_DIGEST_VERIFIER_UNAVAILABLE');
  const expires=Date.parse(ownerReview?.challengeExpiresAt??'');
  if(ownerReview?.ok!==true||ownerReview.signatureMechanicsVerified!==true||
    ownerReview.enrollmentAuthorized!==false||
    !Number.isFinite(expires)||now>=expires)
    return hold('HOLD_CURRENT_SEPARATE_OWNER_REVIEW_REQUIRED_OR_EXPIRED');
  if(!safePacket(ql346)||ql346.schema!=='rosevear.hub.ql346.offline-test-readiness.v1'||
    ql346.state!=='CRYPTOGRAPHIC_TEST_PROOFS_VALID_INDEPENDENT_ISSUER_CUSTODY_AND_FIELD_WITNESS_HOLD'||
    ql346.issuerSignatureCryptographicallyValid!==true||
    ql346.devicePinMatches!==true||
    ql346.sourceOwnerTestSignatureValid!==true||
    ql346.masterOwnerTestSignatureValid!==true||
    ql346.originalIssuerIndependentlyAuthenticated!==false||
    ql346.originalIssuerOutOfBandCustodyApproved!==false||
    ql346.readyForDatabaseEnrollment!==false||
    ql346.databaseEnrollmentCreated!==false||ql346.receiverActivated!==false||
    ql346.connected!==false||ql346.networkRequests!==0||
    ql346.customerCommunications!==false||ql346.deviceActions!==false||
    !SHA.test(ql346.signedEnvelopeSha256??'')||
    !SHA.test(ql346.ownerRequestPayloadSha256??''))
    return hold('HOLD_OR_ELEVATED_QL346_ISSUER_REPORT');
  if(!safePacket(ql347)||ql347.schema!=='rosevear.hub.ql347.custody-handoff.v1'||
    !['RECONCILED_OFFLINE_HANDOFF_INDEPENDENT_AUTHORITY_HOLD',
      'REJECTED_NO_ENROLLMENT'].includes(ql347.state)||
    ql347.issuerCustodyVerified!==false||
    ql347.ownerEnrollmentAuthorized!==false||
    ql347.receiverActivated!==false||
    ql347.databaseEnrollmentCreated!==false||ql347.connected!==false||
    ql347.networkRequests!==0||ql347.customerCommunications!==false||
    ql347.deviceActions!==false||!own(ql347.receipt,receiptKeys)||
    ql347.receipt.schema!=='rosevear.hub.ql347.custody-handoff.v1'||
    !SHA.test(ql347.receipt.ql346EvidenceSha256)||
    !SHA.test(ql347.receipt.issuerEvidenceSha256)||
    !CUSTODY.includes(ql347.receipt.issuerCustodyDecision)||
    !SHA.test(ql347.receiptSha256??'')||
    !Array.isArray(ql347.receipt.ownerDecisionDigests)||
    ql347.receipt.ownerDecisionDigests.length!==2||
    ql347.receipt.ownerDecisionDigests.some((v,i)=>
      !own(v,['role','digest','decision'])||v.role!==['source','master'][i]||
      !SHA.test(v.digest)||!DECISIONS.includes(v.decision)))
    return hold('HOLD_OR_ELEVATED_QL347_CUSTODY_REPORT');
  try{
    if(ql347.receipt.ql346EvidenceSha256!==await digest({
      signedEnvelopeSha256:ql346.signedEnvelopeSha256,
      ownerRequestPayloadSha256:ql346.ownerRequestPayloadSha256},subtle)||
      ql347.receiptSha256!==await digest(ql347.receipt,subtle))
      return hold('DENY_QL346_TO_QL347_EVIDENCE_HASH_CONFLICT');
  }catch{return hold('DENY_UNREADABLE_CUSTODY_HASH');}
  if(!safePacket(ql353)||ql353.schema!=='rosevear.hub.ql353.owner-session-receipt.v1'||
    typeof ql353.state!=='string'||
    !/^(HOLD_|DENY_|ONE_ORIGINAL_SIGNED_TEST_RECEIPT_INDEPENDENTLY_VERIFIED_STILL_HELD)/.test(ql353.state)||
    ql353.connectedCount!==0||ql353.connectionState!=='DISCONNECTED / HOLD'||
    ql353.sourceTestAuthorized!==false||ql353.customerCommunications!==0||
    ql353.deviceActions!==0||ql353.sourceRepositoryWrites!==0||
    ql353.databaseMutations!==0||ql353.automaticRetries!==0||
    ![0,1].includes(ql353.originalEnrollmentCount)||
    ![0,1].includes(ql353.originalReceiptCount)||
    ![0,1].includes(ql353.originalRevocationCount)||
    ql353.heldPeerCount!==6)
    return hold('DENY_UNSCOPED_OR_ELEVATED_QL353_RECEIPT_REPORT');
  if(ql353.originalRevocationCount!==0)return hold('HOLD_ORIGINAL_DEVICE_REVOKED');
  const recorded=ql353.originalEnrollmentCount===1&&ql353.originalReceiptCount===1&&
    ql353.state==='ONE_ORIGINAL_SIGNED_TEST_RECEIPT_INDEPENDENTLY_VERIFIED_STILL_HELD'&&
    ql353.verifiedSignedReceipt===true&&ql353.verifiedOriginalEnrollment===true&&
    ql353.authenticatedPrivateOperator===true;
  if(!recorded&&(ql353.verifiedSignedReceipt===true||ql353.verifiedOriginalEnrollment===true))
    return hold('DENY_UNSUPPORTED_ORIGINAL_RECEIPT_VERIFICATION_CLAIM');
  const rejected=ql347.state==='REJECTED_NO_ENROLLMENT'||
    ql347.receipt.issuerCustodyDecision==='REJECT'||
    ql347.receipt.ownerDecisionDigests.some(v=>v.decision==='REJECT'||v.decision==='HOLD');
  return {ok:true,
    state:rejected?'ORIGINAL_CUSTODY_HOLD_OR_REJECT_NO_TEST':
      recorded?'ONE_DEVICE_RECEIPT_CLAIM_FORMAT_LINKED_SOURCE_TEST_STILL_HELD':
      'QL346_QL347_LINKED_QL353_NO_DEVICE_RECEIPT_SOURCE_TEST_HELD',
    reportFormatAndDigestLinksVerified:true,
    linkedSignedEnvelopeSha256:ql346.signedEnvelopeSha256,
    linkedOwnerRequestPayloadSha256:ql346.ownerRequestPayloadSha256,
    custodyDecision:ql347.receipt.issuerCustodyDecision,
    sourceDecision:ql347.receipt.ownerDecisionDigests[0].decision,
    masterDecision:ql347.receipt.ownerDecisionDigests[1].decision,
    currentOwnerReviewExpiresAt:ownerReview.challengeExpiresAt,
    claimedDeviceReceiptCount:ql353.originalReceiptCount,
    originalIssuerIndependentlyAuthenticated:false,
    originalOwnerTestEnrollmentAuthorized:false,
    originalDeviceReceiptIndependentlyVerified:false,
    brokerReceiptsIndependentlyVerified:false,nonproductionSourceTestAuthorized:false,
    connected:false,connection:'DISCONNECTED / HOLD',networkRequests:0};
}
