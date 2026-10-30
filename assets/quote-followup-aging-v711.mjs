import {resolutionReview710,RESOLUTION_EVENT710} from './quote-followup-resolution-v710.mjs';
import {OUTCOME_EVENT709} from './quote-communication-outcome-v709.mjs';

export const FOLLOWUP_EVENT711='quote_customer_followup_assignment_consent_review';
const clean=v=>String(v??'').trim();
const same=(a,b)=>Boolean(a&&b&&Object.keys(b).every(k=>a[k]===b[k]));
const isActiveQuote=q=>!['declined','expired'].includes(clean(q.status).toLowerCase());

export function agingQueue711(quotes=[],events=[],now=new Date()){
  const byQuote=new Map();
  for(const e of events){
    if(e?.event_type!==FOLLOWUP_EVENT711||!e.payload?.quote_id||
       !['assign','unassign','recheck_consent'].includes(e.payload.action))continue;
    const key=e.payload.quote_id;
    if(!byQuote.has(key))byQuote.set(key,[]);
    byQuote.get(key).push(e);
  }
  const items=(quotes||[]).filter(isActiveQuote).map(q=>{
    const history=(byQuote.get(q.id)||[]).filter(e=>e.payload.booking_id===q.booking_id);
    const assignment=history.find(e=>e.payload.action!=='recheck_consent');
    const lastCheck=history.find(e=>e.payload.action==='recheck_consent');
    const due=Date.parse(q.next_follow_up_at||'');
    const timestamp=Number.isFinite(due)?due:(Date.parse(q.created_at||q.updated_at||'')||now.getTime());
    const overdue=Number.isFinite(due)&&due<=now.getTime();
    const ageDays=Math.max(0,Math.floor((now.getTime()-timestamp)/86400000));
    const bucket=overdue?(ageDays>=3?'critical':'overdue'):
      Number.isFinite(due)&&due-now.getTime()<=172800000?'due_soon':
      Number.isFinite(due)?'scheduled':'unscheduled';
    return {quote_id:q.id,booking_id:q.booking_id||null,quote_number:q.quote_number||'Saved quote',
      status:q.status||'unknown',due_at:Number.isFinite(due)?q.next_follow_up_at:null,
      age_days:ageDays,bucket,assigned_staff_name:assignment?.payload.action==='assign'?
        assignment.payload.assigned_staff_name:null,
      assigned_staff_user_id:assignment?.payload.action==='assign'?
        assignment.payload.assigned_staff_user_id:null,
      last_consent_recheck_at:lastCheck?.created_at||null,
      live_consent_not_verified_by_queue:true,
      assignment_needs_live_recheck:!assignment||!same(assignment.payload.marker,{
        quote_id:q.id,booking_id:q.booking_id||'',quote_updated_at:q.updated_at||''})};
  });
  const order={critical:0,overdue:1,due_soon:2,unscheduled:3,scheduled:4};
  items.sort((a,b)=>order[a.bucket]-order[b.bucket]||b.age_days-a.age_days||
    clean(a.quote_number).localeCompare(clean(b.quote_number)));
  return {items,summary:{total:items.length,critical:items.filter(i=>i.bucket==='critical').length,
    overdue:items.filter(i=>['critical','overdue'].includes(i.bucket)).length,
    unassigned:items.filter(i=>!i.assigned_staff_user_id).length,
    requires_live_consent_review:items.filter(i=>i.booking_id).length}};
}

export function followupReview711(state,events=[]){
  const quoteId=state.source.quote.id,bookingId=state.source.booking?.id;
  const outcomes=events.filter(e=>e.event_type===OUTCOME_EVENT709);
  const resolutions=events.filter(e=>e.event_type===RESOLUTION_EVENT710);
  const resolution=resolutionReview710(state,outcomes,resolutions);
  const history=events.filter(e=>e.event_type===FOLLOWUP_EVENT711&&
    e.payload?.quote_id===quoteId&&e.payload?.booking_id===bookingId);
  const assignment=history.find(e=>['assign','unassign'].includes(e.payload.action))||null;
  const latestCheck=history.find(e=>e.payload.action==='recheck_consent')||null;
  const assigned=assignment?.payload.action==='assign'?assignment:null;
  const assignmentCurrent=Boolean(assigned&&same(assigned.payload.marker,resolution.marker));
  const recheckCurrent=Boolean(assignmentCurrent&&latestCheck&&
    same(latestCheck.payload.marker,resolution.marker)&&
    clean(latestCheck.payload.assignment_event_id)===clean(assignment.id)&&
    clean(latestCheck.payload.outcome_event_id)===clean(resolution.latest_outcome_event_id)&&
    clean(latestCheck.payload.resolution_event_id)===clean(resolution.latest_resolution_event_id));
  const canManage=resolution.outcome.can_record_followup&&!resolution.closure_current;
  return {resolution,history,assignment,assigned,assignment_current:assignmentCurrent,
    latest_check:latestCheck,recheck_current:recheckCurrent,
    can_assign:canManage,can_unassign:canManage&&Boolean(assigned),
    can_recheck:canManage&&assignmentCurrent,
    needs_consent_recheck:canManage&&!recheckCurrent,
    current_consent_allowed:resolution.outcome.contact_permission_current};
}
