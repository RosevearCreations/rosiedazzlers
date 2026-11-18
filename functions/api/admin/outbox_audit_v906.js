// Build 906 read-only lifecycle + THIRD signed supervisor audit, NO SEND.
// A customer communication provider is not called by this route.
import {staff904,rawBooking904,source904,state904} from './outbox_manual_review_v904.js';
import {serviceHeaders,isUuid} from '../_lib/staff-auth.js';
import {privateRows901} from '../_lib/jobday-safety-v901.js';
import {sameOrigin811} from '../client/worksite_issues_v811.js';
import {validId900} from '../../../assets/build900-workforce-safety.mjs';
import {revalidate904,CHANNELS904} from '../../../assets/build904-manual-review.mjs';
import {reconcile905} from '../../../assets/build905-outbox-evidence.mjs';
import {project906,normalize906} from '../../../assets/build906-evidence-lifecycle.mjs';
const TABLE905='rosie_manual_contact_evidence_v905',TABLE906='rosie_contact_evidence_audit_v906';
const FIELDS905='id,booking_id,exception_id,manual_authority_id,related_contact_id,event_kind,channel,occurred_at,outcome,evidence_basis,decision,source_state,staff_user_id,recorded_at,internal_only,automatic_send_enabled,provider_delivery_claimed,customer_contact_proven';
const FIELDS906='id,client_request_id,booking_id,exception_id,manual_authority_id,contact_receipt_id,staff_user_id,channel,decision,source_state,consent_preference_id,note,recorded_at,internal_only,automatic_send_enabled,provider_delivery_verified,customer_contact_proven';
const json=(payload,status=200)=>new Response(JSON.stringify(payload),{status,headers:{
 'Content-Type':'application/json; charset=utf-8','Cache-Control':'private,no-store',
 'X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','X-Robots-Tag':'noindex,nofollow'}});
