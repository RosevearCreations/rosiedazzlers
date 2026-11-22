// Build 917: fail-closed supplier recall, original-device and financial causality review.
// This module never infers actual provider deletion, worldwide mirror removal or caused revenue.
import {UUID914} from './build914-supplier-publication-contract.mjs';
const SHA=/^[a-f0-9]{64}$/;
const REF=/^[A-Za-z0-9:_-]{8,120}$/;
const HOST=/^(?=.{4,120}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,24}$/;
const types={
 native_receipt:['provider_receipt_id','provider_case_reference','receipt_sha256'],
 surface:['surface_kind','surface_host','observed_state','evidence_sha256'],
 second_witness:['device_evidence_id','evidence_sha256'],
 finance_chain:['journal_entry_id','payment_source_sha256','customer_source_sha256']
};
export function validate917(body){
 if(!body||typeof body!=='object'||Array.isArray(body)||!UUID914.test(body.publication_id)||!types[body.action])throw Error('ORIGINAL_SCOPE_REQUIRED');
 const keys=Object.keys(body).sort().join(',');
 if(keys!==['action','publication_id',...types[body.action]].sort().join(','))throw Error('EXACT_EVIDENCE_FIELDS_REQUIRED');
 const hash=(s)=>SHA.test(s||'');
 if(body.action==='native_receipt'){
  if(!UUID914.test(body.provider_receipt_id)||!REF.test(body.provider_case_reference)||!hash(body.receipt_sha256))throw Error('NATIVE_DOCUMENT_REFERENCE_REQUIRED');
 }
 if(body.action==='surface'){
  if(!['origin','cdn','mirror','search','archive'].includes(body.surface_kind)||!HOST.test(body.surface_host)||!['present','unavailable','staff_reported_removed'].includes(body.observed_state)||!hash(body.evidence_sha256))throw Error('SURFACE_EVIDENCE_REQUIRED');
 }
 if(body.action==='second_witness'&&(!UUID914.test(body.device_evidence_id)||!hash(body.evidence_sha256)))throw Error('ORIGINAL_DEVICE_EVIDENCE_REQUIRED');
 if(body.action==='finance_chain'&&(!UUID914.test(body.journal_entry_id)||!hash(body.payment_source_sha256)||!hash(body.customer_source_sha256)))throw Error('INDEPENDENT_FINANCIAL_SOURCE_REQUIRED');
 return body;
}
export function evaluate917({publication,revocations=[],providerReceipts=[],nativeReceipts=[],surfaces=[],deviceReports=[],secondWitnesses=[],financeReviews=[],financeChains=[]}={}){
 const id=publication?.id,revoked=UUID914.test(id||'')&&publication.publication_state==='revoked'&&revocations.filter(x=>x.publication_id===id).length===1;
 const originalProvider=providerReceipts.filter(x=>x.publication_id===id&&x.channel===publication?.channel);
 const native=nativeReceipts.filter(x=>x.publication_id===id&&originalProvider.some(p=>p.id===x.provider_receipt_id));
 const surface=surfaces.filter(x=>x.publication_id===id);
 const device=secondWitnesses.filter(x=>x.publication_id===id&&deviceReports.some(d=>d.id===x.device_evidence_id&&d.publication_id===id&&d.outcome==='passed'&&d.witnessed_by_staff_id!==x.witnessed_by_staff_id));
 const finance=financeChains.filter(x=>x.publication_id===id&&financeReviews.some(r=>r.publication_id===id&&r.journal_entry_id===x.journal_entry_id));
 const blockers=[];
 if(!revoked)blockers.push('ORIGINAL_REVOCATION_REQUIRED');
 if(originalProvider.length!==1)blockers.push('SINGLE_ORIGINAL_PROVIDER_RECEIPT_REQUIRED');
 if(native.length===0)blockers.push('PROVIDER_NATIVE_TAKEDOWN_RECEIPT_NOT_SUBMITTED');
 if(!surface.some(s=>s.surface_kind==='origin'))blockers.push('ORIGIN_SURFACE_WITNESS_REQUIRED');
 if(!surface.some(s=>['cdn','mirror','search','archive'].includes(s.surface_kind)))blockers.push('INDEPENDENT_SECOND_SURFACE_WITNESS_REQUIRED');
 if(device.length===0)blockers.push('DISTINCT_SECOND_DEVICE_WITNESS_REQUIRED');
 if(finance.length===0)blockers.push('ORIGINAL_FINANCIAL_SOURCE_CHAIN_REQUIRED');
 // Submitted hashes and staff testimony cannot establish native account authority,
 // all-internet recall, genuine independently witnessed devices or counterfactual causality.
 blockers.push('PROVIDER_ISSUER_SIGNATURE_AND_ORIGINAL_ACCOUNT_CONFIRMATION_REQUIRED');
 blockers.push('INDEPENDENT_MULTI_SURFACE_PURGE_CONFIRMATION_REQUIRED');
 blockers.push('ORIGINAL_DEVICE_SESSION_AND_INDEPENDENT_WITNESS_VERIFICATION_REQUIRED');
 blockers.push('PAYMENT_SETTLEMENT_BOOKING_CAUSAL_METHOD_INDEPENDENT_VERIFICATION_REQUIRED');
 return {build:917,source:'original_rosie_private_database',software_state:'EVIDENCE_REVIEW_AVAILABLE',
  business_state:'HOLD',overall_green:false,source_no_pii:true,provider_native_takedown_verified:false,
  worldwide_recall_verified:false,two_party_original_device_verified:false,causal_revenue_verified:false,
  revenue_attributed_cents:null,incremental_sales:null,roas:null,
  counts:{native_staff_submissions:native.length,surface_staff_observations:surface.length,
   distinct_second_staff_reports:device.length,financial_documentary_chains:finance.length},
  blockers};
}
