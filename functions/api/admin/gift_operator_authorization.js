import {requireStaffAccess,serviceHeaders,json} from '../_lib/staff-auth.js';
import {providerCrossCheck,sha256} from './gift_issuance_recovery_decisions.js';

const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SESSION=/^cs_(?:test|live)_[a-zA-Z0-9_-]{8,220}$/;
const stamp=value=>{const n=Date.parse(value||'');return Number.isFinite(n)?n:0;};
function privateResponse(response){const h=new Headers(response.headers);
  h.set('Cache-Control','no-store, private');h.set('Referrer-Policy','no-referrer');
  h.set('X-Content-Type-Options','nosniff');
  return new Response(response.body,{status:response.status,headers:h});}
async function staff(request,env){
  const auth=await requireStaffAccess({request,env,allowLegacyAdminFallback:false});
  if(!auth.ok)return {ok:false,response:auth.response};
  if(auth.auth_mode!=='session'||!UUID.test(String(auth.actor?.id||''))||
     !(auth.actor.is_admin||['senior_detailer','detailer'].includes(auth.actor.role_code)))
    return {ok:false,response:json({ok:false,error:'Signed-in detailing staff access required.'},403)};
  return {ok:true,actor:auth.actor};
}
async function rows(env,path){const r=await fetch(`${env.SUPABASE_URL}/rest/v1/${path}`,{
  headers:serviceHeaders(env),redirect:'error',signal:AbortSignal.timeout(8500)});
  if(!r.ok)throw Error('Gift operator proof unavailable');const found=await r.json();
  if(!Array.isArray(found))throw Error('Malformed proof');return found;}
