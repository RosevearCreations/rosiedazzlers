import {requireStaffAccess,serviceHeaders,json} from '../_lib/staff-auth.js';
import {providerCrossCheck,sha256} from './gift_issuance_recovery_decisions.js';

const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SESSION=/^cs_(?:test|live)_[a-zA-Z0-9_-]{8,220}$/;
const ACTIONS=new Set(['hold_escalated','independent_recheck_attested','owner_continuity_closed']);
const REASONS=new Set(['case_reopened','recurrence_reopened','evidence_expired','owner_requested_recheck']);

function sealed(response){
  const headers=new Headers(response.headers);
  headers.set('Cache-Control','no-store, private');headers.set('Referrer-Policy','no-referrer');
  headers.set('X-Content-Type-Options','nosniff');
  return new Response(response.body,{status:response.status,headers});
}
async function access(request,env){
  const auth=await requireStaffAccess({request,env,allowLegacyAdminFallback:false});
  if(!auth.ok)return {ok:false,response:auth.response};
  const actor=auth.actor;
  if(auth.auth_mode!=='session'||!UUID.test(String(actor?.id||''))||
     !(actor.is_admin||['senior_detailer','detailer'].includes(actor.role_code)))
    return {ok:false,response:json({ok:false,error:'Signed-in owner or separate gift auditor required.'},403)};
  return {ok:true,actor,isOwner:!!actor.is_admin};
}
async function rows(env,query){
  const res=await fetch(`${env.SUPABASE_URL}/rest/v1/${query}`,{
    method:'GET',redirect:'error',headers:serviceHeaders(env),signal:AbortSignal.timeout(8500)});
  if(!res.ok)throw Error('Gift HOLD continuity evidence unavailable');
  const data=await res.json();if(!Array.isArray(data))throw Error('Invalid HOLD evidence');
  return data;
}

export function classifyHoldContinuity(c,closeout,latestRecheck,reconciliation,
  latestB680,source,last,followups,now=Date.now()){
  const anchor=last?.provider_checked_at||source?.provider_checked_at||source?.created_at||
    closeout?.created_at||new Date(now).toISOString();
  const age_minutes=Math.max(0,Math.floor((now-Date.parse(anchor))/60000));
  const recurrence=!!closeout&&followups.some(f=>f.event_kind==='recurrence_opened'&&
    Date.parse(f.created_at)>Date.parse(closeout.created_at));
  const reason=!closeout||c.status!=='ready_for_delivery_review'||latestRecheck?.id!==closeout.id?
    'case_reopened':recurrence?'recurrence_reopened':age_minutes>=120?'evidence_expired':'owner_requested_recheck';
  const sourceCurrent=!!reconciliation&&!!source&&source.event_kind==='owner_audit_acknowledged'&&
    reconciliation.source_audit_event_id===source.id&&latestB680?.id===reconciliation.id;
  const phase=!sourceCurrent?'source_hold':last?.event_kind==='hold_escalated'?'independent_recheck_due':
    last?.event_kind==='independent_recheck_attested'?'owner_continuity_due':
      last?.event_kind==='owner_continuity_closed'?'internally_closed_hold':'owner_escalation_due';
  const aging_band=age_minutes>=2880?'escalation_48h':age_minutes>=1440?'overdue_24h':
    age_minutes>=120?'expired_2h':age_minutes>=60?'warning_60m':'current';
  return {reason,phase,age_minutes,aging_band,owner_hold:true,
    customer_delivery_authorized:false,
    summary:!sourceCurrent?'Earlier closeout or Build 680 evidence changed: HOLD; return to source review.':
      reason==='case_reopened'?'Closeout superseded: HOLD pending new source closure.':
      reason==='recurrence_reopened'?'New recurrence: escalation may be recorded but cannot be closed.':
      phase==='independent_recheck_due'?'Separate auditor must recheck read-only paid and certificate proof.':
      phase==='owner_continuity_due'?'Owner may record internal closure only while independent proof remains fresh.':
      phase==='internally_closed_hold'?'Internal continuity recorded. Continue watching; customer HOLD stays.':
      reason==='evidence_expired'?'Evidence expired: owner escalation and separate recheck are required.':
        'Owner may request an extra independent continuity check; customer HOLD stays.'};
}

