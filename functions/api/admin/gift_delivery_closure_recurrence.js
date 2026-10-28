import {requireStaffAccess,serviceHeaders,json} from '../_lib/staff-auth.js';
import {sha256} from './gift_issuance_recovery_decisions.js';

const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SESSION=/^cs_(?:test|live)_[A-Za-z0-9_-]{8,220}$/;
const REF=/^[A-Z0-9_-]{6,64}$/;
const ROLES=['admin','senior_detailer','detailer'];
const ACTIONS={
  owner_watch_opened:{roles:['admin'],decisions:['watch_requested'],sources:['internal_exception_note']},
  independent_recurrence_audited:{roles:ROLES,
    decisions:['no_recurrence_observed','recurrence_detected','evidence_missing'],
    sources:['provider_dashboard_reference','recipient_direct_reply','verified_phone_conversation',
      'recipient_reported_missing','internal_exception_note']},
  owner_no_resend_alert_ack:{roles:['admin'],decisions:['acknowledged_no_resend'],sources:['internal_exception_note']}
};
function reply(payload,status=200){const response=json(payload,status),headers=new Headers(response.headers);
  headers.set('Cache-Control','no-store, private');headers.set('Referrer-Policy','no-referrer');
  return new Response(response.body,{status:response.status,headers});}
async function auth(request,env){const a=await requireStaffAccess({request,env,allowLegacyAdminFallback:false});
  if(!a.ok)return {ok:false,response:a.response};
  if(a.auth_mode!=='session'||!UUID.test(String(a.actor?.id||''))||!ROLES.includes(a.actor.role_code))
    return {ok:false,response:reply({ok:false,error:'Signed-in staff required.'},403)};
  return {ok:true,actor:a.actor};}
async function rows(env,path){const r=await fetch(`${env.SUPABASE_URL}/rest/v1/${path}`,
  {headers:serviceHeaders(env),redirect:'error',signal:AbortSignal.timeout(8500)});
  if(!r.ok)throw Error('No-resend closure evidence unavailable');
  const result=await r.json();if(!Array.isArray(result))throw Error('Invalid closure evidence');return result;}
