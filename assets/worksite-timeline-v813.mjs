// Shared Build 813 timeline labels contain no staff identifiers or private notes.
export function eventTimeToronto813(value){
  const date=new Date(value);
  if(!Number.isFinite(date.getTime()))return 'Time unavailable';
  return `${new Intl.DateTimeFormat('en-CA',{timeZone:'America/Toronto',dateStyle:'medium',timeStyle:'short'}).format(date)} Toronto time`;
}
export function customerTimelineMessage813(event){
  switch(event?.kind){
    case 'assignment_changed':return 'Rosie updated who is responsible for reviewing this concern.';
    case 'staff_acknowledged':return 'A staff member recorded an acknowledgement of the report.';
    case 'arrival_escalation_changed':return event.escalation==='flagged'?
      'Staff flagged this concern for arrival-day follow-up. This is not an appointment change.':
      'Staff recorded that the arrival-day escalation was addressed.';
    case 'review_status_changed':return event.status==='reviewing'?'Staff began reviewing the concern.':
      event.status==='resolved'?'A resolution was recorded. Read the current explanation above.':
      event.status==='closed_no_action'?'The concern was closed without a booking change. Read Rosie’s explanation above.':
      'Rosie updated the review status.';
    case 'resolution_updated':return 'Rosie updated the customer-visible explanation.';
    default:return 'A recorded worksite issue update is available.';
  }
}
export function staffTimelineMessage813(event,staffName=()=>null){
  const name=id=>id?(staffName(id)||`Staff reference ${String(id).slice(0,8)}`):'Unassigned';
  const actor=event?.actor_staff_user_id?` · Recorded by ${name(event.actor_staff_user_id)}`:' · Actor not recorded';
  switch(event?.event_kind){
    case 'assignment_changed':return `Assignment: ${name(event.previous_assignee)} → ${name(event.current_assignee)}${actor}`;
    case 'staff_acknowledged':return `Staff acknowledgement recorded${actor}`;
    case 'arrival_escalation_changed':return `Arrival escalation: ${event.previous_escalation||'unknown'} → ${event.current_escalation||'unknown'}${actor}`;
    case 'review_status_changed':return `Review: ${event.previous_status||'unknown'} → ${event.current_status||'unknown'}${actor}`;
    case 'resolution_updated':return `Customer-visible explanation updated${actor}`;
    default:return `Recorded operation${actor}`;
  }
}
export function customerFollowUpAdvice813(status){
  if(status==='resolved')return 'Please read Rosie’s resolution. If the concern is still unresolved, contact Rosie directly with the booking reference; this page does not send a new request.';
  if(status==='closed_no_action')return 'Please review the explanation before making new plans. If you disagree or need help, contact Rosie directly; closing the report does not cancel your booking.';
  return 'Staff review is still in progress. For an urgent arrival, driveway or safety issue, contact Rosie directly; a timeline update is not a sent message.';
}
