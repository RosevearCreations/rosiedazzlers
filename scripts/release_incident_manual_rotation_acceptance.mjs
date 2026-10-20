/** Build 585 — signed two-version attestation chain & manual rotation handoff.
 * Pure read-only checks; no signatures are generated, no storage or release mutation.
 * Owner approval must be signed by a DIFFERENT independently pinned Ed25519 key.
 */
import {createHash,createPublicKey,verify} from "node:crypto";
import {validateOwnerEvidence} from "./release_incident_audit_retrieval_review.mjs";
import {verifyAnchorProvenance} from "./release_incident_anchor_provenance.mjs";
const HASH=/^[a-f0-9]{64}$/;
const REF=/^[A-Za-z0-9][A-Za-z0-9._:/#-]{2,180}$/;
const ownerKeys=["action","repository","issueNumber","priorKey","priorVersionId","priorDigest",
  "successorKey","successorVersionId","successorDigest","owner","approvalRef","issuedAt"];
function fullTime(value){
  const n=Date.parse(value||"");
  if(typeof value!=="string"||!Number.isFinite(n)||new Date(n).toISOString()!==value)
    throw Error("Canonical owner approval timestamp required: HOLD");
  return n;
}
export function manualRotationClaims({prior,successor,approvalRef,issuedAt}){
  const p=validateOwnerEvidence(prior),s=validateOwnerEvidence(successor);
  if(!REF.test(approvalRef||""))throw Error("Explicit manual owner approval evidence ref required: HOLD");
  fullTime(issuedAt);
  if(s.repository!==p.repository||s.issueNumber!==p.issueNumber||
    s.previousHash!==p.expectedDigest||s.expectedDigest===p.expectedDigest||
    s.key===p.key||s.versionId===p.versionId)
    throw Error("Chain identity or immutable successor version not distinct: HOLD");
  return {action:"ACCEPT_ROTATION",repository:p.repository,issueNumber:p.issueNumber,
    priorKey:p.key,priorVersionId:p.versionId,priorDigest:p.expectedDigest,
    successorKey:s.key,successorVersionId:s.versionId,successorDigest:s.expectedDigest,
    owner:"RosevearCreations",approvalRef,issuedAt};
}
function pinnedOwnerSignature({claims,attestation,publicKeyPem,expectedFingerprint}){
  if(!HASH.test(expectedFingerprint||"")||!attestation||
    attestation.algorithm!=="Ed25519"||!attestation.claims||
    typeof attestation.signature!=="string"||Object.keys(attestation.claims).sort().join(",")!==ownerKeys.slice().sort().join(","))
    throw Error("Pinned signed owner rotation receipt required: HOLD");
  if(ownerKeys.some(k=>attestation.claims[k]!==claims[k]))
    throw Error("Signed rotation receipt does not match exact successor chain: HOLD");
  const key=createPublicKey(publicKeyPem);
  if(key.asymmetricKeyType!=="ed25519")throw Error("Ed25519 owner key required: HOLD");
  const fp=createHash("sha256").update(key.export({format:"der",type:"spki"})).digest("hex");
  if(fp!==expectedFingerprint)throw Error("Independently pinned owner fingerprint mismatch: HOLD");
  if(!/^[A-Za-z0-9+/]+={0,2}$/.test(attestation.signature))
    throw Error("Invalid owner signature encoding: HOLD");
  const signature=Buffer.from(attestation.signature,"base64");
  if(signature.length!==64||!verify(null,Buffer.from(JSON.stringify(claims)),key,signature))
    throw Error("Owner acceptance signature invalid: HOLD");
  return {fingerprint:fp,reference:claims.approvalRef};
}
export function reconcileManualRotation({
  prior,successor,priorAttestation,successorAttestation,
  priorPublicKeyPem,successorPublicKeyPem,priorFingerprint,successorFingerprint,
  priorReview,successorReview,
  ownerApproval,ownerPublicKeyPem,ownerFingerprint,
  now=new Date()
}){
  try {
    const p=validateOwnerEvidence(prior),s=validateOwnerEvidence(successor);
    const currentTime=new Date(now).getTime();
    if(!Number.isFinite(currentTime))throw Error("Review time unavailable");
    const before=verifyAnchorProvenance({manifest:p,attestation:priorAttestation,
      publicKeyPem:priorPublicKeyPem,trustedFingerprint:priorFingerprint,now});
    const after=verifyAnchorProvenance({manifest:s,attestation:successorAttestation,
      publicKeyPem:successorPublicKeyPem,trustedFingerprint:successorFingerprint,now});
    if(s.previousHash!==p.expectedDigest||s.repository!==p.repository||
       s.issueNumber!==p.issueNumber||s.key===p.key||s.versionId===p.versionId||
       s.expectedDigest===p.expectedDigest)
      throw Error("Non-contiguous or reused immutable anchor: HOLD");
    const previousSigned=fullTime(before.signedAt);
    const successorSigned=fullTime(after.signedAt);
    if(successorSigned<=previousSigned)
      throw Error("Successor audit signature is not later than predecessor: HOLD");
    for(const [review,manifest] of [[priorReview,p],[successorReview,s]]){
      if(review?.status!=="VERIFIED"||review.digest!==manifest.expectedDigest||
         review.versionId!==manifest.versionId||
         review.expiry?.status!=="ACTIVE")
        throw Error("Exact-version WORM retention and audit review required for both links: HOLD");
    }
    if(!ownerApproval)
      return {status:"OWNER_SIGNED_APPROVAL_REQUIRED",reason:"Independently signed owner receipt missing; no rotation accepted"};
    const receipt=ownerApproval.claims;
    const claims=manualRotationClaims({prior:p,successor:s,
      approvalRef:receipt?.approvalRef,issuedAt:receipt?.issuedAt});
    const approvedAt=fullTime(claims.issuedAt);
    if(approvedAt<successorSigned||approvedAt>currentTime+300000)
      throw Error("Owner approval preceded successor attestation or is in future: HOLD");
    const signProof=pinnedOwnerSignature({claims,attestation:ownerApproval,
      publicKeyPem:ownerPublicKeyPem,expectedFingerprint:ownerFingerprint});
    if(signProof.fingerprint===before.fingerprint||signProof.fingerprint===after.fingerprint)
      throw Error("Independent owner key must differ from archive attestation keys: HOLD");
    return {status:"MANUAL_ACCEPTANCE_READY",
      reason:"Signed owner consent and both immutable version attestations reconcile; human external handoff still required",
      priorDigest:p.expectedDigest,successorDigest:s.expectedDigest,
      approvalRef:signProof.reference,ownerKeyFingerprint:signProof.fingerprint,
      successorVersionId:s.versionId,externalWritePerformed:false};
  }catch(e){
    return {status:"HOLD",reason:String(e?.message||"Missing independent owner evidence").slice(0,240),
      externalWritePerformed:false};
  }
}
