// Rosie Build 916: offline-safe consent withdrawal and real provider presence checks.
// No removal of public originals or social posts is ever inferred from 404/403.
import {UUID914,CHANNELS914} from './build914-supplier-publication-contract.mjs';
const SHA=/^[a-f0-9]{64}$/;
export function validateRevocation916(raw){
 if(!raw||typeof raw!=='object'||Array.isArray(raw)||Object.keys(raw).sort().join(',')!=='publication_id,reason')throw Error('REVOKE_SCOPE_INVALID');
 if(!UUID914.test(raw.publication_id))throw Error('ORIGINAL_PUBLICATION_REQUIRED');
 if(!['customer_consent_withdrawn','supplier_permission_withdrawn','owner_publication_withdrawn','rights_or_safety_concern'].includes(raw.reason))throw Error('REVOCATION_REASON_REQUIRED');
 return {publication_id:raw.publication_id,reason:raw.reason};
}
export function classifyRecall916({publication,receipt,probe}={}){
 const blockers=[];
 if(!publication||!UUID914.test(publication.id)||publication.publication_state!=='revoked')blockers.push('ORIGINAL_REVOKED_PUBLICATION_REQUIRED');
 if(!receipt||receipt.publication_id!==publication?.id||!CHANNELS914.has(receipt.channel)||receipt.channel!==publication?.channel)blockers.push('ORIGINAL_PROVIDER_RECEIPT_REQUIRED');
 // A read-only authenticated provider still presenting the same original post is positive proof recall is incomplete.
 if(probe?.ok===true&&probe.provider?.owner_id===receipt?.provider_owner_id&&probe.provider?.id===receipt?.provider_object_id&&probe.provider?.public===true)return {status:'ORIGINAL_POST_STILL_PUBLIC',external_recalled:false,blockers:[...blockers,'PROVIDER_POST_STILL_PUBLIC']};
 // Inaccessibility, 404, errors or an unavailable OAuth token cannot establish global deletion.
 return {status:'EXTERNAL_RECALL_UNVERIFIED',external_recalled:false,blockers:[...blockers,'INDEPENDENT_NATIVE_TAKEDOWN_RECEIPT_REQUIRED'],probe_reason:typeof probe?.reason==='string'?probe.reason.slice(0,80):'NO_INDEPENDENT_PROBE'};
}
export function validateDeviceEvidence916(value){
 const allowed=['publication_id','device_class','role_tested','browser_family','scenario','outcome','evidence_sha256'];
 if(!value||typeof value!=='object'||Array.isArray(value)||Object.keys(value).some(k=>!allowed.includes(k)))throw Error('DEVICE_EVIDENCE_SCOPE_INVALID');
 if(!UUID914.test(value.publication_id))throw Error('ORIGINAL_PUBLICATION_REQUIRED');
 if(!['desktop','mobile','tablet'].includes(value.device_class))throw Error('DEVICE_CLASS_INVALID');
 if(!['admin','senior_detailer','detailer','customer'].includes(value.role_tested))throw Error('ROLE_INVALID');
 if(!['chromium','firefox','safari','edge'].includes(value.browser_family))throw Error('BROWSER_INVALID');
 if(!['consent_revoke','supplier_recall','creative_review','quote_handoff','attribution_privacy'].includes(value.scenario))throw Error('SCENARIO_INVALID');
 if(!['passed','failed','blocked'].includes(value.outcome))throw Error('OUTCOME_INVALID');
 if(!SHA.test(String(value.evidence_sha256||'')))throw Error('PRIVATE_EVIDENCE_HASH_REQUIRED');
 return {...value, independent_witnessed:false, synthetic_not_accepted:true};
}
export function financialIntegrity916({originalJournal,review}={}){
 if(!originalJournal||!UUID914.test(originalJournal.id)||!['posted','final','locked'].includes(originalJournal.status))return {eligible:false,reason:'ORIGINAL_POSTED_JOURNAL_REQUIRED'};
 if(!review||!UUID914.test(review.publication_id)||review.journal_entry_id!==originalJournal.id)return {eligible:false,reason:'ORIGINAL_JOURNAL_ID_MISMATCH'};
 // An original general ledger entry does not establish a causal marketing source.
 return {eligible:true,classification:'DOCUMENT_REVIEW_ONLY',attributed_revenue_cents:null,incremental_sales:null,roas:null,not_a_settlement:true};
}
