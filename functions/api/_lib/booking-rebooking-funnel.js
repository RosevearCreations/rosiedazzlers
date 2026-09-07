// Build 361 — privacy-safe booking and rebooking funnel analytics helpers.
// Anonymous web sessions and exact customer_profile_id booking history remain separate evidence layers.
// This module derives aggregate metrics only; it never joins session identifiers to customer identity.

const DAY_MS = 86400000;
const REBOOK_EVENT_TYPES = new Set([
  'booking_rebook_prompt_view',
  'booking_rebook_start',
  'booking_rebook_prefill_applied',
  'booking_history_rebook_handoff'
]);

export const BOOKING_REBOOKING_FUNNEL_POLICY = Object.freeze({
  default_days: 90,
  min_days: 7,
  max_days: 365,
  analytics_row_limit: 5000,
  booking_row_limit: 5000
});

export function deriveBookingRebookingFunnel({ events = [], bookings = [], since = null, until = null } = {}) {
  const start = validDate(since) || new Date(Date.now() - BOOKING_REBOOKING_FUNNEL_POLICY.default_days * DAY_MS);
  const end = validDate(until) || new Date();
  const eventRows = safeRows(events).filter((row) => inWindow(row?.created_at, start, end));
  const bookingRows = safeRows(bookings).filter((row) => isUuid(row?.customer_profile_id));

  return {
    booking_funnel: deriveAnonymousBookingFunnel(eventRows),
    rebooking_intent: deriveAnonymousRebookingIntent(eventRows),
    repeat_booking_outcomes: deriveExactRepeatBookingOutcomes(bookingRows, start, end),
    evidence_boundary:{
      anonymous_session_layer:'site_activity_events',
      exact_customer_history_layer:'bookings.customer_profile_id',
      cross_layer_identity_join:false,
      customer_identity_exposed:false
    }
  };
}

export function deriveAnonymousBookingFunnel(events = []) {
  const sessions = sessionEventMap(events);
  const stageSets = new Map([
    ['step_1', new Set()],
    ['step_2', new Set()],
    ['step_3', new Set()],
    ['step_4', new Set()],
    ['step_5', new Set()],
    ['checkout_started', new Set()],
    ['checkout_completed', new Set()]
  ]);

  for (const [sessionId, rows] of sessions) {
    for (const row of rows) {
      const type = clean(row?.event_type, 80).toLowerCase();
      if (type === 'booking_step_view') {
        const step = Number(row?.payload?.step_number || 0);
        const key = `step_${step}`;
        if (stageSets.has(key)) stageSets.get(key).add(sessionId);
      }
      if (type === 'checkout_started' || clean(row?.checkout_state, 40).toLowerCase() === 'started') stageSets.get('checkout_started').add(sessionId);
      if (type === 'checkout_completed' || clean(row?.checkout_state, 40).toLowerCase() === 'completed') stageSets.get('checkout_completed').add(sessionId);
    }
  }

  const order = ['step_1','step_2','step_3','step_4','step_5','checkout_started','checkout_completed'];
  const startCount = stageSets.get('step_1').size;
  let previous = null;
  const stages = order.map((key) => {
    const sessionsCount = stageSets.get(key).size;
    const drop = previous === null ? null : Math.max(previous - sessionsCount, 0);
    const row = {
      key,
      label:stageLabel(key),
      sessions:sessionsCount,
      conversion_from_start_pct:pct(sessionsCount, startCount),
      drop_from_previous:drop,
      drop_from_previous_pct:previous === null ? null : pct(drop, previous)
    };
    previous = sessionsCount;
    return row;
  });

  const checkoutStarted = stageSets.get('checkout_started').size;
  const checkoutCompleted = stageSets.get('checkout_completed').size;
  return {
    sessions_observed:sessions.size,
    funnel_start_sessions:startCount,
    checkout_started_sessions:checkoutStarted,
    checkout_completed_sessions:checkoutCompleted,
    start_to_checkout_completion_pct:pct(checkoutCompleted, startCount),
    checkout_completion_pct:pct(checkoutCompleted, checkoutStarted),
    abandoned_after_checkout_start:Math.max(checkoutStarted - checkoutCompleted, 0),
    stages
  };
}

export function deriveAnonymousRebookingIntent(events = []) {
  const sessions = sessionEventMap(events);
  const prompt = new Set();
  const start = new Set();
  const verifiedHandoff = new Set();
  const checkoutStarted = new Set();
  const checkoutCompleted = new Set();

  for (const [sessionId, rows] of sessions) {
    let hasRebookIntent = false;
    for (const row of rows) {
      const type = clean(row?.event_type, 80).toLowerCase();
      if (type === 'booking_rebook_prompt_view') prompt.add(sessionId);
      if (type === 'booking_rebook_start') {
        start.add(sessionId);
        hasRebookIntent = true;
      }
      if (type === 'booking_rebook_prefill_applied' || type === 'booking_history_rebook_handoff') {
        verifiedHandoff.add(sessionId);
        hasRebookIntent = true;
      }
      if (hasRebookIntent && (type === 'checkout_started' || clean(row?.checkout_state, 40).toLowerCase() === 'started')) checkoutStarted.add(sessionId);
      if (hasRebookIntent && (type === 'checkout_completed' || clean(row?.checkout_state, 40).toLowerCase() === 'completed')) checkoutCompleted.add(sessionId);
    }
  }

  const intentSessions = new Set([...start, ...verifiedHandoff]);
  return {
    prompt_sessions:prompt.size,
    rebook_start_sessions:start.size,
    verified_handoff_sessions:verifiedHandoff.size,
    rebook_intent_sessions:intentSessions.size,
    rebook_checkout_started_sessions:checkoutStarted.size,
    rebook_checkout_completed_sessions:checkoutCompleted.size,
    prompt_to_start_pct:pct(start.size, prompt.size),
    intent_to_checkout_start_pct:pct(checkoutStarted.size, intentSessions.size),
    intent_to_checkout_completion_pct:pct(checkoutCompleted.size, intentSessions.size),
    note:'Anonymous session evidence measures rebooking intent only and is not joined to customer identity.'
  };
}

