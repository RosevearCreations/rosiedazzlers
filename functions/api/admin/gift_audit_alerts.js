import {requireStaffAccess,serviceHeaders,json} from '../_lib/staff-auth.js';
import {providerCrossCheck,sha256} from './gift_issuance_recovery_decisions.js';

const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SESSION=/^cs_(?:test|live)_[a-zA-Z0-9_-]{8,220}$/;
const ACTIONS=new Set(['alert_opened','renewal_requested','independent_renewal_attested','owner_hold_reconciled']);
const REASONS=new Set(['case_reopened','recurrence_reopened','watch_unassigned','evidence_renewal_missing',
  'independent_review_due','owner_ack_pending','evidence_aging']);

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
    return {ok:false,response:json({ok:false,error:'Signed-in owner or independent gift auditor required.'},403)};
  return {ok:true,actor,isOwner:!!actor.is_admin};
}
async function rows(env,query){
  const res=await fetch(`${env.SUPABASE_URL}/rest/v1/${query}`,{
    method:'GET',redirect:'error',headers:serviceHeaders(env),signal:AbortSignal.timeout(8500)});
  if(!res.ok)throw Error('Gift alert evidence unavailable');
  const data=await res.json();if(!Array.isArray(data))throw Error('Invalid gift alert evidence');
  return data;
}

export function classifyGiftAuditAlert(c,latestRecheck,closeout,audit,followups,now=Date.now()){
  const base=Date.parse(audit?.provider_checked_at||audit?.created_at||closeout?.created_at||new Date(now).toISOString());
  const ageMinutes=Math.max(0,Math.floor((now-base)/60000));
  const agingBand=ageMinutes>=2880?'escalation_overdue':ageMinutes>=1440?'overdue_24h':
    ageMinutes>=120?'expired_2h':ageMinutes>=60?'renewal_warning':'current';
  let reason=null;
  if(!closeout||c.status!=='ready_for_delivery_review'||latestRecheck?.id!==closeout.id)
    reason='case_reopened';
  else if(followups.some(e=>e.event_kind==='recurrence_opened'&&
    Date.parse(e.created_at)>Date.parse(closeout.created_at)))reason='recurrence_reopened';
  else if(!audit)reason='watch_unassigned';
  else if(audit.event_kind==='watch_opened')reason='evidence_renewal_missing';
  else if(audit.event_kind==='evidence_renewed')reason='independent_review_due';
  else if(audit.event_kind==='independent_audit_recorded')reason='owner_ack_pending';
  else if(ageMinutes>=120)reason='evidence_aging';
  return {reason,owner_hold:!!reason,age_minutes:ageMinutes,aging_band:agingBand,
    priority:reason==='recurrence_reopened'||reason==='case_reopened'?'critical':
      agingBand==='escalation_overdue'?'escalation':agingBand==='overdue_24h'?'overdue':
        reason?'review':'monitor',
    summary:reason==='recurrence_reopened'?'Post-closeout recurrence: HOLD and independent recheck required.':
      reason==='case_reopened'?'Closeout superseded or case reopened: HOLD.':
      reason==='watch_unassigned'?'Assign a separate independent B679 auditor before reconciliation.':
      reason==='evidence_renewal_missing'?'Owner must renew Stripe and certificate evidence.':
      reason==='independent_review_due'?'Independent auditor finding is pending; evidence age is monitored.':
      reason==='owner_ack_pending'?'Owner acknowledgment pending after independent audit.':
      reason==='evidence_aging'?'Independent proof expired; renew, re-audit, then owner-confirm.':
        'Evidence current; continue recurrence monitoring. No customer authorization.'};
}

export async function onRequestGet({request,env}){
  const auth=await access(request,env);if(!auth.ok)return sealed(auth.response);
  const session=String(new URL(request.url).searchParams.get('session_id')||'').trim();
  if(session&&!SESSION.test(session))return sealed(json({ok:false,error:'Invalid gift Checkout session.'},400));
  try{
    const scoped=auth.isOwner?'':`auditor_staff_user_id=eq.${auth.actor.id}&`;
    const watches=await rows(env,`gift_issuance_closeout_audit_events?select=id,case_id,closeout_event_id,event_kind,auditor_staff_user_id,provider_checked_at,created_at&${scoped}order=created_at.desc,id.desc&limit=250`);
    const allowed=[...new Set(watches.map(e=>e.case_id).filter(x=>UUID.test(String(x))))];
    if(!auth.isOwner&&!allowed.length)return sealed(json({ok:true,build:680,cases:[],alert_events:0,
      safe_boundary:'No independent watch assigned. All customer actions remain forbidden.'}));
    const caseScope=auth.isOwner?'':`id=in.(${allowed.join(',')})&`;
    const filter=session?`stripe_session_id=eq.${encodeURIComponent(session)}&`:'';
    const cases=await rows(env,`gift_issuance_review_cases?select=id,stripe_session_id,status,assigned_reviewer_id,updated_at&${caseScope}${filter}order=updated_at.desc&limit=50`);
    const ids=cases.map(c=>c.id).filter(x=>UUID.test(String(x)));
    const [rechecks,followups,alerts]=await Promise.all([
      ids.length?rows(env,`gift_issuance_review_recheck_events?select=id,case_id,event_kind,created_at&case_id=in.(${ids.join(',')})&order=created_at.desc,id.desc&limit=250`):[],
      ids.length?rows(env,`gift_issuance_review_followup_events?select=id,case_id,event_kind,created_at&case_id=in.(${ids.join(',')})&order=created_at.desc,id.desc&limit=250`):[],
      ids.length?rows(env,`gift_issuance_audit_alert_events?select=id,case_id,closeout_event_id,event_kind,source_audit_event_id,reference_event_id,alert_reason,evidence_age_minutes,auditor_staff_user_id,created_at&${scoped}case_id=in.(${ids.join(',')})&order=created_at.desc,id.desc&limit=250`):[]
    ]);
    const result=cases.map(c=>{
      const latestRecheck=rechecks.find(r=>r.case_id===c.id)||null;
      const closeout=rechecks.find(r=>r.case_id===c.id&&r.event_kind==='owner_closeout_recorded')||null;
      const audit=watches.find(w=>w.case_id===c.id&&w.closeout_event_id===closeout?.id)||null;
      const watch=watches.find(w=>w.case_id===c.id&&w.closeout_event_id===closeout?.id&&w.event_kind==='watch_opened')||null;
      const latestAlert=alerts.find(a=>a.case_id===c.id&&a.closeout_event_id===closeout?.id)||null;
      const monitor=classifyGiftAuditAlert(c,latestRecheck,closeout,audit,followups.filter(f=>f.case_id===c.id));
      return {...c,closeout,latest_audit:audit,watch,latest_alert:latestAlert,monitor};
    });
    return sealed(json({ok:true,build:680,actor_role:auth.isOwner?'owner':'independent_auditor',
      cases:result,alert_events:alerts.length,customer_messages_sent:0,
      safe_boundary:'Internal alerts only. HOLD reconciliation cannot issue, deliver, refund, email, text or charge a customer.'}));
  }catch{return sealed(json({ok:false,owner_hold:true,
    error:'Gift audit alert evidence cannot be verified. Retain all existing holds.'},503));}
}

