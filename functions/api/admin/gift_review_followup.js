import {requireStaffAccess,serviceHeaders,json} from '../_lib/staff-auth.js';

const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SESSION=/^cs_(?:test|live)_[a-zA-Z0-9_-]{8,220}$/;
const REASONS={
  overdue_escalated:new Set(['reviewer_overdue']),
  handoff_receipt_confirmed:new Set(['owner_receipt_acknowledged']),
  recurrence_opened:new Set(['overdue_review','handoff_not_received','evidence_changed','delivery_attention','recurring_exception']),
  recurrence_followup_recorded:new Set(['hold_continues','recheck_requested','closed_no_dispatch'])
};
function privateResponse(response){
  const headers=new Headers(response.headers);
  headers.set('Cache-Control','no-store, private');
  headers.set('Referrer-Policy','no-referrer');
  headers.set('X-Content-Type-Options','nosniff');
  return new Response(response.body,{status:response.status,headers});
}
async function owner(request,env){
  const auth=await requireStaffAccess({request,env,allowLegacyAdminFallback:false});
  if(!auth.ok)return {ok:false,response:auth.response};
  if(auth.auth_mode!=='session'||!auth.actor?.is_admin||!UUID.test(String(auth.actor.id||'')))
    return {ok:false,response:json({ok:false,error:'A signed-in owner staff session is required for independent escalation and receipt evidence.'},403)};
  return {ok:true,actor:auth.actor};
}
async function rows(env,query){
  const response=await fetch(`${env.SUPABASE_URL}/rest/v1/${query}`,{
    method:'GET',redirect:'error',headers:serviceHeaders(env)
  });
  if(!response.ok)throw Error('Gift review evidence registry unavailable');
  const data=await response.json();
  if(!Array.isArray(data))throw Error('Malformed gift review evidence registry');
  return data;
}
export async function onRequestGet({request,env}){
  const access=await owner(request,env);
  if(!access.ok)return privateResponse(access.response);
  const url=new URL(request.url);
  const sessionId=String(url.searchParams.get('session_id')||'').trim();
  if(sessionId&&!SESSION.test(sessionId))return privateResponse(json({ok:false,error:'Invalid gift Checkout session ID.'},400));
  try{
    const filter=sessionId?`stripe_session_id=eq.${encodeURIComponent(sessionId)}&`:'';
    const cases=await rows(env,`gift_issuance_review_cases?select=id,decision_id,stripe_session_id,assigned_reviewer_id,due_at,status,version,updated_at&${filter}order=updated_at.desc&limit=50`);
    const ids=cases.map(c=>c.id).filter(x=>UUID.test(String(x)));
    const [events,reviews]=await Promise.all([
      ids.length?rows(env,`gift_issuance_review_followup_events?select=id,case_id,event_kind,actor_staff_user_id,case_version,reference_event_id,reason_code,due_at_snapshot,decision_evidence_age_hours,created_at&case_id=in.(${ids.join(',')})&order=created_at.desc,id.desc&limit=250`):[],
      ids.length?rows(env,`gift_issuance_review_events?select=id,case_id,event_kind,outcome,created_at&case_id=in.(${ids.join(',')})&event_kind=eq.reviewed&order=created_at.desc,id.desc&limit=200`):[]
    ]);
    const enriched=cases.map(c=>{
      const lastFollowup=events.find(e=>e.case_id===c.id)||null;
      const lastReview=reviews.find(e=>e.case_id===c.id)||null;
      const overdue=Date.parse(c.due_at)<Date.now();
      const receipt=events.find(e=>e.case_id===c.id&&e.event_kind==='handoff_receipt_confirmed')||null;
      const recurrenceOpen=lastFollowup?.event_kind==='recurrence_opened';
      const recurrenceAfterReceipt=events.some(e=>e.case_id===c.id&&e.event_kind==='recurrence_opened'&&
        (!receipt||Date.parse(e.created_at)>=Date.parse(receipt.created_at)));
      const escalationCurrent=events.some(e=>e.case_id===c.id&&e.event_kind==='overdue_escalated'&&e.case_version===c.version);
      return {...c,overdue,overdue_hours:overdue?Math.floor((Date.now()-Date.parse(c.due_at))/3600000):0,
        last_followup:lastFollowup,last_review:lastReview,recurrence_open:recurrenceOpen,
        handoff_receipt_recorded:!!receipt,
        handoff_confirmed_safe:!!receipt&&!recurrenceAfterReceipt&&!overdue,
        safe_next_action:recurrenceAfterReceipt?'RECURRENCE HOLD — no earlier receipt can authorize delivery':
          overdue&&c.status!=='ready_for_delivery_review'&&escalationCurrent?'ESCALATED — awaiting independent reassessment':
          overdue&&c.status!=='ready_for_delivery_review'?'OVERDUE — owner escalation due':
          c.status==='ready_for_delivery_review'&&!receipt?'Awaiting owner receipt (NO dispatch)':
          'Review evidence; no delivery authorized'};
    });
    return privateResponse(json({ok:true,build:677,cases:enriched,events,reviews,
      customer_messages_sent:0,safe_boundary:'Receipt acknowledges an internal handoff only. No customer contact, resend, refund or gift mutation.'}));
  }catch{return privateResponse(json({ok:false,owner_recovery_hold:true,error:'Unable to reconcile gift review follow-up evidence; maintain owner hold.'},503));}
}
export async function onRequestPost({request,env}){
  const origin=request.headers.get('origin');
  if(origin&&origin!==new URL(request.url).origin)
    return privateResponse(json({ok:false,error:'Cross-origin owner review action refused.'},403));
  if(request.headers.get('sec-fetch-site')==='cross-site')
    return privateResponse(json({ok:false,error:'Cross-site owner review action refused.'},403));
  const access=await owner(request,env);
  if(!access.ok)return privateResponse(access.response);
  const body=await request.json().catch(()=>({}));
  const eventId=String(body.event_id||''),caseId=String(body.case_id||'');
  const kind=String(body.action||''),reason=String(body.reason_code||'');
  const reference=body.reference_event_id==null?null:String(body.reference_event_id);
  if(!UUID.test(eventId)||!UUID.test(caseId)||!Object.prototype.hasOwnProperty.call(REASONS,kind)||!REASONS[kind].has(reason)
     ||(reference!==null&&!UUID.test(reference))
     ||(kind==='overdue_escalated'&&reference!==null)
     ||(kind!=='overdue_escalated'&&reference===null)
     ||!Number.isSafeInteger(body.expected_version)||body.expected_version<1)
    return privateResponse(json({ok:false,error:'Event, case, type, reason, evidence reference and case version are required.'},400));
  if((kind==='handoff_receipt_confirmed'||reason==='closed_no_dispatch')&&body.acknowledge_no_dispatch!==true)
    return privateResponse(json({ok:false,error:'Explicit no-delivery/no-dispatch acknowledgement required.'},409));
  try{
    const response=await fetch(`${env.SUPABASE_URL}/rest/v1/rpc/record_gift_review_followup_event`,{
      method:'POST',redirect:'error',headers:serviceHeaders(env),
      body:JSON.stringify({p_event_id:eventId,p_case_id:caseId,p_actor_id:access.actor.id,
        p_action:kind,p_reason_code:reason,p_expected_version:body.expected_version,
        p_reference_event_id:reference})
    });
    if(!response.ok)throw Error('Follow-up evidence gate held action');
    const result=await response.json();
    return privateResponse(json({ok:true,build:677,result,customer_messages_sent:0,
      payment_mutations:0,gift_balance_mutations:0,
      next_step:kind==='handoff_receipt_confirmed'
        ?'Owner receipt recorded, but actual delivery requires another explicit owner-controlled workflow.'
        :'Escalation or recurrence follow-up recorded. Keep any uncertain delivery on hold.'}));
  }catch{return privateResponse(json({ok:false,owner_recovery_hold:true,error:'Stale, duplicated or unsafe evidence refused. Refresh and maintain the hold.'},409));}
}
