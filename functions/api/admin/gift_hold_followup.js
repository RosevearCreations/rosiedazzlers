import {requireStaffAccess,serviceHeaders,json} from '../_lib/staff-auth.js';
import {providerCrossCheck,sha256} from './gift_issuance_recovery_decisions.js';

const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SESSION=/^cs_(?:test|live)_[a-zA-Z0-9_-]{8,220}$/;
const ACTIONS=new Set(['exception_followup_opened','independent_outcome_rechecked','owner_followup_closed']);
const REASONS=new Set(['source_superseded','recurrence_reopened','independent_outcome_aged',
  'owner_closure_aged','owner_requested_followup']);
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
  if(!res.ok)throw Error('Gift HOLD follow-up evidence unavailable');
  const data=await res.json();if(!Array.isArray(data))throw Error('Invalid follow-up evidence');
  return data;
}
export function classifyGiftHoldFollowup(c,closeout,latestRecheck,source,latestSource,last,followups,now=Date.now()){
  const anchor=last?.provider_checked_at||source?.provider_checked_at||source?.created_at||
    closeout?.created_at||new Date(now).toISOString();
  const age_minutes=Math.max(0,Math.floor((now-Date.parse(anchor))/60000));
  const recurring=!!closeout&&followups.some(f=>f.event_kind==='recurrence_opened'&&
    Date.parse(f.created_at)>Date.parse(closeout.created_at));
  const reason=!closeout||c.status!=='ready_for_delivery_review'||latestRecheck?.id!==closeout.id?
    'source_superseded':recurring?'recurrence_reopened':age_minutes>=120&&
    source?.event_kind==='independent_recheck_attested'?'independent_outcome_aged':
      age_minutes>=120?'owner_closure_aged':'owner_requested_followup';
  const sourceCurrent=!!source&&latestSource?.id===source.id;
  const phase=!sourceCurrent?'source_hold':last?.event_kind==='exception_followup_opened'?
    'independent_followup_due':last?.event_kind==='independent_outcome_rechecked'?
      'owner_followup_due':last?.event_kind==='owner_followup_closed'?
        'internally_closed_hold':'owner_exception_review';
  const aging_band=age_minutes>=2880?'escalation_48h':age_minutes>=1440?'overdue_24h':
    age_minutes>=120?'expired_2h':age_minutes>=60?'warning_60m':'current';
  return {reason,phase,age_minutes,aging_band,owner_hold:true,customer_delivery_authorized:false,
    summary:!sourceCurrent?'Prior Build 681 outcome changed: HOLD and source review required.':
      reason==='source_superseded'?'Closeout superseded: retain customer HOLD.':
      reason==='recurrence_reopened'?'New recurrence after closure: HOLD; internal follow-up cannot close.':
      phase==='independent_followup_due'?'Separate auditor must recheck paid and issuance source evidence.':
      phase==='owner_followup_due'?'Owner follow-up is due before independent evidence expires.':
      phase==='internally_closed_hold'?'Follow-up internally closed. Continue recurrence monitoring; customer HOLD remains.':
      reason==='independent_outcome_aged'?'Independent recheck outcome expired; owner exception follow-up due.':
      reason==='owner_closure_aged'?'Owner closure evidence aged out; request a fresh separate recheck.':
        'Owner may open an extra independent follow-up. Customer HOLD remains.'};
}
export async function onRequestGet({request,env}){
  const auth=await access(request,env);if(!auth.ok)return sealed(auth.response);
  const session=String(new URL(request.url).searchParams.get('session_id')||'').trim();
  if(session&&!SESSION.test(session))return sealed(json({ok:false,error:'Invalid gift Checkout session.'},400));
  try{
    const scoped=auth.isOwner?'':`auditor_staff_user_id=eq.${auth.actor.id}&`;
    const sources=await rows(env,`gift_issuance_hold_continuity_events?select=id,case_id,closeout_event_id,event_kind,auditor_staff_user_id,provider_checked_at,created_at&${scoped}order=created_at.desc,id.desc&limit=250`);
    const allowed=[...new Set(sources.map(x=>x.case_id).filter(x=>UUID.test(String(x))))];
    if(!auth.isOwner&&!allowed.length)return sealed(json({ok:true,build:682,cases:[],followup_events:0,
      safe_boundary:'No assigned independent continuity. Customer HOLD remains.'}));
    const scope=auth.isOwner?'':`id=in.(${allowed.join(',')})&`;
    const filter=session?`stripe_session_id=eq.${encodeURIComponent(session)}&`:'';
    const cases=await rows(env,`gift_issuance_review_cases?select=id,stripe_session_id,status,updated_at&${scope}${filter}order=updated_at.desc&limit=50`);
    const ids=cases.map(c=>c.id).filter(x=>UUID.test(String(x)));
    const [rechecks,recurrences,followups]=await Promise.all([
      ids.length?rows(env,`gift_issuance_review_recheck_events?select=id,case_id,event_kind,created_at&case_id=in.(${ids.join(',')})&order=created_at.desc,id.desc&limit=250`):[],
      ids.length?rows(env,`gift_issuance_review_followup_events?select=id,case_id,event_kind,created_at&case_id=in.(${ids.join(',')})&order=created_at.desc,id.desc&limit=250`):[],
      ids.length?rows(env,`gift_issuance_hold_followup_events?select=id,case_id,closeout_event_id,continuity_event_id,event_kind,reason,auditor_staff_user_id,provider_checked_at,created_at&${scoped}case_id=in.(${ids.join(',')})&order=created_at.desc,id.desc&limit=250`):[]
    ]);
    return sealed(json({ok:true,build:682,actor_role:auth.isOwner?'owner':'independent_auditor',
      cases:cases.map(c=>{
        const latestSource=sources.find(e=>e.case_id===c.id)||null;
        const source=latestSource&&['independent_recheck_attested','owner_continuity_closed']
          .includes(latestSource.event_kind)?latestSource:null;
        const closeout=rechecks.find(e=>e.id===source?.closeout_event_id)||null;
        const last=followups.find(e=>e.case_id===c.id&&e.closeout_event_id===closeout?.id)||null;
        return {...c,source,closeout,latest_followup:last,
          monitor:classifyGiftHoldFollowup(c,closeout,rechecks.find(e=>e.case_id===c.id),
            source,latestSource,last,recurrences.filter(e=>e.case_id===c.id))};
      }),followup_events:followups.length,customer_messages_sent:0,
      safe_boundary:'Source-linked internal HOLD monitoring only; no resend, refund, gift balance, payment, email, text or delivery.'}));
  }catch{return sealed(json({ok:false,owner_hold:true,
    error:'Independent follow-up evidence unavailable. Keep customer HOLD.'},503));}
}
export async function onRequestPost({request,env}){
  const origin=request.headers.get('origin');
  if((origin&&origin!==new URL(request.url).origin)||request.headers.get('sec-fetch-site')==='cross-site')
    return sealed(json({ok:false,error:'Cross-origin gift follow-up refused.'},403));
  const auth=await access(request,env);if(!auth.ok)return sealed(auth.response);
  const body=await request.json().catch(()=>({}));const action=String(body.action||'');
  if(!ACTIONS.has(action)||!REASONS.has(body.reason)
    ||!['event_id','case_id','closeout_event_id','continuity_event_id','auditor_id']
      .every(k=>UUID.test(String(body[k]||'')))
    ||(action==='exception_followup_opened'?body.reference_event_id!=null:
      !UUID.test(String(body.reference_event_id||'')))
    ||body.acknowledge_customer_hold!==true
    ||(auth.isOwner&&action==='independent_outcome_rechecked')
    ||(!auth.isOwner&&action!=='independent_outcome_rechecked'))
    return sealed(json({ok:false,error:'Signed role, current source and continued customer HOLD acknowledgment required.'},400));
  try{
    const found=await rows(env,`gift_issuance_review_cases?select=id,stripe_session_id&id=eq.${body.case_id}&limit=1`);
    const c=found[0];if(!c||!SESSION.test(c.stripe_session_id))throw Error('Unknown gift recovery case');
    let evidence={check:null,payment_intent:null,currency:null,expected_count:null,amount_cents:null,checked_at:null};
    let fingerprint=null;
    if(action!=='exception_followup_opened'){
      evidence=await providerCrossCheck(env,c.stripe_session_id);
      if(evidence.check!=='paid_verified')return sealed(json({ok:false,owner_hold:true,
        error:'Read-only provider proof is not paid and current. Retain HOLD.'},409));
      fingerprint=await sha256({sessionId:c.stripe_session_id,check:evidence.check,
        paymentStatus:evidence.payment_status,sessionStatus:evidence.session_status,
        live:evidence.livemode,count:evidence.expected_count,total:evidence.amount_cents,
        paymentIntent:evidence.payment_intent,currency:evidence.currency});
    }
    const response=await fetch(`${env.SUPABASE_URL}/rest/v1/rpc/record_gift_hold_followup_event`,{
      method:'POST',redirect:'error',signal:AbortSignal.timeout(8500),headers:serviceHeaders(env),
      body:JSON.stringify({p_event_id:body.event_id,p_case_id:body.case_id,
        p_closeout_id:body.closeout_event_id,p_continuity_id:body.continuity_event_id,
        p_actor_id:auth.actor.id,p_auditor_id:body.auditor_id,p_action:action,
        p_reason:body.reason,p_reference_id:body.reference_event_id||null,
        p_provider_check:evidence.check,p_payment_intent:evidence.payment_intent,
        p_currency:evidence.currency,p_expected_count:evidence.expected_count,
        p_amount_cents:evidence.amount_cents,p_evidence_sha256:fingerprint,
        p_checked_at:evidence.checked_at})});
    if(!response.ok)throw Error('Current source evidence or independent role rejected follow-up');
    const result=await response.json();
    return sealed(json({ok:true,build:682,result,owner_hold:true,
      customer_delivery_authorized:false,customer_messages_sent:0,
      payment_mutations:0,gift_balance_mutations:0,
      next_step:action==='exception_followup_opened'?'Separate assigned auditor: verify the current source and gift evidence.':
        action==='independent_outcome_rechecked'?'Owner: review the fresh independent outcome before two hours.':
          'Internal follow-up recorded. Customer HOLD remains, with no delivery authorization.'}));
  }catch{return sealed(json({ok:false,owner_hold:true,
    error:'Recurrence, changed source or independent recheck failure. Keep HOLD.'},409));}
}
