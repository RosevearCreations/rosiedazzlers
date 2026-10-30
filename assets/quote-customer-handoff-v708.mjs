import {evaluateCustomerCommunicationConsent} from '../functions/api/_lib/customer-communication-consent.js';

export const HANDOFF_EVENT708='quote_customer_confirmation_handoff_prepared';
export const CHANGE_FOLLOWUP_EVENT708='quote_booking_change_followup_logged';
const clean=value=>String(value??'').trim();
const normalizeEmail=value=>clean(value).toLowerCase();

// Permission is read from the current customer profile, never a staff checkbox or quote field.
export function consentReview708(quote,booking,profile){
  const issues=[];
  if(!booking?.customer_profile_id)issues.push('Booking is not linked to a customer profile.');
  if(!profile?.id || profile.id!==booking?.customer_profile_id)issues.push('Linked customer profile could not be verified.');
  if(quote?.customer_id && quote.customer_id!==booking?.customer_profile_id)
    issues.push('Quote customer ID differs from the booking customer profile.');
  if(profile && (profile.is_active!==true || profile.archived_at))
    issues.push('Customer profile is inactive or archived.');
  const channel=clean(profile?.notification_channel).toLowerCase();
  if(!['email','sms'].includes(channel))issues.push('No supported manual email/SMS preference is selected.');
  if(booking?.customer_email && profile?.email &&
      normalizeEmail(booking.customer_email)!==normalizeEmail(profile.email))
    issues.push('Booking email differs from the linked customer profile.');
  const event={customer_profile_id:booking?.customer_profile_id,
    channel,recipient_email:profile?.email,recipient_phone:profile?.sms_phone||profile?.phone};
  const decision=evaluateCustomerCommunicationConsent({profile,event});
  if(decision.dispatch!==true)issues.push(`Current customer permission blocks this handoff: ${decision.reason}.`);
  return {allowed:issues.length===0,channel:channel||null,issues,
    source:'live_customer_profile',explicit_opt_in:profile?.notification_opt_in===true,
    inferred_consent:false};
}

export function handoffMarker708(source,profile,reconcile,channel){
  return {quote_id:clean(source?.quote?.id),booking_id:clean(source?.booking?.id),
    quote_updated_at:clean(source?.quote?.updated_at),booking_updated_at:clean(source?.booking?.updated_at),
    customer_profile_id:clean(profile?.id),profile_updated_at:clean(profile?.updated_at),
    staff_confirmation_event_id:clean(reconcile?.latest?.id),channel:clean(channel)};
}

export function handoffReview708(source,reconcile,profile,events=[]){
  const consent=consentReview708(source?.quote,source?.booking,profile);
  const marker=handoffMarker708(source,profile,reconcile,consent.channel);
  const relevant=events.filter(event=>event?.payload?.quote_id===source?.quote?.id&&
    event?.payload?.booking_id===source?.booking?.id);
  const handoffs=relevant.filter(event=>event?.event_type===HANDOFF_EVENT708);
  const followups=relevant.filter(event=>event?.event_type===CHANGE_FOLLOWUP_EVENT708);
  const handoff=handoffs[0]||null;
  const handoffCurrent=Boolean(handoff && Object.keys(marker).every(key=>handoff.payload?.marker?.[key]===marker[key]));
  const latestFollowup=followups[0]||null;
  const followupMarker={quote_id:marker.quote_id,booking_id:marker.booking_id,
    quote_updated_at:marker.quote_updated_at,booking_updated_at:marker.booking_updated_at};
  const followupCurrent=Boolean(latestFollowup && Object.keys(followupMarker).every(key=>
    latestFollowup.payload?.marker?.[key]===followupMarker[key]));
  const changeNeedsReview=Boolean(reconcile?.history?.length && !reconcile.current);
  const readyToPrepare=Boolean(reconcile?.notification_ready && consent.allowed);
  const issues=[...(reconcile?.issues||[]),...consent.issues];
  if(readyToPrepare&&!handoffCurrent)issues.push('Record the reviewed staff handoff before copying a customer draft.');
  if(changeNeedsReview&&!followupCurrent)issues.push('The booking or quote changed after staff confirmation; follow-up review should be recorded.');
  return {consent,marker,followupMarker,ready_to_prepare:readyToPrepare,
    ready_to_copy:readyToPrepare&&handoffCurrent,
    handoff_current:handoffCurrent,change_followup_needed:changeNeedsReview&&!followupCurrent,
    change_followup_recorded:changeNeedsReview&&followupCurrent,
    handoffs,followups,issues};
}
