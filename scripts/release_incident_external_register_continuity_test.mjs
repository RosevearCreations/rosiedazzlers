import assert from "node:assert/strict";
import {generateKeyPairSync,createHash,sign} from "node:crypto";
import {anchorClaims} from "./release_incident_anchor_provenance.mjs";
import {manualRotationClaims} from "./release_incident_manual_rotation_acceptance.mjs";
import {HANDOFF_PREFIX,prepareHandoff,crossAnchorHistory}
  from "./release_incident_rotation_handoff_receipts.mjs";
import {canonicalBytes,digestRegister}
  from "./release_incident_external_rotation_register.mjs";
import {reviewExternalRegisterContinuity,ownerExceptionClaims,
  verifyOwnerExceptionHistory,registerOperatorReview}
  from "./release_incident_external_register_continuity.mjs";

const makeKey=()=>generateKeyPairSync("ed25519");
const archive=makeKey(),human=makeKey(),registerKey=makeKey(),impostor=makeKey();
const pem=pair=>pair.publicKey.export({format:"pem",type:"spki"});
const fingerprint=pair=>createHash("sha256").update(
  pair.publicKey.export({format:"der",type:"spki"})).digest("hex");
const signClaims=(claims,pair)=>({algorithm:"Ed25519",claims,
  signature:sign(null,canonicalBytes(claims),pair.privateKey).toString("base64")});
const signedAnchor=(manifest,time)=>({
  algorithm:"Ed25519",claims:anchorClaims(manifest,{signedAt:time,signer:"archive-auditor"}),
  signature:""
});
function actualAnchor(manifest,time){
  const claims=anchorClaims(manifest,{signedAt:time,signer:"archive-auditor"});
  return {algorithm:"Ed25519",claims,
    signature:sign(null,Buffer.from(JSON.stringify(claims)),archive.privateKey).toString("base64")};
}
const prior={repository:"RosevearCreations/rosiedazzlers",issueNumber:77,
  key:"rosie/audit/77/first.json",versionId:"version-1",
  expectedDigest:"a".repeat(64),previousHash:null,
  ownerApprovalRef:"owner:77",independentEvidenceRef:"offsite:77"};
const successor={...prior,key:"rosie/audit/77/second.json",versionId:"version-2",
  expectedDigest:"b".repeat(64),previousHash:prior.expectedDigest,
  ownerApprovalRef:"owner:78",independentEvidenceRef:"offsite:78"};
const humanClaims=manualRotationClaims({prior,successor,approvalRef:"owner:rotation-588",
  issuedAt:"2026-10-19T12:00:00.000Z"});
const evidence={prior,successor,
  priorAttestation:actualAnchor(prior,"2026-10-19T10:00:00.000Z"),
  successorAttestation:actualAnchor(successor,"2026-10-19T11:00:00.000Z"),
  priorPublicKeyPem:pem(archive),successorPublicKeyPem:pem(archive),
  priorFingerprint:fingerprint(archive),successorFingerprint:fingerprint(archive),
  ownerApproval:{algorithm:"Ed25519",claims:humanClaims,
    signature:sign(null,Buffer.from(JSON.stringify(humanClaims)),human.privateKey).toString("base64")},
  ownerPublicKeyPem:pem(human),ownerFingerprint:fingerprint(human),
  priorReview:{status:"VERIFIED",digest:prior.expectedDigest,versionId:prior.versionId,expiry:{status:"ACTIVE"}},
  successorReview:{status:"VERIFIED",digest:successor.expectedDigest,versionId:successor.versionId,expiry:{status:"ACTIVE"}},
  now:new Date("2026-10-20T07:00:00.000Z")};
const first=prepareHandoff({evidence,issuedAt:"2026-10-20T05:00:00.000Z"});
const comments=[{id:101,user:{login:"RosevearCreations"},
  created_at:"2026-10-20T05:00:00Z",updated_at:"2026-10-20T05:00:00Z",
  body:HANDOFF_PREFIX+JSON.stringify(first)}];
const history=crossAnchorHistory({comments,expectedIssueNumber:77});
const columns=["commentId","receiptDigest","priorDigest","successorDigest","evidenceDigest",
  "approvalRef","priorVersionId","successorVersionId"];
const record1={schema:"rosie.external-rotation-register.v1",
  repository:"RosevearCreations/rosiedazzlers",issueNumber:77,sequence:1,
  previousRegisterDigest:null,headDigest:first.receiptDigest,receiptCount:1,
  entries:history.entries.map(e=>Object.fromEntries(columns.map(k=>[k,e[k]]))),
  issuedAt:"2026-10-20T05:10:00.000Z",registerRef:"offsite:register-1"};
const record2={...record1,sequence:2,previousRegisterDigest:digestRegister(record1),
  issuedAt:"2026-10-20T05:20:00.000Z",registerRef:"offsite:register-2"};
const signedRegister=r=>({algorithm:"Ed25519",register:r,
  signature:sign(null,canonicalBytes(r),registerKey.privateKey).toString("base64")});
