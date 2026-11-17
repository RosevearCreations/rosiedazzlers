// Rosie 904 — independent supervisor review, current original consent, manual
// release-readiness evidence only. A receipt never sends or authorizes a provider API.
import {validId900} from './build900-workforce-safety.mjs';
import {evaluateConsent743} from './notification-consent-preview-v743.mjs';

const KINDS=Object.freeze(['submit','review','authorize','revoke']);
const KEYS={
 submit:['action','client_request_id','booking_id','exception_id','draft_id','channel','note'],
 review:['action','client_request_id','booking_id','exception_id','submission_id','decision','note'],
 authorize:['action','client_request_id','booking_id','exception_id','review_id','note'],
 revoke:['action','client_request_id','booking_id','exception_id','authority_id','note']
};
export const CHANNELS904=Object.freeze(['email','sms','phone']);
export const PURPOSE904='service';
export const MANUAL_WINDOW_MS904=15*60*1000;
const asc=(a,b)=>String(a.recorded_at).localeCompare(String(b.recorded_at))||String(a.id).localeCompare(String(b.id));
const latest=xs=>[...xs].sort((a,b)=>-asc(a,b))[0]||null;

export function normalize904(input){
 if(!input||typeof input!=='object'||Array.isArray(input))return {ok:false,error:'Invalid manual review request.'};
 const action=String(input.action||''),allowed=KEYS[action];
 if(!allowed||Object.keys(input).some(k=>!allowed.includes(k)))
  return {ok:false,error:'Unsupported action, purpose, sender, recipient or privileged field.'};
 if(!validId900(input.client_request_id)||!validId900(input.booking_id)||!validId900(input.exception_id)||
  typeof input.note!=='string'||input.note.trim().length<12||input.note.trim().length>350)
  return {ok:false,error:'Original IDs and 12–350 character signed reason required.'};
 const base={ok:true,action,client_request_id:input.client_request_id,booking_id:input.booking_id,
  exception_id:input.exception_id,note:input.note.trim()};
 if(action==='submit'){
  if(!validId900(input.draft_id)||!CHANNELS904.includes(input.channel))
   return {ok:false,error:'Exact UNSENT draft and supported manual contact channel required.'};
  return {...base,draft_id:input.draft_id,channel:input.channel};
 }
 if(action==='review'){
  if(!validId900(input.submission_id)||!['approved','hold'].includes(input.decision))
   return {ok:false,error:'Original submission and independent review decision required.'};
  return {...base,submission_id:input.submission_id,decision:input.decision};
 }
 if(action==='authorize'){
  if(!validId900(input.review_id))return {ok:false,error:'Exact independently approved review required.'};
  return {...base,review_id:input.review_id};
 }
 if(!validId900(input.authority_id))return {ok:false,error:'Exact original manual authority receipt required.'};
 return {...base,authority_id:input.authority_id};
}

// Fresh and explicit consent check. No implicit service opt-in: a versioned
// original TRUE channel preference is mandatory for any manual release-readiness.
export function revalidate904({booking,profile,preference,channel}={}){
 if(!booking||!validId900(booking.id)||!CHANNELS904.includes(channel))
  return {allowed:false,reason:'original_booking_or_channel_unavailable'};
 if(!validId900(booking.customer_profile_id)||!profile||profile.id!==booking.customer_profile_id||
  profile.is_active!==true||profile.archived_at||!profile.updated_at)
  return {allowed:false,reason:'original_customer_profile_missing_or_archived'};
 if(!preference||!validId900(preference.id)||preference.customer_profile_id!==profile.id||!preference.recorded_at)
  return {allowed:false,reason:'original_versioned_consent_missing'};
 if(preference['service_'+channel]!==true)return {allowed:false,reason:'explicit_service_channel_consent_missing'};
 const proof=evaluateConsent743({profile,preference,channel,purpose:PURPOSE904});
 return {allowed:proof.allowed===true,reason:proof.reason,
  customer_profile_id:profile.id,preference_id:preference.id,
  preference_recorded_at:preference.recorded_at,profile_updated_at:profile.updated_at,
  channel,purpose:PURPOSE904};
}

