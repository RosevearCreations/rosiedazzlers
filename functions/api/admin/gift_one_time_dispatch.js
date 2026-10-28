import {requireStaffAccess,serviceHeaders,json} from '../_lib/staff-auth.js';
import {providerCrossCheck,sha256} from './gift_issuance_recovery_decisions.js';
import {buildGiftDeliveryPayload,parseGiftDeliveryContext} from '../_lib/gift-delivery.js';
import {dispatchNotificationThroughProvider} from '../_lib/provider-dispatch.js';
import {loadRecoverySettings} from '../_lib/app-settings.js';

const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SESSION=/^cs_(?:test|live)_[a-zA-Z0-9_-]{8,220}$/;
const stamp=v=>Number.isFinite(Date.parse(v||''))?Date.parse(v):0;
const maskEmail=v=>String(v||'').replace(/^(.)([^@]*)(@.*)$/,'$1***$3');
function providerReference(response){
  const raw=response&&typeof response==='object'?
    response.message_id||response.id||response.request_id||null:null;
  const ref=typeof raw==='string'?raw.trim():'';
  return ref.length<=160&&/^[a-zA-Z0-9._:-]+$/.test(ref)?ref:null;
}
function privateResponse(response){const h=new Headers(response.headers);
  h.set('Cache-Control','no-store, private');h.set('Referrer-Policy','no-referrer');
  h.set('X-Content-Type-Options','nosniff');return new Response(response.body,{status:response.status,headers:h});}
async function staff(request,env){
  const auth=await requireStaffAccess({request,env,allowLegacyAdminFallback:false});
  if(!auth.ok)return {ok:false,response:auth.response};
  if(auth.auth_mode!=='session'||!UUID.test(String(auth.actor?.id||''))||
     !(auth.actor.is_admin||['senior_detailer','detailer'].includes(auth.actor.role_code)))
    return {ok:false,response:json({ok:false,error:'Signed-in detailing staff required.'},403)};
  return {ok:true,actor:auth.actor};
}
async function rows(env,path){const r=await fetch(`${env.SUPABASE_URL}/rest/v1/${path}`,{
  headers:serviceHeaders(env),redirect:'error',signal:AbortSignal.timeout(8500)});
  if(!r.ok)throw Error('Gift dispatch evidence unavailable');
  const v=await r.json();if(!Array.isArray(v))throw Error('Invalid dispatch evidence');return v;}
async function rpc(env,name,body){const r=await fetch(`${env.SUPABASE_URL}/rest/v1/rpc/${name}`,{
  method:'POST',headers:serviceHeaders(env),redirect:'error',signal:AbortSignal.timeout(8500),
  body:JSON.stringify(body)});
  if(!r.ok)throw Error('Atomic database safeguard refused this action. Recheck the evidence; do not send again.');
  return r.json();}
function fingerprint(e,sessionId){return sha256({sessionId,check:e.check,
  paymentStatus:e.payment_status,sessionStatus:e.session_status,
  live:e.livemode,count:e.expected_count,total:e.amount_cents,
  paymentIntent:e.payment_intent,currency:e.currency});}
async function providerEvidence(env,sessionId){const e=await providerCrossCheck(env,sessionId);
  if(e.check!=='paid_verified')throw Error('Stripe payment evidence is not freshly verified. No send permitted.');
  return {e,hash:await fingerprint(e,sessionId)};}