const age=(time,now)=>time?Math.max(0,Math.floor((now-Date.parse(time))/3600000)):null;
const mask=s=>String(s||'').replace(/^(.)([^@]*)(@.*)$/,'$1***$3');
export function recurrenceReadiness(closure,events=[],actor=null,now=Date.now()){
  const watch=events.find(e=>e.event_kind==='owner_watch_opened');
  const audit=events.find(e=>e.event_kind==='independent_recurrence_audited');
  const ack=events.find(e=>e.event_kind==='owner_no_resend_alert_ack');
  const closureAge=age(closure.created_at,now),watchAge=age(watch?.created_at,now);
  const auditAge=age(audit?.created_at,now);
  const recurrenceUnresolved=['recurrence_detected','evidence_missing'].includes(audit?.decision_code);
  return {closure_id:closure.id,closure_decision:closure.decision_code,
    closure_age_hours:closureAge,watch_age_hours:watchAge,audit_age_hours:auditAge,
    no_resend_alert_due:!!closure&&!ack&&(closureAge>=24||watchAge>=24||recurrenceUnresolved),
    recurrence_unresolved:recurrenceUnresolved,
    reviewer_staff_user_id:watch?.reviewer_staff_user_id||null,
    can_open_watch:!!actor?.is_admin&&!watch,
    can_independent_audit:!!watch&&!audit&&watch.reviewer_staff_user_id===actor?.id&&
      watchAge!==null&&watchAge<336,
    can_acknowledge_alert:!!actor?.is_admin&&!!audit&&!ack,
    events:events.map(e=>({id:e.id,event_kind:e.event_kind,decision_code:e.decision_code,
      evidence_kind:e.evidence_kind,evidence_reference:e.evidence_reference,
      observed_at:e.observed_at,created_at:e.created_at})),
    guidance:recurrenceUnresolved?'The independent auditor identified an exception. Owner acknowledgment does NOT resolve or resend it.':
      ack?'No-resend alert acknowledged. The original gift send remains one-time only.':
      closureAge>=24?'Closed gift review is at least 24 hours old; independent watch should check for recurrence.':
      'Internal closure can be watched independently. Never send or charge again.'};
}
export async function onRequestGet({request,env}){
  const a=await auth(request,env);if(!a.ok)return a.response;
  const session=String(new URL(request.url).searchParams.get('session_id')||'').trim();
  if(!SESSION.test(session))return reply({ok:false,error:'Exact checkout session required.'},400);
  try{
    const cases=await rows(env,`gift_issuance_review_cases?select=id,stripe_session_id&stripe_session_id=eq.${encodeURIComponent(session)}&limit=1`);
    if(!cases.length)return reply({ok:true,build:690,case:null,gifts:[],reviewers:[],safe_boundary:'No previous closure.'});
    const c=cases[0],gifts=await rows(env,`gift_certificates?select=id,checkout_line_number,recipient_email&stripe_session_id=eq.${encodeURIComponent(session)}&limit=100`);
    const attempts=gifts.length?await rows(env,`gift_issuance_one_time_dispatch_attempts?select=id,certificate_id,operator_staff_user_id&certificate_id=in.(${gifts.map(g=>g.id).join(',')})&limit=100`):[];
    const ids=attempts.map(x=>x.id);
    const past=ids.length?await rows(env,`gift_issuance_delivery_followup_reviews?select=id,attempt_id,event_kind,actor_staff_user_id,decision_code,created_at&attempt_id=in.(${ids.join(',')})&limit=300`):[];
    const events=ids.length?await rows(env,`gift_issuance_delivery_closure_recurrence?select=id,attempt_id,event_kind,decision_code,reviewer_staff_user_id,evidence_kind,evidence_reference,observed_at,created_at&attempt_id=in.(${ids.join(',')})&limit=300`):[];
    const reviewers=a.actor.is_admin?await rows(env,'staff_users?select=id,full_name,role_code&is_active=eq.true&role_code=in.(admin,senior_detailer,detailer)&limit=100'):[];
    return reply({ok:true,build:690,case:{id:c.id},is_owner:!!a.actor.is_admin,
      actor_id:a.actor.id,reviewers:reviewers.filter(x=>x.id!==a.actor.id),
      gifts:gifts.flatMap(g=>{const attempt=attempts.find(x=>x.certificate_id===g.id);
        const closure=past.find(x=>x.attempt_id===attempt?.id&&x.event_kind==='owner_no_resend_closeout');
        if(!closure)return [];
        const prior=past.find(x=>x.attempt_id===attempt.id&&x.event_kind==='independent_recipient_recheck');
        const ev=events.filter(x=>x.attempt_id===attempt.id);
        if(!a.actor.is_admin&&!ev.some(x=>x.event_kind==='owner_watch_opened'&&x.reviewer_staff_user_id===a.actor.id))return [];
        return [{id:g.id,checkout_line_number:g.checkout_line_number,recipient_email_masked:mask(g.recipient_email),
          attempt_id:attempt.id,original_operator_id:attempt.operator_staff_user_id,
          prior_reviewer_id:prior?.actor_staff_user_id||null,
          ...recurrenceReadiness(closure,ev,a.actor)}];}),
      safe_boundary:'Only internal immutable watch, review and owner alert acknowledgment; no email, SMS, resend, payment or gift mutation.'});
  }catch{return reply({ok:false,error:'Closure watch unavailable. No customer action occurred.'},503);}
}
export async function onRequestPost({request,env}){
  const origin=request.headers.get('origin');
  if((origin&&origin!==new URL(request.url).origin)||request.headers.get('sec-fetch-site')==='cross-site')
    return reply({ok:false,error:'Cross-origin review refused.'},403);
  const a=await auth(request,env);if(!a.ok)return a.response;
  const b=await request.json().catch(()=>({})),rule=ACTIONS[b.event_kind];
  const when=Date.parse(b.observed_at||'');
  if(!SESSION.test(String(b.session_id||''))||
     ![b.case_id,b.certificate_id,b.attempt_id,b.closure_id,b.event_id,b.reviewer_id].every(x=>UUID.test(String(x||'')))||
     !rule?.roles.includes(a.actor.role_code)||!rule.decisions.includes(b.decision_code)||
     !rule.sources.includes(b.evidence_kind)||!REF.test(String(b.evidence_reference||''))||
     !Number.isFinite(when)||when>Date.now()+30000||when<Date.now()-30*86400000||
     b.confirm_exact_closure!==true||b.confirm_independent_source!==true||b.confirm_no_resend!==true)
    return reply({ok:false,error:'Exact dated closure, separate reviewer and all no-resend confirmations required.'},400);
  try{
    const cases=await rows(env,`gift_issuance_review_cases?select=id,stripe_session_id&id=eq.${b.case_id}&limit=1`);
    if(cases[0]?.stripe_session_id!==b.session_id)return reply({ok:false,error:'Checkout mismatch.'},409);
    const hash=await sha256({session:b.session_id,case_id:b.case_id,certificate_id:b.certificate_id,
      attempt_id:b.attempt_id,closure_id:b.closure_id,event_kind:b.event_kind,
      actor:a.actor.id,reviewer:b.reviewer_id,decision:b.decision_code,
      evidence_kind:b.evidence_kind,evidence_reference:b.evidence_reference,observed_at:new Date(when).toISOString()});
    const r=await fetch(`${env.SUPABASE_URL}/rest/v1/rpc/record_gift_delivery_closure_recurrence`,{
      method:'POST',headers:serviceHeaders(env),redirect:'error',signal:AbortSignal.timeout(8500),
      body:JSON.stringify({p_id:b.event_id,p_case_id:b.case_id,p_certificate_id:b.certificate_id,
        p_attempt_id:b.attempt_id,p_closure_id:b.closure_id,p_actor_id:a.actor.id,
        p_reviewer_id:b.reviewer_id,p_event_kind:b.event_kind,p_decision_code:b.decision_code,
        p_evidence_kind:b.evidence_kind,p_evidence_reference:b.evidence_reference,
        p_evidence_sha256:hash,p_observed_at:new Date(when).toISOString()})});
    if(!r.ok)return reply({ok:false,error:'Atomic recurrence check refused. No resend or charge occurred.'},409);
    return reply({ok:true,build:690,result:await r.json(),next_step:'Refresh to check the immutable audit. No resend was authorized.'});
  }catch{return reply({ok:false,error:'Recurrence evidence unavailable. No customer action occurred.'},503);}
}