export async function onRequestGet({request,env}){
  const auth=await access(request,env);if(!auth.ok)return sealed(auth.response);
  const session=String(new URL(request.url).searchParams.get('session_id')||'').trim();
  if(session&&!SESSION.test(session))return sealed(json({ok:false,error:'Invalid gift Checkout session.'},400));
  try{
    const scoped=auth.isOwner?'':`auditor_staff_user_id=eq.${auth.actor.id}&`;
    const reconciliations=await rows(env,`gift_issuance_audit_alert_events?select=id,case_id,closeout_event_id,event_kind,source_audit_event_id,auditor_staff_user_id,provider_checked_at,created_at&${scoped}event_kind=eq.owner_hold_reconciled&order=created_at.desc,id.desc&limit=250`);
    const allowed=[...new Set(reconciliations.map(e=>e.case_id).filter(x=>UUID.test(String(x))))];
    if(!auth.isOwner&&!allowed.length)return sealed(json({ok:true,build:681,cases:[],continuity_events:0,
      safe_boundary:'No signed Build 680 reconciliation assigned. Customer HOLD is unchanged.'}));
    const filter=session?`stripe_session_id=eq.${encodeURIComponent(session)}&`:'';
    const scope=auth.isOwner?'':`id=in.(${allowed.join(',')})&`;
    const cases=await rows(env,`gift_issuance_review_cases?select=id,stripe_session_id,status,assigned_reviewer_id,updated_at&${scope}${filter}order=updated_at.desc&limit=50`);
    const ids=cases.map(c=>c.id).filter(x=>UUID.test(String(x)));
    const [rechecks,followups,audits,alerts,continuity]=await Promise.all([
      ids.length?rows(env,`gift_issuance_review_recheck_events?select=id,case_id,event_kind,created_at&case_id=in.(${ids.join(',')})&order=created_at.desc,id.desc&limit=250`):[],
      ids.length?rows(env,`gift_issuance_review_followup_events?select=id,case_id,event_kind,created_at&case_id=in.(${ids.join(',')})&order=created_at.desc,id.desc&limit=250`):[],
      ids.length?rows(env,`gift_issuance_closeout_audit_events?select=id,case_id,closeout_event_id,event_kind,provider_checked_at,created_at&${scoped}case_id=in.(${ids.join(',')})&order=created_at.desc,id.desc&limit=250`):[],
      ids.length?rows(env,`gift_issuance_audit_alert_events?select=id,case_id,closeout_event_id,event_kind,source_audit_event_id,created_at&${scoped}case_id=in.(${ids.join(',')})&order=created_at.desc,id.desc&limit=250`):[],
      ids.length?rows(env,`gift_issuance_hold_continuity_events?select=id,case_id,closeout_event_id,reconciliation_event_id,source_audit_event_id,event_kind,escalation_reason,auditor_staff_user_id,provider_checked_at,created_at&${scoped}case_id=in.(${ids.join(',')})&order=created_at.desc,id.desc&limit=250`):[]
    ]);
    return sealed(json({ok:true,build:681,actor_role:auth.isOwner?'owner':'independent_auditor',
      cases:cases.map(c=>{
        const reconciliation=reconciliations.find(r=>r.case_id===c.id)||null;
        const closeout=rechecks.find(r=>r.case_id===c.id&&r.id===reconciliation?.closeout_event_id)||null;
        const source=audits.find(a=>a.case_id===c.id&&a.id===reconciliation?.source_audit_event_id)||null;
        const latestB680=alerts.find(a=>a.case_id===c.id&&a.closeout_event_id===closeout?.id)||null;
        const last=continuity.find(a=>a.case_id===c.id&&a.closeout_event_id===closeout?.id)||null;
        return {...c,reconciliation,closeout,source,latest_continuity:last,
          monitor:classifyHoldContinuity(c,closeout,rechecks.find(r=>r.case_id===c.id),
            reconciliation,latestB680,source,last,followups.filter(f=>f.case_id===c.id))};
      }),continuity_events:continuity.length,customer_messages_sent:0,
      safe_boundary:'Independent recheck and owner closure are internal HOLD evidence only; never deliver, refund, email, text or charge.'}));
  }catch{return sealed(json({ok:false,owner_hold:true,
    error:'HOLD escalation evidence cannot be verified. No customer action is permitted.'},503));}
}