export function operatorReadiness(gift,release,handoff,authorization,renewal,
  recurrence,paid,now=Date.now()){
  const d=gift?.purchase_context?.gift_delivery||{};
  const attempted=d.delivery_status!=='pending'||d.recipient_provider_status!=='not_submitted'||
    d.purchaser_copy_status!=='not_submitted'||!!d.sent_at||!!d.notification_event_id||
    !!d.copy_notification_event_id;
  const sourceCurrent=!!release&&!!handoff&&!!renewal&&
    release.id===handoff.release_event_id&&release.renewal_event_id===renewal.id&&
    stamp(release.created_at)>now-2*3600000&&
    stamp(handoff.created_at)>now-2*3600000&&
    stamp(renewal.provider_checked_at)>now-2*3600000;
  const canAuthorize=!!gift&&gift.status==='active'&&!authorization&&
    sourceCurrent&&!attempted&&!recurrence&&paid;
  const currentOperatorReview=!!authorization&&sourceCurrent&&!attempted&&!recurrence&&paid&&
    stamp(authorization.expires_at)>now;
  return {can_authorize:canAuthorize,has_manual_handoff:!!handoff,
    authorization_recorded:!!authorization,
    authorization_id:authorization?.id||null,
    authorized_operator_id:authorization?.operator_staff_user_id||null,
    authorization_expires_at:authorization?.expires_at||null,
    operator_review_current:currentOperatorReview,
    handoff_event_id:handoff?.id||null,
    warning:authorization?(currentOperatorReview?
      'Operator preparation assignment recorded. No send is authorized; separate final verification is required.':
      'Historical operator authorization is no longer current. Stop and independently reassess; never reuse an expired assignment.'):
      !handoff?'Complete the verified Build 685 manual handoff first.':
      recurrence?'Gift recovery recurrence reopened; stop operator preparation.':
      attempted?'Delivery was sent, queued or changed; stop and investigate.':
      !paid?'Current Stripe payment verification failed; stop.':
      !sourceCurrent?'Release/handoff evidence expired or superseded. New independent review is required.':
      'Owner can assign one active operator to prepare this certificate. Final database validation still applies; nothing sends.'};
}
export async function onRequestGet({request,env}){
  const auth=await staff(request,env);if(!auth.ok)return privateResponse(auth.response);
  const session=String(new URL(request.url).searchParams.get('session_id')||'').trim();
  if(!SESSION.test(session))return privateResponse(json({ok:false,error:'Enter one exact gift checkout session ID.'},400));
  try{
    const cases=await rows(env,`gift_issuance_review_cases?select=id,stripe_session_id,status&stripe_session_id=eq.${encodeURIComponent(session)}&limit=1`);
    if(!cases.length)return privateResponse(json({ok:true,build:686,case:null,
      gifts:[],operators:[],safe_boundary:'No verified handoff exists; no operator action authorized.'}));
    const c=cases[0];
    const [renewals,recurrences,gifts,releases,handoffs,assignments,operators,paid]=await Promise.all([
      rows(env,`gift_issuance_hold_renewal_events?select=id,created_at,provider_checked_at&case_id=eq.${c.id}&order=created_at.desc,id.desc&limit=1`),
      rows(env,`gift_issuance_review_followup_events?select=id,created_at&case_id=eq.${c.id}&event_kind=eq.recurrence_opened&order=created_at.desc,id.desc&limit=1`),
      rows(env,`gift_certificates?select=id,status,checkout_line_number,purchase_context&stripe_session_id=eq.${encodeURIComponent(session)}&order=checkout_line_number.asc&limit=100`),
      rows(env,`gift_issuance_verified_release_events?select=id,certificate_id,renewal_event_id,created_at&case_id=eq.${c.id}&limit=100`),
      rows(env,`gift_issuance_manual_delivery_handoffs?select=id,certificate_id,release_event_id,created_at&case_id=eq.${c.id}&limit=100`),
      rows(env,`gift_issuance_delivery_operator_authorizations?select=id,certificate_id,operator_staff_user_id,expires_at,created_at&case_id=eq.${c.id}&limit=100`),
      auth.actor.is_admin?rows(env,"staff_users?select=id,full_name,role_code&is_active=eq.true&role_code=in.(admin,senior_detailer,detailer)&order=full_name.asc&limit=100"):
        Promise.resolve([]),
      providerCrossCheck(env,session).catch(()=>({check:'unavailable'}))
    ]);
    const latest=renewals[0]||null;
    const recurrence=!!latest&&!!recurrences[0]&&stamp(recurrences[0].created_at)>stamp(latest.created_at);
    const operator=auth.actor.id;
    const allowedGifts=auth.actor.is_admin?gifts:gifts.filter(g=>assignments.some(a=>
      a.certificate_id===g.id&&a.operator_staff_user_id===operator));
    return privateResponse(json({ok:true,build:686,case:{id:c.id,status:c.status},
      is_owner:!!auth.actor.is_admin,payment_verified:paid.check==='paid_verified',
      operators:operators.filter(x=>x.id!==operator).map(x=>({id:x.id,
        display_name:x.full_name||'Staff operator',role_code:x.role_code})),
      gifts:allowedGifts.map(g=>({id:g.id,checkout_line_number:g.checkout_line_number,
        ...operatorReadiness(g,releases.find(r=>r.certificate_id===g.id),
          handoffs.find(h=>h.certificate_id===g.id),
          assignments.find(a=>a.certificate_id===g.id),latest,
          recurrence||c.status!=='ready_for_delivery_review',paid.check==='paid_verified')})),
      safe_boundary:'Preparation only. No customer email/SMS, send queue, charge, refund, balance change or integration event.'}));
  }catch{return privateResponse(json({ok:false,error:'Unable to independently validate operator readiness; no action authorized.'},503));}
}
export async function onRequestPost({request,env}){
  const origin=request.headers.get('origin');
  if((origin&&origin!==new URL(request.url).origin)||request.headers.get('sec-fetch-site')==='cross-site')
    return privateResponse(json({ok:false,error:'Cross-origin operator authorization refused.'},403));
  const auth=await staff(request,env);if(!auth.ok)return privateResponse(auth.response);
  if(!auth.actor.is_admin)return privateResponse(json({ok:false,error:'Only an owner can assign an operator.'},403));
  const b=await request.json().catch(()=>({}));
  if(!['event_id','handoff_event_id','case_id','certificate_id','operator_staff_user_id']
       .every(k=>UUID.test(String(b[k]||'')))||!SESSION.test(String(b.session_id||''))||
     b.operator_staff_user_id===auth.actor.id||b.confirm_one_certificate!==true||
     b.confirm_no_prior_send!==true||b.confirm_preparation_only!==true)
    return privateResponse(json({ok:false,
      error:'One separate operator, exact handoff and all three owner confirmations are required.'},400));
  try{
    const cases=await rows(env,`gift_issuance_review_cases?select=id,stripe_session_id&id=eq.${b.case_id}&limit=1`);
    if(cases[0]?.stripe_session_id!==b.session_id)
      return privateResponse(json({ok:false,error:'Session and gift recovery case do not match.'},409));
    const evidence=await providerCrossCheck(env,b.session_id);
    if(evidence.check!=='paid_verified')return privateResponse(json({ok:false,
      error:'Current Stripe paid evidence not independently verified. No operator assignment.'},409));
    const fingerprint=await sha256({sessionId:b.session_id,check:evidence.check,
      paymentStatus:evidence.payment_status,sessionStatus:evidence.session_status,
      live:evidence.livemode,count:evidence.expected_count,total:evidence.amount_cents,
      paymentIntent:evidence.payment_intent,currency:evidence.currency});
    const r=await fetch(`${env.SUPABASE_URL}/rest/v1/rpc/record_gift_delivery_operator_authorization`,{
      method:'POST',headers:serviceHeaders(env),redirect:'error',signal:AbortSignal.timeout(8500),
      body:JSON.stringify({p_event_id:b.event_id,p_handoff_id:b.handoff_event_id,
        p_case_id:b.case_id,p_certificate_id:b.certificate_id,p_owner_id:auth.actor.id,
        p_operator_id:b.operator_staff_user_id,p_provider_check:evidence.check,
        p_payment_intent:evidence.payment_intent,p_currency:evidence.currency,
        p_expected_count:evidence.expected_count,p_amount_cents:evidence.amount_cents,
        p_evidence_sha256:fingerprint,p_checked_at:evidence.checked_at})});
    if(!r.ok)return privateResponse(json({ok:false,
      error:'Database refused: invalid operator, stale proof, prior delivery, recurrence, changed receipt or duplicate assignment.'},409));
    const result=await r.json();
    return privateResponse(json({ok:true,build:686,result,customer_messages_sent:0,
      payment_mutations:0,gift_balance_mutations:0,integration_events_dispatched:0,
      next_step:'One operator preparation assignment recorded for 15 minutes. NO customer delivery, queue or payment occurred.'}));
  }catch{return privateResponse(json({ok:false,
    error:'Operator evidence unavailable; no assignment, send or charge authorized.'},503));}
}
