/** Build 603 — signed independent reconciliation history, pinned head and owner manual decision.
 * Read-only; complete prior signatures and pins are reverified; no live writes.
 */
import {createHash,createPublicKey,verify} from "node:crypto";
import {canonicalBytes} from "./release_incident_external_rotation_register.mjs";
import {verifyExceptionReconciliation} from "./release_incident_owner_handoff_reconciliation.mjs";
const SHA=/^[a-f0-9]{64}$/,REF=/^[A-Za-z0-9][A-Za-z0-9._:/#-]{2,180}$/;
const ACTIONS=new Set(["CONTINUE_MANUAL_REVIEW","REQUEST_ADDITIONAL_EVIDENCE","ESCALATE_OWNER_DECISION","DEFER_RECONCILIATION"]);
const digest=x=>createHash("sha256").update(canonicalBytes(x)).digest("hex");
const timestamp=t=>typeof t==="string"&&Number.isFinite(Date.parse(t))&&new Date(t).toISOString()===t;
export function historyClaims({verified,sequence,previousDigest=null,action,reviewRef,issuedAt}){
 if(verified?.status!=="INDEPENDENT_OWNER_HANDOFF_EXCEPTION_RECONCILED_FOR_MANUAL_REVIEW"||
 verified.auditHoldCleared!==false||verified.automaticClosure!==false||
 !SHA.test(verified.receiptDigest||"")||!SHA.test(verified.handoffReceiptDigest||"")||
 !SHA.test(verified.exportDigest||"")||!REF.test(verified.incidentRef||"")||
 !Number.isSafeInteger(verified.issueNumber)||verified.issueNumber<1||
 !Number.isSafeInteger(sequence)||sequence<1||sequence>100||
 !(previousDigest===null||SHA.test(previousDigest))||
 !ACTIONS.has(action)||!REF.test(reviewRef||"")||!timestamp(issuedAt))
 throw Error("Complete verified reconciliation history required: HOLD");
 return {schema:"rosie.reconciliation-review-history.v1",repository:"RosevearCreations/rosiedazzlers",
 issueNumber:verified.issueNumber,incidentRef:verified.incidentRef,
 exportDigest:verified.exportDigest,handoffReceiptDigest:verified.handoffReceiptDigest,
 reconciliationReceiptDigest:verified.receiptDigest,sequence,previousDigest,
 action,reviewRef,issuedAt};
}
function checkedSignature(receipt,expected,pem,fingerprint){
 if(!receipt||receipt.algorithm!=="Ed25519"||!receipt.claims||
 Object.keys(receipt.claims).sort().join()!==Object.keys(expected).sort().join()||
 Object.keys(expected).some(k=>receipt.claims[k]!==expected[k])||
 typeof receipt.signature!=="string"||!/^[A-Za-z0-9+/]+={0,2}$/.test(receipt.signature)||
 typeof pem!=="string"||pem.length>8192||!SHA.test(fingerprint||""))
 throw Error("Reconciliation history receipt altered: HOLD");
 const key=createPublicKey(pem);
 if(key.asymmetricKeyType!=="ed25519"||
 createHash("sha256").update(key.export({type:"spki",format:"der"})).digest("hex")!==fingerprint||
 Buffer.from(receipt.signature,"base64").length!==64||
 !verify(null,canonicalBytes(expected),key,Buffer.from(receipt.signature,"base64")))
 throw Error("Reconciliation history signature invalid: HOLD");
}
export async function verifyPinnedReconciliationHistory({reconciliationArguments,historyReceipts,
 reviewerPublicKeyPem,pinnedReviewerFingerprint,independentHistoryPin,now=new Date()}){
 if(!reconciliationArguments||!Array.isArray(historyReceipts)||!historyReceipts.length||
 historyReceipts.length>100||pinnedReviewerFingerprint!==reconciliationArguments.pinnedReviewerFingerprint)
 throw Error("Complete independently signed history required: HOLD");
 const verified=await verifyExceptionReconciliation({...reconciliationArguments,now});
 let previous=null,previousAt=Date.parse(reconciliationArguments.reconciliationReceipt.claims.issuedAt);
 const clock=new Date(now).getTime(),rows=[];
 if(!Number.isFinite(clock))throw Error("Review clock invalid: HOLD");
 for(const receipt of historyReceipts){
 const expected=historyClaims({verified,sequence:rows.length+1,previousDigest:previous,
 action:receipt?.claims?.action,reviewRef:receipt?.claims?.reviewRef,issuedAt:receipt?.claims?.issuedAt});
 const at=Date.parse(expected.issuedAt);
 if(at<=previousAt||at>clock+300000)throw Error("Review history replay or future timestamp: HOLD");
 checkedSignature(receipt,expected,reviewerPublicKeyPem,pinnedReviewerFingerprint);
 previous=digest(receipt);previousAt=at;
 rows.push({sequence:expected.sequence,action:expected.action,reviewRef:expected.reviewRef,
 issuedAt:expected.issuedAt,receiptDigest:previous});
 }
 const pin=independentHistoryPin;
 if(!pin||pin.headDigest!==previous||pin.receiptCount!==rows.length||
 pin.reconciliationReceiptDigest!==verified.receiptDigest||
 pin.handoffReceiptDigest!==verified.handoffReceiptDigest||
 pin.issueNumber!==verified.issueNumber||!REF.test(pin.externalReference||""))
 throw Error("Independently pinned exact history head required: HOLD");
 return {status:"PINNED_RECONCILIATION_REVIEW_HISTORY_VERIFIED",
 issueNumber:verified.issueNumber,incidentRef:verified.incidentRef,
 exportDigest:verified.exportDigest,handoffReceiptDigest:verified.handoffReceiptDigest,
 reconciliationReceiptDigest:verified.receiptDigest,historyHeadDigest:previous,
 decisionHistory:rows,externalReference:pin.externalReference,
 auditHoldCleared:false,liveExceptionStatus:"UNCHANGED",automaticClosure:false,
 automaticDelivery:false,externalWritePerformed:false};
}
export async function ownerManualDecisionContinuity({historyArguments,ownerDecisionReceipt,
 ownerPublicKeyPem,pinnedOwnerFingerprint,independentOwnerDecisionPin,now=new Date()}){
 const history=await verifyPinnedReconciliationHistory({...historyArguments,now});
 const root=historyArguments.reconciliationArguments.handoffArguments;
 if(pinnedOwnerFingerprint!==root.pinnedOwnerFingerprint||
 pinnedOwnerFingerprint===historyArguments.pinnedReviewerFingerprint)
 throw Error("Distinct pinned owner signer required: HOLD");
 const prior=history.decisionHistory.at(-1);
 const c=ownerDecisionReceipt?.claims;
 const expected={schema:"rosie.reconciliation-owner-decision.v1",
 repository:"RosevearCreations/rosiedazzlers",issueNumber:history.issueNumber,
 incidentRef:history.incidentRef,historyHeadDigest:history.historyHeadDigest,
 reconciliationReceiptDigest:history.reconciliationReceiptDigest,
 action:c?.action,ownerReviewRef:c?.ownerReviewRef,issuedAt:c?.issuedAt};
 if(!new Set(["ACKNOWLEDGE_HISTORY_FOR_MANUAL_REVIEW","REQUEST_RECHECK","DEFER_OWNER_DECISION","ESCALATE_MANUAL_EXCEPTION"]).has(c?.action)||
 !REF.test(c?.ownerReviewRef||"")||!timestamp(c?.issuedAt)||
 Date.parse(c.issuedAt)<=Date.parse(prior.issuedAt)||
 Date.parse(c.issuedAt)>new Date(now).getTime()+300000)
 throw Error("Manual owner decision invalid: HOLD");
 checkedSignature(ownerDecisionReceipt,expected,ownerPublicKeyPem,pinnedOwnerFingerprint);
 const head=digest(ownerDecisionReceipt),pin=independentOwnerDecisionPin;
 if(!pin||pin.receiptDigest!==head||pin.historyHeadDigest!==history.historyHeadDigest||
 pin.issueNumber!==history.issueNumber||!REF.test(pin.externalReference||""))
 throw Error("Independent owner decision pin missing: HOLD");
 return {status:"OWNER_MANUAL_RECONCILIATION_DECISION_VERIFIED",
 issueNumber:history.issueNumber,incidentRef:history.incidentRef,action:c.action,
 historyHeadDigest:history.historyHeadDigest,ownerDecisionDigest:head,
 nextStep:"MANUAL_OWNER_FOLLOWUP",manualOwnerActionRequired:true,
 auditHoldCleared:false,liveExceptionStatus:"UNCHANGED",automaticClosure:false,
 automaticDelivery:false,externalWritePerformed:false};
}
