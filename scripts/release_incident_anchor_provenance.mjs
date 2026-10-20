/** Build 584: independently pinned Ed25519 audit anchor, read-only owner rotation decision. */
import {createHash,createPublicKey,verify} from "node:crypto";
import {validateOwnerEvidence} from "./release_incident_audit_retrieval_review.mjs";
const SHA=/^[0-9a-f]{64}$/;
const REF=/^[A-Za-z0-9][A-Za-z0-9._:/#-]{2,180}$/;
const fields=["repository","issueNumber","key","versionId","expectedDigest","previousHash","ownerApprovalRef","independentEvidenceRef","signedAt","signer"];
export function anchorClaims(manifest,{signedAt,signer}){
  const m=validateOwnerEvidence(manifest);
  if(!REF.test(signer||"")||!Number.isFinite(Date.parse(signedAt||"")))
    throw Error("Named external signer and signature time required: HOLD");
  return {repository:m.repository,issueNumber:m.issueNumber,key:m.key,
    versionId:m.versionId,expectedDigest:m.expectedDigest,
    previousHash:m.previousHash,ownerApprovalRef:m.ownerApprovalRef,
    independentEvidenceRef:m.independentEvidenceRef,signedAt,signer};
}
export function verifyAnchorProvenance({manifest,attestation,publicKeyPem,trustedFingerprint,now=new Date()}){
  if(!SHA.test(trustedFingerprint||"")||!attestation||
     attestation.algorithm!=="Ed25519"||typeof attestation.signature!=="string"||
     !/^[A-Za-z0-9+/]+={0,2}$/.test(attestation.signature))
    throw Error("Pinned independent signing identity and signature required: HOLD");
  const key=createPublicKey(publicKeyPem);
  if(key.asymmetricKeyType!=="ed25519")throw Error("Ed25519 external trust root required: HOLD");
  const fingerprint=createHash("sha256").update(key.export({format:"der",type:"spki"})).digest("hex");
  if(fingerprint!==trustedFingerprint)throw Error("Independent signing key fingerprint mismatch: HOLD");
  const claims=attestation.claims;
  if(!claims||typeof claims!=="object"||Object.keys(claims).sort().join(",")!==fields.slice().sort().join(","))
    throw Error("Unrecognized or incomplete signed anchor claims: HOLD");
  const expected=anchorClaims(manifest,{signedAt:claims.signedAt,signer:claims.signer});
  if(fields.some(k=>claims[k]!==expected[k]))throw Error("Signed claims mismatch archived manifest: HOLD");
  const timestamp=Date.parse(claims.signedAt),time=new Date(now).getTime();
  if(!Number.isFinite(time)||timestamp>time+5*60*1000)
    throw Error("Audit attestation signed in the future: HOLD");
  const bytes=Buffer.from(attestation.signature,"base64");
  if(bytes.length!==64||!verify(null,Buffer.from(JSON.stringify(expected)),key,bytes))
    throw Error("Independent audit attestation signature invalid: HOLD");
  return {verified:true,signer:claims.signer,signedAt:claims.signedAt,
    fingerprint,independentEvidenceRef:claims.independentEvidenceRef};
}
export function rotationDecisionWorkbench({manifest,provenance,review,ownerDecision=null,successor=null}){
  const m=validateOwnerEvidence(manifest);
  if(provenance?.verified!==true||!SHA.test(provenance.fingerprint||""))
    return {status:"HOLD",reason:"Independent provenance proof unavailable"};
  if(!review||!["VERIFIED","REVIEW","HOLD"].includes(review.status))
    return {status:"HOLD",reason:"Exact-version owner audit review missing"};
  if(review.status==="HOLD"||review.expiry?.status==="EXPIRED")
    return {status:"HOLD",reason:"Archived evidence or retention expired; cannot rotate automatically"};
  if(ownerDecision===null)
    return {status:"OWNER_REVIEW_REQUIRED",reason:"No explicit owner decision",currentDigest:m.expectedDigest};
  if(ownerDecision.actor!=="RosevearCreations"||
     !REF.test(ownerDecision.reference||"")||
     !["DEFER","PROPOSE_ROTATION"].includes(ownerDecision.action))
    return {status:"HOLD",reason:"Invalid or unauthorized owner decision receipt"};
  if(ownerDecision.action==="DEFER")
    return {status:"DEFERRED",reason:"Owner chose not to rotate",receipt:ownerDecision.reference};
  if(!successor||successor.previousHash!==m.expectedDigest||
     !SHA.test(successor.expectedDigest||"")||
     successor.expectedDigest===m.expectedDigest||
     successor.repository!==m.repository||successor.issueNumber!==m.issueNumber)
    return {status:"HOLD",reason:"Successor SHA chain or issue identity invalid"};
  try{validateOwnerEvidence(successor)}catch{return {status:"HOLD",reason:"Successor manifest incomplete"}}
  return {status:"ROTATION_PROPOSED",reason:"Owner proposal only; independently sign, lock and verify successor before use",
    priorDigest:m.expectedDigest,successorDigest:successor.expectedDigest,
    ownerDecisionRef:ownerDecision.reference,requiresIndependentSignature:true,
    requiresNewVersionLock:true};
}
