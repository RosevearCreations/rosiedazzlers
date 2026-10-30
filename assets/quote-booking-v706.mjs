// Staff-only quote-to-booking review helpers. No storage, dispatch, or payment authority.
export const FOLLOW_UP_COMPLETED_STAGE706 = 'staff_follow_up_completed';

export function completedFollowUps706(rows = []) {
  return rows.filter(row => row?.follow_up_stage === FOLLOW_UP_COMPLETED_STAGE706).length;
}

export function quoteBookingEligibility706(quote) {
  if (!quote?.id) return {ready:false,reason:'Save this quote before verifying a booking.'};
  if (quote.status !== 'accepted') return {ready:false,reason:'Only an accepted quote can be matched to a booking.'};
  if (!(Number(quote.accepted_amount_cents) > 0)) return {ready:false,reason:'Save a positive accepted quote amount first.'};
  if (!String(quote.customer_name || '').trim()) return {ready:false,reason:'Save the customer name before verifying a booking.'};
  return {ready:true,reason:'Use Verify existing booking to check the live booking record.'};
}

export const normalizedName706 = value => String(value || '').trim().replace(/\s+/g,' ').toLocaleLowerCase('en-CA');

export function bookingMatch706(quote, booking) {
  const eligibility = quoteBookingEligibility706(quote);
  if (!eligibility.ready) return {verified:false,reason:eligibility.reason};
  if (!booking?.id) return {verified:false,reason:'No matching booking was found.'};
  if (normalizedName706(quote.customer_name) !== normalizedName706(booking.customer_name)) {
    return {verified:false,reason:'Booking customer does not match the saved quote. Review both records; do not link.'};
  }
  if (['cancelled','canceled','declined','void','deleted'].includes(String(booking.status || '').toLowerCase())) {
    return {verified:false,reason:'This booking is cancelled or inactive. It cannot be linked as a live booking.'};
  }
  if (!booking.service_date || !booking.start_slot) {
    return {verified:false,reason:'Booking date or start slot is missing. Complete the booking first.'};
  }
  return {verified:true,reason:'Existing booking verified for this saved accepted quote. Linking requires an explicit quote save.'};
}

const safeLine706 = (value, max = 180) => String(value ?? '').replace(/[\r\n\t]+/g, ' ').trim().slice(0,max) || 'Not specified';
const cad706 = cents => new Intl.NumberFormat('en-CA',{style:'currency',currency:'CAD'}).format((Number(cents)||0)/100);

export function customerConfirmationPreview706(quote, booking, {verified=false,linked=false} = {}) {
  const readyToCopy = verified && linked && booking?.status === 'confirmed' && bookingMatch706(quote,booking).verified;
  const lines = [
    'ROSIE DAZZLERS — CUSTOMER CONFIRMATION PREVIEW',
    readyToCopy ? 'STAFF DRAFT ONLY — NOT SENT' : 'NOT READY TO SEND — BOOKING NOT FULLY CONFIRMED',
    `Customer: ${safeLine706(quote?.customer_name)}`,
    `Quote: ${safeLine706(quote?.quote_number)}`,
    `Service: ${safeLine706(quote?.service_label)}`,
    `Town: ${safeLine706(quote?.town)}`,
    `Accepted quoted amount: ${cad706(quote?.accepted_amount_cents)}`,
    `Booking date: ${safeLine706(booking?.service_date)}`,
    `Start slot: ${safeLine706(booking?.start_slot)}`,
    `Vehicle category: ${safeLine706(booking?.vehicle_size)}`,
    `Booking status: ${safeLine706(booking?.status)}`,
    'Please confirm the exact address, vehicle and service scope, driveway access, water/power availability,',
    'weather suitability, waiver and deposit/cancellation/payment terms directly with our team.',
    'This preview has not reserved an appointment, processed payment or contacted anyone.'
  ];
  return {readyToCopy,text:lines.join('\n')};
}
