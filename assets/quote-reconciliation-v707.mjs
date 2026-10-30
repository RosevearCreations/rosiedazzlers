import {bookingMatch706} from './quote-booking-v706.mjs';

export const CONFIRMATION_EVENT707 = 'quote_staff_confirmation_recorded';

const clean = value => String(value ?? '').trim();
// A stable, deliberately small snapshot. A stale event must never authorize a draft.
export function confirmationSnapshot707(quote,booking) {
  return {
    quote_id:clean(quote?.id), booking_id:clean(booking?.id),
    quote_updated_at:clean(quote?.updated_at),booking_updated_at:clean(booking?.updated_at),
    accepted_amount_cents:Number(quote?.accepted_amount_cents)||0,
    customer_name:clean(booking?.customer_name).replace(/\s+/g,' ').toLocaleLowerCase('en-CA'),
    booking_status:clean(booking?.status).toLowerCase(),job_status:clean(booking?.job_status).toLowerCase(),
    service_date:clean(booking?.service_date),start_slot:clean(booking?.start_slot),
    package_code:clean(booking?.package_code),vehicle_size:clean(booking?.vehicle_size)
  };
}

export function reconcileQuoteBooking707(quote,booking,otherLinks=[],events=[]) {
  const issues=[];
  if(!quote?.id) issues.push('Select a saved quote.');
  if(!quote?.booking_id) issues.push('Quote has no saved booking link.');
  if(quote?.booking_id && !booking?.id) issues.push('Linked booking is missing.');
  if(booking?.id && quote?.booking_id !== booking.id) issues.push('Booking ID differs from the saved quote link.');
  if(otherLinks.length) issues.push('This booking is also linked to another quote.');
  if(booking?.id){
    const match=bookingMatch706(quote,booking);
    if(!match.verified) issues.push(match.reason);
    if(clean(booking.status).toLowerCase() !== 'confirmed') issues.push('Booking is not confirmed in the booking system.');
    if(['cancelled','canceled','void','deleted'].includes(clean(booking.job_status).toLowerCase()))
      issues.push('The booking job is cancelled or inactive.');
  }
  const snapshot=confirmationSnapshot707(quote,booking);
  const history=(events||[]).filter(event=>event?.event_type===CONFIRMATION_EVENT707 &&
    event?.payload?.quote_id===quote?.id && event?.payload?.booking_id===booking?.id);
  const latest=history[0]||null;
  const current=Boolean(latest && Object.keys(snapshot).every(key=>latest.payload?.snapshot?.[key]===snapshot[key]));
  if(!issues.length && !current) issues.push('Staff confirmation needs recording or renewal after quote/booking changes.');
  return {matched:issues.length===0 || (issues.length===1 && issues[0].startsWith('Staff confirmation needs')),
    ready_to_record:issues.length===0 || (issues.length===1 && issues[0].startsWith('Staff confirmation needs')),
    notification_ready:issues.length===0 && current,
    history, latest, current, snapshot,issues};
}