export function oneTimeReadiness(gift,authorization,approval,attempt,paid,now=Date.now()){
  const d=gift?.purchase_context?.gift_delivery||{};
  const untouched=d.delivery_status==='pending'&&d.recipient_provider_status==='not_submitted'&&
    d.purchaser_copy_status==='not_submitted'&&!d.sent_at&&!d.notification_event_id;
  return {can_owner_approve:!!gift&&gift.status==='active'&&!!authorization&&!approval&&
      !attempt&&untouched&&paid&&stamp(authorization.expires_at)>now,
    can_operator_dispatch:!!approval&&!attempt&&untouched&&paid&&
      stamp(approval.expires_at)>now,
    outcome:attempt?.status||'not_dispatched',
    receipt_id:attempt?.id||null,notification_event_id:attempt?.notification_event_id||null,
    approval_id:approval?.id||null,authorization_id:authorization?.id||null,
    assigned_operator_id:approval?.operator_staff_user_id||authorization?.operator_staff_user_id||null,
    warning:attempt?attempt.status==='provider_accepted'? 'Provider accepted one email. Inbox delivery is not confirmed. Never resend from this screen.':
      'One dispatch slot was consumed. Provider outcome requires review; never repeat the send.':
      approval?'Owner approved once. Assigned operator must act within five minutes and independently recheck the send.':
      !authorization?'Build 686 operator preparation assignment required.':
      !untouched?'Prior send or changed delivery state found. Stop; reconcile.':
      !paid?'Fresh paid evidence unavailable.':
      'Owner may approve one manual email. A separate assigned operator will make the final dispatch.'};
}
export async function onRequestGet({request,env}){
  const access=await staff(request,env);if(!access.ok)return privateResponse(access.response);
  const session=String(new URL(request.url).searchParams.get('session_id')||'').trim();
  if(!SESSION.test(session))return privateResponse(json({ok:false,error:'Enter an exact gift checkout session ID.'},400));
  try{
    const cs=await rows(env,`gift_issuance_review_cases?select=id,status,stripe_session_id&stripe_session_id=eq.${encodeURIComponent(session)}&limit=1`);
    if(!cs.length)return privateResponse(json({ok:true,build:687,case:null,gifts:[],safe_boundary:'No verified case; no send permitted.'}));
    const c=cs[0];
    const [gifts,auths,approvals,paid]=await Promise.all([
      rows(env,`gift_certificates?select=id,status,checkout_line_number,recipient_email,purchase_context&stripe_session_id=eq.${encodeURIComponent(session)}&order=checkout_line_number.asc&limit=100`),
      rows(env,`gift_issuance_delivery_operator_authorizations?select=id,certificate_id,operator_staff_user_id,expires_at&case_id=eq.${c.id}&limit=100`),
      rows(env,`gift_issuance_one_time_dispatch_approvals?select=id,certificate_id,operator_staff_user_id,expires_at&case_id=eq.${c.id}&limit=100`),
      providerCrossCheck(env,session).catch(()=>({check:'unavailable'}))]);
    const attempts=gifts.length?await rows(env,`gift_issuance_one_time_dispatch_attempts?select=id,certificate_id,notification_event_id,status&certificate_id=in.(${gifts.map(g=>g.id).join(',')})&limit=100`):[];
    const filtered=access.actor.is_admin?gifts:gifts.filter(g=>
      auths.some(a=>a.certificate_id===g.id&&a.operator_staff_user_id===access.actor.id));
    return privateResponse(json({ok:true,build:687,case:{id:c.id,status:c.status},
      is_owner:!!access.actor.is_admin,payment_verified:paid.check==='paid_verified',
      gifts:filtered.map(g=>({id:g.id,checkout_line_number:g.checkout_line_number,
        recipient_email_masked:maskEmail(g.recipient_email),
        ...oneTimeReadiness(g,auths.find(a=>a.certificate_id===g.id),
          approvals.find(a=>a.certificate_id===g.id),
          attempts.find(a=>a.certificate_id===g.id),paid.check==='paid_verified'&&
          c.status==='ready_for_delivery_review'),
        is_assigned_operator:approvals.some(a=>a.certificate_id===g.id&&
          a.operator_staff_user_id===access.actor.id)})),
      safe_boundary:'One recipient email only. No purchaser copy, SMS, automatic retries, charges, replacements or balance changes.'}));
  }catch{return privateResponse(json({ok:false,error:'Independent gift evidence unavailable; no send allowed.'},503));}
}
export async function onRequestPost({request,env}){
  const origin=request.headers.get('origin');
  if((origin&&origin!==new URL(request.url).origin)||request.headers.get('sec-fetch-site')==='cross-site')
    return privateResponse(json({ok:false,error:'Cross-origin gift dispatch refused.'},403));
  const access=await staff(request,env);if(!access.ok)return privateResponse(access.response);
  const b=await request.json().catch(()=>({}));
  if(!SESSION.test(String(b.session_id||''))||!UUID.test(String(b.case_id||''))||
     !UUID.test(String(b.certificate_id||'')))
    return privateResponse(json({ok:false,error:'One exact case, checkout and gift certificate are required.'},400));
  if(!['approve','dispatch'].includes(b.action))
    return privateResponse(json({ok:false,error:'Choose owner approval or assigned operator dispatch.'},400));
  if(b.action==='approve'&&(!access.actor.is_admin||!UUID.test(String(b.approval_id||''))||
     !UUID.test(String(b.authorization_id||''))||b.confirm_exact_recipient!==true||
     b.confirm_no_prior_send!==true||b.confirm_owner_dispatch_approval!==true))
    return privateResponse(json({ok:false,error:'Owner and all three one-time dispatch confirmations required.'},403));
  if(b.action==='dispatch'&&(!UUID.test(String(b.approval_id||''))||
     !UUID.test(String(b.attempt_id||''))||!UUID.test(String(b.notification_id||''))||
     b.confirm_final_recipient!==true||b.confirm_irreversible_send!==true))
    return privateResponse(json({ok:false,error:'Assigned operator and final one-time send confirmations required.'},400));
  let slotConsumed=false;
  try{
    const cs=await rows(env,`gift_issuance_review_cases?select=id,stripe_session_id&id=eq.${b.case_id}&limit=1`);
    if(cs[0]?.stripe_session_id!==b.session_id)return privateResponse(json({ok:false,error:'Case and checkout session mismatch.'},409));
    const {e,hash}=await providerEvidence(env,b.session_id);
    if(b.action==='approve'){
      const result=await rpc(env,'record_gift_one_time_dispatch_approval',{
        p_id:b.approval_id,p_case_id:b.case_id,p_certificate_id:b.certificate_id,
        p_authorization_id:b.authorization_id,p_owner_id:access.actor.id,p_provider_check:e.check,
        p_payment_intent:e.payment_intent,p_currency:e.currency,p_expected_count:e.expected_count,
        p_amount_cents:e.amount_cents,p_evidence_sha256:hash,p_checked_at:e.checked_at});
      return privateResponse(json({ok:true,build:687,result,customer_messages_sent:0,
        next_step:'Owner approved once. Assigned operator must separately click Send one gift email within five minutes.'}));
    }
    // Fail before reserving the only attempt if no active provider bridge exists.
    const settings=await loadRecoverySettings(env).catch(()=>null);
    if(settings?.recovery_provider_rules?.email?.enabled===false||
       !(env.NOTIFICATIONS_EMAIL_WEBHOOK_URL||env.RECOVERY_EMAIL_WEBHOOK_URL))
      return privateResponse(json({ok:false,error:'Email provider not configured or disabled. No send slot consumed.'},409));
    const gifts=await rows(env,`gift_certificates?select=id,status,code,type,package_code,vehicle_size,remaining_cents,face_value_cents,expires_at,purchaser_email,recipient_name,recipient_email,purchase_context&stripe_session_id=eq.${encodeURIComponent(b.session_id)}&id=eq.${b.certificate_id}&limit=1`);
    const gift=gifts[0];
    if(!gift?.recipient_email)return privateResponse(json({ok:false,error:'Recipient missing; no send slot consumed.'},409));
    const info=parseGiftDeliveryContext(gift);
    const payload=buildGiftDeliveryPayload(gift,
      String(env.SITE_ORIGIN||new URL(request.url).origin).replace(/\/+$/,''),{},info);
    await rpc(env,'claim_gift_one_time_dispatch',{
      p_attempt_id:b.attempt_id,p_notification_id:b.notification_id,p_approval_id:b.approval_id,
      p_case_id:b.case_id,p_certificate_id:b.certificate_id,
      p_operator_id:access.actor.id,p_provider_check:e.check,p_evidence_sha256:hash,
      p_checked_at:e.checked_at,p_subject:payload.subject,p_body_text:payload.body_text,
      p_body_html:payload.body_html});
    slotConsumed=true;
    // Read back the claimed event. Sending never proceeds on an unverified claim.
    const events=await rows(env,`notification_events?select=id,event_type,channel,recipient_email,subject,body_text,body_html,payload,status,attempt_count&id=eq.${b.notification_id}&limit=1`);
    const event=events[0];
    if(event?.id!==b.notification_id||event.status!=='processing'||
       event.recipient_email!==gift.recipient_email||
       event.payload?.attempt_id!==b.attempt_id)throw Error('Reserved notification disagrees; send held for reconciliation.');
    let outcome='outcome_unknown',dispatch;
    try{
      dispatch=await dispatchNotificationThroughProvider(env,event);
      outcome=dispatch.ok?'provider_accepted':
        (Number(dispatch.status)>=400&&Number(dispatch.status)<500?'provider_rejected':'outcome_unknown');
    }catch(err){dispatch={ok:false,error:'Provider reply unavailable'};}
    let receipt;
    try{
      receipt=await rpc(env,'reconcile_gift_one_time_dispatch',{
        p_attempt_id:b.attempt_id,p_operator_id:access.actor.id,p_outcome:outcome,
        p_provider_key:String(dispatch.provider||'email').slice(0,80),
        p_http_status:Number.isInteger(dispatch.status)?dispatch.status:null,
        p_provider_reference:providerReference(dispatch.provider_response),
        p_receipt_sha256:await sha256({outcome,provider:dispatch.provider||null,
          status:dispatch.status||null,response:dispatch.provider_response||null,
          error:dispatch.ok?null:String(dispatch.error||'provider_error').slice(0,300)})});
    }catch{return privateResponse(json({ok:false,build:687,dispatch_slot_consumed:true,
      provider_outcome:outcome,error:'Provider call occurred but receipt persistence is unverified. Do not resend; reconcile with provider manually.'},503));}
    return privateResponse(json({ok:true,build:687,dispatch_slot_consumed:true,
      provider_accepted:outcome==='provider_accepted',inbox_delivered:false,
      provider_outcome:outcome,receipt,never_retry_automatically:true,
      next_step:outcome==='provider_accepted'?'Email provider accepted one send. Inbox delivery is not confirmed.':
        'Delivery provider outcome is not confirmed. Do not resend; owner reconciliation required.'}));
  }catch{return privateResponse(json({ok:false,build:687,dispatch_slot_consumed:slotConsumed,
    error:slotConsumed?'The one-time slot was consumed; outcome requires manual reconciliation. NEVER click send again.':
      'Final verification or reservation failed. No provider request was made by this handler, but refresh to check if a slot was reserved.'},slotConsumed?503:409));}
}
