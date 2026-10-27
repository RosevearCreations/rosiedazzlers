import { requireStaffAccess, serviceHeaders, json } from "../_lib/staff-auth.js";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SESSION_ID = /^cs_(?:test|live)_[a-zA-Z0-9_-]{8,220}$/;
const REVIEW_OUTCOMES = new Set(['hold_missing_evidence','hold_delivery_check','recheck_required','handoff_review_ready']);
const REVIEW_REASONS = new Set(['evidence_stale','unresolved_hold','delivery_attention','independent_verified','other_reviewer_review']);

function privateResponse(response) {
  const headers = new Headers(response.headers);
  headers.set('Cache-Control','no-store, private');
  headers.set('Referrer-Policy','no-referrer');
  headers.set('X-Content-Type-Options','nosniff');
  return new Response(response.body,{status:response.status,headers});
}
async function verifiedStaff(request,env) {
  const access=await requireStaffAccess({request,env,allowLegacyAdminFallback:true});
  if(!access.ok) return access;
  if(!['session','legacy_admin_password'].includes(access.auth_mode)) {
    return {ok:false,response:json({ok:false,error:'A verified staff session is required.'},403)};
  }
  const owner=access.actor.is_admin || access.actor.is_legacy_admin;
  if(access.auth_mode==='legacy_admin_password' && !owner) {
    return {ok:false,response:json({ok:false,error:'An owner session is required.'},403)};
  }
  return {...access,owner};
}
async function rows(env,path) {
  const res=await fetch(`${env.SUPABASE_URL}/rest/v1/${path}`,{
    method:'GET',redirect:'error',headers:serviceHeaders(env)
  });
  if(!res.ok)throw Error('Managed independent review evidence unavailable');
  const result=await res.json();
  if(!Array.isArray(result))throw Error('Invalid managed review evidence');
  return result;
}
async function rpc(env,name,payload) {
  const res=await fetch(`${env.SUPABASE_URL}/rest/v1/rpc/${name}`,{
    method:'POST',redirect:'error',headers:serviceHeaders(env),body:JSON.stringify(payload)
  });
  if(!res.ok)throw Error('Independent review transaction refused');
  return res.json();
}
function aging(date,due) {
  const checkedMs=Date.parse(date||'');
  const dueMs=Date.parse(due||'');
  const age=Number.isFinite(checkedMs)?Math.max(0,Math.floor((Date.now()-checkedMs)/3600000)):null;
  const overdue=Number.isFinite(dueMs)&&Date.now()>dueMs;
  return {decision_evidence_age_hours:age,evidence_stale:age===null||age>24,
    overdue,overdue_hours:overdue?Math.floor((Date.now()-dueMs)/3600000):0,
    urgency:overdue?'overdue':age===null||age>24?'evidence_refresh_due':'within_review_window'};
}

export async function onRequestGet({request,env}) {
  const access=await verifiedStaff(request,env);
  if(!access.ok)return privateResponse(access.response);
  if(!env?.SUPABASE_URL||!env?.SUPABASE_SERVICE_ROLE_KEY)
    return privateResponse(json({ok:false,error:'Review registry unavailable.'},503));
  const url=new URL(request.url);
  const mode=url.searchParams.get('mode')||'cases';
  const sessionId=String(url.searchParams.get('session_id')||'').trim();
  if(sessionId&&!SESSION_ID.test(sessionId))
    return privateResponse(json({ok:false,error:'Invalid gift Checkout session ID.'},400));
  try {
    if(mode==='candidates') {
      if(!access.owner)return privateResponse(json({ok:false,error:'Owner assignment permission required.'},403));
      const candidates=await rows(env,'staff_users?select=id,full_name,role_code&is_active=eq.true&order=full_name.asc&limit=100');
      return privateResponse(json({ok:true,build:676,candidates}));
    }
    if(mode==='decisions') {
      if(!access.owner||!sessionId)return privateResponse(json({ok:false,error:'Owner must specify the Checkout session.'},403));
      const decisions=await rows(env,`gift_issuance_recovery_decisions?select=id,action,provider_check,checked_at,created_at,actor_staff_user_id&stripe_session_id=eq.${encodeURIComponent(sessionId)}&order=created_at.desc&limit=20`);
      return privateResponse(json({ok:true,build:676,decisions}));
    }
    if(mode!=='cases')return privateResponse(json({ok:false,error:'Unknown review mode.'},400));
    if(!access.owner&&!UUID.test(String(access.actor.id||'')))
      return privateResponse(json({ok:false,error:'An assigned staff identity is required.'},403));
    const filters=[];
    if(sessionId)filters.push(`stripe_session_id=eq.${encodeURIComponent(sessionId)}`);
    if(!access.owner)filters.push(`assigned_reviewer_id=eq.${encodeURIComponent(access.actor.id)}`);
    const cases=await rows(env,`gift_issuance_review_cases?select=id,decision_id,stripe_session_id,assigned_reviewer_id,assigned_by_staff_user_id,assigned_at,due_at,status,version,created_at,updated_at,last_reviewed_at&${filters.join('&')}&order=updated_at.desc&limit=50`);
    const decisionIds=[...new Set(cases.map(c=>c.decision_id).filter(id=>UUID.test(String(id))))];
    const caseIds=cases.map(c=>c.id).filter(id=>UUID.test(String(id)));
    const [decisions,events]=await Promise.all([
      decisionIds.length?rows(env,`gift_issuance_recovery_decisions?select=id,action,provider_check,checked_at,created_at&id=in.(${decisionIds.join(',')})`):[],
      caseIds.length?rows(env,`gift_issuance_review_events?select=id,case_id,event_kind,actor_label,reviewer_staff_user_id,outcome,reason_code,evidence_age_hours,observed_certificates,held_events,delivery_attention_count,created_at&case_id=in.(${caseIds.join(',')})&order=created_at.desc&limit=200`):[]
    ]);
    const byDecision=new Map(decisions.map(d=>[d.id,d]));
    const safeCases=cases.map(c=>({...c,decision:byDecision.get(c.decision_id)||null,
      ...aging(byDecision.get(c.decision_id)?.checked_at,c.due_at)}));
    return privateResponse(json({ok:true,build:676,read_only:true,owner:access.owner,
      actor_id:access.actor.id||null,cases:safeCases,events,
      safe_boundary:'Review outcomes only; no gift, Stripe payment, recipient notification or delivery queue is modified.'}));
  }catch {
    return privateResponse(json({ok:false,owner_recovery_hold:true,error:'Independent review registry could not be reconciled; maintain hold.'},503));
  }
}