export async function onRequestPost({request,env}){
  const origin=request.headers.get('origin');
  if(origin&&origin!==new URL(request.url).origin||request.headers.get('sec-fetch-site')==='cross-site')
    return sealed(json({ok:false,error:'Cross-origin audit alert refused.'},403));
  const auth=await access(request,env);if(!auth.ok)return sealed(auth.response);
  const body=await request.json().catch(()=>({}));const action=String(body.action||'');
  if(!ACTIONS.has(action)||!UUID.test(String(body.event_id||''))
     ||!UUID.test(String(body.case_id||''))||!UUID.test(String(body.closeout_event_id||''))
     ||!UUID.test(String(body.auditor_id||''))||!REASONS.has(body.alert_reason)
     ||(action==='alert_opened'?body.reference_event_id!=null:
       !UUID.test(String(body.reference_event_id||'')))
     ||(body.source_audit_event_id!=null&&!UUID.test(String(body.source_audit_event_id)))
     ||body.acknowledge_customer_hold!==true
     ||(auth.isOwner&&action==='independent_renewal_attested')
     ||(!auth.isOwner&&action!=='independent_renewal_attested'))
    return sealed(json({ok:false,error:'Signed-in role, source links and explicit HOLD acknowledgment required.'},400));
  try{
    const found=await rows(env,`gift_issuance_review_cases?select=id,stripe_session_id&id=eq.${body.case_id}&limit=1`);
    const c=found[0];if(!c||!SESSION.test(c.stripe_session_id))throw Error('Unknown case');
    let evidence={check:null,payment_intent:null,currency:null,expected_count:null,amount_cents:null,checked_at:null};
    let fingerprint=null;
    if(action==='independent_renewal_attested'||action==='owner_hold_reconciled'){
      evidence=await providerCrossCheck(env,c.stripe_session_id);
      if(evidence.check!=='paid_verified')return sealed(json({ok:false,owner_hold:true,
        error:'Read-only live Stripe verification did not confirm payment. Owner HOLD remains.'},409));
      fingerprint=await sha256({sessionId:c.stripe_session_id,check:evidence.check,
        paymentStatus:evidence.payment_status,sessionStatus:evidence.session_status,
        live:evidence.livemode,count:evidence.expected_count,total:evidence.amount_cents,
        paymentIntent:evidence.payment_intent,currency:evidence.currency});
    }
    const res=await fetch(`${env.SUPABASE_URL}/rest/v1/rpc/record_gift_audit_alert_event`,{
      method:'POST',redirect:'error',signal:AbortSignal.timeout(8500),headers:serviceHeaders(env),
      body:JSON.stringify({p_event_id:body.event_id,p_case_id:body.case_id,
        p_closeout_id:body.closeout_event_id,p_actor_id:auth.actor.id,p_auditor_id:body.auditor_id,
        p_action:action,p_reference_id:body.reference_event_id||null,
        p_source_audit_id:body.source_audit_event_id||null,p_alert_reason:body.alert_reason,
        p_provider_check:evidence.check,p_payment_intent:evidence.payment_intent,
        p_currency:evidence.currency,p_expected_count:evidence.expected_count,
        p_amount_cents:evidence.amount_cents,p_evidence_sha256:fingerprint,
        p_checked_at:evidence.checked_at})});
    if(!res.ok)throw Error('Source evidence does not permit HOLD reconciliation');
    const result=await res.json();
    return sealed(json({ok:true,build:680,result,owner_hold:true,customer_delivery_authorized:false,
      customer_messages_sent:0,payment_mutations:0,gift_balance_mutations:0,
      next_step:action==='alert_opened'?'Owner: request independent evidence renewal; no customer alert sent.':
        action==='renewal_requested'?'Auditor: complete a new Build 679 audit before attesting here.':
        action==='independent_renewal_attested'?'Owner: acknowledge the new Build 679 audit, then reconcile HOLD.':
          'Owner HOLD reconciled internally, never released for customer delivery.'}));
  }catch{return sealed(json({ok:false,owner_hold:true,
    error:'Source changed, role is not independent, or fresh evidence failed. Keep HOLD.'},409));}
}