export function deriveExactRepeatBookingOutcomes(bookings = [], since, until) {
  const start = validDate(since) || new Date(0);
  const end = validDate(until) || new Date();
  const groups = new Map();
  for (const row of safeRows(bookings)) {
    const customerId = clean(row?.customer_profile_id, 80);
    if (!isUuid(customerId)) continue;
    if (!groups.has(customerId)) groups.set(customerId, []);
    groups.get(customerId).push(row);
  }

  let observedRepeatCustomers = 0;
  let repeatBookingCreationsInWindow = 0;
  let customersRebookedInWindow = 0;
  let completedRepeatServicesInWindow = 0;
  const repeatIntervals = [];
  const firstToSecondIntervals = [];

  for (const rows of groups.values()) {
    const ordered = rows.slice().sort((a, b) => bookingCreatedTime(a) - bookingCreatedTime(b));
    if (ordered.length > 1) observedRepeatCustomers += 1;
    let customerRebooked = false;
    for (let index = 1; index < ordered.length; index += 1) {
      const row = ordered[index];
      const created = validDate(row?.created_at);
      const previousCreated = validDate(ordered[index - 1]?.created_at);
      if (created && previousCreated && created >= previousCreated) {
        const days = Math.max(0, Math.round((created - previousCreated) / DAY_MS));
        if (index === 1) firstToSecondIntervals.push(days);
        if (inWindow(created, start, end)) repeatIntervals.push(days);
      }
      if (inWindow(created, start, end)) {
        repeatBookingCreationsInWindow += 1;
        customerRebooked = true;
      }
      const completed = validDate(row?.completed_at);
      if (isCompletedBooking(row) && inWindow(completed, start, end)) completedRepeatServicesInWindow += 1;
    }
    if (customerRebooked) customersRebookedInWindow += 1;
  }

  return {
    observed_linked_customers:groups.size,
    observed_repeat_customers:observedRepeatCustomers,
    observed_repeat_customer_pct:pct(observedRepeatCustomers, groups.size),
    repeat_booking_creations_in_window:repeatBookingCreationsInWindow,
    customers_rebooked_in_window:customersRebookedInWindow,
    completed_repeat_services_in_window:completedRepeatServicesInWindow,
    median_days_previous_to_repeat_booking:median(repeatIntervals),
    median_days_first_to_second_booking:median(firstToSecondIntervals),
    identity_rule:'exact_customer_profile_id_only',
    note:'A repeat booking is the second or later persisted booking for the same exact customer_profile_id in the bounded booking history scanned.'
  };
}

export function relevantBookingAnalyticsEvent(row) {
  const type = clean(row?.event_type, 80).toLowerCase();
  return type === 'booking_step_view' || type === 'checkout_started' || type === 'checkout_completed' || REBOOK_EVENT_TYPES.has(type) || ['started','completed'].includes(clean(row?.checkout_state, 40).toLowerCase());
}

function sessionEventMap(events) {
  const map = new Map();
  for (const row of safeRows(events).filter(relevantBookingAnalyticsEvent)) {
    const sessionId = clean(row?.session_id, 128);
    if (!sessionId) continue;
    if (!map.has(sessionId)) map.set(sessionId, []);
    map.get(sessionId).push(row);
  }
  for (const rows of map.values()) rows.sort((a, b) => timestamp(a?.created_at) - timestamp(b?.created_at));
  return map;
}

function stageLabel(key) {
  return ({ step_1:'Date + vehicle', step_2:'Package', step_3:'Add-ons', step_4:'Customer details', step_5:'Deposit / payment', checkout_started:'Checkout started', checkout_completed:'Checkout completed' })[key] || key;
}
function normalizedStatuses(row) { return [row?.status, row?.job_status].map((value) => clean(value, 60).toLowerCase()); }
function isCompletedBooking(row) { return Boolean(row?.completed_at) && normalizedStatuses(row).includes('completed'); }
function bookingCreatedTime(row) { return timestamp(row?.created_at) || timestamp(row?.service_date) || timestamp(row?.completed_at); }
function pct(numerator, denominator) { return denominator > 0 ? Math.round((numerator / denominator) * 1000) / 10 : null; }
function median(values) {
  const rows = safeRows(values).map(Number).filter(Number.isFinite).sort((a, b) => a - b);
  if (!rows.length) return null;
  const middle = Math.floor(rows.length / 2);
  return rows.length % 2 ? rows[middle] : Math.round(((rows[middle - 1] + rows[middle]) / 2) * 10) / 10;
}
function safeRows(value) { return Array.isArray(value) ? value : []; }
function clean(value, max = 500) { return String(value ?? '').trim().slice(0, max); }
function validDate(value) { const date = value instanceof Date ? value : new Date(value || ''); return Number.isNaN(date.getTime()) ? null : date; }
function timestamp(value) { const date = validDate(value); return date ? date.getTime() : 0; }
function inWindow(value, start, end) { const date = validDate(value); return Boolean(date && date.getTime() >= start.getTime() && date.getTime() <= end.getTime()); }
function isUuid(value) { return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(clean(value, 80)); }
