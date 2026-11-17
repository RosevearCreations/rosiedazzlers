// Rosie 905: source-linked consent invalidation and supervisor-reviewed manual evidence.
// No mail, SMS, telephony, retries, delivery provider or cross-master outbound code.
import {serviceHeaders,isUuid} from '../_lib/staff-auth.js';
import {sameOrigin811} from '../client/worksite_issues_v811.js';
import {validId900} from '../../../assets/build900-workforce-safety.mjs';
import {normalize905,reconcile905,withinManualAuthority905} from '../../../assets/build905-outbox-evidence.mjs';
import {privateRows901} from '../_lib/jobday-safety-v901.js';
import {staff904,rawBooking904,source904,state904} from './outbox_manual_review_v904.js';
const TABLE='rosie_manual_contact_evidence_v905';
const FIELDS='id,client_request_id,booking_id,exception_id,manual_authority_id,related_contact_id,event_kind,channel,occurred_at,outcome,evidence_basis,evidence_reference,decision,source_state,preference_id,staff_user_id,note,recorded_at,internal_only,automatic_send_enabled,provider_delivery_claimed,customer_contact_proven';
const reply=(obj,code=200)=>new Response(JSON.stringify(obj),{status:code,headers:{
 'Content-Type':'application/json; charset=utf-8','Cache-Control':'private,no-store','X-Content-Type-Options':'nosniff',
 'Referrer-Policy':'no-referrer','X-Robots-Tag':'noindex,nofollow'}});
