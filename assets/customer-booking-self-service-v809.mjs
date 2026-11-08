// Build 809 — read-only presentation of authenticated booking and change-request
// snapshots. A request is never a booking/payment/availability mutation.
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const CLOSED = new Set(['completed', 'cancelled', 'canceled', 'refunded', 'no_show']);

export function torontoToday809(now = new Date()) {
  if (!(now instanceof Date) || !Number.isFinite(now.getTime())) return '';
  const parts = new Intl.DateTimeFormat('en-CA', {timeZone:'America/Toronto',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now);
  const p = k => parts.find(x => x.type === k)?.value || '';
  return `${p('year')}-${p('month')}-${p('day')}`;
}

export function validServiceDate809(value, today = torontoToday809()) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value) || !/^\d{4}-\d{2}-\d{2}$/.test(today) || value < today) return false;
  const date = new Date(`${value}T12:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0,10) === value;
}

export function appointmentState809(row) {
  if (!row || typeof row !== 'object' || !UUID.test(String(row.id || ''))) return null;
  const payment = String(row.status || '').trim().toLowerCase();
  const job = String(row.job_status || '').trim().toLowerCase();
  const closed = Boolean(row.detailing_completed_at) || CLOSED.has(payment) || CLOSED.has(job);
  const label = ['cancelled','canceled','refunded'].some(x => payment === x || job === x) ? 'Cancelled or refunded'
    : row.detailing_completed_at || payment === 'completed' || job === 'completed' ? 'Completed'
    : job === 'in_progress' ? 'Service in progress'
    : payment === 'confirmed' ? 'Booking confirmed'
    : payment === 'pending' ? 'Awaiting payment or confirmation'
    : 'Booking status needs confirmation';
  return {id:row.id,service_date:row.service_date || null,start_slot:row.start_slot || null,
    package_code:row.package_code || null,label,closed,confirmed:payment==='confirmed'&&!closed,
    can_request:!closed};
}

export function pendingBookingRequest809(bookingId, requests) {
  if (!UUID.test(String(bookingId || ''))) return null;
  return (Array.isArray(requests) ? requests : []).find(x => x?.booking_id === bookingId && x.status === 'pending_review') || null;
}

export function changeRequestChoices809(bookings, requests) {
  return (Array.isArray(bookings) ? bookings : []).filter(row => {
    const state = appointmentState809(row);
    return state?.can_request && !pendingBookingRequest809(state.id, requests);
  });
}

export function appointmentTimeline809(bookings, requests) {
  const states = (Array.isArray(bookings) ? bookings : []).map(appointmentState809).filter(Boolean);
  return states.map(state => ({...state,request:pendingBookingRequest809(state.id,requests)}))
    .sort((a,b) => Number(a.closed)-Number(b.closed) ||
      String(a.service_date || '9999').localeCompare(String(b.service_date || '9999')) || a.id.localeCompare(b.id));
}

export function changeRequestPreview809({booking_id,request_type,preferred_service_date,preferred_start_slot} = {},bookings=[],requests=[],today=torontoToday809()) {
  const booking = (Array.isArray(bookings) ? bookings : []).find(row => row?.id === booking_id);
  const state = appointmentState809(booking);
  if (!state) return {ok:false,message:'Choose an appointment from your signed-in bookings.'};
  if (!state.can_request) return {ok:false,message:'This booking is closed. Contact Rosie for assistance.'};
  if (pendingBookingRequest809(state.id,requests)) return {ok:false,message:'Rosie already has a change request for this appointment. Check its status below before submitting another.'};
  if (request_type === 'cancel') return {ok:true,message:'Cancellation request only. Your current appointment and payment stay unchanged until Rosie reviews and confirms any action.'};
  if (request_type !== 'reschedule') return {ok:false,message:'Choose cancellation or rescheduling.'};
  if (!validServiceDate809(preferred_service_date,today)) return {ok:false,message:'Choose a valid preferred date today or later. No new slot is held.'};
  if (preferred_service_date === state.service_date && (!preferred_start_slot || String(preferred_start_slot).trim().toUpperCase() === String(state.start_slot || '').trim().toUpperCase())) {
    return {ok:false,message:'Choose a different date or requested time, or explain the change to Rosie through Contact.'};
  }
  return {ok:true,message:'Rescheduling request only. Your existing date remains in place, and the preferred date and time are not reserved. Rosie must check availability and confirm any change.'};
}
