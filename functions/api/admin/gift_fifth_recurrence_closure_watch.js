// Build 693: a sixth independent witness checks the fifth review's unresolved risk.
// Closure means closure of an internal WATCH only; original recipient delivery remains unverified.
import {requireStaffAccess,serviceHeaders,json} from '../_lib/staff-auth.js';
import {sha256} from './gift_issuance_recovery_decisions.js';

const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SESSION=/^cs_(?:test|live)_[A-Za-z0-9_-]{8,220}$/;
const REF=/^[A-Z0-9_-]{6,64}$/;
const ROLES=['admin','senior_detailer','detailer'];
const ACTIONS={
  owner_fifth_recurrence_watch_opened:{roles:['admin'],decisions:['recurrence_watch_requested'],sources:['internal_exception_note']},
  independent_closure_risk_checked:{roles:ROLES,
    decisions:['discrepancy_still_open','new_discrepancy_detected','original_evidence_missing'],
    sources:['recipient_direct_reply','verified_phone_conversation','recipient_reported_missing',
      'provider_dashboard_reference','internal_exception_note']},
  owner_continued_hold_ack:{roles:['admin'],decisions:['continued_manual_hold'],sources:['internal_exception_note']}
};
function reply(payload,status=200){const r=json(payload,status),headers=new Headers(r.headers);
  headers.set('Cache-Control','no-store, private');headers.set('Referrer-Policy','no-referrer');
  headers.set('X-Content-Type-Options','nosniff');return new Response(r.body,{status:r.status,headers});}
async function staff(request,env){const a=await requireStaffAccess({request,env,allowLegacyAdminFallback:false});
  if(!a.ok)return {ok:false,response:a.response};
  if(a.auth_mode!=='session'||!UUID.test(String(a.actor?.id||''))||!ROLES.includes(a.actor.role_code))
    return {ok:false,response:reply({ok:false,error:'Signed-in staff required.'},403)};
  return {ok:true,actor:a.actor};}
async function rows(env,path){const r=await fetch(`${env.SUPABASE_URL}/rest/v1/${path}`,{
    headers:serviceHeaders(env),redirect:'error',signal:AbortSignal.timeout(8500)});
  if(!r.ok)throw Error('Source evidence unavailable');
  const v=await r.json();if(!Array.isArray(v))throw Error('Invalid source evidence');return v;}
