import {requireStaffAccess,serviceHeaders,json} from '../_lib/staff-auth.js';
import {providerCrossCheck,sha256} from './gift_issuance_recovery_decisions.js';

const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SESSION=/^cs_(?:test|live)_[a-zA-Z0-9_-]{8,220}$/;
const stamp=value=>{const n=Date.parse(value||'');return Number.isFinite(n)?n:0;};
function privateResponse(response){
  const h=new Headers(response.headers);h.set('Cache-Control','no-store, private');
  h.set('Referrer-Policy','no-referrer');h.set('X-Content-Type-Options','nosniff');
  return new Response(response.body,{status:response.status,headers:h});
}
async function owner(request,env){
  const auth=await requireStaffAccess({request,env,allowLegacyAdminFallback:false});
  if(!auth.ok)return {ok:false,response:auth.response};
  if(auth.auth_mode!=='session'||!auth.actor?.is_admin||!UUID.test(String(auth.actor.id||'')))
    return {ok:false,response:json({ok:false,error:'Signed-in owner access is required.'},403)};
  return {ok:true,actor:auth.actor};
}
async function rows(env,path){
  const r=await fetch(`${env.SUPABASE_URL}/rest/v1/${path}`,{
    headers:serviceHeaders(env),redirect:'error',signal:AbortSignal.timeout(8500)});
  if(!r.ok)throw Error('Gift verification records unavailable');
  const data=await r.json();if(!Array.isArray(data))throw Error('Malformed gift verification');
  return data;
}
export function handoffPreview(gift,release,handoff,renewal,recurrence,paid,now=Date.now()){
  const d=gift?.purchase_context?.gift_delivery||{};
  const priorSend=d.delivery_status!=='pending'||d.recipient_provider_status!=='not_submitted'||
    d.purchaser_copy_status!=='not_submitted'||!!d.sent_at||!!d.notification_event_id||
    !!d.copy_notification_event_id;
  const releaseCurrent=!!release&&!!renewal&&release.renewal_event_id===renewal.id&&
    stamp(release.created_at)>now-2*3600000&&
    stamp(renewal.provider_checked_at)>now-2*3600000;
  const candidate=!!gift&&gift.status==='active'&&releaseCurrent&&!handoff&&
    !priorSend&&!recurrence&&paid;
  return {candidate,has_release:!!release,previously_handed_off:!!handoff,
    handoff_receipt_id:handoff?.id||null,release_event_id:release?.id||null,
    warning:handoff?'Manual handoff receipt recorded once. No delivery was sent; recheck before any separate operator action.':
      !release?'No owner-verified individual release exists. Complete Build 684 first.':
      recurrence?'Recovery recurrence reopened. Stop manual delivery.':
      priorSend?'A message was sent, queued or its delivery state changed. Stop and investigate.':
      !paid?'Live provider payment could not be verified. Stop manual delivery.':
      !releaseCurrent?'Owner release receipt expired or superseded by a renewal. Reverify; never reuse historical clearance.':
      'Owner may acknowledge a one-time internal manual-delivery handoff. Database performs final checks; no message is sent.'};
}
export async function onRequestGet({request,env}){
  const auth=await owner(request,env);if(!auth.ok)return privateResponse(auth.response);
  const session=String(new URL(request.url).searchParams.get('session_id')||'').trim();
  if(!SESSION.test(session))return privateResponse(json({ok:false,error:'A gift checkout session ID is required.'},400));
  try{
    const cases=await rows(env,`gift_issuance_review_cases?select=id,stripe_session_id,status&stripe_session_id=eq.${encodeURIComponent(session)}&limit=1`);
    if(!cases.length)return privateResponse(json({ok:true,build:685,case:null,gifts:[],handoff_receipts:[],
      safe_boundary:'No independent release exists. No delivery is authorized.'}));
    const c=cases[0];
    const [renewals,recurrences,gifts,releases,handoffs,provider]=await Promise.all([
      rows(env,`gift_issuance_hold_renewal_events?select=id,case_id,created_at,provider_checked_at&case_id=eq.${c.id}&order=created_at.desc,id.desc&limit=1`),
      rows(env,`gift_issuance_review_followup_events?select=id,created_at&case_id=eq.${c.id}&event_kind=eq.recurrence_opened&order=created_at.desc,id.desc&limit=1`),
      rows(env,`gift_certificates?select=id,status,checkout_line_number,purchase_context&stripe_session_id=eq.${encodeURIComponent(session)}&order=checkout_line_number.asc&limit=100`),
      rows(env,`gift_issuance_verified_release_events?select=id,case_id,certificate_id,renewal_event_id,created_at&case_id=eq.${c.id}&order=created_at.desc&limit=100`),
      rows(env,`gift_issuance_manual_delivery_handoffs?select=id,case_id,release_event_id,certificate_id,created_at&case_id=eq.${c.id}&order=created_at.desc&limit=100`),
      providerCrossCheck(env,session).catch(()=>({check:'unavailable'}))
    ]);
    const renewal=renewals[0]||null;
    const recurrence=!!renewal&&!!recurrences[0]&&stamp(recurrences[0].created_at)>stamp(renewal.created_at);
    return privateResponse(json({ok:true,build:685,case:{id:c.id,status:c.status},
      payment_verified:provider.check==='paid_verified',
      gifts:gifts.map(g=>({id:g.id,checkout_line_number:g.checkout_line_number,
        ...handoffPreview(g,releases.find(r=>r.certificate_id===g.id),
          handoffs.find(h=>h.certificate_id===g.id),renewal,recurrence||c.status!=='ready_for_delivery_review',
          provider.check==='paid_verified')})),
      handoff_receipts:handoffs.map(h=>({id:h.id,certificate_id:h.certificate_id,
        release_event_id:h.release_event_id,created_at:h.created_at})),
      safe_boundary:'Internal owner handoff only. No send, resend, payment, gift balance, or cross-business dispatch.'}));
  }catch{return privateResponse(json({ok:false,error:'Cannot validate current release receipts; no handoff recorded.'},503));}
}
export async function onRequestPost({request,env}){
  const origin=request.headers.get('origin');
  if((origin&&origin!==new URL(request.url).origin)||request.headers.get('sec-fetch-site')==='cross-site')
    return privateResponse(json({ok:false,error:'Cross-origin handoff refused.'},403));
  const auth=await owner(request,env);if(!auth.ok)return privateResponse(auth.response);
  const b=await request.json().catch(()=>({}));
  if(!['event_id','release_event_id','case_id','certificate_id'].every(k=>UUID.test(String(b[k]||'')))||
     !SESSION.test(String(b.session_id||''))||b.confirm_manual_handoff!==true||
     b.confirm_no_delivery_attempt!==true||b.confirm_no_automatic_send!==true)
    return privateResponse(json({ok:false,
      error:'A released certificate and three explicit owner handoff confirmations are required.'},400));
  try{
    const cases=await rows(env,`gift_issuance_review_cases?select=id,stripe_session_id&id=eq.${b.case_id}&limit=1`);
    if(cases[0]?.stripe_session_id!==b.session_id)
      return privateResponse(json({ok:false,error:'Review case/session mismatch.'},409));
    const evidence=await providerCrossCheck(env,b.session_id);
    if(evidence.check!=='paid_verified')return privateResponse(json({ok:false,
      error:'Payment has not passed a fresh provider verification; handoff refused.'},409));
    const fingerprint=await sha256({sessionId:b.session_id,check:evidence.check,
      paymentStatus:evidence.payment_status,sessionStatus:evidence.session_status,
      live:evidence.livemode,count:evidence.expected_count,total:evidence.amount_cents,
      paymentIntent:evidence.payment_intent,currency:evidence.currency});
    const r=await fetch(`${env.SUPABASE_URL}/rest/v1/rpc/record_gift_manual_delivery_handoff`,{
      method:'POST',headers:serviceHeaders(env),redirect:'error',signal:AbortSignal.timeout(8500),
      body:JSON.stringify({p_event_id:b.event_id,p_release_id:b.release_event_id,
        p_case_id:b.case_id,p_certificate_id:b.certificate_id,p_actor_id:auth.actor.id,
        p_provider_check:evidence.check,p_payment_intent:evidence.payment_intent,
        p_currency:evidence.currency,p_expected_count:evidence.expected_count,
        p_amount_cents:evidence.amount_cents,p_evidence_sha256:fingerprint,
        p_checked_at:evidence.checked_at})});
    if(!r.ok)return privateResponse(json({ok:false,
      error:'Manual handoff declined: release expired, recurrence reopened, receipt drift, prior delivery or duplicate handoff.'},409));
    const result=await r.json();
    return privateResponse(json({ok:true,build:685,result,customer_messages_sent:0,
      payment_mutations:0,gift_balance_mutations:0,integration_events_dispatched:0,
      next_step:'Internal manual-delivery handoff recorded. No delivery happened. Separate freshly approved operator action required.'}));
  }catch{return privateResponse(json({ok:false,error:'Verification unavailable; no handoff or delivery authorized.'},503));}
}
