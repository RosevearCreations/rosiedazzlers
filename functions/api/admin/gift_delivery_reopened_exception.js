// Build 691 — manual evidence-only reopening after an independent B690 recurrence.
import {requireStaffAccess,serviceHeaders,json} from '../_lib/staff-auth.js';
import {sha256} from './gift_issuance_recovery_decisions.js';

const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SESSION=/^cs_(?:test|live)_[A-Za-z0-9_-]{8,220}$/;
const REF=/^[A-Z0-9_-]{6,64}$/;
const ROLES=['admin','senior_detailer','detailer'];
const RULES={owner_exception_reopened:{roles:['admin'],decisions:['reopen_recurrence_detected','reopen_missing_evidence'],sources:['internal_exception_note']},
  independent_aging_reassessed:{roles:ROLES,decisions:['still_unresolved','new_evidence_not_confirmed','evidence_conflicting'],
    sources:['recipient_direct_reply','verified_phone_conversation','recipient_reported_missing','provider_dashboard_reference','internal_exception_note']},
  owner_hold_continuity_ack:{roles:['admin'],decisions:['manual_hold_acknowledged'],sources:['internal_exception_note']}};
function answer(payload,status=200){const r=json(payload,status),headers=new Headers(r.headers);
  headers.set('Cache-Control','no-store, private');headers.set('Referrer-Policy','no-referrer');
  headers.set('X-Content-Type-Options','nosniff');return new Response(r.body,{status:r.status,headers});}
async function staff(request,env){const a=await requireStaffAccess({request,env,allowLegacyAdminFallback:false});
  if(!a.ok)return {ok:false,response:a.response};
  if(a.auth_mode!=='session'||!UUID.test(String(a.actor?.id||''))||!ROLES.includes(a.actor.role_code))
    return {ok:false,response:answer({ok:false,error:'Signed-in staff required.'},403)};
  return {ok:true,actor:a.actor};}
async function rows(env,path){const response=await fetch(`${env.SUPABASE_URL}/rest/v1/${path}`,
  {headers:serviceHeaders(env),redirect:'error',signal:AbortSignal.timeout(8500)});
  if(!response.ok)throw Error('Independent reopening receipt unavailable');
  const data=await response.json();if(!Array.isArray(data))throw Error('Invalid independent evidence');return data;}
