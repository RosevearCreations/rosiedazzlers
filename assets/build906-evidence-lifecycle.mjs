// Rosie 906 — privacy-preserving original contact-evidence review lifecycle.
// Historical staff observations are never provider receipts or authorization to send.
import {validId900} from './build900-workforce-safety.mjs';
export const REVIEW_WINDOW_MS906=24*60*60*1000;
export const RETENTION_REVIEW_DAYS906=90;
export const CONTACT_CHANNELS906=Object.freeze(['email','sms','phone']);
const UUID=validId900;
export function normalize906(x){
 const allow=['action','client_request_id','booking_id','exception_id','authority_id','contact_receipt_id','decision','note'];
 if(!x||typeof x!=='object'||Array.isArray(x)||x.action!=='review'||
  Object.keys(x).some(k=>!allow.includes(k)))return {ok:false,error:'Unsupported evidence operation or privileged field'};
 if(!['client_request_id','booking_id','exception_id','authority_id','contact_receipt_id'].every(k=>UUID(x[k]))||
  !['corroborated','hold'].includes(x.decision)||typeof x.note!=='string'||
  x.note.trim().length<12||x.note.trim().length>350)
  return {ok:false,error:'Signed source IDs, limited decision and reason required'};
 return {...x,note:x.note.trim(),ok:true};
}
export function project906({report904,report905,receipts905=[],reviews906=[],channels={},now=new Date()}={}){
 const nowMs=new Date(now).getTime();
 if(!report904||!report905||!Number.isFinite(nowMs)||
  !Array.isArray(receipts905)||receipts905.length>=160||!Array.isArray(reviews906)||reviews906.length>=150)
  throw Error('Incomplete original evidence lifecycle');
 const contact=receipts905.find(x=>x.id===report905.manual_contact_attestation_id&&x.event_kind==='attest_contact')||null;
 const contactTime=contact?Date.parse(contact.recorded_at):NaN;
 if(contact&&!Number.isFinite(contactTime))throw Error('Untrusted manual evidence clock');
 const reviewExpires=contact?new Date(contactTime+REVIEW_WINDOW_MS906).toISOString():null;
 const reviewDue=!!contact&&nowMs>contactTime+REVIEW_WINDOW_MS906;
 const ageDays=contact?Math.max(0,Math.floor((nowMs-contactTime)/86400000)):null;
 const retentionReviewDue=ageDays!==null&&ageDays>=RETENTION_REVIEW_DAYS906;
 const rows=[...reviews906].sort((a,b)=>String(a.recorded_at).localeCompare(String(b.recorded_at))||String(a.id).localeCompare(String(b.id)));
 for(const x of rows){
  if(!UUID(x.id)||!UUID(x.staff_user_id)||!UUID(x.booking_id)||!UUID(x.exception_id)||
   !UUID(x.manual_authority_id)||!UUID(x.contact_receipt_id)||!CONTACT_CHANNELS906.includes(x.channel)||
   !['corroborated','hold'].includes(x.decision)||!Number.isFinite(Date.parse(x.recorded_at||''))||
   x.booking_id!==report904.booking_id||x.exception_id!==report904.exception_id||
   x.manual_authority_id!==report904.authority_id||x.staff_user_id!==report904.review_actor_id||
   x.staff_user_id===report904.owner_staff_user_id||!contact||
   x.contact_receipt_id!==contact.id||x.channel!==report904.channel||
   x.internal_only!==true||x.provider_delivery_verified!==false||x.automatic_send_enabled!==false)
   throw Error('Untrusted independent lifecycle audit receipt');
 }
 const latest=rows.at(-1)||null;
 const crossChannels=CONTACT_CHANNELS906.map(channel=>{
  const source=channels?.[channel]||{};
  return {channel,explicit_current_consent:source.allowed===true,
   selected_by_original_authority:report904.channel===channel,
   eligible_for_manual_staff_review:source.allowed===true&&report904.channel===channel&&
    report904.manual_review_ready===true&&report905.consent_current===true&&report905.invalidation_count===0,
   verified_provider_delivery:false};
 });
 const staleSource=report904.manual_review_ready!==true||report905.consent_current!==true||
  report905.invalidation_count>0;
 const eligible=!!contact&&!staleSource&&!reviewDue&&!retentionReviewDue&&
  report905.independent_staff_reviewed===true&&
  crossChannels.some(x=>x.channel===contact.channel&&x.eligible_for_manual_staff_review);
 let lifecycle='AWAITING_ORIGINAL_CONTACT_EVIDENCE';
 if(contact) lifecycle='INDEPENDENT_AUDIT_PENDING';
 if(contact&&reviewDue) lifecycle='REVIEW_WINDOW_EXPIRED_HOLD';
 if(retentionReviewDue) lifecycle='RETENTION_REVIEW_DUE_HOLD';
 if(staleSource) lifecycle='CONSENT_OR_AUTHORITY_HOLD';
 if(latest?.decision==='hold')lifecycle='INDEPENDENT_AUDIT_HOLD';
 if(latest?.decision==='corroborated'&&eligible)lifecycle='INDEPENDENT_SOURCE_AUDIT_CORROBORATED_NOT_DELIVERED';
 if(latest?.decision==='corroborated'&&!eligible)lifecycle='PRIOR_AUDIT_STALE_HOLD';
 return {schema:'rosie.outbox.audit.v906',state:lifecycle,booking_id:report904.booking_id,
  exception_id:report904.exception_id,authority_id:report904.authority_id,
  contact_receipt_id:contact?.id||null,latest_audit_id:latest?.id||null,
  review_expires_at:reviewExpires,review_expired:reviewDue,retention_review_due:retentionReviewDue,
  age_days:ageDays,retention_review_days:RETENTION_REVIEW_DAYS906,
  can_review:!!contact&&!rows.length,can_corroborate:eligible&&!rows.length,
  cross_channel_audit:crossChannels,
  authority:{send_enabled:false,provider_delivery_verified:false,customer_contact_proven:false,
   historical_staff_review_only:true,no_automatic_purge:true,live_consent_always_required:true}};
}
