import {requireStaffAccess,serviceHeaders,json} from '../_lib/staff-auth.js';
import {providerCrossCheck,sha256} from './gift_issuance_recovery_decisions.js';

const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SESSION=/^cs_(?:test|live)_[a-zA-Z0-9_-]{8,220}$/;
const REASON={watch_opened:'post_closeout_watch',evidence_renewed:'fresh_paid_evidence',
  independent_audit_recorded:'independent_verified',owner_audit_acknowledged:'owner_no_dispatch_confirmed'};

function privateResponse(response){
  const headers=new Headers(response.headers);
  headers.set('Cache-Control','no-store, private');
  headers.set('Referrer-Policy','no-referrer');
  headers.set('X-Content-Type-Options','nosniff');
  return new Response(response.body,{status:response.status,headers});
}
async function access(request,env){
  const auth=await requireStaffAccess({request,env,allowLegacyAdminFallback:false});
  if(!auth.ok)return {ok:false,response:auth.response};
  const actor=auth.actor;
  if(auth.auth_mode!=='session'||!UUID.test(String(actor?.id||''))||
     !(actor.is_admin||['senior_detailer','detailer'].includes(actor.role_code)))
    return {ok:false,response:json({ok:false,error:'Signed-in owner or authorized staff auditor required.'},403)};
  return {ok:true,actor,isOwner:!!actor.is_admin};
}
async function rows(env,query){
  const response=await fetch(`${env.SUPABASE_URL}/rest/v1/${query}`,{
    method:'GET',redirect:'error',headers:serviceHeaders(env),signal:AbortSignal.timeout(8500)});
  if(!response.ok)throw Error('Audit evidence registry unavailable');
  const data=await response.json();
  if(!Array.isArray(data))throw Error('Malformed audit evidence registry');
  return data;
}
export function describeWatch(caseRow,latestCloseout,latestAudit,followups,now=Date.now()){
  if(!latestCloseout||latestCloseout.event_kind!=='owner_closeout_recorded')
    return {status:'HOLD',next:'No independently refreshed, owner-closed recheck exists.'};
  const reopened=followups.some(e=>e.event_kind==='recurrence_opened'&&
    Date.parse(e.created_at)>Date.parse(latestCloseout.created_at));
  if(reopened)return {status:'HOLD',next:'A new recurrence followed closeout. Reopen independent recovery review first.'};
  if(!latestAudit)return {status:'WATCH DUE',next:'Owner: assign a different independent auditor and open the closeout watch.'};
  const ageMs=now-Date.parse(latestAudit.provider_checked_at||latestAudit.created_at);
  const stale=ageMs>2*3600*1000;
  if(latestAudit.event_kind==='watch_opened'||latestAudit.event_kind==='evidence_renewed'&&stale)
    return {status:'RENEWAL DUE',next:'Owner: record a fresh read-only Stripe and certificate evidence renewal.'};
  if(latestAudit.event_kind==='evidence_renewed')
    return {status:'INDEPENDENT AUDIT',next:'Only the separately assigned auditor may record the current review.'};
  if(latestAudit.event_kind==='independent_audit_recorded'&&!stale)
    return {status:'OWNER ACK',next:'Owner: acknowledge the independent audit without customer action.'};
  if(latestAudit.event_kind==='owner_audit_acknowledged'&&!stale)
    return {status:'WATCH CURRENT',next:'Customer-safe internal audit complete. Continue watching for renewed exceptions.'};
  return {status:'RENEWAL DUE',next:'Audit evidence aged out. Owner must renew and obtain another independent finding.'};
}

export async function onRequestGet({request,env}){
  const auth=await access(request,env);
  if(!auth.ok)return privateResponse(auth.response);
  const session=String(new URL(request.url).searchParams.get('session_id')||'').trim();
  if(session&&!SESSION.test(session))return privateResponse(json({ok:false,error:'Invalid gift Checkout session.'},400));
  try{
    const auditFilter=auth.isOwner?'':`auditor_staff_user_id=eq.${auth.actor.id}&`;
    const audits=await rows(env,`gift_issuance_closeout_audit_events?select=id,case_id,closeout_event_id,event_kind,actor_staff_user_id,auditor_staff_user_id,reference_event_id,provider_checked_at,decision_evidence_age_hours,created_at&${auditFilter}order=created_at.desc,id.desc&limit=250`);
    const authorizedCases=[...new Set(audits.map(a=>a.case_id).filter(id=>UUID.test(String(id))))];
    if(!auth.isOwner&&!authorizedCases.length)return privateResponse(json({ok:true,build:679,cases:[],auditors:[],
      safe_boundary:'No assigned audit. No customer delivery or payment mutation.',customer_messages_sent:0}));
    const scope=auth.isOwner?'':`id=in.(${authorizedCases.join(',')})&`;
    const filter=session?`stripe_session_id=eq.${encodeURIComponent(session)}&`:'';
    const cases=await rows(env,`gift_issuance_review_cases?select=id,decision_id,stripe_session_id,assigned_reviewer_id,status,version,updated_at&${scope}${filter}order=updated_at.desc&limit=50`);
    const ids=cases.map(c=>c.id).filter(id=>UUID.test(String(id)));
    const [rechecks,followups,candidates]=await Promise.all([
      ids.length?rows(env,`gift_issuance_review_recheck_events?select=id,case_id,event_kind,actor_staff_user_id,reviewer_staff_user_id,created_at&case_id=in.(${ids.join(',')})&order=created_at.desc,id.desc&limit=250`):[],
      ids.length?rows(env,`gift_issuance_review_followup_events?select=id,case_id,event_kind,created_at&case_id=in.(${ids.join(',')})&order=created_at.desc,id.desc&limit=250`):[],
      auth.isOwner?rows(env,'staff_users?select=id,full_name,role_code&is_active=eq.true&role_code=in.(senior_detailer,detailer)&order=full_name.asc&limit=100'):[]
    ]);
    const detailed=cases.map(c=>{
      const closeout=rechecks.find(e=>e.case_id===c.id)||null;
      const latestAudit=audits.find(a=>a.case_id===c.id&&a.closeout_event_id===closeout?.id)||null;
      const watch=audits.find(a=>a.case_id===c.id&&a.closeout_event_id===closeout?.id&&a.event_kind==='watch_opened')||null;
      const state=describeWatch(c,closeout,latestAudit,followups.filter(e=>e.case_id===c.id));
      return {...c,latest_closeout:closeout?.event_kind==='owner_closeout_recorded'?closeout:null,
        latest_audit:latestAudit,watch,audit_status:state.status,safe_next_action:state.next};
    });
    return privateResponse(json({ok:true,build:679,actor_role:auth.isOwner?'owner':'independent_auditor',
      cases:detailed,auditors:candidates,audit_events:audits.length,customer_messages_sent:0,
      safe_boundary:'Audit and recurrence watch only. No gift issuance, balance, Stripe charge/refund, email, SMS, or customer delivery.'}));
  }catch{return privateResponse(json({ok:false,owner_recovery_hold:true,
    error:'Current audit or recurrence watch cannot be reconciled. Keep the hold.'},503));}
}

