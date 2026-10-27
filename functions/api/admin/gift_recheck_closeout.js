import {requireStaffAccess,serviceHeaders,json} from '../_lib/staff-auth.js';

const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SESSION=/^cs_(?:test|live)_[a-zA-Z0-9_-]{8,220}$/;
const ACTIONS={
  recheck_assigned:'independent_recheck_requested',
  handoff_refreshed:'fresh_handoff_verified',
  owner_closeout_recorded:'closed_no_dispatch'
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
    return {ok:false,response:json({ok:false,error:'Signed-in owner staff session required for recheck evidence.'},403)};
  return {ok:true,actor:auth.actor};
}
async function rows(env,query){
  const response=await fetch(`${env.SUPABASE_URL}/rest/v1/${query}`,{
    method:'GET',redirect:'error',headers:serviceHeaders(env)
  });
  if(!response.ok)throw Error('Recheck evidence registry unavailable');
  const data=await response.json();
  if(!Array.isArray(data))throw Error('Malformed recheck evidence registry');
  return data;
}
export async function onRequestGet({request,env}){
  const access=await owner(request,env);
  if(!access.ok)return privateResponse(access.response);
  const sessionId=String(new URL(request.url).searchParams.get('session_id')||'').trim();
  if(sessionId&&!SESSION.test(sessionId))
    return privateResponse(json({ok:false,error:'Invalid gift Checkout session ID.'},400));
  try{
    const filter=sessionId?`stripe_session_id=eq.${encodeURIComponent(sessionId)}&`:'';
    const [cases,candidates]=await Promise.all([
      rows(env,`gift_issuance_review_cases?select=id,decision_id,stripe_session_id,assigned_reviewer_id,due_at,status,version,updated_at&${filter}order=updated_at.desc&limit=50`),
      rows(env,'staff_users?select=id,full_name,role_code&is_active=eq.true&order=full_name.asc&limit=100')
    ]);
    const ids=cases.map(c=>c.id).filter(id=>UUID.test(String(id)));
    const [followups,rechecks,reviews]=await Promise.all([
      ids.length?rows(env,`gift_issuance_review_followup_events?select=id,case_id,event_kind,reason_code,reference_event_id,case_version,created_at&case_id=in.(${ids.join(',')})&order=created_at.desc,id.desc&limit=250`):[],
      ids.length?rows(env,`gift_issuance_review_recheck_events?select=id,case_id,recurrence_event_id,event_kind,actor_staff_user_id,reviewer_staff_user_id,case_version,reference_event_id,reason_code,due_at_snapshot,decision_evidence_age_hours,created_at&case_id=in.(${ids.join(',')})&order=created_at.desc,id.desc&limit=250`):[],
      ids.length?rows(env,`gift_issuance_review_events?select=id,case_id,event_kind,outcome,reviewer_staff_user_id,actor_staff_user_id,created_at&case_id=in.(${ids.join(',')})&event_kind=eq.reviewed&order=created_at.desc,id.desc&limit=200`):[]
    ]);
    const detailed=cases.map(c=>{
      const latestFollowup=followups.find(e=>e.case_id===c.id)||null;
      const recurrence=latestFollowup?.event_kind==='recurrence_followup_recorded'&&
        latestFollowup.reason_code==='recheck_requested'
        ?followups.find(e=>e.id===latestFollowup.reference_event_id&&e.event_kind==='recurrence_opened')||null:null;
      const latestRecheck=rechecks.find(e=>e.case_id===c.id)||null;
      const active=!!recurrence&&(!latestRecheck||latestRecheck.recurrence_event_id===recurrence.id);
      const latestReview=reviews.find(e=>e.case_id===c.id)||null;
      const freshReview=latestRecheck?.event_kind==='recheck_assigned'&&
        latestReview?.outcome==='handoff_review_ready'&&
        Date.parse(latestReview.created_at)>Date.parse(latestRecheck.created_at)&&
        latestReview.reviewer_staff_user_id===c.assigned_reviewer_id?latestReview:null;
      const step=!active?'HOLD — no current recheck-requested recurrence':
        !latestRecheck?'OWNER: assign a different independent reviewer':
        latestRecheck.event_kind==='recheck_assigned'&&freshReview&&c.status==='ready_for_delivery_review'
          ?'OWNER: refresh independently verified handoff evidence':
        latestRecheck.event_kind==='recheck_assigned'?'HOLD — awaiting new reviewer finding':
        latestRecheck.event_kind==='handoff_refreshed'?'OWNER: close out internal follow-up (NO dispatch)':
        'CLOSED — internal follow-up only; customer delivery remains separately controlled';
      return {...c,current_recurrence:active?recurrence:null,
        latest_recheck:active?latestRecheck:null,fresh_review:freshReview,
        safe_next_action:step};
    });
    return privateResponse(json({ok:true,build:678,cases:detailed,
      candidates:candidates.filter(s=>s.id!==access.actor.id),rechecks,
      customer_messages_sent:0,safe_boundary:'Owner recheck and closeout evidence only. No Stripe, certificate, credit, refund, email, SMS or delivery mutation.'}));
  }catch{return privateResponse(json({ok:false,owner_recovery_hold:true,
    error:'Unable to reconcile recheck and closeout evidence. Maintain owner hold.'},503));}
}
export async function onRequestPost({request,env}){
  const origin=request.headers.get('origin');
  if(origin&&origin!==new URL(request.url).origin)
    return privateResponse(json({ok:false,error:'Cross-origin owner evidence refused.'},403));
  if(request.headers.get('sec-fetch-site')==='cross-site')
    return privateResponse(json({ok:false,error:'Cross-site owner evidence refused.'},403));
  const access=await owner(request,env);
  if(!access.ok)return privateResponse(access.response);
  const body=await request.json().catch(()=>({}));
  const action=String(body.action||'');
  const eventId=String(body.event_id||'');
  const caseId=String(body.case_id||'');
  const recurrenceId=String(body.recurrence_event_id||'');
  const reviewerId=body.reviewer_id==null?null:String(body.reviewer_id);
  const referenceId=body.reference_event_id==null?null:String(body.reference_event_id);
  const dueAt=body.due_at==null?null:String(body.due_at);
  const parsedDue=dueAt===null?null:Date.parse(dueAt);
  if(!UUID.test(eventId)||!UUID.test(caseId)||!UUID.test(recurrenceId)
     ||!Object.prototype.hasOwnProperty.call(ACTIONS,action)
     ||body.reason_code!==ACTIONS[action]
     ||!Number.isSafeInteger(body.expected_version)||body.expected_version<1
     ||!UUID.test(String(reviewerId||''))
     ||(action==='recheck_assigned'&&(referenceId!==null||!Number.isFinite(parsedDue)))
     ||(action!=='recheck_assigned'&&(dueAt!==null||!UUID.test(String(referenceId||''))))){
    return privateResponse(json({ok:false,error:'Current case, recurrence, reviewer, exact reference and reason are required.'},400));
  }
  if(action!=='recheck_assigned'&&body.acknowledge_no_dispatch!==true)
    return privateResponse(json({ok:false,error:'Explicit no-delivery acknowledgement required.'},409));
  try{
    const response=await fetch(`${env.SUPABASE_URL}/rest/v1/rpc/record_gift_recovery_recheck_event`,{
      method:'POST',redirect:'error',headers:serviceHeaders(env),body:JSON.stringify({
        p_event_id:eventId,p_case_id:caseId,p_actor_id:access.actor.id,p_action:action,
        p_reason_code:ACTIONS[action],p_expected_version:body.expected_version,
        p_recurrence_event_id:recurrenceId,p_reference_event_id:referenceId,
        p_reviewer_id:reviewerId,p_due_at:dueAt===null?null:new Date(parsedDue).toISOString()
      })
    });
    if(!response.ok)throw Error('Recheck transaction held by source evidence');
    const result=await response.json();
    return privateResponse(json({ok:true,build:678,result,customer_messages_sent:0,
      payment_mutations:0,gift_balance_mutations:0,
      next_step:action==='recheck_assigned'
        ?'New independent reviewer must sign in and record fresh findings before any owner handoff.'
        :action==='handoff_refreshed'
          ?'Fresh internal handoff recorded; owner closeout is separate. No delivery dispatched.'
          :'Internal follow-up closed with no dispatch. Customer delivery remains a separate controlled process.'}));
  }catch{return privateResponse(json({ok:false,owner_recovery_hold:true,
    error:'Stale, duplicated or conflicting recheck evidence refused. Refresh and maintain hold.'},409));}
}
