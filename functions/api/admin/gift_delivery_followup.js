import {requireStaffAccess,serviceHeaders,json} from '../_lib/staff-auth.js';
import {sha256} from './gift_issuance_recovery_decisions.js';

const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SESSION=/^cs_(?:test|live)_[A-Za-z0-9_-]{8,220}$/;
const REFERENCE=/^[A-Z0-9_-]{6,64}$/;
const ROLES=['admin','senior_detailer','detailer'];
const ACTIONS={
  owner_followup_assignment:{roles:['admin'],decisions:['review_assigned'],sources:['internal_exception_note']},
  independent_recipient_recheck:{roles:ROLES,
    decisions:['recipient_evidence_supported','recipient_not_confirmed','conflicting_evidence'],
    sources:['recipient_direct_reply','verified_phone_conversation','provider_dashboard_reference','internal_exception_note','recipient_reported_missing']},
  owner_no_resend_closeout:{roles:['admin'],
    decisions:['confirmed_no_resend_closed','unconfirmed_no_resend_closed'],sources:['internal_exception_note']}
};
function answer(body,status=200){const r=json(body,status),headers=new Headers(r.headers);
  headers.set('Cache-Control','no-store, private');headers.set('Referrer-Policy','no-referrer');
  headers.set('X-Content-Type-Options','nosniff');return new Response(r.body,{status:r.status,headers});}
async function staff(request,env){
  const a=await requireStaffAccess({request,env,allowLegacyAdminFallback:false});
  if(!a.ok)return {ok:false,response:a.response};
  if(a.auth_mode!=='session'||!UUID.test(String(a.actor?.id||''))||
     !ROLES.includes(a.actor.role_code))
    return {ok:false,response:answer({ok:false,error:'Signed-in active staff required.'},403)};
  return {ok:true,actor:a.actor};
}
async function rows(env,path){const response=await fetch(`${env.SUPABASE_URL}/rest/v1/${path}`,
  {headers:serviceHeaders(env),redirect:'error',signal:AbortSignal.timeout(8500)});
  if(!response.ok)throw Error('Gift follow-up evidence temporarily unavailable');
  const result=await response.json();if(!Array.isArray(result))throw Error('Invalid follow-up data');return result;}