const deny=()=>reply({ok:false,error:'Customer contact and outbound delivery are not implemented.'},405);
export const onRequestOptions=deny,onRequestPut=deny,onRequestPatch=deny,onRequestDelete=deny;
async function load(env,booking_id,exception_id){
 const booking=await rawBooking904(env,booking_id);
 if(!booking) return null;
 const d=await source904(env,booking),s=state904(d,booking,exception_id);
 if(!s)return null;
 const r=s.report904;
 const rows=r.authority_id?await privateRows901(env,TABLE+'?select='+FIELDS+
  '&booking_id=eq.'+booking_id+'&exception_id=eq.'+exception_id+
  '&manual_authority_id=eq.'+r.authority_id+'&order=recorded_at.desc&limit=150',150):[];
 const report905=reconcile905({report904:r,receipts905:rows});
 const authority=s.receipts.find(x=>x.id===r.authority_id&&x.event_kind==='authorize')||null;
 return {booking,d,s,rows,report905,authority};
}
export async function onRequestGet({request,env}){
 const auth=await staff904(request,env);if(!auth.ok)return auth.response;
 const u=new URL(request.url),booking_id=u.searchParams.get('booking_id'),exception_id=u.searchParams.get('exception_id');
 if(!validId900(booking_id)||!validId900(exception_id))
  return reply({ok:false,error:'Original booking and incident selection required.'},400);
 try{
  const q=await load(env,booking_id,exception_id);if(!q)return reply({ok:false,error:'Original source unavailable.'},404);
  const r=q.s.report904;
  return reply({ok:true,booking_id,exception_id,report904:{
   authority_id:r.authority_id,owner_staff_user_id:r.owner_staff_user_id,review_actor_id:r.review_actor_id,
   channel:r.channel,state:r.state,manual_review_ready:r.manual_review_ready,
   consent_allowed:r.consent?.allowed===true,consent_reason:r.consent?.reason,
   expires_at:r.authority_expires_at
  },report905:q.report905,actor_id:auth.actor.id,
   history:q.rows.map(x=>({id:x.id,event_kind:x.event_kind,decision:x.decision,
    occurred_at:x.occurred_at,recorded_at:x.recorded_at,source_state:x.source_state,
    staff_user_id:x.staff_user_id,evidence_basis:x.evidence_basis,outcome:x.outcome})),
   customer_pii_exposed:false,provider_delivery_verified:false,automatic_send:false,provider_calls:0});
 }catch{return reply({ok:false,error:'Original consent or receipt source incomplete. Contact gate HOLD.'},503);}
}
export async function onRequestPost({request,env}){
 if(!sameOrigin811(request))return reply({ok:false,error:'Signed same-origin staff action required.'},403);
 if(!(request.headers.get('content-type')||'').toLowerCase().startsWith('application/json'))
  return reply({ok:false,error:'JSON required.'},415);
 const auth=await staff904(request,env);if(!auth.ok)return auth.response;
 const body=await request.text().catch(()=>'');
 if(body.length>1800)return reply({ok:false,error:'Evidence request too large.'},413);
 let input;try{input=JSON.parse(body)}catch{return reply({ok:false,error:'Invalid JSON.'},400)}
 const p=normalize905(input);if(!p.ok)return reply({ok:false,error:p.error},400);
 try{
  const existing=await privateRows901(env,TABLE+'?select='+FIELDS+'&client_request_id=eq.'+p.client_request_id+'&limit=2',2);
  if(existing.length){
   const x=existing[0];
   const kind=p.action==='invalidate'?'invalidate':p.action;
   const same=x.event_kind===kind&&x.booking_id===p.booking_id&&x.exception_id===p.exception_id&&
    x.manual_authority_id===p.authority_id&&x.staff_user_id===auth.actor.id&&x.note===p.note&&
    (p.action!=='attest_contact'||(x.channel===p.channel&&x.evidence_reference===p.evidence_reference&&x.outcome===p.outcome&&x.evidence_basis===p.evidence_basis&&Date.parse(x.occurred_at)===Date.parse(p.occurred_at)))&&
    (p.action!=='verify_contact'||(x.related_contact_id===p.contact_receipt_id&&x.decision===p.decision&&x.evidence_basis===p.evidence_basis));
   return same?reply({ok:true,source_recorded:true,duplicate:true,receipt_id:x.id,
    auto_send:false,provider_calls:0,delivery_verified:false}):
    reply({ok:false,error:'Request ID already used for different signed evidence.'},409);
  }
  const q=await load(env,p.booking_id,p.exception_id);
  if(!q||q.s.report904.authority_id!==p.authority_id||!q.authority)
   return reply({ok:false,error:'Original independent manual authority receipt unavailable.'},409);
  const r=q.s.report904,report=q.report905,actor=auth.actor.id;
  if(![r.owner_staff_user_id,r.review_actor_id].includes(actor))
   return reply({ok:false,error:'Only original signed owner or independent reviewer may reconcile evidence.'},403);
  let row={client_request_id:p.client_request_id,booking_id:p.booking_id,exception_id:p.exception_id,
   manual_authority_id:p.authority_id,staff_user_id:actor,event_kind:p.action,
   note:p.note,source_state:r.state,preference_id:r.consent?.version_id||null,
   internal_only:true,automatic_send_enabled:false,provider_delivery_claimed:false,
   customer_contact_proven:false,physical_safety_certified:false};
  if(p.action==='invalidate'){
   if(!report.can_record_invalidation)
    return reply({ok:false,error:'Current original source is not eligible for an invalidation observation.'},409);
  }else if(p.action==='attest_contact'){
   if(actor!==r.owner_staff_user_id||!report.can_record_manual_contact||
    r.channel!==p.channel||!withinManualAuthority905({authority:q.authority,occurred_at:p.occurred_at}))
    return reply({ok:false,error:'Manual contact attestation HOLD: source readiness, consent, authority interval or owner mismatch.'},409);
   row={...row,channel:p.channel,occurred_at:p.occurred_at,outcome:p.outcome,
    evidence_basis:p.evidence_basis,evidence_reference:p.evidence_reference};
  }else if(p.action==='verify_contact'){
   const contact=q.rows.find(x=>x.id===p.contact_receipt_id&&x.event_kind==='attest_contact');
   if(!report.consent_current||report.invalidation_count||!contact||
    q.rows.some(x=>x.event_kind==='verify_contact'&&x.related_contact_id===contact.id)||
    actor===contact.staff_user_id||actor!==r.review_actor_id||p.evidence_basis!==contact.evidence_basis)
    return reply({ok:false,error:'Independent manual evidence review HOLD: original source/consent or reviewer changed.'},409);
   row={...row,related_contact_id:contact.id,decision:p.decision,channel:contact.channel,
    evidence_basis:contact.evidence_basis};
  }
  const res=await fetch(env.SUPABASE_URL+'/rest/v1/'+TABLE+'?select=id',{
   method:'POST',redirect:'error',headers:{...serviceHeaders(env),Prefer:'return=representation'},
   body:JSON.stringify([row])});
  if(res.status===409)return reply({ok:false,error:'Concurrent signed evidence conflict; refresh source.'},409);
  if(!res.ok)return reply({ok:false,error:'Original append-only evidence was not recorded. No send performed.'},503);
  const saved=await res.json().catch(()=>null);
  if(!Array.isArray(saved)||!isUuid(saved[0]?.id))
   return reply({ok:false,error:'Evidence readback missing; inspect original source.'},503);
  return reply({ok:true,receipt_id:saved[0].id,source_recorded:true,action:p.action,
   evidence_scope:'signed staff attestation only',customer_contact_proven:false,
   delivery_verified:false,auto_send:false,provider_calls:0,master_send_count:0},201);
 }catch{return reply({ok:false,error:'Original source verification failed; NO customer contact was initiated.'},503);}
}
