// Build 910: read-only customer quote readiness and private-media source snapshot receipts.
// A receipt describes what Rosie observed; it does NOT prove storage expiry or deletion.
import {validateStructuredQuoteTerms,hashStructuredQuoteTerms,compareAcceptedTermsToCurrentPrice} from './quote-booking-terms.js';
const SHA=/^[a-f0-9]{64}$/;
export async function evaluateQuoteReadiness910(q,currentPrice,existingBooking=null,now=Date.now()){
 const base={state:'HOLD',booking_created:false,payment_attempted:false,slot_checked:false,
  address_checked:false,waiver_checked:false,requires_staff_confirmation:true,
  current_price_checked:false,reason:'Original source evidence incomplete'};
 if(!q||q.acceptance_status!=='accepted'||!q.accepted_at)
  return {...base,state:'AWAITING_ACCEPTANCE',reason:'Customer must first accept the exact staff-sent quote'};
 const accepted=q.accepted_terms;
 if(!accepted||!SHA.test(String(q.accepted_terms_hash||''))||
  !SHA.test(String(q.structured_terms_hash||'')))
  return {...base,state:'HOLD_SOURCE_MISMATCH',reason:'Original accepted terms or hashes are missing'};
 const acceptedHash=await hashStructuredQuoteTerms(accepted);
 if(acceptedHash!==q.accepted_terms_hash||acceptedHash!==q.structured_terms_hash)
  return {...base,state:'HOLD_SOURCE_MISMATCH',reason:'Accepted terms do not match the signed-off source version'};
 const termsCheck=validateStructuredQuoteTerms(accepted,now);
 if(!termsCheck.ok)return {...base,state:'HOLD_EXPIRED',reason:termsCheck.error};
 if(existingBooking)
  return {...base,state:'BOOKING_EXISTS',booking_created:true,reason:'An original booking already references this quote; no repeat checkout'};
 const compare=compareAcceptedTermsToCurrentPrice(accepted,currentPrice,now);
 if(!compare.ok)return {...base,state:'HOLD_REQUOTE',current_price_checked:true,
  reason:compare.error,reason_code:compare.code};
 return {...base,state:'READY_FOR_SCHEDULE_RECHECK',current_price_checked:true,
  reason:'Price matches current source; date, capacity, service area, waiver and deposit must still be revalidated',
  next_action:'Continue in the existing booking flow; do not reuse a quoted price as a checkout authorization'};
}
const hex=bytes=>Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');
export async function mediaRetentionReceipt910(rows,context,contextId){
 const eligible=(Array.isArray(rows)?rows:[]).filter(x=>x?.status==='uploaded'&&
  Number.isFinite(Date.parse(x.verified_at))&&
  (String(x.content_type||'').startsWith('image/')||String(x.content_type||'').startsWith('video/')))
  .sort((a,b)=>String(a.id).localeCompare(String(b.id)));
 const evidence=eligible.map(m=>[m.id,m.verified_at,m.linked_at||null,m.privacy_status||null,
  m.reviewed_at||null,m.upload_proof_hash||null]);
 const encoded=new TextEncoder().encode(JSON.stringify(['rosie.media.source.snapshot.v910',context,contextId,evidence]));
 const digest=hex(new Uint8Array(await crypto.subtle.digest('SHA-256',encoded)));
 return {receipt_kind:'private_media_source_snapshot_v910',
  source_revision_sha256:digest,verified_items:eligible.length,
  private_reviewed_items:eligible.filter(m=>m.privacy_status==='approved_private'&&!!m.reviewed_at).length,
  public_release_authorized:false,retention_policy_confirmed:false,
  storage_expiry_witnessed:false,storage_deletion_witnessed:false,
  retention_state:eligible.length?'HOLD_RETENTION_SOURCE_NOT_WITNESSED':'NO_VERIFIED_LINKED_MEDIA',
  help:'This receipt witnesses source metadata only; original storage retention/deletion requires independent operator evidence'};
}
