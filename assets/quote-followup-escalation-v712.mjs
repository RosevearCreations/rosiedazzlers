import {followupReview711} from './quote-followup-aging-v711.mjs';

export const ESCALATION_EVENT712='quote_staff_followup_escalation_audit';
const clean=value=>String(value??'').trim();
const same=(a,b)=>Boolean(a&&b&&Object.keys(b).every(key=>a[key]===b[key]));

// The input events are the newest first. A closed audit is an internal review,
// never evidence of customer contact or permission to send.
export function escalationReview712(state,events=[],dueAt=null,now=new Date()){
  const followup=followupReview711(state,events);
  const quoteId=state.source.quote.id,bookingId=state.source.booking?.id;
  const history=events.filter(e=>e.event_type===ESCALATION_EVENT712&&
    e.payload?.quote_id===quoteId&&e.payload?.booking_id===bookingId&&
    ['escalate','review_owner','close_audit','reopen_audit'].includes(e.payload.action));
  const latest=history[0]||null;
  const latestEscalation=history.find(e=>e.payload.action==='escalate')||null;
  const due=Date.parse(dueAt||'');
  const overdue=Number.isFinite(due)&&due<=now.getTime();
  const agedDays=overdue?Math.max(0,Math.floor((now.getTime()-due)/86400000)):0;
  const marker=followup.resolution.marker;
  const isCurrent=e=>Boolean(e&&same(e.payload.marker,marker)&&
    clean(e.payload.assignment_event_id)===clean(followup.assignment?.id)&&
    clean(e.payload.consent_recheck_event_id)===clean(followup.latest_check?.id)&&
    clean(e.payload.outcome_event_id)===clean(followup.resolution.latest_outcome_event_id)&&
    clean(e.payload.resolution_event_id)===clean(followup.resolution.latest_resolution_event_id));
  const latestCurrent=isCurrent(latest);
  const closed=latest?.payload.action==='close_audit'&&latestCurrent;
  const reopened=latest?.payload.action==='reopen_audit'&&latestCurrent;
  const escalationCurrent=isCurrent(latestEscalation);
  const boundary=history.findIndex(e=>e.payload.action==='escalate'||e.payload.action==='reopen_audit');
  const reviewIndex=history.findIndex(e=>e.payload.action==='review_owner');
  const reviewed=escalationCurrent&&reviewIndex>=0&&boundary>=0&&reviewIndex<boundary&&isCurrent(history[reviewIndex]);
  const active=Boolean(escalationCurrent&&!closed);
  const canWork=followup.can_assign&&followup.assignment_current;
  return {followup,history,latest,latest_escalation:latestEscalation,
    due_at:Number.isFinite(due)?dueAt:null,overdue,overdue_days:agedDays,
    audit_closed:closed,audit_reopened:reopened,escalation_active:active,
    owner_review_current:reviewed,latest_event_current:latestCurrent,
    // Recheck first: a newer recheck invalidates older audit markers.
    can_escalate:canWork&&followup.recheck_current&&overdue&&!active&&!closed,
    can_review_owner:canWork&&active&&!reviewed,
    can_close_audit:canWork&&active&&reviewed&&followup.recheck_current,
    can_reopen_audit:followup.can_assign&&closed,
    needs_live_consent_recheck:!followup.recheck_current,
    consent_allowed:followup.current_consent_allowed};
}
