// Pure, staff-only view logic. No customer records are persisted in a browser store.
const OPEN_STATES = new Set(['draft', 'requested', 'sent', 'follow_up']);
const CLOSED_STATES = new Set(['declined', 'expired']);

export function quoteAttention704(row, now = new Date()) {
  const status = String(row?.status || 'draft').toLowerCase();
  if (row?.booking_id) return 'linked';
  if (CLOSED_STATES.has(status)) return 'closed';
  if (status === 'accepted') return 'ready_to_book';
  if (OPEN_STATES.has(status) && row?.next_follow_up_at) {
    const due = new Date(row.next_follow_up_at);
    if (Number.isFinite(due.getTime()) && due.getTime() <= now.getTime()) return 'due';
    if (Number.isFinite(due.getTime())) return 'scheduled';
  }
  return status === 'requested' || status === 'draft' ? 'review' : 'unscheduled';
}

export function summarizeQuoteInbox704(rows, now = new Date()) {
  const counts = { all: 0, due: 0, review: 0, ready_to_book: 0, linked: 0, closed: 0, scheduled: 0, unscheduled: 0 };
  for (const row of rows || []) {
    counts.all++;
    counts[quoteAttention704(row, now)]++;
  }
  return counts;
}

const ATTENTION_ORDER = { due: 0, ready_to_book: 1, review: 2, unscheduled: 3, scheduled: 4, linked: 5, closed: 6 };
export function filterQuoteInbox704(rows, { filter = 'all', search = '', now = new Date() } = {}) {
  const term = String(search).trim().toLocaleLowerCase('en-CA').slice(0, 120);
  return (rows || []).filter(row => {
    const bucket = quoteAttention704(row, now);
    if (filter !== 'all' && bucket !== filter) return false;
    if (!term) return true;
    return ['quote_number', 'customer_name', 'town', 'service_label', 'follow_up_stage', 'status']
      .some(field => String(row?.[field] || '').toLocaleLowerCase('en-CA').includes(term));
  }).sort((a, b) => {
    const first = ATTENTION_ORDER[quoteAttention704(a, now)] - ATTENTION_ORDER[quoteAttention704(b, now)];
    if (first) return first;
    const ad = Date.parse(a.next_follow_up_at || '') || Infinity;
    const bd = Date.parse(b.next_follow_up_at || '') || Infinity;
    if (ad !== bd) return ad - bd;
    return (Date.parse(b.updated_at || '') || 0) - (Date.parse(a.updated_at || '') || 0);
  });
}

export function bookingReview704(quote) {
  if (!quote?.id) return { ready: false, message: 'Save this quote before preparing a booking handoff.' };
  if (quote.booking_id) return { ready: false, message: 'This quote already references a booking. Open the booking dashboard to verify its status.' };
  if (quote.status !== 'accepted') return { ready: false, message: 'A booking handoff needs an explicitly accepted quote first.' };
  if (!(Number(quote.accepted_amount_cents) > 0)) return { ready: false, message: 'Confirm and save a positive accepted amount before booking review.' };
  return { ready: true, message: 'Accepted quote ready for staff booking review. Confirm date, capacity, vehicle, service, waiver, and payment terms in the booking dashboard. After a booking exists, link its real ID here and save.' };
}

export function localFollowUp704(now = new Date(), days = 1) {
  const next = new Date(now);
  next.setDate(next.getDate() + days);
  next.setHours(9, 0, 0, 0);
  const y = next.getFullYear();
  const m = String(next.getMonth() + 1).padStart(2, '0');
  const d = String(next.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}T09:00`;
}

export const isUuid704 = value => /^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(String(value || '').trim());

// Build 705: ephemeral staff review checklist, not consent, booking or payment authority.
export const BOOKING_CONVERSION_CHECKS705 = Object.freeze([
  'scope','vehicle','capacity','site','terms'
]);
export function bookingConversionReadiness705(quote, checked = {}) {
  const basic = bookingReview704(quote);
  const missing = BOOKING_CONVERSION_CHECKS705.filter(key => checked[key] !== true);
  return {ready:basic.ready && missing.length === 0,missing,
    reason:basic.ready ? (missing.length ? 'Complete the manual readiness checks before opening the booking handoff.' :
      'Staff checklist completed in this browser only. Confirm the real booking separately; no appointment, message or payment was created.') : basic.message};
}
