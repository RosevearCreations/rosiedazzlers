// Rosie 905: original 904 authority reconciliation; never sends or verifies provider delivery.
import {validId900} from './build900-workforce-safety.mjs';
import {CHANNELS904,MANUAL_WINDOW_MS904} from './build904-manual-review.mjs';
const kinds=['invalidate','attest_contact','verify_contact'];
const bases=['call_log','sent_folder','sms_log','customer_ack'];
const outcomes=['attempted','reached','voicemail'];
const decisions=['corroborated','hold'];
const keys={
 invalidate:['action','client_request_id','booking_id','exception_id','authority_id','note'],
 attest_contact:['action','client_request_id','booking_id','exception_id','authority_id','channel','occurred_at','outcome','evidence_basis','evidence_reference','note'],
 verify_contact:['action','client_request_id','booking_id','exception_id','authority_id','contact_receipt_id','decision','evidence_basis','note']
};
export function normalize905(x){
 if(!x||typeof x!=='object'||Array.isArray(x)||!keys[x.action]||Object.keys(x).some(k=>!keys[x.action].includes(k)))
  return {ok:false,error:'Unsupported operation or privileged delivery field.'};
 if(!['client_request_id','booking_id','exception_id','authority_id'].every(k=>validId900(x[k]))||
  typeof x.note!=='string'||x.note.trim().length<12||x.note.trim().length>350)
  return {ok:false,error:'Original UUIDs and signed 12–350 character reason required.'};
 if(x.action==='attest_contact'&&(!CHANNELS904.includes(x.channel)||!outcomes.includes(x.outcome)||
   !bases.includes(x.evidence_basis)||!Number.isFinite(Date.parse(x.occurred_at||''))||
   typeof x.evidence_reference!=='string'||!/^[A-Za-z0-9._:-]{8,80}$/.test(x.evidence_reference)))
  return {ok:false,error:'Manual channel, occurrence time, outcome and non-PII evidence ID required.'};
 if(x.action==='verify_contact'&&(!validId900(x.contact_receipt_id)||!decisions.includes(x.decision)||
   !bases.includes(x.evidence_basis)))
  return {ok:false,error:'Exact prior contact attestation and independent evidence review required.'};
 return {...x,ok:true,note:x.note.trim()};
}
export function reconcile905({report904,receipts905=[],now=new Date()}={}){
 if(!report904||!Array.isArray(receipts905)||receipts905.length>=160||!Number.isFinite(new Date(now).getTime()))
  throw Error('Original review source unavailable or incomplete');
 const rows=[...receipts905].sort((a,b)=>String(a.recorded_at).localeCompare(String(b.recorded_at))||String(a.id).localeCompare(String(b.id)));
 for(const x of rows){
  if(!validId900(x.id)||!validId900(x.staff_user_id)||!validId900(x.manual_authority_id)||
   !validId900(x.booking_id)||!validId900(x.exception_id)||!kinds.includes(x.event_kind)||
   !Number.isFinite(Date.parse(x.recorded_at||''))||
   x.booking_id!==report904.booking_id||x.exception_id!==report904.exception_id||
   x.manual_authority_id!==report904.authority_id||x.internal_only!==true||
   x.provider_delivery_claimed!==false||x.automatic_send_enabled!==false)
   throw Error('Untrusted source reconciliation receipt');
 }
 const invalidations=rows.filter(x=>x.event_kind==='invalidate');
 const contacts=rows.filter(x=>x.event_kind==='attest_contact');
 const reviews=rows.filter(x=>x.event_kind==='verify_contact');
 for(const x of reviews){
  const c=contacts.find(y=>y.id===x.related_contact_id);
  if(!c||c.staff_user_id===x.staff_user_id||c.channel!==x.channel||c.evidence_basis!==x.evidence_basis)
   throw Error('Untrusted independent manual evidence review');
 }
 for(const x of contacts){
  if(x.staff_user_id!==report904.owner_staff_user_id||x.channel!==report904.channel||
   !Number.isFinite(Date.parse(x.occurred_at||''))||!bases.includes(x.evidence_basis))
   throw Error('Untrusted original manual contact attestation');
 }
 const consentCurrent=report904.manual_review_ready===true&&report904.consent?.allowed===true;
 const authorityHold=!consentCurrent||invalidations.length>0;
 const latestContact=contacts.at(-1)||null;
 const latestReview=latestContact?reviews.filter(x=>x.related_contact_id===latestContact.id).at(-1)||null:null;
 let status=authorityHold?'CONSENT_OR_AUTHORITY_HOLD':latestReview?.decision==='corroborated'?
  'INDEPENDENT_ATTESTATION_REVIEWED_NO_DELIVERY_PROOF':latestReview?.decision==='hold'?
  'INDEPENDENT_REVIEW_HOLD':latestContact?'MANUAL_CONTACT_ATTESTED_PENDING_REVIEW':'AWAITING_MANUAL_CONTACT';
 return {schema:'rosie.outbox.manual-evidence.v905',booking_id:report904.booking_id,
  exception_id:report904.exception_id,authority_id:report904.authority_id,
  consent_current:consentCurrent,invalidation_count:invalidations.length,
  manual_contact_attestation_id:latestContact?.id||null,independent_review_id:latestReview?.id||null,
  state:status,can_record_manual_contact:consentCurrent&&!invalidations.length&&!latestContact,
  can_record_invalidation:!!report904.authority_id&&!consentCurrent&&!invalidations.length,
  independent_staff_reviewed:status==='INDEPENDENT_ATTESTATION_REVIEWED_NO_DELIVERY_PROOF',
  authority:{internal_only:true,automatic_send:false,provider_calls:0,delivery_verified:false,
   customer_contact_proven:false,manual_staff_attestation_only:true,source_contact_consent_required:true}};
}
export function withinManualAuthority905({authority,occurred_at,now=new Date()}={}){
 const t=Date.parse(occurred_at||''),start=Date.parse(authority?.recorded_at||''),current=new Date(now).getTime();
 return Number.isFinite(t)&&Number.isFinite(start)&&Number.isFinite(current)&&t>=start&&
  t<=start+MANUAL_WINDOW_MS904&&t<=current&&current<=start+MANUAL_WINDOW_MS904;
}