const age=(date,now)=>date?Math.max(0,Math.floor((now-Date.parse(date))/3600000)):null;
export function reopeningReadiness(audit,events=[],actor=null,now=Date.now()){
  const open=events.find(e=>e.event_kind==='owner_exception_reopened');
  const review=events.find(e=>e.event_kind==='independent_aging_reassessed');
  const hold=events.find(e=>e.event_kind==='owner_hold_continuity_ack');
  const auditAge=age(audit?.created_at,now),reopenAge=age(open?.created_at,now),reviewAge=age(review?.created_at,now);
  const unresolved=['recurrence_detected','evidence_missing'].includes(audit?.decision_code);
  return {recurrence_review_id:audit?.id,recurrence_decision:audit?.decision_code,
    audit_age_hours:auditAge,reopen_age_hours:reopenAge,review_age_hours:reviewAge,
    aging_alert_due:unresolved&&(!hold||!review)&&
      (auditAge>=24||reopenAge>=24||reviewAge>=24),
    unresolved_recurring_exception:unresolved,permanent_no_resend:true,
    assigned_fourth_reviewer_id:open?.reviewer_staff_user_id||null,
    can_reopen:!!actor?.is_admin&&unresolved&&!open,
    can_reassess:!!open&&!review&&actor?.id===open.reviewer_staff_user_id&&
      reopenAge!==null&&reopenAge<336,
    can_ack_hold:!!actor?.is_admin&&!!review&&!hold,
    events:events.map(e=>({id:e.id,event_kind:e.event_kind,decision_code:e.decision_code,
      evidence_kind:e.evidence_kind,evidence_reference:e.evidence_reference,
      observed_at:e.observed_at,created_at:e.created_at})),
    warning:!unresolved?'No B690 verified unresolved recurrence; do not reopen.':
      hold?'Owner documented continuing manual HOLD; this does not resolve the recurrence.':
      reopenAge>=24?'REASSESSMENT AGING: Fourth reviewer follow-up is at least 24 hours old.':
      'A B690 independent recurrence remains unresolved. Record only another independent manual review.'};
}
export async function onRequestGet({request,env}){
  const a=await staff(request,env);if(!a.ok)return a.response;
  const session=String(new URL(request.url).searchParams.get('session_id')||'').trim();
  if(!SESSION.test(session))return answer({ok:false,error:'Exact checkout session required.'},400);
  try{const cases=await rows(env,`gift_issuance_review_cases?select=id,stripe_session_id&stripe_session_id=eq.${encodeURIComponent(session)}&limit=1`);
    if(!cases.length)return answer({ok:true,build:691,case:null,gifts:[],reviewers:[],safe_boundary:'No reopened exception exists.'});
    const c=cases[0],gifts=await rows(env,`gift_certificates?select=id,checkout_line_number,recipient_email&stripe_session_id=eq.${encodeURIComponent(session)}&limit=100`);
    const attempts=gifts.length?await rows(env,`gift_issuance_one_time_dispatch_attempts?select=id,certificate_id,operator_staff_user_id&certificate_id=in.(${gifts.map(g=>g.id).join(',')})&limit=100`):[];
    const ids=attempts.map(x=>x.id);
    const prior=ids.length?await rows(env,`gift_issuance_delivery_followup_reviews?select=attempt_id,event_kind,actor_staff_user_id&attempt_id=in.(${ids.join(',')})&limit=300`):[];
    const recur=ids.length?await rows(env,`gift_issuance_delivery_closure_recurrence?select=id,attempt_id,event_kind,decision_code,actor_staff_user_id,reviewer_staff_user_id,created_at&attempt_id=in.(${ids.join(',')})&limit=300`):[];
    const reopened=ids.length?await rows(env,`gift_issuance_delivery_reopened_exception_reviews?select=id,attempt_id,event_kind,decision_code,reviewer_staff_user_id,evidence_kind,evidence_reference,observed_at,created_at&attempt_id=in.(${ids.join(',')})&limit=300`):[];
    const reviewers=a.actor.is_admin?await rows(env,'staff_users?select=id,full_name,role_code&is_active=eq.true&role_code=in.(admin,senior_detailer,detailer)&limit=100'):[];
    return answer({ok:true,build:691,case:{id:c.id},is_owner:!!a.actor.is_admin,actor_id:a.actor.id,
      reviewers:reviewers.filter(x=>x.id!==a.actor.id),
      gifts:gifts.flatMap(g=>{const attempt=attempts.find(x=>x.certificate_id===g.id);
        const ev=recur.filter(x=>x.attempt_id===attempt?.id),
          audit=ev.find(x=>x.event_kind==='independent_recurrence_audited');
        if(!audit||!['recurrence_detected','evidence_missing'].includes(audit.decision_code))return [];
        const watch=ev.find(x=>x.event_kind==='owner_watch_opened');
        const review=prior.find(x=>x.attempt_id===attempt.id&&x.event_kind==='independent_recipient_recheck');
        const acts=reopened.filter(x=>x.attempt_id===attempt.id);
        if(!a.actor.is_admin&&!acts.some(x=>x.event_kind==='owner_exception_reopened'&&x.reviewer_staff_user_id===a.actor.id))return [];
        return [{id:g.id,checkout_line_number:g.checkout_line_number,
          recipient_email_masked:String(g.recipient_email||'').replace(/^(.)([^@]*)(@.*)$/,'$1***$3'),
          attempt_id:attempt.id,original_operator_id:attempt.operator_staff_user_id,
          prior_reviewer_id:review?.actor_staff_user_id||null,
          third_reviewer_id:watch?.reviewer_staff_user_id||null,
          ...reopeningReadiness(audit,acts,a.actor)}];}),
      safe_boundary:'Reopening and HOLD are audit-only. No provider calls, email, SMS, resend, payment or certificate mutation.'});
  }catch{return answer({ok:false,error:'Reopened exception evidence unavailable. Nothing sent.'},503);}
}
export async function onRequestPost({request,env}){
  const origin=request.headers.get('origin');
  if((origin&&origin!==new URL(request.url).origin)||request.headers.get('sec-fetch-site')==='cross-site')
    return answer({ok:false,error:'Cross-origin reopening refused.'},403);
  const a=await staff(request,env);if(!a.ok)return a.response;
  const b=await request.json().catch(()=>({})),rule=RULES[b.event_kind],when=Date.parse(b.observed_at||'');
  if(!SESSION.test(String(b.session_id||''))||
    ![b.case_id,b.certificate_id,b.attempt_id,b.recurrence_review_id,b.event_id,b.reviewer_id].every(x=>UUID.test(String(x||'')))||
    !rule?.roles.includes(a.actor.role_code)||!rule.decisions.includes(b.decision_code)||
    !rule.sources.includes(b.evidence_kind)||!REF.test(String(b.evidence_reference||''))||
    !Number.isFinite(when)||when>Date.now()+30000||when<Date.now()-30*86400000||
    b.confirm_exact_recurrence!==true||b.confirm_fourth_independence!==true||b.confirm_no_resend!==true)
    return answer({ok:false,error:'Current distinct reviewer, exact unresolved recurrence and three no-resend confirmations required.'},400);
  try{const cases=await rows(env,`gift_issuance_review_cases?select=id,stripe_session_id&id=eq.${b.case_id}&limit=1`);
    if(cases[0]?.stripe_session_id!==b.session_id)return answer({ok:false,error:'Checkout mismatch.'},409);
    const hash=await sha256({session:b.session_id,case_id:b.case_id,certificate_id:b.certificate_id,
      attempt_id:b.attempt_id,recurrence:b.recurrence_review_id,actor:a.actor.id,
      reviewer:b.reviewer_id,event_kind:b.event_kind,decision:b.decision_code,
      evidence_kind:b.evidence_kind,evidence_reference:b.evidence_reference,
      observed_at:new Date(when).toISOString()});
    const response=await fetch(`${env.SUPABASE_URL}/rest/v1/rpc/record_gift_delivery_reopened_exception_review`,{
      method:'POST',headers:serviceHeaders(env),redirect:'error',signal:AbortSignal.timeout(8500),
      body:JSON.stringify({p_id:b.event_id,p_case_id:b.case_id,p_certificate_id:b.certificate_id,
        p_attempt_id:b.attempt_id,p_recurrence_review_id:b.recurrence_review_id,
        p_actor_id:a.actor.id,p_reviewer_id:b.reviewer_id,p_event_kind:b.event_kind,
        p_decision_code:b.decision_code,p_evidence_kind:b.evidence_kind,
        p_evidence_reference:b.evidence_reference,p_evidence_sha256:hash,
        p_observed_at:new Date(when).toISOString()})});
    if(!response.ok)return answer({ok:false,error:'Atomic fourth-reviewer safeguard refused. No resend or charge occurred.'},409);
    return answer({ok:true,build:691,result:await response.json(),next_step:'Refresh to verify the immutable HOLD record. No resend was authorized.'});
  }catch{return answer({ok:false,error:'Reopening receipt unavailable. No customer action occurred.'},503);}
}