function mask(value){return String(value||'').replace(/^(.)([^@]*)(@.*)$/,'$1***$3');}
export function followupReadiness(attempt,base=[],events=[],actor=null,now=Date.now()){
  const triage=base.find(r=>r.event_kind==='owner_provider_outcome_triage');
  const confirmed=base.find(r=>r.event_kind==='owner_recipient_confirmation');
  const escalation=base.find(r=>r.event_kind==='owner_no_resend_escalation');
  const assign=events.find(r=>r.event_kind==='owner_followup_assignment');
  const recheck=events.find(r=>r.event_kind==='independent_recipient_recheck');
  const closure=events.find(r=>r.event_kind==='owner_no_resend_closeout');
  const baseAgeHours=triage?Math.max(0,Math.floor((now-Date.parse(triage.created_at))/3600000)):null;
  const assignmentAgeHours=assign?Math.max(0,Math.floor((now-Date.parse(assign.created_at))/3600000)):null;
  const reviewAgeHours=recheck?Math.max(0,Math.floor((now-Date.parse(recheck.created_at))/3600000)):null;
  const isOwner=!!actor?.is_admin;
  return {provider_outcome:attempt.status,triage_age_hours:baseAgeHours,
    assignment_age_hours:assignmentAgeHours,review_age_hours:reviewAgeHours,
    overdue_followup:!!triage&&!closure&&baseAgeHours>=24,
    assigned_reviewer_id:assign?.reviewer_staff_user_id||null,
    can_assign:!!triage&&!assign&&isOwner,
    can_review:!!assign&&!recheck&&assign.reviewer_staff_user_id===actor?.id&&
      assignmentAgeHours!==null&&assignmentAgeHours<336,
    can_close:!!recheck&&!closure&&isOwner&&reviewAgeHours!==null&&reviewAgeHours<24&&
      recheck.decision_code!=='conflicting_evidence'&&
      ((recheck.decision_code==='recipient_evidence_supported'&&!!confirmed)||
       (recheck.decision_code==='recipient_not_confirmed'&&!!escalation&&!confirmed)),
    suggested_decisions:recheck?.decision_code==='recipient_evidence_supported'&&confirmed?
      ['confirmed_no_resend_closed']:recheck?.decision_code==='recipient_not_confirmed'&&escalation&&!confirmed?
      ['unconfirmed_no_resend_closed']:[],
    recipient_confirmation_exists:!!confirmed,no_resend_escalation_exists:!!escalation,
    followup_events:events.map(e=>({id:e.id,event_kind:e.event_kind,decision_code:e.decision_code,
      evidence_kind:e.evidence_kind,evidence_reference:e.evidence_reference,
      observed_at:e.observed_at,created_at:e.created_at})),
    warning:closure?'Independent follow-up safely closed. Original send slot remains consumed forever.':
      recheck?.decision_code==='conflicting_evidence'?'Independent reviewer found conflict. Do not close or resend.':
      baseAgeHours>=24?'Follow-up evidence is at least 24 hours old; review or escalate without sending.':
      'One-time dispatch is irreversible. Only genuine independent evidence allows a safe internal closure.'};
}
export async function onRequestGet({request,env}){
  const auth=await staff(request,env);if(!auth.ok)return auth.response;
  const session=String(new URL(request.url).searchParams.get('session_id')||'').trim();
  if(!SESSION.test(session))return answer({ok:false,error:'Exact checkout session ID required.'},400);
  try{
    const cases=await rows(env,`gift_issuance_review_cases?select=id,stripe_session_id&stripe_session_id=eq.${encodeURIComponent(session)}&limit=1`);
    if(!cases.length)return answer({ok:true,build:689,case:null,gifts:[],reviewers:[],safe_boundary:'No gift follow-up exists.'});
    const c=cases[0];
    const gifts=await rows(env,`gift_certificates?select=id,checkout_line_number,recipient_email&stripe_session_id=eq.${encodeURIComponent(session)}&limit=100`);
    const attempts=gifts.length?await rows(env,`gift_issuance_one_time_dispatch_attempts?select=id,certificate_id,status,operator_staff_user_id&certificate_id=in.(${gifts.map(g=>g.id).join(',')})&limit=100`):[];
    const ids=attempts.map(x=>x.id);
    const base=ids.length?await rows(env,`gift_issuance_delivery_outcome_reviews?select=id,attempt_id,event_kind,decision_code,created_at&attempt_id=in.(${ids.join(',')})&limit=300`):[];
    const events=ids.length?await rows(env,`gift_issuance_delivery_followup_reviews?select=id,attempt_id,event_kind,decision_code,reviewer_staff_user_id,evidence_kind,evidence_reference,observed_at,created_at&attempt_id=in.(${ids.join(',')})&limit=300`):[];
    const reviewers=auth.actor.is_admin?await rows(env,'staff_users?select=id,full_name,role_code&is_active=eq.true&role_code=in.(admin,senior_detailer,detailer)&limit=100'):[];
    return answer({ok:true,build:689,case:{id:c.id},is_owner:!!auth.actor.is_admin,
      actor_id:auth.actor.id,
      reviewers:reviewers.filter(x=>x.id!==auth.actor.id),
      gifts:gifts.flatMap(g=>{const a=attempts.find(x=>x.certificate_id===g.id);
        if(!a)return [];
        const ev=events.filter(x=>x.attempt_id===a.id);
        const assigned=ev.find(x=>x.event_kind==='owner_followup_assignment');
        if(!auth.actor.is_admin&&assigned?.reviewer_staff_user_id!==auth.actor.id)return [];
        return [{id:g.id,checkout_line_number:g.checkout_line_number,
          recipient_email_masked:mask(g.recipient_email),attempt_id:a.id,
          original_operator_id:a.operator_staff_user_id,
          ...followupReadiness(a,base.filter(x=>x.attempt_id===a.id),ev,auth.actor)}];}),
      safe_boundary:'Read-only review plus append-only decisions. No provider contacts, emails, SMS, resend, Stripe calls, certificate changes or cross-business data.'});
  }catch{return answer({ok:false,error:'Independent follow-up evidence unavailable. Nothing sent.'},503);}
}
export async function onRequestPost({request,env}){
  const origin=request.headers.get('origin');
  if((origin&&origin!==new URL(request.url).origin)||request.headers.get('sec-fetch-site')==='cross-site')
    return answer({ok:false,error:'Cross-origin evidence entry refused.'},403);
  const auth=await staff(request,env);if(!auth.ok)return auth.response;
  const b=await request.json().catch(()=>({}));const rule=ACTIONS[b.event_kind];
  const when=Date.parse(b.observed_at||'');
  if(!SESSION.test(String(b.session_id||''))||
     ![b.case_id,b.certificate_id,b.attempt_id,b.review_id].every(v=>UUID.test(String(v||'')))||
     !rule?.roles.includes(auth.actor.role_code)||!rule.decisions.includes(b.decision_code)||
     !rule.sources.includes(b.evidence_kind)||!REFERENCE.test(String(b.evidence_reference||''))||
     !Number.isFinite(when)||when>Date.now()+30000||when<Date.now()-30*86400000||
     !UUID.test(String(b.reviewer_id||''))||
     b.confirm_exact_attempt!==true||b.confirm_genuine_evidence!==true||
     b.confirm_permanent_no_resend!==true)
    return answer({ok:false,error:'Exact assignment, dated evidence, independent role and all three no-resend confirmations required.'},400);
  if(b.event_kind==='independent_recipient_recheck'&&b.decision_code==='recipient_evidence_supported'&&
     !['recipient_direct_reply','verified_phone_conversation'].includes(b.evidence_kind))
    return answer({ok:false,error:'A provider receipt is not a recipient acknowledgment.'},400);
  try{
    const cases=await rows(env,`gift_issuance_review_cases?select=id,stripe_session_id&id=eq.${b.case_id}&limit=1`);
    if(cases[0]?.stripe_session_id!==b.session_id)
      return answer({ok:false,error:'Review case does not match checkout session.'},409);
    const fingerprint=await sha256({session:b.session_id,case_id:b.case_id,certificate_id:b.certificate_id,
      attempt_id:b.attempt_id,actor:auth.actor.id,reviewer:b.reviewer_id,event_kind:b.event_kind,
      decision:b.decision_code,kind:b.evidence_kind,reference:b.evidence_reference,
      observed_at:new Date(when).toISOString()});
    const response=await fetch(`${env.SUPABASE_URL}/rest/v1/rpc/record_gift_delivery_followup_review`,{
      method:'POST',headers:serviceHeaders(env),redirect:'error',signal:AbortSignal.timeout(8500),
      body:JSON.stringify({p_id:b.review_id,p_case_id:b.case_id,p_certificate_id:b.certificate_id,
        p_attempt_id:b.attempt_id,p_actor_id:auth.actor.id,p_reviewer_id:b.reviewer_id,
        p_event_kind:b.event_kind,p_decision_code:b.decision_code,p_evidence_kind:b.evidence_kind,
        p_evidence_reference:b.evidence_reference,p_evidence_sha256:fingerprint,
        p_observed_at:new Date(when).toISOString()})});
    if(!response.ok)return answer({ok:false,error:'Independent follow-up safeguard refused this record. No resend or charge occurred.'},409);
    return answer({ok:true,build:689,result:await response.json(),customer_messages_sent:0,
      next_step:'Refresh to verify the append-only record. The original one-time dispatch cannot be repeated.'});
  }catch{return answer({ok:false,error:'Owner follow-up receipt unavailable; no contact, retry or payment occurred.'},503);}
}
