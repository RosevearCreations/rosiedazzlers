import {requireStaffAccess,serviceHeaders,json} from '../_lib/staff-auth.js';
import {providerCrossCheck,sha256} from './gift_issuance_recovery_decisions.js';

const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SESSION=/^cs_(?:test|live)_[a-zA-Z0-9_-]{8,220}$/;
const ACTIONS=new Set(['owner_renewal_requested','independent_recurrence_reassessed',
  'owner_hold_continuity_acknowledged']);
const REASONS=new Set(['recurrence_reopened','source_superseded',
  'followup_proof_aged','owner_requested_renewal']);
function sealed(response){
  const h=new Headers(response.headers);h.set('Cache-Control','no-store, private');
  h.set('Referrer-Policy','no-referrer');h.set('X-Content-Type-Options','nosniff');
  return new Response(response.body,{status:response.status,headers:h});
}
async function access(request,env){
  const auth=await requireStaffAccess({request,env,allowLegacyAdminFallback:false});
  if(!auth.ok)return {ok:false,response:auth.response};
  const actor=auth.actor;
  if(auth.auth_mode!=='session'||!UUID.test(String(actor?.id||''))||
    !(actor.is_admin||['senior_detailer','detailer'].includes(actor.role_code)))
    return {ok:false,response:json({ok:false,error:'Signed-in owner or separate auditor required.'},403)};
  return {ok:true,actor,isOwner:!!actor.is_admin};
}
async function rows(env,query){
  const response=await fetch(`${env.SUPABASE_URL}/rest/v1/${query}`,{
    method:'GET',redirect:'error',headers:serviceHeaders(env),signal:AbortSignal.timeout(8500)});
  if(!response.ok)throw Error('Current gift HOLD renewal evidence unavailable');
  const data=await response.json();if(!Array.isArray(data))throw Error('Invalid renewal evidence');
  return data;
}
export function classifyGiftHoldRenewal(c,base,latestBase,closeout,latestRecheck,
  source,latestSource,last,recurrences,now=Date.now()){
  const anchor=last?.provider_checked_at||base?.provider_checked_at||base?.created_at||
    new Date(now).toISOString();
  const age_minutes=Math.max(0,Math.floor((now-Date.parse(anchor))/60000));
  const recurring=!!base&&recurrences.some(e=>e.event_kind==='recurrence_opened'&&
    Date.parse(e.created_at)>Date.parse(base.created_at));
  const sourceCurrent=!!base&&!!source&&!!closeout&&latestBase?.id===base.id&&
    latestSource?.id===source.id&&latestRecheck?.id===closeout.id;
  const reason=recurring?'recurrence_reopened':!sourceCurrent||
    c.status!=='ready_for_delivery_review'?'source_superseded':
    ['owner_renewal_requested','independent_recurrence_reassessed'].includes(last?.event_kind)?
      last.reason:age_minutes>=120?'followup_proof_aged':'owner_requested_renewal';
  const phase=!base?'no_owner_followup':last?.event_kind==='owner_renewal_requested'?
    'independent_reassessment_due':last?.event_kind==='independent_recurrence_reassessed'?
      'owner_hold_acknowledgment_due':last?.event_kind==='owner_hold_continuity_acknowledged'?
        'hold_continuity_recorded':'renewal_review_due';
  const aging_band=age_minutes>=2880?'escalation_48h':age_minutes>=1440?'overdue_24h':
    age_minutes>=120?'expired_2h':age_minutes>=60?'warning_60m':'current';
  return {reason,phase,age_minutes,aging_band,recurrence_detected:recurring,
    source_current:sourceCurrent,owner_hold:true,customer_delivery_authorized:false,
    summary:!base?'No Build 682 owner closure is available: retain HOLD.':
      reason==='recurrence_reopened'?'Recurrence after Build 682 closure: independent HOLD reassessment required.':
      reason==='source_superseded'?'Follow-up source or case changed: HOLD; no continuity acknowledgment.':
      phase==='independent_reassessment_due'?'A different signed-in auditor must refresh paid, gift and receipt proof.':
      phase==='owner_hold_acknowledgment_due'?'Owner must acknowledge the separate HOLD reassessment before evidence ages.':
      phase==='hold_continuity_recorded'?'Internal HOLD acknowledgment recorded; keep monitoring and never dispatch.':
      reason==='followup_proof_aged'?'Build 682 paid proof has expired; request independent evidence renewal.':
        'Owner may request proactive renewed evidence. Customer HOLD remains.'};
}
export async function onRequestGet({request,env}){
  const auth=await access(request,env);if(!auth.ok)return sealed(auth.response);
  const session=String(new URL(request.url).searchParams.get('session_id')||'').trim();
  if(session&&!SESSION.test(session))return sealed(json({ok:false,error:'Invalid gift checkout session.'},400));
  try{
    const scoped=auth.isOwner?'':`auditor_staff_user_id=eq.${auth.actor.id}&`;
    const bases=await rows(env,`gift_issuance_hold_followup_events?select=id,case_id,closeout_event_id,continuity_event_id,event_kind,reason,auditor_staff_user_id,provider_checked_at,created_at&${scoped}order=created_at.desc,id.desc&limit=250`);
    const allowed=[...new Set(bases.map(x=>x.case_id).filter(x=>UUID.test(String(x))))];
    if(!auth.isOwner&&!allowed.length)return sealed(json({ok:true,build:683,cases:[],renewal_events:0,
      safe_boundary:'No assigned prior evidence; customer HOLD remains.'}));
    const caseScope=auth.isOwner?'':`id=in.(${allowed.join(',')})&`;
    const filter=session?`stripe_session_id=eq.${encodeURIComponent(session)}&`:'';
    const cases=await rows(env,`gift_issuance_review_cases?select=id,stripe_session_id,status,updated_at&${caseScope}${filter}order=updated_at.desc&limit=50`);
    const ids=cases.map(c=>c.id).filter(x=>UUID.test(String(x)));
    const [sources,rechecks,recurrences,renewals]=await Promise.all([
      ids.length?rows(env,`gift_issuance_hold_continuity_events?select=id,case_id,closeout_event_id,event_kind,created_at&case_id=in.(${ids.join(',')})&order=created_at.desc,id.desc&limit=250`):[],
      ids.length?rows(env,`gift_issuance_review_recheck_events?select=id,case_id,event_kind,created_at&case_id=in.(${ids.join(',')})&order=created_at.desc,id.desc&limit=250`):[],
      ids.length?rows(env,`gift_issuance_review_followup_events?select=id,case_id,event_kind,created_at&case_id=in.(${ids.join(',')})&order=created_at.desc,id.desc&limit=250`):[],
      ids.length?rows(env,`gift_issuance_hold_renewal_events?select=id,case_id,followup_event_id,event_kind,reason,auditor_staff_user_id,recurrence_detected,provider_checked_at,created_at&${scoped}case_id=in.(${ids.join(',')})&order=created_at.desc,id.desc&limit=250`):[]
    ]);
    return sealed(json({ok:true,build:683,actor_role:auth.isOwner?'owner':'independent_auditor',
      cases:cases.map(c=>{
        const latestBase=bases.find(e=>e.case_id===c.id)||null;
        const base=bases.find(e=>e.case_id===c.id&&e.event_kind==='owner_followup_closed')||null;
        const source=sources.find(e=>e.id===base?.continuity_event_id)||null;
        const closeout=rechecks.find(e=>e.id===base?.closeout_event_id)||null;
        const latestSource=sources.find(e=>e.case_id===c.id)||null;
        const last=renewals.find(e=>e.case_id===c.id)||null;
        return {...c,base,latest_renewal:last,
          monitor:classifyGiftHoldRenewal(c,base,latestBase,closeout,
            rechecks.find(e=>e.case_id===c.id),source,latestSource,last,
            recurrences.filter(e=>e.case_id===c.id))};
      }),renewal_events:renewals.length,customer_messages_sent:0,
      safe_boundary:'Owner/auditor-only HOLD evidence. No remote integration, delivery, resend, refund, payment, balance, email or SMS.'}));
  }catch{return sealed(json({ok:false,owner_hold:true,
    error:'Gift HOLD evidence unavailable; continue HOLD and request manual review.'},503));}
}
export async function onRequestPost({request,env}){
  const origin=request.headers.get('origin');
  if((origin&&origin!==new URL(request.url).origin)||request.headers.get('sec-fetch-site')==='cross-site')
    return sealed(json({ok:false,error:'Cross-origin HOLD request refused.'},403));
  const auth=await access(request,env);if(!auth.ok)return sealed(auth.response);
  const b=await request.json().catch(()=>({}));const action=String(b.action||'');
  if(!ACTIONS.has(action)||!REASONS.has(b.reason)||
    !['event_id','case_id','followup_event_id','auditor_id']
      .every(k=>UUID.test(String(b[k]||'')))||
    (action==='owner_renewal_requested'?b.reference_event_id!=null:
      !UUID.test(String(b.reference_event_id||'')))||
    b.acknowledge_customer_hold!==true||
    (auth.isOwner&&action==='independent_recurrence_reassessed')||
    (!auth.isOwner&&action!=='independent_recurrence_reassessed'))
    return sealed(json({ok:false,error:'Role, linked follow-up and continued HOLD acknowledgment required.'},400));
  try{
    const found=await rows(env,`gift_issuance_review_cases?select=id,stripe_session_id&id=eq.${b.case_id}&limit=1`);
    const c=found[0];if(!c||!SESSION.test(c.stripe_session_id))throw Error('Unknown gift HOLD case');
    let evidence={check:null,payment_intent:null,currency:null,expected_count:null,
      amount_cents:null,checked_at:null};
    let fingerprint=null;
    if(action!=='owner_renewal_requested'){
      evidence=await providerCrossCheck(env,c.stripe_session_id);
      if(evidence.check!=='paid_verified')return sealed(json({ok:false,owner_hold:true,
        error:'Read-only provider proof unavailable or not paid. Continue HOLD.'},409));
      fingerprint=await sha256({sessionId:c.stripe_session_id,check:evidence.check,
        paymentStatus:evidence.payment_status,sessionStatus:evidence.session_status,
        live:evidence.livemode,count:evidence.expected_count,total:evidence.amount_cents,
        paymentIntent:evidence.payment_intent,currency:evidence.currency});
    }
    const response=await fetch(`${env.SUPABASE_URL}/rest/v1/rpc/record_gift_hold_renewal_event`,{
      method:'POST',redirect:'error',signal:AbortSignal.timeout(8500),headers:serviceHeaders(env),
      body:JSON.stringify({p_event_id:b.event_id,p_case_id:b.case_id,
        p_followup_id:b.followup_event_id,p_actor_id:auth.actor.id,p_auditor_id:b.auditor_id,
        p_action:action,p_reason:b.reason,p_reference_id:b.reference_event_id||null,
        p_provider_check:evidence.check,p_payment_intent:evidence.payment_intent,
        p_currency:evidence.currency,p_expected_count:evidence.expected_count,
        p_amount_cents:evidence.amount_cents,p_evidence_sha256:fingerprint,
        p_checked_at:evidence.checked_at})});
    if(!response.ok)throw Error('HOLD renewal source, signed auditor or fresh proof rejected');
    const result=await response.json();
    return sealed(json({ok:true,build:683,result,owner_hold:true,
      customer_delivery_authorized:false,customer_messages_sent:0,
      payment_mutations:0,gift_balance_mutations:0,integration_events_dispatched:0,
      next_step:action==='owner_renewal_requested'?
        'Separate assigned auditor: reassess the linked HOLD and paid/issuance proof.':
        action==='independent_recurrence_reassessed'?
          'Owner: acknowledge the independent HOLD continuity without releasing the customer.':
          'HOLD continuity recorded internally. Continue recurrence monitoring; no customer dispatch.'}));
  }catch{return sealed(json({ok:false,owner_hold:true,
    error:'Changed recurrence, expired proof or independent renewal rejected. Keep HOLD.'},409));}
}
