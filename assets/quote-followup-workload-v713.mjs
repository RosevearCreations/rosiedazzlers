import {agingQueue711,FOLLOWUP_EVENT711} from './quote-followup-aging-v711.mjs';
import {ESCALATION_EVENT712} from './quote-followup-escalation-v712.mjs';

export const EXCEPTION_REVIEW_EVENT713='quote_staff_followup_exception_review';
export const EXCEPTION_CODES713=Object.freeze([
  'overdue_without_owner',
  'overdue_consent_recheck',
  'escalation_owner_review_pending',
  'stale_escalation_audit'
]);
const clean=v=>String(v??'').trim();
const same=(a,b)=>Boolean(a&&b&&Object.keys(b).every(k=>a[k]===b[k]));

// This is a queue triage, NOT a live consent or authorization determination.
// Limit and readback warnings must be displayed alongside every aggregation.
export function workloadTriage713(quotes=[],events=[],now=new Date()){
  const base=agingQueue711(quotes,events,now);
  const staff=new Map();
  const exceptions=[];
  let pendingReview=0;
  for(const item of base.items){
    const owned=Boolean(item.assigned_staff_user_id)&&!item.assignment_needs_live_recheck;
    const staffKey=owned?item.assigned_staff_user_id:'unassigned-or-stale';
    if(!staff.has(staffKey))staff.set(staffKey,{staff_user_id:owned?staffKey:null,
      staff_name:owned?clean(item.assigned_staff_name).slice(0,100)||'Staff member':'Unassigned / stale owner',
      assigned:0,overdue:0,critical:0,due_soon:0,exceptions:0});
    const group=staff.get(staffKey);
    group.assigned++;
    if(['critical','overdue'].includes(item.bucket))group.overdue++;
    if(item.bucket==='critical')group.critical++;
    if(item.bucket==='due_soon')group.due_soon++;
    const history=events.filter(e=>e?.payload?.quote_id===item.quote_id&&
      e.payload.booking_id===item.booking_id);
    const assignment=history.find(e=>e.event_type===FOLLOWUP_EVENT711&&
      ['assign','unassign'].includes(e.payload.action));
    const recheck=history.find(e=>e.event_type===FOLLOWUP_EVENT711&&e.payload.action==='recheck_consent');
    const audit=history.find(e=>e.event_type===ESCALATION_EVENT712);
    const flags=[];
    const overdue=['critical','overdue'].includes(item.bucket);
    if(overdue&&!owned)flags.push('overdue_without_owner');
    if(overdue&&(!recheck||!owned||!same(recheck.payload.marker,{
      quote_id:item.quote_id,booking_id:item.booking_id||'',
      quote_updated_at:quotes.find(q=>q.id===item.quote_id)?.updated_at||''})||
      clean(recheck.payload.assignment_event_id)!==clean(assignment?.id)))
      flags.push('overdue_consent_recheck');
    if(audit&&['escalate','reopen_audit'].includes(audit.payload.action))
      flags.push('escalation_owner_review_pending');
    if(audit&&!same(audit.payload.marker?.quote_id?{
      quote_id:audit.payload.marker.quote_id,booking_id:audit.payload.marker.booking_id,
      quote_updated_at:audit.payload.marker.quote_updated_at}:{},
      {quote_id:item.quote_id,booking_id:item.booking_id||'',
        quote_updated_at:quotes.find(q=>q.id===item.quote_id)?.updated_at||''}))
      flags.push('stale_escalation_audit');
    if(flags.length){group.exceptions++;pendingReview++;
      exceptions.push({quote_id:item.quote_id,booking_id:item.booking_id,
        quote_number:item.quote_number,staff_name:group.staff_name,bucket:item.bucket,
        age_days:item.age_days,flags,requires_selected_live_review:true});}
  }
  const priority={critical:0,overdue:1,due_soon:2,unscheduled:3,scheduled:4};
  exceptions.sort((a,b)=>priority[a.bucket]-priority[b.bucket]||b.age_days-a.age_days||
    clean(a.quote_number).localeCompare(clean(b.quote_number)));
  return {summary:{...base.summary,triage_exceptions:pendingReview,
      staffed:base.items.filter(i=>Boolean(i.assigned_staff_user_id)&&!i.assignment_needs_live_recheck).length},
    staff:[...staff.values()].sort((a,b)=>b.overdue-a.overdue||b.assigned-a.assigned||
      a.staff_name.localeCompare(b.staff_name)),exceptions,quote_limit:150,
    live_consent_verified:false,manager_review_verified:false};
}

// Derived from live quote + booking + customer profile + current event history.
export function liveExceptions713(escalation){
  const f=escalation.followup;
  if(f.resolution.closure_current)return [];
  const codes=[];
  if(escalation.overdue&&!f.assignment_current)codes.push('overdue_without_owner');
  if(escalation.overdue&&!f.recheck_current)codes.push('overdue_consent_recheck');
  if(escalation.escalation_active&&!escalation.owner_review_current)
    codes.push('escalation_owner_review_pending');
  if(escalation.history.length&&!escalation.latest_event_current)
    codes.push('stale_escalation_audit');
  return codes;
}

export function reviewedException713(reviewEvents,code,escalation){
  const latest=reviewEvents.find(e=>e.event_type===EXCEPTION_REVIEW_EVENT713&&
    e.payload?.action==='review_exception'&&e.payload.exception_code===code);
  const f=escalation.followup;
  return Boolean(latest&&same(latest.payload.marker,f.resolution.marker)&&
    clean(latest.payload.assignment_event_id)===clean(f.assignment?.id)&&
    clean(latest.payload.consent_recheck_event_id)===clean(f.latest_check?.id)&&
    clean(latest.payload.escalation_event_id)===clean(escalation.latest?.id)&&
    clean(latest.payload.outcome_event_id)===clean(f.resolution.latest_outcome_event_id)&&
    clean(latest.payload.resolution_event_id)===clean(f.resolution.latest_resolution_event_id));
}
