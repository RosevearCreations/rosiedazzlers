import {requireStaffAccess,serviceHeaders,json} from '../_lib/staff-auth.js';
import {providerCrossCheck,sha256} from './gift_issuance_recovery_decisions.js';

const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SESSION=/^cs_(?:test|live)_[a-zA-Z0-9_-]{8,220}$/;
function privateResponse(response){
  const headers=new Headers(response.headers);
  headers.set('Cache-Control','no-store, private');
  headers.set('Referrer-Policy','no-referrer');
  headers.set('X-Content-Type-Options','nosniff');
  return new Response(response.body,{status:response.status,headers});
}
async function owner(request,env){
  const auth=await requireStaffAccess({request,env,allowLegacyAdminFallback:false});
  if(!auth.ok)return {ok:false,response:auth.response};
  if(auth.auth_mode!=='session'||!auth.actor?.is_admin||!UUID.test(String(auth.actor.id||'')))
    return {ok:false,response:json({ok:false,error:'A signed-in owner is required.'},403)};
  return {ok:true,actor:auth.actor};
}
async function rows(env,path){
  const response=await fetch(`${env.SUPABASE_URL}/rest/v1/${path}`,{
    headers:serviceHeaders(env),redirect:'error',signal:AbortSignal.timeout(8500)});
  if(!response.ok)throw Error('Current gift evidence unavailable');
  const found=await response.json();
  if(!Array.isArray(found))throw Error('Invalid gift evidence');
  return found;
}
export function giftReleasePreview(gift,renewal,existing,recurrence=false,now=Date.now()){
  const delivery=gift?.purchase_context?.gift_delivery||{};
  const priorSend=!!delivery.sent_at||!!delivery.notification_event_id||
    !!delivery.copy_notification_event_id||delivery.delivery_status!=='pending'||
    delivery.recipient_provider_status!=='not_submitted'||
    delivery.purchaser_copy_status!=='not_submitted';
  const eligible=!!gift&&gift.status==='active'&&!existing&&!priorSend&&!recurrence&&
    renewal?.event_kind==='owner_hold_continuity_acknowledged'&&
    !renewal.recurrence_detected&&
    ['followup_proof_aged','owner_requested_renewal'].includes(renewal.reason)&&
    Number.isFinite(Date.parse(renewal.provider_checked_at))&&
    now-Date.parse(renewal.provider_checked_at)<2*3600000;
  const effective=!!existing&&!recurrence&&renewal?.id===existing.renewal_event_id&&
    now-Date.parse(renewal.provider_checked_at)<2*3600000;
  return {candidate:eligible,previously_released:!!existing,
    release_review_current:effective,
    warning:existing?(effective?'Owner release receipt recorded for this certificate. Recheck delivery before any separate send.':
      'Historical release receipt is no longer current. Stop and renew independent verification.'):
      priorSend?'Delivery was attempted, queued, changed or not fully recorded. Keep review required.':
      recurrence?'New recurrence requires fresh independent verification.':
      eligible?'Owner may verify this single certificate again and request a release; database makes final decision.':
        'Independent evidence missing or aged. Continue individual verification.'};
}
export async function onRequestGet({request,env}){
  const auth=await owner(request,env);if(!auth.ok)return privateResponse(auth.response);
  const session=String(new URL(request.url).searchParams.get('session_id')||'').trim();
  if(!SESSION.test(session))return privateResponse(json({ok:false,
    error:'Enter one gift checkout session ID to review individual certificates.'},400));
  try{
    const cs=await rows(env,`gift_issuance_review_cases?select=id,stripe_session_id,status,updated_at&stripe_session_id=eq.${encodeURIComponent(session)}&limit=1`);
    if(!cs.length)return privateResponse(json({ok:true,build:684,case:null,gifts:[],
      safe_boundary:'No verified recovery case exists for this session; no release is possible.'}));
    const c=cs[0];
    const [renewals,recurrences,gifts,releases]=await Promise.all([
      rows(env,`gift_issuance_hold_renewal_events?select=id,case_id,event_kind,reason,recurrence_detected,provider_checked_at,created_at&case_id=eq.${c.id}&order=created_at.desc,id.desc&limit=1`),
      rows(env,`gift_issuance_review_followup_events?select=id,event_kind,created_at&case_id=eq.${c.id}&event_kind=eq.recurrence_opened&order=created_at.desc,id.desc&limit=1`),
      rows(env,`gift_certificates?select=id,status,checkout_line_number,purchase_context&stripe_session_id=eq.${encodeURIComponent(session)}&order=checkout_line_number.asc&limit=100`),
      rows(env,`gift_issuance_verified_release_events?select=id,case_id,certificate_id,renewal_event_id,created_at&case_id=eq.${c.id}&order=created_at.desc&limit=100`)
    ]);
    const latest=renewals[0]||null;
    const recurrence=!!latest&&!!recurrences[0]&&
      Date.parse(recurrences[0].created_at)>Date.parse(latest.created_at);
    return privateResponse(json({ok:true,build:684,case:{id:c.id,status:c.status},
      latest_renewal:latest&&{id:latest.id,event_kind:latest.event_kind,
        reason:latest.reason,provider_checked_at:latest.provider_checked_at},
      gifts:gifts.map(g=>({id:g.id,checkout_line_number:g.checkout_line_number,
        ...giftReleasePreview(g,latest,releases.find(r=>r.certificate_id===g.id),recurrence)})),
      release_receipts:releases.map(r=>({id:r.id,certificate_id:r.certificate_id,
        renewal_event_id:r.renewal_event_id,created_at:r.created_at})),
      safe_boundary:'One certificate at a time. Release is an auditable owner decision; no email, SMS, resend, duplicate charge, balance change or integration event. Final checks run inside the database.'}));
  }catch{return privateResponse(json({ok:false,
    error:'Verification records unavailable. No certificate has been released.'},503));}
}
export async function onRequestPost({request,env}){
  const origin=request.headers.get('origin');
  if(origin&&origin!==new URL(request.url).origin||request.headers.get('sec-fetch-site')==='cross-site')
    return privateResponse(json({ok:false,error:'Cross-origin release refused.'},403));
  const auth=await owner(request,env);if(!auth.ok)return privateResponse(auth.response);
  const b=await request.json().catch(()=>({}));
  if(!['event_id','case_id','certificate_id','renewal_event_id'].every(k=>UUID.test(String(b[k]||'')))||
     !SESSION.test(String(b.session_id||''))||b.confirm_single_certificate_release!==true||
     b.confirm_no_prior_send!==true)
    return privateResponse(json({ok:false,
      error:'One verified certificate, owner release confirmation and no-prior-send confirmation are required.'},400));
  try{
    const cases=await rows(env,`gift_issuance_review_cases?select=id,stripe_session_id&id=eq.${b.case_id}&limit=1`);
    if(cases[0]?.stripe_session_id!==b.session_id)
      return privateResponse(json({ok:false,error:'Certificate session and review case do not match.'},409));
    const evidence=await providerCrossCheck(env,b.session_id);
    if(evidence.check!=='paid_verified')return privateResponse(json({ok:false,
      error:'Current Stripe payment could not be independently confirmed; release refused.'},409));
    const fingerprint=await sha256({sessionId:b.session_id,check:evidence.check,
      paymentStatus:evidence.payment_status,sessionStatus:evidence.session_status,
      live:evidence.livemode,count:evidence.expected_count,total:evidence.amount_cents,
      paymentIntent:evidence.payment_intent,currency:evidence.currency});
    const response=await fetch(`${env.SUPABASE_URL}/rest/v1/rpc/record_gift_verified_release`,{
      method:'POST',redirect:'error',signal:AbortSignal.timeout(8500),
      headers:serviceHeaders(env),body:JSON.stringify({p_event_id:b.event_id,
        p_case_id:b.case_id,p_certificate_id:b.certificate_id,
        p_renewal_id:b.renewal_event_id,p_actor_id:auth.actor.id,
        p_provider_check:evidence.check,p_payment_intent:evidence.payment_intent,
        p_currency:evidence.currency,p_expected_count:evidence.expected_count,
        p_amount_cents:evidence.amount_cents,p_evidence_sha256:fingerprint,
        p_checked_at:evidence.checked_at})});
    if(!response.ok)return privateResponse(json({ok:false,
      error:'Database rejected release: evidence changed, delivery already attempted, recurrence reopened, or certificate previously released.'},409));
    const result=await response.json();
    return privateResponse(json({ok:true,build:684,result,
      customer_messages_sent:0,payment_mutations:0,gift_balance_mutations:0,
      integration_events_dispatched:0,
      next_step:result?.idempotent?'Prior decision receipt returned; refresh before any manual action.':
        'This one certificate is released for a separate owner-managed delivery review. Nothing was sent or charged.'}));
  }catch{return privateResponse(json({ok:false,
    error:'Release verification unavailable; no customer action authorized.'},503));}
}