const age=(x,now)=>x?Math.max(0,Math.floor((now-Date.parse(x))/3600000)):null;
export function fifthRecurrenceReadiness(fifth,hold,events=[],actor=null,now=Date.now()){
  const watch=events.find(x=>x.event_kind==='owner_fifth_recurrence_watch_opened');
  const independent=events.find(x=>x.event_kind==='independent_closure_risk_checked');
  const ack=events.find(x=>x.event_kind==='owner_continued_hold_ack');
  const fifthAge=age(fifth?.created_at,now),watchAge=age(watch?.created_at,now);
  const eligible=!!hold&&['still_disputed','documentary_gap','contradiction_not_resolved'].includes(fifth?.decision_code);
  return {fifth_review_id:fifth?.id,fifth_decision:fifth?.decision_code,
    fifth_age_hours:fifthAge,watch_age_hours:watchAge,
    internal_alert_due:eligible&&!ack&&(fifthAge>=24||watchAge>=24||!!independent),
    assigned_sixth_witness_id:watch?.reviewer_staff_user_id||null,
    can_open:eligible&&!!actor?.is_admin&&!watch,
    can_check:eligible&&!!watch&&!independent&&actor?.id===watch.reviewer_staff_user_id&&watchAge!==null&&watchAge<336,
    can_ack_hold:eligible&&!!actor?.is_admin&&!!independent&&!ack,
    manual_hold:true,permanent_no_resend:true,delivery_confirmed:false,
    events:events.map(x=>({id:x.id,event_kind:x.event_kind,decision_code:x.decision_code,
      evidence_kind:x.evidence_kind,evidence_reference:x.evidence_reference,
      observed_at:x.observed_at,created_at:x.created_at})),
    warning:!eligible?'Fifth independent unresolved review and owner HOLD required.':
      ack?'Owner acknowledged continuing HOLD. Gift delivery is still not confirmed.':
      independent?'Sixth witness confirms risk remains open; owner must acknowledge no-resend HOLD.':
      fifthAge>=24?'INTERNAL AGING ALERT: fifth reviewer risk remains unresolved after 24 hours.':
      'Fifth reviewer discrepancy remains unresolved. Do not contact customer or resend.'};
}
export async function onRequestGet({request,env}){
  const a=await staff(request,env);if(!a.ok)return a.response;
  const session=String(new URL(request.url).searchParams.get('session_id')||'').trim();
  if(!SESSION.test(session))return reply({ok:false,error:'Exact checkout session required.'},400);
  try{
    const cases=await rows(env,`gift_issuance_review_cases?select=id,stripe_session_id&stripe_session_id=eq.${encodeURIComponent(session)}&limit=1`);
    if(!cases.length)return reply({ok:true,build:693,case:null,gifts:[],reviewers:[]});
    const c=cases[0],gifts=await rows(env,`gift_certificates?select=id,checkout_line_number,recipient_email&stripe_session_id=eq.${encodeURIComponent(session)}&limit=100`);
    const attempts=gifts.length?await rows(env,`gift_issuance_one_time_dispatch_attempts?select=id,certificate_id,operator_staff_user_id&certificate_id=in.(${gifts.map(x=>x.id).join(',')})&limit=100`):[];
    const ids=attempts.map(x=>x.id),filter=ids.length?`attempt_id=in.(${ids.join(',')})&limit=300`:null;
    const prior=filter?await rows(env,`gift_issuance_delivery_followup_reviews?select=attempt_id,event_kind,actor_staff_user_id&${filter}`):[];
    const third=filter?await rows(env,`gift_issuance_delivery_closure_recurrence?select=attempt_id,event_kind,reviewer_staff_user_id&${filter}`):[];
    const fourth=filter?await rows(env,`gift_issuance_delivery_reopened_exception_reviews?select=attempt_id,event_kind,reviewer_staff_user_id&${filter}`):[];
    const fifth=filter?await rows(env,`gift_issuance_delivery_reopened_discrepancy_watch?select=id,attempt_id,event_kind,decision_code,actor_staff_user_id,reviewer_staff_user_id,created_at&${filter}`):[];
    const closing=filter?await rows(env,`gift_issuance_delivery_fifth_recurrence_closure_watch?select=id,attempt_id,event_kind,decision_code,reviewer_staff_user_id,evidence_kind,evidence_reference,observed_at,created_at&${filter}`):[];
    const reviewers=a.actor.is_admin?await rows(env,'staff_users?select=id,full_name,role_code&is_active=eq.true&role_code=in.(admin,senior_detailer,detailer)&limit=100'):[];
    return reply({ok:true,build:693,case:{id:c.id},actor_id:a.actor.id,is_owner:!!a.actor.is_admin,reviewers,
      gifts:gifts.flatMap(g=>{const attempt=attempts.find(x=>x.certificate_id===g.id);if(!attempt)return [];
        const priorFifth=fifth.filter(x=>x.attempt_id===attempt.id);
        const review=priorFifth.find(x=>x.event_kind==='independent_discrepancy_reassessed');
        const hold=priorFifth.find(x=>x.event_kind==='owner_no_resend_hold_ack');
        if(!review||!hold)return [];
        const events=closing.filter(x=>x.attempt_id===attempt.id);
        if(!a.actor.is_admin&&!events.some(x=>x.event_kind==='owner_fifth_recurrence_watch_opened'&&x.reviewer_staff_user_id===a.actor.id))return [];
        return [{id:g.id,checkout_line_number:g.checkout_line_number,
          recipient_email_masked:String(g.recipient_email||'').replace(/^(.)([^@]*)(@.*)$/,'$1***$3'),
          attempt_id:attempt.id,original_operator_id:attempt.operator_staff_user_id,
          original_reviewer_id:prior.find(x=>x.attempt_id===attempt.id&&x.event_kind==='independent_recipient_recheck')?.actor_staff_user_id||null,
          third_reviewer_id:third.find(x=>x.attempt_id===attempt.id&&x.event_kind==='owner_watch_opened')?.reviewer_staff_user_id||null,
          fourth_reviewer_id:fourth.find(x=>x.attempt_id===attempt.id&&x.event_kind==='owner_exception_reopened')?.reviewer_staff_user_id||null,
          fifth_reviewer_id:review.actor_staff_user_id,
          ...fifthRecurrenceReadiness(review,hold,events,a.actor)}];}),
      safety_notice:'Internal closure watch only; no gift resend, dispatch, charge, refund, certificate change or integration request.'});
  }catch{return reply({ok:false,error:'Fifth recurrence watch unavailable. No customer action occurred.'},503);}
}
export async function onRequestPost({request,env}){
  const origin=request.headers.get('origin');
  if((origin&&origin!==new URL(request.url).origin)||request.headers.get('sec-fetch-site')==='cross-site')
    return reply({ok:false,error:'Cross-origin fifth recurrence request refused.'},403);
  const a=await staff(request,env);if(!a.ok)return a.response;
  const b=await request.json().catch(()=>({})),rule=ACTIONS[b.event_kind],when=Date.parse(b.observed_at||'');
  if(!SESSION.test(String(b.session_id||''))||
    ![b.case_id,b.certificate_id,b.attempt_id,b.fifth_review_id,b.event_id,b.reviewer_id].every(x=>UUID.test(String(x||'')))||
    !rule?.roles.includes(a.actor.role_code)||!rule.decisions.includes(b.decision_code)||
    !rule.sources.includes(b.evidence_kind)||!REF.test(String(b.evidence_reference||''))||
    !Number.isFinite(when)||when>Date.now()+30000||when<Date.now()-30*86400000||
    b.confirm_fifth_hold!==true||b.confirm_sixth_independence!==true||b.confirm_no_resend!==true)
    return reply({ok:false,error:'Exact fifth HOLD, distinct sixth witness and no-resend confirmations required.'},400);
  try{
    const c=await rows(env,`gift_issuance_review_cases?select=id,stripe_session_id&id=eq.${b.case_id}&limit=1`);
    if(c[0]?.stripe_session_id!==b.session_id)return reply({ok:false,error:'Checkout mismatch.'},409);
    const hash=await sha256({session:b.session_id,case_id:b.case_id,certificate_id:b.certificate_id,
      attempt_id:b.attempt_id,fifth:b.fifth_review_id,actor:a.actor.id,reviewer:b.reviewer_id,
      event_kind:b.event_kind,decision:b.decision_code,evidence_kind:b.evidence_kind,
      evidence_reference:b.evidence_reference,observed_at:new Date(when).toISOString()});
    const r=await fetch(`${env.SUPABASE_URL}/rest/v1/rpc/record_gift_delivery_fifth_recurrence_closure_watch`,{
      method:'POST',headers:serviceHeaders(env),redirect:'error',signal:AbortSignal.timeout(8500),
      body:JSON.stringify({p_id:b.event_id,p_case_id:b.case_id,p_certificate_id:b.certificate_id,
        p_attempt_id:b.attempt_id,p_fifth_review_id:b.fifth_review_id,p_actor_id:a.actor.id,
        p_reviewer_id:b.reviewer_id,p_event_kind:b.event_kind,p_decision_code:b.decision_code,
        p_evidence_kind:b.evidence_kind,p_evidence_reference:b.evidence_reference,
        p_evidence_sha256:hash,p_observed_at:new Date(when).toISOString()})});
    if(!r.ok)return reply({ok:false,error:'Independent witness or immutable event refused; no resend occurred.'},409);
    return reply({ok:true,build:693,receipt:await r.json(),safety_notice:'Discrepancy remains unresolved; manual HOLD and no-resend persist.'});
  }catch{return reply({ok:false,error:'Fifth recurrence watch not saved. No customer contact.'},503);}
}
