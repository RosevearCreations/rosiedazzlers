// Staff accounts of manual communication are not transport/provider receipts.
export const OUTCOME_EVENT709='quote_customer_communication_outcome_staff_reported';
export const OUTCOME_STATUSES709=Object.freeze({
  not_contacted:'No customer contact occurred',
  follow_up_needed:'Staff follow-up needed',
  manual_attempt_failed:'Manual contact attempt failed (staff reported)',
  manual_attempt_reported_unverified:'Manual contact attempt made (unverified staff report)',
  customer_replied_staff_reported:'Customer replied (unverified staff report)'
});
export const CONTACT_ATTEMPT_STATUSES709=Object.freeze([
  'manual_attempt_failed','manual_attempt_reported_unverified','customer_replied_staff_reported'
]);
const clean=value=>String(value??'').trim();
const matching=(a,b)=>Object.keys(b).every(key=>a?.[key]===b[key]);

export function outcomeReview709(state,events=[]){
  const {source,review,reconcile}=state;
  const quoteId=source?.quote?.id,bookingId=source?.booking?.id;
  const history=events.filter(e=>e?.event_type===OUTCOME_EVENT709 &&
    e?.payload?.quote_id===quoteId && e?.payload?.booking_id===bookingId &&
    Object.hasOwn(OUTCOME_STATUSES709,e?.payload?.status));
  const latest=history[0]||null;
  const previous=review?.handoffs?.[0]||null;
  const marker=review?.marker||{};
  const alerts=[];
  if(previous && !matching(previous.payload?.marker,marker)){
    const old=previous.payload?.marker||{};
    if(old.customer_profile_id!==marker.customer_profile_id)
      alerts.push('The booking customer profile changed since staff prepared the handoff.');
    if(old.profile_updated_at!==marker.profile_updated_at)
      alerts.push('The customer profile changed since the handoff. Recheck current communication permission.');
    if(old.channel!==marker.channel)
      alerts.push('The preferred communication channel changed since the handoff.');
  }
  if(!review.consent.allowed){
    alerts.push('Current customer consent does not allow a new manual contact attempt.');
  }
  const latestCurrent=Boolean(latest&&matching(latest.payload?.marker,marker));
  if(latest && !latestCurrent)alerts.push('A previous staff outcome is stale for the current booking, profile or handoff.');
  const status=latest?.payload?.status||null;
  const requiresFollowup=Boolean(review.change_followup_needed||review.change_followup_recorded||
    alerts.length || !latest || !latestCurrent ||
    ['follow_up_needed','manual_attempt_failed','not_contacted'].includes(status));
  const validLink=Boolean(quoteId&&bookingId&&source.quote?.booking_id===bookingId&&
    !source.others?.length);
  const currentHandoff=Boolean(validLink && review.ready_to_copy && review.handoffs?.length &&
    review.consent.allowed && reconcile?.notification_ready);
  return {marker,history,latest,latest_current:latestCurrent,consent_alerts:alerts,
    requires_followup:requiresFollowup,can_record_followup:validLink,
    can_record_contact_outcome:currentHandoff,
    contact_permission_current:review.consent.allowed,
    handoff_event_id:currentHandoff?clean(review.handoffs[0]?.id):null};
}
