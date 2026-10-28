// Build 692: owner-assigned FIFTH independent discrepancy watcher, evidence-only.
import {requireStaffAccess,serviceHeaders,json} from '../_lib/staff-auth.js';
import {sha256} from './gift_issuance_recovery_decisions.js';

const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SESSION=/^cs_(?:test|live)_[A-Za-z0-9_-]{8,220}$/;
const REF=/^[A-Z0-9_-]{6,64}$/;
const ROLES=['admin','senior_detailer','detailer'];
const RULES={
  owner_discrepancy_watch_opened:{roles:['admin'],decisions:['discrepancy_review_requested'],sources:['internal_exception_note']},
  independent_discrepancy_reassessed:{roles:ROLES,decisions:['still_disputed','documentary_gap','contradiction_not_resolved'],
    sources:['recipient_direct_reply','verified_phone_conversation','recipient_reported_missing',
      'provider_dashboard_reference','internal_exception_note']},
  owner_no_resend_hold_ack:{roles:['admin'],decisions:['continued_manual_hold'],sources:['internal_exception_note']}
};
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
  if(!response.ok)throw Error('Independent discrepancy receipt unavailable');
  const data=await response.json();if(!Array.isArray(data))throw Error('Invalid discrepancy receipt');return data;}
const age=(date,now)=>date?Math.max(0,Math.floor((now-Date.parse(date))/3600000)):null;
export function discrepancyReadiness(fourth,hold,events=[],actor=null,now=Date.now()){
  const opened=events.find(x=>x.event_kind==='owner_discrepancy_watch_opened');
  const fifth=events.find(x=>x.event_kind==='independent_discrepancy_reassessed');
  const acknowledged=events.find(x=>x.event_kind==='owner_no_resend_hold_ack');
  const fourthAge=age(fourth?.created_at,now),watchAge=age(opened?.created_at,now);
  const eligible=!!hold&&['evidence_conflicting','new_evidence_not_confirmed'].includes(fourth?.decision_code);
  return {fourth_review_id:fourth?.id,discrepancy_decision:fourth?.decision_code,
    fourth_age_hours:fourthAge,watch_age_hours:watchAge,
    aging_alert_due:eligible&&!acknowledged&&(fourthAge>=24||watchAge>=24),
    can_open:eligible&&!!actor?.is_admin&&!opened,
    can_reassess:eligible&&!!opened&&!fifth&&actor?.id===opened.reviewer_staff_user_id&&watchAge!==null&&watchAge<336,
    can_ack_hold:eligible&&!!actor?.is_admin&&!!fifth&&!acknowledged,
    assigned_fifth_reviewer_id:opened?.reviewer_staff_user_id||null,
    permanent_no_resend:true,manual_hold:true,
    events:events.map(x=>({id:x.id,event_kind:x.event_kind,decision_code:x.decision_code,
      evidence_kind:x.evidence_kind,evidence_reference:x.evidence_reference,
      observed_at:x.observed_at,created_at:x.created_at})),
    warning:!eligible?'A verified conflicting fourth review and subsequent owner HOLD are required.':
      acknowledged?'Owner recorded continuing HOLD; delivery is not confirmed.':
      watchAge>=24?'AGING ALERT: fifth independent reviewer follow-up is older than 24 hours.':
      'Evidence discrepancy remains unresolved. Only internal independent recheck permitted.'};
}
export async function onRequestGet({request,env}){
  const a=await staff(request,env);if(!a.ok)return a.response;
  const session=String(new URL(request.url).searchParams.get('session_id')||'').trim();
  if(!SESSION.test(session))return answer({ok:false,error:'Exact checkout session required.'},400);
  try{
    const cases=await rows(env,`gift_issuance_review_cases?select=id,stripe_session_id&stripe_session_id=eq.${encodeURIComponent(session)}&limit=1`);
    if(!cases.length)return answer({ok:true,build:692,case:null,gifts:[],reviewers:[]});
    const c=cases[0],gifts=await rows(env,`gift_certificates?select=id,checkout_line_number,recipient_email&stripe_session_id=eq.${encodeURIComponent(session)}&limit=100`);
    const attempts=gifts.length?await rows(env,`gift_issuance_one_time_dispatch_attempts?select=id,certificate_id,operator_staff_user_id&certificate_id=in.(${gifts.map(x=>x.id).join(',')})&limit=100`):[];
    const ids=attempts.map(x=>x.id),query=ids.length?`attempt_id=in.(${ids.join(',')})&limit=300`:null;
    const prior=query?await rows(env,`gift_issuance_delivery_followup_reviews?select=attempt_id,event_kind,actor_staff_user_id&${query}`):[];
    const recurrence=query?await rows(env,`gift_issuance_delivery_closure_recurrence?select=attempt_id,event_kind,reviewer_staff_user_id&${query}`):[];
    const reopened=query?await rows(env,`gift_issuance_delivery_reopened_exception_reviews?select=id,attempt_id,event_kind,decision_code,actor_staff_user_id,reviewer_staff_user_id,created_at&${query}`):[];
    const discrepancies=query?await rows(env,`gift_issuance_delivery_reopened_discrepancy_watch?select=id,attempt_id,event_kind,decision_code,reviewer_staff_user_id,evidence_kind,evidence_reference,observed_at,created_at&${query}`):[];
    const reviewers=a.actor.is_admin?await rows(env,'staff_users?select=id,full_name,role_code&is_active=eq.true&role_code=in.(admin,senior_detailer,detailer)&limit=100'):[];
    return answer({ok:true,build:692,case:{id:c.id},actor_id:a.actor.id,is_owner:!!a.actor.is_admin,
      reviewers,gifts:gifts.flatMap(g=>{
        const attempt=attempts.find(x=>x.certificate_id===g.id);if(!attempt)return [];
        const acts=reopened.filter(x=>x.attempt_id===attempt.id);
        const fourth=acts.find(x=>x.event_kind==='independent_aging_reassessed');
        const hold=acts.find(x=>x.event_kind==='owner_hold_continuity_ack');
        if(!hold||!['evidence_conflicting','new_evidence_not_confirmed'].includes(fourth?.decision_code))return [];
        const open=acts.find(x=>x.event_kind==='owner_exception_reopened');
        const original=prior.find(x=>x.attempt_id===attempt.id&&x.event_kind==='independent_recipient_recheck');
        const third=recurrence.find(x=>x.attempt_id===attempt.id&&x.event_kind==='owner_watch_opened');
        const events=discrepancies.filter(x=>x.attempt_id===attempt.id);
        if(!a.actor.is_admin&&!events.some(x=>x.event_kind==='owner_discrepancy_watch_opened'&&x.reviewer_staff_user_id===a.actor.id))return [];
        return [{id:g.id,checkout_line_number:g.checkout_line_number,
          recipient_email_masked:String(g.recipient_email||'').replace(/^(.)([^@]*)(@.*)$/,'$1***$3'),
          attempt_id:attempt.id,original_operator_id:attempt.operator_staff_user_id,
          original_reviewer_id:original?.actor_staff_user_id||null,
          third_reviewer_id:third?.reviewer_staff_user_id||null,
          fourth_reviewer_id:open?.reviewer_staff_user_id||null,
          ...discrepancyReadiness(fourth,hold,events,a.actor)}];}),
      safety_notice:'Original email slot remains consumed; no send, charge, refund or gateway request.'});
  }catch{return answer({ok:false,error:'Discrepancy watch unavailable. No customer action occurred.'},503);}
}
export async function onRequestPost({request,env}){
  const origin=request.headers.get('origin');
  if((origin&&origin!==new URL(request.url).origin)||request.headers.get('sec-fetch-site')==='cross-site')
    return answer({ok:false,error:'Cross-origin discrepancy request refused.'},403);
  const a=await staff(request,env);if(!a.ok)return a.response;
  const b=await request.json().catch(()=>({})),rule=RULES[b.event_kind],when=Date.parse(b.observed_at||'');
  if(!SESSION.test(String(b.session_id||''))||
    ![b.case_id,b.certificate_id,b.attempt_id,b.fourth_review_id,b.event_id,b.reviewer_id].every(x=>UUID.test(String(x||'')))||
    !rule?.roles.includes(a.actor.role_code)||!rule.decisions.includes(b.decision_code)||
    !rule.sources.includes(b.evidence_kind)||!REF.test(String(b.evidence_reference||''))||
    !Number.isFinite(when)||when>Date.now()+30000||when<Date.now()-30*86400000||
    b.confirm_fourth_discrepancy!==true||b.confirm_fifth_independence!==true||b.confirm_no_resend!==true)
    return answer({ok:false,error:'Exact fourth discrepancy, distinct fifth reviewer and no-resend confirmations required.'},400);
  try{const cases=await rows(env,`gift_issuance_review_cases?select=id,stripe_session_id&id=eq.${b.case_id}&limit=1`);
    if(cases[0]?.stripe_session_id!==b.session_id)return answer({ok:false,error:'Checkout mismatch.'},409);
    const hash=await sha256({session:b.session_id,case_id:b.case_id,certificate_id:b.certificate_id,
      attempt_id:b.attempt_id,fourth:b.fourth_review_id,actor:a.actor.id,
      reviewer:b.reviewer_id,event_kind:b.event_kind,decision:b.decision_code,
      evidence_kind:b.evidence_kind,evidence_reference:b.evidence_reference,
      observed_at:new Date(when).toISOString()});
    const response=await fetch(`${env.SUPABASE_URL}/rest/v1/rpc/record_gift_delivery_reopened_discrepancy_watch`,{
      method:'POST',headers:serviceHeaders(env),redirect:'error',signal:AbortSignal.timeout(8500),
      body:JSON.stringify({p_id:b.event_id,p_case_id:b.case_id,p_certificate_id:b.certificate_id,
        p_attempt_id:b.attempt_id,p_fourth_review_id:b.fourth_review_id,
        p_actor_id:a.actor.id,p_reviewer_id:b.reviewer_id,p_event_kind:b.event_kind,
        p_decision_code:b.decision_code,p_evidence_kind:b.evidence_kind,
        p_evidence_reference:b.evidence_reference,p_evidence_sha256:hash,
        p_observed_at:new Date(when).toISOString()})});
    if(!response.ok)return answer({ok:false,error:'Atomic fifth reviewer or one-time safeguard refused; no resend occurred.'},409);
    return answer({ok:true,build:692,receipt:await response.json(),safety_notice:'Unresolved manual HOLD, no resend or charge.'});
  }catch{return answer({ok:false,error:'Fifth reviewer watch not saved. No customer contact.'},503);}
}
