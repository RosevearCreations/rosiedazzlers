import assert from "node:assert/strict";
import {createHash,generateKeyPairSync,sign} from "node:crypto";
import {canonicalBytes} from "./release_incident_external_rotation_register.mjs";
import {ownerReviewClaims} from "./release_incident_owner_escalation_review.mjs";
import {verifyExceptionRegisterHistory} from "./release_incident_external_exception_register.mjs";
import {verifiedReviewHeadEnvelope,verifyRetainedOwnerReviewHead,
 manualExceptionHandoffClaims,verifyManualExceptionHandoff}
 from "./release_incident_owner_head_retention_handoff.mjs";
import {reviewHeadRotationClaims,verifyReviewHeadRotationRegister,
 independentResolutionClaims,ownerCloseoutReviewClaims,
 evaluateExplicitOwnerExceptionCloseout}
 from "./release_incident_review_head_rotation_closeout.mjs";
import {build590Fixture} from "./release_incident_owner_escalation_review_test.mjs";
const {args,owner,impostor,pem,fp,signature}=build590Fixture;
const now=new Date("2026-10-20T10:00:00.000Z");
const hash=x=>createHash("sha256").update(canonicalBytes(x)).digest("hex");
const oldArgs={...args,now};
const oldHead=verifiedReviewHeadEnvelope({...oldArgs,issuedAt:"2026-10-20T07:45:00.000Z"});
const last=oldArgs.reviewReceipts.at(-1);
const previousReviewDigest=hash(last);
const history=verifyExceptionRegisterHistory({...args.verifyArguments,now});
const exceptionDecision=history.latest.decisions.at(-1);
const newerClaims=ownerReviewClaims({verifiedHistory:history,
 incidentRef:exceptionDecision.incidentRef,decisionDigest:exceptionDecision.receiptDigest,
 action:"REQUEST_FOLLOWUP",ownerReviewRef:"owner:review-592-extra",
 evidenceRef:"offline:review-592",issuedAt:"2026-10-20T08:10:00.000Z",
 previousReviewDigest});
const third=signature(newerClaims,owner);
const nextArgs={...args,reviewReceipts:[...args.reviewReceipts,third],
 independentReviewHeadPin:{headDigest:hash(third),receiptCount:3,
 exceptionRegisterDigest:args.independentReviewHeadPin.exceptionRegisterDigest,
 externalReference:"offline:new-owner-head-592"},now};
const nextHead=verifiedReviewHeadEnvelope({...nextArgs,issuedAt:"2026-10-20T08:40:00.000Z"});
assert.notEqual(oldHead.contentDigest,nextHead.contentDigest);
const records=new Map([
 ["old",oldHead],["successor",nextHead]
]);
const pins={
 old:{objectKey:"rosie/owner-review/77/old-592.json",versionId:"s3-old-592",
   recordDigest:hash(oldHead),reviewHeadDigest:oldHead.payload.reviewHeadDigest,
   externalReference:"external:old-592"},
 successor:{objectKey:"rosie/owner-review/77/next-592.json",versionId:"s3-new-592",
   recordDigest:hash(nextHead),reviewHeadDigest:nextHead.payload.reviewHeadDigest,
   externalReference:"external:new-592"}
};
const adapter={capabilities:{immutableCreate:true,retentionLock:true,independentTrustRoot:true},
 createOnce:async()=>{throw Error("Build 592 must not write");},
 async retentionEvidence(key,versionId){
   const which=key===pins.old.objectKey?"old":key===pins.successor.objectKey?"successor":null;
   if(!which||versionId!==pins[which].versionId)throw Error("Exact version not found");
   return {key,versionId,mode:"COMPLIANCE",retainUntil:"2027-02-01T00:00:00.000Z"};
 },
 async readVersioned(key,versionId){
   const which=key===pins.old.objectKey?"old":key===pins.successor.objectKey?"successor":null;
   if(!which||versionId!==pins[which].versionId)throw Error("Wrong immutable version");
   return records.get(which);
 }
};
const priorVerification={...oldArgs,issuedAt:oldHead.payload.issuedAt,
 adapter,independentStoredObjectPin:pins.old};
const successorVerification={...nextArgs,issuedAt:nextHead.payload.issuedAt,
 adapter,independentStoredObjectPin:pins.successor};
const [priorProof,successorProof]=await Promise.all([
 verifyRetainedOwnerReviewHead(priorVerification),
 verifyRetainedOwnerReviewHead(successorVerification)]);
const rotateClaims=reviewHeadRotationClaims(priorProof,successorProof,
 "owner:rotation-592","2026-10-20T09:00:00.000Z");
const approval=signature(rotateClaims,owner);
const rotationPin={headDigest:hash(approval),receiptCount:1,
 successorRecordDigest:successorProof.recordDigest,externalReference:"offline:rotation-pin-592"};
const rotationArguments={transitions:[{priorVerification,successorVerification,ownerApproval:approval}],
 ownerPublicKeyPem:pem(owner),pinnedOwnerFingerprint:fp(owner),
 independentRotationPin:rotationPin,now};
