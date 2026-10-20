/** Build 601: read-only exception review and signed owner follow-up handoff.
 * All upstream Ed25519 records and independent external pins are reverified.
 * No live exception closure, delivery or customer-facing mutation.
 */
import {createHash,createPublicKey,verify} from "node:crypto";
import {canonicalBytes} from "./release_incident_external_rotation_register.mjs";
import {verifyOwnerManualFollowUpContinuity} from "./release_incident_recipient_acknowledgement_ledger.mjs";
const SHA=/^[0-9a-f]{64}$/;
const REF=/^[A-Za-z0-9][A-Za-z0-9._:/#-]{2,180}$/;
const ACTIONS=new Set(["REVIEW_EXCEPTION_EVIDENCE","REQUEST_RECIPIENT_CLARIFICATION","ESCALATE_INDEPENDENT_REVIEW","DEFER_OWNER_HANDOFF"]);
const hash=x=>createHash("sha256").update(canonicalBytes(x)).digest("hex");
export function ownerExceptionHandoffClaims({continuity,action,reviewRef,handoffRef,issuedAt}){
 if(continuity?.status!=="INDEPENDENT_OWNER_MANUAL_FOLLOWUP_CONTINUITY"||
 continuity.auditHoldCleared!==false||continuity.automaticClosure!==false||
 !SHA.test(continuity.exportDigest||"")||!SHA.test(continuity.recipientLedgerHeadDigest||"")||
 !SHA.test(continuity.ownerFollowUpHeadDigest||"")||
 !REF.test(continuity.incidentRef||"")||!REF.test(continuity.recipientRef||"")||
 !Number.isSafeInteger(continuity.issueNumber)||continuity.issueNumber<1||
 !ACTIONS.has(action)||!REF.test(reviewRef||"")||!REF.test(handoffRef||"")||
 typeof issuedAt!=="string"||!Number.isFinite(Date.parse(issuedAt))||
 new Date(issuedAt).toISOString()!==issuedAt)
 throw Error("Verified independent manual follow-up and bounded owner action required: HOLD");
 return {schema:"rosie.owner-exception-handoff.v1",repository:"RosevearCreations/rosiedazzlers",
 issueNumber:continuity.issueNumber,incidentRef:continuity.incidentRef,
 exportDigest:continuity.exportDigest,recipientRef:continuity.recipientRef,
 recipientLedgerHeadDigest:continuity.recipientLedgerHeadDigest,
 ownerFollowUpHeadDigest:continuity.ownerFollowUpHeadDigest,
 action,reviewRef,handoffRef,issuedAt};
}
export async function verifyOwnerExceptionReviewHandoff({ownerFollowUpArguments,
 handoffReceipt,ownerPublicKeyPem,pinnedOwnerFingerprint,
 independentHandoffPin,now=new Date()}){
 if(!ownerFollowUpArguments||!handoffReceipt||
 pinnedOwnerFingerprint!==ownerFollowUpArguments.pinnedOwnerFingerprint||
 !SHA.test(pinnedOwnerFingerprint||"")||
 !independentHandoffPin||!REF.test(independentHandoffPin.externalReference||""))
 throw Error("Missing independently pinned owner handoff: HOLD");
 const continuity=await verifyOwnerManualFollowUpContinuity({...ownerFollowUpArguments,now});
 const c=handoffReceipt.claims;
 const claims=ownerExceptionHandoffClaims({continuity,action:c?.action,
 reviewRef:c?.reviewRef,handoffRef:c?.handoffRef,issuedAt:c?.issuedAt});
 if(!c||Object.keys(c).sort().join()!==Object.keys(claims).sort().join()||
 Object.keys(claims).some(k=>c[k]!==claims[k])||
 handoffReceipt.algorithm!=="Ed25519"||
 typeof handoffReceipt.signature!=="string"||
 !/^[A-Za-z0-9+/]+={0,2}$/.test(handoffReceipt.signature)||
 typeof ownerPublicKeyPem!=="string"||ownerPublicKeyPem.length>8192)
 throw Error("Owner review receipt altered: HOLD");
 const key=createPublicKey(ownerPublicKeyPem);
 if(key.asymmetricKeyType!=="ed25519"||
 createHash("sha256").update(key.export({format:"der",type:"spki"})).digest("hex")!==pinnedOwnerFingerprint)
 throw Error("Incorrect independently pinned owner key: HOLD");
 const bytes=Buffer.from(handoffReceipt.signature,"base64");
 if(bytes.length!==64||!verify(null,canonicalBytes(claims),key,bytes))
 throw Error("Owner review handoff signature invalid: HOLD");
 const ts=Date.parse(claims.issuedAt), prior=Date.parse(
 ownerFollowUpArguments.ownerDecisionReceipts.at(-1).claims.issuedAt);
 if(!Number.isFinite(new Date(now).getTime())||ts<=prior||ts>new Date(now).getTime()+300000)
 throw Error("Owner handoff replay or future timestamp: HOLD");
 const receiptDigest=hash(handoffReceipt);
 if(independentHandoffPin.receiptDigest!==receiptDigest||
 independentHandoffPin.exportDigest!==continuity.exportDigest||
 independentHandoffPin.recipientLedgerHeadDigest!==continuity.recipientLedgerHeadDigest||
 independentHandoffPin.ownerFollowUpHeadDigest!==continuity.ownerFollowUpHeadDigest||
 independentHandoffPin.issueNumber!==continuity.issueNumber||
 independentHandoffPin.handoffRef!==claims.handoffRef)
 throw Error("External independent owner handoff pin mismatch: HOLD");
 return {status:"OWNER_EXCEPTION_REVIEW_HANDOFF_VERIFIED",
 issueNumber:continuity.issueNumber,incidentRef:continuity.incidentRef,
 reviewAction:claims.action,reviewRef:claims.reviewRef,handoffRef:claims.handoffRef,
 recipientRef:continuity.recipientRef,exportDigest:continuity.exportDigest,
 recipientLedgerHeadDigest:continuity.recipientLedgerHeadDigest,
 ownerFollowUpHeadDigest:continuity.ownerFollowUpHeadDigest,
 handoffReceiptDigest:receiptDigest,externalReference:independentHandoffPin.externalReference,
 nextStep:"MANUAL_INDEPENDENT_EXCEPTION_REVIEW",manualOwnerActionRequired:true,
 liveExceptionStatus:"UNCHANGED",auditHoldCleared:false,automaticClosure:false,
 automaticDelivery:false,externalWritePerformed:false};
}