export async function onRequestPost({request,env}){
  const origin=request.headers.get('origin');
  if(origin&&origin!==new URL(request.url).origin||request.headers.get('sec-fetch-site')==='cross-site')
    return privateResponse(json({ok:false,error:'Cross-origin audit operation refused.'},403));
  const auth=await access(request,env);
  if(!auth.ok)return privateResponse(auth.response);
  const body=await request.json().catch(()=>({}));
  const action=String(body.action||'');
  if(!UUID.test(String(body.event_id||''))||!UUID.test(String(body.case_id||''))
     ||!UUID.test(String(body.closeout_event_id||''))||!UUID.test(String(body.auditor_id||''))
     ||!Object.hasOwn(REASON,action)||body.reason_code!==REASON[action]
     ||(action==='watch_opened'&&body.reference_event_id!=null)
     ||(action!=='watch_opened'&&!UUID.test(String(body.reference_event_id||'')))
     ||body.acknowledge_no_customer_action!==true
     ||(auth.isOwner&&action==='independent_audit_recorded')
     ||(!auth.isOwner&&action!=='independent_audit_recorded'))
    return privateResponse(json({ok:false,error:'Signed-in role, exact audit link, reason and no-customer-action acknowledgment required.'},400));
  try{
    const cases=await rows(env,`gift_issuance_review_cases?select=id,stripe_session_id&id=eq.${body.case_id}&limit=1`);
    const c=cases[0];
    if(!c||!SESSION.test(c.stripe_session_id))throw Error('Unknown case');
    let evidence={check:null,payment_intent:null,currency:null,expected_count:null,amount_cents:null,checked_at:null};
    let fingerprint=null;
    if(action!=='watch_opened'){
      evidence=await providerCrossCheck(env,c.stripe_session_id);
      if(evidence.check!=='paid_verified')return privateResponse(json({ok:false,owner_recovery_hold:true,
        error:'Fresh provider payment, cart and line-count verification did not pass. Keep hold.'},409));
      fingerprint=await sha256({sessionId:c.stripe_session_id,check:evidence.check,
        paymentStatus:evidence.payment_status,sessionStatus:evidence.session_status,
        live:evidence.livemode,count:evidence.expected_count,total:evidence.amount_cents,
        paymentIntent:evidence.payment_intent,currency:evidence.currency});
    }
    const res=await fetch(`${env.SUPABASE_URL}/rest/v1/rpc/record_gift_closeout_audit_event`,{
      method:'POST',redirect:'error',signal:AbortSignal.timeout(8500),headers:serviceHeaders(env),
      body:JSON.stringify({p_event_id:body.event_id,p_case_id:body.case_id,
        p_closeout_id:body.closeout_event_id,p_actor_id:auth.actor.id,
        p_auditor_id:body.auditor_id,p_action:action,
        p_reference_id:body.reference_event_id||null,p_provider_check:evidence.check,
        p_payment_intent:evidence.payment_intent,p_currency:evidence.currency,
        p_expected_count:evidence.expected_count,p_amount_cents:evidence.amount_cents,
        p_evidence_sha256:fingerprint,p_checked_at:evidence.checked_at})
    });
    if(!res.ok)throw Error('Audit transaction refused by source evidence');
    const result=await res.json();
    return privateResponse(json({ok:true,build:679,result,
      customer_messages_sent:0,payment_mutations:0,gift_balance_mutations:0,
      next_step:action==='watch_opened'?'Owner must renew live evidence before the separately assigned auditor can inspect it.'
        :action==='evidence_renewed'?'Fresh evidence recorded; assigned independent auditor must verify it within two hours.'
        :action==='independent_audit_recorded'?'Independent finding saved. Owner acknowledgment is separate and has no delivery authority.'
        :'Owner acknowledged the customer-safe audit. Continue recurrence monitoring; no customer action occurred.'}));
  }catch{return privateResponse(json({ok:false,owner_recovery_hold:true,
    error:'Audit conflict, stale evidence or unavailable database/provider. Refresh and keep the hold.'},409));}
}
