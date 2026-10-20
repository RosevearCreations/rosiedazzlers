import assert from "node:assert/strict";
import {generateKeyPairSync,createHash,sign} from "node:crypto";
import {anchorClaims} from "./release_incident_anchor_provenance.mjs";
import {manualRotationClaims} from "./release_incident_manual_rotation_acceptance.mjs";
import {HANDOFF_PREFIX,prepareHandoff,crossAnchorHistory} from "./release_incident_rotation_handoff_receipts.mjs";
import {canonicalBytes,digestRegister} from "./release_incident_external_rotation_register.mjs";
import {reviewExternalRegisterContinuity,ownerExceptionClaims,verifyOwnerExceptionHistory}
 from "./release_incident_external_register_continuity.mjs";
import {exceptionRegisterDigest,verifyExceptionRegisterHistory,ownerEscalationLedger}
 from "./release_incident_external_exception_register.mjs";
const make=()=>generateKeyPairSync("ed25519");
const archive=make(),owner=make(),sourceSigner=make(),exceptionSigner=make(),impostor=make();
const pem=k=>k.publicKey.export({format:"pem",type:"spki"});
const fp=k=>createHash("sha256").update(k.publicKey.export({format:"der",type:"spki"})).digest("hex");
const signature=(claims,k,raw=false)=>({
 algorithm:"Ed25519",claims,signature:sign(null,
 raw?Buffer.from(JSON.stringify(claims)):canonicalBytes(claims),k.privateKey).toString("base64")
});
const first={repository:"RosevearCreations/rosiedazzlers",issueNumber:77,
 key:"rosie/audit/77/original.json",versionId:"s3-version-original",
 expectedDigest:"a".repeat(64),previousHash:null,
 ownerApprovalRef:"issue:77",independentEvidenceRef:"owner-offline:original"};
const successor={...first,key:"rosie/audit/77/updated.json",versionId:"s3-version-updated",
 expectedDigest:"b".repeat(64),previousHash:first.expectedDigest,
 ownerApprovalRef:"issue:78",independentEvidenceRef:"owner-offline:updated"};
const priorAtt=signature(anchorClaims(first,{signedAt:"2026-10-19T10:00:00.000Z",signer:"external-archive"}),archive,true);
const nextAtt=signature(anchorClaims(successor,{signedAt:"2026-10-19T11:00:00.000Z",signer:"external-archive"}),archive,true);
const ownerClaims=manualRotationClaims({prior:first,successor,approvalRef:"owner:rotation-589",
 issuedAt:"2026-10-19T12:00:00.000Z"});
const evidence={prior:first,successor,priorAttestation:priorAtt,successorAttestation:nextAtt,
 priorPublicKeyPem:pem(archive),successorPublicKeyPem:pem(archive),
 priorFingerprint:fp(archive),successorFingerprint:fp(archive),
 ownerPublicKeyPem:pem(owner),ownerFingerprint:fp(owner),
 ownerApproval:signature(ownerClaims,owner,true),
 priorReview:{status:"VERIFIED",digest:first.expectedDigest,versionId:first.versionId,expiry:{status:"ACTIVE"}},
 successorReview:{status:"VERIFIED",digest:successor.expectedDigest,versionId:successor.versionId,expiry:{status:"ACTIVE"}},
 now:new Date("2026-10-20T08:00:00.000Z")};
const handoff=prepareHandoff({evidence,issuedAt:"2026-10-20T04:00:00.000Z"});
const comments=[{id:101,user:{login:"RosevearCreations"},
 body:HANDOFF_PREFIX+JSON.stringify(handoff),
 created_at:"2026-10-20T04:00:00Z",updated_at:"2026-10-20T04:00:00Z"}];
const ownerHistory=crossAnchorHistory({comments,expectedIssueNumber:77});
const keys=["commentId","receiptDigest","priorDigest","successorDigest","evidenceDigest",
 "approvalRef","priorVersionId","successorVersionId"];
const rotationRecord={schema:"rosie.external-rotation-register.v1",
 repository:"RosevearCreations/rosiedazzlers",issueNumber:77,sequence:1,
 previousRegisterDigest:null,headDigest:handoff.receiptDigest,receiptCount:1,
 entries:ownerHistory.entries.map(e=>Object.fromEntries(keys.map(k=>[k,e[k]]))),
 issuedAt:"2026-10-20T05:00:00.000Z",registerRef:"offsite:rotation-589"};
const signedRotation={algorithm:"Ed25519",register:rotationRecord,
 signature:sign(null,canonicalBytes(rotationRecord),sourceSigner.privateKey).toString("base64")};
const continuityArguments={revisions:[{signedRegister:signedRotation,publicKeyPem:pem(sourceSigner),
 trustedFingerprint:fp(sourceSigner),externalPin:{
 registerDigest:digestRegister(rotationRecord),headDigest:handoff.receiptDigest,
 sequence:1,externalReference:"offline:rotation-pin"}}],
 comments,evidenceByReceiptDigest:new Map([[handoff.receiptDigest,evidence]]),
 trustedFingerprintsByReceiptDigest:new Map([[handoff.receiptDigest,
 {owner:fp(owner),prior:fp(archive),successor:fp(archive)}]])};
const now=new Date("2026-10-20T08:00:00.000Z");
const continuity=reviewExternalRegisterContinuity({...continuityArguments,now});
assert.equal(continuity.status,"CONTINUITY_VERIFIED");
const firstDecisionClaims=ownerExceptionClaims({continuity,action:"OPEN_REVIEW",
 incidentRef:"issue:77",approvalRef:"owner:exception-open",
 issuedAt:"2026-10-20T05:30:00.000Z"});
