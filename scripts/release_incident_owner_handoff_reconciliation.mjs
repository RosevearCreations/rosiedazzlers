/** Build 602 — provider-neutral, read-only owner handoff receipt reconciliation.
 * Verify every upstream Ed25519 handoff and independent digest pin before
 * presenting bounded manual exception outcomes. No customer or external writes.
 */
import {createHash,createPublicKey,verify} from "node:crypto";
import {canonicalBytes} from "./release_incident_external_rotation_register.mjs";
import {verifyOwnerExceptionReviewHandoff} from "./release_incident_owner_exception_handoff.mjs";
const SHA=/^[a-f0-9]{64}$/;
const REF=/^[A-Za-z0-9][A-Za-z0-9._:/#-]{2,180}$/;
const ACTIONS=new Set(["ACKNOWLEDGE_EXCEPTION_HANDOFF","REQUEST_MANUAL_RECHECK","DISPUTE_HANDOFF_EVIDENCE","DEFER_MANUAL_REVIEW"]);
const digest=x=>createHash("sha256").update(canonicalBytes(x)).digest("hex");
export function exceptionReconciliationClaims({verifiedHandoff,action,reviewRef,issuedAt}){
 if(verifiedHandoff?.status!=="OWNER_EXCEPTION_REVIEW_HANDOFF_VERIFIED"||
 verifiedHandoff.auditHoldCleared!==false||verifiedHandoff.automaticClosure!==false||
 !SHA.test(verifiedHandoff.handoffReceiptDigest||"")||
 !SHA.test(verifiedHandoff.ownerFollowUpHeadDigest||"")||
 !SHA.test(verifiedHandoff.recipientLedgerHeadDigest||"")||
 !SHA.test(verifiedHandoff.exportDigest||"")||
 !Number.isSafeInteger(verifiedHandoff.issueNumber)||verifiedHandoff.issueNumber<1||
 !REF.test(verifiedHandoff.incidentRef||"")||!REF.test(verifiedHandoff.handoffRef||"")||
 !REF.test(verifiedHandoff.recipientRef||"")||!ACTIONS.has(action)||!REF.test(reviewRef||"")||
 typeof issuedAt!=="string"||!Number.isFinite(Date.parse(issuedAt))||
 new Date(issuedAt).toISOString()!==issuedAt)
 throw Error("Independent owner handoff and bounded exception review required: HOLD");
 return {schema:"rosie.owner-handoff-reconciliation.v1",repository:"RosevearCreations/rosiedazzlers",
 issueNumber:verifiedHandoff.issueNumber,incidentRef:verifiedHandoff.incidentRef,
 recipientRef:verifiedHandoff.recipientRef,exportDigest:verifiedHandoff.exportDigest,
 recipientLedgerHeadDigest:verifiedHandoff.recipientLedgerHeadDigest,
 ownerFollowUpHeadDigest:verifiedHandoff.ownerFollowUpHeadDigest,
 handoffReceiptDigest:verifiedHandoff.handoffReceiptDigest,
 handoffRef:verifiedHandoff.handoffRef,action,reviewRef,issuedAt};
}
export async function verifyExceptionReconciliation({handoffArguments,
 reconciliationReceipt,reviewerPublicKeyPem,pinnedReviewerFingerprint,
 independentReconciliationPin,now=new Date()}){
 if(!handoffArguments||!reconciliationReceipt||
 !SHA.test(pinnedReviewerFingerprint||"")||
 pinnedReviewerFingerprint===handoffArguments.pinnedOwnerFingerprint||
 !independentReconciliationPin||!REF.test(independentReconciliationPin.externalReference||""))
 throw Error("Distinct independent reviewer and external pin required: HOLD");
 const verifiedHandoff=await verifyOwnerExceptionReviewHandoff({...handoffArguments,now});
 const incoming=reconciliationReceipt.claims;
 const expected=exceptionReconciliationClaims({verifiedHandoff,
 action:incoming?.action,reviewRef:incoming?.reviewRef,issuedAt:incoming?.issuedAt});
 if(!incoming||Object.keys(incoming).sort().join()!==Object.keys(expected).sort().join()||
 Object.keys(expected).some(k=>incoming[k]!==expected[k])||
 reconciliationReceipt.algorithm!=="Ed25519"||
 typeof reconciliationReceipt.signature!=="string"||
 !/^[A-Za-z0-9+/]+={0,2}$/.test(reconciliationReceipt.signature)||
 typeof reviewerPublicKeyPem!=="string"||reviewerPublicKeyPem.length>8192)
 throw Error("Reconciliation claims mutated: HOLD");
 const key=createPublicKey(reviewerPublicKeyPem);
 if(key.asymmetricKeyType!=="ed25519"||
 createHash("sha256").update(key.export({format:"der",type:"spki"})).digest("hex")!==pinnedReviewerFingerprint)
 throw Error("Reviewer signer fingerprint mismatch: HOLD");
 const sig=Buffer.from(reconciliationReceipt.signature,"base64");
 if(sig.length!==64||!verify(null,canonicalBytes(expected),key,sig))
 throw Error("Independent reviewer signature invalid: HOLD");
 const t=Date.parse(expected.issuedAt);
 const prev=Date.parse(handoffArguments.handoffReceipt.claims.issuedAt);
 if(!Number.isFinite(new Date(now).getTime())||t<=prev||t>new Date(now).getTime()+300000)
 throw Error("Reconciliation chronology invalid: HOLD");
 const receiptDigest=digest(reconciliationReceipt);
 if(independentReconciliationPin.receiptDigest!==receiptDigest||
 independentReconciliationPin.handoffReceiptDigest!==verifiedHandoff.handoffReceiptDigest||
 independentReconciliationPin.ownerFollowUpHeadDigest!==verifiedHandoff.ownerFollowUpHeadDigest||
 independentReconciliationPin.exportDigest!==verifiedHandoff.exportDigest||
 independentReconciliationPin.issueNumber!==verifiedHandoff.issueNumber||
 independentReconciliationPin.reviewRef!==expected.reviewRef)
 throw Error("Independent reconciliation pin missing or wrong: HOLD");
 return {status:"INDEPENDENT_OWNER_HANDOFF_EXCEPTION_RECONCILED_FOR_MANUAL_REVIEW",
 issueNumber:verifiedHandoff.issueNumber,incidentRef:verifiedHandoff.incidentRef,
 reconciliationAction:expected.action,reviewRef:expected.reviewRef,
 receiptDigest,handoffReceiptDigest:verifiedHandoff.handoffReceiptDigest,
 exportDigest:verifiedHandoff.exportDigest,
 externalReference:independentReconciliationPin.externalReference,
 nextStep:"MANUAL_OWNER_EXCEPTION_DECISION",manualOwnerActionRequired:true,
 auditHoldCleared:false,liveExceptionStatus:"UNCHANGED",automaticClosure:false,
 automaticDelivery:false,externalWritePerformed:false};
}