const deny=()=>json({ok:false,error:'No provider sends or customer contact are available here.'},405);
export const onRequestOptions=deny,onRequestPut=deny,onRequestPatch=deny,onRequestDelete=deny;
async function source(env,booking_id,exception_id){
 const booking=await rawBooking904(env,booking_id);if(!booking)return null;
 const d=await source904(env,booking),s=state904(d,booking,exception_id);if(!s)return null;
 const report904=s.report904,authority=report904.authority_id;
 const [r905,r906]=authority?await Promise.all([
   privateRows901(env,TABLE905+'?select='+FIELDS905+'&booking_id=eq.'+booking_id+
    '&exception_id=eq.'+exception_id+'&manual_authority_id=eq.'+authority+'&order=recorded_at.desc&limit=150',150),
   privateRows901(env,TABLE906+'?select='+FIELDS906+'&booking_id=eq.'+booking_id+
    '&exception_id=eq.'+exception_id+'&manual_authority_id=eq.'+authority+'&order=recorded_at.desc&limit=140',140)
 ]):[[],[]];
 const report905=reconcile905({report904,receipts905:r905});
 const channels=Object.fromEntries(CHANNELS904.map(channel=>{
  const r=revalidate904({booking,profile:d.consent.profile,preference:d.consent.preference,channel});
  return [channel,{allowed:r.allowed===true,reason:r.reason}];
 }));
 const report906=project906({report904,report905,receipts905:r905,reviews906:r906,channels});
 return {booking,s,report904,report905,report906,r905,r906};
}
export async function onRequestGet({request,env}){
 const staff=await staff904(request,env);if(!staff.ok)return staff.response;
 const u=new URL(request.url),booking_id=u.searchParams.get('booking_id'),exception_id=u.searchParams.get('exception_id');
 if(!validId900(booking_id)||!validId900(exception_id))return json({ok:false,error:'Original booking and exception required.'},400);
 try{
  const d=await source(env,booking_id,exception_id);if(!d)return json({ok:false,error:'Original source unavailable.'},404);
  return json({ok:true,report906:d.report906,report905_state:d.report905.state,
   actor_id:staff.actor.id,original_owner_id:d.report904.owner_staff_user_id,
   previous_reviewer_id:d.report904.review_actor_id,
   history:d.r906.map(x=>({id:x.id,staff_user_id:x.staff_user_id,decision:x.decision,
    channel:x.channel,recorded_at:x.recorded_at})),
   customer_pii_exposed:false,provider_delivery_verified:false,automatic_send:false});
 }catch{return json({ok:false,error:'Evidence lifecycle source incomplete. Audit HOLD; no message sent.'},503);}
}
export async function onRequestPost({request,env}){
 if(!sameOrigin811(request))return json({ok:false,error:'Original same-origin staff session required.'},403);
 if(!(request.headers.get('content-type')||'').toLowerCase().startsWith('application/json'))
  return json({ok:false,error:'JSON required.'},415);
 const staff=await staff904(request,env);if(!staff.ok)return staff.response;
 const raw=await request.text().catch(()=>'');
 if(raw.length>1400)return json({ok:false,error:'Signed review request too large.'},413);
 let input;try{input=JSON.parse(raw)}catch{return json({ok:false,error:'Invalid JSON.'},400)}
 const p=normalize906(input);if(!p.ok)return json({ok:false,error:p.error},400);
 try{
  const existing=await privateRows901(env,TABLE906+'?select='+FIELDS906+'&client_request_id=eq.'+p.client_request_id+'&limit=2',2);
  if(existing.length){
   const x=existing[0],same=x.booking_id===p.booking_id&&x.exception_id===p.exception_id&&
    x.manual_authority_id===p.authority_id&&x.contact_receipt_id===p.contact_receipt_id&&
    x.staff_user_id===staff.actor.id&&x.decision===p.decision&&x.note===p.note;
   return same?json({ok:true,receipt_id:x.id,duplicate:true,source_recorded:true,provider_calls:0,
      customer_contact_proven:false}):
     json({ok:false,error:'Signed request ID already belongs to another audit.'},409);
  }
  const d=await source(env,p.booking_id,p.exception_id);if(!d||
   d.report904.authority_id!==p.authority_id||d.report906.contact_receipt_id!==p.contact_receipt_id)
   return json({ok:false,error:'Original signed authority and contact reference missing.'},409);
  const actor=staff.actor.id;
  if([d.report904.owner_staff_user_id,d.report904.review_actor_id].includes(actor))
   return json({ok:false,error:'Third independent supervisor is required; owner and prior reviewer cannot self-audit.'},403);
  if(!d.report906.can_review||(p.decision==='corroborated'&&!d.report906.can_corroborate))
   return json({ok:false,error:'Current consent/source or review expiry HOLD. Record only a HOLD if eligible.'},409);
  const contact=d.r905.find(x=>x.id===p.contact_receipt_id&&x.event_kind==='attest_contact');
  if(!contact||contact.channel!==d.report904.channel)
   return json({ok:false,error:'Original contact channel cannot be reconciled.'},409);
  const row={client_request_id:p.client_request_id,booking_id:p.booking_id,exception_id:p.exception_id,
   manual_authority_id:p.authority_id,contact_receipt_id:p.contact_receipt_id,staff_user_id:actor,
   channel:contact.channel,decision:p.decision,source_state:d.report906.state,
   consent_preference_id:d.report904.consent?.version_id||null,
   note:p.note,internal_only:true,automatic_send_enabled:false,provider_delivery_verified:false,
   customer_contact_proven:false,physical_safety_certified:false};
  const result=await fetch(env.SUPABASE_URL+'/rest/v1/'+TABLE906+'?select=id',{
    method:'POST',redirect:'error',headers:{...serviceHeaders(env),Prefer:'return=representation'},
    body:JSON.stringify([row])});
  if(result.status===409)return json({ok:false,error:'Concurrent source audit conflict; reload current evidence.'},409);
  if(!result.ok)return json({ok:false,error:'Original independent audit failed; no delivery performed.'},503);
  const saved=await result.json().catch(()=>null);
  if(!Array.isArray(saved)||!isUuid(saved[0]?.id))
   return json({ok:false,error:'Audit readback missing; verify original source.'},503);
  return json({ok:true,receipt_id:saved[0].id,source_recorded:true,independent_staff_review_only:true,
   provider_calls:0,automatic_send:false,customer_contact_proven:false,delivery_verified:false},201);
 }catch{return json({ok:false,error:'Original independent source could not be verified. No send.'},503);}
}
