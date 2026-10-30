// Staff-only closure decisions. Neither staff reports nor these decisions are
// evidence that a communications provider accepted or delivered a message.
import {outcomeReview709,OUTCOME_EVENT709} from './quote-communication-outcome-v709.mjs';
import {HANDOFF_EVENT708,CHANGE_FOLLOWUP_EVENT708} from './quote-customer-handoff-v708.mjs';

export const RESOLUTION_EVENT710='quote_customer_followup_resolution_staff_reviewed';
export const RESOLUTION_REASONS710=Object.freeze({
  no_contact_required:'Reviewed internally; no customer contact required',
  contact_not_permitted:'Current permission blocks contact; close this contact task only',
  customer_response_reviewed:'Actual customer response reviewed (staff report, unverified)'
});
const clean=value=>String(value??'').trim();
const sameMarker=(a,b)=>Boolean(a&&b&&Object.keys(b).every(key=>a[key]===b[key]));
const keyLabels=Object.freeze({
  quote_updated_at:'Saved quote changed',
  booking_updated_at:'Linked booking changed',
  customer_profile_id:'Customer profile link changed',
  profile_updated_at:'Customer profile updated; historical opt-in is not inferred',
  channel:'Preferred contact channel changed',
  staff_confirmation_event_id:'Staff booking confirmation changed'
});

export function consentAudit710(state,outcomes=[],resolutions=[]){
  const quoteId=state.source?.quote?.id,bookingId=state.source?.booking?.id;
  const handoffs=[...(state.review?.handoffs||[]),...(state.review?.followups||[])];
  const all=[...handoffs,...outcomes,...resolutions].filter(e=>
    e?.payload?.quote_id===quoteId&&e?.payload?.booking_id===bookingId&&
    [HANDOFF_EVENT708,CHANGE_FOLLOWUP_EVENT708,OUTCOME_EVENT709,RESOLUTION_EVENT710].includes(e.event_type)&&
    e.payload?.marker&&typeof e.payload.marker==='object');
  all.sort((a,b)=>clean(a.created_at).localeCompare(clean(b.created_at))||clean(a.id).localeCompare(clean(b.id)));
  all.push({id:'live',event_type:'live_customer_profile_review',created_at:null,
    actor_name:'Live readback',payload:{marker:state.review.marker}});
  let prior=null;
  const timeline=all.map(e=>{
    // Build 708 change-follow-up events intentionally contain a partial marker.
    // Carry prior fields forward instead of inventing consent/channel changes.
    const marker={...(prior||{}),...e.payload.marker};
    const changes=prior?Object.entries(keyLabels).filter(([key])=>clean(prior[key])!==clean(marker[key]))
      .map(([,label])=>label):['First retained staff snapshot'];
    prior=marker;
    return {id:e.id,created_at:e.created_at,actor_name:e.actor_name||'Staff',
      source:e.event_type,changes,channel:clean(marker.channel)||'not recorded',
      is_live:e.id==='live'};
  });
  return timeline.reverse().slice(0,30);
}

export function resolutionReview710(state,outcomes=[],resolutions=[]){
  const outcome=outcomeReview709(state,outcomes);
  const quoteId=state.source?.quote?.id,bookingId=state.source?.booking?.id;
  const history=resolutions.filter(e=>e?.event_type===RESOLUTION_EVENT710&&
    e?.payload?.quote_id===quoteId&&e?.payload?.booking_id===bookingId&&
    (e.payload.action==='reopen'||Object.hasOwn(RESOLUTION_REASONS710,e.payload.reason)));
  const latest=history[0]||null;
  const currentOutcomeId=clean(outcome.latest?.id);
  const resolutionCurrent=Boolean(latest&&sameMarker(latest.payload?.marker,outcome.marker)&&
    clean(latest.payload?.outcome_event_id)===currentOutcomeId);
  const closed=Boolean(resolutionCurrent&&latest.payload.action==='close');
  const freshReply=outcome.latest_current&&outcome.latest?.payload?.status==='customer_replied_staff_reported';
  const actionable=outcome.can_record_followup;
  const alerts=[...outcome.consent_alerts];
  if(latest&&latest.payload.action==='close'&&!closed)
    alerts.push('The previous follow-up closure is no longer current; staff must review it again.');
  return {marker:outcome.marker,outcome,history,latest,closure_current:closed,
    requires_followup:!closed&&Boolean(outcome.requires_followup||latest),
    can_close_no_contact:actionable&&!closed,
    can_close_opt_out:actionable&&!closed&&!outcome.contact_permission_current,
    can_close_reply:actionable&&!closed&&freshReply,
    can_reopen:actionable&&closed,alerts,
    consent_audit:consentAudit710(state,outcomes,resolutions),
    latest_outcome_event_id:currentOutcomeId||null,
    latest_resolution_event_id:latest?.id||null};
}