const revision=r=>({signedRegister:signedRegister(r),publicKeyPem:pem(registerKey),
  trustedFingerprint:fingerprint(registerKey),
  externalPin:{sequence:r.sequence,registerDigest:digestRegister(r),
    headDigest:r.headDigest,externalReference:"independent:pin-"+r.sequence}});
const revisions=[revision(record1),revision(record2)];
const evidenceByReceiptDigest=new Map([[first.receiptDigest,evidence]]);
const trustedFingerprintsByReceiptDigest=new Map([[first.receiptDigest,
  {owner:fingerprint(human),prior:fingerprint(archive),successor:fingerprint(archive)}]]);
const now=new Date("2026-10-20T07:00:00.000Z");
const continuityArguments={revisions,comments,evidenceByReceiptDigest,
  trustedFingerprintsByReceiptDigest};
const continuity=reviewExternalRegisterContinuity({...continuityArguments,now});
assert.equal(continuity.status,"CONTINUITY_VERIFIED");
assert.equal(continuity.registerSequence,2);
assert.equal(continuity.verifiedReceipts,1);
assert.equal(continuity.revisions.length,2);
const brokenHistory={...record2,entries:record2.entries.map(e=>({...e,commentId:100}))};
assert.throws(()=>reviewExternalRegisterContinuity({...continuityArguments,
  revisions:[revisions[0],revision(brokenHistory)],now}),/rewritten/);
assert.throws(()=>reviewExternalRegisterContinuity({...continuityArguments,
  revisions:[revisions[1],revisions[0]],now}),/Genesis|rollback|chain/);
const duplicateTime={...record2,issuedAt:record1.issuedAt};
assert.throws(()=>reviewExternalRegisterContinuity({...continuityArguments,
  revisions:[revisions[0],revision(duplicateTime)],now}),/timestamp/);
assert.throws(()=>reviewExternalRegisterContinuity({...continuityArguments,
  evidenceByReceiptDigest:new Map(),now}),/missing/);
const makeDecision=(action,reference,issuedAt,previousDecisionDigest=null)=>{
  const claims=ownerExceptionClaims({continuity,action,incidentRef:"issue:77",
    approvalRef:reference,issuedAt,previousDecisionDigest});
  return signClaims(claims,human);
};
const one=makeDecision("OPEN_REVIEW","owner:exception-1","2026-10-20T06:00:00.000Z");
const oneDigest=createHash("sha256").update(canonicalBytes(one)).digest("hex");
const two=makeDecision("ACKNOWLEDGE_HOLD","owner:exception-2",
  "2026-10-20T06:30:00.000Z",oneDigest);
const decisions=[one,two];
const inputs={continuity,receipts:decisions,ownerPublicKeyPem:pem(human),
  pinnedOwnerFingerprint:fingerprint(human),
  pinnedRegisterFingerprint:fingerprint(registerKey),now};
const accepted=verifyOwnerExceptionHistory(inputs);
assert.equal(accepted.status,"OWNER_EXCEPTION_HISTORY_VERIFIED");
assert.equal(accepted.decisions.length,2);
assert.equal(accepted.executionAuthorized,false);
assert.equal(verifyOwnerExceptionHistory({...inputs,receipts:[]}).status,
  "NO_OWNER_EXCEPTION_DECISIONS");
assert.throws(()=>verifyOwnerExceptionHistory({...inputs,
  receipts:[two]}),/unlinked|changed|replayed/);
assert.throws(()=>verifyOwnerExceptionHistory({...inputs,
  receipts:[one,one]}),/unlinked|replayed/);
assert.throws(()=>verifyOwnerExceptionHistory({...inputs,
  receipts:[one,{...two,signature:sign(null,canonicalBytes(two.claims),impostor.privateKey).toString("base64")}]}
  ),/signature/);
assert.throws(()=>verifyOwnerExceptionHistory({...inputs,
  pinnedOwnerFingerprint:fingerprint(registerKey)}),/Separately pinned/);
assert.throws(()=>verifyOwnerExceptionHistory({...inputs,
  pinnedOwnerFingerprint:fingerprint(impostor)}),/owner pin/);
assert.throws(()=>ownerExceptionClaims({continuity,action:"OVERRIDE_HOLD",
  incidentRef:"issue:77",approvalRef:"owner:override",
  issuedAt:"2026-10-20T06:00:00.000Z"}),/HOLD/);
const review=registerOperatorReview({continuityArguments,ownerReceipts:decisions,
  ownerPublicKeyPem:pem(human),pinnedOwnerFingerprint:fingerprint(human),
  pinnedRegisterFingerprint:fingerprint(registerKey),now});
assert.equal(review.status,"READ_ONLY_OWNER_REVIEW_COMPLETE");
assert.equal(review.externalWritePerformed,false);
assert.equal(review.anyAutomaticExceptionClosure,false);
console.log("Build 588 register prefix continuity, independently signed operator exception history and HOLD safeguards PASS");