export async function onRequestPost({request,env}) {
  const origin=request.headers.get('origin');
  if(origin&&origin!==new URL(request.url).origin)
    return privateResponse(json({ok:false,error:'Cross-origin decision refused.'},403));
  if(request.headers.get('sec-fetch-site')==='cross-site')
    return privateResponse(json({ok:false,error:'Cross-site decision refused.'},403));
  const access=await verifiedStaff(request,env);
  if(!access.ok)return privateResponse(access.response);
  const body=await request.json().catch(()=>({}));
  const eventId=String(body.event_id||'');
  const caseId=String(body.case_id||'');
  if(!UUID.test(eventId)||!UUID.test(caseId))
    return privateResponse(json({ok:false,error:'A unique case ID and evidence event ID are required.'},400));
  if(!env?.SUPABASE_URL||!env?.SUPABASE_SERVICE_ROLE_KEY)
    return privateResponse(json({ok:false,error:'Review registry unavailable.'},503));
  try {
    let result;
    if(body.action==='assign') {
      if(!access.owner)return privateResponse(json({ok:false,error:'Only an owner may assign or reassign an independent reviewer.'},403));
      if(!UUID.test(String(body.decision_id||''))||!UUID.test(String(body.reviewer_id||''))||
          !Number.isFinite(Date.parse(body.due_at||'')))
        return privateResponse(json({ok:false,error:'Valid decision, reviewer and due date are required.'},400));
      const label=String(access.actor.id||(access.auth_mode==='legacy_admin_password'?'legacy_authorized_owner':'owner')).slice(0,100);
      result=await rpc(env,'assign_gift_issuance_independent_reviewer',{
        p_event_id:eventId,p_case_id:caseId,p_decision_id:body.decision_id,
        p_reviewer_id:body.reviewer_id,p_assigner_id:UUID.test(String(access.actor.id||''))?access.actor.id:null,
        p_assigner_label:label,p_due_at:new Date(body.due_at).toISOString()
      });
    }else if(body.action==='review') {
      if(access.auth_mode!=='session'||!UUID.test(String(access.actor.id||'')))
        return privateResponse(json({ok:false,error:'The assigned reviewer must sign in with their own staff account.'},403));
      const outcome=String(body.outcome||'');
      const reason=String(body.reason_code||'');
      if(!REVIEW_OUTCOMES.has(outcome)||!REVIEW_REASONS.has(reason)||
         !Number.isSafeInteger(body.expected_version)||body.expected_version<1)
        return privateResponse(json({ok:false,error:'A valid review outcome, reason and case version are required.'},400));
      if(outcome==='handoff_review_ready'&&(reason!=='independent_verified'||body.acknowledge_no_dispatch!==true))
        return privateResponse(json({ok:false,error:'Delivery-review handoff requires explicit no-dispatch acknowledgement.'},409));
      result=await rpc(env,'record_gift_issuance_reviewer_outcome',{
        p_event_id:eventId,p_case_id:caseId,p_actor_id:access.actor.id,
        p_outcome:outcome,p_reason_code:reason,p_expected_version:body.expected_version
      });
    }else{
      return privateResponse(json({ok:false,error:'Unknown independent review action.'},400));
    }
    return privateResponse(json({ok:true,build:676,result,customer_messages_sent:0,
      gift_balance_mutations:0,payment_mutations:0,
      next_step:body.action==='assign'
        ?'An independent staff reviewer must sign in, inspect evidence and record their own outcome.'
        :'Review evidence recorded. A ready handoff is for separate owner delivery review; no email or customer action occurred.'}));
  }catch{
    return privateResponse(json({ok:false,owner_recovery_hold:true,
      error:'Assignment or outcome was refused by the independent evidence gate. Refresh the case and keep the hold.'},409));
  }
}