export function project904({booking,report903,receipts904=[],profile=null,preference=null,now=new Date()}={}){
 if(!booking||!validId900(booking.id)||!report903||!validId900(report903.exception_id)||
  report903.booking_id!==booking.id||!Array.isArray(receipts904)||receipts904.length>=180)
  throw Error('Original manual-outbox evidence unavailable or window incomplete');
 const nowMs=new Date(now).getTime();if(!Number.isFinite(nowMs))throw Error('Invalid independent clock');
 const rows=[...receipts904].sort(asc);
 const actions={submit:[],review:[],authorize:[],revoke:[]};
 for(const e of rows){
  if(!validId900(e.id)||e.booking_id!==booking.id||e.exception_id!==report903.exception_id||
    !KINDS.includes(e.event_kind)||!Number.isFinite(Date.parse(e.recorded_at||''))||
    !validId900(e.staff_user_id)||!CHANNELS904.includes(e.channel)||e.purpose!==PURPOSE904)
   throw Error('Malformed original independent review receipt');
  actions[e.event_kind].push(e);
 }
 const submission=latest(actions.submit);
 const review=submission?latest(actions.review.filter(x=>x.related_receipt_id===submission.id)):null;
 const authority=review?latest(actions.authorize.filter(x=>x.related_receipt_id===review.id)):null;
 const revoked=authority&&actions.revoke.some(x=>x.related_receipt_id===authority.id);
 // Keep all source custody constraints explicit, even if a forged insert exists.
 for(const x of actions.review){
  const s=actions.submit.find(e=>e.id===x.related_receipt_id);
  if(!s||s.staff_user_id===x.staff_user_id||x.channel!==s.channel||x.purpose!==s.purpose||
    x.draft_id!==s.draft_id)throw Error('Untrusted independent reviewer custody');
 }
 for(const x of actions.authorize){
  const r=actions.review.find(e=>e.id===x.related_receipt_id);
  const s=r&&actions.submit.find(e=>e.id===r.related_receipt_id);
  if(!r||r.decision!=='approved'||!s||x.staff_user_id!==s.staff_user_id||
   x.staff_user_id===r.staff_user_id||x.channel!==s.channel||x.draft_id!==s.draft_id)
   throw Error('Untrusted manual authorization custody');
 }
 for(const x of actions.revoke){
  const a=actions.authorize.find(e=>e.id===x.related_receipt_id);
  const r=a&&actions.review.find(e=>e.id===a.related_receipt_id);
  const s=r&&actions.submit.find(e=>e.id===r.related_receipt_id);
  if(!a||!s||![s.staff_user_id,r.staff_user_id].includes(x.staff_user_id))
   throw Error('Untrusted manual revocation');
 }
 const current=!!report903.owner_current&&report903.outbox?.id===submission?.draft_id&&
  report903.owner_staff_user_id===submission?.staff_user_id&&report903.owner_state==='OWNER_VERIFIED';
 const consent=revalidate904({booking,profile,preference,channel:submission?.channel||'email'});
 const snapshotMatch=!!submission&&consent.allowed===true&&
  [submission,review,authority].filter(Boolean).every(e=>e.customer_profile_id===consent.customer_profile_id&&
   e.preference_id===consent.preference_id&&e.profile_updated_at===consent.profile_updated_at);
 const reviewFresh=!!review&&Date.parse(review.recorded_at)>=nowMs-MANUAL_WINDOW_MS904&&
  Date.parse(review.recorded_at)<=nowMs;
 const authorityFresh=!!authority&&Date.parse(authority.recorded_at)>=nowMs-MANUAL_WINDOW_MS904&&
  Date.parse(authority.recorded_at)<=nowMs;
 const ready=!!authority&&!revoked&&review?.decision==='approved'&&current&&
  snapshotMatch&&reviewFresh&&authorityFresh;
 let status='NO_SUBMISSION';
 if(submission)status='PENDING_INDEPENDENT_REVIEW';
 if(submission&&!current)status='ORIGINAL_DRAFT_OR_OWNER_CHANGED_HOLD';
 else if(submission&&!consent.allowed)status='CONSENT_HOLD';
 else if(submission&&!snapshotMatch)status='CONSENT_VERSION_CHANGED_HOLD';
 else if(review?.decision==='hold')status='SUPERVISOR_HOLD';
 else if(review?.decision==='approved')status='REVIEWED_PENDING_OWNER_AUTHORITY';
 if(authority)status=revoked?'MANUAL_AUTHORITY_REVOKED':ready?'MANUAL_REVIEW_READY_NO_DELIVERY':'MANUAL_AUTHORITY_EXPIRED_OR_STALE_HOLD';
 return {schema:'rosie.outbox.manual-review.v904',booking_id:booking.id,exception_id:report903.exception_id,
  draft_id:submission?.draft_id||null,channel:submission?.channel||null,purpose:submission?.purpose||null,
  submission_id:submission?.id||null,review_id:review?.id||null,
  review_decision:review?.decision||null,authority_id:authority?.id||null,
  review_actor_id:review?.staff_user_id||null,owner_staff_user_id:report903.owner_staff_user_id||null,
  consent:{allowed:consent.allowed===true,reason:consent.reason,version_id:consent.preference_id||null,
   version_recorded_at:consent.preference_recorded_at||null,explicit_service_opt_in_required:true},
  state:status,manual_review_ready:ready,source_current:current,review_fresh:reviewFresh,
  authority_expires_at:authority?new Date(Date.parse(authority.recorded_at)+MANUAL_WINDOW_MS904).toISOString():null,
  authority:{manual_staff_review_only:true,outbound_send_enabled:false,provider_delivery_performed:false,
   customer_contact_executed:false,customer_consent_not_granted:true,
   separate_live_consent_check_required_before_any_future_contact:true,auto_send:false,
   job_dispatch_changed:false,physical_safety_approved:false,master_message_sent:false}};
}
