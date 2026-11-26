// Build 932: common admission gate, durable readback and bounded signed receiver continuity.
import {enrollmentReady931} from './build931-original-enrollment.mjs';
import {digest925} from './build925-field-reconciliation.mjs';
import {UUID,H64} from './build926-runtime-certification.mjs';
const need=(v,m)=>{if(!v)throw Error(m)};
export function requireEnrollments932(rows,config,digest){
 need(Array.isArray(rows)&&rows.length===3&&H64.test(digest||'')&&new Set(rows.map(x=>x.role)).size===3&&new Set(rows.map(x=>x.enrollment_digest)).size===3&&enrollmentReady931(rows,config,digest).every(x=>x.enrolled),'THREE_INDEPENDENT_ENROLLMENTS_REQUIRED');
 return true;
}
export async function verifyReadback932(row,{id,caseId,priorReceiptId,result}){
 need(UUID.test(id||'')&&row?.id===id&&row.case_id===caseId&&row.prior_receipt_id===priorReceiptId&&row.binding_digest===result.bindingDigest&&row.guest_digest===result.guestDigest&&row.launcher_digest===result.launcherDigest&&row.authority_digest===result.authorityDigest,'DURABLE_RECEIPT_READBACK_MISMATCH');
 need(await digest925(row.result)===await digest925(result)&&await digest925(row.evidence?.guest)===result.guestDigest&&await digest925(row.evidence?.launcher)===result.launcherDigest&&await digest925(row.evidence?.authority)===result.authorityDigest,'DURABLE_RECEIPT_DIGEST_MISMATCH');
 return true;
}
// Historical receipt acceptance only, never current continuous health or full field certification.
export function receiverAcceptance932(result,prior){
 const accepted=result?.approved===true&&result.guestSignedObservationAccepted===true&&result.detachedLauncherSignedObservationAccepted===true;
 const previous=prior?.result;
 const continuity=accepted&&previous?.approved===true&&previous.guestSignedObservationAccepted===true&&previous.detachedLauncherSignedObservationAccepted===true&&previous.configDigest===result.configDigest&&result.receiverContinuity==='NEW_WITNESSES_SAME_PINNED_LEDGER';
 return {state:accepted?'SIGNED_ORIGINAL_OBSERVATION_ADMITTED':'ORIGINAL_OPERATIONAL_HOLD',receiverContinuity:continuity?'INDEPENDENT_SAME_LEDGER_CONTINUITY_AT_OBSERVATION':accepted&&result.receiverContinuity==='FRESH_PAIR_BASELINE_ONLY'?'FIRST_ACCEPTED_PAIR_BASELINE':'CONTINUITY_HOLD',bootHoldClosed:accepted&&result.bootHoldClosed===true,fieldCertified:false,sevenSourceConnected:false,continuousHealthCertified:false,authorizesAction:false};
}