export async function onRequestPost({request,env}){
  const origin=request.headers.get('origin');
  if((origin&&origin!==new URL(request.url).origin)||request.headers.get('sec-fetch-site')==='cross-site')
    return sealed(json({ok:false,error:'Cross-origin gift HOLD action refused.'},403));
  const auth=await access(request,env);if(!auth.ok)return sealed(auth.response);
  const body=await request.json().catch(()=>({}));const action=String(body.action||'');
  if(!ACTIONS.has(action)||!REASONS.has(body.escalation_reason)
    ||!['event_id','case_id','closeout_event_id','reconciliation_event_id',
      'source_audit_event_id','auditor_id'].every(k=>UUID.test(String(body[k]||'')))
    ||(action==='hold_escalated'?body.reference_event_id!=null:
      !UUID.test(String(body.reference_event_id||'')))
    ||body.acknowledge_customer_hold!==true
    ||(auth.isOwner&&action==='independent_recheck_attested')
    ||(!auth.isOwner&&action!=='independent_recheck_attested'))
    return sealed(json({ok:false,error:'Signed role, source-linked escalation and explicit HOLD acknowledgment required.'},400));
  try{
    const found=await rows(env,`gift_issuance_review_cases?select=id,stripe_session_id&id=eq.${body.case_id}&limit=1`);
    const c=found[0];if(!c||!SESSION.test(c.stripe_session_id))throw Error('Unknown gift case');
    let evidence={check:null,payment_intent:null,currency:null,expected_count:null,amount_cents:null,checked_at:null};
    let fingerprint=null;
    if(action!=='hold_escalated'){
      evidence=await providerCrossCheck(env,c.stripe_session_id);
      if(evidence.check!=='paid_verified')return sealed(json({ok:false,owner_hold:true,
        error:'Fresh read-only Stripe payment check did not pass. Customer HOLD remains.'},409));
      fingerprint=await sha256({sessionId:c.stripe_session_id,check:evidence.check,
        paymentStatus:evidence.payment_status,sessionStatus:evidence.session_status,
        live:evidence.livemode,count:evidence.expected_count,total:evidence.amount_cents,
        paymentIntent:evidence.payment_intent,currency:evidence.currency});
    }
    const res=await fetch(`${env.SUPABASE_URL}/rest/v1/rpc/record_gift_hold_continuity_event`,{
      method:'POST',redirect:'error',signal:AbortSignal.timeout(8500),headers:serviceHeaders(env),
      body:JSON.stringify({p_event_id:body.event_id,p_case_id:body.case_id,
        p_closeout_id:body.closeout_event_id,p_reconciliation_id:body.reconciliation_event_id,
        p_source_audit_id:body.source_audit_event_id,p_actor_id:auth.actor.id,
        p_auditor_id:body.auditor_id,p_action:action,p_reason:body.escalation_reason,
        p_reference_id:body.reference_event_id||null,p_provider_check:evidence.check,
        p_payment_intent:evidence.payment_intent,p_currency:evidence.currency,
        p_expected_count:evidence.expected_count,p_amount_cents:evidence.amount_cents,
        p_evidence_sha256:fingerprint,p_checked_at:evidence.checked_at})});
    if(!res.ok)throw Error('Current evidence, source or role rejected the HOLD continuity event');
    const result=await res.json();
    return sealed(json({ok:true,build:681,result,owner_hold:true,
      customer_delivery_authorized:false,customer_messages_sent:0,
      payment_mutations:0,gift_balance_mutations:0,
      next_step:action==='hold_escalated'?'Independent assigned auditor: verify current payment and gift issuance evidence.':
        action==='independent_recheck_attested'?'Owner: verify independent source and record internal closure continuity.':
          'Internal continuity recorded. Customer HOLD remains; no gift delivery is authorized.'}));
  }catch{return sealed(json({ok:false,owner_hold:true,
    error:'Source changed, reviewer unavailable or fresh evidence failed. Continue HOLD.'},409));}
}