const r1=signature(firstDecisionClaims,owner);
const digest1=createHash("sha256").update(canonicalBytes(r1)).digest("hex");
const secondDecisionClaims=ownerExceptionClaims({continuity,action:"ACKNOWLEDGE_HOLD",
 incidentRef:"issue:77",approvalRef:"owner:exception-ack",
 issuedAt:"2026-10-20T06:30:00.000Z",previousDecisionDigest:digest1});
const r2=signature(secondDecisionClaims,owner);
const receipts=[r1,r2];
const verified=verifyOwnerExceptionHistory({continuity,receipts,
 ownerPublicKeyPem:pem(owner),pinnedOwnerFingerprint:fp(owner),
 pinnedRegisterFingerprint:fp(sourceSigner),now});
assert.equal(verified.status,"OWNER_EXCEPTION_HISTORY_VERIFIED");
const all=verified.decisions.map(x=>({
 decisionDigest:x.receiptDigest,action:x.action,incidentRef:x.incidentRef,
 ownerApprovalRef:x.ownerApprovalRef,issuedAt:x.issuedAt,sourceRegisterDigest:x.registerDigest
}));
const register=(entries,sequence,issuedAt,previousExceptionRegisterDigest=null)=>({
 schema:"rosie.external-exception-register.v1",
 repository:"RosevearCreations/rosiedazzlers",issueNumber:77,
 sourceRegisterDigest:continuity.registerDigest,sourceRegisterSequence:continuity.registerSequence,
 sequence,previousExceptionRegisterDigest,
 headDigest:entries.at(-1).decisionDigest,decisionCount:entries.length,
 entries,issuedAt,registerRef:"offline:exception-register-"+sequence
});
const record1=register(all.slice(0,1),1,"2026-10-20T05:45:00.000Z");
const record2=register(all,2,"2026-10-20T06:45:00.000Z",exceptionRegisterDigest(record1));
const rev=r=>({signedRegister:{algorithm:"Ed25519",register:r,
 signature:sign(null,canonicalBytes(r),exceptionSigner.privateKey).toString("base64")},
 publicKeyPem:pem(exceptionSigner),pinnedSignerFingerprint:fp(exceptionSigner),
 externalPin:{registerDigest:exceptionRegisterDigest(r),headDigest:r.headDigest,
 sequence:r.sequence,externalReference:"owner-offline:exception-pin-"+r.sequence}});
const versions=[rev(record1),rev(record2)];
const input={revisions:versions,continuityArguments,ownerReceipts:receipts,
 ownerPublicKeyPem:pem(owner),pinnedOwnerFingerprint:fp(owner),
 pinnedSourceRegisterFingerprint:fp(sourceSigner),
 pinnedExceptionSignerFingerprint:fp(exceptionSigner),now};
const result=verifyExceptionRegisterHistory(input);
assert.equal(result.status,"EXTERNAL_EXCEPTION_HISTORY_VERIFIED");
assert.equal(result.revisions.length,2);
assert.equal(result.latest.decisions.length,2);
const ledger=ownerEscalationLedger({verifyArguments:input,now,reviewAfterDays:7});
assert.equal(ledger.status,"READ_ONLY_ESCALATION_LEDGER");
assert.equal(ledger.rows[0].reviewStatus,"OWNER_REVIEW_OPEN");
assert.equal(ledger.rows[0].auditHoldCleared,false);
assert.equal(ledger.automaticEscalation,false);
assert.throws(()=>ownerEscalationLedger({history:result,now}),/HOLD/);
assert.equal(ownerEscalationLedger({verifyArguments:input,now:new Date("2026-10-31T08:00:00.000Z"),
 reviewAfterDays:7}).rows[0].reviewStatus,"OWNER_ESCALATION_REVIEW_DUE");
assert.throws(()=>verifyExceptionRegisterHistory({...input,
 pinnedExceptionSignerFingerprint:fp(impostor)}),/signing identity/);
assert.throws(()=>verifyExceptionRegisterHistory({...input,
 pinnedSourceRegisterFingerprint:fp(impostor)}),/rotation register signer/);
assert.throws(()=>verifyExceptionRegisterHistory({...input,
 ownerReceipts:[r1]}),/history|incomplete|owner|HOLD/);
assert.throws(()=>verifyExceptionRegisterHistory({...input,
 revisions:[versions[1],versions[0]]}),/genesis|rollback|missing/i);
const tampered=register([{...all[0],ownerApprovalRef:"owner:changed"},all[1]],
 2,"2026-10-20T06:45:00.000Z",exceptionRegisterDigest(record1));
assert.throws(()=>verifyExceptionRegisterHistory({...input,
 revisions:[versions[0],rev(tampered)]}),/rewritten|differs|altered|incomplete/);
assert.throws(()=>verifyExceptionRegisterHistory({...input,
 revisions:[versions[0],{...versions[1],externalPin:{
 ...versions[1].externalPin,registerDigest:"f".repeat(64)}}]}),/pin/);
assert.throws(()=>ownerEscalationLedger({verifyArguments:{status:"EXTERNAL_EXCEPTION_HISTORY_VERIFIED"}}),/HOLD/);
console.log("Build 589 externally pinned Ed25519 exception register, chronology, audit linkage, read-only escalation PASS");