const rotation=await verifyReviewHeadRotationRegister(rotationArguments);
assert.equal(rotation.status,"INDEPENDENTLY_ANCHORED_ROTATION_REVIEW");
assert.equal(rotation.automaticRotation,false);
assert.equal(rotation.history.length,1);
await assert.rejects(verifyReviewHeadRotationRegister({...rotationArguments,
 independentRotationPin:{...rotationPin,headDigest:"f".repeat(64)}}),/rotation-register head anchor/);
await assert.rejects(verifyReviewHeadRotationRegister({...rotationArguments,
 transitions:[{priorVerification,successorVerification,
 ownerApproval:signature(rotateClaims,impostor)}]}),/signature/);
await assert.rejects(verifyReviewHeadRotationRegister({...rotationArguments,
 transitions:[{priorVerification,successorVerification:priorVerification,
 ownerApproval:approval}]}),/distinct/);
const handoffClaims=manualExceptionHandoffClaims({retainedProof:successorProof,issueNumber:77,
 incidentRef:"issue:77",action:"REQUEST_MANUAL_REVIEW",
 handoffRef:"owner:handoff-592",issuedAt:"2026-10-20T09:05:00.000Z"});
const handoffReceipt=signature(handoffClaims,owner);
const handoffArguments={retentionVerification:successorVerification,issueNumber:77,
 receipts:[handoffReceipt],ownerPublicKeyPem:pem(owner),pinnedOwnerFingerprint:fp(owner),
 independentHandoffHeadPin:{headDigest:hash(handoffReceipt),receiptCount:1,
 recordDigest:successorProof.recordDigest,externalReference:"offline:handoff-head-592"},now};
const handOff=await verifyManualExceptionHandoff(handoffArguments);
assert.equal(handOff.auditHoldCleared,false);
const auditor=generateKeyPairSync("ed25519");
const auditorPem=auditor.publicKey.export({format:"pem",type:"spki"});
const auditorFp=createHash("sha256").update(auditor.publicKey.export({
 format:"der",type:"spki"})).digest("hex");
const resolutionClaims=independentResolutionClaims({rotation,handOff,incidentRef:"issue:77",
 evidenceRef:"independent-auditor:resolution-evidence-592",
 reviewedAt:"2026-10-20T09:10:00.000Z"});
const resolutionReceipt={algorithm:"Ed25519",claims:resolutionClaims,
 signature:sign(null,canonicalBytes(resolutionClaims),auditor.privateKey).toString("base64")};
const closeoutClaims=ownerCloseoutReviewClaims(rotation,handOff,resolutionReceipt,{
 claims:{incidentRef:"issue:77",approvalRef:"owner:closeout-592",
 issuedAt:"2026-10-20T09:15:00.000Z"}});
const closeoutReceipt=signature(closeoutClaims,owner);
const closeoutArgs={rotationArguments,handoffArguments,
 resolutionReceipt,auditorPublicKeyPem:auditorPem,pinnedAuditorFingerprint:auditorFp,
 ownerCloseoutReceipt:closeoutReceipt,ownerPublicKeyPem:pem(owner),
 pinnedOwnerFingerprint:fp(owner),now};
const outcome=await evaluateExplicitOwnerExceptionCloseout(closeoutArgs);
assert.equal(outcome.status,"OWNER_CLOSEOUT_REVIEW_CANDIDATE");
assert.equal(outcome.explicitHumanDecisionRequired,true);
assert.equal(outcome.auditHoldCleared,false);
assert.equal(outcome.automaticClosure,false);
assert.equal(outcome.externalWritePerformed,false);
await assert.rejects(evaluateExplicitOwnerExceptionCloseout({...closeoutArgs,
 resolutionReceipt:{...resolutionReceipt,signature:signature(resolutionClaims,impostor).signature}}),/signature/);
await assert.rejects(evaluateExplicitOwnerExceptionCloseout({...closeoutArgs,
 ownerCloseoutReceipt:signature(closeoutClaims,impostor)}),/signature/);
await assert.rejects(evaluateExplicitOwnerExceptionCloseout({...closeoutArgs,
 pinnedAuditorFingerprint:fp(owner)}),/identity/);
await assert.rejects(evaluateExplicitOwnerExceptionCloseout({...closeoutArgs,
 ownerCloseoutReceipt:{...closeoutReceipt,claims:{...closeoutClaims,
 action:"CLOSE_AUDIT_HOLD"}}}),/evidence/);
await assert.rejects(evaluateExplicitOwnerExceptionCloseout({...closeoutArgs,
 handoffArguments:{...handoffArguments,independentHandoffHeadPin:null}}),/pin/);
await assert.rejects(evaluateExplicitOwnerExceptionCloseout({...closeoutArgs,
 rotationArguments:{...rotationArguments,independentRotationPin:null}}),/rotation-register/);
console.log("Build 592 external review-head rotation, signed auditor resolution and manual-only exception closeout safeguards PASS");
